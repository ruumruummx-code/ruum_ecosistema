"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TEXTOS_CARGANDO } from "@ruum/shared/constants";
import type { Database } from "@ruum/shared/types";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { avanzarEstadoTraslado } from "@ruum/api/services";
import { EmergencyPanel } from "./EmergencyPanel";
import { SecondaryTripNavBar } from "./SecondaryTripNavBar";
import { TripSupportDialog } from "./TripSupportDialog";
import { TripDialog } from "./TripDialog";
import { ChatViaje } from "./ChatViaje";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];

function ChryslerBadge() {
  return (
    <div
      className="flex items-center gap-1 opacity-90"
      aria-label="Logo Chrysler"
      title="Chrysler"
    >
      <svg
        width="68"
        height="18"
        viewBox="0 0 120 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Ala izquierda */}
        <path
          d="M5 15C18 10 35 11 50 14C38 16 22 17 5 15Z"
          fill="#94A3B8"
        />
        <path
          d="M8 12C20 9 35 10 48 13C36 15 22 15 8 12Z"
          fill="#CBD5E1"
        />
        {/* Ala derecha */}
        <path
          d="M115 15C102 10 85 11 70 14C82 16 98 17 115 15Z"
          fill="#94A3B8"
        />
        <path
          d="M112 12C100 9 85 10 72 13C84 15 98 15 112 12Z"
          fill="#CBD5E1"
        />
        {/* Emblema central */}
        <rect x="42" y="7" width="36" height="16" rx="4" fill="#0A1E3C" stroke="#94A3B8" strokeWidth="1" />
        <text
          x="60"
          y="18.5"
          fill="#FFFFFF"
          fontSize="7.5"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="0.8"
        >
          CHRYSLER
        </text>
      </svg>
    </div>
  );
}

