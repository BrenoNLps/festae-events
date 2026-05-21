"use client";

import { useDiscoverEvents } from "@/app/lib/hooks/useDiscoverEvents";
import { EventShelf } from "@/app/components/events/EventShelf";
import { CityFilter } from "@/app/components/events/CityFilter";

export default function Events() {
  const {
    latest, ongoing, upcoming, finished, loading,
    estado, cidade, setEstado, setCidade, clearFilter,
  } = useDiscoverEvents();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Descobrir</h1>
        <CityFilter
          estado={estado}
          cidade={cidade}
          setEstado={setEstado}
          setCidade={setCidade}
          clearFilter={clearFilter}
        />
      </div>
      <EventShelf title="Em andamento" events={ongoing} loading={loading} />
      <EventShelf title="Em breve" events={upcoming} loading={loading} />
      <EventShelf title="Últimos adicionados" events={latest} loading={loading} />
      <EventShelf title="Finalizados" events={finished} loading={loading} />
    </div>
  );
}
