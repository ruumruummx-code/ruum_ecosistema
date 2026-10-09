"use client";

import Link from "next/link";
import type { Database } from "@ruum/shared/types";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import { obtenerHistorial, obtenerViajeActivo } from "../lib/inicio";
import { TERMINOLOGIA_USUARIO } from "../lib/glosario";
import { ConductorAsignado } from "./ConductorAsignado";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];

export interface InicioUsuarioProps {
  usuario: UsuarioRow | null;
  traslados: PasaporteRow[];
  conductorFotoUrl?: string | null;
}

function folioVisible(trasladoId: string | null): string {
  return trasladoId ? `#${trasladoId.slice(0, 8).toUpperCase()}` : "#—";
}

function primerNombre(nombre: string | null | undefined): string | null {
  const valor = nombre?.trim().split(/\s+/)[0];
  if (!valor) return null;
  return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
}

function vehiculoTitulo(t: PasaporteRow): string {
  const partes = [t.vehiculo_marca, t.vehiculo_modelo, t.vehiculo_anio].filter(Boolean);
  return partes.length > 0 ? partes.join(" ") : "Vehículo";
}

function ciudadOrigen(t: PasaporteRow): string {
  return t.origen_ciudad?.trim() || t.origen_direccion?.trim() || "Origen";
}

function ciudadDestino(t: PasaporteRow): string {
  return t.destino_ciudad?.trim() || t.destino_direccion?.trim() || "Destino";
}

function etiquetaEstado(t: PasaporteRow): string {
  if (!t.estado) return "En seguimiento";
  return TERMINOLOGIA_USUARIO[t.estado] ?? ETIQUETA_ESTADO_TRASLADO[t.estado] ?? "En seguimiento";
}

/** Porcentaje ilustrativo del avance según la etapa operativa (solo visual). */
function progresoPorEstado(estado: string | null): number {
  switch (estado) {
    case "solicitud_creada":
    case "documentacion_pendiente":
    case "documentacion_en_revision":
    case "documentacion_validada":
    case "cotizacion_generada":
    case "cotizacion_aceptada":
    case "servicio_confirmado":
    case "pendiente_de_conductor":
    case "pago_pendiente":
      return 15;
    case "conductor_asignado":
    case "conductor_en_camino_al_origen":
    case "conductor_en_punto_de_recoleccion":
    case "verificacion_vehiculo_en_proceso":
    case "evidencia_inicial_en_proceso":
    case "evidencia_inicial_completada":
    case "vehiculo_recibido":
      return 40;
    case "traslado_en_curso":
    case "incidencia_reportada":
      return 65;
    case "llegada_a_destino":
    case "evidencia_final_en_proceso":
    case "evidencia_final_completada":
      return 85;
    case "entrega_confirmada":
    case "pago_completado":
    case "servicio_cerrado":
      return 100;
    default:
      return 25;
  }
}

