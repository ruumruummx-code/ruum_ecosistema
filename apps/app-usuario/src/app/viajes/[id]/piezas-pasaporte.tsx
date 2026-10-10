import type { ReactNode } from "react";
import { Icono } from "@ruum/ui";
import { ETIQUETA_TIPO_INCIDENCIA } from "@ruum/shared/constants";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import type {
  EstadoTraslado,
  FotoEvidenciaVisual,
  Incidencia,
  Pasaporte,
  Traslado,
} from "./tipos-pasaporte";

/** Piezas de presentación del Pasaporte Digital. Extraídas de
 * `viajes/[id]/page.tsx` (god-component) sin cambios de lógica ni estilos. */

export const LINEA_TIEMPO: { estado: EstadoTraslado; etiqueta: string }[] = [
  { estado: "solicitud_creada", etiqueta: "Solicitud creada" },
  { estado: "cotizacion_generada", etiqueta: "Tarifa asignada" },
  { estado: "pago_completado", etiqueta: "Pago realizado" },
  { estado: "conductor_asignado", etiqueta: "Conductor asignado" },
  { estado: "conductor_en_camino_al_origen", etiqueta: "Conductor en camino al origen" },
  { estado: "vehiculo_recibido", etiqueta: "Vehículo localizado" },
  { estado: "evidencia_inicial_completada", etiqueta: "Check inicial cargado" },
  { estado: "traslado_en_curso", etiqueta: "En camino al destino" },
  { estado: "evidencia_final_completada", etiqueta: "Check final cargado" },
  { estado: "entrega_confirmada", etiqueta: "Entrega confirmada" },
  { estado: "servicio_cerrado", etiqueta: "Traslado finalizado" }
];

export const ORDEN_ESTADOS: EstadoTraslado[] = [
  "usuario_pendiente_verificacion",
  "usuario_verificado",
  "solicitud_creada",
  "documentacion_pendiente",
  "documentacion_en_revision",
  "documentacion_validada",
  "cotizacion_generada",
  // M14: falta este estado válido (orden canónico: ESTADOS_TRASLADO) dejaba
  // estadoDePaso en "pendiente" para todo el timeline de ese traslado.
  "cotizacion_aceptada",
  "servicio_confirmado",
  "pendiente_de_conductor",
  "conductor_asignado",
  "conductor_en_camino_al_origen",
  "conductor_en_punto_de_recoleccion",
  "verificacion_vehiculo_en_proceso",
  "evidencia_inicial_en_proceso",
  "evidencia_inicial_completada",
  "vehiculo_recibido",
  "traslado_en_curso",
  "incidencia_reportada",
  "llegada_a_destino",
  "evidencia_final_en_proceso",
  "evidencia_final_completada",
  "entrega_confirmada",
  "pago_pendiente",
  "pago_completado",
  "servicio_cerrado"
];

export const ETIQUETA_ANGULO: Record<FotoEvidenciaVisual["angulo"], string> = {
  frente: "Frente",
  lado_piloto: "Lado piloto",
  lado_copiloto: "Lado copiloto",
  trasera: "Trasera",
  tablero: "Tablero",
  dano_previo: "Daño visible",
  adicional: "Adicional"
};

export function formatoFecha(fecha: string | null | undefined) {
  if (!fecha) return "Pendiente";
  try {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return "Pendiente";
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Mexico_City"
    }).format(d);
  } catch {
    return "Pendiente";
  }
}

export function estadoDePaso(estadoActual: EstadoTraslado, estadoPaso: EstadoTraslado) {
  const indiceActual = ORDEN_ESTADOS.indexOf(estadoActual);
  const indicePaso = ORDEN_ESTADOS.indexOf(estadoPaso);
  if (indiceActual < 0 || indicePaso < 0) return "pendiente";
  if (indiceActual > indicePaso) return "completado";
  if (indiceActual === indicePaso) return "actual";
  return "pendiente";
}

export function calcularHorasDesdeCierre(actualizadoEn: string | null) {
  if (!actualizadoEn) return Number.POSITIVE_INFINITY;
  return (Date.now() - new Date(actualizadoEn).getTime()) / (1000 * 60 * 60);
}

