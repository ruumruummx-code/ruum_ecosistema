"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ETIQUETA_TIPO_VEHICULO, TEXTOS_CARGANDO } from "@ruum/shared/constants";
import type { Database } from "@ruum/shared/types";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { avanzarEstadoTraslado } from "@ruum/api/services";
import { createNavigationOptions, type NavigationOption } from "@/lib/navigation-launcher";
import { formatearDuracion, nombreVehiculo } from "../trips-utils";
import { EmergencyPanel } from "./EmergencyPanel";
import { SecondaryTripNavBar } from "./SecondaryTripNavBar";
import { TripSupportDialog } from "./TripSupportDialog";
import { TripDialog } from "./TripDialog";
import { ChatViaje } from "./ChatViaje";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];

function extraerEtiquetaPostalOColonia(direccion: string | null, referencias?: string | null): string {
  const fuente = [referencias, direccion].filter(Boolean).join(" ");
  const zipExplicito = fuente.match(/ZIP\s*\d{4,5}/i);
  if (zipExplicito) return zipExplicito[0].toUpperCase().replace(/\s+/, " ");
  if (direccion) {
    const cpMatch = direccion.match(/(?:,\s*|\bC\.?P\.?\s*)(\d{4,5})\b/i);
    if (cpMatch) return `ZIP ${cpMatch[1]}`;
    const partes = direccion
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (partes.length > 1) return partes[1];
  }
  return "ZIP 0293";
}

function formatearCitaAsignada(pasaporte: PasaporteRow): string {
  const raw =
    (pasaporte as { fecha_hora_programada?: string | null }).fecha_hora_programada ?? pasaporte.creado_en;
  if (!raw) return "12:32 p.m. hoy";
  try {
    const fecha = new Date(raw);
    if (Number.isNaN(fecha.getTime())) return "12:32 p.m. hoy";
    const partes = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Mexico_City",
    }).formatToParts(fecha);
    const map = Object.fromEntries(partes.map((p) => [p.type, p.value]));
    const periodo = (map.dayPeriod || "").toLowerCase().includes("p") ? "p.m." : "a.m.";
    return `${map.hour}:${map.minute} ${periodo} hoy`;
  } catch {
    return "12:32 p.m. hoy";
  }
}

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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
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
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
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

