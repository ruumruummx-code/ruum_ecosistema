import Link from "next/link";
import type { EstadoMetrica, ExportacionRealizada, PeriodoReporte, RESUMEN_EJECUTIVO, GRUPOS_REPORTE } from "./ReportesTipos";

export function FiltroSegmentado<T extends string>({
  label,
  items,
  value,
  onChange
}: {
  label: string;
  items: Array<{ id: T; etiqueta: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">{label}</span>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`inline-flex min-h-10 items-center rounded-full border px-3 py-1.5 font-body text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ui-ring ${value === item.id ? "border-ui-brand bg-ui-brand text-ui-fg" : "border-ui-line bg-ui-muted text-ui-fg-muted hover:border-ui-brand/40 hover:text-ui-fg"}`}
        >
          {item.etiqueta}
        </button>
      ))}
    </div>
  );
}

export function FiltroSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 font-body text-sm text-ui-fg-muted">
      <span className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-10 rounded-lg border border-ui-line bg-ui-muted px-3 py-2 font-body text-sm text-ui-fg focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function KpiEjecutivo({ metrica }: { metrica: typeof RESUMEN_EJECUTIVO[number] }) {
  return (
    <Link
      href={metrica.href}
      className="rounded-lg border border-ui-line bg-ui-card p-4 shadow-ui-sm transition-colors hover:border-ui-brand/40 focus:outline-none focus:ring-2 focus:ring-ui-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">{metrica.titulo}</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ui-fg">{metrica.valor}</p>
        </div>
        <Ayuda texto={metrica.definicion} />
      </div>
      <EstadoMetricaBadge estado={metrica.estado} />
      <p className="mt-3 font-body text-xs leading-5 text-ui-fg-muted">{metrica.detalle}</p>
      <span className="mt-4 inline-flex min-h-9 items-center rounded-lg border border-ui-brand/35 px-3 py-1.5 font-body text-xs font-semibold text-ui-brand-soft-fg">
        Ver detalle
      </span>
    </Link>
  );
}

