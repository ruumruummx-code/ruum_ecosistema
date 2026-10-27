"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Database } from "@ruum/shared/types";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import { useRouter } from "next/navigation";
import { construirNotificaciones, obtenerViajeActivo, obtenerHistorial, esTrasladoActivo } from "../lib/inicio";
import { TERMINOLOGIA_USUARIO } from "../lib/glosario";
import { UserDashboardLayout } from "../components/layout/UserDashboardLayout";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];
type VehiculoRow = Database["public"]["Tables"]["vehiculos"]["Row"];

export interface InicioDesktopProps {
  usuario: UsuarioRow | null;
  traslados: PasaporteRow[];
  conductorFotoUrl?: string | null;
  vehiculos?: VehiculoRow[];
  errorVehiculos?: boolean;
}

/* =========================================================================
   ÍCONOS VECTORIALES PRECISOS
   ========================================================================= */

function IconoPerfilRR({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

/* =========================================================================
   ILUSTRACIONES VECTORIALES DE ALTA DEFINICIÓN (VEHÍCULOS Y MAPA)
   ========================================================================= */

/** Ilustración estilizada de sedán blanco moderno (Chrysler Cirrus / Dodge / Luxury) */
function IlustracionSedanBlanco({ className = "w-44 h-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 110" fill="none" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="shadowG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bodyG" x1="0" y1="0" x2="1" y2="0.8">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#eef4fa" />
          <stop offset="100%" stopColor="#d5e1ee" />
        </linearGradient>
        <linearGradient id="glassG" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#1a324b" />
          <stop offset="100%" stopColor="#0a1724" />
        </linearGradient>
      </defs>
      {/* Sombra de suelo */}
      <ellipse cx="120" cy="98" rx="105" ry="9" fill="url(#shadowG)" />
      {/* Carrocería principal */}
      <path d="M16 75 C 24 74, 38 68, 55 64 C 76 59, 102 46, 138 46 C 172 46, 194 56, 218 64 C 228 68, 234 74, 232 78 C 230 83, 216 85, 198 85 C 190 85, 178 72, 160 72 C 142 72, 134 85, 104 85 C 92 85, 84 72, 66 72 C 48 72, 40 85, 22 84 C 14 83, 12 77, 16 75 Z" fill="url(#bodyG)" />
      {/* Techo y cabina / ventanillas */}
      <path d="M68 62 L 94 48 C 104 42, 148 42, 164 48 L 194 62 Z" fill="url(#glassG)" />
      {/* Pilar B */}
      <line x1="130" y1="44" x2="132" y2="62" stroke="#ffffff" strokeWidth="2.5" opacity="0.8" />
      {/* Reflejos parabrisas */}
      <path d="M96 50 L 126 46 L 124 61 L 76 62 Z" fill="#3a6080" opacity="0.35" />
      {/* Faros delanteros (Luz xenón) */}
      <polygon points="12,74 24,71 22,77" fill="#60a5fa" />
      <polygon points="13,74 19,73 18,76" fill="#e0f2fe" />
      {/* Faros traseros */}
      <path d="M226 73 Q 232 75 228 79 L 222 78 Z" fill="#ef4444" />
      {/* Línea de cintura / cromo */}
      <path d="M24 74 Q 120 70 224 75" stroke="#94a3b8" strokeWidth="1.2" fill="none" opacity="0.7" />
      {/* Rueda delantera */}
      <g transform="translate(66, 80)">
        <circle cx="0" cy="0" r="16" fill="#1e293b" />
        <circle cx="0" cy="0" r="11" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="5" fill="#e2e8f0" />
      </g>
      {/* Rueda trasera */}
      <g transform="translate(176, 80)">
        <circle cx="0" cy="0" r="16" fill="#1e293b" />
        <circle cx="0" cy="0" r="11" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="5" fill="#e2e8f0" />
      </g>
    </svg>
  );
}

/** Representante de Soporte 3D amigable con diadema */
function IlustracionAgenteSoporte() {
  return (
    <div className="relative size-24 shrink-0 flex items-center justify-center">
      <div className="size-20 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-300 p-0.5 shadow-lg">
        <div className="size-full rounded-full bg-[#102d5a] flex items-center justify-center overflow-hidden relative">
          {/* Avatar femenino estilizado con auriculares */}
          <svg viewBox="0 0 80 80" fill="none" className="size-full mt-2" aria-hidden="true">
            {/* Cabello */}
            <path d="M22 45 C 20 22 60 22 58 45 C 58 55 52 64 52 64 L 28 64 C 28 64 22 55 22 45 Z" fill="#3b2314" />
            {/* Rostro */}
            <ellipse cx="40" cy="42" rx="15" ry="17" fill="#fed7aa" />
            {/* Ojos y sonrisa */}
            <circle cx="34" cy="40" r="1.8" fill="#1e293b" />
            <circle cx="46" cy="40" r="1.8" fill="#1e293b" />
            <path d="M36 48 Q 40 52 44 48" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" />
            {/* Cuello y playera RR */}
            <rect x="35" y="58" width="10" height="8" fill="#fed7aa" />
            <path d="M20 66 Q 40 60 60 66 L 62 80 L 18 80 Z" fill="#0052cc" />
            {/* Logotipo RR en playera */}
            <circle cx="40" cy="72" r="3" fill="#00d1d1" />
            {/* Diadema de call center */}
            <path d="M24 40 C 24 26 56 26 56 40" stroke="#e2e8f0" strokeWidth="3" fill="none" />
            <rect x="22" y="37" width="5" height="9" rx="2" fill="#0f172a" />
            <rect x="53" y="37" width="5" height="9" rx="2" fill="#0f172a" />
            {/* Micrófono hacia la boca */}
            <path d="M55 44 Q 52 52 45 52" stroke="#0f172a" strokeWidth="2" fill="none" />
            <circle cx="44" cy="52" r="2" fill="#00d1d1" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   COMPONENTE PRINCIPAL INICIODESKTOP
   ========================================================================= */

export function InicioDesktop({
  usuario,
  traslados,
  conductorFotoUrl = null,
  vehiculos = [],
  errorVehiculos = false,
}: InicioDesktopProps) {
  const router = useRouter();
  useEffect(() => {
    const actualizar = () => { if (document.visibilityState === "visible" && navigator.onLine) router.refresh(); };
    const intervalo = window.setInterval(actualizar, 30000);
    window.addEventListener("focus", actualizar);
    window.addEventListener("online", actualizar);
    return () => { window.clearInterval(intervalo); window.removeEventListener("focus", actualizar); window.removeEventListener("online", actualizar); };
  }, [router]);
  // Estado para el carrusel interactivo de Tips Ruum Ruum
  const [tipIndex, setTipIndex] = useState(0);

  const viaje = obtenerViajeActivo(traslados);
  const historial = obtenerHistorial(traslados);

  // Nombre de bienvenida
  const primerNombre = usuario?.nombre?.trim().split(/\s+/)[0];
  const nombre = primerNombre ? primerNombre.charAt(0).toUpperCase() + primerNombre.slice(1).toLowerCase() : "Usuario";
  const notificaciones = construirNotificaciones(usuario, traslados);

  // Tips interactivos
  const tips = [
    {
      titulo: "Optimiza tus traslados",
      descripcion: "Registra varios vehículos en una carga masiva y ahorra tiempo.",
    },
    {
      titulo: "Seguimiento en tiempo real",
      descripcion: "Monitorea la geolocalización satelital y tiempos de entrega minuto a minuto.",
    },
    {
      titulo: "Conductores 100% certificados",
      descripcion: "Todos nuestros operadores cuentan con validación toxicológica y antecedentes limpios.",
    },
    {
      titulo: "Pasaporte Digital con evidencia",
      descripcion: "Fotografías 360° de alta resolución antes de partir y al momento de la entrega.",
    },
  ];

  const situacionTexto = viaje?.estado ? TERMINOLOGIA_USUARIO[viaje.estado] ?? ETIQUETA_ESTADO_TRASLADO[viaje.estado] : "Sin traslado activo";
  const trasladosMostrados = historial.filter(t => t.traslado_id).slice(0, 3).map(t => ({
    id: t.traslado_id!,
    marcaModelo: [t.vehiculo_marca, t.vehiculo_modelo, t.vehiculo_anio].filter(Boolean).join(" ") || "Vehículo sin información",
    estado: t.estado ? TERMINOLOGIA_USUARIO[t.estado] ?? ETIQUETA_ESTADO_TRASLADO[t.estado] : "Estado no disponible",
    estadoClase: "bg-blue-50 text-blue-700 border-blue-200",
    ruta: [t.origen_ciudad || "Origen no disponible", t.destino_ciudad || "Destino no disponible"].join(" → "),
    placas: t.vehiculo_placas || "No disponibles",
    eta: t.creado_en && Number.isFinite(Date.parse(t.creado_en)) ? new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", dateStyle: "medium" }).format(new Date(t.creado_en)) : "Fecha no disponible",
  }));

  return (
    <UserDashboardLayout
      usuario={usuario}
      nombre={usuario?.nombre}
      notificaciones={notificaciones}
      totalVehiculos={errorVehiculos ? undefined : vehiculos.length}
      idContenido="desktopMainContent"
      padding="amplio"
    >

          {/* Header del Dashboard: Saludo Dinámico y Tarjeta Informativa Derecha */}
          <section aria-labelledby="saludo-escritorio" className="flex items-center justify-between gap-6">
            <div>
              <span className="block text-[11px] font-bold tracking-widest text-[#5c68ff] uppercase">
                BIENVENIDO DE NUEVO
              </span>
              <h1 id="saludo-escritorio" className="text-3xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                Hola, {nombre} <span aria-hidden="true">👋</span>
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Tu traslado, en orden.
              </p>
            </div>

            {/* Tarjeta Informativa Derecha con Paisaje de Carretera */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm min-w-[340px] max-w-[390px] h-[78px] flex items-center px-5 bg-slate-900">
              <Image
                src="/imagenes/seguridad-traslado.png"
                alt=""
                fill
                className="object-cover object-center opacity-45"
              />
              <div className="relative z-10 flex-1 pr-6">
                <p className="font-display font-extrabold text-white text-xs leading-snug">
                  Seguridad, evidencia y trazabilidad en cada viaje.
                </p>
              </div>
              <div className="relative z-10 size-8 rounded-full bg-blue-500/80 backdrop-blur-sm text-white flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4">
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
            </div>
          </section>

          {errorVehiculos && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-slate-900">No pudimos cargar tus vehículos. <button type="button" className="underline" onClick={() => router.refresh()}>Reintentar carga de vehículos</button></div>}
          <section aria-label="Módulo principal del traslado activo" className="grid gap-5 xl:grid-cols-3">
            <div className="rounded-2xl bg-[#0c192c] p-6 text-white xl:col-span-2">
              {viaje ? <>
                <span className="text-xs font-bold">TRASLADO ACTIVO</span>
                <h2 className="mt-4 text-2xl font-black">{[viaje.vehiculo_marca, viaje.vehiculo_modelo, viaje.vehiculo_anio].filter(Boolean).join(" ") || "Vehículo sin información"}</h2>
                <p className="mt-2">Placas: {viaje.vehiculo_placas || "No disponibles"}</p>
                <p className="mt-2"><span>{viaje.origen_ciudad || "Origen no disponible"}</span> → <span>{viaje.destino_ciudad || "Destino no disponible"}</span></p>
                <p className="mt-4 font-bold" aria-live="polite">{situacionTexto}</p>
                <p className="mt-2 text-sm text-slate-300">{traslados.filter(t => t.estado && esTrasladoActivo(t.estado)).length} traslado(s) activo(s). Consulta todos en Mis traslados.</p>
                <Link className="mt-4 inline-block underline" href={"/viajes/" + viaje.traslado_id}>Ver detalle y seguimiento</Link>
              </> : <>
                <h2 className="text-2xl font-bold">No tienes traslados activos</h2>
                <p className="mt-2">Registra un nuevo traslado o consulta tu historial.</p>
                <Link className="mt-4 inline-block underline" href="/viajes/nuevo">Solicitar traslado</Link>
              </>}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 text-slate-900">
              <h3 className="font-bold">Seguimiento del traslado</h3>
              <p className="mt-2 text-sm">Consulta la ubicación disponible y las evidencias en el detalle del servicio.</p>
              {viaje && <Link className="mt-3 inline-block text-blue-600 underline" href={"/viajes/" + viaje.traslado_id}>Abrir seguimiento</Link>}
              {viaje && <div className="mt-5 flex items-center gap-3">
                {conductorFotoUrl ? <Image src={conductorFotoUrl} alt="Conductor asignado" width={40} height={40} unoptimized className="rounded-full" /> : <IconoPerfilRR />}
                <div><span className="block text-xs">Tu conductor</span><strong>{viaje.conductor_nombre || "Pendiente de asignación"}</strong></div>
              </div>}
            </div>
          </section>

          {/* Acciones Rápidas (Fila horizontal de 4 botones diferenciados) */}
          <section aria-labelledby="acciones-rapidas-escritorio" className="space-y-3">
            <div>
              <h2 id="acciones-rapidas-escritorio" className="font-bold text-slate-900 text-base">
                Acciones rápidas
              </h2>
              <p className="text-xs font-medium text-blue-600 mt-0.5">
                Gestiona tus traslados y documentos desde un solo lugar.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {/* 1. Registrar nuevo traslado (Azul) */}
              <Link
                href="/viajes/nuevo"
                className="bg-[#edf4fe] hover:bg-[#e4effd] border border-blue-100 rounded-2xl p-4 flex flex-col justify-between h-[105px] transition group shadow-sm hover:shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="size-8 rounded-full bg-[#165dfc] text-white flex items-center justify-center font-bold text-base shadow-sm">
                    +
                  </div>
                  <span className="text-blue-500 font-bold text-xs group-hover:translate-x-0.5 transition">›</span>
                </div>
                <span className="font-bold text-slate-900 text-xs leading-snug">
                  Registrar nuevo traslado
                </span>
              </Link>

              {/* 2. Carga masiva (Verde) */}
              <Link
                href="/viajes/masivo"
                className="bg-[#eafaf1] hover:bg-[#e0f7e9] border border-emerald-100 rounded-2xl p-4 flex flex-col justify-between h-[105px] transition group shadow-sm hover:shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="size-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                    📄
                  </div>
                  <span className="text-emerald-500 font-bold text-xs group-hover:translate-x-0.5 transition">›</span>
                </div>
                <span className="font-bold text-slate-900 text-xs leading-snug">
                  Carga masiva de traslados
                </span>
              </Link>

              {/* 3. Mis vehículos (Púrpura) */}
              <Link
                href="/cuenta/vehiculos"
                className="bg-[#f5f0ff] hover:bg-[#ede5fc] border border-purple-100 rounded-2xl p-4 flex flex-col justify-between h-[105px] transition group shadow-sm hover:shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="size-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm">
                    🚗
                  </div>
                  <span className="text-purple-500 font-bold text-xs group-hover:translate-x-0.5 transition">›</span>
                </div>
                <span className="font-bold text-slate-900 text-xs leading-snug">
                  Mis vehículos registrados
                </span>
              </Link>

              {/* 4. Ver historial (Naranja/Peach) */}
              <Link
                href="/mis-viajes"
                className="bg-[#fff4eb] hover:bg-[#feece0] border border-orange-100 rounded-2xl p-4 flex flex-col justify-between h-[105px] transition group shadow-sm hover:shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="size-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm">
                    ⏱
                  </div>
                  <span className="text-orange-500 font-bold text-xs group-hover:translate-x-0.5 transition">›</span>
                </div>
                <span className="font-bold text-slate-900 text-xs leading-snug">
                  Ver historial de traslados
                </span>
              </Link>
            </div>
          </section>

          {/* Sección Inferior Dividida: Últimos Traslados (Izquierda) + Soporte & Tips (Derecha) */}
          <section aria-label="Historial y asistencia" className="grid grid-cols-12 gap-5 pb-6">
            {/* Panel Izquierdo: Últimos traslados (7 de 12 columnas) */}
            <div className="col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 text-base">
                    Últimos traslados
                  </h3>
                  <Link
                    href="/mis-viajes"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Ver todos →
                  </Link>
                </div>

                {/* Lista de Filas de Traslado */}
                <div className="divide-y divide-slate-100">
                  {trasladosMostrados.length === 0 && <p className="py-4 text-sm text-slate-500">Aún no tienes traslados registrados.</p>}
                  {trasladosMostrados.map((item) => (
                    <Link
                      key={item.id}
                      href={`/viajes/${item.id}`}
                      className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 rounded-xl px-2.5 -mx-2.5 transition"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Miniatura de Auto */}
                        <div className="size-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <IlustracionSedanBlanco className="w-9 h-auto" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <strong className="text-xs font-bold text-slate-900 truncate">
                              {item.marcaModelo}
                            </strong>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.estadoClase}`}>
                              {item.estado}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.ruta}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <span className="block text-[11px] font-mono text-slate-400">
                            Placas: {item.placas}
                          </span>
                          <span className="block text-xs font-bold text-slate-800">
                            {item.eta}
                          </span>
                        </div>
                        <span className="text-slate-400 font-bold text-xs">›</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel Derecho: Soporte 24/7 y Tips Ruum Ruum (5 de 12 columnas) */}
            <div className="col-span-5 flex flex-col gap-5">
              {/* Tarjeta de Soporte 24/7 */}
              <div className="bg-gradient-to-r from-[#1746a2] to-[#1a56db] rounded-2xl p-5 text-white shadow-sm relative overflow-hidden flex items-center justify-between">
                <div className="relative z-10 max-w-[210px]">
                  <div className="size-7 rounded-lg bg-white/10 flex items-center justify-center mb-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                      <path d="M4 14v-3a8 8 0 0 1 16 0v3" />
                      <path d="M3 14h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z" />
                      <path d="M21 14h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1Z" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-base text-white">
                    ¿Necesitas ayuda?
                  </h3>
                  <p className="text-xs text-blue-100 font-medium">
                    Estamos para ti 24/7
                  </p>
                  <Link
                    href="/soporte"
                    className="inline-flex items-center gap-1.5 px-4 py-2 mt-3 rounded-full bg-white text-[#1746a2] hover:bg-blue-50 font-bold text-xs shadow-sm transition"
                  >
                    <span>Ir a soporte →</span>
                  </Link>
                  <p className="text-[10px] text-blue-200/80 mt-2.5">
                    Soporte en tiempo real, sin complicaciones.
                  </p>
                </div>

                {/* Ilustración 3D Agente */}
                <IlustracionAgenteSoporte />
              </div>

              {/* Carrusel Interactivo de Tips Ruum Ruum */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <span>💡</span>
                      <span>Tips Ruum Ruum</span>
                    </div>

                    {/* Botones Anterior / Siguiente */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTipIndex((prev) => (prev === 0 ? tips.length - 1 : prev - 1))}
                        className="size-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs cursor-pointer"
                        aria-label="Tip anterior"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipIndex((prev) => (prev === tips.length - 1 ? 0 : prev + 1))}
                        className="size-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 text-xs cursor-pointer"
                        aria-label="Tip siguiente"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  {/* Imagen de Fondo del Tip */}
                  <div className="relative h-20 w-full rounded-xl overflow-hidden shadow-inner">
                    <Image
                      src="/imagenes/seguridad-traslado.png"
                      alt=""
                      fill
                      className="object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                  </div>

                  {/* Contenido del Tip Seleccionado */}
                  <div className="mt-2.5">
                    <strong className="block text-xs font-bold text-slate-900">
                      {tips[tipIndex].titulo}
                    </strong>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {tips[tipIndex].descripcion}
                    </p>
                  </div>
                </div>

                {/* Paginación por Puntos (Dots) */}
                <div className="flex items-center justify-center gap-1.5 mt-3 pt-2">
                  {tips.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTipIndex(i)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        i === tipIndex ? "w-5 bg-blue-600" : "w-1.5 bg-slate-200"
                      }`}
                      aria-label={`Ver tip ${i + 1}`}
                      aria-current={i === tipIndex ? "true" : undefined}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
    </UserDashboardLayout>
  );
}
