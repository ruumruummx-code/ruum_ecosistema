"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { TEXTOS_CARGANDO } from "@ruum/shared/constants";
import type { Database } from "@ruum/shared/types";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { avanzarEstadoTraslado, confirmarLlegadaDestino, obtenerPasaporteDigital } from "@ruum/api/services";
import { createNavigationOptions, type NavigationOption } from "@/lib/navigation-launcher";
import { EmergencyPanel } from "./EmergencyPanel";
import { SecondaryTripNavBar } from "./SecondaryTripNavBar";
import { TripDialog } from "./TripDialog";
import { ChatViaje } from "./ChatViaje";
import { EvidenciaSoporteSheet } from "./evidencia/EvidenciaSoporteSheet";

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

function MiniMapaRutaEnTransito({ destinoCiudad }: { destinoCiudad: string }) {
  return (
    <div
      data-transit-mini-map
      aria-label={`Mapa de ruta en tiempo real hacia ${destinoCiudad}`}
      className="relative flex h-[98px] w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#D5E2F2] bg-[#EEF4FC] shadow-2xs"
    >
      <svg
        viewBox="0 0 380 98"
        className="size-full object-cover"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {/* Calles y manzanas de fondo */}
        <rect width="380" height="98" fill="#EEF4FC" />
        <rect x="15" y="10" width="60" height="35" rx="4" fill="#E2EDFA" />
        <rect x="85" y="8" width="80" height="25" rx="4" fill="#E2EDFA" />
        <rect x="175" y="10" width="70" height="30" rx="4" fill="#E2EDFA" />
        <rect x="255" y="8" width="110" height="32" rx="4" fill="#E2EDFA" />

        <rect x="15" y="55" width="70" height="35" rx="4" fill="#E5F0FA" />
        <rect x="95" y="60" width="95" height="30" rx="4" fill="#E2EDFA" />
        <rect x="200" y="58" width="60" height="32" rx="4" fill="#E8F4E5" />
        <rect x="270" y="55" width="95" height="35" rx="4" fill="#E2EDFA" />

        {/* Rotonda */}
        <circle cx="236" cy="50" r="14" fill="none" stroke="#D1E2F5" strokeWidth="6" />

        {/* Vías principales */}
        <line x1="0" y1="50" x2="380" y2="50" stroke="#FFFFFF" strokeWidth="8" />
        <line x1="80" y1="0" x2="80" y2="98" stroke="#FFFFFF" strokeWidth="6" />
        <line x1="170" y1="0" x2="170" y2="98" stroke="#FFFFFF" strokeWidth="6" />
        <line x1="250" y1="0" x2="250" y2="98" stroke="#FFFFFF" strokeWidth="6" />

        {/* Línea de ruta azul */}
        <path
          d="M 40 76 Q 80 74 135 68 L 175 62 Q 215 54 235 52 L 250 50 Q 280 50 300 50"
          fill="none"
          stroke="#0066FF"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Punto de inicio: Tu ubicación */}
        <circle cx="40" cy="76" r="6" fill="#0066FF" />
        <circle cx="40" cy="76" r="9" fill="#0066FF" fillOpacity="0.25" />

        {/* Vehículo en tránsito */}
        <g transform="translate(162, 53) rotate(-10)">
          <rect x="-2" y="2" width="22" height="11" rx="4" fill="rgba(0,0,0,0.2)" />
          <rect x="0" y="0" width="21" height="10" rx="3.5" fill="#FFFFFF" stroke="#0A1E3C" strokeWidth="1" />
          <rect x="5" y="2" width="10" height="6" rx="2" fill="#0A1E3C" />
          <circle cx="20" cy="2" r="1" fill="#FEF08A" />
          <circle cx="20" cy="8" r="1" fill="#FEF08A" />
        </g>

        {/* Pin de llegada */}
        <g transform="translate(298, 38)">
          <path
            d="M 12 0 C 5.37 0 0 5.37 0 12 C 0 20 12 30 12 30 C 12 30 24 20 24 12 C 24 5.37 18.63 0 12 0 Z"
            fill="#EF4444"
          />
          <circle cx="12" cy="11" r="4.5" fill="#FFFFFF" />
        </g>
      </svg>

      {/* Pill: Tu ubicación */}
      <div className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[9.5px] font-bold text-[#0A1E3C] shadow-xs backdrop-blur-xs">
        <span className="size-2 rounded-full bg-[#0066FF]" />
        <span>Tu ubicación</span>
      </div>

      {/* Pill: Destino */}
      <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9.5px] font-bold text-[#0A1E3C] shadow-xs backdrop-blur-xs">
        <span className="size-2 rounded-full bg-[#EF4444]" />
        <span className="truncate max-w-[100px]">{destinoCiudad}</span>
      </div>
    </div>
  );
}

