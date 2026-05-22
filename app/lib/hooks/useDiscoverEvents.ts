import { useEffect, useState } from "react";
import { getEvents } from "../services/database/eventService";
import { Evento } from "../types";
import { getTodayAsString } from "../utils/date";
import { STORAGE_KEYS } from "../storageKeys";

function readStorage(key: string) {
  try { return localStorage.getItem(key) ?? ""; } catch { return ""; }
}

function writeStorage(key: string, value: string) {
  try { value ? localStorage.setItem(key, value) : localStorage.removeItem(key); } catch {}
}

export function useDiscoverEvents() {
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [estado, setEstadoState] = useState("");
  const [cidade, setCidadeState] = useState("");
  const [categoria, setCategoriaState] = useState("");

  useEffect(() => {
    setEstadoState(readStorage(STORAGE_KEYS.filtroEstado));
    setCidadeState(readStorage(STORAGE_KEYS.filtroCidade));
    setCategoriaState(readStorage(STORAGE_KEYS.filtroCategoria));
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    setLoading(true);
    getEvents(
      estado || cidade || categoria
        ? { estado: estado || undefined, cidade: cidade || undefined, categoria: categoria || undefined }
        : undefined
    ).then(({ data }) => {
      if (data) setEvents(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [initialized, estado, cidade, categoria]);

  function setEstado(value: string) {
    setEstadoState(value);
    setCidadeState("");
    writeStorage(STORAGE_KEYS.filtroEstado, value);
    writeStorage(STORAGE_KEYS.filtroCidade, "");
  }

  function setCidade(value: string) {
    setCidadeState(value);
    writeStorage(STORAGE_KEYS.filtroCidade, value);
  }

  function setCategoria(value: string) {
    setCategoriaState(value);
    writeStorage(STORAGE_KEYS.filtroCategoria, value);
  }

  function clearFilter() {
    setEstadoState("");
    setCidadeState("");
    setCategoriaState("");
    writeStorage(STORAGE_KEYS.filtroEstado, "");
    writeStorage(STORAGE_KEYS.filtroCidade, "");
    writeStorage(STORAGE_KEYS.filtroCategoria, "");
  }

  const today = getTodayAsString();

  const latest = [...events].sort((a, b) => b.id - a.id).slice(0, 10);

  const ongoing = [...events]
    .filter((e) => e.data_inicio <= today && e.data_fim >= today)
    .sort((a, b) => a.data_fim.localeCompare(b.data_fim))
    .slice(0, 10);

  const upcoming = [...events]
    .filter((e) => e.data_inicio > today)
    .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio))
    .slice(0, 10);

  const finished = [...events]
    .filter((e) => e.data_fim < today)
    .sort((a, b) => b.data_fim.localeCompare(a.data_fim))
    .slice(0, 10);

  return {
    latest, ongoing, upcoming, finished, loading,
    estado, cidade, setEstado, setCidade, clearFilter,
    categoria, setCategoria,
  };
}