export function IniciaTrayectoDetails({
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
  const estadoActual = (pasaporte.estado || "evidencia_inicial_completada") as EstadoTraslado;

  const placas = pasaporte.vehiculo_placas || "PQM365";
  const vin = pasaporte.vehiculo_vin || "12345698745632145";
  const marca =
    pasaporte.vehiculo_marca ||
    (pasaporte.vehiculo_modelo ? pasaporte.vehiculo_modelo.split(" ")[0] : "Chrysler");
  const modelo = pasaporte.vehiculo_modelo || "Cimas";
  const anio = pasaporte.vehiculo_anio ? String(pasaporte.vehiculo_anio) : "2000";
  const color = (pasaporte.vehiculo_color || "GRIS").toUpperCase();

  const contactoNombre = pasaporte.contacto_entrega_nombre || "HECTOR LOMELIN";
  const contactoTelefono = pasaporte.contacto_entrega_telefono || "+52 656 555 6565";
  const telefonoLimpio = contactoTelefono.replace(/[^0-9]/g, "");

  async function handleIniciarTrayecto() {
    setProcesando(true);
    setError(null);

    try {
      const cliente = crearClienteNavegador();

      if (estadoActual === "evidencia_inicial_completada") {
        await avanzarEstadoTraslado(cliente, trasladoId, "evidencia_inicial_completada");
        await new Promise((resolve) => setTimeout(resolve, 200));
        await avanzarEstadoTraslado(cliente, trasladoId, "vehiculo_recibido");
      } else if (estadoActual === "vehiculo_recibido") {
        await avanzarEstadoTraslado(cliente, trasladoId, "vehiculo_recibido");
      } else {
        await avanzarEstadoTraslado(cliente, trasladoId, estadoActual);
      }

      router.refresh();
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos iniciar el trayecto hacia el destino."));
      setProcesando(false);
    }
  }

  return (
    <div
      data-inicia-trayecto
      className="mx-auto flex h-screen max-h-[100dvh] w-full max-w-md flex-col justify-between overflow-hidden bg-[#F4F8FD] text-[#0A1E3C] select-none"
    >
      {/* CONTENIDO PRINCIPAL COMPACTO SIN SCROLL */}
      <div
        data-trip-scroll
        className="flex min-h-0 flex-1 flex-col justify-between gap-2 px-4 pt-[max(10px,env(safe-area-inset-top))] pb-2.5"
      >
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
        </div>

        {/* 2. CAJA DE ESTADO (RECEPCIÓN EXITOSA) */}
        <div
          role="status"
          aria-label="Estado actual: Recepción lista"
          className="flex shrink-0 items-center gap-3.5 rounded-2xl border border-[#D5EAD8] bg-[#EAF7ED] px-3.5 py-2.5 shadow-2xs"
        >
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#BAEFCA] text-[#0A7A82]"
            aria-hidden="true"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
          </div>

          <div className="flex min-w-0 flex-col">
            <span className="font-body text-[11px] font-bold text-[#5A6B87] leading-tight">
              Estado actual
            </span>
            <div className="mt-1">
              <span className="inline-flex items-center rounded-full border border-[#A7E6B4] bg-[#CEF5D6] px-3 py-0.5 font-display text-xs font-black text-[#15803D]">
                Recepción lista
              </span>
            </div>
          </div>
        </div>

        {/* 3. MÓDULO DE PRÓXIMA ACCIÓN */}
        <section
          aria-label="Próxima acción"
          className="flex shrink-0 flex-col"
        >
          <span className="font-display text-[10.5px] font-extrabold uppercase tracking-wider text-[#0057D9]">
            TU PRÓXIMA ACCIÓN
          </span>
          <h1 className="mt-0.5 font-display text-[22px] font-black leading-tight text-[#0A1E3C]">
            Inicia el trayecto
          </h1>
          <p className="mt-0.5 font-body text-xs leading-snug text-[#4A5B78]">
            El registro inicial está completo con evidencia. Conduce de manera segura hacia el destino.
          </p>
        </section>

        {/* 4. SECCIÓN DE CONTACTO DE RECOLECCIÓN ACTUALIZADA */}
        <section
          aria-label="Contacto de recolección"
          className="shrink-0 rounded-2xl border border-[#DCE7F5] bg-[#E8F0FA] p-3 shadow-2xs"
        >
          <span className="font-display text-[9.5px] font-extrabold uppercase tracking-wider text-[#0057D9] block leading-none">
            CONTACTO DE RECOLECCIÓN
          </span>

          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-[#E2EAF4] bg-white px-3 py-2.5 shadow-2xs">
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E1EDFF] font-display text-sm font-black text-[#0057D9]"
                aria-hidden="true"
              >
                {contactoNombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-display text-xs font-black uppercase text-[#0A1E3C]">
                  {contactoNombre}
                </span>
                <span className="font-body text-xs text-[#5A6B87] leading-tight mt-0.5">
                  {contactoTelefono}
                </span>
              </div>
            </div>

            {/* Accesos rápidos: WhatsApp, Llamada y Chat */}
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
                className="flex size-9 items-center justify-center rounded-full bg-[#0066FF] text-white shadow-2xs transition hover:bg-[#0052CC] active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                </svg>
              </a>

              {/* Chat */}
              <button
                type="button"
                onClick={() => setChatAbierto(true)}
                aria-label={`Abrir chat con ${contactoNombre}`}
                aria-haspopup="dialog"
                aria-expanded={chatAbierto}
                className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-[#E1EDFF] text-[#0066FF] shadow-2xs transition hover:bg-[#D5E6FC] active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 9H7V9h10v2zm-4 3H7v-2h6v2z" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* 5. GRID EXTENDIDO DE DATOS DE LA UNIDAD (3x2) */}
        <section
          aria-label="Datos del vehículo a localizar"
          className="flex min-h-0 flex-1 flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="font-display text-[9.5px] font-extrabold uppercase tracking-wider text-[#0057D9]">
              VEHÍCULO A LOCALIZAR
            </span>
            <ChryslerBadge />
          </div>

          <div className="mt-1.5 grid grid-cols-2 gap-2 flex-1">
            {/* Fila 1 - Columna 1: Placa */}
            <div className="flex flex-col justify-center rounded-xl border border-[#DCE5F2] bg-white px-3 py-2 shadow-2xs">
              <span className="font-body text-[9px] font-bold uppercase tracking-wider text-[#5A6B87] leading-none">
                PLACA
              </span>
              <span className="mt-1 truncate font-display text-xs font-black tracking-wide text-[#0A1E3C]">
                {placas}
              </span>
            </div>

            {/* Fila 1 - Columna 2: Número VIN */}
            <div className="flex flex-col justify-center rounded-xl border border-[#DCE5F2] bg-white px-3 py-2 shadow-2xs">
              <span className="font-body text-[9px] font-bold uppercase tracking-wider text-[#5A6B87] leading-none">
                NÚMERO VIN
              </span>
              <span
                className="mt-1 truncate font-mono text-xs font-bold text-[#0A1E3C]"
                title={vin}
              >
                {vin}
              </span>
            </div>

            {/* Fila 2 - Columna 1: Marca */}
            <div className="flex flex-col justify-center rounded-xl border border-[#DCE5F2] bg-white px-3 py-2 shadow-2xs">
              <span className="font-body text-[9px] font-bold uppercase tracking-wider text-[#5A6B87] leading-none">
                MARCA
              </span>
              <span className="mt-1 truncate font-display text-xs font-bold text-[#0A1E3C]">
                {marca}
              </span>
            </div>

            {/* Fila 2 - Columna 2: Modelo */}
            <div className="flex flex-col justify-center rounded-xl border border-[#DCE5F2] bg-white px-3 py-2 shadow-2xs">
              <span className="font-body text-[9px] font-bold uppercase tracking-wider text-[#5A6B87] leading-none">
                MODELO
              </span>
              <span className="mt-1 truncate font-display text-xs font-bold text-[#0A1E3C]">
                {modelo}
              </span>
            </div>

            {/* Fila 3 - Columna 1: Año */}
            <div className="flex flex-col justify-center rounded-xl border border-[#DCE5F2] bg-white px-3 py-2 shadow-2xs">
              <span className="font-body text-[9px] font-bold uppercase tracking-wider text-[#5A6B87] leading-none">
                AÑO
              </span>
              <span className="mt-1 truncate font-display text-xs font-bold text-[#0A1E3C]">
                {anio}
              </span>
            </div>

            {/* Fila 3 - Columna 2: Color */}
            <div className="flex flex-col justify-center rounded-xl border border-[#DCE5F2] bg-white px-3 py-2 shadow-2xs">
              <span className="font-body text-[9px] font-bold uppercase tracking-wider text-[#5A6B87] leading-none">
                COLOR
              </span>
              <span className="mt-1 truncate font-display text-xs font-bold text-[#0A1E3C]">
                {color}
              </span>
            </div>
          </div>
        </section>

        {/* 6. BOTÓN DE ACCIÓN PRIMARIO (FIJO EN BASE) */}
        <section data-trip-primary aria-label="Acción principal del traslado" className="shrink-0 pt-0.5">
          <p role="status" className="sr-only">
            Recepción lista · Inicia el trayecto al destino
          </p>
          {error && (
            <p role="alert" className="mb-1.5 font-body text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleIniciarTrayecto}
            disabled={procesando}
            className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0066FF] px-4 py-3 font-display text-sm font-extrabold text-white shadow-[0_6px_18px_rgba(0,102,255,0.32)] transition hover:bg-[#0052CC] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesando ? (
              TEXTOS_CARGANDO.actualizando
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
                </svg>
                <span>INICIAR TRAYECTO AL DESTINO</span>
              </>
            )}
          </button>
        </section>
      </div>

      {/* 7. NAVEGACIÓN INFERIOR ESTÁNDAR */}
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

      {/* Modal de Chat con el Contacto */}
      {chatAbierto && (
        <TripDialog title={`Chat · ${contactoNombre}`} onClose={() => setChatAbierto(false)}>
          <ChatViaje trasladoId={trasladoId} estado={estadoActual} />
        </TripDialog>
      )}

      {/* Modal de Soporte */}
      {soporteAbierto && (
        <TripSupportDialog onClose={() => setSoporteAbierto(false)} />
      )}
    </div>
  );
}
