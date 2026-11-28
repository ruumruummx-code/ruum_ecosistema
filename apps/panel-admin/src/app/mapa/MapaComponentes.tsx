"use client";

import {
  type CategoriaPrioridadMapa,
  type SimboloMapa,
  ETIQUETA_PRIORIDAD_MAPA,
  DESCRIPCION_PRIORIDAD_MAPA,
  claseTarjetaPrioridadMapa
} from "./MapaTipos";

function SimboloPrioridad({ categoria }: { categoria: CategoriaPrioridadMapa }) {
  const clase = categoria === "emergencia" || categoria === "incidencia_critica"
    ? "border-ui-danger text-ui-danger"
    : categoria === "normal"
      ? "border-ui-success text-ui-success"
      : "border-ui-warning text-ui-warning";
  return <span aria-hidden="true" className={`grid size-8 shrink-0 place-items-center rounded-full border-2 ${clase}`}><span className="size-2 rounded-full bg-current" /></span>;
}

export function SimboloLeyenda({ simbolo }: { simbolo: SimboloMapa }) {
  if (simbolo === "ruta_real") {
    return <span aria-hidden="true" className="block h-0.5 w-6 rounded-full bg-ui-brand" />;
  }
  if (simbolo === "ruta_aproximada") {
    return <span aria-hidden="true" className="block h-0.5 w-6 border-t-2 border-dashed border-ui-warning" />;
  }
  if (simbolo === "origen") {
    return <span aria-hidden="true" className="size-4 rounded-full border-2 border-ui-fg bg-ui-success" />;
  }
  if (simbolo === "destino") {
    return (
      <span aria-hidden="true" className="grid size-5 place-items-center text-ui-brand">
        <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
          <path d="M7 21V4h9l-1.4 3L16 10H7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (simbolo === "vehiculo") {
    return (
      <span aria-hidden="true" className="grid size-5 place-items-center rounded-full border-2 border-ui-success text-ui-success">
        <svg viewBox="0 0 24 24" width="15" height="15" focusable="false">
          <path d="M5 12l7-7 7 7h-4v7H9v-7H5z" fill="currentColor" />
        </svg>
      </span>
    );
  }
  if (simbolo === "incidencia") {
    return <span aria-hidden="true" className="h-0 w-0 border-x-[9px] border-b-[16px] border-x-transparent border-b-ui-danger" />;
  }
  if (simbolo === "emergencia") {
    return <span aria-hidden="true" className="grid size-5 place-items-center rounded-full border-2 border-ui-danger font-mono-ruum text-xs font-bold text-ui-danger">!</span>;
  }
  return <span aria-hidden="true" className="size-5 rounded-full border-2 border-dashed border-ui-field bg-ui-muted" />;
}

export function DatoMapa({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-lg border border-ui-line bg-ui-card px-3 py-2">
      <p className="font-mono-ruum text-xs uppercase tracking-wide text-ui-fg-muted">{etiqueta}</p>
      <p className="mt-0.5 truncate font-body text-sm text-ui-fg">{valor}</p>
    </div>
  );
}

interface PanelPrioridadProps {
  ordenPrioridad: CategoriaPrioridadMapa[];
  onMoverPrioridad: (categoria: CategoriaPrioridadMapa, direccion: -1 | 1) => void;
  onRestablecerPrioridad: () => void;
}

export function PanelPrioridad({
  ordenPrioridad,
  onMoverPrioridad,
  onRestablecerPrioridad
}: PanelPrioridadProps) {
  return (
    <section className="border-b border-ui-line bg-ui-muted px-4 py-4 sm:px-6" aria-label="Configurar jerarquía de alertas">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="font-mono-ruum text-xs uppercase tracking-widest text-ui-fg-muted">Configurar jerarquía de alertas</p>
          <p className="mt-1 font-body text-sm text-ui-fg-muted">
            La lista y el mapa se ordenan con esta jerarquía. Las prioridades se recalculan al cambiar estado, incidencia o calidad de ubicación.
          </p>
        </div>
        <button
          type="button"
          onClick={onRestablecerPrioridad}
          className="w-fit rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm font-semibold text-ui-fg-muted hover:border-ui-brand/40"
        >
          Orden recomendado
        </button>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {ordenPrioridad.map((categoria, indice) => (
          <div key={categoria} className={`rounded-lg border px-3 py-3 ${claseTarjetaPrioridadMapa(categoria)}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono-ruum text-xs text-ui-fg-muted">Nivel {indice + 1}</p>
                <p className="mt-1 font-body text-sm font-semibold text-ui-fg">{ETIQUETA_PRIORIDAD_MAPA[categoria]}</p>
                <p className="mt-1 line-clamp-2 font-body text-xs text-ui-fg-muted">{DESCRIPCION_PRIORIDAD_MAPA[categoria]}</p>
              </div>
              <SimboloPrioridad categoria={categoria} />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onMoverPrioridad(categoria, -1)}
                disabled={indice === 0}
                className="min-h-8 rounded border border-ui-line-strong px-2 font-mono-ruum text-xs text-ui-fg-muted disabled:opacity-40"
                aria-label={`Subir prioridad ${ETIQUETA_PRIORIDAD_MAPA[categoria]}`}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMoverPrioridad(categoria, 1)}
                disabled={indice === ordenPrioridad.length - 1}
                className="min-h-8 rounded border border-ui-line-strong px-2 font-mono-ruum text-xs text-ui-fg-muted disabled:opacity-40"
                aria-label={`Bajar prioridad ${ETIQUETA_PRIORIDAD_MAPA[categoria]}`}
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
