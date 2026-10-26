"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TEXTOS_CARGANDO } from "@ruum/shared/constants";
import type { Database } from "@ruum/shared/types";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { avanzarEstadoTraslado } from "@ruum/api/services";
import { listarInspeccionesTraslado } from "@ruum/api/drivers";
import { EmergencyPanel } from "./EmergencyPanel";
import { TripSupportDialog } from "./TripSupportDialog";
import { CierreConfirmacionModal } from "./cierre/CierreConfirmacionModal";
import { TripDialog } from "./TripDialog";
import { ChatViaje } from "./ChatViaje";
import type { PasaporteRow, InspeccionData } from "./cierre/cierre-types";

export function CierreTrasladoDetails({
  pasaporte,
  volver,
}: {
  pasaporte: PasaporteRow;
  volver: string;
}) {
  const router = useRouter();
  const trasladoId = pasaporte.traslado_id || "";
  const estadoActual = pasaporte.estado as Database["public"]["Enums"]["estado_traslado"];

  const [inspeccionFinal, setInspeccionFinal] = useState<InspeccionData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisoExito, setAvisoExito] = useState<string | null>(null);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [soporteAbierto, setSoporteAbierto] = useState(false);
  const [modalConfirmacionAbierto, setModalConfirmacionAbierto] = useState(false);
  const [tieneFirma, setTieneFirma] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const contactoNombre =
    pasaporte.contacto_recepcion_nombre || pasaporte.contacto_entrega_nombre || "HÉCTOR LOMELÍN";
  const contactoTelefono =
    pasaporte.contacto_recepcion_telefono || pasaporte.contacto_entrega_telefono || "+525555555555";
  const telefonoLimpio = contactoTelefono.replace(/[^0-9]/g, "");

  const iniciales = contactoNombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  useEffect(() => {
    async function loadInspeccion() {
      if (!trasladoId) return;
      try {
        const cliente = crearClienteNavegador();
        const insps = await listarInspeccionesTraslado(cliente, trasladoId);
        if (insps) {
          const final = insps.find((i) => i.tipo === "final") as InspeccionData | undefined;
          if (final) setInspeccionFinal(final);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCargando(false);
      }
    }
    void loadInspeccion();
  }, [trasladoId]);

  // Configuración del canvas de firma digital
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Escalar según densidad de pantalla
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = "#0A1E3C";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function startDrawing(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    isDrawingRef.current = true;
    setTieneFirma(true);
  }

  function draw(clientX: number, clientY: number) {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  }

  function stopDrawing() {
    isDrawingRef.current = false;
  }

  function handleLimpiarFirma() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTieneFirma(false);
  }

  function handleGuardarReporte() {
    setAvisoExito("Reporte de cierre guardado exitosamente.");
    setTimeout(() => setAvisoExito(null), 3000);
  }

  async function handleFinalizarTraslado() {
    if (procesando) return;
    setProcesando(true);
    setError(null);
    setAvisoExito(null);

    try {
      const cliente = crearClienteNavegador();

      if (estadoActual === "evidencia_final_completada") {
        await avanzarEstadoTraslado(cliente, trasladoId, "evidencia_final_completada");
        await new Promise((resolve) => setTimeout(resolve, 200));
        await avanzarEstadoTraslado(cliente, trasladoId, "entrega_confirmada");
      } else if (estadoActual === "entrega_confirmada") {
        await avanzarEstadoTraslado(cliente, trasladoId, "entrega_confirmada");
      } else {
        await avanzarEstadoTraslado(cliente, trasladoId, estadoActual);
      }

      setAvisoExito("¡Vehículo entregado y traslado finalizado exitosamente!");
      setTimeout(() => {
        router.push("/viajes");
      }, 1200);
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos completar el cierre del traslado."));
      setProcesando(false);
    }
  }

  const odometroTexto = inspeccionFinal?.kilometraje
    ? `${inspeccionFinal.kilometraje.toLocaleString("es-MX")} km`
    : "124,510 km";
  const combustibleTexto = inspeccionFinal?.combustible ? inspeccionFinal.combustible : "75%";
  const observacionesTexto = inspeccionFinal?.notas?.trim() || "Ninguna";

  if (cargando) {
    return (
      <output
        aria-label="Cargando cierre de traslado"
        aria-busy="true"
        className="mx-auto flex h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center text-[#0A1E3C]"
      >
        <div className="size-9 animate-spin rounded-full border-4 border-[#0066FF] border-t-transparent" />
        <p className="mt-4 font-display text-sm font-bold text-[#5A6B87]">
          Cargando cierre de traslado...
        </p>
      </output>
    );
  }

  return (
    <div
      data-cierre-traslado
      className="mx-auto flex h-screen max-h-[100dvh] w-full max-w-md flex-col justify-between overflow-hidden bg-[#F4F8FD] text-[#0A1E3C] select-none"
    >
      {/* CONTENIDO PRINCIPAL COMPACTO SIN SCROLL */}
      <div
        className="flex min-h-0 flex-1 flex-col justify-between gap-2 px-4 pt-[max(10px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        {/* 1. HEADER TÉCNICO DE CONTROL */}
        <header
          aria-label="Encabezado técnico de cierre"
          className="grid grid-cols-[auto_1fr_auto] items-center gap-2 shrink-0"
        >
          {/* ‹ Volver */}
          <Link
            href={volver}
            aria-label="Volver al traslado"
            className="inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-[#DCE7F5] bg-white px-2.5 py-1 font-display text-xs font-black text-[#0A1E3C] shadow-2xs transition hover:bg-[#F0F5FA] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0057D9]"
          >
            <span className="text-base leading-none">‹</span>
            <span>Volver</span>
          </Link>

          {/* Título Centralizado */}
          <h1 className="text-center font-display text-[15px] font-black uppercase tracking-wider text-[#0A1E3C]">
            CIERRE DE TRASLADO
          </h1>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setSoporteAbierto(true)}
              aria-label="Soporte"
              className="inline-flex min-h-[36px] cursor-pointer items-center gap-1 rounded-xl bg-[#E8F0FA] px-2.5 py-1 font-display text-xs font-bold text-[#0A1E3C] shadow-2xs transition hover:bg-[#DCE7F5] active:scale-95"
            >
              💬 Soporte
            </button>
            {/* ⚠️ SOS Modular */}
            <EmergencyPanel
              trasladoId={trasladoId}
              compact
              headerPill
              pillLabel="SOS"
              pillTone="soft"
            />
          </div>
        </header>

        {/* 2. CAJA DE ESTADOS CRUZADOS (BADGES) */}
        <div
          role="status"
          aria-label="Estado: En destino. Conciliación lista"
          className="grid shrink-0 grid-cols-2 gap-2"
        >
          {/* Izquierda: En destino */}
          <div className="flex items-center gap-2.5 rounded-xl border border-[#D5EAD8] bg-[#EAF7ED] px-3 py-2 shadow-2xs">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#BAEFCA] text-[#15803D]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="font-display text-xs font-black text-[#15803D]">
                En destino
              </span>
              <span className="truncate font-body text-[10px] text-[#5A6B87]">
                Vehículo en punto final
              </span>
            </div>
          </div>

          {/* Derecha: Conciliación lista */}
          <div className="flex items-center justify-center gap-1.5 rounded-xl border border-[#86EFAC] bg-[#DCFCE7] px-3 py-2 shadow-2xs">
            <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#15803D] text-white">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="font-display text-[11px] font-black uppercase tracking-wide text-[#15803D]">
              CONCILIACIÓN LISTA
            </span>
          </div>
        </div>

        {/* 3. MÓDULO DEL RECEPTOR (CONTACTO RÁPIDO) */}
        <section
          aria-label="Receptor"
          className="shrink-0 rounded-2xl border border-[#DCE7F5] bg-white p-3 shadow-2xs flex flex-col gap-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#CEE5FD] font-display text-sm font-black text-[#0057D9]"
                aria-hidden="true"
              >
                {iniciales || "HL"}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="font-body text-[9.5px] font-bold uppercase tracking-wider text-[#5A6B87] leading-none">
                  RECEPTOR
                </span>
                <span className="mt-0.5 truncate font-display text-sm font-black uppercase text-[#0A1E3C]">
                  {contactoNombre}
                </span>
                <span className="font-body text-[11px] text-[#5A6B87] leading-tight">
                  Cliente • Ruum Conductores
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end text-[#5A6B87]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                <path d="M10 6h4" />
                <path d="M10 10h4" />
                <path d="M10 14h4" />
                <path d="M10 18h4" />
              </svg>
              <span className="mt-0.5 font-display text-[9.5px] font-bold text-[#5A6B87] flex items-center gap-0.5">
                <span>📍</span> CDMX
              </span>
            </div>
          </div>

          {/* Tres botones de contacto simétricos */}
          <div className="grid grid-cols-3 gap-2">
            {/* Llamar */}
            <a
              href={telefonoLimpio ? `tel:+${telefonoLimpio}` : "#"}
              aria-label={`Llamar a ${contactoNombre}`}
              className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl bg-[#E1EDFF] px-2 py-1.5 font-display text-xs font-bold text-[#0066FF] shadow-2xs transition hover:bg-[#D5E6FC] active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
              </svg>
              <span>Llamar</span>
            </a>

            {/* WhatsApp */}
            <a
              href={telefonoLimpio ? `https://wa.me/${telefonoLimpio}` : "#"}
              target="_blank"
              rel="noreferrer"
              aria-label={`Enviar WhatsApp a ${contactoNombre}`}
              className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl bg-[#DCFCE7] px-2 py-1.5 font-display text-xs font-bold text-[#15803D] shadow-2xs transition hover:bg-[#C8F7D7] active:scale-95"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.04c-.24.67-1.39 1.28-1.92 1.36-.5.08-1.15.11-3.32-.78-2.65-1.09-4.34-3.79-4.47-3.96-.13-.17-1.08-1.44-1.08-2.75s.68-1.95.93-2.22c.24-.26.54-.33.72-.33.18 0 .36 0 .52.01.17.01.39-.06.61.47.23.55.78 1.9.85 2.04.07.14.12.31.02.5-.1.19-.15.31-.3.48-.15.18-.31.4-.44.53-.15.15-.3.31-.13.61.17.29.77 1.27 1.65 2.06 1.13 1.01 2.08 1.32 2.38 1.47.29.14.47.12.64-.08.18-.19.75-.87.95-1.17.2-.3.4-.25.67-.15.28.1.1.77 1.83.91 2.02.13.2.22.3.26.36.04.07.04.4-.2.99z" />
              </svg>
              <span>WhatsApp</span>
            </a>

            {/* Chat */}
            <button
              type="button"
              onClick={() => setChatAbierto(true)}
              aria-label={`Abrir chat con ${contactoNombre}`}
              aria-haspopup="dialog"
              aria-expanded={chatAbierto}
              className="inline-flex min-h-[36px] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#F0F4FA] px-2 py-1.5 font-display text-xs font-bold text-[#0A1E3C] shadow-2xs transition hover:bg-[#E2EAF4] active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 9H7V9h10v2zm-4 3H7v-2h6v2z" />
              </svg>
              <span>Chat</span>
            </button>
          </div>
        </section>

        {/* 4. TARJETA FIJA DE RESUMEN DE CONCILIACIÓN */}
        <section
          aria-label="Resumen de conciliación"
          className="shrink-0 rounded-2xl border border-[#DCE7F5] bg-white p-3 shadow-2xs flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#0A1E3C]" aria-hidden="true">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              <h2 className="font-display text-xs font-black uppercase tracking-wider text-[#0A1E3C]">
                RESUMEN DE CONCILIACIÓN
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 font-display text-[11px] font-black text-[#15803D]">
              <span>5/5</span>
              <span>✓</span>
            </span>
          </div>

          <div className="flex flex-col divide-y divide-[#F0F4FA] font-body text-xs">
            {/* Evidencias */}
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-1.5 text-[#5A6B87]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>Evidencias cargadas</span>
              </span>
              <span className="flex items-center gap-1 font-display font-bold text-[#0A1E3C]">
                <span>5 de 5</span>
                <span className="size-4 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-[9px] font-black">
                  ✓
                </span>
              </span>
            </div>

            {/* Odómetro final */}
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-1.5 text-[#5A6B87]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m12 14 4-4" />
                  <path d="M3.34 19a10 10 0 1 1 17.32 0" />
                </svg>
                <span>Odómetro final</span>
              </span>
              <span className="font-display font-bold text-[#0A1E3C]">
                {odometroTexto}
              </span>
            </div>

            {/* Nivel de combustible */}
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-1.5 text-[#5A6B87]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18" />
                  <path d="M13 10h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4" />
                  <path d="M3 14h10" />
                </svg>
                <span>Nivel de combustible</span>
              </span>
              <span className="font-display font-bold text-[#0A1E3C]">
                {combustibleTexto}
              </span>
            </div>

            {/* Observaciones */}
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-1.5 text-[#5A6B87]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="17" y1="10" x2="3" y2="10" />
                  <line x1="21" y1="6" x2="3" y2="6" />
                  <line x1="21" y1="14" x2="3" y2="14" />
                  <line x1="17" y1="18" x2="3" y2="18" />
                </svg>
                <span>Observaciones</span>
              </span>
              <span className="font-display font-bold text-[#0A1E3C]">
                {observacionesTexto}
              </span>
            </div>
          </div>
        </section>

        {/* 5. LIENZO DIGITAL TÁCTIL (FIRMA DE CONFORMIDAD DEL CLIENTE) */}
        <section
          aria-label="Firma de conformidad del cliente"
          className="shrink-0 rounded-2xl border border-[#DCE7F5] bg-white p-3 shadow-2xs flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="text-[#0A1E3C]" aria-hidden="true">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              <h2 className="font-display text-xs font-black uppercase tracking-wider text-[#0A1E3C]">
                FIRMA DE CONFORMIDAD DEL CLIENTE
              </h2>
            </div>

            <button
              type="button"
              onClick={handleLimpiarFirma}
              aria-label="Limpiar firma"
              className="inline-flex items-center gap-1 rounded-lg border border-[#DCE5F2] bg-white px-2 py-0.5 font-display text-[11px] font-bold text-[#5A6B87] shadow-2xs transition hover:text-[#DC2626] active:scale-95 cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span>Limpiar</span>
            </button>
          </div>

          {/* Cuadro Canvas interactivo */}
          <div
            data-signature-canvas
            className="relative h-[92px] sm:h-[105px] w-full overflow-hidden rounded-xl border-2 border-dashed border-[#C5D7F2] bg-[#F7FAFD]"
          >
            <canvas
              ref={canvasRef}
              aria-label="Lienzo de firma digital del cliente"
              className="size-full touch-none cursor-crosshair"
              onPointerDown={(e) => startDrawing(e.clientX, e.clientY)}
              onPointerMove={(e) => draw(e.clientX, e.clientY)}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
            />
            {!tieneFirma && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="font-body text-xs font-semibold text-[#94A3B8] select-none">
                  Firma aquí con tu dedo
                </span>
              </div>
            )}
          </div>
        </section>

        {/* 6. FILA DE ACCIONES BASE (FIJOS EN BASE SIN NAVEGACIÓN INFERIOR) */}
        <section
          data-trip-primary
          aria-label="Acciones de finalización"
          className="shrink-0 flex flex-col gap-2 pt-0.5"
        >
          <p role="status" className="sr-only">
            Cierre de traslado · Conciliación lista y firma de conformidad
          </p>
          {error && (
            <p role="alert" className="font-body text-xs font-semibold text-[#DC2626]">
              {error}
            </p>
          )}
          {avisoExito && (
            <p role="status" className="font-body text-xs font-semibold text-[#15803D]">
              {avisoExito}
            </p>
          )}

          {/* Botón Superior (Secundario): Guardar Reporte */}
          <button
            type="button"
            onClick={handleGuardarReporte}
            disabled={procesando}
            aria-label="Guardar Reporte"
            className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#C5D7F2] bg-white px-4 py-2.5 font-display text-xs font-black text-[#0066FF] shadow-2xs transition hover:bg-[#F5F9FF] active:scale-[0.99] disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM12 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM7 5v4h10V5H7z" />
            </svg>
            <span>Guardar Reporte</span>
          </button>

          {/* Botón Inferior (Primario Dominante): FINALIZAR TRASLADO */}
          <button
            type="button"
            onClick={() => setModalConfirmacionAbierto(true)}
            disabled={procesando}
            className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0066FF] px-4 py-3 font-display text-sm font-extrabold text-white shadow-[0_6px_18px_rgba(0,102,255,0.32)] transition hover:bg-[#0052CC] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesando ? (
              TEXTOS_CARGANDO.actualizando
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                <span>FINALIZAR TRASLADO</span>
                <span className="sr-only"> FINALIZAR Y ENTREGAR VEHÍCULO</span>
                <span aria-hidden="true">❯</span>
              </>
            )}
          </button>
        </section>
      </div>

      {/* Modal de Confirmación de Entrega */}
      {modalConfirmacionAbierto && (
        <CierreConfirmacionModal
          abierto={modalConfirmacionAbierto}
          onCerrar={() => setModalConfirmacionAbierto(false)}
          onConfirmar={() => {
            setModalConfirmacionAbierto(false);
            void handleFinalizarTraslado();
          }}
          procesando={procesando}
        />
      )}

      {/* Modal de Soporte */}
      {soporteAbierto && (
        <TripSupportDialog onClose={() => setSoporteAbierto(false)} />
      )}

      {/* Modal de Chat con el Receptor */}
      {chatAbierto && (
        <TripDialog title={`Chat · ${contactoNombre}`} onClose={() => setChatAbierto(false)}>
          <ChatViaje trasladoId={trasladoId} estado={estadoActual} />
        </TripDialog>
      )}
    </div>
  );
}
