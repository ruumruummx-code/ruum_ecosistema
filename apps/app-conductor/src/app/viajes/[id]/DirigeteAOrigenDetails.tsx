"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TEXTOS_CARGANDO } from "@ruum/shared/constants";
import type { Database } from "@ruum/shared/types";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { avanzarEstadoTraslado } from "@ruum/api/services";
import { createNavigationOptions, type NavigationOption } from "@/lib/navigation-launcher";
import { formatearDuracion } from "../trips-utils";
import { EmergencyPanel } from "./EmergencyPanel";
import { SecondaryTripNavBar } from "./SecondaryTripNavBar";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];

function abrirNavegacion(option: NavigationOption) {
  if (!option.nativeHref || typeof window === "undefined") return;

  window.location.href = option.nativeHref;
  window.setTimeout(() => {
    if (document.visibilityState === "visible") {
      window.open(option.webHref, "_blank", "noopener,noreferrer");
    }
  }, 900);
}

function GoogleMapsLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.25 7.5 12.5 7.5 12.5s7.5-7.25 7.5-12.5C19.5 5.36 16.14 2 12 2Z"
        fill="#34A853"
      />
      <path d="M12 2C8.69 2 5.88 4.15 4.87 7.12L12 13l7.13-5.88C18.12 4.15 15.31 2 12 2Z" fill="#4285F4" />
      <path d="M4.87 7.12A7.46 7.46 0 0 0 4.5 9.5c0 2.75 1.84 5.95 3.92 8.47L12 13 4.87 7.12Z" fill="#FBBC05" />
      <path d="M19.13 7.12 12 13l3.58 4.97c2.08-2.52 3.92-5.72 3.92-8.47 0-.83-.13-1.63-.37-2.38Z" fill="#EA4335" />
      <circle cx="12" cy="9.5" r="3" fill="#FFFFFF" />
    </svg>
  );
}

function WazeLogo() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M12.5 3.5c-4.7 0-8.5 3.4-8.5 7.6 0 1.9.8 3.6 2 4.9-.3.9-.9 1.6-1.8 1.9 1.8.4 3.4.2 4.7-.4.9.3 1.9.5 3 .5 4.7 0 8.5-3.4 8.5-7.6S17.2 3.5 12.5 3.5Z"
        fill="#33CCFF"
        stroke="#0A1E3C"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="1.2" fill="#0A1E3C" />
      <circle cx="14.5" cy="10" r="1.2" fill="#0A1E3C" />
      <path
        d="M9.8 12.8c.7.9 1.6 1.3 2.7 1.3s2-.4 2.7-1.3"
        stroke="#0A1E3C"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8.5" cy="18.5" r="1.8" fill="#0A1E3C" />
      <circle cx="15.8" cy="18.5" r="1.8" fill="#0A1E3C" />
    </svg>
  );
}

function MiniMapaEstaticoRecoleccion({ ciudad }: { ciudad: string }) {
  return (
    <div
      data-origin-mini-map
      role="img"
      aria-label={`Mapa estático del punto de recolección en ${ciudad}`}
      className="relative my-2 flex h-[96px] max-h-[112px] min-h-[48px] w-full flex-1 items-center justify-center overflow-hidden rounded-xl border border-[#DCE6F4] bg-[#F2F4EF]"
    >
      <svg
        viewBox="0 0 400 120"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {/* Base terrain */}
        <rect width="400" height="120" fill="#F4F5F0" />
        {/* Green park areas */}
        <path d="M0 0 L155 0 L135 65 L75 95 L0 85 Z" fill="#CBE6A3" opacity="0.7" />
        <path d="M10 15 L120 5 L105 55 L20 68 Z" fill="#B7DC86" opacity="0.65" />
        <path d="M265 75 L340 65 L365 120 L250 120 Z" fill="#D5EBB5" opacity="0.6" />
        {/* Secondary streets */}
        <path
          d="M40 0 L95 120 M140 0 L115 120 M210 0 L190 120 M290 0 L260 120 M355 0 L325 120 M0 35 L400 28 M0 82 L400 74"
          stroke="#E2E6DC"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Main arterial roads */}
        <path
          d="M115 120 Q165 65 205 52 T310 0"
          stroke="#FCD34D"
          strokeWidth="4.5"
          fill="none"
        />
        <path
          d="M0 104 Q130 76 205 56 T400 18"
          stroke="#FBBF24"
          strokeWidth="4"
          fill="none"
        />
        <path
          d="M175 0 Q198 48 212 120"
          stroke="#FDE68A"
          strokeWidth="3.5"
          fill="none"
        />
      </svg>

      {/* Subtle map labels */}
      <span
        className="pointer-events-none absolute top-2.5 right-[24%] font-body text-[10px] font-semibold text-[#334155]"
        aria-hidden="true"
      >
        Naucalpan
      </span>
      <span
        className="pointer-events-none absolute bottom-2 left-4 font-body text-[9.5px] leading-tight font-medium text-[#475569]"
        aria-hidden="true"
      >
        Álvaro
        <br />
        Obregón
      </span>

      {/* Center Pin & City Label */}
      <div className="relative z-10 flex items-center gap-1.5 translate-x-3">
        <div className="relative flex flex-col items-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="#E11D38"
            className="drop-shadow-[0_3px_6px_rgba(225,29,56,0.4)]"
            aria-hidden="true"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="3" fill="#FFFFFF" />
          </svg>
          <span className="h-1.5 w-3 rounded-full bg-black/20 blur-[1px]" aria-hidden="true" />
        </div>
        <span className="rounded-md bg-white/85 px-1.5 py-0.5 font-display text-xs font-extrabold text-[#0A1E3C] shadow-2xs backdrop-blur-[2px]">
          {ciudad}
        </span>
      </div>
    </div>
  );
}

