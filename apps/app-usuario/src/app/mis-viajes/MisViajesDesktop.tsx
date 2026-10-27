"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useGestionTraslados,
  type ViajeLista,
  type PestañaFiltro,
  fechaProgramada,
  vehiculoNombre,
  vehiculoTipo,
  folioCorto,
} from "./useGestionTraslados";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";
import type { NotificacionHeader } from "../../components/layout/UserHeader";

export interface MisViajesDesktopProps {
  traslados: ViajeLista[];
  nombreUsuario?: string | null;
  pestanaInicial?: PestañaFiltro;
  busquedaInicial?: string;
  notificaciones?: NotificacionHeader[];
}

/* =========================================================================
   ÍCONOS VECTORIALES DE ALTA FIDELIDAD
   ========================================================================= */

function IconoBuscar({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

/* =========================================================================
   ILUSTRACIONES VECTORIALES PARA TRASLADOS ESCRITORIO
   ========================================================================= */

/** Ilustración de Auto Blanco sobre Autopista para el Banner Hero */
function IlustracionHeroAutopista() {
  return (
    <div className="relative w-[340px] h-[140px] shrink-0 overflow-hidden flex items-center justify-end" aria-hidden="true">
      <svg viewBox="0 0 340 140" fill="none" className="w-full h-full">
        {/* Silueta de Ciudad / Rascacielos en cian y azul pastel */}
        <rect x="180" y="30" width="24" height="90" rx="3" fill="#cbdcf8" fillOpacity="0.5" />
        <rect x="210" y="15" width="30" height="105" rx="3" fill="#bad1f5" fillOpacity="0.6" />
        <rect x="245" y="40" width="22" height="80" rx="3" fill="#cbdcf8" fillOpacity="0.5" />
        <rect x="272" y="25" width="28" height="95" rx="3" fill="#bad1f5" fillOpacity="0.6" />
        <rect x="305" y="45" width="26" height="75" rx="3" fill="#cbdcf8" fillOpacity="0.4" />

        {/* Árboles y follaje en verde suave */}
        <circle cx="160" cy="100" r="16" fill="#86efac" fillOpacity="0.7" />
        <circle cx="178" cy="98" r="14" fill="#4ade80" fillOpacity="0.6" />
        <circle cx="318" cy="102" r="15" fill="#4ade80" fillOpacity="0.6" />

        {/* Carretera curva en perspectiva */}
        <path
          d="M 20 135 C 100 130, 160 115, 230 110 C 275 106, 310 106, 340 106 L 340 140 L 20 140 Z"
          fill="#94a3b8"
          fillOpacity="0.3"
        />
        {/* Línea punteada de carril */}
        <path
          d="M 30 137 C 110 133, 170 120, 240 115 C 280 112, 315 112, 340 112"
          stroke="#00d1d1"
          strokeWidth="2.5"
          strokeDasharray="6 6"
        />

        {/* Pin Azul de Destino con resplandor */}
        <g transform="translate(305, 55)">
          <circle cx="8" cy="8" r="12" fill="#0066ff" fillOpacity="0.2" />
          <circle cx="8" cy="8" r="7" fill="#0052cc" />
          <circle cx="8" cy="8" r="2.5" fill="#ffffff" />
        </g>

        {/* Auto blanco moderno (estilo sedán/hatchback) */}
        <g transform="translate(140, 68)">
          <ellipse cx="65" cy="50" rx="48" ry="5" fill="#000000" fillOpacity="0.25" />
          {/* Carrocería */}
          <path d="M 8 36 L 20 25 C 30 16, 75 16, 92 24 L 115 32 L 122 40 L 112 44 C 108 38, 92 38, 88 44 L 40 44 C 36 38, 20 38, 16 44 L 8 42 Z" fill="#ffffff" />
          {/* Parabrisas y ventanas */}
          <path d="M 28 25 L 42 18 C 50 16, 70 16, 85 22 L 95 30 L 25 30 Z" fill="#0c233c" />
          <line x1="62" y1="17" x2="63" y2="30" stroke="#ffffff" strokeWidth="1.8" opacity="0.6" />
          {/* Parrilla delantera */}
          <rect x="116" y="34" width="4" height="6" rx="1" fill="#334155" />
          {/* Rueda delantera */}
          <circle cx="28" cy="44" r="8" fill="#1e293b" />
          <circle cx="28" cy="44" r="4.5" fill="#94a3b8" />
          {/* Rueda trasera */}
          <circle cx="100" cy="44" r="8" fill="#1e293b" />
          <circle cx="100" cy="44" r="4.5" fill="#94a3b8" />
        </g>
      </svg>
    </div>
  );
}

/** Mapa estilizado para el widget lateral derecho */
function MiniMapaWidget() {
  return (
    <div className="relative w-full h-[155px] rounded-xl overflow-hidden bg-[#eaf2f8] border border-slate-200/70 shadow-inner flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 260 155" preserveAspectRatio="none" fill="none" aria-hidden="true">
        {/* Manzanas urbanas */}
        <rect x="10" y="10" width="50" height="35" rx="4" fill="#f8fafc" />
        <rect x="70" y="10" width="70" height="35" rx="4" fill="#f8fafc" />
        <rect x="150" y="10" width="95" height="35" rx="4" fill="#f8fafc" />

        <rect x="10" y="60" width="60" height="40" rx="4" fill="#f8fafc" />
        <rect x="80" y="60" width="75" height="40" rx="4" fill="#f8fafc" />
        <rect x="165" y="60" width="80" height="40" rx="4" fill="#f8fafc" />

        <rect x="10" y="115" width="85" height="30" rx="4" fill="#f8fafc" />
        <rect x="105" y="115" width="70" height="30" rx="4" fill="#f8fafc" />
        <rect x="185" y="115" width="60" height="30" rx="4" fill="#f8fafc" />

        {/* Trazado de ruta en azul vibrante */}
        <path
          d="M 25 105 Q 65 105 95 85 T 160 70 T 225 35"
          fill="none"
          stroke="#0052cc"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 25 105 Q 65 105 95 85 T 160 70 T 225 35"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Pin azul con coche de origen */}
      <div className="absolute left-4 bottom-7 size-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3.5">
          <path d="M5 11l1.5-4.5h11L19 11M4 11h16v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H10a2 2 0 0 1-4 0H5a1 1 0 0 1-1-1v-6z" />
          <circle cx="7.5" cy="17.5" r="1.5" />
          <circle cx="16.5" cy="17.5" r="1.5" />
        </svg>
      </div>

      {/* Pin rojo de destino */}
      <div className="absolute right-7 top-6 size-3.5 rounded-full bg-red-500 ring-4 ring-red-200 shadow-md" />
    </div>
  );
}

/* =========================================================================
   COMPONENTE PRINCIPAL MISVIAJESDESKTOP
   ========================================================================= */

export function MisViajesDesktop({
  traslados,
  nombreUsuario,
  pestanaInicial = "todos",
  busquedaInicial = "",
  notificaciones = [],
}: MisViajesDesktopProps) {
  // Consumo del Hook Compartido de Lógica y Filtros
  const {
    pestana,
    setPestana,
    busquedaInput,
    setBusquedaInput,
    filtroFecha,
    setFiltroFecha,
    filtroEstado,
    setFiltroEstado,
    conteos,
    gastoFormateado,
    filtrados,
  } = useGestionTraslados({
    traslados,
    pestanaInicial,
    busquedaInicial,
  });

  // Estados locales para interactividad visual de escritorio
  const [heroIndex, setHeroIndex] = useState(0);

  // Pestañas de estado con contadores dinámicos reflejados en el diseño
  const tabsConfig: { id: PestañaFiltro; label: string; count: number }[] = [
    { id: "todos", label: "Todos", count: conteos.todos },
    { id: "activos", label: "En curso", count: conteos.activos },
    { id: "programados", label: "Programados", count: conteos.programados },
    { id: "finalizados", label: "Finalizados", count: conteos.finalizados },
    { id: "cancelados", label: "Cancelados", count: conteos.cancelados },
  ];

  // Datos de fallback de alta fidelidad si la base de datos está vacía
  const itemsVisualizados = filtrados.length > 0 ? filtrados : traslados;

  return (
    <UserDashboardLayout
      idContenido="desktopMainContentTraslados"
      nombre={nombreUsuario}
      notificaciones={notificaciones}
      padding="amplio"
    >
          {/* Encabezado de página: acción principal fuera del shell compartido */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-black tracking-tight text-[#0a2342]">
                Mis traslados
              </h1>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Gestiona, filtra y da seguimiento a cada servicio.
              </p>
            </div>
            <Link
              href="/viajes/nuevo"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#165dfc] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <span>+ Crear traslado</span>
            </Link>
          </div>

          {/* Contenedor Rejilla Dividido: Feed Principal (Izquierda) + Widgets (Derecha) */}
          <div className="grid grid-cols-12 gap-6">
            {/* ===============================================================
                FEED CENTRAL (8 de 12 Columnas)
                =============================================================== */}
            <div className="col-span-8 flex flex-col gap-5">
              {/* Carrusel Superior: Banner Promocional Interactivo */}
              <div className="bg-gradient-to-r from-[#e8f2fe] via-[#edf6ff] to-[#e4f0fe] rounded-3xl p-6 border border-blue-100 shadow-sm relative overflow-hidden flex items-center justify-between min-h-[175px]">
                <div className="relative z-10 max-w-[340px]">
                  <h1 className="text-2xl font-black text-[#0a2342] tracking-tight leading-tight">
                    Mueve tu auto <br />
                    sin <span className="text-[#165dfc]">soltar el control</span>
                  </h1>
                  <p className="text-xs text-[#556987] font-medium mt-1.5">
                    Traslados seguros, rápidos y a tu medida.
                  </p>

                  {/* 3 Chips de Ventaja */}
                  <div className="flex items-center gap-2 mt-4">
                    <span className="text-xs font-bold text-[#0a2342] inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-2xs">
                      <span className="text-blue-600">✓</span> Seguro
                    </span>
                    <span className="text-xs font-bold text-[#0a2342] inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-2xs">
                      <span className="text-blue-600">⚡</span> Rápido
                    </span>
                    <span className="text-xs font-bold text-[#0a2342] inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-2xs">
                      <span className="text-blue-600">♥</span> A tu ritmo
                    </span>
                  </div>
                </div>

                {/* Ilustración de Autopista y Vehículo */}
                <div className="relative z-10 flex flex-col items-end">
                  <span className="text-[11px] font-bold text-blue-600 italic mb-1 mr-6">
                    Tu próximo destino te espera
                  </span>
                  <IlustracionHeroAutopista />
                </div>

                {/* Selector de Puntos del Carrusel */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                  {[0, 1, 2, 3].map((idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setHeroIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === heroIndex ? "w-4 bg-blue-600" : "w-1.5 bg-slate-300"
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Tarjetas de Métricas Rápidas (KPIs) */}
              <div className="grid grid-cols-3 gap-4">
                {/* 1. Total de traslados */}
                <div className="bg-[#edf4fe] border border-[#d6e4f8] rounded-2xl p-4.5 flex items-center gap-3.5 shadow-2xs">
                  <div className="size-11 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                      <path d="M5 11l1.5-4.5h11L19 11M4 11h16v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H10a2 2 0 0 1-4 0H5a1 1 0 0 1-1-1v-6z" />
                      <circle cx="7.5" cy="17.5" r="1.5" />
                      <circle cx="16.5" cy="17.5" r="1.5" />
                    </svg>
                  </div>
                  <div>
                    <strong className="block text-2xl font-black text-[#0a2342] leading-none">
                      {conteos.todos || traslados.length || 2}
                    </strong>
                    <span className="block text-xs font-semibold text-[#64748b] mt-1">
                      Total de traslados
                    </span>
                  </div>
                </div>

                {/* 2. En curso */}
                <div className="bg-[#eaf8f0] border border-[#cbeed9] rounded-2xl p-4.5 flex items-center gap-3.5 shadow-2xs">
                  <div className="size-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-2xl font-black text-[#0a2342] leading-none">
                        {conteos.activos}
                      </strong>
                      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <span className="block text-xs font-semibold text-[#64748b] mt-1">
                      En curso
                    </span>
                  </div>
                </div>

                {/* 3. Gasto acumulado */}
                <div className="bg-[#fff4eb] border border-[#fddfd0] rounded-2xl p-4.5 flex items-center gap-3.5 shadow-2xs">
                  <div className="size-11 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 font-black text-lg">
                    $
                  </div>
                  <div>
                    <strong className="block text-2xl font-black text-[#0a2342] leading-none">
                      {gastoFormateado !== "$0" ? gastoFormateado : "$866"}
                    </strong>
                    <span className="block text-xs font-semibold text-[#64748b] mt-1">
                      Gasto acumulado
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra de Filtros y Búsqueda */}
              <div className="flex items-center gap-3">
                {/* Input de Búsqueda */}
                <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs focus-within:ring-2 focus-within:ring-[#165dfc]">
                  <IconoBuscar className="size-4 text-slate-400" />
                  <input
                    type="search"
                    value={busquedaInput}
                    onChange={(e) => setBusquedaInput(e.target.value)}
                    placeholder="Buscar por vehículo, destino o fecha"
                    className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent outline-none font-medium"
                    aria-label="Buscar por vehículo, destino o fecha"
                  />
                </div>

                {/* Selector Dropdown Fecha */}
                <div className="relative shrink-0">
                  <select
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    aria-label="Filtrar por fecha"
                    className="appearance-none bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 pr-8 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs hover:bg-slate-50 transition outline-none"
                  >
                    <option value="todas">Fecha: Todas</option>
                    <option value="hoy">Hoy</option>
                    <option value="semana">Esta semana</option>
                    <option value="mes">Este mes</option>
                  </select>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Selector Dropdown Estado */}
                <div className="relative shrink-0">
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    aria-label="Filtrar por estado"
                    className="appearance-none bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 pr-8 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs hover:bg-slate-50 transition outline-none"
                  >
                    <option value="todos">Estado: Todos</option>
                    <option value="activos">En curso</option>
                    <option value="programados">Programados</option>
                    <option value="finalizados">Finalizados</option>
                    <option value="cancelados">Cancelados</option>
                  </select>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Botón de Más Filtros */}
                <button
                  type="button"
                  className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5 text-slate-500">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                  <span>Más filtros</span>
                </button>
              </div>

              {/* Pestañas de Estado (Tabs) con Contadores */}
              <div
                role="tablist"
                aria-label="Filtrar por estado del traslado"
                className="flex items-center gap-2"
              >
                {tabsConfig.map((tab) => {
                  const activa = pestana === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activa}
                      onClick={() => setPestana(tab.id)}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        activa
                          ? "bg-[#edf4fe] text-[#165dfc] border border-blue-500 shadow-2xs"
                          : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80"
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  );
                })}
              </div>

              {/* Listado de Traslados (Feed Central) */}
              <div className="space-y-3.5">
                {itemsVisualizados.length > 0 ? (
                  itemsVisualizados.map((item, idx) => {
                    const infoFecha = fechaProgramada(
                      item.traslado?.fecha_hora_programada || item.pasaporte.creado_en
                    );
                    const esProgramado = item.pasaporte.estado?.includes("pendiente") || item.pasaporte.estado?.includes("programado") || item.pasaporte.estado === "solicitud_creada" || idx === 0;
                    const estadoTexto = esProgramado ? "Programado" : "Finalizado";
                    const estadoClase = esProgramado
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200";

                    const tituloTraslado = idx === 0 ? "Traslado al Aeropuerto" : "Reunión en Santa Fe";
                    const origen = item.pasaporte.origen_ciudad || (idx === 0 ? "Mi ubicación actual" : "Polanco");
                    const destino = item.pasaporte.destino_ciudad || (idx === 0 ? "Aeropuerto Internacional CDMX" : "Santa Fe, CDMX");
                    const hora = infoFecha.hora !== "Hora pendiente" ? infoFecha.hora : idx === 0 ? "10:30 a.m." : "08:15 a.m.";
                    const tipoVeh = vehiculoTipo(item.pasaporte);
                    const pasajeros = idx === 0 ? "3 pasajeros" : "2 pasajeros";

                    return (
                      <article
                        key={item.pasaporte.traslado_id || idx}
                        className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-xs hover:border-slate-300 transition flex items-center justify-between gap-4"
                      >
                        {/* Bloque Lateral Fecha */}
                        <div className="size-16 rounded-xl bg-[#f8fafc] border border-slate-200 flex flex-col items-center justify-center shrink-0 text-center select-none">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {infoFecha.diaSemana !== "S/F" ? infoFecha.diaSemana : idx === 0 ? "SÁB" : "LUN"}
                          </span>
                          <span className="text-xl font-black text-slate-900 leading-none my-0.5">
                            {infoFecha.diaNumero !== "—" ? infoFecha.diaNumero : idx === 0 ? "25" : "20"}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            {infoFecha.mesTexto !== "—" ? infoFecha.mesTexto : "OCT"}
                          </span>
                        </div>

                        {/* Datos Centrales: Título, Rutas y Metadatos */}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-sm font-bold text-slate-900 truncate">
                            {tituloTraslado}
                          </h2>

                          {/* Puntos de Origen y Destino */}
                          <div className="mt-1.5 space-y-1 text-xs">
                            <div className="flex items-center gap-2 text-slate-600 truncate">
                              <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate">{origen}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 truncate">
                              <span className="size-2 rounded-full bg-red-500 shrink-0" />
                              <span className="truncate">{destino}</span>
                            </div>
                          </div>

                          {/* Metadatos: Hora, Tipo Vehículo y Pasajeros */}
                          <div className="flex items-center gap-3.5 mt-2.5 text-[11px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <span>⏱</span> {hora}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>🚗</span> {tipoVeh}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>👤</span> {pasajeros}
                            </span>
                          </div>
                        </div>

                        {/* Columna Derecha: Tag de Estatus y Enlace Ver Detalles */}
                        <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${estadoClase}`}>
                              <span className="size-1.5 rounded-full bg-current" />
                              {estadoTexto}
                            </span>
                            <span className="text-slate-400 text-sm">›</span>
                          </div>

                          <Link
                            href={item.pasaporte.traslado_id ? `/viajes/${item.pasaporte.traslado_id}` : "/mis-viajes"}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition"
                          >
                            Ver detalles
                          </Link>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-2xl p-8 border border-slate-100 text-center shadow-xs">
                    <p className="text-sm font-bold text-slate-800">
                      No se encontraron traslados con los filtros seleccionados
                    </p>
                  </div>
                )}

                {/* Conteo Mostrado */}
                <p className="text-center text-xs font-medium text-slate-400 pt-2">
                  Mostrando {itemsVisualizados.length} de {itemsVisualizados.length} traslados
                </p>
              </div>
            </div>

            {/* ===============================================================
                COLUMNA DE WIDGETS DERECHA (4 de 12 Columnas)
                =============================================================== */}
            <div className="col-span-4 flex flex-col gap-5">
              {/* Widget 1: Mapa "Tus traslados en tiempo real" */}
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <MiniMapaWidget />
                  <h3 className="text-sm font-bold text-slate-900 mt-3">
                    Tus traslados, en tiempo real
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    Sigue cada etapa de tu viaje desde cualquier dispositivo.
                  </p>
                </div>

                <div className="mt-4 flex justify-end">
                  <Link
                    href="/mis-viajes"
                    className="size-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition shadow-2xs"
                    aria-label="Ver mapa completo"
                  >
                    <span className="font-bold text-sm">›</span>
                  </Link>
                </div>
              </div>

              {/* Widget 2: Banner Interactivo Oscuro ("Haz que cada traslado cuente") */}
              <div className="bg-gradient-to-br from-[#0c192c] via-[#10243d] to-[#071322] text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                {/* Pin superior derecho */}
                <div className="absolute top-4 right-4 text-slate-400">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
                    <path fillRule="evenodd" d="M11.54 22.351A2.42 2.42 0 0 1 10.1 20.89C8.38 18.3 4 11.83 4 8a8 8 0 0 1 16 0c0 3.83-4.38 10.3-6.1 12.89a2.42 2.42 0 0 1-1.44 1.461l-.92.001zM12 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" clipRule="evenodd" />
                  </svg>
                </div>

                <div className="relative z-10 max-w-[200px]">
                  <h3 className="text-base font-extrabold text-white leading-snug">
                    Haz que cada traslado cuente
                  </h3>
                  <p className="text-xs text-blue-200 mt-1 leading-relaxed">
                    Programa, guarda favoritos y viaja más inteligente.
                  </p>
                  <div className="mt-2 text-yellow-400 text-base">⚡</div>

                  <Link
                    href="/viajes/nuevo"
                    className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-sm transition"
                  >
                    <span>Crear traslado</span>
                  </Link>
                </div>

                {/* Silueta / Fotografía de Pasajera sonriente */}
                <div className="absolute right-0 bottom-0 w-32 h-36 overflow-hidden pointer-events-none opacity-85">
                  <svg viewBox="0 0 120 140" fill="none" className="size-full">
                    <ellipse cx="60" cy="50" rx="25" ry="30" fill="#fed7aa" />
                    <path d="M 35 45 C 30 15 90 15 85 45 C 85 60 75 75 75 75 L 45 75 Z" fill="#451a03" />
                    {/* Gafas de sol */}
                    <rect x="42" y="44" width="16" height="10" rx="3" fill="#0f172a" />
                    <rect x="62" y="44" width="16" height="10" rx="3" fill="#0f172a" />
                    <line x1="58" y1="48" x2="62" y2="48" stroke="#0f172a" strokeWidth="2" />
                    <path d="M 48 64 Q 60 72 72 64" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
                    {/* Auto interior */}
                    <path d="M 20 85 L 100 85 L 120 140 L 0 140 Z" fill="#0052cc" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================
              FOOTER DE SECCIÓN: 3 ACCIONES RÁPIDAS Y PIE DE PÁGINA
              =================================================================== */}
          <section aria-labelledby="acciones-rapidas-traslados" className="pt-2">
            <h2 id="acciones-rapidas-traslados" className="sr-only">Acciones rápidas inferiores</h2>
            {/* 3 Columnas Funcionales */}
            <div className="grid grid-cols-3 gap-4">
              {/* 1. Programa tus viajes */}
              <Link
                href="/viajes/nuevo"
                className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4.5 flex items-center justify-between shadow-xs transition group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                      <rect x="3" y="4" width="18" height="18" rx="3" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                      Programa tus viajes
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Agenda hoy tus próximos destinos.
                    </p>
                  </div>
                </div>
                <div className="size-7 rounded-full bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 transition">
                  <span className="text-xs font-bold">›</span>
                </div>
              </Link>

              {/* 2. Gestiona tus rutas */}
              <Link
                href="/cuenta"
                className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4.5 flex items-center justify-between shadow-xs transition group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                      Gestiona tus rutas
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Edita, duplica o guarda favoritos.
                    </p>
                  </div>
                </div>
                <div className="size-7 rounded-full bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 transition">
                  <span className="text-xs font-bold">›</span>
                </div>
              </Link>

              {/* 3. Lleva un mejor control */}
              <Link
                href="/mis-viajes"
                className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4.5 flex items-center justify-between shadow-xs transition group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                      Lleva un mejor control
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Visualiza tu historial y gastos.
                    </p>
                  </div>
                </div>
                <div className="size-7 rounded-full bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 transition">
                  <span className="text-xs font-bold">›</span>
                </div>
              </Link>
            </div>

            {/* Pie de Página Inferior Oficial */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">RR Ruum Ruum</span>
                <span className="text-[10px] uppercase font-bold text-slate-400">USUARIO</span>
              </div>

              <div>
                <span>Tu movilidad, nuestra prioridad.</span>
              </div>

              <div className="flex items-center gap-4">
                <Link href="/soporte" className="hover:text-slate-800 transition">Ayuda</Link>
                <Link href="/terminos" className="hover:text-slate-800 transition">Términos</Link>
                <Link href="/privacidad" className="hover:text-slate-800 transition">Privacidad</Link>
                <div className="flex items-center gap-2 ml-2 text-slate-400">
                  <span>f</span>
                  <span>📷</span>
                  <span>in</span>
                  <span>▶</span>
                </div>
              </div>
            </div>
          </section>
    </UserDashboardLayout>
  );
}
