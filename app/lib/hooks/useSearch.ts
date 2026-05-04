import { useEffect, useRef, useState } from "react";

export function useSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  debounceMs = 300,
) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const fnRef = useRef(searchFn);
  fnRef.current = searchFn;

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const data = await fnRef.current(query.trim());
      setResults(data);
      setLoading(false);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return { query, setQuery, results, loading };
}
