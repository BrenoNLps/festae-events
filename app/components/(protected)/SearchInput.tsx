"use client";

import { Loader2, Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  loading,
  className = "",
}: SearchInputProps) {
  return (
    <div
      className={`flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-3 shadow-sm ${className}`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 text-purple-500 animate-spin shrink-0" />
      ) : (
        <Search className="h-5 w-5 text-gray-400 shrink-0" />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
