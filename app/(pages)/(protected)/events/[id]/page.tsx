"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, MapPin, Users } from "lucide-react";
import { EventImage } from "@/app/components/events/EventImage";
import { getEventById } from "@/app/lib/services/database/eventService";
import { useCurrentUser } from "@/app/lib/hooks/useCurrentUser";
import { useEventRegistration } from "@/app/lib/hooks/useEventRegistration";
import { formatDateRange } from "@/app/lib/utils/date";
import { formatPrice, formatLocation } from "@/app/lib/utils/event";
import { Evento } from "@/app/lib/types";
import { FriendsAtEvent } from "@/app/components/events/FriendsAtEvent";

function RegistrationAction({
  isOrganizer,
  checking,
  isRegistered,
  registering,
  isPaid,
  purchasing,
  isFull,
  canCancel,
  cancelBlockReason,
  onRegister,
  onUnregister,
  onPurchase,
}: {
  isOrganizer: boolean;
  checking: boolean;
  isRegistered: boolean;
  registering: boolean;
  isPaid: boolean;
  purchasing: boolean;
  isFull: boolean;
  canCancel: boolean;
  cancelBlockReason: string;
  onRegister: () => void;
  onUnregister: () => void;
  onPurchase: () => void;
}) {
  if (isOrganizer)
    return <p className="text-center text-sm text-gray-400 py-2">Você é o organizador deste evento</p>;
  if (checking)
    return <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />;
  if (isRegistered)
    return (
      <>
        {cancelBlockReason === "Evento já encerrado" ? (
          <p className="text-center text-sm text-gray-400 py-2">Evento encerrado</p>
        ) : (
          <>
            <p className="text-center text-sm text-green-600 font-medium">Você está inscrito</p>
            {canCancel ? (
              <button
                onClick={onUnregister}
                disabled={registering}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-60"
              >
                {registering ? "Cancelando..." : "Cancelar inscrição"}
              </button>
            ) : (
              <p className="text-center text-sm text-gray-400">{cancelBlockReason}</p>
            )}
          </>
        )}
      </>
    );
  if (isFull)
    return <p className="text-center text-sm text-gray-400 py-2">Evento lotado</p>;
  if (isPaid)
    return (
      <button
        onClick={onPurchase}
        disabled={purchasing}
        className="w-full py-3 rounded-xl text-sm font-semibold bg-indigo-900 text-white hover:bg-indigo-800 transition disabled:opacity-60"
      >
        {purchasing ? "Redirecionando..." : "Comprar ingresso"}
      </button>
    );
  return (
    <button
      onClick={onRegister}
      disabled={registering}
      className="w-full py-3 rounded-xl text-sm font-semibold bg-indigo-900 text-white hover:bg-indigo-800 transition disabled:opacity-60"
    >
      {registering ? "Inscrevendo..." : "Participar"}
    </button>
  );
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useCurrentUser();

  const [event, setEvent] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const { isRegistered, checking, loading: registering, register, unregister, isFull, registrationCount } =
    useEventRegistration(user?.id ?? null, event?.id ?? null, event?.vagas ?? undefined);

  async function handlePurchase() {
    if (!event) return;
    setPurchasing(true);
    try {
      const res = await fetch('/api/pagamento/criar-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventoId: event.id,
          eventoNome: event.nome,
          valor: event.valor,
        }),
      });
      const { init_point, error } = await res.json();
      if (error || !init_point) throw new Error(error ?? 'Erro ao criar preferência');
      window.location.href = init_point;
    } catch (err) {
      console.error('[Pagamento] Erro:', err);
      setPurchasing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    getEventById(Number(id)).then(({ data }) => {
      if (!cancelled) {
        setEvent(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col gap-4">
        <div className="h-72 bg-gray-100 rounded-2xl" />
        <div className="flex gap-6 mt-2">
          <div className="flex-1 flex flex-col gap-3">
            <div className="h-7 bg-gray-100 rounded w-2/3" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-4/5" />
          </div>
          <div className="w-64 h-40 bg-gray-100 rounded-2xl flex-shrink-0" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center text-gray-400 py-20">
        Evento não encontrado.
      </div>
    );
  }

  const price = formatPrice(event.valor);
  const location = formatLocation(event.endereco);
  const dateLabel = formatDateRange(event.data_inicio, event.data_fim);
  const isOrganizer = user?.id === event.id_organizador;

  const now = new Date();
  const startDateTime = new Date(`${event.data_inicio}T${event.hora_inicio}`);
  const endDateTime = new Date(`${event.data_fim}T${event.hora_fim}`);
  const hoursUntilStart = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const hasEnded = now > endDateTime;
  const isOngoing = now >= startDateTime && now <= endDateTime;
  const lessThan24h = hoursUntilStart > 0 && hoursUntilStart < 24;
  const canCancel = !hasEnded && !isOngoing && !lessThan24h;
  const cancelBlockReason = hasEnded
    ? "Evento já encerrado"
    : isOngoing
    ? "Evento em andamento"
    : "Menos de 24h para o início";

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => {
          const ref = document.referrer;
          const isInternal = ref && new URL(ref).origin === window.location.origin && !ref.includes('/login');
          isInternal ? router.back() : router.push('/events');
        }}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      {/* Hero */}
      <div className="relative w-full h-72 rounded-2xl bg-purple-100 overflow-hidden">
        <EventImage src={event.imagem_url} alt={event.nome} iconSize="h-16 w-16" />
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{event.nome}</h1>
          {user && (
            <FriendsAtEvent userId={user.id} eventoId={event.id} organizerId={event.id_organizador} />
          )}
        </div>

        {event.descricao && (
          <p className="text-sm text-gray-600 leading-relaxed">{event.descricao}</p>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <span className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-purple-400 flex-shrink-0" />
            {dateLabel}
          </span>
          <span className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-purple-400 flex-shrink-0" />
            {event.hora_inicio} – {event.hora_fim}
          </span>
          {location && (
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-purple-400 flex-shrink-0" />
              {location}
            </span>
          )}
          <span className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4 text-purple-400 flex-shrink-0" />
            {checking ? (
              <span className="w-24 h-4 bg-gray-100 rounded animate-pulse inline-block" />
            ) : isFull ? (
              <span className="text-red-500 font-medium">{event.vagas}/{event.vagas} · Lotado</span>
            ) : (
              (() => {
                const available = event.vagas - registrationCount;
                return `${registrationCount}/${event.vagas} · ${available} ${available === 1 ? "vaga disponível" : "vagas disponíveis"}`;
              })()
            )}
          </span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Valor</span>
            <span
              className={`text-sm font-semibold px-3 py-1 rounded-full ${
                price === "Gratuito"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {price}
            </span>
          </div>

          <hr className="border-gray-100" />

          <RegistrationAction
            isOrganizer={isOrganizer}
            checking={checking}
            isRegistered={isRegistered}
            registering={registering}
            isPaid={event.valor > 0}
            purchasing={purchasing}
            isFull={isFull}
            canCancel={canCancel}
            cancelBlockReason={cancelBlockReason}
            onRegister={register}
            onUnregister={unregister}
            onPurchase={handlePurchase}
          />
        </div>
      </div>
    </div>
  );
}
