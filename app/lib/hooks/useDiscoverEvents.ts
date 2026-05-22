import { useEffect, useState } from "react";
import { getEvents } from "../services/database/eventService";
import { Evento } from "../types";

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
    setEstadoState(readStorage("filtro_estado"));
    setCidadeState(readStorage("filtro_cidade"));
    setCategoriaState(readStorage("filtro_categoria"));
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
    });
  }, [initialized, estado, cidade, categoria]);

  function setEstado(value: string) {
    setEstadoState(value);
    setCidadeState("");
    writeStorage("filtro_estado", value);
    writeStorage("filtro_cidade", "");
  }

  function setCidade(value: string) {
    setCidadeState(value);
    writeStorage("filtro_cidade", value);
  }

  function setCategoria(value: string) {
    setCategoriaState(value);
    writeStorage("filtro_categoria", value);
  }

  function clearFilter() {
    setEstadoState("");
    setCidadeState("");
    setCategoriaState("");
    writeStorage("filtro_estado", "");
    writeStorage("filtro_cidade", "");
    writeStorage("filtro_categoria", "");
  }

  const today = new Date().toISOString().split("T")[0];

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
