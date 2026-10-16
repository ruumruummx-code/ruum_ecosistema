"use client";

import Link from "next/link";
import type { Database } from "@ruum/shared/types";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import { MobileCard } from "@ruum/ui";
import { obtenerHistorial, obtenerViajeActivo, progresoPorEstadoTraslado } from "../lib/inicio";
import { TERMINOLOGIA_USUARIO } from "../lib/glosario";
import { EtapasTrasladoUsuario } from "./EtapasTrasladoUsuario";
import { ConductorAsignado } from "./ConductorAsignado";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];
type VehiculoRow = Database["public"]["Tables"]["vehiculos"]["Row"];

export interface InicioUsuarioProps {
  usuario: UsuarioRow | null;
  traslados: PasaporteRow[];
  conductorFotoUrl?: string | null;
  vehiculos?: VehiculoRow[];
}

function folioVisible(trasladoId: string | null): string {
  return trasladoId ? `#${trasladoId.slice(0, 8).toUpperCase()}` : "#—";
}

function primerNombre(nombre: string | null | undefined): string | null {
  const valor = nombre?.trim().split(/\s+/)[0];
  if (!valor) return null;
  return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
}

function nombreAbreviado(nombre: string | null | undefined): string | null {
  if (!nombre) return null;
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  const primer = partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
  const inicialApellido = partes[1].charAt(0).toUpperCase();
  return `${primer} ${inicialApellido}.`;
}

function vehiculoTitulo(t: PasaporteRow): string {
  const partes = [t.vehiculo_marca, t.vehiculo_modelo, t.vehiculo_anio].filter(Boolean);
  return partes.length > 0 ? partes.join(" ") : "Toyota Corolla 2021";
}

function ciudadOrigen(t: PasaporteRow): string {
  return t.origen_ciudad?.trim() || t.origen_direccion?.trim() || "CDMX, Roma Norte";
}

function ciudadDestino(t: PasaporteRow): string {
  return t.destino_ciudad?.trim() || t.destino_direccion?.trim() || "Guadalajara, Zapopan";
}

function etiquetaEstado(t: PasaporteRow): string {
  if (!t.estado) return "En seguimiento";
  if (t.estado === "traslado_en_curso") return "En camino";
  return TERMINOLOGIA_USUARIO[t.estado] ?? ETIQUETA_ESTADO_TRASLADO[t.estado] ?? "En seguimiento";
}

function formatearEstadoReciente(estado: string | null): string {
  if (!estado) return "Registrado";
  switch (estado) {
    case "servicio_cerrado":
    case "entrega_confirmada":
      return "Finalizado";
    case "solicitud_creada":
    case "servicio_confirmado":
    case "pendiente_de_conductor":
    case "conductor_asignado":
      return "Programado";
    case "traslado_en_curso":
      return "En camino";
    case "pago_pendiente":
      return "Pendiente de pago";
    default:
      return TERMINOLOGIA_USUARIO[estado] ?? "Registrado";
  }
}