function tiempoEstimadoTexto(horas: number | null): string {
  if (horas == null || Number.isNaN(Number(horas))) return "ETA —";
  const totalMin = Math.round(Number(horas) * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m est.`;
  if (m === 0) return `${h}h est.`;
  return `${h}h ${m}m`;
}

function evidenciaTexto(t: PasaporteRow): string {
  if ((t.evidencia_final_fotos_sincronizadas ?? 0) > 0) return "Evidencia completa";
  if ((t.evidencia_inicial_fotos_sincronizadas ?? 0) > 0) return "Check inicial listo";
  return "Evidencia pendiente";
}

function estadoReciente(t: PasaporteRow): { label: string; tono: string } {
  switch (t.estado) {
    case "servicio_cerrado":
    case "entrega_confirmada":
    case "pago_completado":
    case "reclamo_resuelto":
    case "disputa_resuelta":
      return { label: "Finalizado", tono: "user-v2-status--success" };
    case "servicio_cancelado":
    case "traslado_fallido":
      return { label: "Cancelado", tono: "user-v2-status--error" };
    case "solicitud_creada":
    case "documentacion_pendiente":
    case "documentacion_en_revision":
    case "documentacion_validada":
    case "cotizacion_generada":
    case "cotizacion_aceptada":
    case "servicio_confirmado":
    case "pendiente_de_conductor":
    case "pago_pendiente":
      return { label: "Programado", tono: "user-v2-status--pending" };
    default:
      return { label: etiquetaEstado(t), tono: "user-v2-status--active" };
  }
}

/* ---------- Iconos (SVG inline, sin dependencias) ---------- */

function IconoCarro({ className = "size-6" }: { className?: string }) {
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

function IconoPortapapeles({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 4V2.8h6V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconoHistorial({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.2l3 1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoEscudo({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 5 5.8v5.4c0 4.3 2.9 7.4 7 9 4.1-1.6 7-4.7 7-9V5.8L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m9 11.5 2.2 2.2L15.5 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoChevron({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoPlus({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8.5v7M8.5 12h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconoPin({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="10" r="2.6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconoFlecha({ className = "size-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoReloj({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconoCamara({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconoUsuario({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 19.5c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function InicioUsuario({ usuario, traslados, conductorFotoUrl = null }: InicioUsuarioProps) {
  const viajeActivo = obtenerViajeActivo(traslados);
  const nombre = primerNombre(usuario?.nombre);
  const saludo = nombre ? `Hola, ${nombre} 👋` : "Hola 👋";
  const conductorAsignado =
    viajeActivo?.traslado_id && viajeActivo.conductor_id && viajeActivo.conductor_nombre && viajeActivo.estado
      ? {
          trasladoId: viajeActivo.traslado_id,
          estado: viajeActivo.estado,
          nombre: viajeActivo.conductor_nombre,
        }
      : null;

  const historial = obtenerHistorial(traslados)
    .filter((t) => t.traslado_id !== viajeActivo?.traslado_id)
    .slice(0, 2);

  const detalleActivoHref = viajeActivo?.traslado_id ? `/viajes/${viajeActivo.traslado_id}` : "/mis-viajes";
  const pasaporteHref = viajeActivo?.traslado_id ? `/viajes/${viajeActivo.traslado_id}` : "/pasaporte";

  return (
    <div className="user-v2-screen">
      {/* Saludo */}
      <section id="greetingBlock" aria-labelledby="saludo-usuario">
        <h1 id="saludo-usuario" className="text-[24px] font-extrabold tracking-tight text-[var(--user-color-primary)]">
          {saludo}
        </h1>
        <p className="mt-1 text-[14px] font-medium text-[var(--user-color-muted)]">
          ¿A dónde movemos tu auto hoy?
        </p>
      </section>

      {/* Traslado activo → tarjeta oscura protagonista */}
      <section
        id="activeTransferCard"
        aria-label={viajeActivo ? `Traslado Activo ${folioVisible(viajeActivo.traslado_id)}` : "Sin traslados activos"}
        aria-live="polite"
      >
        {viajeActivo ? (
          <Link
            href={detalleActivoHref}
            aria-label={`Ver seguimiento del traslado activo ${vehiculoTitulo(viajeActivo)}`}
            className="relative block overflow-hidden rounded-[26px] p-6 text-white shadow-[0_16px_32px_-12px_rgba(11,30,51,0.4)] transition-transform active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg, #0b1e33 0%, #162c47 100%)" }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-14 -top-14 size-44 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }}
            />
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[12px] font-bold tracking-wide">
              <span className="size-[7px] animate-pulse rounded-full bg-[#4ade80]" aria-hidden="true" />
              TRASLADO ACTIVO
            </span>

            <h2 className="mt-4 text-[15px] font-bold text-white/80">
              Traslado Activo {folioVisible(viajeActivo.traslado_id)}
            </h2>
            <p className="mt-1 text-[22px] font-extrabold tracking-tight">{vehiculoTitulo(viajeActivo)}</p>
            {viajeActivo.vehiculo_placas && (
              <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.5px] text-white/60">
                Placas {viajeActivo.vehiculo_placas}
              </p>
            )}
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] font-medium text-white/75">
              <IconoPin />
              <span className="max-w-[42%] truncate">{ciudadOrigen(viajeActivo)}</span>
              <IconoFlecha />
              <span className="max-w-[42%] truncate">{ciudadDestino(viajeActivo)}</span>
            </p>

            <div className="mt-5 flex items-center gap-3.5">
              <div
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20"
                role="progressbar"
                aria-valuenow={progresoPorEstado(viajeActivo.estado)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Avance del traslado: ${etiquetaEstado(viajeActivo)}`}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progresoPorEstado(viajeActivo.estado)}%`,
                    background: "linear-gradient(90deg, #4ade80, #86efac)",
                  }}
                />
              </div>
              <span className="whitespace-nowrap text-[13px] font-bold text-[#4ade80]">
                {etiquetaEstado(viajeActivo)}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 text-[13px] font-medium text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <IconoUsuario />
                {primerNombre(viajeActivo.conductor_nombre) ?? "Por asignar"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconoReloj />
                {tiempoEstimadoTexto(viajeActivo.tiempo_estimado_horas)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconoCamara />
                {evidenciaTexto(viajeActivo)}
              </span>
            </div>

            <span
              aria-hidden="true"
              className="absolute bottom-5 right-5 flex size-10 items-center justify-center rounded-full bg-white/15"
            >
              <IconoChevron className="size-4" />
            </span>
          </Link>
        ) : (
          <div className="user-v2-card flex flex-col items-center p-5 text-center">
            <span className="user-v2-icon-well" aria-hidden="true">
              <IconoCarro className="size-8" />
            </span>
            <h2 className="user-v2-heading-2 mt-4">Sin traslados activos</h2>
            <p className="user-v2-caption user-v2-muted mt-1">Tu próximo traslado aparecerá aquí.</p>
            <Link
              id="firstTransferButton"
              href="/viajes/nuevo"
              className="user-v2-secondary-button mt-5 flex w-full items-center justify-center gap-2 px-3.5"
            >
              <span>Solicitar mi primer traslado</span>
              <IconoChevron className="size-4" />
            </Link>
          </div>
        )}
      </section>

      {/* CTA principal */}
      <Link
        id="requestTransferButton"
        href="/viajes/nuevo"
        className="flex min-h-[68px] items-center justify-center gap-3 rounded-[20px] bg-[#0b1e33] px-5 text-[17px] font-bold text-white shadow-[0_14px_28px_-10px_rgba(11,30,51,0.4)] transition-transform active:scale-[0.99]"
      >
        <IconoPlus />
        <span>Solicitar traslado</span>
        <span className="absolute right-4 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
          5 pasos
        </span>
      </Link>

      {/* Acciones rápidas */}
      <section id="quickActions" aria-labelledby="acciones-rapidas">
        <h2 id="acciones-rapidas" className="sr-only">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            id="quickActionHistory"
            href="/mis-viajes"
            className="flex items-center gap-3.5 rounded-[20px] border border-[#e9f0f8] bg-[#f7faff] p-4 transition-colors active:bg-[#eef3fa]"
          >
            <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[14px] bg-white text-[#2e5a88] shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
              <IconoHistorial />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[14px] font-bold text-[#0b1e33]">Historial</span>
              <span className="mt-0.5 text-[11px] font-medium text-[#7e8fa8]">
                {traslados.length === 1 ? "1 traslado" : `${traslados.length} traslados`}
              </span>
            </span>
          </Link>
          <Link
            id="quickActionPassport"
            href={pasaporteHref}
            className="flex items-center gap-3.5 rounded-[20px] border border-[#e9f0f8] bg-[#f7faff] p-4 transition-colors active:bg-[#eef3fa]"
          >
            <span className="flex size-[42px] shrink-0 items-center justify-center rounded-[14px] bg-white text-[#2e5a88] shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
              <IconoPortapapeles />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[14px] font-bold text-[#0b1e33]">Pasaporte</span>
              <span className="mt-0.5 text-[11px] font-medium text-[#7e8fa8]">Digital</span>
            </span>
          </Link>
        </div>
      </section>

      {conductorAsignado && (
        <ConductorAsignado
          trasladoId={conductorAsignado.trasladoId}
          estado={conductorAsignado.estado}
          nombre={conductorAsignado.nombre}
          fotoUrl={conductorFotoUrl}
        />
      )}

      {/* Confianza */}
      <section
        aria-label="Seguridad y confianza"
        className="flex items-center gap-3.5 rounded-[20px] border border-[#d5ebdf] p-[18px]"
        style={{ background: "linear-gradient(135deg, #f0f9f4 0%, #e8f5ee 100%)" }}
      >
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-white text-[#1f6b4a] shadow-[0_4px_10px_rgba(31,107,74,0.08)]"
        >
          <IconoEscudo />
        </span>
        <div>
          <h2 className="text-[13px] font-semibold leading-snug text-[#1a4a34]">
            Conductores certificados
          </h2>
          <p className="mt-0.5 text-[12px] font-medium text-[#3d7a5a]">
            Evidencia fotográfica · Seguimiento en tiempo real
          </p>
        </div>
      </section>

      {/* Recientes */}
      <section aria-labelledby="traslados-recientes">
        <div className="mb-3.5 flex items-center justify-between">
          <h2 id="traslados-recientes" className="text-[17px] font-extrabold tracking-tight text-[#0b1e33]">
            Traslados recientes
          </h2>
          <Link
            href="/mis-viajes"
            className="inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-[#2e5a88]"
          >
            Ver todos
            <IconoChevron className="size-3" />
          </Link>
        </div>
        {historial.length === 0 ? (
          <p className="user-v2-caption user-v2-muted rounded-[18px] border border-[var(--user-color-border)] bg-white px-4 py-5 text-center">
            Aún no tienes traslados anteriores. Aparecerán aquí cuando completes el primero.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {historial.map((t) => {
              const reciente = estadoReciente(t);
              const href = t.traslado_id ? `/viajes/${t.traslado_id}` : "/mis-viajes";
              return (
                <li key={t.traslado_id ?? `${t.creado_en}-${t.estado}`}>
                  <Link
                    href={href}
                    className="flex items-center gap-3.5 rounded-[18px] border border-[#eef2f7] bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-transform active:scale-[0.99]"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[#eef3fa] text-[#2e5a88]"
                    >
                      <IconoCarro />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold text-[#0b1e33]">
                        {vehiculoTitulo(t)}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] font-medium text-[#6b7c94]">
                        {ciudadOrigen(t)} → {ciudadDestino(t)}
                      </span>
                    </span>
                    <span className={`user-v2-status shrink-0 ${reciente.tono}`}>{reciente.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
