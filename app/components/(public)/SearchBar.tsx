"use client";

import { useCallback, useRef } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/app/lib/hooks/useSearch";
import { searchEvents } from "@/app/lib/services/database/eventService";
import { EventCard } from "@/app/components/events/EventCard";

export default function SearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const searchFn = useCallback((q: string) => searchEvents(q), []);
  const { query, setQuery, results, loading } = useSearch(searchFn);
  const showResults = query.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    inputRef.current?.blur();
  }

  return (
    <div className="w-full py-14">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-3 shadow-sm">
        <Search className="h-5 w-5 text-gray-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar evento, cidade, artista..."
          className="flex-1 outline-none text-gray-700 bg-transparent text-sm"
        />
        <button
          type="submit"
          className="bg-purple-600 text-white font-bold text-sm px-4 py-2 rounded-full hover:bg-purple-700 transition"
        >
          Buscar
        </button>
      </form>

      {showResults && (
        <div className="mt-6">
          {!loading && results.length === 0 && (
            <p className="text-sm text-gray-400 py-4">Nenhum evento encontrado para &quot;{query}&quot;</p>
          )}
          <div className="flex flex-wrap gap-4">
            {results.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
