"use client";

import { Input as BaseInput, Button as BaseButton } from "@ruum/ui/base";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Componente de búsqueda para la página de Traslados
 * Recomendación AI-002: Búsqueda en Traslados históricos
 */

interface TrasladosSearchProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function TrasladosSearch({ onSearch, placeholder = "Buscar traslados…" }: TrasladosSearchProps) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar con URL
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    setQuery(urlQuery ?? "");
  }, [searchParams]);

  const handleSearch = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      
      const params = new URLSearchParams(searchParams.toString());
      if (newQuery.trim()) {
        params.set("q", newQuery.trim());
      } else {
        params.delete("q");
      }
      
      const queryString = params.toString();
      window.history.replaceState(null, "", queryString ? `/viajes?${queryString}` : "/viajes");
      
      onSearch?.(newQuery);
    },
    [searchParams, onSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    const queryString = params.toString();
    window.history.replaceState(null, "", queryString ? `/viajes?${queryString}` : "/viajes");
    inputRef.current?.focus();
    onSearch?.("");
  }, [searchParams, onSearch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        handleClear();
      }
    },
    [handleClear]
  );

  return (
    <div className="relative w-full">
      <div className="relative">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ui-fg-muted pointer-events-none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        
        <BaseInput
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-11 pr-11 py-3 rounded-xl bg-ui-card border border-ui-line/40 text-ui-fg placeholder:text-ui-fg-muted font-body text-sm focus:outline-none focus:ring-2 focus:ring-ui-brand/20 focus:border-ui-brand/40 transition-colors"
          aria-label="Buscar traslados por origen, destino o folio"
          enterKeyHint="search"
        />
        
        {query && (
          <BaseButton variant="ghost"
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-ui-fg-muted hover:text-ui-fg hover:bg-ui-muted transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </BaseButton>
        )}
      </div>
      
      {/* Indicador de resultados - aparece cuando hay query */}
      {query && isFocused && (
        <div className="mt-1 flex items-center gap-2 px-1">
          <span className="flex size-2 rounded-full bg-ui-brand animate-pulse" aria-hidden />
          <span className="font-body text-xs text-ui-fg-muted">
            Buscando en {searchParams.get("vista") === "mis-Traslados" ? "historial" : "ofertas"}...
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Filtro de Traslados basado en query de búsqueda
 * @param viaje Datos del viaje
 * @param query Término de búsqueda
 * @returns true si el viaje coincide con la búsqueda
 */
export function filterTrasladosBySearch(viaje: {
  traslado_id?: string | null;
  origen_ciudad?: string | null;
  origen_direccion?: string | null;
  destino_ciudad?: string | null;
  destino_direccion?: string | null;
  folio?: string | null;
}, query: string): boolean {
  if (!query.trim()) return true;
  
  const searchLower = query.toLowerCase();
  const searchTerms = searchLower.split(/\s+/).filter(Boolean);
  
  const searchableText = [
    viaje.traslado_id ?? "",
    viaje.folio ?? "",
    viaje.origen_ciudad ?? "",
    viaje.origen_direccion ?? "",
    viaje.destino_ciudad ?? "",
    viaje.destino_direccion ?? "",
  ].join(" ").toLowerCase();
  
  return searchTerms.every((term) => 
    searchableText.includes(term)
  );
}
