import type { ReactNode } from "react";
import { useState } from "react";
import type { Database } from "@ruum/shared/types";

export type ConductorRow = Database["public"]["Tables"]["conductores"]["Row"];
export type DocumentoRow = Database["public"]["Tables"]["documentos_conductor"]["Row"];
export type VehiculoRow = Database["public"]["Tables"]["vehiculos"]["Row"];
export type EmpresaRow = Database["public"]["Tables"]["empresas"]["Row"];
export type HistorialEstatus = {
  id: string;
  conductor_id: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  motivo: string | null;
  cambiado_por: string;
  cambiado_en: string;
};

export const ESTADO_CLASE: Record<string, string> = {
  activo: "border-ui-success/30 bg-ui-success-soft text-ui-success",
  suspendido_7d: "border-ui-danger/30 bg-ui-danger-soft text-ui-danger",
  suspendido_14d: "border-ui-danger/30 bg-ui-danger-soft text-ui-danger",
  suspendido_30d: "border-ui-danger/30 bg-ui-danger-soft text-ui-danger",
  suspendido_indefinido: "border-ui-danger/30 bg-ui-danger-soft text-ui-danger",
  bloqueado_permanente: "border-ui-line-strong bg-ui-muted text-ui-fg-muted",
  modo_prueba_supervisada: "border-ui-warning/30 bg-ui-warning-soft text-ui-warning",
  pendiente_verificacion: "border-ui-line-strong bg-ui-muted text-ui-fg-muted"
};

export const ETIQUETA_ESTADO: Record<string, string> = {
  activo: "Activo",
  suspendido_7d: "Suspendido (7d)",
  suspendido_14d: "Suspendido (14d)",
  suspendido_30d: "Suspendido (30d)",
  suspendido_indefinido: "Suspendido",
  bloqueado_permanente: "Baja",
  modo_prueba_supervisada: "Modo prueba",
  pendiente_verificacion: "Pendiente"
};

export const ETIQUETA_DOCUMENTO: Record<string, string> = {
  licencia_frente: "Licencia · frente",
  licencia_reverso: "Licencia · reverso",
  identificacion_oficial: "Identificación oficial",
  documento_operativo: "Documento operativo adicional"
};

