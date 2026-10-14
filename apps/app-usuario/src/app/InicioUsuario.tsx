"use client";

import Link from"next/link";
import type { Database } from"@ruum/shared/types";
import { ETIQUETA_ESTADO_TRASLADO } from"@ruum/shared/states";
import {
  MobileCard,
  MobileBadge,
  MobileButton,
} from"@ruum/ui";
import { obtenerHistorial, obtenerViajeActivo } from"../lib/inicio";
import { TERMINOLOGIA_USUARIO } from"../lib/glosario";
import { EtapasTrasladoUsuario } from"./EtapasTrasladoUsuario";
import { ConductorAsignado } from"./ConductorAsignado";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];

export interface InicioUsuarioProps {
  usuario: UsuarioRow | null;
  traslados: PasaporteRow[];
  conductorFotoUrl?: string | null;
}

function folioVisible(trasladoId: string | null): string {
  return trasladoId ?`#${trasladoId.slice(0, 8).toUpperCase()}` :"#—";
}

function primerNombre(nombre: string | null | undefined): string | null {
  const valor = nombre?.trim().split(/\s+/)[0];
  if (!valor) return null;
  return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
}

function vehiculoTitulo(t: PasaporteRow): string {
  const partes = [t.vehiculo_marca, t.vehiculo_modelo, t.vehiculo_anio].filter(Boolean);
  return partes.length > 0 ? partes.join(" ") :"Vehículo";
}

function ciudadOrigen(t: PasaporteRow): string {
  return t.origen_ciudad?.trim() || t.origen_direccion?.trim() ||"Origen";
}

function ciudadDestino(t: PasaporteRow): string {
  return t.destino_ciudad?.trim() || t.destino_direccion?.trim() ||"Destino";
}

function etiquetaEstado(t: PasaporteRow): string {
  if (!t.estado) return"En seguimiento";
  return TERMINOLOGIA_USUARIO[t.estado] ?? ETIQUETA_ESTADO_TRASLADO[t.estado] ??"En seguimiento";
}