export function ConduceADestinoDetails({
  pasaporte,
  volver,
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

  const destinoCiudad = pasaporte.destino_ciudad || "Lerma de Villada";
  const destinoDireccion =
    pasaporte.destino_direccion || "Calle Calvario, S, CENTRO, 52000, Lerma de México, Estado de México";

  const navigationTargetLat = pasaporte.destino_lat;
  const navigationTargetLng = pasaporte.destino_lng;

  const marca = pasaporte.vehiculo_marca || "Chrysler";
  const modelo = pasaporte.vehiculo_modelo || "Cirrus";
  const anio = pasaporte.vehiculo_anio ? String(pasaporte.vehiculo_anio) : "2000";
  const placas = pasaporte.vehiculo_placas || "POM385";

  const contactoNombre =
    pasaporte.contacto_recepcion_nombre || pasaporte.contacto_entrega_nombre || "Héctor Lomelín";
  const contactoTelefono =
    pasaporte.contacto_recepcion_telefono || pasaporte.contacto_entrega_telefono || "+525555555555";
  const telefonoLimpio = contactoTelefono.replace(/[^0-9]/g, "");

  // Iniciales para el avatar (ej. "HL")
  const iniciales = contactoNombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const navOptions = useMemo(
    () =>
      createNavigationOptions({
        lat: navigationTargetLat,
        lng: navigationTargetLng,
        address: destinoDireccion,
      }),
    [navigationTargetLat, navigationTargetLng, destinoDireccion]
  );

  async function handleLlegueDestino() {
    setProcesando(true);
    setError(null);

    try {
      const cliente = crearClienteNavegador();

      const pasaporteFresco = await obtenerPasaporteDigital(cliente, trasladoId);
      const estadoDb = pasaporteFresco?.estado || pasaporte.estado;

      if (estadoDb === "evidencia_final_en_proceso") {
        router.push(`/viajes/${trasladoId}/evidencia`);
        return;
      }

      if (estadoDb === "traslado_en_curso") {
        await confirmarLlegadaDestino(cliente, trasladoId, { fueraGeocerca: false, distanciaM: 0 });
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      await avanzarEstadoTraslado(cliente, trasladoId, "llegada_a_destino");
      router.push(`/viajes/${trasladoId}/evidencia`);
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos registrar tu llegada al destino. Intenta de nuevo."));
      setProcesando(false);
    }
  }

  return (
    <div
      data-en-traslado
      className="mx-auto flex h-screen max-h-[100dvh] w-full max-w-md flex-col justify-between overflow-hidden bg-[#F4F8FD] text-[#0A1E3C] select-none"
    >
      {/* CONTENIDO PRINCIPAL COMPACTO SIN SCROLL */}
      <div
        data-trip-scroll
        className="flex min-h-0 flex-1 flex-col justify-between gap-2 px-4 pt-[max(10px,env(safe-area-inset-top))] pb-2.5"
      >
        {/* 1. HEADER Y PESTAÑAS SUPERIORES */}
        <div className="flex shrink-0 flex-col gap-2">
          <header
            className="grid grid-cols-[40px_1fr_auto_auto] items-center gap-2"
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

            {/* Botón de Ayuda: Soporte */}
            <button
              type="button"
              onClick={() => setSoporteAbierto(true)}
              aria-label="Soporte"
              className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full border border-[#DCE7F5] bg-white px-2.5 py-1.5 font-display text-xs font-bold text-[#0A1E3C] shadow-2xs transition hover:bg-[#F0F5FA] active:scale-95"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Soporte</span>
            </button>

            {/* Botón Rojo de Emergencia */}
            <EmergencyPanel trasladoId={trasladoId} compact headerPill />
          </header>

          <SecondaryTripNavBar trasladoId={trasladoId} pasaporte={pasaporte} />
        </div>

        {/* 2. CAJA DE ESTADO (EN MOVIMIENTO) */}
        <div
          role="status"
          aria-label="Estado actual: En traslado. En ruta"
          className="flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-[#DCE7F5] bg-[#E8F0FA] px-3.5 py-2.5 shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
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
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="font-body text-[9.5px] font-bold uppercase tracking-wider text-[#5A6B87] leading-tight">
                ESTADO ACTUAL
              </span>
              <span className="font-display text-base font-black text-[#0A1E3C] leading-tight mt-0.5">
                En traslado
              </span>
            </div>
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#86EFAC] bg-[#DCFCE7] px-3 py-1 font-display text-xs font-black text-[#15803D]">
            <span className="size-2 rounded-full bg-[#22C55E]" aria-hidden="true" />
            <span>En ruta</span>
          </span>
        </div>

        {/* 3. MÓDULO DE PRÓXIMA ACCIÓN */}
        <section aria-label="Próxima acción" className="flex shrink-0 flex-col">
          <span className="font-display text-[10px] font-extrabold uppercase tracking-wider text-[#0057D9]">
            TU PRÓXIMA ACCIÓN
          </span>
          <h1 className="mt-0.5 font-display text-[21px] font-black leading-tight text-[#0A1E3C]">
            Dirígete al destino
          </h1>
          <p className="mt-0.5 font-body text-xs leading-snug text-[#4A5B78]">
            Conduce con precaución hacia el punto de entrega y registra tu llegada al estar en sitio.
          </p>
        </section>

        {/* 4. TARJETA DE INFORMACIÓN DEL VEHÍCULO EN TRÁNSITO */}
        <section
          aria-label="Vehículo en tránsito"
          className="flex shrink-0 items-center gap-3 rounded-2xl border border-[#DCE7F5] bg-[#E8F0FA] p-2.5 shadow-2xs"
        >
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1">
            <Image
              src="/imagenes/vehiculo-asignado.svg"
              alt={`Auto ${marca} ${modelo} ${anio}`}
              width={76}
              height={50}
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="font-body text-[9px] font-bold uppercase tracking-wider text-[#5A6B87] leading-none">
              VEHÍCULO EN TRÁNSITO
            </span>
            <span className="mt-0.5 truncate font-display text-sm font-black text-[#0A1E3C]">
              {marca} {modelo} {anio}
            </span>
            <span className="font-body text-xs text-[#5A6B87] leading-tight mt-0.5">
              Placas: {placas}
            </span>
          </div>
        </section>

        {/* 5. MÓDULO DE DESTINO FINAL Y CONTACTO */}
        <div className="flex shrink-0 flex-col gap-2">
          {/* Destino Final */}
          <section
            aria-label="Destino final"
            className="flex items-center justify-between gap-2.5 rounded-2xl border border-[#DCE7F5] bg-[#E8F0FA] p-3 shadow-2xs"
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <div
                className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-[#DC2626]"
                aria-hidden="true"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="font-display text-[9.5px] font-extrabold uppercase tracking-wider text-[#5A6B87] leading-none">
                  DESTINO FINAL
                </span>
                <span className="mt-0.5 truncate font-display text-sm font-black text-[#0A1E3C]">
                  {destinoCiudad}
                </span>
                <span className="truncate font-body text-[11px] text-[#5A6B87] leading-tight mt-0.5">
                  {destinoDireccion}
                </span>
              </div>
            </div>

            <a
              href={
                navOptions[0]?.href ??
                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinoDireccion)}`
              }
              target={navOptions[0]?.nativeHref ? undefined : "_blank"}
              rel="noreferrer"
              aria-label="Ver ruta hacia el destino"
              onClick={(e) => {
                if (navOptions[0]?.nativeHref) {
                  e.preventDefault();
                  abrirNavegacion(navOptions[0]);
                }
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#CCE0F8] bg-white px-3 py-2 font-display text-xs font-bold text-[#0066FF] shadow-2xs transition hover:bg-[#F5F9FF] active:scale-95"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Ver ruta</span>
            </a>
          </section>

          {/* Contacto del Pasajero */}
          <section
            aria-label="Contacto del pasajero"
            className="flex items-center justify-between gap-2 rounded-2xl border border-[#DCE7F5] bg-[#E8F0FA] p-2.5 shadow-2xs"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#CEE5FD] font-display text-xs font-black text-[#0057D9]"
                aria-hidden="true"
              >
                {iniciales || "HL"}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-display text-xs font-black text-[#0A1E3C]">
                  {contactoNombre}
                </span>
                <span className="font-body text-[11px] text-[#5A6B87] leading-tight">
                  Hacia la unidad
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* WhatsApp */}
              <a
                href={telefonoLimpio ? `https://wa.me/${telefonoLimpio}` : "#"}
                target="_blank"
                rel="noreferrer"
                aria-label={`Enviar WhatsApp a ${contactoNombre}`}
                className="flex size-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xs transition hover:brightness-105 active:scale-95"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.04c-.24.67-1.39 1.28-1.92 1.36-.5.08-1.15.11-3.32-.78-2.65-1.09-4.34-3.79-4.47-3.96-.13-.17-1.08-1.44-1.08-2.75s.68-1.95.93-2.22c.24-.26.54-.33.72-.33.18 0 .36 0 .52.01.17.01.39-.06.61.47.23.55.78 1.9.85 2.04.07.14.12.31.02.5-.1.19-.15.31-.3.48-.15.18-.31.4-.44.53-.15.15-.3.31-.13.61.17.29.77 1.27 1.65 2.06 1.13 1.01 2.08 1.32 2.38 1.47.29.14.47.12.64-.08.18-.19.75-.87.95-1.17.2-.3.4-.25.67-.15.28.1.1.77 1.83.91 2.02.13.2.22.3.26.36.04.07.04.4-.2.99z" />
                </svg>
              </a>

              {/* Llamada */}
              <a
                href={telefonoLimpio ? `tel:+${telefonoLimpio}` : "#"}
                aria-label={`Llamar a ${contactoNombre}`}
                className="flex size-9 items-center justify-center rounded-full bg-[#CEE5FD] text-[#0066FF] shadow-2xs transition hover:bg-[#BBDCFB] active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                </svg>
              </a>

              {/* Chat interno (...) */}
              <button
                type="button"
                onClick={() => setChatAbierto(true)}
                aria-label={`Abrir chat con ${contactoNombre}`}
                aria-haspopup="dialog"
                aria-expanded={chatAbierto}
                className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-[#E2EAF4] text-[#0A1E3C] shadow-2xs transition hover:bg-[#D5E2F0] active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>
            </div>
          </section>
        </div>

        {/* 6. COMPONENTE DE MAPA EN TIEMPO REAL */}
        <section aria-label="Mapa de ruta en tiempo real" className="shrink-0">
          <MiniMapaRutaEnTransito destinoCiudad={destinoCiudad} />
        </section>

        {/* 7. BOTÓN DE ACCIÓN PRIMARIO (FIJO EN BASE) */}
        <section data-trip-primary aria-label="Acción principal del traslado" className="shrink-0 pt-0.5">
          <p role="status" className="sr-only">
            En traslado · Registra tu llegada al estar en sitio
          </p>
          {error && (
            <p role="alert" className="mb-1.5 font-body text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleLlegueDestino}
            disabled={procesando}
            className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0066FF] px-4 py-3 font-display text-sm font-extrabold text-white shadow-[0_6px_18px_rgba(0,102,255,0.32)] transition hover:bg-[#0052CC] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesando ? (
              TEXTOS_CARGANDO.actualizando
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span>He llegado al destino</span>
                <span className="sr-only"> HE LLEGADO AL DESTINO</span>
              </>
            )}
          </button>
        </section>
      </div>

      {/* 8. NAVEGACIÓN INFERIOR ESTÁNDAR (3 PESTAÑAS: INICIO, TRASLADOS Y CUENTA) */}
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

      {/* Modal de Chat con el Pasajero */}
      {chatAbierto && (
        <TripDialog title={`Chat · ${contactoNombre}`} onClose={() => setChatAbierto(false)}>
          <ChatViaje trasladoId={trasladoId} estado="traslado_en_curso" />
        </TripDialog>
      )}

      {/* Bottom Sheet de Soporte Rápido */}
      <EvidenciaSoporteSheet
        soporteAbierto={soporteAbierto}
        setSoporteAbierto={setSoporteAbierto}
      />
    </div>
  );
}
