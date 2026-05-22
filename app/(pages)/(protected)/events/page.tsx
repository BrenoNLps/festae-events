"use client";

import { useCallback } from "react";
import { useDiscoverEvents } from "@/app/lib/hooks/useDiscoverEvents";
import { useFriendsEvents } from "@/app/lib/hooks/useFriendsEvents";
import { useCurrentUser } from "@/app/lib/hooks/useCurrentUser";
import { useSearch } from "@/app/lib/hooks/useSearch";
import { searchEvents } from "@/app/lib/services/database/eventService";
import { EventShelf } from "@/app/components/events/EventShelf";
import { CityFilter } from "@/app/components/events/CityFilter";
import { SearchInput } from "@/app/components/(protected)/SearchInput";
import { EventCard } from "@/app/components/events/EventCard";

export default function Events() {
  const { user } = useCurrentUser();
  const { events: friendsEvents, loading: friendsLoading } = useFriendsEvents(user?.id ?? null);
  const {
    latest, ongoing, upcoming, finished, loading,
    estado, cidade, setEstado, setCidade, clearFilter,
    categoria, setCategoria,
  } = useDiscoverEvents();

  const searchFn = useCallback((q: string) => searchEvents(q, { estado: estado || undefined, cidade: cidade || undefined, categoria: categoria || undefined }), [estado, cidade, categoria]);
  const { query, setQuery, results, loading: searching } = useSearch(searchFn);
  const showSearch = query.trim().length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Descobrir</h1>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar evento..."
          loading={searching}
        />
        {!showSearch && (
          <CityFilter
            estado={estado}
            cidade={cidade}
            categoria={categoria}
            setEstado={setEstado}
            setCidade={setCidade}
            setCategoria={setCategoria}
            clearFilter={clearFilter}
          />
        )}
      </div>

      {showSearch ? (
        <div>
          {!searching && results.length === 0 && (
            <p className="text-sm text-gray-400 py-4">Nenhum evento encontrado para &quot;{query}&quot;</p>
          )}
          <div className="flex flex-wrap gap-4">
            {results.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <EventShelf title="Eventos de amigos" events={friendsEvents} loading={friendsLoading} />
          <EventShelf title="Em andamento" events={ongoing} loading={loading} />
          <EventShelf title="Em breve" events={upcoming} loading={loading} />
          <EventShelf title="Últimos adicionados" events={latest} loading={loading} />
          <EventShelf title="Finalizados" events={finished} loading={loading} />
        </>
      )}
    </div>
  );
}
