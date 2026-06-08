"use client";

import { useCallback } from "react";
import { useDiscoverEvents } from "@/app/lib/hooks/useDiscoverEvents";
import { useSearch } from "@/app/lib/hooks/useSearch";
import { searchEvents } from "@/app/lib/services/database/eventService";
import { EventShelf } from "@/app/components/events/EventShelf";
import { CityFilter } from "@/app/components/events/CityFilter";
import { SearchInput } from "@/app/components/(protected)/SearchInput";
import { EventCard } from "@/app/components/events/EventCard";

export default function Eventos() {
  const {
    latest, ongoing, upcoming, finished, loading,
    estado, cidade, setEstado, setCidade, clearFilter,
    categoria, setCategoria,
  } = useDiscoverEvents();

  const searchFn = useCallback((q: string) => searchEvents(q, { estado: estado || undefined, cidade: cidade || undefined }), [estado, cidade]);
  const { query, setQuery, results, loading: searching } = useSearch(searchFn);
  const showSearch = query.trim().length > 0;

  return (
    <section className="w-full py-14 flex flex-col gap-12">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Buscar evento, cidade, artista..."
            loading={searching}
            className="flex-1"
          />
          <button className="bg-purple-600 text-white font-bold text-sm px-4 py-2 rounded-full hover:bg-purple-700 transition shrink-0">
            Buscar
          </button>
        </div>
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
          {[
            { title: "Em andamento",        events: ongoing,  loading },
            { title: "Em breve",            events: upcoming, loading },
            { title: "Últimos adicionados", events: latest,   loading },
            { title: "Finalizados",         events: finished, loading },
          ]
            .sort((a, b) => {
              const aVazio = !a.loading && a.events.length === 0;
              const bVazio = !b.loading && b.events.length === 0;
              return Number(aVazio) - Number(bVazio);
            })
            .map((shelf) => (
              <EventShelf key={shelf.title} title={shelf.title} events={shelf.events} loading={shelf.loading} />
            ))}
        </>
      )}
    </section>
  );
}
