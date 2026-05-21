"use client";

import { useDiscoverEvents } from "@/app/lib/hooks/useDiscoverEvents";
import { EventShelf } from "@/app/components/events/EventShelf";
import { CityFilter } from "@/app/components/events/CityFilter";

export default function Eventos() {
  const {
    latest, ongoing, upcoming, finished, loading,
    estado, cidade, setEstado, setCidade, clearFilter,
  } = useDiscoverEvents();

  return (
    <section className="w-full py-14 flex flex-col gap-12">
      <CityFilter
        estado={estado}
        cidade={cidade}
        setEstado={setEstado}
        setCidade={setCidade}
        clearFilter={clearFilter}
      />
      <EventShelf title="Em andamento" events={ongoing} loading={loading} />
      <EventShelf title="Em breve" events={upcoming} loading={loading} />
      <EventShelf title="Últimos adicionados" events={latest} loading={loading} />
      <EventShelf title="Finalizados" events={finished} loading={loading} />
    </section>
  );
}
