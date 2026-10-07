"use client";

import Link from "next/link";
import type { Database } from "@ruum/shared/types";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import { obtenerViajeActivo } from "../lib/inicio";
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

function IconoPortapapeles({ className = "size-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="7" y="5" width="18" height="23" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 5.5V4h8v1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 11h10M11 15h10M11 19h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="23.5" cy="22.5" r="6" fill="var(--user-color-brand)" stroke="var(--user-color-surface)" strokeWidth="1.5" />
      <path d="m20.8 22.5 1.8 1.8 3.4-3.8" stroke="var(--user-color-surface)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoHistorial({ className = "size-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 10.5V16l4 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoEscudo({ className = "size-5" }: { className?: string }) {
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

function IlustracionRutaVacia() {
  return (
    <svg
      className="user-v2-empty-illustration"
      viewBox="0 0 320 148"
      role="img"
      aria-label="Ilustración de un vehículo listo para iniciar una ruta en el mapa"
    >
      <rect x="8" y="8" width="304" height="132" rx="20" className="user-v2-empty-illustration__bg" />
      <path
        d="M44 108 C 96 108, 104 44, 160 52 S 224 116, 276 60"
        fill="none"
        stroke="var(--user-color-brand)"
        strokeWidth="3"
        strokeDasharray="8 7"
        strokeLinecap="round"
      />
      <g>
        <circle cx="44" cy="108" r="12" className="user-v2-empty-illustration__pin" />
        <circle cx="44" cy="108" r="4.5" fill="#fff" />
      </g>
      <g>
        <circle cx="276" cy="60" r="12" className="user-v2-empty-illustration__pin" />
        <path d="m271.5 60 3.2 3.2 6-6.8" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="translate(128 44)">
        <rect x="0" y="18" width="64" height="34" rx="10" className="user-v2-empty-illustration__car" />
        <rect x="10" y="8" width="44" height="22" rx="8" className="user-v2-empty-illustration__car" />
        <rect x="15" y="12" width="34" height="12" rx="5" fill="#fff" opacity="0.85" />
        <circle cx="16" cy="52" r="7" fill="var(--user-color-primary)" />
        <circle cx="48" cy="52" r="7" fill="var(--user-color-primary)" />
        <circle cx="16" cy="52" r="2.4" fill="#fff" />
        <circle cx="48" cy="52" r="2.4" fill="#fff" />
      </g>
    </svg>
  );
}

export function InicioUsuario({ usuario, traslados, conductorFotoUrl = null }: InicioUsuarioProps) {
  const viajeActivo = obtenerViajeActivo(traslados);
  const nombre = primerNombre(usuario?.nombre);
  const saludo = nombre ? `Hola, ${nombre}` : "Hola";
  const conductorAsignado = viajeActivo?.traslado_id && viajeActivo.conductor_id && viajeActivo.conductor_nombre && viajeActivo.estado
    ? {
        trasladoId: viajeActivo.traslado_id,
        estado: viajeActivo.estado,
        nombre: viajeActivo.conductor_nombre,
      }
    : null;

  return (
    <div className="user-v2-screen">
      <section id="greetingBlock" aria-labelledby="saludo-usuario" className="text-center">
        <p className="user-v2-caption user-v2-muted font-semibold uppercase tracking-widest">{nombre ? "Panel principal" : saludo}</p>
        <h1 id="saludo-usuario" className="user-v2-heading-1 mt-2 text-balance">
          Mueve tu auto sin soltar el control.
        </h1>
        <p className="user-v2-body user-v2-muted mt-2">Solicita tu traslado, sigue su estatus y conserva la evidencia.</p>
      </section>

      <Link id="requestTransferButton" href="/viajes/nuevo" className="user-v2-primary-button group flex items-center justify-between px-4">
        <span className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-white text-[var(--user-color-primary)]">
            <IconoCarro className="size-6" />
          </span>
          <span>Solicitar traslado</span>
        </span>
        <IconoChevron className="size-6 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <section id="activeTransferCard" aria-labelledby="traslados-activos" aria-live="polite" className="user-v2-card p-5">
        {viajeActivo ? (
          <>
            <div className="flex items-center gap-4">
              <span className="user-v2-icon-well">
                <IconoCarro className="size-8" />
              </span>
              <div className="min-w-0">
                <h2 id="traslados-activos" className="user-v2-card-title">
                  Traslado Activo {folioVisible(viajeActivo.traslado_id)}
                </h2>
                <span className="mt-2 inline-flex max-w-full items-center rounded-full bg-[var(--user-color-brand)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--user-color-brand-dark)]">
                  {viajeActivo.estado
                    ? TERMINOLOGIA_USUARIO[viajeActivo.estado] ?? ETIQUETA_ESTADO_TRASLADO[viajeActivo.estado]
                    : "En seguimiento"}
                </span>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[var(--user-color-border)] pt-4">
              <div>
                <dt className="user-v2-caption user-v2-muted">Marca</dt>
                <dd className="mt-0.5 text-sm font-semibold text-[var(--user-color-primary)]">
                  {viajeActivo.vehiculo_marca ?? "Pendiente"}
                </dd>
              </div>
              <div>
                <dt className="user-v2-caption user-v2-muted">Modelo</dt>
                <dd className="mt-0.5 text-sm font-semibold text-[var(--user-color-primary)]">
                  {viajeActivo.vehiculo_modelo ?? "Pendiente"}
                </dd>
              </div>
              <div>
                <dt className="user-v2-caption user-v2-muted">Año</dt>
                <dd className="mt-0.5 text-sm font-semibold text-[var(--user-color-primary)]">
                  {viajeActivo.vehiculo_anio ?? "Pendiente"}
                </dd>
              </div>
              <div>
                <dt className="user-v2-caption user-v2-muted">Placas</dt>
                <dd className="mt-0.5 text-sm font-semibold uppercase text-[var(--user-color-primary)]">
                  {viajeActivo.vehiculo_placas ?? "Pendientes"}
                </dd>
              </div>
            </dl>
            <Link
              href={viajeActivo.traslado_id ? `/viajes/${viajeActivo.traslado_id}` : "/mis-viajes"}
              className="user-v2-secondary-button group mt-5 flex min-h-[52px] items-center justify-between px-3.5"
            >
              <span>
                Ver seguimiento
                {viajeActivo.vehiculo_tipo && ETIQUETA_TIPO_VEHICULO[viajeActivo.vehiculo_tipo] ? (
                  <span className="sr-only"> — {ETIQUETA_TIPO_VEHICULO[viajeActivo.vehiculo_tipo]}</span>
                ) : null}
              </span>
              <IconoChevron className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/soporte"
              aria-label="Contactar a soporte sobre tu traslado activo"
              className="user-v2-ghost-button mt-2 flex min-h-11 items-center justify-center gap-2 px-3.5 text-center"
            >
              <span>¿Necesitas ayuda con este traslado? Contactar a soporte</span>
            </Link>
          </>
        ) : (
          <div className="user-v2-empty flex flex-col items-center text-center">
            <IlustracionRutaVacia />
            <h2 id="traslados-activos" className="user-v2-heading-2 mt-4">Sin traslados activos</h2>
            <p className="user-v2-caption user-v2-muted mt-1 max-w-[36ch]">
              Tu vehículo listo, ruta trazada. Cuando solicites un traslado aparecerá aquí con su seguimiento.
            </p>
            {/* CTA unificado: un solo botón primario "Solicitar traslado" por vista. */}
            <Link id="requestTransferButton" href="/viajes/nuevo" className="user-v2-primary-button group mt-5 flex min-h-[52px] w-full items-center justify-between px-4">
              <span className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-white text-[var(--user-color-primary)]">
                  <IconoCarro className="size-6" />
                </span>
                <span>Solicitar traslado</span>
              </span>
              <IconoChevron className="size-6 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </section>

      <div className="user-v2-home-grid">
        <section id="quickActions" aria-labelledby="acciones-rapidas">
          <h2 id="acciones-rapidas" className="user-v2-heading-2">Acciones rápidas</h2>
          <div className="user-v2-quick-grid mt-3 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
            <Link
              id="quickActionHistory"
              href="/mis-viajes"
              aria-label="Ver historial: activos, programados, finalizados y cancelados"
              className="user-v2-card user-v2-card-interactive group flex min-h-[144px] min-w-[44px] flex-col p-4"
            >
              <span className="user-v2-icon-well size-11">
                <IconoHistorial className="size-7" />
              </span>
              <span className="mt-auto block pt-3">
                <span className="user-v2-card-title block">Ver historial</span>
                <span className="user-v2-caption user-v2-muted mt-1 block">Activos, programados, finalizados y cancelados.</span>
              </span>
              <span className="mt-2 flex justify-end text-[var(--user-color-brand-dark)] transition-transform group-hover:translate-x-0.5" aria-hidden="true"><IconoChevron className="size-4" /></span>
            </Link>

            <Link
              id="quickActionPassport"
              href="/pasaporte"
              aria-label="Pasaporte Digital: fotos, folios, firmas y evidencia de cada entrega"
              className="user-v2-card user-v2-card-interactive group flex min-h-[144px] min-w-[44px] flex-col p-4"
            >
              <span className="user-v2-icon-well size-11 text-[var(--user-color-brand-dark)]">
                <IconoPortapapeles className="size-7" />
              </span>
              <span className="mt-auto block pt-3">
                <span className="user-v2-card-title block">Pasaporte Digital</span>
                <span className="user-v2-caption user-v2-muted mt-1 block">Fotos, folios, firmas y evidencia de cada entrega.</span>
              </span>
              <span className="mt-2 flex justify-end text-[var(--user-color-brand-dark)] transition-transform group-hover:translate-x-0.5" aria-hidden="true"><IconoChevron className="size-4" /></span>
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

        <section aria-label="Seguridad y confianza" className="user-v2-card user-v2-trust flex items-start gap-3 p-4">
          <span className="user-v2-icon-well size-11 shrink-0" aria-hidden="true">
            <IconoEscudo className="size-7" />
          </span>
          <div>
            <h2 className="user-v2-card-title">Traslados con evidencia y seguimiento</h2>
            <p className="user-v2-caption user-v2-muted mt-1">
              Conductores certificados, evidencia fotográfica y seguimiento del estatus en todo momento.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