export const ESTADO_DOCUMENTO: Record<string, { texto: string; clase: string }> = {
  en_revision: { texto: "En revisión", clase: "border-ui-brand/30 bg-ui-brand-soft text-ui-brand-soft-fg" },
  aprobado: { texto: "Aprobado", clase: "border-ui-success/30 bg-ui-success-soft text-ui-success" },
  rechazado: { texto: "Rechazado", clase: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger" },
  vencido: { texto: "Vencido", clase: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger" }
};

export function fecha(valor: string | null) {
  return valor ? new Date(valor).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

export const ESTADOS_SUSPENDIDOS = new Set(["suspendido_7d", "suspendido_14d", "suspendido_30d", "suspendido_indefinido"]);

export function textoEstado(estado: string) {
  return ETIQUETA_ESTADO[estado] ?? estado;
}

export function subtituloConductor(conductor: ConductorRow) {
  const licencia = conductor.licencia_numero ? `Licencia ${conductor.licencia_numero}` : "Licencia no registrada";
  const tipo = conductor.licencia_tipo ? ` (Tipo ${conductor.licencia_tipo})` : "";
  return `${textoEstado(conductor.estado)} · ${licencia}${tipo}`;
}

export function telefonoHref(valor: string | null | undefined) {
  const digitos = valor?.replace(/\D/g, "") ?? "";
  return digitos ? `tel:${digitos}` : null;
}

export function domicilioFormateado(conductor: ConductorRow) {
  const linea1 = [conductor.calle, conductor.numero].filter(Boolean).join(" ");
  const linea2 = [conductor.colonia, conductor.codigo_postal].filter(Boolean).join(", ");
  const linea3 = [conductor.ciudad_municipio, conductor.estado_residencia].filter(Boolean).join(", ");
  return [linea1, linea2, linea3, conductor.referencias ? `Referencias: ${conductor.referencias}` : null].filter(
    (linea): linea is string => Boolean(linea)
  );
}

export function mapaHref(conductor: ConductorRow) {
  const direccion = domicilioFormateado(conductor)
    .filter((linea) => !linea.startsWith("Referencias:"))
    .join(", ");
  return direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}` : null;
}

export function estadoCumplimientoDocumentos(documentos: DocumentoRow[]) {
  const vigentes = documentos.filter((doc) => doc.estado === "aprobado").length;
  const total = documentos.length;
  if (total === 0) return { texto: "Sin documentos", clase: "border-ui-warning/30 bg-ui-warning-soft text-ui-warning" };
  if (vigentes === total) return { texto: `${vigentes} documentos vigentes`, clase: "border-ui-success/30 bg-ui-success-soft text-ui-success" };
  return { texto: `${vigentes} de ${total} vigentes`, clase: "border-ui-warning/30 bg-ui-warning-soft text-ui-warning" };
}

const SECCION_CLASE: Record<string, string> = {
  resumen: "bg-ui-brand-soft",
  personales: "bg-ui-card",
  domicilio: "bg-ui-success-soft",
  fechas: "bg-ui-warning-soft",
  acciones: "bg-ui-brand/[0.025]"
};

export function Seccion({
  titulo,
  children,
  tono = "personales"
}: {
  titulo: string;
  children: ReactNode;
  tono?: keyof typeof SECCION_CLASE;
}) {
  return (
    <section className={`rounded-lg border border-ui-line p-4 shadow-ui-sm ${SECCION_CLASE[tono]}`}>
      <h2 className="font-display text-lg font-semibold text-ui-fg">{titulo}</h2>
      <div className="mt-3 divide-y divide-ui-line">{children}</div>
    </section>
  );
}

export function Dato({
  etiqueta,
  valor,
  copiar = false,
  llamarHref,
  destacado = false
}: {
  etiqueta: string;
  valor: string | null | undefined;
  copiar?: boolean;
  llamarHref?: string | null;
  destacado?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);
  async function copiarValor() {
    if (!valor) return;
    await navigator.clipboard.writeText(valor);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1200);
  }
  return (
    <div className="group grid gap-2 py-3 font-body text-sm sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
      <span className="text-ui-fg-muted">{etiqueta}</span>
      <span
        className={`min-w-0 break-words text-left font-medium ${destacado ? "rounded-lg border border-ui-warning/30 bg-ui-warning-soft px-3 py-2 text-ui-warning" : "text-ui-fg"}`}
      >
        {valor ?? <span className="text-ui-fg-muted">—</span>}
      </span>
      <span className="flex flex-wrap gap-2 sm:justify-end">
        {llamarHref && (
          <a
            href={llamarHref}
            className="inline-flex min-h-9 items-center rounded-md border border-ui-brand/30 px-2.5 py-1 font-body text-xs font-semibold text-ui-brand-soft-fg hover:bg-ui-brand-soft"
          >
            Llamar
          </a>
        )}
        {copiar && valor ? (
          <span className="relative inline-flex">
            <button
              type="button"
              onClick={copiarValor}
              className="inline-flex min-h-9 items-center rounded-md border border-ui-line px-2.5 py-1 font-body text-xs font-semibold text-ui-fg-muted transition hover:bg-ui-muted hover:text-ui-fg"
              title={`Copiar ${etiqueta}`}
            >
              Copiar
            </button>
            {copiado && (
              <span className="absolute -top-8 right-0 rounded-md bg-ui-brand px-2 py-1 font-body text-xs font-semibold text-ui-on-brand shadow-ui-md">
                Copiado
              </span>
            )}
          </span>
        ) : null}
      </span>
    </div>
  );
}

export function FilaDocumento({ documento }: { documento: DocumentoRow }) {
  const estado = ESTADO_DOCUMENTO[documento.estado] ?? ESTADO_DOCUMENTO.en_revision;

  return (
    <div className="rounded-lg border border-ui-line bg-ui-card p-3 transition hover:border-ui-line-strong hover:bg-ui-brand-hover/[0.015]">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <p className="truncate font-body text-sm font-semibold">{ETIQUETA_DOCUMENTO[documento.tipo] ?? documento.tipo}</p>
          <p className="mt-0.5 font-body text-xs text-ui-fg-muted">
            Versión {documento.version} · {fecha(documento.creado_en)}
          </p>
          <p className="mt-0.5 truncate font-body text-xs text-ui-fg-muted">{documento.nombre_archivo}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 font-body text-xs font-medium ${estado.clase}`}>{estado.texto}</span>
      </div>
      {(documento.motivo_rechazo || documento.notas_admin) && (
        <p className="mt-3 rounded-lg bg-ui-warning-soft px-3 py-2 font-body text-xs text-ui-warning">
          {documento.motivo_rechazo ?? documento.notas_admin}
        </p>
      )}
    </div>
  );
}