export function GrupoReportes({ grupo }: { grupo: typeof GRUPOS_REPORTE[number] }) {
  return (
    <section className="rounded-lg border border-ui-line bg-ui-card p-5 shadow-ui-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ui-fg">{grupo.categoria}</h2>
          <p className="mt-1 font-body text-sm text-ui-fg-muted">{grupo.pregunta}</p>
        </div>
        <span className="rounded-full border border-ui-line bg-ui-muted px-3 py-1 font-body text-xs font-semibold text-ui-fg-muted">
          MVP
        </span>
      </div>
      <div className="mt-4 grid gap-2">
        {grupo.columnas.map((metrica) => (
          <article key={metrica.titulo} className="rounded-lg border border-ui-line bg-ui-muted px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-body text-sm font-semibold text-ui-fg">{metrica.titulo}</p>
                <p className="mt-1 font-body text-xs text-ui-fg-muted">Formato esperado: {metrica.formato}</p>
              </div>
              <div className="text-right">
                <p className="font-body text-sm font-semibold text-ui-fg-muted">{metrica.valor}</p>
                <EstadoMetricaBadge estado={metrica.estado} compacto />
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-4 rounded-lg border border-ui-brand/25 bg-ui-brand-soft px-3 py-2 font-body text-xs leading-5 text-ui-fg-muted">
        Podrás filtrar por zona, tipo de servicio y periodo cuando el motor de reportes esté activo.
      </p>
    </section>
  );
}

export function PanelGraficaPlaceholder({
  periodo,
  zona,
  servicio
}: {
  periodo: string;
  zona: string;
  servicio: string;
}) {
  return (
    <section className="rounded-lg border border-ui-line bg-ui-card p-5 shadow-ui-sm" aria-label="Gráfica de traslados">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ui-fg">Traslados por día, semana y zona</h2>
          <p className="mt-1 font-body text-sm text-ui-fg-muted">
            Vista preparada para serie temporal y comparación operativa.
          </p>
        </div>
        <span className="rounded-full border border-ui-line bg-ui-muted px-3 py-1 font-body text-xs font-semibold text-ui-fg-muted">
          {periodo}
        </span>
      </div>
      <div className="mt-5 grid min-h-56 place-items-center rounded-lg border border-dashed border-ui-line bg-ui-muted p-6 text-center">
        <div>
          <p className="font-display text-lg font-semibold text-ui-fg">En conexión...</p>
          <p className="mt-2 max-w-md font-body text-sm leading-6 text-ui-fg-muted">
            La gráfica usará los filtros globales: zona {zona}, servicio {servicio}. No se muestran datos de ejemplo
            para evitar decisiones con información no real.
          </p>
        </div>
      </div>
    </section>
  );
}

export function PanelTablaPlaceholder() {
  return (
    <section className="rounded-lg border border-ui-line bg-ui-card p-5 shadow-ui-sm" aria-label="Tabla de detalle de reportes">
      <h2 className="font-display text-xl font-semibold text-ui-fg">Detalle filtrado</h2>
      <p className="mt-1 font-body text-sm text-ui-fg-muted">
        Los indicadores clave abrirán aquí o en su módulo operativo con filtros aplicados.
      </p>
      <div className="mt-4 overflow-hidden rounded-lg border border-ui-line">
        <table className="w-full text-left font-body text-sm">
          <thead className="bg-ui-muted text-ui-fg-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">Métrica</th>
              <th className="px-3 py-2 font-semibold">Estado</th>
              <th className="px-3 py-2 font-semibold">Acción</th>
            </tr>
          </thead>
          <tbody>
            {["Incidencias abiertas", "Traslados pendientes de cobro", "Documentos vencidos"].map((fila) => (
              <tr key={fila} className="border-t border-ui-line">
                <td className="px-3 py-3 text-ui-fg">{fila}</td>
                <td className="px-3 py-3 text-ui-fg-muted">Sin datos aún</td>
                <td className="px-3 py-3 text-ui-brand-soft-fg">Preparado para detalle</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EstadoMetricaBadge({ estado, compacto = false }: { estado: EstadoMetrica; compacto?: boolean }) {
  const clase =
    estado === "ok"
      ? "border-ui-success/30 bg-ui-success-soft text-ui-success"
      : estado === "atencion"
        ? "border-ui-warning/35 bg-ui-warning-soft text-ui-warning"
        : estado === "critico"
          ? "border-ui-danger/30 bg-ui-danger-soft text-ui-danger"
          : estado === "desconectado"
            ? "border-ui-line bg-ui-card text-ui-fg-muted"
            : "border-ui-line bg-ui-muted text-ui-fg-muted";
  const etiqueta =
    estado === "desconectado"
      ? "Motor no conectado"
      : estado === "ok"
        ? "En rango"
        : estado === "atencion"
          ? "Advertencia"
          : estado === "critico"
            ? "Problema"
            : "Neutral";
  return (
    <span
      className={`mt-2 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-body ${compacto ? "text-xs" : "text-xs"} font-semibold ${clase}`}
    >
      <span className="inline-block size-1.5 rounded-full bg-current" aria-hidden="true" />
      {etiqueta}
    </span>
  );
}

function Ayuda({ texto }: { texto: string }) {
  return (
    <span className="group relative inline-flex">
      <span className="inline-flex size-7 items-center justify-center rounded-full border border-ui-line bg-ui-muted font-body text-xs font-semibold text-ui-fg-muted">
        ?
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-9 z-30 hidden w-64 rounded-lg border border-ui-line bg-ui-card p-3 font-body text-xs leading-5 text-ui-fg-muted shadow-ui-md group-hover:block group-focus-within:block"
      >
        {texto}
      </span>
    </span>
  );
}

export function ModalExportacion({
  exportacion,
  onClose
}: {
  exportacion: ExportacionRealizada;
  onClose: () => void;
}) {
  async function copiarHash() {
    await navigator.clipboard?.writeText(exportacion.hash);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ui-brand px-4 py-6"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="exportacion-titulo"
        className="w-full max-w-lg rounded-lg border border-ui-line bg-ui-card p-5 shadow-ui-md"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">
              Exportación completada
            </p>
            <h2 id="exportacion-titulo" className="mt-1 font-display text-xl font-semibold text-ui-fg">
              {exportacion.recurso} CSV
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-ui-line text-ui-fg-muted hover:text-ui-fg"
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>
        <dl className="mt-4 grid gap-3 rounded-lg border border-ui-line bg-ui-muted p-4">
          <DatoModal
            etiqueta="Fecha / hora"
            valor={new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(
              new Date(exportacion.fecha)
            )}
          />
          <DatoModal etiqueta="Rango de datos" valor={exportacion.rango} />
          <DatoModal etiqueta="Trace ID" valor={exportacion.traceId} />
          <div>
            <dt className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">
              Huella SHA-256
            </dt>
            <dd className="mt-1 break-all font-mono-ruum text-xs text-ui-fg">{exportacion.hash}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => void copiarHash()}
            className="rounded-lg border border-ui-brand/35 px-4 py-2 font-body text-sm font-semibold text-ui-brand-soft-fg hover:bg-ui-brand-soft"
          >
            Copiar SHA-256
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ui-brand bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-brand-hover"
          >
            Entendido
          </button>
        </div>
      </section>
    </div>
  );
}

function DatoModal({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">{etiqueta}</dt>
      <dd className="mt-1 font-body text-sm font-semibold text-ui-fg">{valor}</dd>
    </div>
  );
}
