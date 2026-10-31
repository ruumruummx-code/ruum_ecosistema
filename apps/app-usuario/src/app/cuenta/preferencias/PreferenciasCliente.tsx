"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTema } from "../../TemaProvider";
import { BotonTema } from "../../TemaProvider";
import { PassportCard } from "@ruum/ui";
import { LayoutCuenta } from "../cuenta-ui";
import { Preferencias as SeccionPreferencias } from "../Preferencias";
import type { CuentaReal, Usuario } from "../cuenta-ui";
import { crearClienteNavegador } from "../../../lib/supabase-browser";

interface PreferenciasClienteProps {
  cuenta: CuentaReal;
}

export function PreferenciasCliente({ cuenta }: PreferenciasClienteProps) {
  const usuario = cuenta.usuario;
  const { modo, fijarModo, alternar } = useTema();

  // Estados locales para las preferencias
  const [idioma, setIdioma] = useState<"es" | "en">("es");
  const [zonaHoraria, setZonaHoraria] = useState("(UTC-06:00) Ciudad de México");
  const [unidades, setUnidades] = useState("Métrico");
  const [accesibilidad, setAccesibilidad] = useState("Estándar");
  const [usoDatos, setUsoDatos] = useState("Activado");
  const [alertasGenerales, setAlertasGenerales] = useState(true);

  // Estados de la matriz de notificaciones
  const [notifRecordatoriosEmail, setNotifRecordatoriosEmail] = useState(true);
  const [notifRecordatoriosPush, setNotifRecordatoriosPush] = useState(true);
  const [notifCambiosEstadoEmail, setNotifCambiosEstadoEmail] = useState(true);
  const [notifCambiosEstadoPush, setNotifCambiosEstadoPush] = useState(true);
  const [notifPagosEmail, setNotifPagosEmail] = useState(usuario?.alertas_pago ?? true);
  const [notifPagosPush, setNotifPagosPush] = useState(usuario?.notificaciones_push ?? true);
  const [notifPromocionesEmail, setNotifPromocionesEmail] = useState(usuario?.notificaciones_promocionales ?? false);
  const [notifPromocionesPush, setNotifPromocionesPush] = useState(false);

  // Estados de interfaz
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [modalSesionesAbierto, setModalSesionesAbierto] = useState(false);

  // Cargar preferencias guardadas en localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const prefsGuardadas = window.localStorage.getItem("ruum-usuario-preferencias");
      if (prefsGuardadas) {
        const p = JSON.parse(prefsGuardadas);
        if (p.idioma) setIdioma(p.idioma);
        if (p.zonaHoraria) setZonaHoraria(p.zonaHoraria);
        if (p.unidades) setUnidades(p.unidades);
        if (p.accesibilidad) setAccesibilidad(p.accesibilidad);
        if (p.usoDatos) setUsoDatos(p.usoDatos);
        if (typeof p.alertasGenerales === "boolean") setAlertasGenerales(p.alertasGenerales);
        if (typeof p.notifRecordatoriosEmail === "boolean") setNotifRecordatoriosEmail(p.notifRecordatoriosEmail);
        if (typeof p.notifRecordatoriosPush === "boolean") setNotifRecordatoriosPush(p.notifRecordatoriosPush);
        if (typeof p.notifCambiosEstadoEmail === "boolean") setNotifCambiosEstadoEmail(p.notifCambiosEstadoEmail);
        if (typeof p.notifCambiosEstadoPush === "boolean") setNotifCambiosEstadoPush(p.notifCambiosEstadoPush);
        if (typeof p.notifPagosEmail === "boolean") setNotifPagosEmail(p.notifPagosEmail);
        if (typeof p.notifPagosPush === "boolean") setNotifPagosPush(p.notifPagosPush);
        if (typeof p.notifPromocionesEmail === "boolean") setNotifPromocionesEmail(p.notifPromocionesEmail);
        if (typeof p.notifPromocionesPush === "boolean") setNotifPromocionesPush(p.notifPromocionesPush);
      }
    } catch {
      // Ignorar errores de parsing
    }
  }, []);

  const handleGuardarCambios = async () => {
    setGuardando(true);
    setMensajeExito(false);

    const payloadLocal = {
      idioma,
      zonaHoraria,
      unidades,
      accesibilidad,
      usoDatos,
      alertasGenerales,
      notifRecordatoriosEmail,
      notifRecordatoriosPush,
      notifCambiosEstadoEmail,
      notifCambiosEstadoPush,
      notifPagosEmail,
      notifPagosPush,
      notifPromocionesEmail,
      notifPromocionesPush,
    };

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("ruum-usuario-preferencias", JSON.stringify(payloadLocal));
      } catch {
        // ignore
      }
    }

    // Actualización remota en Supabase si hay sesión y tabla usuarios
    try {
      const cliente = crearClienteNavegador();
      if (usuario?.id) {
        // eslint-disable-next-line no-restricted-syntax
        await cliente
          .from("usuarios")
          .update({
            notificaciones_push: notifPagosPush || notifCambiosEstadoPush,
            notificaciones_email: notifPagosEmail || notifCambiosEstadoEmail,
            alertas_pago: notifPagosEmail || notifPagosPush,
            notificaciones_promocionales: notifPromocionesEmail || notifPromocionesPush,
          })
          .eq("id", usuario.id);
      }
    } catch {
      // Continúa aunque falle offline o sin permisos
    }

    setGuardando(false);
    setMensajeExito(true);
    setTimeout(() => {
      setMensajeExito(false);
    }, 4000);
  };

  const handleRestablecer = () => {
    setIdioma("es");
    setZonaHoraria("(UTC-06:00) Ciudad de México");
    setUnidades("Métrico");
    setAccesibilidad("Estándar");
    setUsoDatos("Activado");
    setAlertasGenerales(true);
    setNotifRecordatoriosEmail(true);
    setNotifRecordatoriosPush(true);
    setNotifCambiosEstadoEmail(true);
    setNotifCambiosEstadoPush(true);
    setNotifPagosEmail(true);
    setNotifPagosPush(true);
    setNotifPromocionesEmail(false);
    setNotifPromocionesPush(false);
    fijarModo("light");
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("ruum-usuario-preferencias");
      } catch {
        // ignore
      }
    }
  };

  const nombreUsuario = usuario?.nombre ? usuario.nombre.split(" ")[0].toUpperCase() : "HECTOR";

  // Texto amigable para el tema en la tarjeta de resumen
  const textoTemaResumen = modo === "light" ? "Claro" : modo === "dark" ? "Oscuro" : "Automático";

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. VISTA MÓVIL (< 1024px): 100% INTACTA BAJO MOBILE-FIRST
         ───────────────────────────────────────────────────────────── */}
      <div className="block lg:hidden">
        <LayoutCuenta cuenta={cuenta}>
          <PassportCard>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-text-primary">Apariencia</h2>
                <p className="font-body text-xs text-text-secondary">
                  Elige tema claro u oscuro. Respetamos tu sistema por defecto y lo recordamos.
                </p>
              </div>
              <BotonTema />
            </div>
          </PassportCard>
          <div className="mt-4">
            <SeccionPreferencias usuario={cuenta.usuario} />
          </div>
        </LayoutCuenta>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. VISTA ESCRITORIO (>= 1024px): DASHBOARD REDISEÑADO
         ───────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-screen bg-[#F4F8FD] dark:bg-[#070D18] text-slate-800 dark:text-slate-100 font-sans">
        {/* ── SIDEBAR IZQUIERDO FIJO ── */}
        <aside className="w-64 bg-[#0A1325] text-white flex flex-col shrink-0 min-h-screen border-r border-[#16253B]">
          {/* Logo Brand */}
          <div className="p-6 pb-5">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="size-9 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#00B2FF] flex items-center justify-center p-1.5 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <svg viewBox="0 0 40 40" fill="none" className="w-full h-full text-white">
                  <path
                    d="M10 28C10 22 13 18 19 18C25 18 28 21 28 26C28 31 24 34 18 34H10V28Z"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 18C22 12 25 8 31 8C37 8 40 11 40 16C40 21 36 24 30 24H22V18Z"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <span className="font-display font-bold text-lg tracking-tight text-white block leading-tight">
                  Ruum Ruum
                </span>
                <span className="text-[11px] font-medium text-[#38BDF8] block leading-tight">
                  Tu traslado, en orden
                </span>
              </div>
            </Link>
          </div>

          {/* Menú de Navegación Lateral */}
          <nav className="flex-1 px-4 space-y-1 mt-2" aria-label="Navegación principal de escritorio">
            <Link
              href="/"
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition"
            >
              <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Inicio</span>
            </Link>

            <Link
              href="/mis-viajes"
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition"
            >
              <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2m14 0v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2m-8 0v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2m4 0h8" />
              </svg>
              <span>Mis traslados</span>
            </Link>

            <Link
              href="/cuenta/vehiculos"
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition"
            >
              <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 17H3v-4l2-5h10l2 5v4h-2m-8 0h4" />
              </svg>
              <span>Mis vehículos</span>
            </Link>

            <Link
              href="/cuenta"
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition"
            >
              <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Mis ubicaciones</span>
            </Link>

            <Link
              href="/carga-masiva"
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition"
            >
              <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Carga Masiva</span>
            </Link>

            <div className="py-2.5">
              <div className="h-px bg-white/10 mx-2" />
            </div>

            <Link
              href="/cuenta"
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition"
            >
              <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Mi cuenta</span>
            </Link>

            <Link
              href="/cuenta/perfil"
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition"
            >
              <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Mi perfil</span>
            </Link>

            {/* Activo: Mis preferencias */}
            <Link
              href="/cuenta/preferencias"
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl bg-[#0066FF] text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition"
            >
              <svg className="size-5 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Mis preferencias</span>
            </Link>

            <Link
              href="/soporte"
              className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition"
            >
              <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Ayuda</span>
            </Link>
          </nav>

          {/* Tarjeta Promocional Inferior en Sidebar */}
          <div className="p-4 mt-auto">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#13223A] to-[#0D182A] border border-[#1E304C] p-4 shadow-lg">
              {/* Ilustración de auto sobre fondo estilizado */}
              <div className="mb-3 flex justify-center">
                <div className="relative w-full h-16 flex items-center justify-center">
                  <svg className="w-32 h-14 text-white drop-shadow-md" viewBox="0 0 160 70" fill="none">
                    <path
                      d="M20 45 C35 45 40 25 65 22 C95 20 120 22 135 34 C145 42 150 48 152 50 C145 52 140 52 130 52 C125 45 115 45 110 52 L50 52 C45 45 35 45 30 52 L15 52 Z"
                      fill="#FFFFFF"
                      fillOpacity="0.9"
                    />
                    <circle cx="38" cy="52" r="8" fill="#1E293B" stroke="#00B2FF" strokeWidth="2" />
                    <circle cx="122" cy="52" r="8" fill="#1E293B" stroke="#00B2FF" strokeWidth="2" />
                    <path d="M55 26 L80 26 L80 38 L50 38 Z" fill="#0066FF" fillOpacity="0.3" />
                    <path d="M85 26 L115 28 L115 38 L85 38 Z" fill="#0066FF" fillOpacity="0.3" />
                  </svg>
                </div>
              </div>
              <h4 className="font-display font-bold text-sm text-white leading-tight">
                Mueve tu auto sin salir de casa
              </h4>
              <p className="text-[11px] text-[#8E9CAE] mt-1 leading-snug">
                Un servicio confiable, seguro y en todo México.
              </p>
              <Link
                href="/viajes/nuevo"
                className="mt-3.5 flex items-center justify-center gap-1.5 w-full bg-[#0066FF] hover:bg-blue-600 text-white font-semibold text-xs py-2 px-3 rounded-xl transition shadow-sm"
              >
                <span>Registrar traslado</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* ── CONTENIDO PRINCIPAL Y BARRA SUPERIOR ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Navbar */}
          <header className="h-16 bg-white dark:bg-[#0A1325] border-b border-slate-200 dark:border-[#16253B] px-8 flex items-center justify-between sticky top-0 z-20">
            {/* Buscador Global con Badge Ctrl K */}
            <div className="relative w-96">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar traslados, vehículos o ubicaciones..."
                className="w-full bg-[#F1F5F9] dark:bg-[#16253B] text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs rounded-full pl-9 pr-14 py-2 border-0 focus:ring-2 focus:ring-[#0066FF] outline-none transition"
              />
              <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <kbd className="bg-white dark:bg-[#0A1325] text-slate-500 dark:text-slate-400 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                  Ctrl K
                </kbd>
              </span>
            </div>

            {/* Acciones del Navbar: Notificaciones, Tema y Usuario */}
            <div className="flex items-center gap-4">
              {/* Notificaciones */}
              <button
                type="button"
                className="relative p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
                aria-label="Ver notificaciones"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1.5 right-1.5 size-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#0A1325]" />
              </button>

              {/* Toggle Tema (Luna / Sol) */}
              <button
                type="button"
                onClick={alternar}
                className="p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition"
                aria-label="Alternar tema claro y oscuro"
                title={`Tema actual: ${textoTemaResumen}`}
              >
                {modo === "dark" ? (
                  <svg className="size-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                ) : (
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Perfil del Usuario */}
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="size-8 rounded-full bg-[#16253B] text-white flex items-center justify-center font-bold text-xs ring-1 ring-slate-200 dark:ring-slate-700">
                  {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : "H"}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    Hola, {nombreUsuario}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-tight">Usuario</p>
                </div>
                <svg className="size-3.5 text-slate-400 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </header>

          {/* Área de Contenido con Scroll */}
          <main className="flex-1 px-8 py-6 max-w-7xl w-full mx-auto pb-28">
            {/* Breadcrumb Enlace */}
            <div className="mb-2">
              <Link
                href="/cuenta"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066FF] hover:underline transition"
              >
                <span>&larr;</span>
                <span>Volver a mi cuenta</span>
              </Link>
            </div>

            {/* Encabezado */}
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Mis preferencias
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configura notificaciones, apariencia, privacidad y preferencias de uso.
              </p>
            </div>

            {/* Fila de 4 Tarjetas de Resumen Rápido */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {/* Tarjeta 1: Idioma */}
              <div className="bg-white dark:bg-[#0A1325] border border-slate-200 dark:border-[#16253B] rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0066FF] flex items-center justify-center">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Idioma</p>
                    <p className="text-xs text-slate-400">{idioma === "es" ? "Español" : "English"}</p>
                  </div>
                </div>
                <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Tarjeta 2: Tema */}
              <div className="bg-white dark:bg-[#0A1325] border border-slate-200 dark:border-[#16253B] rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Tema</p>
                    <p className="text-xs text-slate-400">{textoTemaResumen}</p>
                  </div>
                </div>
                <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Tarjeta 3: Notificaciones */}
              <div className="bg-white dark:bg-[#0A1325] border border-slate-200 dark:border-[#16253B] rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Notificaciones</p>
                    <p className="text-xs text-slate-400">{alertasGenerales ? "Activadas" : "Desactivadas"}</p>
                  </div>
                </div>
                <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Tarjeta 4: Privacidad */}
              <div className="bg-white dark:bg-[#0A1325] border border-slate-200 dark:border-[#16253B] rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Privacidad</p>
                    <p className="text-xs text-slate-400">Configurada</p>
                  </div>
                </div>
                <svg className="size-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Grid 2x2 de Configuración */}
            <div className="grid grid-cols-2 gap-5">
              {/* ── CARD 1: IDIOMA Y REGIÓN ── */}
              <section className="bg-white dark:bg-[#0A1325] border border-slate-200 dark:border-[#16253B] rounded-2xl p-6 shadow-2xs">
                {/* Cabecera de la sección */}
                <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0066FF] flex items-center justify-center shrink-0">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                      Idioma y región
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Configura el idioma, tu zona horaria y el sistema de unidades.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {/* Fila Idioma */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Idioma</p>
                        <p className="text-[11px] text-slate-400">Define el idioma de la aplicación.</p>
                      </div>
                    </div>
                    {/* Segmented Switch Idioma */}
                    <div className="flex bg-slate-100 dark:bg-[#16253B] p-0.5 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setIdioma("es")}
                        className={`text-xs px-4 py-1.5 rounded-lg font-medium transition ${
                          idioma === "es"
                            ? "bg-[#0066FF] text-white shadow-2xs font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                        }`}
                      >
                        Español
                      </button>
                      <button
                        type="button"
                        onClick={() => setIdioma("en")}
                        className={`text-xs px-4 py-1.5 rounded-lg font-medium transition ${
                          idioma === "en"
                            ? "bg-[#0066FF] text-white shadow-2xs font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  {/* Fila Zona horaria */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Zona horaria</p>
                        <p className="text-[11px] text-slate-400">Se usará para mostrar fechas y horarios de tus traslados.</p>
                      </div>
                    </div>
                    <select
                      value={zonaHoraria}
                      onChange={(e) => setZonaHoraria(e.target.value)}
                      className="bg-white dark:bg-[#16253B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#0066FF] shrink-0"
                    >
                      <option value="(UTC-06:00) Ciudad de México">(UTC-06:00) Ciudad de México</option>
                      <option value="(UTC-05:00) Cancún / Este">(UTC-05:00) Cancún / Este</option>
                      <option value="(UTC-07:00) Mazatlán / Pacífico">(UTC-07:00) Mazatlán / Pacífico</option>
                      <option value="(UTC-08:00) Tijuana / Noroeste">(UTC-08:00) Tijuana / Noroeste</option>
                    </select>
                  </div>

                  {/* Fila Unidades */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <rect x="2" y="7" width="20" height="10" rx="2" />
                        <line x1="6" y1="7" x2="6" y2="11" />
                        <line x1="10" y1="7" x2="10" y2="11" />
                        <line x1="14" y1="7" x2="14" y2="11" />
                        <line x1="18" y1="7" x2="18" y2="11" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Unidades</p>
                        <p className="text-[11px] text-slate-400">Define el sistema de unidades para distancias, peso y consumo.</p>
                      </div>
                    </div>
                    <select
                      value={unidades}
                      onChange={(e) => setUnidades(e.target.value)}
                      className="bg-white dark:bg-[#16253B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#0066FF] shrink-0"
                    >
                      <option value="Métrico">Métrico</option>
                      <option value="Imperial">Imperial</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* ── CARD 2: APLICACIÓN ── */}
              <section className="bg-white dark:bg-[#0A1325] border border-slate-200 dark:border-[#16253B] rounded-2xl p-6 shadow-2xs">
                {/* Cabecera de la sección */}
                <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0066FF] flex items-center justify-center shrink-0">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                      Aplicación
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Personaliza la apariencia y el comportamiento de la plataforma.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {/* Fila Tema */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Tema</p>
                        <p className="text-[11px] text-slate-400">Elige el tema que mejor se adapte a ti.</p>
                      </div>
                    </div>
                    {/* Segmented control: Claro | Oscuro | Automático */}
                    <div className="flex bg-slate-100 dark:bg-[#16253B] p-0.5 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => fijarModo("light")}
                        className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition ${
                          modo === "light"
                            ? "bg-[#0066FF] text-white shadow-2xs font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                        }`}
                      >
                        Claro
                      </button>
                      <button
                        type="button"
                        onClick={() => fijarModo("dark")}
                        className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition ${
                          modo === "dark"
                            ? "bg-[#0066FF] text-white shadow-2xs font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                        }`}
                      >
                        Oscuro
                      </button>
                      <button
                        type="button"
                        onClick={() => fijarModo("auto")}
                        className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition ${
                          modo === "auto"
                            ? "bg-[#0066FF] text-white shadow-2xs font-semibold"
                            : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                        }`}
                      >
                        Automático
                      </button>
                    </div>
                  </div>

                  {/* Fila Notificaciones y alertas */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Notificaciones y alertas</p>
                        <p className="text-[11px] text-slate-400">Recibe avisos importantes sobre tus traslados y actividad.</p>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={alertasGenerales}
                      onClick={() => setAlertasGenerales(!alertasGenerales)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0066FF] ${
                        alertasGenerales ? "bg-[#0066FF]" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          alertasGenerales ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Fila Accesibilidad */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="4" r="2" />
                        <path d="M12 6v7m0 0l-3 6m3-6l3 6m-7-9h8" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Accesibilidad</p>
                        <p className="text-[11px] text-slate-400">Ajustes de contraste, tamaño de letra y otras opciones de accesibilidad.</p>
                      </div>
                    </div>
                    <select
                      value={accesibilidad}
                      onChange={(e) => setAccesibilidad(e.target.value)}
                      className="bg-white dark:bg-[#16253B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#0066FF] shrink-0"
                    >
                      <option value="Estándar">Estándar</option>
                      <option value="Alto contraste">Alto contraste</option>
                      <option value="Texto grande">Texto grande</option>
                    </select>
                  </div>

                  {/* Fila Unidades repetida según diseño */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <rect x="2" y="7" width="20" height="10" rx="2" />
                        <line x1="6" y1="7" x2="6" y2="11" />
                        <line x1="10" y1="7" x2="10" y2="11" />
                        <line x1="14" y1="7" x2="14" y2="11" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Unidades</p>
                        <p className="text-[11px] text-slate-400">Sistema de unidades en la aplicación.</p>
                      </div>
                    </div>
                    <select
                      value={unidades}
                      onChange={(e) => setUnidades(e.target.value)}
                      className="bg-white dark:bg-[#16253B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#0066FF] shrink-0"
                    >
                      <option value="Métrico">Métrico</option>
                      <option value="Imperial">Imperial</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* ── CARD 3: NOTIFICACIONES ── */}
              <section className="bg-white dark:bg-[#0A1325] border border-slate-200 dark:border-[#16253B] rounded-2xl p-6 shadow-2xs">
                {/* Cabecera de la sección */}
                <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0066FF] flex items-center justify-center shrink-0">
                      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                        Notificaciones
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Elige qué tipo de notificaciones quieres recibir y por qué medio.
                      </p>
                    </div>
                  </div>
                  {/* Encabezados de Columna: Email | Web/Push */}
                  <div className="flex items-center gap-8 pr-1 shrink-0">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-11 text-center">
                      Email
                    </span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-14 text-center">
                      Web / Push
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {/* Fila 1: Recordatorios de traslados */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2m14 0v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2m-8 0v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2m4 0h8" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Recordatorios de traslados</p>
                        <p className="text-[11px] text-slate-400">Avisos previos a tus traslados programados.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 shrink-0">
                      {/* Email Toggle */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifRecordatoriosEmail}
                        onClick={() => setNotifRecordatoriosEmail(!notifRecordatoriosEmail)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0066FF] ${
                          notifRecordatoriosEmail ? "bg-[#0066FF]" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${notifRecordatoriosEmail ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                      {/* Push Toggle */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifRecordatoriosPush}
                        onClick={() => setNotifRecordatoriosPush(!notifRecordatoriosPush)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0066FF] ${
                          notifRecordatoriosPush ? "bg-[#0066FF]" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${notifRecordatoriosPush ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>

                  {/* Fila 2: Cambios de estado */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Cambios de estado</p>
                        <p className="text-[11px] text-slate-400">Notificaciones sobre el estado de tus traslados.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 shrink-0">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifCambiosEstadoEmail}
                        onClick={() => setNotifCambiosEstadoEmail(!notifCambiosEstadoEmail)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0066FF] ${
                          notifCambiosEstadoEmail ? "bg-[#0066FF]" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${notifCambiosEstadoEmail ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifCambiosEstadoPush}
                        onClick={() => setNotifCambiosEstadoPush(!notifCambiosEstadoPush)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0066FF] ${
                          notifCambiosEstadoPush ? "bg-[#0066FF]" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${notifCambiosEstadoPush ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>

                  {/* Fila 3: Pagos y facturación */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Pagos y facturación</p>
                        <p className="text-[11px] text-slate-400">Confirmaciones, comprobantes y avisos de pago.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 shrink-0">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifPagosEmail}
                        onClick={() => setNotifPagosEmail(!notifPagosEmail)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0066FF] ${
                          notifPagosEmail ? "bg-[#0066FF]" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${notifPagosEmail ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifPagosPush}
                        onClick={() => setNotifPagosPush(!notifPagosPush)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0066FF] ${
                          notifPagosPush ? "bg-[#0066FF]" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${notifPagosPush ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>

                  {/* Fila 4: Promociones y novedades */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Promociones y novedades</p>
                        <p className="text-[11px] text-slate-400">Noticias, promociones y nuevos servicios.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 shrink-0">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifPromocionesEmail}
                        onClick={() => setNotifPromocionesEmail(!notifPromocionesEmail)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0066FF] ${
                          notifPromocionesEmail ? "bg-[#0066FF]" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${notifPromocionesEmail ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={notifPromocionesPush}
                        onClick={() => setNotifPromocionesPush(!notifPromocionesPush)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0066FF] ${
                          notifPromocionesPush ? "bg-[#0066FF]" : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      >
                        <span className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${notifPromocionesPush ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── CARD 4: PRIVACIDAD Y PERMISOS ── */}
              <section className="bg-white dark:bg-[#0A1325] border border-slate-200 dark:border-[#16253B] rounded-2xl p-6 shadow-2xs">
                {/* Cabecera de la sección */}
                <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0066FF] flex items-center justify-center shrink-0">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                      Privacidad y permisos
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Controla el uso de tu información y los permisos del dispositivo.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {/* Fila 1: Ubicación */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Ubicación</p>
                        <p className="text-[11px] text-slate-400">Se autoriza desde el mapa y el navegador cuando usas servicios de traslado.</p>
                      </div>
                    </div>
                    {/* Info Pill */}
                    <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 rounded-xl px-3 py-1.5 text-[11px] shrink-0 max-w-xs">
                      <svg className="size-3.5 shrink-0 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>Se solicita cuando usas el mapa o servicios de traslado.</span>
                    </div>
                  </div>

                  {/* Fila 2: Uso de datos */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Uso de datos</p>
                        <p className="text-[11px] text-slate-400">Configura el uso de datos de la aplicación.</p>
                      </div>
                    </div>
                    <select
                      value={usoDatos}
                      onChange={(e) => setUsoDatos(e.target.value)}
                      className="bg-white dark:bg-[#16253B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-[#0066FF] shrink-0"
                    >
                      <option value="Activado">Activado</option>
                      <option value="Solo esenciales">Solo esenciales</option>
                      <option value="Desactivado">Desactivado</option>
                    </select>
                  </div>

                  {/* Fila 3: Biometría */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11m0 0a8.003 8.003 0 0115.357-2m1.51 4.542a17.915 17.915 0 01-1.601 5.925" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Biometría</p>
                        <p className="text-[11px] text-slate-400">La autenticación biométrica no está disponible en la versión web. Puedes usarla en nuestras apps móviles.</p>
                      </div>
                    </div>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium px-3.5 py-1.5 rounded-xl shrink-0">
                      No disponible en web
                    </span>
                  </div>

                  {/* Fila 4: Sesiones activas */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 text-slate-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Sesiones activas</p>
                        <p className="text-[11px] text-slate-400">Administra los dispositivos donde has iniciado sesión.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalSesionesAbierto(true)}
                      className="border border-[#0066FF] text-[#0066FF] hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs font-semibold px-4 py-1.5 rounded-xl transition shrink-0"
                    >
                      Ver sesiones
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </main>

          {/* ── BARRA INFERIOR FIJA / STICKY ── */}
          <footer className="fixed bottom-0 left-64 right-0 bg-white/95 dark:bg-[#0A1325]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#16253B] px-8 py-3.5 flex items-center justify-between z-20 shadow-lg">
            {/* Mensaje Informativo Izquierdo */}
            <div className="flex items-center gap-3">
              <div className="size-6 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#0066FF] flex items-center justify-center shrink-0">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  Recuerda guardar tus cambios
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Las modificaciones se aplicarán a tu cuenta de inmediato.
                </p>
              </div>
              {mensajeExito && (
                <span className="ml-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Cambios guardados con éxito
                </span>
              )}
            </div>

            {/* Botones de Acción Derecho */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRestablecer}
                className="bg-white dark:bg-[#16253B] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold px-5 py-2.5 rounded-xl transition"
              >
                Restablecer
              </button>
              <button
                type="button"
                onClick={handleGuardarCambios}
                disabled={guardando}
                className="bg-[#0066FF] hover:bg-blue-600 active:scale-98 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2 disabled:opacity-60"
              >
                {guardando ? (
                  <>
                    <svg className="animate-spin size-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar cambios</span>
                )}
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* ── MODAL DE SESIONES ACTIVAS ── */}
      {modalSesionesAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0A1325] border border-slate-200 dark:border-[#16253B] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0066FF] flex items-center justify-center">
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                  Sesiones activas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalSesionesAbierto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#16253B] border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      Navegador actual (Web)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Sesión activa en este equipo · Conectado ahora
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  En uso
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setModalSesionesAbierto(false)}
                className="bg-[#0066FF] hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