export function humanizar(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const texto = valor.replaceAll("_", " ").trim();
  if (!texto) return null;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatoDuracion(horas: number | null | undefined): string | null {
  if (horas == null || Number.isNaN(Number(horas))) return null;
  const totalMin = Math.round(Number(horas) * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

// Capa compartida (@ruum/ui): conserva la API y el tamaño por defecto.
export function IconoTarjeta({ d, className = "size-3.5" }: { d: string; className?: string }) {
  return <Icono d={d} className={className} />;
}

export function IconoAuto({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.2 10.5 6.7 6.8A2 2 0 0 1 8.55 5.5h6.9a2 2 0 0 1 1.85 1.3l1.5 3.7c1.05.32 1.7 1.28 1.7 2.38v4.37a1 1 0 0 1-1 1h-1.4a1 1 0 0 1-1-1v-.75H6.9v.75a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-4.37c0-1.1.65-2.06 1.7-2.38Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M6.5 10.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="7.2" cy="14.4" r="1.3" fill="currentColor" />
      <circle cx="16.8" cy="14.4" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function IconoPersona({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 19.5c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TarjetaPasaporte({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="scroll-mt-28 rounded-[22px] border border-[#eef2f7] bg-white p-5 shadow-[0_6px_16px_rgba(0,0,0,0.01)]"
    >
      {children}
    </section>
  );
}

export function EncabezadoTarjeta({ id, icono, titulo }: { id: string; icono: ReactNode; titulo: string }) {
  return (
    <h2 id={`${id}-titulo`} className="mb-4 flex items-center gap-2.5 text-[16px] font-bold text-[#0b1e33]">
      <span
        aria-hidden="true"
        className="flex size-7 items-center justify-center rounded-[10px] bg-[#f0f5fe] text-[#2e5a88]"
      >
        {icono}
      </span>
      {titulo}
    </h2>
  );
}

export function FilaInfo({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="flex items-start text-[14px] leading-snug">
      <span className="w-[130px] shrink-0 font-medium text-[#6f7e94]">{etiqueta}</span>
      <span className="flex-1 font-semibold text-[#1a293b]">{valor}</span>
    </div>
  );
}

export function LineaTiempoVisual({ estadoActual }: { estadoActual: EstadoTraslado }) {
  return (
    <ol className="mt-1.5 flex flex-col gap-0.5">
      {LINEA_TIEMPO.map((paso) => {
        const estado = estadoDePaso(estadoActual, paso.estado);
        return (
          <li key={paso.etiqueta} className="flex gap-3.5 py-2 text-[13px]">
            <span
              aria-hidden="true"
              className={[
                "mt-1 size-2.5 shrink-0 rounded-full",
                estado === "completado"
                  ? "bg-[#0b1e33] shadow-[0_0_0_3px_#e6edf6]"
                  : estado === "actual"
                    ? "bg-[#2e9e6b] shadow-[0_0_0_3px_#d6f0e3]"
                    : "bg-[#cbd7e6]",
              ].join(" ")}
            />
            <span className="flex-1">
              <span
                className={[
                  "block font-semibold",
                  estado === "pendiente" ? "font-medium text-[#a6b7cb]" : "text-[#1a293b]",
                  estado === "actual" ? "font-bold text-[#0b1e33]" : "",
                ].join(" ")}
              >
                {paso.etiqueta}
              </span>
              <span className="mt-0.5 block text-[11px] text-[#8b9bb0]">
                {estado === "actual" ? "Estado actual" : estado === "completado" ? "Completado" : "Pendiente"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function EvidenciaMomento({
  titulo,
  descripcion,
  fotos
}: {
  titulo: string;
  descripcion: string;
  fotos: FotoEvidenciaVisual[];
}) {
  return (
    <div className="border-t border-ink/10 pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-body text-sm font-semibold">{titulo}</h3>
          <p className="mt-1 font-body text-xs leading-5 text-ink/55">{descripcion}</p>
        </div>
        <span className="shrink-0 font-mono-ruum text-xs text-ink/50">{fotos.length} fotos</span>
      </div>

      {fotos.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((foto) => (
            <div key={foto.id} className="overflow-hidden rounded-lg border border-ink/10 bg-mist">
              {foto.url_visual?.startsWith("http") ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal de Supabase Storage.
                <img src={foto.url_visual} alt={ETIQUETA_ANGULO[foto.angulo]} className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-ink/5 px-3 text-center font-body text-xs text-ink/45">
                  Foto registrada
                </div>
              )}
              <div className="border-t border-ink/10 px-3 py-2">
                <p className="font-body text-xs font-medium">{ETIQUETA_ANGULO[foto.angulo]}</p>
                <p className="mt-0.5 font-body text-xs text-ink/45">
                  {foto.sincronizada ? "Sincronizada" : "Pendiente de sincronizar"} · {formatoFecha(foto.capturada_en)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-ink/15 px-3 py-3 font-body text-sm text-ink/50">
          Aún no hay evidencia cargada para este momento.
        </p>
      )}
    </div>
  );
}

export function EvidenciaDurante({
  pasaporte,
  traslado,
  incidencias
}: {
  pasaporte: Pasaporte;
  traslado: Traslado | null;
  incidencias: Incidencia[];
}) {
  return (
    <div className="border-t border-ink/10 pt-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-body text-sm font-semibold">Evidencia durante el traslado</h3>
          <p className="mt-1 font-body text-xs leading-5 text-ink/55">
            Actualizaciones de estatus, ubicación general, hitos del recorrido, paradas autorizadas, incidencias y
            mensajes operativos relevantes.
          </p>
        </div>
        <span className="shrink-0 font-mono-ruum text-xs text-ink/50">{incidencias.length} incidencias</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-ink/10 px-3 py-3">
          <p className="font-body text-xs uppercase tracking-wide text-ink/45">Estatus</p>
          <p className="mt-1 font-body text-sm font-medium">
            {pasaporte.estado ? ETIQUETA_ESTADO_TRASLADO[pasaporte.estado] : "Estado por confirmar"}
          </p>
        </div>
        <div className="rounded-lg border border-ink/10 px-3 py-3">
          <p className="font-body text-xs uppercase tracking-wide text-ink/45">Último hito</p>
          <p className="mt-1 font-body text-sm font-medium">{formatoFecha(pasaporte.actualizado_en)}</p>
        </div>
        <div className="rounded-lg border border-ink/10 px-3 py-3">
          <p className="font-body text-xs uppercase tracking-wide text-ink/45">Ruta general</p>
          <p className="mt-1 font-body text-sm font-medium">
            {traslado ? `${traslado.origen_ciudad} → ${traslado.destino_ciudad}` : "Pendiente"}
          </p>
        </div>
      </div>
      {incidencias.length > 0 && (
        <div className="mt-4 space-y-2">
          {incidencias.slice(0, 2).map((incidencia) => (
            <div key={incidencia.id} className="rounded-lg border border-warn/25 bg-warn-soft/40 px-3 py-2">
              <p className="font-body text-sm font-medium">{ETIQUETA_TIPO_INCIDENCIA[incidencia.tipo]}</p>
              <p className="mt-1 font-body text-xs text-ink/55">{incidencia.descripcion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