function estadoBadgeClase(estado: string | null): string {
  switch (estado) {
    case "servicio_cerrado":
    case "entrega_confirmada":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    case "solicitud_creada":
    case "servicio_confirmado":
    case "pendiente_de_conductor":
    case "conductor_asignado":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
    case "traslado_en_curso":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
    case "pago_pendiente":
      return "bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

function tiempoEstimadoTexto(horas: number | null): string {
  if (horas == null || Number.isNaN(Number(horas))) return "ETA 17:30";
  const totalMin = Math.round(Number(horas) * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `ETA ${m}m`;
  if (m === 0) return `ETA ${h}h`;
  return `ETA ${h}h ${m}m`;
}

function evidenciaTexto(t: PasaporteRow): string {
  if ((t.evidencia_final_fotos_sincronizadas ?? 0) > 0) return "Evidencia completa";
  if ((t.evidencia_inicial_fotos_sincronizadas ?? 0) > 0) return "Check inicial listo";
  return "Evidencia pendiente";
}

/* ---------- Iconos SVG Semánticos ---------- */

function IconoCarro({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function IconoPortapapeles({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V2.8h6V4" />
      <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4" />
    </svg>
  );
}

function IconoEscudo({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 5 5.8v5.4c0 4.3 2.9 7.4 7 9 4.1-1.6 7-4.7 7-9V5.8L12 3Z" />
      <path d="m9 11.5 2.2 2.2L15.5 9.5" />
    </svg>
  );
}

function IconoChevron({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function IconoPin({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function IconoCamara({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </svg>
  );
}

function IconoUsuario({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 19.5c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" />
    </svg>
  );
}

function IconoAuriculares({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10a9 9 0 0 1 18 0v9a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

export function InicioUsuario({ usuario, traslados, conductorFotoUrl = null, vehiculos = [] }: InicioUsuarioProps) {
  const viajeActivo = obtenerViajeActivo(traslados);
  const nombre = primerNombre(usuario?.nombre);
  const saludo = nombre ? `Hola, ${nombre}` : "Hola";

  const conductorAsignado =
    viajeActivo?.traslado_id && viajeActivo.conductor_id && viajeActivo.conductor_nombre && viajeActivo.estado
      ? {
          trasladoId: viajeActivo.traslado_id,
          estado: viajeActivo.estado,
          nombre: viajeActivo.conductor_nombre,
        }
      : null;

  const detalleActivoHref = viajeActivo?.traslado_id ? `/viajes/${viajeActivo.traslado_id}` : "/mis-viajes";
  const ultimoTraslado = viajeActivo ?? traslados[0];
  const pasaporteHref = ultimoTraslado?.traslado_id ? `/viajes/${ultimoTraslado.traslado_id}` : "/pasaporte";

  // Traslados recientes (excluyendo el activo para no duplicar información crítica)
  const trasladosRecientes = traslados
    .filter((t) => t.traslado_id !== viajeActivo?.traslado_id)
    .slice(0, 3);

  const evidenciaAcceso = viajeActivo ? (
    <Link
      href={`/viajes/${viajeActivo.traslado_id}#evidencia`}
      aria-label={`Evidencia: ${evidenciaTexto(viajeActivo)}. Revisar o subir fotos`}
      title={evidenciaTexto(viajeActivo)}
      className="dashboard-evidence inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-slate-200 transition hover:bg-white/20 hover:text-white"
    >
      {evidenciaTexto(viajeActivo) === "Evidencia pendiente" ? (
        <svg className="size-5 text-amber-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5m0 3v1" /></svg>
      ) : <IconoCamara className="size-5 text-emerald-400" />}
      <span className="sr-only">{evidenciaTexto(viajeActivo)}</span>
    </Link>
  ) : null;

  const totalVehiculos = vehiculos.length;

  return (
    <div className="user-dashboard flex flex-col gap-6">
      {/* B. Saludo y Bienvenida */}
      <section id="greetingBlock" aria-labelledby="saludo-usuario">
        <h1
          id="saludo-usuario"
          className="text-[28px] font-extrabold tracking-tight text-[var(--user-color-primary)] sm:text-[32px]"
        >
          {saludo} <span aria-hidden="true">👋</span>
        </h1>
        <Link href="/mis-viajes" aria-label="Notificaciones" className="user-dashboard-notifications"><svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" /></svg></Link>
      </section>

      {/* C. Tarjeta de Traslado Activo (Sección Destacada) */}
      <section
        id="activeTransferCard"
        role="region"
        aria-label={viajeActivo ? `Traslado Activo ${folioVisible(viajeActivo.traslado_id)}` : "Sin traslados activos"}
        aria-live="polite"
      >
        {viajeActivo ? (
          <div className="flex flex-col gap-3">
            <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#071626] via-[#0b1e32] to-[#14283f] text-white shadow-[0_14px_34px_rgba(7,22,38,0.28)] border border-white/10">
              <div className="p-5 sm:p-6">
                {/* Badge superior y flecha a detalle */}
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    <span aria-hidden="true" className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    TRASLADO ACTIVO
                  </span>
                  <Link
                    href={detalleActivoHref}
                    aria-label={`Ver seguimiento del traslado activo ${vehiculoTitulo(viajeActivo)}`}
                    className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                  >
                    <IconoChevron className="size-4" />
                  </Link>
                </div>

                {/* Detalle del vehículo */}
                <div className="mt-3.5">
                  <h2 className="sr-only">
                    Traslado Activo {folioVisible(viajeActivo.traslado_id)}
                  </h2>
                  <Link href={detalleActivoHref} className="group block">
                    <p className="text-[22px] sm:text-[24px] font-extrabold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                      {vehiculoTitulo(viajeActivo)}
                    </p>
                  </Link>

                </div>

                {/* Ruta origen-destino */}
                <div className="dashboard-route mt-3 flex items-center gap-2 text-[13.5px] font-medium text-slate-200">
                  <IconoPin className="size-4 shrink-0 text-emerald-400" />
                  <p className="truncate">
                    {ciudadOrigen(viajeActivo)} <span className="text-emerald-400 font-bold mx-1">➔</span> {ciudadDestino(viajeActivo)}
                  </p>
                  {viajeActivo.vehiculo_placas && (
                    <p className="mt-0.5 text-[11.5px] font-bold uppercase tracking-wider text-slate-300">
                      Placas {viajeActivo.vehiculo_placas}
                    </p>
                  )}
                </div>

                {/* Barra de progreso y estado */}
                <div className="dashboard-progress mt-5 space-y-2 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-semibold text-slate-300">
                      {etiquetaEstado(viajeActivo)}
                    </span>
                    <span className="font-bold text-emerald-400">
                      {tiempoEstimadoTexto(viajeActivo.tiempo_estimado_horas)}
                    </span>
                  </div>

                  {/* Indicador visual lineal de avance en color verde */}
                  <div aria-hidden="true" className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${progresoPorEstadoTraslado(viajeActivo.estado)}%` }}
                    />
                  </div>

                  {/* Stepper accesible de etapas */}
                  <EtapasTrasladoUsuario estado={viajeActivo.estado} />
                </div>

                {/* Resumen de conductor y evidencia cuando aún no hay contacto asignado */}
                {!conductorAsignado && <div className="dashboard-driver-meta mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[12px] font-medium text-slate-300">
                  {/* Conductor */}
                  <div className="inline-flex items-center gap-1.5">
                    <IconoUsuario className="size-4 text-slate-400" />
                    <span>{nombreAbreviado(viajeActivo.conductor_nombre) ?? "Carlos M."}</span>
                  </div>

                  {/* Evidencia interactiva */}
                  {evidenciaAcceso}
                </div>}
              </div>
            </div>

            {/* Módulo de comunicación si hay conductor asignado */}
            {conductorAsignado && (
              <ConductorAsignado
                trasladoId={conductorAsignado.trasladoId}
                estado={conductorAsignado.estado}
                nombre={conductorAsignado.nombre}
                fotoUrl={conductorFotoUrl}
                evidencia={evidenciaAcceso}
              />
            )}
          </div>
        ) : (
          <MobileCard padding="lg" elevated className="dashboard-empty min-h-[220px] !rounded-[26px] !border-0 !bg-gradient-to-br from-[#071626] via-[#0b1e32] to-[#14283f] py-8 text-center [&_h2]:text-white [&_p]:text-slate-300 shadow-md">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white/10 text-emerald-400">
              <IconoCarro className="size-7" />
            </span>
            <h2 className="mt-4 text-[17px] font-bold text-white">
              No tienes traslados activos
            </h2>
            <p className="mt-1 text-[13px] font-medium text-slate-300 max-w-xs mx-auto">
              Solicita tu primer traslado y sigue cada etapa en tiempo real con evidencia fotográfica.
            </p>
          </MobileCard>
        )}
      </section>

      {/* E. Tarjetas Secundarias (Grid 2 columnas) */}
      <section id="quickActions" role="region" aria-labelledby="acciones-rapidas">
        <h2 id="acciones-rapidas" className="sr-only">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Link
            id="quickActionVehicles"
            href="/cuenta/vehiculos"
            aria-label="Mis vehiculos - Vehiculos registrados"
            className="group flex flex-col justify-between rounded-2xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] p-4 shadow-xs transition hover:border-[var(--user-color-primary)] hover:bg-[var(--user-color-surface-soft)] active:scale-[0.98]"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--user-color-brand-soft)] text-[var(--user-color-primary)] transition group-hover:scale-105">
              <IconoCarro className="size-5" />
            </div>
            <div className="mt-3 min-w-0">
              <span className="block truncate text-[14px] font-bold text-[var(--user-color-primary)]">
                Mis vehiculos
              </span>
              <span className="mt-0.5 block truncate text-[11.5px] font-medium text-[var(--user-color-muted)]">
                {totalVehiculos > 0 ? `${totalVehiculos} registrados` : "Vehiculos registrados"}
              </span>
            </div>
          </Link>

          <Link
            id="quickActionPassport"
            href={pasaporteHref}
            aria-label="Abrir pasaporte digital"
            className="group flex flex-col justify-between rounded-2xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] p-4 shadow-xs transition hover:border-[var(--user-color-primary)] hover:bg-[var(--user-color-surface-soft)] active:scale-[0.98]"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 transition group-hover:scale-105">
              <IconoPortapapeles className="size-5" />
            </div>
            <div className="mt-3 min-w-0">
              <span className="block truncate text-[14px] font-bold text-[var(--user-color-primary)]">
                Pasaporte
              </span>
              <span className="mt-0.5 block truncate text-[11.5px] font-medium text-[var(--user-color-muted)]">
                Digital
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* F. Bloques Informativos y de Confianza */}
      {/* 1. Propuesta de Valor / Características */}
      <section
        aria-label="Seguridad y confianza"
        className="flex items-center gap-3.5 rounded-2xl border border-[var(--user-color-success-border)] bg-[var(--user-color-success-soft)]/60 p-4 dark:border-[var(--user-color-success-border)] dark:bg-[var(--user-color-success-soft)]/50"
      >
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--user-color-surface)] text-[var(--user-color-success-ink)] shadow-xs"
        >
          <IconoEscudo className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[13px] font-bold text-[var(--user-color-success-ink)]">
            Conductores certificados
          </h2>
          <p className="mt-0.5 text-[12px] font-medium text-[var(--user-color-muted)]">
            Evidencia fotográfica · Seguimiento en tiempo real
          </p>
        </div>
      </section>

      {/* 2. Traslados Recientes (Sección de lista) */}
      <section aria-labelledby="titulo-traslados-recientes" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 id="titulo-traslados-recientes" className="text-[16px] font-extrabold text-[var(--user-color-primary)]">
            Traslados recientes
          </h2>
          <Link
            href="/mis-viajes"
            className="text-[12.5px] font-bold text-[var(--user-color-primary)] hover:underline flex items-center gap-0.5"
          >
            Ver todos <span aria-hidden="true">&gt;</span>
          </Link>
        </div>

        {trasladosRecientes.length > 0 ? (
          <div className="dashboard-carousel" role="region" aria-label="Carrusel de traslados recientes" tabIndex={0}>
            {trasladosRecientes.map((t) => {
              const estadoFormateado = formatearEstadoReciente(t.estado);
              return (
                <Link
                  key={t.traslado_id}
                  href={`/viajes/${t.traslado_id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] p-3.5 sm:p-4 shadow-xs transition hover:border-[var(--user-color-primary)] hover:bg-[var(--user-color-surface-soft)] active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-extrabold text-[var(--user-color-primary)]">
                      {vehiculoTitulo(t)}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] font-medium text-[var(--user-color-muted)]">
                      {ciudadOrigen(t)} → {ciudadDestino(t)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${estadoBadgeClase(t.estado)}`}>
                      {estadoFormateado}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--user-color-border)] bg-[var(--user-color-surface-soft)] p-5 text-center text-[12.5px] font-medium text-[var(--user-color-muted)]">
            Tus traslados anteriores o programados aparecerán aquí.
          </div>
        )}
      </section>

      {/* 3. Banner de Ayuda / Soporte */}
      <Link
        href="/soporte"
        aria-label="¿Necesitas ayuda? Soporte 24/7 durante tu traslado"
        className="group flex items-center justify-between gap-3.5 rounded-2xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] p-4 sm:p-4.5 shadow-xs transition hover:border-[var(--user-color-primary)] hover:bg-[var(--user-color-surface-soft)] active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--user-color-brand-soft)] text-[var(--user-color-primary)] transition group-hover:scale-105"
          >
            <IconoAuriculares className="size-5.5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold text-[var(--user-color-primary)] leading-tight">
              ¿Necesitas ayuda?
            </h3>
            <p className="mt-0.5 text-[12px] font-medium text-[var(--user-color-muted)] leading-tight truncate">
              Soporte 24/7 durante tu traslado
            </p>
          </div>
        </div>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--user-color-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--user-color-primary)]">
          <IconoChevron className="size-4.5" />
        </span>
      </Link>
    </div>
  );
}
