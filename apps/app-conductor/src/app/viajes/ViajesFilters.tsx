"use client";

import { Button as BaseButton } from "@ruum/ui/base";
export type OrdenTraslados = "recientes" | "mayor_ganancia" | "menor_distancia";

interface TrasladosFiltersProps {
  orden: OrdenTraslados;
  onCambiarOrden: (orden: OrdenTraslados) => void;
  ciudadFiltro: string;
  onCambiarCiudad: (ciudad: string) => void;
  ciudadesDisponibles: string[];
}

const ORDENES: Array<{ valor: OrdenTraslados; etiqueta: string }> = [
  { valor: "recientes", etiqueta: "Recientes" },
  { valor: "mayor_ganancia", etiqueta: "Mayor ganancia" },
  { valor: "menor_distancia", etiqueta: "Menor distancia" }
];

function IconOrden({ valor, className }: { valor: OrdenTraslados; className?: string }) {
  if (valor === "recientes")
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  if (valor === "mayor_ganancia")
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    );
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function TrasladosFilters({
  orden,
  onCambiarOrden,
  ciudadFiltro,
  onCambiarCiudad,
  ciudadesDisponibles
}: TrasladosFiltersProps) {
  return (
    <div className="mt-3 flex flex-col gap-2.5 select-none">
      {/* Orden — chips horizontales scrolleables, 1-tap */}
      <div className="flex items-center gap-2">
        <span className="font-body text-sm font-bold uppercase tracking-wider text-ui-fg-muted shrink-0">Orden:</span>
        <div className="flex flex-wrap gap-2 flex-1 py-1" role="group" aria-label="Ordenar ofertas">
          {ORDENES.map((o) => (
            <BaseButton variant="ghost"
              key={o.valor}
              type="button"
              onClick={() => onCambiarOrden(o.valor)}
              aria-pressed={orden === o.valor}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 font-body text-sm font-bold transition-all min-h-12 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand ${
                orden === o.valor ? "bg-ui-brand border-ui-brand text-ui-on-brand shadow-sm" : "bg-ui-muted border-ui-line/40 text-ui-fg-muted hover:border-ui-brand/30 hover:text-ui-fg"
              }`}
            >
              <IconOrden valor={o.valor} />
              {o.etiqueta}
            </BaseButton>
          ))}
        </div>
      </div>

      {/* Ciudad — chips (solo si hay >1) */}
      {ciudadesDisponibles.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="font-body text-sm font-bold uppercase tracking-wider text-ui-fg-muted shrink-0">Ciudad:</span>
          <div className="flex flex-wrap gap-2 flex-1 py-1" role="group" aria-label="Filtrar por ciudad">
            <BaseButton variant="ghost"
              type="button"
              onClick={() => onCambiarCiudad("todas")}
              aria-pressed={ciudadFiltro === "todas"}
              className={`rounded-full border px-3 py-2 font-body text-sm font-bold transition-all min-h-12 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand ${
                ciudadFiltro === "todas" ? "bg-ui-card border-ui-fg text-ui-fg" : "bg-ui-muted border-ui-line/40 text-ui-fg-muted hover:text-ui-fg"
              }`}
            >
              Todas
            </BaseButton>
            {ciudadesDisponibles.map((ciudad) => (
              <BaseButton variant="ghost"
                key={ciudad}
                type="button"
                onClick={() => onCambiarCiudad(ciudad)}
                aria-pressed={ciudadFiltro === ciudad}
                className={`rounded-full border px-3 py-2 font-body text-sm font-bold transition-all min-h-12 max-w-full break-words focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand ${
                  ciudadFiltro === ciudad ? "bg-ui-brand border-ui-brand text-ui-on-brand shadow-sm" : "bg-ui-muted border-ui-line/40 text-ui-fg-muted hover:border-ui-brand/30 hover:text-ui-fg"
                }`}
                title={ciudad}
              >
                {ciudad}
              </BaseButton>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
