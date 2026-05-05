"use client";

import { useDiscoverEvents } from "@/app/lib/hooks/useDiscoverEvents";
import { EventShelf } from "@/app/components/events/EventShelf";

export default function Events() {
  const { latest, upcoming, loading } = useDiscoverEvents();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-10">
      <h1 className="text-2xl font-bold text-gray-900">Descobrir</h1>
      <EventShelf title="Últimos adicionados" events={latest} loading={loading} />
      <EventShelf title="Em breve" events={upcoming} loading={loading} />
    </div>
  );
}