export function DirigeteAOrigenDetails({
  pasaporte,
  volver,
}: {
  pasaporte: PasaporteRow;
  volver: string;
}) {
  const router = useRouter();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trasladoId = pasaporte.traslado_id!;

  const origenCiudad = pasaporte.origen_ciudad || "Ciudad de México";
  const origenDireccion =
    pasaporte.origen_direccion || "LONDRES 819, Juárez, 06600, Ciudad de México";

  const distanciaTexto =
    pasaporte.distancia_km != null ? `${pasaporte.distancia_km.toFixed(1)} km` : "50.7 km";
  const duracionBase = formatearDuracion(pasaporte.tiempo_estimado_horas);
  const tiempoTexto = duracionBase === "Por confirmar" ? "01:10 h" : `${duracionBase} h`;

  const navigationTargetLat = pasaporte.origen_lat;
  const navigationTargetLng = pasaporte.origen_lng;

  const navOptions = useMemo(
    () =>
      createNavigationOptions({
        lat: navigationTargetLat,
        lng: navigationTargetLng,
        address: origenDireccion,
      }),
    [navigationTargetLat, navigationTargetLng, origenDireccion]
  );

  const googleOption = navOptions.find((opt) => opt.id === "google") ?? navOptions[0];
  const wazeOption = navOptions.find((opt) => opt.id === "waze") ?? navOptions[1];

  async function handleLlegueOrigen() {
    setProcesando(true);
    setError(null);
    try {
      const cliente = crearClienteNavegador();
      await avanzarEstadoTraslado(cliente, trasladoId, "conductor_en_camino_al_origen");
      router.refresh();
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos registrar tu llegada al origen."));
      setProcesando(false);
    }
  }

  return (
    <div
      data-en-camino-origen
      className="mx-auto flex h-screen max-h-[100dvh] w-full max-w-md flex-col justify-between overflow-hidden bg-[#F4F8FD] text-[#0A1E3C] select-none"
    >
      {/* CONTENIDO PRINCIPAL COMPACTO SIN SCROLL */}
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 px-4 pt-[max(10px,env(safe-area-inset-top))] pb-2.5">
        {/* 1. HEADER Y PESTAÑAS DE GESTIÓN SUPERIOR */}
        <div className="flex shrink-0 flex-col gap-2">
          <header
            className="grid grid-cols-[40px_1fr_auto] items-center gap-2"
            aria-label="Encabezado de traslado activo"
          >
            <Link
              href={volver}
              aria-label="Volver a la lista de Traslados"
              className="flex size-10 items-center justify-center rounded-full bg-[#E8F0FA] text-[#0A1E3C] transition hover:bg-[#DCE7F5] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0057D9]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </Link>

            <span className="text-center font-display text-[17px] font-black tracking-tight text-[#0A1E3C]">
              Traslado activo
            </span>

            <EmergencyPanel trasladoId={trasladoId} compact headerPill />
          </header>

          <SecondaryTripNavBar trasladoId={trasladoId} pasaporte={pasaporte} />
        </div>

        {/* 2. CAJA DE ESTADO DINÁMICA */}
        <section
          aria-label="Estado actual del traslado"
          className="flex shrink-0 items-center gap-3 rounded-2xl border border-[#DCE7F5] bg-[#E8F0FA] px-3.5 py-2.5 shadow-2xs"
        >
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#CEEFF6] text-[#0097B2]"
            aria-hidden="true"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 11l1.5-4.5a2 2 0 0 1 1.9-1.5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
              <rect x="3" y="11" width="18" height="6" rx="2" />
              <circle cx="7" cy="17" r="1.5" />
              <circle cx="17" cy="17" r="1.5" />
            </svg>
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="font-body text-[11px] font-medium text-[#5A6B87] leading-tight">
              Estado actual
            </span>
            <span className="mt-0.5 font-display text-[15px] font-black leading-tight text-[#0A1E3C]">
              En camino al origen
            </span>
            <span className="mt-0.5 truncate font-body text-xs text-[#4A5B78]">
              El conductor se dirige al punto de recolección.
            </span>
          </div>
        </section>

        {/* 3. MÓDULO DE PRÓXIMA ACCIÓN */}
        <section aria-label="Próxima acción" className="flex shrink-0 flex-col">
          <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#0057D9]">
            TU PRÓXIMA ACCIÓN
          </span>
          <h1 className="mt-0.5 font-display text-[21px] font-black leading-tight text-[#0A1E3C]">
            Dirígete al origen
          </h1>
          <p className="mt-0.5 font-body text-xs leading-snug text-[#4A5B78]">
            Navega con tu app favorita hacia el punto de recolección y registra tu llegada al estar en sitio.
          </p>
        </section>

        {/* 4. TARJETA DE RECOLECCIÓN CON MAPA INTEGRADO */}
        <section
          aria-label="Punto de recolección y navegación"
          className="flex min-h-0 flex-1 flex-col justify-between rounded-2xl border border-[#DCE7F5] bg-[#E8F0FA] p-3 shadow-2xs"
        >
          {/* Ubicación con pin rojo */}
          <div className="flex shrink-0 items-start gap-2.5">
            <div
              className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FDE2E6] text-[#E11D38]"
              aria-hidden="true"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
              </svg>
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-body text-[11px] font-medium text-[#5A6B87] leading-tight">
                Punto de recolección
              </span>
              <h2 className="mt-0.5 font-display text-[15px] font-black leading-tight text-[#0A1E3C]">
                {origenCiudad}
              </h2>
              <span className="mt-0.5 truncate font-body text-xs text-[#4A5B78]">
                {origenDireccion}
              </span>
            </div>
          </div>

          {/* Mini mapa estático centrado y recortado horizontalmente */}
          <MiniMapaEstaticoRecoleccion ciudad={origenCiudad} />

          {/* Accesos Rápidos a GPS integrados en la tarjeta */}
          <div
            className="grid shrink-0 grid-cols-2 gap-2.5"
            role="group"
            aria-label="Accesos rápidos a GPS"
          >
            <a
              href={googleOption?.href ?? "#"}
              aria-label="Abrir en Google Maps"
              target={googleOption?.nativeHref ? undefined : "_blank"}
              rel="noreferrer"
              onClick={(event) => {
                if (!googleOption?.nativeHref) return;
                event.preventDefault();
                abrirNavegacion(googleOption);
              }}
              className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-[#C5D7F2] bg-white px-2.5 py-1.5 text-left shadow-2xs transition hover:bg-[#F5F9FF] active:scale-[0.98]"
            >
              <GoogleMapsLogo />
              <span className="flex flex-col leading-tight">
                <span className="font-body text-[10px] font-medium text-[#5A6B87]">Abrir en </span>
                <span className="font-display text-xs font-extrabold text-[#0A1E3C]">Google Maps</span>
              </span>
            </a>

            <a
              href={wazeOption?.href ?? "#"}
              aria-label="Abrir en Waze"
              target={wazeOption?.nativeHref ? undefined : "_blank"}
              rel="noreferrer"
              onClick={(event) => {
                if (!wazeOption?.nativeHref) return;
                event.preventDefault();
                abrirNavegacion(wazeOption);
              }}
              className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-[#C5D7F2] bg-white px-2.5 py-1.5 text-left shadow-2xs transition hover:bg-[#F5F9FF] active:scale-[0.98]"
            >
              <WazeLogo />
              <span className="flex flex-col leading-tight">
                <span className="font-body text-[10px] font-medium text-[#5A6B87]">Abrir en </span>
                <span className="font-display text-xs font-extrabold text-[#0A1E3C]">Waze</span>
              </span>
            </a>
          </div>
        </section>

        {/* 5. MÉTRICAS DE APROXIMACIÓN */}
        <section
          aria-label="Métricas de aproximación"
          className="grid shrink-0 grid-cols-2 gap-2.5"
        >
          <div className="flex items-center gap-2.5 rounded-2xl border border-[#DCE7F5] bg-[#E8F0FA] px-3 py-2 shadow-2xs">
            <span className="flex size-8 shrink-0 items-center justify-center text-[#007791]" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="6" cy="19" r="2.5" />
                <circle cx="18" cy="5" r="2.5" />
                <path d="M8.5 19H12a3.5 3.5 0 0 0 0-7h0a3.5 3.5 0 0 1 0-7h3.5" />
              </svg>
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-body text-[11px] font-medium text-[#5A6B87] leading-tight">
                Distancia al origen
              </span>
              <span className="mt-0.5 font-display text-base font-black leading-tight text-[#0A1E3C] tabular-nums">
                {distanciaTexto}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-[#DCE7F5] bg-[#E8F0FA] px-3 py-2 shadow-2xs">
            <span className="flex size-8 shrink-0 items-center justify-center text-[#007791]" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15.5 14" />
              </svg>
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-body text-[11px] font-medium text-[#5A6B87] leading-tight">
                Tiempo estimado
              </span>
              <span className="mt-0.5 font-display text-base font-black leading-tight text-[#0A1E3C] tabular-nums">
                {tiempoTexto}
              </span>
            </div>
          </div>
        </section>

        {/* 6. BOTÓN DE CONFIRMACIÓN DE LLEGADA (FIJO EN BASE) */}
        <section data-trip-primary aria-label="Acción principal del traslado" className="shrink-0">
          <p role="status" className="sr-only">
            En camino al origen · Registra tu llegada al estar en sitio
          </p>
          {error && (
            <p role="alert" className="mb-1.5 font-body text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleLlegueOrigen}
            disabled={procesando}
            className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0066FF] px-4 py-3 font-display text-sm font-extrabold text-white shadow-[0_6px_18px_rgba(0,102,255,0.32)] transition hover:bg-[#0052CC] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesando ? (
              TEXTOS_CARGANDO.actualizando
            ) : (
              <>
                <span className="sr-only">🏁 </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="shrink-0"
                >
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                <span>Ya llegué al origen</span>
              </>
            )}
          </button>
        </section>
      </div>

      {/* 7. NAVEGACIÓN INFERIOR ESTÁNDAR (FIJA) */}
      <nav
        aria-label="Navegación principal móvil"
        className="shrink-0 border-t border-[#DCE7F5] bg-white/95 px-3 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(10,35,66,0.06)] backdrop-blur-md"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <Link
            href="/panel"
            className="flex min-h-[50px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 font-body text-xs font-medium text-[#5A6B87] transition hover:text-[#0A1E3C]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" />
              <path d="M9 21v-7h6v7" />
            </svg>
            <span className="leading-none">Inicio</span>
          </Link>

          <Link
            href="/viajes"
            aria-current="page"
            className="flex min-h-[50px] flex-col items-center justify-center gap-0.5 rounded-xl bg-[#CBF2F5] px-2 py-1 font-display text-xs font-extrabold text-[#0A1E3C]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="5" width="12" height="12" rx="2" />
              <path d="M14 9h4l4 4v4h-8M17 9v5h5" />
              <circle cx="6" cy="18" r="2" />
              <circle cx="18" cy="18" r="2" />
            </svg>
            <span className="leading-none">Traslados</span>
          </Link>

          <Link
            href="/cuenta"
            className="flex min-h-[50px] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 font-body text-xs font-medium text-[#5A6B87] transition hover:text-[#0A1E3C]"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="3.8" />
              <path d="M4 20c0-3.7 3.4-6.2 8-6.2s8 2.5 8 6.2" />
            </svg>
            <span className="leading-none">Cuenta</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