export function TrasladoAsignadoDetails({
  pasaporte,
  volver: _volver,
}: {
  pasaporte: PasaporteRow;
  volver: string;
}) {
  const router = useRouter();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [soporteAbierto, setSoporteAbierto] = useState(false);

  const trasladoId = pasaporte.traslado_id!;

  const origenCiudad = pasaporte.origen_ciudad || "Ciudad de México";
  const origenDireccion = pasaporte.origen_direccion || "LONDRES 899, Juárez, 06600, Ciudad de México";
  const etiquetaZip = extraerEtiquetaPostalOColonia(pasaporte.origen_direccion, pasaporte.origen_referencias);

  const navigationTargetLat = pasaporte.origen_lat;
  const navigationTargetLng = pasaporte.origen_lng;

  const nombreAutoBase = nombreVehiculo(pasaporte);
  const autoNombre = nombreAutoBase === "Vehículo" ? "Chrysler Stratus 2015" : nombreAutoBase;
  const placas = pasaporte.vehiculo_placas || "POM365";
  const color = pasaporte.vehiculo_color || "Gris";
  const categoriaVehiculo = (
    pasaporte.vehiculo_tipo ? ETIQUETA_TIPO_VEHICULO[pasaporte.vehiculo_tipo] : "SEDÁN"
  ).toUpperCase();

  const contactoNombre = pasaporte.contacto_entrega_nombre || "Héctor Lomelín";
  const contactoTelefono = pasaporte.contacto_entrega_telefono || "";
  const telefonoLimpio = contactoTelefono.replace(/[^0-9]/g, "");

  const gananciaNeta = pasaporte.ganancia_conductor ?? 531.45;
  const distanciaTotal =
    pasaporte.distancia_km != null ? `${pasaporte.distancia_km.toFixed(1)} km` : "50.7 km";
  const duracionBase = formatearDuracion(pasaporte.tiempo_estimado_horas);
  const tiempoEstimado = duracionBase === "Por confirmar" ? "01:10 h" : `${duracionBase} h`;

  const citaTexto = useMemo(() => formatearCitaAsignada(pasaporte), [pasaporte]);

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

  async function handleIniciarCamino() {
    setProcesando(true);
    setError(null);
    try {
      const cliente = crearClienteNavegador();
      await avanzarEstadoTraslado(cliente, trasladoId, "conductor_asignado");
      router.refresh();
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos iniciar el traslado. Intenta de nuevo."));
      setProcesando(false);
    }
  }

  return (
    <div
      data-assigned-trip
      className="mx-auto flex h-screen max-h-[100dvh] w-full max-w-md flex-col justify-between overflow-hidden bg-[#F4F8FD] text-[#0A1E3C] select-none"
    >
      {/* CONTENIDO COMPACTO SIN SCROLL VERTICAL */}
      <div
        className="flex min-h-0 flex-1 flex-col justify-between px-4 pt-[max(10px,env(safe-area-inset-top))] pb-2.5"
      >
        {/* 1. HEADER INSTITUCIONAL Y CITA */}
        <div className="flex flex-col gap-2.5">
          <header
            className="flex items-center justify-between gap-2"
            aria-label="Encabezado institucional de traslado asignado"
          >
            <Link
              href="/panel"
              className="inline-flex items-center rounded-xl bg-white/80 px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0057D9]"
              aria-label="Ruum Ruum, inicio"
            >
              <Image
                src="/imagenes/ruum-logo.svg"
                alt="Ruum Ruum"
                width={126}
                height={38}
                priority
                className="h-8 w-auto"
              />
            </Link>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setSoporteAbierto(true)}
                aria-label="Soporte"
                className="inline-flex min-h-[36px] cursor-pointer items-center gap-1 rounded-xl bg-[#E8F0FA] px-2.5 py-1 font-display text-xs font-bold text-[#0A1E3C] shadow-2xs transition hover:bg-[#DCE7F5] active:scale-95"
              >
                💬 Soporte
              </button>
              <EmergencyPanel trasladoId={trasladoId} compact headerPill />
            </div>
          </header>

          <SecondaryTripNavBar trasladoId={trasladoId} pasaporte={pasaporte} />

          {/* Caja de estado horizontal dividida en dos */}
          <section
            aria-label="Estado actual y cita"
            className="grid grid-cols-[1.15fr_1px_0.85fr] items-center gap-3 rounded-2xl border border-[#DCE7F5] bg-[#E8F0FA] px-3.5 py-2.5 shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#CEEFF6] text-[#0097B2]"
                aria-hidden="true"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="flex flex-col items-start gap-1 min-w-0">
                <span className="font-body text-[10px] font-bold uppercase tracking-wider text-[#5A6B87] leading-none">
                  ESTADO ACTUAL
                </span>
                <span className="inline-flex items-center rounded-full border border-[#8AB4F8] bg-[#E1EDFF] px-3 py-0.5 font-body text-xs font-bold text-[#0A2540]">
                  Asignado
                </span>
              </div>
            </div>

            <div className="h-9 w-px bg-[#C9D8EC]" aria-hidden="true" />

            <div className="flex flex-col items-start pl-1 min-w-0">
              <span className="font-body text-[10px] font-bold uppercase tracking-wider text-[#5A6B87] leading-none">
                CITA
              </span>
              <span className="mt-1 truncate font-display text-[15px] font-black leading-tight text-[#003B95]">
                {citaTexto}
              </span>
            </div>
          </section>
        </div>

        {/* 2. BLOQUE DE PRÓXIMA ACCIÓN */}
        <section aria-label="Próxima acción" className="flex flex-col">
          <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#1E62D0]">
            TU PRÓXIMA ACCIÓN
          </span>
          <h1 className="mt-0.5 font-display text-[22px] font-black leading-tight text-[#0A1E3C]">
            Prepárate para salir
          </h1>
          <p className="mt-0.5 font-body text-[13px] leading-snug text-[#4A5B78]">
            Revisa la información del vehículo y el contacto.
          </p>
        </section>

        {/* 3. TARJETA UNIFICADA DE VEHÍCULO A TRASLADAR */}
        <section
          aria-label="Vehículo a trasladar"
          className="rounded-2xl border border-[#DCE6F4] bg-white p-3 shadow-[0_4px_14px_rgba(10,35,66,0.05)]"
        >
          <div className="flex items-center justify-between gap-2.5">
            {/* Imagen del automóvil */}
            <div className="flex w-[96px] sm:w-[108px] shrink-0 items-center justify-center">
              <Image
                src="/imagenes/vehiculo-asignado.svg"
                alt={autoNombre}
                width={108}
                height={56}
                className="h-auto w-full object-contain"
              />
            </div>

            {/* Detalles del vehículo */}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-display text-[9.5px] font-extrabold uppercase tracking-wider text-[#1E62D0] leading-none">
                VEHÍCULO A TRASLADAR
              </span>
              <h2 className="mt-1 truncate font-display text-[15px] sm:text-base font-black leading-tight text-[#0A1E3C]">
                {autoNombre}
              </h2>
              <span className="mt-0.5 font-body text-xs text-[#4A5B78]">Color: {color}</span>
            </div>

            {/* Categoría y Placas */}
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="rounded-full bg-[#DCE8FC] px-2.5 py-0.5 font-display text-[9.5px] font-extrabold uppercase tracking-wider text-[#1A3A6E]">
                {categoriaVehiculo}
              </span>
              <div className="min-w-[72px] rounded-xl border border-[#DCE5F2] bg-[#F0F4FA] px-2.5 py-1 text-center">
                <span className="block font-body text-[8.5px] font-bold uppercase tracking-wider text-[#5A6B87] leading-none">
                  PLACAS
                </span>
                <span className="mt-0.5 block font-display text-xs font-black tracking-wider text-[#0A1E3C] leading-none">
                  {placas}
                </span>
              </div>
            </div>
          </div>

          {/* Fila inferior de métricas clave con división punteada horizontal */}
          <div
            aria-label="Métricas del viaje"
            className="mt-2.5 flex items-center justify-between gap-1 border-t border-dashed border-[#CBD5E1] pt-2.5"
          >
            {/* Precio */}
            <div className="flex items-center gap-1.5">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#DCE8FC] font-display text-xs font-black text-[#0057D9]"
                aria-hidden="true"
              >
                $
              </span>
              <span className="font-display text-[13px] font-black text-[#0A1E3C] tabular-nums">
                ${gananciaNeta.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <span className="text-xs text-[#94A3B8]" aria-hidden="true">
              •
            </span>

            {/* Distancia */}
            <div className="flex items-center gap-1.5">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#DCE8FC] text-[#0057D9]"
                aria-hidden="true"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
                </svg>
              </span>
              <span className="font-display text-[13px] font-black text-[#0A1E3C] tabular-nums">
                {distanciaTotal}
              </span>
            </div>

            <span className="text-xs text-[#94A3B8]" aria-hidden="true">
              •
            </span>

            {/* Duración */}
            <div className="flex items-center gap-1.5">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#DCE8FC] text-[#0057D9]"
                aria-hidden="true"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 10.41 3.29 3.3-1.42 1.41L11 13V7h2v5.41z" />
                </svg>
              </span>
              <span className="font-display text-[13px] font-black text-[#0A1E3C] tabular-nums">
                {tiempoEstimado}
              </span>
            </div>
          </div>
        </section>

        {/* 4. SECCIÓN DE RECOLECCIÓN Y CONTACTO DEL PASAJERO */}
        <section
          aria-label="Punto de recolección y contacto"
          className="rounded-2xl border border-[#DCE7F5] bg-[#E8F0FA] p-3 shadow-2xs"
        >
          {/* Punto de Recolección */}
          <div className="flex items-start gap-2.5">
            <div
              className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FDE2E6] text-[#E11D38]"
              aria-hidden="true"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
              </svg>
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="font-display text-[9.5px] font-extrabold uppercase tracking-wider text-[#1E62D0] leading-none">
                PUNTO DE RECOLECCIÓN
              </span>
              <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
                <span className="font-display text-[15px] font-black leading-tight text-[#0A1E3C]">
                  {origenCiudad}
                </span>
                {etiquetaZip && (
                  <span className="font-body text-xs font-normal text-[#5A6B87]">({etiquetaZip})</span>
                )}
              </div>
              <span className="mt-0.5 truncate font-body text-xs text-[#4A5B78]">{origenDireccion}</span>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-[#E2EAF4] bg-white px-3 py-2 shadow-2xs">
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E1EDFF] font-display text-sm font-black text-[#0057D9]"
                aria-hidden="true"
              >
                {contactoNombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-display text-xs font-black uppercase text-[#0A1E3C]">
                  {contactoNombre}
                </span>
                <span className="font-body text-[11px] leading-tight text-[#5A6B87]">Entrega la unidad</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={telefonoLimpio ? `tel:+${telefonoLimpio}` : "#"}
                aria-label={`Llamar a ${contactoNombre}`}
                className="flex size-9 items-center justify-center rounded-full border border-[#6EE7B7] bg-[#D1FAE5] text-[#059669] transition active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                </svg>
              </a>

              <button
                type="button"
                onClick={() => setChatAbierto(true)}
                aria-label={`Abrir chat con ${contactoNombre}`}
                aria-haspopup="dialog"
                aria-expanded={chatAbierto}
                className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-[#93C5FD] bg-[#DCE8FC] text-[#0057D9] transition active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 9H7V9h10v2zm-4 3H7v-2h6v2z" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* 5. ACCESOS RÁPIDOS A GPS EXTERNOS */}
        <div className="grid grid-cols-2 gap-2.5" role="group" aria-label="Accesos rápidos a GPS externos">
          <a
            href={googleOption?.href ?? "#"}
            target={googleOption?.nativeHref ? undefined : "_blank"}
            rel="noreferrer"
            onClick={(event) => {
              if (!googleOption?.nativeHref) return;
              event.preventDefault();
              abrirNavegacion(googleOption);
            }}
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-[#93B8E8] bg-white px-2.5 py-2 font-display text-xs font-bold text-[#0A2540] shadow-2xs transition hover:bg-[#F5F9FF] active:scale-[0.98]"
          >
            <GoogleMapsLogo />
            <span className="truncate">Abrir en Google Maps</span>
          </a>

          <a
            href={wazeOption?.href ?? "#"}
            target={wazeOption?.nativeHref ? undefined : "_blank"}
            rel="noreferrer"
            onClick={(event) => {
              if (!wazeOption?.nativeHref) return;
              event.preventDefault();
              abrirNavegacion(wazeOption);
            }}
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-[#93B8E8] bg-white px-2.5 py-2 font-display text-xs font-bold text-[#0A2540] shadow-2xs transition hover:bg-[#F5F9FF] active:scale-[0.98]"
          >
            <WazeLogo />
            <span className="truncate">Abrir en Waze</span>
          </a>
        </div>

        {/* 6. BOTÓN DE ACCIÓN DOMINANTE (FIJO EN BASE) */}
        <section data-trip-primary aria-label="Acción principal del traslado" className="pt-0.5">
          <p role="status" className="sr-only">
            Asignado · Prepárate para salir
          </p>
          {error && (
            <p role="alert" className="mb-1.5 font-body text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleIniciarCamino}
            disabled={procesando}
            className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00B4C5] to-[#00CFD5] px-4 py-3 font-display text-sm font-extrabold text-white shadow-[0_6px_18px_rgba(0,196,204,0.34)] transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesando ? (
              TEXTOS_CARGANDO.actualizando
            ) : (
              <>
                <span className="sr-only">⚡ </span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                  className="shrink-0"
                >
                  <path d="M21 3 3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" />
                </svg>
                <span>Iniciar camino al punto de recolección</span>
                <span className="sr-only"> ESTOY EN CAMINO AL ORIGEN</span>
                <span className="sr-only"> ➔</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="shrink-0"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </section>
      </div>

      {/* 7. MENÚ DE NAVEGACIÓN INFERIOR (FIJO) */}
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
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

      {/* Modal de Chat con el Contacto */}
      {chatAbierto && (
        <TripDialog title={`Chat · ${contactoNombre}`} onClose={() => setChatAbierto(false)}>
          <ChatViaje trasladoId={trasladoId} estado={pasaporte.estado ?? "conductor_asignado"} />
        </TripDialog>
      )}

      {/* Modal de Soporte */}
      {soporteAbierto && (
        <TripSupportDialog onClose={() => setSoporteAbierto(false)} />
      )}
    </div>
  );
}
