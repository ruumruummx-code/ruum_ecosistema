"use client";

import { useState, useEffect, useId, useCallback } from "react";
import Link from "next/link";
import { AVISO_IDIOMA, IDIOMA_DISPONIBLE } from "../../../lib/idioma-aplicacion";
import { useTema } from "../../TemaProvider";
import { BotonTema } from "../../TemaProvider";
import { PassportCard, MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { Preferencias as SeccionPreferencias } from "../Preferencias";
import type { CuentaReal, Usuario } from "../cuenta-ui";
import { crearClienteNavegador } from "../../../lib/supabase-browser";
import { UserDashboardLayout } from "../../../components/layout/UserDashboardLayout";
import { construirNotificaciones } from "../../../lib/inicio";
import { InterruptorPreferencia, SelectorPreferencia } from "./ControlesPreferencias";
import {
  obtenerPreferenciasIniciales,
  guardarPreferenciasLocales,
  aplicarEfectosReales,
  sincronizarPreferenciasRemotas,
  claveLocalUsuario,
  PREFERENCIAS_POR_DEFECTO,
  type PreferenciasUsuarioContrato,
} from "../../../lib/preferencias-contrato";

interface PreferenciasClienteProps {
  cuenta: CuentaReal;
}

export function PreferenciasCliente({ cuenta }: PreferenciasClienteProps) {
  const usuario = cuenta.usuario;
  const idiomaAvisoId = useId();
  const { modo, fijarModo, alternar } = useTema();

  // Estados locales hidratados con el contrato unificado y aislados por usuario
  const [idioma, setIdioma] = useState<typeof IDIOMA_DISPONIBLE>(() => obtenerPreferenciasIniciales(usuario).idioma);
  const [zonaHoraria, setZonaHoraria] = useState(() => obtenerPreferenciasIniciales(usuario).zonaHoraria);
  const [unidades, setUnidades] = useState<"Métrico" | "Imperial">(() => obtenerPreferenciasIniciales(usuario).unidades);
  const [accesibilidad, setAccesibilidad] = useState<"Estándar" | "Alto contraste" | "Texto grande">(() => obtenerPreferenciasIniciales(usuario).accesibilidad);
  const [usoDatos, setUsoDatos] = useState<"Activado" | "Solo esenciales" | "Desactivado">(() => obtenerPreferenciasIniciales(usuario).usoDatos);
  const [alertasGenerales, setAlertasGenerales] = useState(() => obtenerPreferenciasIniciales(usuario).alertasGenerales);

  // Estados de la matriz de notificaciones
  const [notifRecordatoriosEmail, setNotifRecordatoriosEmail] = useState(() => obtenerPreferenciasIniciales(usuario).notifRecordatoriosEmail);
  const [notifRecordatoriosPush, setNotifRecordatoriosPush] = useState(() => obtenerPreferenciasIniciales(usuario).notifRecordatoriosPush);
  const [notifCambiosEstadoEmail, setNotifCambiosEstadoEmail] = useState(() => obtenerPreferenciasIniciales(usuario).notifCambiosEstadoEmail);
  const [notifCambiosEstadoPush, setNotifCambiosEstadoPush] = useState(() => obtenerPreferenciasIniciales(usuario).notifCambiosEstadoPush);
  const [notifPagosEmail, setNotifPagosEmail] = useState(() => obtenerPreferenciasIniciales(usuario).notifPagosEmail);
  const [notifPagosPush, setNotifPagosPush] = useState(() => obtenerPreferenciasIniciales(usuario).notifPagosPush);
  const [notifPromocionesEmail, setNotifPromocionesEmail] = useState(() => obtenerPreferenciasIniciales(usuario).notifPromocionesEmail);
  const [notifPromocionesPush, setNotifPromocionesPush] = useState(() => obtenerPreferenciasIniciales(usuario).notifPromocionesPush);

  // Estados de interfaz y persistencia sincrónica
  const [guardando, setGuardando] = useState(false);
  const [estadoGuardado, setEstadoGuardado] = useState<"inactivo" | "exito" | "error" | "pendiente">("inactivo");
  const [mensajeEstado, setMensajeEstado] = useState<string>("");
  const [modalSesionesAbierto, setModalSesionesAbierto] = useState(false);

  // Cargar / refrescar preferencias aisladas cuando el usuario cambia (evita fuga entre cuentas)
  useEffect(() => {
    const p = obtenerPreferenciasIniciales(usuario);
    setIdioma(p.idioma);
    setZonaHoraria(p.zonaHoraria);
    setUnidades(p.unidades);
    setAccesibilidad(p.accesibilidad);
    setUsoDatos(p.usoDatos);
    setAlertasGenerales(p.alertasGenerales);
    setNotifRecordatoriosEmail(p.notifRecordatoriosEmail);
    setNotifRecordatoriosPush(p.notifRecordatoriosPush);
    setNotifCambiosEstadoEmail(p.notifCambiosEstadoEmail);
    setNotifCambiosEstadoPush(p.notifCambiosEstadoPush);
    setNotifPagosEmail(p.notifPagosEmail);
    setNotifPagosPush(p.notifPagosPush);
    setNotifPromocionesEmail(p.notifPromocionesEmail);
    setNotifPromocionesPush(p.notifPromocionesPush);
    aplicarEfectosReales(p);
  }, [usuario]);

  const handleGuardarCambios = useCallback(async () => {
    setGuardando(true);
    setEstadoGuardado("inactivo");
    setMensajeEstado("");

    const payload: PreferenciasUsuarioContrato = {
      idioma,
      zonaHoraria,
      unidades,
      tema: modo === "dark" ? "Oscuro" : modo === "auto" ? "Automático" : "Claro",
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

    // 1. Guardar localmente aislado por usuario y aplicar efectos en el DOM
    guardarPreferenciasLocales(usuario?.id, payload);
    aplicarEfectosReales(payload);

    // 2. Sincronización remota con manejo honesto de errores (sin falso éxito)
    try {
      const cliente = crearClienteNavegador();
      const resultado = await sincronizarPreferenciasRemotas(cliente, usuario, payload);

      setGuardando(false);

      if (resultado.exito) {
        setEstadoGuardado("exito");
        setMensajeEstado("Cambios guardados con éxito");
        setTimeout(() => {
          setEstadoGuardado((prev) => (prev === "exito" ? "inactivo" : prev));
        }, 4000);
      } else {
        // Bloquear falso éxito: bajo ningún motivo invocar éxito si el remoto falló
        if (resultado.es503) {
          setEstadoGuardado("error");
          setMensajeEstado("Servicio no disponible (HTTP 503). Cambios guardados localmente.");
        } else if (resultado.esRed) {
          setEstadoGuardado("pendiente");
          setMensajeEstado("Sin conexión. Cambios guardados localmente; sincronización pendiente.");
        } else {
          setEstadoGuardado("error");
          setMensajeEstado(`Error al sincronizar con el servidor: ${resultado.error}.`);
        }
      }
    } catch (err: unknown) {
      setGuardando(false);
      setEstadoGuardado("error");
      const msg = err instanceof Error ? err.message : String(err);
      setMensajeEstado(`Error inesperado al sincronizar: ${msg}`);
    }
  }, [
    usuario, idioma, zonaHoraria, unidades, modo, accesibilidad, usoDatos, alertasGenerales,
    notifRecordatoriosEmail, notifRecordatoriosPush, notifCambiosEstadoEmail, notifCambiosEstadoPush,
    notifPagosEmail, notifPagosPush, notifPromocionesEmail, notifPromocionesPush,
  ]);

  // Reintento automático cuando se recupera la conexión a internet
  useEffect(() => {
    const alRecuperarRed = () => {
      if (estadoGuardado === "pendiente" || estadoGuardado === "error") {
        void handleGuardarCambios();
      }
    };
    window.addEventListener("online", alRecuperarRed);
    return () => window.removeEventListener("online", alRecuperarRed);
  }, [estadoGuardado, handleGuardarCambios]);

  const handleRestablecer = () => {
    const defecto = PREFERENCIAS_POR_DEFECTO;
    setIdioma(defecto.idioma);
    setZonaHoraria(defecto.zonaHoraria);
    setUnidades(defecto.unidades);
    setAccesibilidad(defecto.accesibilidad);
    setUsoDatos(defecto.usoDatos);
    setAlertasGenerales(defecto.alertasGenerales);
    setNotifRecordatoriosEmail(defecto.notifRecordatoriosEmail);
    setNotifRecordatoriosPush(defecto.notifRecordatoriosPush);
    setNotifCambiosEstadoEmail(defecto.notifCambiosEstadoEmail);
    setNotifCambiosEstadoPush(defecto.notifCambiosEstadoPush);
    setNotifPagosEmail(defecto.notifPagosEmail);
    setNotifPagosPush(defecto.notifPagosPush);
    setNotifPromocionesEmail(defecto.notifPromocionesEmail);
    setNotifPromocionesPush(defecto.notifPromocionesPush);
    fijarModo("light");

    if (typeof window !== "undefined") {
      try {
        const claveAislada = claveLocalUsuario(usuario?.id);
        window.localStorage.removeItem(claveAislada);
        window.localStorage.removeItem("ruum-usuario-preferencias");
      } catch {
        // ignore
      }
    }

    aplicarEfectosReales(defecto);
    setEstadoGuardado("inactivo");
    setMensajeEstado("");
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
        <NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario.nombre} />
        <MobileShell as="main" variant="compact" navInferiorVisible={false} className="user-v2-scope user-preferences-shell" contentClassName="user-preferences-content">
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
        </MobileShell>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. VISTA ESCRITORIO (>= 1024px): Shell unificado con UserSidebar y UserHeader
         ───────────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex h-full w-full">
        <UserDashboardLayout
          usuario={cuenta.usuario}
          nombre={cuenta.usuario?.nombre}
          correo={cuenta.correoRegistro}
          totalVehiculos={cuenta.vehiculos?.length}
          notificaciones={construirNotificaciones(
            cuenta.usuario,
            cuenta.traslados ?? []
          )}
          dashboardHeader
          padding="ninguno"
          idContenido="userDashboardMainContent"
        >
          <div className="flex-1 px-8 py-6 max-w-7xl w-full mx-auto pb-28">
            {/* Breadcrumb Enlace */}
            <div className="mb-2">
              <Link
                href="/cuenta"
                className="inline-flex items-center gap-1.5 text-xs font-semibold user-essential-link hover:underline transition"
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
              <p className="text-xs user-essential-muted mt-1">
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
                    <p className="text-xs user-essential-muted">Español</p>
                  </div>
                </div>
                <svg className="size-4 user-essential-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                    <p className="text-xs user-essential-muted">{textoTemaResumen}</p>
                  </div>
                </div>
                <svg className="size-4 user-essential-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                    <p className="text-xs user-essential-muted">{alertasGenerales ? "Activadas" : "Desactivadas"}</p>
                  </div>
                </div>
                <svg className="size-4 user-essential-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                    <p className="text-xs user-essential-muted">Configurada</p>
                  </div>
                </div>
                <svg className="size-4 user-essential-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                    <p className="text-[11px] user-essential-muted">
                      Configura el idioma, tu zona horaria y el sistema de unidades.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {/* Fila Idioma */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Idioma</p>
                        <p id={idiomaAvisoId} className="text-[11px] user-essential-muted">{AVISO_IDIOMA}</p>
                      </div>
                    </div>
                    {/* Segmented Switch Idioma */}
                    <div className="flex bg-slate-100 dark:bg-[#16253B] p-0.5 rounded-xl shrink-0">
                      <button
                        type="button"
                        aria-pressed="true"
                        aria-describedby={idiomaAvisoId}
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
                        disabled
                        lang="en"
                        aria-pressed="false"
                        aria-describedby={idiomaAvisoId}
                        className="text-xs px-4 py-1.5 rounded-lg font-medium text-slate-600 dark:text-slate-300 cursor-not-allowed opacity-60"
                      >
                        English
                      </button>
                    </div>
                  </div>

                  {/* Fila Zona horaria */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Zona horaria</p>
                        <p className="text-[11px] user-essential-muted">Se usará para mostrar fechas y horarios de tus traslados.</p>
                      </div>
                    </div>
                    <SelectorPreferencia
                      id="preferencias-zona-horaria"
                      etiquetaVisible="Zona horaria"
                      nombreAccesible="Zona horaria para mostrar fechas y horarios de traslados"
                      value={zonaHoraria}
                      onChange={(e) => setZonaHoraria(e.target.value)}
                    >
                      <option value="(UTC-06:00) Ciudad de México">(UTC-06:00) Ciudad de México</option>
                      <option value="(UTC-05:00) Cancún / Este">(UTC-05:00) Cancún / Este</option>
                      <option value="(UTC-07:00) Mazatlán / Pacífico">(UTC-07:00) Mazatlán / Pacífico</option>
                      <option value="(UTC-08:00) Tijuana / Noroeste">(UTC-08:00) Tijuana / Noroeste</option>
                    </SelectorPreferencia>
                  </div>

                  {/* Fila Unidades */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <rect x="2" y="7" width="20" height="10" rx="2" />
                        <line x1="6" y1="7" x2="6" y2="11" />
                        <line x1="10" y1="7" x2="10" y2="11" />
                        <line x1="14" y1="7" x2="14" y2="11" />
                        <line x1="18" y1="7" x2="18" y2="11" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Unidades</p>
                        <p className="text-[11px] user-essential-muted">Define el sistema de unidades para distancias, peso y consumo.</p>
                      </div>
                    </div>
                    <SelectorPreferencia
                      id="preferencias-unidades-region"
                      etiquetaVisible="Unidades"
                      nombreAccesible="Sistema de unidades para distancias, peso y consumo"
                      value={unidades}
                      onChange={(e) => setUnidades(e.target.value as "Métrico" | "Imperial")}
                    >
                      <option value="Métrico">Métrico</option>
                      <option value="Imperial">Imperial</option>
                    </SelectorPreferencia>
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
                    <p className="text-[11px] user-essential-muted">
                      Personaliza la apariencia y el comportamiento de la plataforma.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {/* Fila Tema */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Tema</p>
                        <p className="text-[11px] user-essential-muted">Elige el tema que mejor se adapte a ti.</p>
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
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Notificaciones y alertas</p>
                        <p className="text-[11px] user-essential-muted">Recibe avisos importantes sobre tus traslados y actividad.</p>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <InterruptorPreferencia
                      id="preferencias-alertas-generales"
                      evento="Notificaciones y alertas generales"
                      activo={alertasGenerales}
                      onAlternar={() => setAlertasGenerales(!alertasGenerales)}
                    />
                  </div>

                  {/* Fila Accesibilidad */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="4" r="2" />
                        <path d="M12 6v7m0 0l-3 6m3-6l3 6m-7-9h8" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Accesibilidad</p>
                        <p className="text-[11px] user-essential-muted">Ajustes de contraste, tamaño de letra y otras opciones de accesibilidad.</p>
                      </div>
                    </div>
                    <SelectorPreferencia
                      id="preferencias-accesibilidad"
                      etiquetaVisible="Accesibilidad"
                      nombreAccesible="Ajustes de contraste, tamaño de letra y accesibilidad"
                      value={accesibilidad}
                      onChange={(e) => setAccesibilidad(e.target.value as "Estándar" | "Alto contraste" | "Texto grande")}
                    >
                      <option value="Estándar">Estándar</option>
                      <option value="Alto contraste">Alto contraste</option>
                      <option value="Texto grande">Texto grande</option>
                    </SelectorPreferencia>
                  </div>

                  {/* Fila Unidades repetida según diseño */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <rect x="2" y="7" width="20" height="10" rx="2" />
                        <line x1="6" y1="7" x2="6" y2="11" />
                        <line x1="10" y1="7" x2="10" y2="11" />
                        <line x1="14" y1="7" x2="14" y2="11" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Unidades</p>
                        <p className="text-[11px] user-essential-muted">Sistema de unidades en la aplicación.</p>
                      </div>
                    </div>
                    <SelectorPreferencia
                      id="preferencias-unidades-app"
                      etiquetaVisible="Unidades"
                      nombreAccesible="Sistema de unidades en la aplicación"
                      value={unidades}
                      onChange={(e) => setUnidades(e.target.value as "Métrico" | "Imperial")}
                    >
                      <option value="Métrico">Métrico</option>
                      <option value="Imperial">Imperial</option>
                    </SelectorPreferencia>
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
                      <p className="text-[11px] user-essential-muted">
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
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2m14 0v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2m-8 0v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2m4 0h8" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Recordatorios de traslados</p>
                        <p className="text-[11px] user-essential-muted">Avisos previos a tus traslados programados.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 shrink-0">
                      {/* Email Toggle */}
                      <InterruptorPreferencia
                        id="preferencias-recordatorios-email"
                        evento="Recordatorios de traslados"
                        canal="Email"
                        activo={notifRecordatoriosEmail}
                        onAlternar={() => setNotifRecordatoriosEmail(!notifRecordatoriosEmail)}
                      />
                      {/* Push Toggle */}
                      <InterruptorPreferencia
                        id="preferencias-recordatorios-push"
                        evento="Recordatorios de traslados"
                        canal="Web y Push"
                        activo={notifRecordatoriosPush}
                        onAlternar={() => setNotifRecordatoriosPush(!notifRecordatoriosPush)}
                      />
                    </div>
                  </div>

                  {/* Fila 2: Cambios de estado */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Cambios de estado</p>
                        <p className="text-[11px] user-essential-muted">Notificaciones sobre el estado de tus traslados.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 shrink-0">
                      <InterruptorPreferencia
                        id="preferencias-cambios-estado-email"
                        evento="Cambios de estado de traslados"
                        canal="Email"
                        activo={notifCambiosEstadoEmail}
                        onAlternar={() => setNotifCambiosEstadoEmail(!notifCambiosEstadoEmail)}
                      />
                      <InterruptorPreferencia
                        id="preferencias-cambios-estado-push"
                        evento="Cambios de estado de traslados"
                        canal="Web y Push"
                        activo={notifCambiosEstadoPush}
                        onAlternar={() => setNotifCambiosEstadoPush(!notifCambiosEstadoPush)}
                      />
                    </div>
                  </div>

                  {/* Fila 3: Pagos y facturación */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Pagos y facturación</p>
                        <p className="text-[11px] user-essential-muted">Confirmaciones, comprobantes y avisos de pago.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 shrink-0">
                      <InterruptorPreferencia
                        id="preferencias-pagos-email"
                        evento="Pagos y facturación"
                        canal="Email"
                        activo={notifPagosEmail}
                        onAlternar={() => setNotifPagosEmail(!notifPagosEmail)}
                      />
                      <InterruptorPreferencia
                        id="preferencias-pagos-push"
                        evento="Pagos y facturación"
                        canal="Web y Push"
                        activo={notifPagosPush}
                        onAlternar={() => setNotifPagosPush(!notifPagosPush)}
                      />
                    </div>
                  </div>

                  {/* Fila 4: Promociones y novedades */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Promociones y novedades</p>
                        <p className="text-[11px] user-essential-muted">Noticias, promociones y nuevos servicios.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 shrink-0">
                      <InterruptorPreferencia
                        id="preferencias-promociones-email"
                        evento="Promociones y novedades"
                        canal="Email"
                        activo={notifPromocionesEmail}
                        onAlternar={() => setNotifPromocionesEmail(!notifPromocionesEmail)}
                      />
                      <InterruptorPreferencia
                        id="preferencias-promociones-push"
                        evento="Promociones y novedades"
                        canal="Web y Push"
                        activo={notifPromocionesPush}
                        onAlternar={() => setNotifPromocionesPush(!notifPromocionesPush)}
                      />
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
                    <p className="text-[11px] user-essential-muted">
                      Controla el uso de tu información y los permisos del dispositivo.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {/* Fila 1: Ubicación */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Ubicación</p>
                        <p className="text-[11px] user-essential-muted">Se autoriza desde el mapa y el navegador cuando usas servicios de traslado.</p>
                      </div>
                    </div>
                    {/* Info Pill */}
                    <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-950/40 user-essential-link dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 rounded-xl px-3 py-1.5 text-[11px] shrink-0 max-w-xs">
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
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Uso de datos</p>
                        <p className="text-[11px] user-essential-muted">Configura el uso de datos de la aplicación.</p>
                      </div>
                    </div>
                    <SelectorPreferencia
                      id="preferencias-uso-datos"
                      etiquetaVisible="Uso de datos"
                      nombreAccesible="Configuración de uso de datos de la aplicación"
                      value={usoDatos}
                      onChange={(e) => setUsoDatos(e.target.value as "Activado" | "Solo esenciales" | "Desactivado")}
                    >
                      <option value="Activado">Activado</option>
                      <option value="Solo esenciales">Solo esenciales</option>
                      <option value="Desactivado">Desactivado</option>
                    </SelectorPreferencia>
                  </div>

                  {/* Fila 3: Biometría */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11m0 0a8.003 8.003 0 0115.357-2m1.51 4.542a17.915 17.915 0 01-1.601 5.925" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Biometría</p>
                        <p className="text-[11px] user-essential-muted">La autenticación biométrica no está disponible en la versión web. Puedes usarla en nuestras apps móviles.</p>
                      </div>
                    </div>
                    <span className="bg-slate-100 dark:bg-slate-800 user-essential-muted text-xs font-medium px-3.5 py-1.5 rounded-xl shrink-0">
                      No disponible en web
                    </span>
                  </div>

                  {/* Fila 4: Sesiones activas */}
                  <div className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <svg className="size-5 user-essential-muted mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Sesiones activas</p>
                        <p className="text-[11px] user-essential-muted">Administra los dispositivos donde has iniciado sesión.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalSesionesAbierto(true)}
                      className="border border-[#0066FF] user-essential-link hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs font-semibold px-4 py-1.5 rounded-xl transition shrink-0"
                    >
                      Ver sesiones
                    </button>
                  </div>
                </div>
              </section>
            </div>
            {/* ── BARRA INFERIOR STICKY ── */}
            <footer className="sticky bottom-0 -mx-8 -mb-28 mt-8 bg-white/95 dark:bg-[#0A1325]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#16253B] px-8 py-3.5 flex items-center justify-between z-20 shadow-lg">
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
                  <p className="text-[11px] user-essential-muted leading-tight">
                    Las modificaciones se aplicarán a tu cuenta de inmediato.
                  </p>
                </div>
                {estadoGuardado === "exito" && (
                  <span
                    role="status"
                    aria-live="polite"
                    className="ml-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800"
                  >
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Cambios guardados con éxito
                  </span>
                )}
                {estadoGuardado === "pendiente" && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="ml-4 inline-flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800"
                  >
                    <svg className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{mensajeEstado || "Guardado localmente. Pendiente de sincronizar."}</span>
                    <button
                      type="button"
                      onClick={handleGuardarCambios}
                      className="underline hover:text-amber-900 dark:hover:text-amber-100 font-bold ml-1 cursor-pointer"
                    >
                      Reintentar
                    </button>
                  </div>
                )}
                {estadoGuardado === "error" && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="ml-4 inline-flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-3 py-1 rounded-full border border-rose-300 dark:border-rose-800"
                  >
                    <svg className="size-3.5 text-rose-600 dark:text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>{mensajeEstado || "Error al sincronizar con el servidor."}</span>
                    <button
                      type="button"
                      onClick={handleGuardarCambios}
                      className="underline hover:text-rose-900 dark:hover:text-rose-100 font-bold ml-1 cursor-pointer"
                    >
                      Reintentar
                    </button>
                  </div>
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
        </UserDashboardLayout>
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
                className="user-essential-muted hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
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
                    <p className="text-[11px] user-essential-muted">
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
