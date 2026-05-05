"use client";

import { useEffect, useState } from "react";
import { getEvents } from "@/app/lib/services/database/eventService";
import { Evento } from "@/app/lib/types";
import { EventShelf } from "@/app/components/events/EventShelf";

export default function Eventos() {
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents().then(({ data: events }) => {
      if (events) setEvents(events);
      setLoading(false);
    });
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const latest = [...events].sort((a, b) => b.id - a.id).slice(0, 10);

  const upcoming = [...events]
    .filter((e) => e.data_inicio >= today)
    .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio))
    .slice(0, 10);

  return (
    <section className="w-full py-14 flex flex-col gap-12">
      <EventShelf title="Últimos adicionados" events={latest} loading={loading} />
      <EventShelf title="Em breve" events={upcoming} loading={loading} />
    </section>
  );
}
