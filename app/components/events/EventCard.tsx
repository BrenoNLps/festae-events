"use client";

import Link from "next/link";
import { Calendar, MapPin, Share2 } from "lucide-react";
import { useState } from "react";
import { Evento, EVENT_CATEGORY_LABELS } from "@/app/lib/types";
import { formatDateRange } from "@/app/lib/utils/date";
import { formatPrice, formatLocation } from "@/app/lib/utils/event";
import { EventImage } from "./EventImage";
import { useCurrentUser } from "@/app/lib/hooks/useCurrentUser";
import { ROUTES } from "@/app/lib/routes";
import { ShareEventModal } from "./ShareEventModal";

export function EventCard({ event }: { event: Evento }) {
  const { user, loading } = useCurrentUser();
  const [showShare, setShowShare] = useState(false);
  const dateLabel = formatDateRange(event.data_inicio, event.data_fim);
  const location = formatLocation(event.endereco);
  const price = formatPrice(event.valor);
  const href =
    !loading && !user
      ? `${ROUTES.login}?callbackUrl=${ROUTES.eventDetail(event.id)}`
      : ROUTES.eventDetail(event.id);

  return (
    <>
      <div className="shrink-0 w-64 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow relative group">
        <Link href={href} className="block">
          <div className="relative h-36 bg-purple-100">
            <EventImage src={event.imagem_url} alt={event.nome} iconSize="h-10 w-10" />
            <span
              className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full ${
                price === "Gratuito"
                  ? "bg-green-100 text-green-700"
                  : "bg-white text-gray-700"
              }`}
            >
              {price}
            </span>
          </div>

          <div className="p-3 flex flex-col gap-1.5">
            <p className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">
              {event.nome}
            </p>

            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{dateLabel}</span>
            </div>

            {location && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            )}

            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs text-gray-400">{event.vagas} vagas</span>
              {event.categoria && (
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  {EVENT_CATEGORY_LABELS[event.categoria]}
                </span>
              )}
            </div>
          </div>
        </Link>

        {user && (
          <button
            onClick={() => setShowShare(true)}
            title="Enviar para amigo"
            className="absolute top-2 left-2 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 text-gray-500 hover:text-purple-600 hover:bg-white transition opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showShare && (
        <ShareEventModal evento={event} onClose={() => setShowShare(false)} />
      )}
    </>
  );
}