function tiempoEstimadoTexto(horas: number | null): string {
  if (horas == null || Number.isNaN(Number(horas))) return"ETA —";
  const totalMin = Math.round(Number(horas) * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return`${m}m est.`;
  if (m === 0) return`${h}h est.`;
  return`${h}h ${m}m`;
}

function evidenciaTexto(t: PasaporteRow): string {
  if ((t.evidencia_final_fotos_sincronizadas ?? 0) > 0) return"Evidencia completa";
  if ((t.evidencia_inicial_fotos_sincronizadas ?? 0) > 0) return"Check inicial listo";
  return"Evidencia pendiente";
}

function estadoReciente(t: PasaporteRow): { label: string; variante:"exito" |"en_ruta" |"pendiente" |"error" |"neutro" } {
  switch (t.estado) {
    case"servicio_cerrado":
    case"entrega_confirmada":
    case"pago_completado":
    case"reclamo_resuelto":
    case"disputa_resuelta":
      return { label:"Finalizado", variante:"exito" };
    case"servicio_cancelado":
    case"traslado_fallido":
      return { label:"Cancelado", variante:"error" };
    case"solicitud_creada":
    case"documentacion_pendiente":
    case"documentacion_en_revision":
    case"documentacion_validada":
    case"cotizacion_generada":
    case"cotizacion_aceptada":
    case"servicio_confirmado":
    case"pendiente_de_conductor":
    case"pago_pendiente":
      return { label:"Programado", variante:"pendiente" };
    default:
      return { label: etiquetaEstado(t), variante:"en_ruta" };
  }
}

/* ---------- Iconos SVG Compartidos ---------- */

function IconoCarro({ className ="size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function IconoPortapapeles({ className ="size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V2.8h6V4" />
      <path d="M8.5 10h7M8.5 13.5h7M8.5 17h4" />
    </svg>
  );
}

function IconoEscudo({ className ="size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 5 5.8v5.4c0 4.3 2.9 7.4 7 9 4.1-1.6 7-4.7 7-9V5.8L12 3Z" />
      <path d="m9 11.5 2.2 2.2L15.5 9.5" />
    </svg>
  );
}

function IconoChevron({ className ="size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function IconoPlus({ className ="size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconoPin({ className ="size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function IconoFlecha({ className ="size-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

function IconoReloj({ className ="size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function IconoCamara({ className ="size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </svg>
  );
}

function IconoUsuario({ className ="size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 19.5c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6" />
    </svg>
  );
}

export function InicioUsuario({ usuario, traslados, conductorFotoUrl = null }: InicioUsuarioProps) {
  const viajeActivo = obtenerViajeActivo(traslados);
  const nombre = primerNombre(usuario?.nombre);
  const saludo = nombre ?`Hola, ${nombre}` :"Hola";

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
    .slice(0, 3);

  const detalleActivoHref = viajeActivo?.traslado_id ?`/viajes/${viajeActivo.traslado_id}` :"/mis-viajes";
  const ultimoTraslado = viajeActivo ?? traslados[0];
  const pasaporteHref = ultimoTraslado?.traslado_id ?`/viajes/${ultimoTraslado.traslado_id}` :"/pasaporte";

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Saludo y contexto */}
      <section id="greetingBlock" aria-labelledby="saludo-usuario">
        <h1
          id="saludo-usuario"
          className="text-[24px] font-extrabold tracking-tight text-[var(--user-color-primary)]  sm:text-[26px]"
        >
          {saludo}
        </h1>
        <p className="mt-1 text-[13.5px] font-medium text-[var(--user-color-muted)]">
          ¿A dónde movemos tu auto hoy?
        </p>
      </section>

      {/* 2. Traslado Activo — Tarjeta tipo"Boarding Pass" */}
      <section
        id="activeTransferCard"
        role="region"
        aria-label={viajeActivo ?`Traslado Activo ${folioVisible(viajeActivo.traslado_id)}` :"Sin traslados activos"}
        aria-live="polite"
      >
        {viajeActivo ? (
          <>
          <Link
            href={detalleActivoHref}
            aria-label={`Ver seguimiento del traslado activo ${vehiculoTitulo(viajeActivo)}`}
            className="group relative block overflow-hidden rounded-[24px] border border-[var(--user-color-border)] bg-[var(--user-color-surface)] text-[var(--user-color-primary)] shadow-[0_10px_28px_rgba(10,35,66,0.08)] transition hover:shadow-lg active:scale-[0.99]"
          >
            {/* Cabecera oscura de la tarjeta */}
            <div className="bg-[var(--user-hero-surface)] p-5 text-[var(--user-hero-text)] dark:bg-[var(--user-color-background)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <MobileBadge variante={estadoReciente(viajeActivo).variante} texto={etiquetaEstado(viajeActivo)} punto size="sm" />
              </div>

              <div className="mt-3 flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-bold text-white/80">
                    Traslado Activo {folioVisible(viajeActivo.traslado_id)}
                  </h2>
                  <p className="mt-0.5 truncate text-[22px] font-extrabold tracking-tight">
                    {vehiculoTitulo(viajeActivo)}
                  </p>
                  {viajeActivo.vehiculo_placas && (
                    <p className="mt-1 text-[12px] font-bold uppercase tracking-wider text-[var(--user-hero-muted)]">
                      Placas {viajeActivo.vehiculo_placas}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <span className="block text-[11px] font-semibold uppercase text-[var(--user-hero-muted)]">
                    ETA
                  </span>
                  <span className="text-[18px] font-bold text-[var(--user-color-success-ink)]">
                    {tiempoEstimadoTexto(viajeActivo.tiempo_estimado_horas)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cuerpo de la tarjeta */}
            <div className="p-5 space-y-4">
              {/* Ruta origen / destino */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <span className="size-2.5 rounded-full bg-[var(--user-color-primary)] dark:bg-[var(--user-color-action)]" />
                  <span className="w-0.5 h-6 bg-[var(--user-color-border)] dark:bg-[var(--user-color-border)]" />
                  <span className="size-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                </div>
                <div className="flex-1 space-y-1.5 text-[13px]">
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--user-color-muted)]  uppercase block">
                      Origen
                    </span>
                    <p className="font-semibold text-[var(--user-color-primary)]  truncate">
                      {ciudadOrigen(viajeActivo)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--user-color-muted)]  uppercase block">
                      Destino
                    </span>
                    <p className="font-semibold text-[var(--user-color-primary)]  truncate">
                      {ciudadDestino(viajeActivo)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="space-y-1.5 pt-1 border-t border-[var(--user-color-border)]">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-[var(--user-color-muted)]">
                    Estado
                  </span>
                  <span className="font-bold text-[var(--user-color-action)]">
                    {etiquetaEstado(viajeActivo)}
                  </span>
                </div>
                <EtapasTrasladoUsuario estado={viajeActivo.estado} />
              </div>

              {/* Metadatos inferiores */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[12.5px] font-medium text-[var(--user-color-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <IconoUsuario />
                  {primerNombre(viajeActivo.conductor_nombre) ??"Por asignar"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <IconoCamara />
                  {evidenciaTexto(viajeActivo)}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[var(--user-color-primary)]">
                  Ver pasaporte <IconoChevron className="size-3.5" />
                </span>
              </div>
            </div>
          </Link>
      {/* 5. Conductor Asignado (Módulo de comunicación si hay asignado) */}
      {conductorAsignado && (
        <ConductorAsignado
          trasladoId={conductorAsignado.trasladoId}
          estado={conductorAsignado.estado}
          nombre={conductorAsignado.nombre}
          fotoUrl={conductorFotoUrl}
        />
      )}

          </>
        ) : (
          <MobileCard padding="lg" elevated className="text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--user-color-brand-soft)] text-[var(--user-color-action)]">
              <IconoCarro className="size-7" />
            </span>
            <h2 className="mt-4 text-[17px] font-bold text-[var(--user-color-primary)]">
              Sin traslados activos
            </h2>
            <p className="mt-1 text-[13px] font-medium text-[var(--user-color-muted)]">
              Tu próximo traslado y su seguimiento en vivo aparecerán aquí.
            </p>
          </MobileCard>
        )}
      </section>

      {/* 3. CTA Principal Móvil (52px estándar) */}
      <div>
        <Link
          id="requestTransferButton"
          href="/viajes/nuevo"
          className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--user-color-primary)] px-5 py-3.5 text-[15.5px] font-bold text-white shadow-[0_12px_24px_-8px_rgba(10,35,66,0.35)] transition hover:bg-[var(--user-color-action-hover)] active:scale-[0.98] dark:bg-[var(--user-color-action)] dark:text-[var(--user-color-on-action)] dark:hover:bg-[var(--user-color-action-hover)]"
        >
          <IconoPlus />
          <span>Solicitar traslado</span>
        </Link>
      </div>

      {/* 4. Acciones Rápidas (Garage / Pasaporte) */}
      <section id="quickActions" role="region" aria-labelledby="acciones-rapidas">
        <h2 id="acciones-rapidas" className="sr-only">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            id="quickActionVehicles"
            href="/cuenta/vehiculos"
            className="flex items-center gap-3 rounded-2xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] p-3.5 shadow-xs transition hover:bg-[var(--user-color-surface-soft)] active:scale-[0.98]"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--user-color-brand-soft)] text-[var(--user-color-action)]">
              <IconoCarro />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13.5px] font-bold text-[var(--user-color-primary)]">
                Mis vehículos
              </span>
              <span className="mt-0.5 truncate text-[11px] font-medium text-[var(--user-color-muted)]">
                Garage y placas
              </span>
            </span>
          </Link>

          <Link
            id="quickActionPassport"
            href={pasaporteHref}
            aria-label="Abrir pasaporte digital"
            className="flex items-center gap-3 rounded-2xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] p-3.5 shadow-xs transition hover:bg-[var(--user-color-surface-soft)] active:scale-[0.98]"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--user-color-success-soft)] text-[var(--user-color-success-ink)] dark:bg-[var(--user-color-success-soft)] dark:text-[var(--user-color-success-ink)]">
              <IconoPortapapeles />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13.5px] font-bold text-[var(--user-color-primary)]">
                Pasaporte
              </span>
              <span className="mt-0.5 truncate text-[11px] font-medium text-[var(--user-color-muted)]">
                Expediente digital
              </span>
            </span>
          </Link>
        </div>
      </section>

      {/* 6. Seguridad y Confianza Ruum */}
      <section
        aria-label="Seguridad y confianza"
        className="flex items-center gap-3.5 rounded-2xl border border-[var(--user-color-success-border)] bg-[var(--user-color-success-soft)]/60 p-4 dark:border-[var(--user-color-success-border)] dark:bg-[var(--user-color-success-soft)]/50"
      >
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--user-color-surface)] text-[var(--user-color-success-ink)] shadow-xs  dark:text-[var(--user-color-success-ink)]"
        >
          <IconoEscudo />
        </span>
        <div className="min-w-0">
          <h2 className="text-[13px] font-bold text-[var(--user-color-success-ink)] dark:text-[var(--user-color-success-ink)]">
            Identidad verificada
          </h2>
          <p className="mt-0.5 text-[12px] font-medium text-[var(--user-color-muted)]">
            Evidencia fotográfica y trazabilidad en cada kilómetro
          </p>
        </div>
      </section>

      {/* 7. Traslados Recientes */}
      <section aria-labelledby="traslados-recientes">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="traslados-recientes"
            className="text-[16px] font-bold tracking-tight text-[var(--user-color-primary)]"
          >
            Traslados recientes
          </h2>
          <Link
            href="/mis-viajes"
            className="inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-[var(--user-color-action)] hover:underline"
          >
            Ver todos
            <IconoChevron className="size-3.5" />
          </Link>
        </div>

        {historial.length === 0 ? (
          <p className="rounded-2xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] px-4 py-5 text-center text-[13px] font-medium text-[var(--user-color-muted)]">
            Aún no tienes traslados anteriores. Aparecerán aquí cuando completes el primero.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {historial.map((t) => {
              const reciente = estadoReciente(t);
              const href = t.traslado_id ?`/viajes/${t.traslado_id}` :"/mis-viajes";
              return (
                <Link
                  key={t.traslado_id ??`${t.creado_en}-${t.estado}`}
                  href={href}
                  className="flex items-center gap-3.5 rounded-2xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] p-3.5 shadow-xs transition hover:bg-[var(--user-color-surface-soft)] active:scale-[0.99]"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[var(--user-color-brand-soft)] text-[var(--user-color-action)]"
                  >
                    <IconoCarro />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-[var(--user-color-primary)]">
                      {vehiculoTitulo(t)}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] font-medium text-[var(--user-color-muted)]">
                      {ciudadOrigen(t)} → {ciudadDestino(t)}
                    </p>
                  </div>
                  <MobileBadge
                    variante={reciente.variante}
                    texto={reciente.label}
                    size="sm"
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
