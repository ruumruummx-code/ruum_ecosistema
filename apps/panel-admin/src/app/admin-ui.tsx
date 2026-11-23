import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, Button, Card, cn } from "@ruum/ui/base";

type AdminPageHeaderProps = {
  etiqueta?: string;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  breadcrumb?: Array<{ label: string; href?: string }>;
  estadoConexion?: "conectado" | "datos_en_vivo" | "demo" | "sin_conexion" | "actualizando" | "reconectando" | "desactualizado";
  ultimaActualizacion?: string | Date | null;
  tipoDatos?: "administrativos" | "gps" | "mixto";
  seccionesDesactualizadas?: string[];
  accionesSecundarias?: ReactNode;
  contadorResultados?: number;
};

type AdminPanelProps = {
  children: ReactNode;
  className?: string;
};

function textoConexion(estado: NonNullable<AdminPageHeaderProps["estadoConexion"]>) {
  if (estado === "conectado" || estado === "datos_en_vivo") return "Datos en vivo";
  if (estado === "actualizando") return "Actualizando";
  if (estado === "reconectando") return "Reconectando";
  if (estado === "desactualizado") return "Datos posiblemente desactualizados";
  if (estado === "demo") return "Modo demo";
  return "Sin conexión";
}

function tonoConexion(estado: NonNullable<AdminPageHeaderProps["estadoConexion"]>) {
  if (estado === "conectado" || estado === "datos_en_vivo") return "success" as const;
  if (estado === "actualizando" || estado === "reconectando") return "info" as const;
  if (estado === "demo" || estado === "desactualizado") return "warning" as const;
  return "danger" as const;
}

function textoTipoDatos(tipo: NonNullable<AdminPageHeaderProps["tipoDatos"]>) {
  if (tipo === "gps") return "Datos GPS";
  if (tipo === "mixto") return "Datos administrativos y GPS";
  return "Datos administrativos";
}

function formatoActualizacion(valor: string | Date) {
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(fecha);
}

function formatoActualizacionRelativa(valor: string | Date) {
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? "Actualización sin fecha válida" : "Última actualización";
}

export function AdminPageHeader({
  etiqueta,
  titulo,
  descripcion,
  accion,
  breadcrumb,
  estadoConexion,
  ultimaActualizacion,
  tipoDatos,
  seccionesDesactualizadas = [],
  accionesSecundarias,
  contadorResultados
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-2 text-xs text-ui-fg-muted" aria-label="Ruta de navegación">
            <ol className="flex flex-wrap items-center gap-1.5">
              {breadcrumb.map((item, indice) => (
                <li key={`${item.label}-${indice}`} className="flex items-center gap-1.5">
                  {indice > 0 && <span aria-hidden="true">/</span>}
                  {item.href ? <Link href={item.href} className="rounded-sm hover:text-ui-fg">{item.label}</Link> : <span aria-current={indice === breadcrumb.length - 1 ? "page" : undefined}>{item.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {etiqueta && <p className="font-mono-ruum text-xs font-medium uppercase tracking-widest text-ui-brand">{etiqueta}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ui-fg xl:text-3xl">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-3xl text-sm text-ui-fg-muted">{descripcion}</p>}
        {(estadoConexion || ultimaActualizacion || tipoDatos || typeof contadorResultados === "number") && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ui-fg-muted">
            {estadoConexion && <Badge tone={tonoConexion(estadoConexion)} dot>{textoConexion(estadoConexion)}</Badge>}
            {ultimaActualizacion && (
              <time dateTime={Number.isNaN((ultimaActualizacion instanceof Date ? ultimaActualizacion : new Date(ultimaActualizacion)).getTime()) ? undefined : (ultimaActualizacion instanceof Date ? ultimaActualizacion : new Date(ultimaActualizacion)).toISOString()}>
                {formatoActualizacionRelativa(ultimaActualizacion)} · {formatoActualizacion(ultimaActualizacion)}
              </time>
            )}
            {tipoDatos && <span>{textoTipoDatos(tipoDatos)}</span>}
            {typeof contadorResultados === "number" && <span>{contadorResultados.toLocaleString("es-MX")} resultados</span>}
          </div>
        )}
        {seccionesDesactualizadas.length > 0 && (
          <p className="mt-2 text-xs text-ui-warning">
            Pueden estar desactualizadas: {seccionesDesactualizadas.join(", ")}.
          </p>
        )}
      </div>
      {(accion || accionesSecundarias) && (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {accionesSecundarias}
          {accion}
        </div>
      )}
    </header>
  );
}

export function AdminPanel({ children, className = "" }: AdminPanelProps) {
  return <Card asChild className={className}><section>{children}</section></Card>;
}

type AdminFiltroActivoProps = {
  etiqueta: string;
  onLimpiar: () => void;
  limpiarLabel?: string;
  className?: string;
};

/** Banner cuando la vista entra o queda acotada por un filtro (p. ej. `?filtro=` del menú). */
export function AdminFiltroActivo({
  etiqueta,
  onLimpiar,
  limpiarLabel = "Ver todos",
  className = ""
}: AdminFiltroActivoProps) {
  return (
    <div
      className={cn("mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-ui-brand-soft px-4 py-2", className)}
      role="status"
    >
      <p className="text-sm font-semibold text-ui-brand-soft-fg">Filtro activo: {etiqueta}</p>
      <Button variant="link" size="sm" onClick={onLimpiar}>{limpiarLabel}</Button>
    </div>
  );
}

/** Quita `filtro` (u otras claves) de la URL sin recargar la página. */
export function limpiarParamsFiltroUrl(claves: string[] = ["filtro", "accion"]) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let cambio = false;
  for (const clave of claves) {
    if (url.searchParams.has(clave)) {
      url.searchParams.delete(clave);
      cambio = true;
    }
  }
  if (cambio) {
    const siguiente = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", siguiente);
  }
}
