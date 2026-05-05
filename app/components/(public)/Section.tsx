"use client";

import { useDiscoverEvents } from "@/app/lib/hooks/useDiscoverEvents";
import { EventShelf } from "@/app/components/events/EventShelf";

export default function Eventos() {
  const { latest, upcoming, loading } = useDiscoverEvents();

  return (
    <section className="w-full py-14 flex flex-col gap-12">
      <EventShelf title="Últimos adicionados" events={latest} loading={loading} />
      <EventShelf title="Em breve" events={upcoming} loading={loading} />
    </section>
  );
}
