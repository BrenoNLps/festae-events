"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ESTADOS_BRASIL } from "@/app/lib/utils/brasil";
import { EventCategory, EVENT_CATEGORY_LABELS } from "@/app/lib/types";

interface CityFilterProps {
  estado: string;
  cidade: string;
  categoria: string;
  setEstado: (v: string) => void;
  setCidade: (v: string) => void;
  setCategoria: (v: string) => void;
  clearFilter: () => void;
}

export function CityFilter({ estado, cidade, categoria, setEstado, setCidade, setCategoria, clearFilter }: CityFilterProps) {
  const [cidades, setCidades] = useState<string[]>([]);

  useEffect(() => {
    if (!estado) { setCidades([]); return; }
    const controller = new AbortController();
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => setCidades(data.map((m: { nome: string }) => m.nome).sort()))
      .catch(() => setCidades([]));
    return () => controller.abort();
  }, [estado]);

  const hasFilter = estado || cidade || categoria;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <option value="">Categoria</option>
        {Object.values(EventCategory).map((cat) => (
          <option key={cat} value={cat}>{EVENT_CATEGORY_LABELS[cat]}</option>
        ))}
      </select>

      <select
        value={estado}
        onChange={(e) => setEstado(e.target.value)}
        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <option value="">Estado</option>
        {ESTADOS_BRASIL.map((e) => (
          <option key={e.sigla} value={e.sigla}>{e.nome}</option>
        ))}
      </select>

      <select
        value={cidade}
        onChange={(e) => setCidade(e.target.value)}
        disabled={!estado}
        className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <option value="">Cidade</option>
        {cidades.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      {hasFilter && (
        <button
          onClick={clearFilter}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition"
        >
          <X className="h-4 w-4" />
          Limpar
        </button>
      )}
    </div>
  );
}
