"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, Ticket, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useCurrentUser } from "@/app/lib/hooks/useCurrentUser";
import { getEventsByOrganizer } from "@/app/lib/services/database/eventService";
import { getRegistrationsByUser } from "@/app/lib/services/database/registrationService";
import { Evento } from "@/app/lib/types";
import { EventDetailCard } from "@/app/components/events/EventDetailCard";
import { formatDateRange, formatDay } from "@/app/lib/utils/date";
import { formatLocation } from "@/app/lib/utils/event";
import { ROUTES } from "@/app/lib/routes";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const DAYS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

type Tab = "agenda" | "criados" | "inscricoes";

export default function Agenda() {
  const { user } = useCurrentUser();
  const [tab, setTab] = useState<Tab>("agenda");
  const [myEvents, setMyEvents] = useState<Evento[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    getEventsByOrganizer(user.id).then(({ data: events }) => {
      if (events) setMyEvents(events);
      setLoading(false);
    });
    getRegistrationsByUser(user.id).then(({ data }) => {
      if (data) setRegisteredEvents(data.map((r: { evento: Evento }) => r.evento));
      setRegistrationsLoading(false);
    });
  }, [user?.id]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      <div className="flex border-b border-gray-200 mb-6">
        {(["agenda", "inscricoes", "criados"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
              tab === t
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "agenda" ? "Agenda" : t === "criados" ? "Criados" : "Inscrições"}
          </button>
        ))}
      </div>

      {tab === "agenda" && (
        <AgendaTab
          createdEvents={myEvents}
          registeredEvents={registeredEvents}
          loading={loading || registrationsLoading}
        />
      )}
      {tab === "inscricoes" && <EventListTab events={registeredEvents} loading={registrationsLoading} empty="Você ainda não está inscrito em nenhum evento." />}
      {tab === "criados" && <EventListTab events={myEvents} loading={loading} empty="Você ainda não criou nenhum evento." />}
    </div>
  );
}

function AgendaTab({ createdEvents, registeredEvents, loading }: { createdEvents: Evento[]; registeredEvents: Evento[]; loading: boolean }) {
  const events = [...createdEvents, ...registeredEvents].filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i);
  const today = new Date().toISOString().split("T")[0];
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startPad = firstDay.getDay() - 1;
    if (startPad < 0) startPad = 6;

    const days: (string | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(
        `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      );
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentMonth]);

  const createdDays = useMemo(() => {
    const set = new Set<string>();
    for (const event of createdEvents) {
      const cur = new Date(event.data_inicio);
      const end = new Date(event.data_fim);
      while (cur <= end) {
        set.add(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return set;
  }, [createdEvents]);

  const registeredDays = useMemo(() => {
    const set = new Set<string>();
    for (const event of registeredEvents) {
      const cur = new Date(event.data_inicio);
      const end = new Date(event.data_fim);
      while (cur <= end) {
        set.add(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return set;
  }, [registeredEvents]);


  const visibleCreated = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const monthStr = `${year}-${month}`;
    return createdEvents
      .filter((e) =>
        e.data_fim >= today &&
        (selectedDay
          ? e.data_inicio <= selectedDay && e.data_fim >= selectedDay
          : e.data_inicio.startsWith(monthStr) || e.data_fim.startsWith(monthStr))
      )
      .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
  }, [createdEvents, currentMonth, selectedDay, today]);

  const visibleRegistered = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    const monthStr = `${year}-${month}`;
    return registeredEvents
      .filter((e) =>
        e.data_fim >= today &&
        (selectedDay
          ? e.data_inicio <= selectedDay && e.data_fim >= selectedDay
          : e.data_inicio.startsWith(monthStr) || e.data_fim.startsWith(monthStr))
      )
      .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
  }, [registeredEvents, currentMonth, selectedDay, today]);

  function prevMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDay(null);
  }

  function nextMonth() {
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDay(null);
  }

  function goToToday() {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(today);
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-900">
              {MONTHS_PT[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={goToToday}
              className="text-xs font-semibold text-purple-600 border border-purple-300 hover:bg-purple-50 px-2.5 py-1 rounded-full transition"
            >
              Hoje
            </button>
          </div>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DAYS_PT.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={i} />;
            const isToday = day === today;
            const isSelected = day === selectedDay;
            const hasCreated = createdDays.has(day);
            const hasRegistered = registeredDays.has(day);
            const dayNum = day.split("-")[2].replace(/^0/, "");

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                className={`relative flex flex-col items-center justify-center h-9 rounded-lg text-sm transition
                  ${isSelected
                    ? "bg-purple-600 text-white"
                    : isToday
                    ? "bg-purple-50 text-purple-700 font-semibold"
                    : "hover:bg-gray-50 text-gray-700"
                  }`}
              >
                {dayNum}
                {(hasCreated || hasRegistered) && (
                  <span className="absolute bottom-1 flex gap-0.5">
                    {hasCreated && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-purple-400"}`} />
                    )}
                    {hasRegistered && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-green-400"}`} />
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <h2 className="text-sm font-semibold text-gray-600 mb-3">
        {selectedDay
          ? `Eventos em ${formatDay(selectedDay)}`
          : `Eventos em ${MONTHS_PT[currentMonth.getMonth()]}`}
      </h2>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Inscrições</span>
            </div>
            {visibleRegistered.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">Sem inscrições ativas{selectedDay ? " neste dia" : " neste mês"}.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {visibleRegistered.map((e) => (
                  <AgendaListItem key={e.id} event={e} type="registered" />
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Criados</span>
            </div>
            {visibleCreated.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">Sem eventos criados{selectedDay ? " neste dia" : " neste mês"}.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {visibleCreated.map((e) => (
                  <AgendaListItem key={e.id} event={e} type="created" />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function AgendaListItem({ event, type }: { event: Evento; type: "created" | "registered" }) {
  const location = formatLocation(event.endereco);
  const iconStyle = type === "created"
    ? "bg-purple-100 text-purple-400"
    : "bg-green-100 text-green-400";

  return (
    <Link href={ROUTES.eventDetail(event.id)} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${iconStyle}`}>
        <Ticket className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 truncate">{event.nome}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {formatDateRange(event.data_inicio, event.data_fim)}
          </span>
          {location && (
            <span className="flex items-center gap-1 text-xs text-gray-500 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {location}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function EventListTab({
  events,
  loading,
  empty,
}: {
  events: Evento[];
  loading: boolean;
  empty: string;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <CalendarDays className="h-10 w-10 text-gray-200" />
        <p className="text-sm text-gray-400">{empty}</p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const active = events.filter((e) => e.data_fim >= today).sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
  const ended = events.filter((e) => e.data_fim < today).sort((a, b) => b.data_fim.localeCompare(a.data_fim));

  if (active.length === 0 && ended.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <CalendarDays className="h-10 w-10 text-gray-200" />
        <p className="text-sm text-gray-400">{empty}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {active.map((e) => (
        <EventDetailCard key={e.id} event={e} />
      ))}
      {ended.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-2">Finalizados</p>
          {ended.map((e) => (
            <div key={e.id} className="opacity-50 grayscale">
              <EventDetailCard event={e} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
