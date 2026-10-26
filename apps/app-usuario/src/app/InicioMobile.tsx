"use client";

import Link from "next/link";
import type { Database } from "@ruum/shared/types";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import { indiceEtapaActual } from "@ruum/ui";
import { obtenerViajeActivo } from "../lib/inicio";
import { TERMINOLOGIA_USUARIO } from "../lib/glosario";
import { ConductorAsignado } from "./ConductorAsignado";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];
type VehiculoRow = Database["public"]["Tables"]["vehiculos"]["Row"];

export interface InicioMobileProps {
  usuario: UsuarioRow | null;
  traslados: PasaporteRow[];
  conductorFotoUrl?: string | null;
  vehiculos?: VehiculoRow[];
}

function tiempoEstimadoTexto(horas: number | null) {
  if (horas == null || !Number.isFinite(horas) || horas < 0) return "ETA por confirmar";
  const total = Math.round(horas * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `ETA ${h ? `${h}h ` : ""}${m}m`;
}

function Chevron({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function IconoInicio({ tipo }: { tipo: "auto" | "documento" | "soporte" | "ubicacion" | "usuario" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {tipo === "auto" && (
        <>
          <path d="M5 11l1.5-4.5h11L19 11M4 11h16v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H10a2 2 0 0 1-4 0H5a1 1 0 0 1-1-1v-6z" />
          <circle cx="7.5" cy="17.5" r="1.5" />
          <circle cx="16.5" cy="17.5" r="1.5" />
        </>
      )}
      {tipo === "documento" && (
        <>
          <rect x="4" y="3" width="16" height="18" rx="3" />
          <circle cx="12" cy="10" r="3" />
          <path d="M8 17h8" />
        </>
      )}
      {tipo === "soporte" && (
        <>
          <path d="M3 14h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z" />
          <path d="M21 14h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1Z" />
          <path d="M4 14V11a8 8 0 0 1 16 0v3" />
        </>
      )}
      {tipo === "ubicacion" && (
        <>
          <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      )}
      {tipo === "usuario" && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
        </>
      )}
    </svg>
  );
}

function IlustracionVehiculoRuta() {
  return (
    <svg viewBox="0 0 160 130" fill="none" className="h-full w-full max-w-[145px]" aria-hidden="true">
      {/* Siluetas sutiles de la ciudad de fondo */}
      <rect x="68" y="44" width="22" height="40" rx="2" fill="#1b2d42" fillOpacity="0.7" />
      <rect x="94" y="32" width="28" height="52" rx="2" fill="#16273b" fillOpacity="0.8" />
      <rect x="126" y="50" width="18" height="34" rx="2" fill="#1b2d42" fillOpacity="0.6" />
      {/* Nubes tenues */}
      <ellipse cx="40" cy="42" rx="14" ry="5" fill="#1e334a" fillOpacity="0.5" />
      <ellipse cx="130" cy="38" rx="16" ry="6" fill="#1e334a" fillOpacity="0.5" />

      {/* Trayectoria curva punteada en cian oficial */}
      <path
        d="M8 94 C 35 94, 52 80, 80 74 C 104 69, 114 54, 114 42"
        stroke="#00D1D1"
        strokeWidth="2.5"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />

      {/* Vehículo en perspectiva frontal */}
      <g transform="translate(64, 70)">
        <ellipse cx="28" cy="31" rx="28" ry="6" fill="#050d18" fillOpacity="0.8" />
        <path d="M12 16 L17 6 C18 4 20 3 22 3 L34 3 C36 3 38 4 39 6 L44 16 Z" fill="#2d435d" />
        <path d="M15 14 L19 6 L37 6 L41 14 Z" fill="#0d1b2a" />
        <rect x="5" y="14" width="46" height="14" rx="4" fill="#627b97" />
        <rect x="8" y="24" width="40" height="4" rx="2" fill="#1c2c3e" />
        <ellipse cx="11" cy="18" rx="3.5" ry="2" fill="#e2f7ff" />
        <ellipse cx="45" cy="18" rx="3.5" ry="2" fill="#e2f7ff" />
        <rect x="16" y="22" width="24" height="2" rx="1" fill="#24374c" />
      </g>

      {/* Pin de ubicación con resplandor mint/teal */}
      <g transform="translate(98, 12)">
        <ellipse cx="14" cy="34" rx="7" ry="2.5" fill="#000000" fillOpacity="0.3" />
        <circle cx="14" cy="15" r="14" fill="#00D1D1" fillOpacity="0.2" />
        <path
          d="M14 34 C14 34 26 21 26 14 C26 7.37 20.63 2 14 2 C7.37 2 2 7.37 2 14 C2 21 14 34 14 34 Z"
          fill="#2ee6b6"
        />
        <circle cx="14" cy="14" r="5" fill="#0d1b2a" />
      </g>
    </svg>
  );
}

function ProgresoInicio({ estado }: { estado: PasaporteRow["estado"] }) {
  const etapa = estado ? indiceEtapaActual(estado) : -1;
  const previo = etapa < 3 || estado === "pago_pendiente" || estado === "pago_completado";
  const actual = previo ? -1 : estado === "entrega_confirmada" ? 3 : etapa >= 5 || estado === "llegada_a_destino" ? 2 : etapa === 4 ? 1 : 0;
  return (
    <ol className="home-stepper" aria-label="Progreso del traslado">
      {["Recolección", "En tránsito", "Entrega"].map((nombre, i) => {
        const completado = i < actual;
        const current = i === actual;
        const situacion = completado ? "Completada" : current ? "Actual" : "Pendiente";
        return (
          <li key={nombre} className={completado ? "is-complete" : current ? "is-current" : "is-pending"} aria-current={current ? "step" : undefined}>
            <span className="home-step-dot" aria-hidden="true">
              {completado && (
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m5 10 3 3 7-7" />
                </svg>
              )}
            </span>
            <span className="home-step-name">{i + 1}. {nombre}</span>
            <span className="home-step-status">{situacion}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function InicioMobile({ usuario, traslados, conductorFotoUrl = null, vehiculos = [] }: InicioMobileProps) {
  const viaje = obtenerViajeActivo(traslados);
  const primerNombre = usuario?.nombre?.trim().split(/\s+/)[0];
  const nombre = primerNombre ? primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1).toLowerCase() : null;
  const detalle = viaje?.traslado_id ? `/viajes/${viaje.traslado_id}` : "/mis-viajes";
  const ultimo = viaje ?? [...traslados].sort((a, b) => (b.creado_en ?? "").localeCompare(a.creado_en ?? ""))[0];
  const pasaporte = ultimo?.traslado_id ? `/viajes/${ultimo.traslado_id}` : "/pasaporte";
  const vehiculo = viaje ? [viaje.vehiculo_marca, viaje.vehiculo_modelo, viaje.vehiculo_anio].filter(Boolean).join(" ") || "Vehículo por confirmar" : "";
  const estado = viaje?.estado ? TERMINOLOGIA_USUARIO[viaje.estado] ?? ETIQUETA_ESTADO_TRASLADO[viaje.estado] : "En seguimiento";
  const conductor = viaje?.traslado_id && viaje.conductor_id && viaje.conductor_nombre && viaje.estado
    ? { trasladoId: viaje.traslado_id, estado: viaje.estado, nombre: viaje.conductor_nombre }
    : null;

  return (
    <div className="user-dashboard">
      {/* Saludo de bienvenida con jerarquía y espaciado optimizados */}
      <section id="greetingBlock" aria-labelledby="saludo-usuario" className="home-greeting">
        <h1 id="saludo-usuario">{nombre ? `Hola, ${nombre}` : "Hola"}</h1>
        <p>Aquí va el estatus de tu traslado.</p>
      </section>

      {/* Card de Estatus Principal */}
      <section
        id="activeTransferCard"
        aria-label={viaje ? `Traslado Activo #${viaje.traslado_id?.slice(0, 8).toUpperCase() ?? "—"}` : "Sin traslados activos"}
        className="home-transfer"
        aria-live="polite"
      >
        {viaje ? (
          <>
            <div className="home-transfer-top">
              <span className="home-active-chip">
                <span aria-hidden="true" />TRASLADO ACTIVO
              </span>
              <Link href={detalle} aria-label={`Ver seguimiento del traslado activo ${vehiculo}`} className="home-detail-button">
                <Chevron />
              </Link>
            </div>
            <Link href={detalle} className="home-vehicle-link">
              <h2 title={vehiculo}>{vehiculo}</h2>
            </Link>
            <div className="home-route-row">
              <p className="home-route" title={`${viaje.origen_ciudad || viaje.origen_direccion || "Origen por confirmar"} → ${viaje.destino_ciudad || viaje.destino_direccion || "Destino por confirmar"}`}>
                <IconoInicio tipo="ubicacion" />
                <span>
                  {viaje.origen_ciudad || viaje.origen_direccion || "Origen por confirmar"} <span aria-hidden="true">➜</span>
                  <span className="sr-only"> hacia </span> {viaje.destino_ciudad || viaje.destino_direccion || "Destino por confirmar"}
                </span>
              </p>
              <span className="home-plates" title={viaje.vehiculo_placas || "Sin placas"}>
                Placas {viaje.vehiculo_placas || "por confirmar"}
              </span>
            </div>
            <div className="home-progress">
              <div className="home-progress-heading">
                <span>{estado}</span>
                <span title="Duración estimada del trayecto">{tiempoEstimadoTexto(viaje.tiempo_estimado_horas)}</span>
              </div>
              <ProgresoInicio estado={viaje.estado} />
            </div>
            {conductor ? (
              <ConductorAsignado trasladoId={conductor.trasladoId} estado={conductor.estado} nombre={conductor.nombre} fotoUrl={conductorFotoUrl} compacto />
            ) : (
              <div className="home-driver home-driver-pending">
                <span className="home-driver-avatar">
                  <IconoInicio tipo="usuario" />
                </span>
                <div>
                  <p>Tu conductor</p>
                  <span>{viaje.conductor_nombre || "Pendiente de asignación"}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State: Contenedor oscuro con CTA prominente e ilustración integrada */
          <div className="home-empty-card">
            <div className="home-empty-main">
              <div className="home-empty-text">
                <h2>No tienes traslados activos</h2>
                <p>Solicita tu primer traslado y sigue cada etapa en tiempo real con evidencia fotográfica.</p>
              </div>
              <div className="home-empty-illustration">
                <IlustracionVehiculoRuta />
              </div>
            </div>
            <Link href="/viajes/nuevo" className="home-empty-cta" aria-label="Solicitar traslado">
              <span className="home-cta-plus" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="size-3.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span className="home-cta-label">Solicitar traslado</span>
              <span className="home-cta-chevron" aria-hidden="true">
                <Chevron />
              </span>
            </Link>
          </div>
        )}
      </section>

      {/* Accesos Directos (Grid unificado: Mis vehículos y Pasaporte) */}
      <section id="quickActions" aria-labelledby="acciones-rapidas" className="home-quick-actions">
        <h2 id="acciones-rapidas" className="sr-only">Acciones rápidas</h2>
        <Link href="/cuenta/vehiculos" className="home-quick-card" aria-label="Mis vehículos">
          <span className="home-module-icon home-icon-blue">
            <IconoInicio tipo="auto" />
          </span>
          <span className="home-module-copy">
            <strong>Mis vehículos</strong>
            <span>{vehiculos.length} {vehiculos.length === 1 ? "registrado" : "registrados"}</span>
          </span>
          <span className="home-module-chevron">
            <Chevron />
          </span>
        </Link>
        <Link href={pasaporte} className="home-quick-card" aria-label="Abrir pasaporte digital">
          <span className="home-module-icon home-icon-green">
            <IconoInicio tipo="documento" />
          </span>
          <span className="home-module-copy">
            <strong>Pasaporte</strong>
            <span>Digital</span>
          </span>
          <span className="home-module-chevron">
            <Chevron />
          </span>
        </Link>
      </section>

      {/* Tarjeta de Soporte 24/7 unificada */}
      <Link href="/soporte" className="home-support" aria-label="¿Necesitas ayuda? Soporte 24/7">
        <span className="home-module-icon home-icon-purple">
          <IconoInicio tipo="soporte" />
        </span>
        <span className="home-module-copy">
          <strong>¿Necesitas ayuda?</strong>
          <span>Soporte 24/7</span>
        </span>
        <span className="home-module-chevron">
          <Chevron />
        </span>
      </Link>
    </div>
  );
}
