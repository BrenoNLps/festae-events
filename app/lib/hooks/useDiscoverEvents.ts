import { useEffect, useState } from "react";
import { getEvents } from "../services/database/eventService";
import { Evento } from "../types";

export function useDiscoverEvents() {
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

  return { latest, upcoming, loading };
}
