"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TEXTOS_CARGANDO } from "@ruum/shared/constants";
import type { AnguloEvidencia } from "@ruum/shared/types";
import { useEvidenciaPageLogic } from "./useEvidenciaPageLogic";
import { fotoSrc, OPCIONES_COMBUSTIBLE } from "./evidence-requirements";
import { EmergencyPanel } from "../EmergencyPanel";
import { EvidenciaCsatSheet } from "./EvidenciaCsatSheet";
import { EvidenciaSoporteSheet } from "./EvidenciaSoporteSheet";
import { EvidenciaDocumentosSection } from "./EvidenciaDocumentosSection";
import { EvidenciaNotasSection } from "./EvidenciaNotasSection";

type TabEvidencia = "fotos" | "llaves" | "formulario";

const SLOTS_FOTOS: Array<{
  angulo: AnguloEvidencia;
  numero: number;
  etiqueta: string;
}> = [
  { angulo: "frente", numero: 1, etiqueta: "1. Frontal" },
  { angulo: "trasera", numero: 2, etiqueta: "2. Trasera" },
  { angulo: "lado_piloto", numero: 3, etiqueta: "3. Lateral izq." },
  { angulo: "lado_copiloto", numero: 4, etiqueta: "4. Lateral der." },
  { angulo: "tablero", numero: 5, etiqueta: "5. Tablero / Interior" },
];

export default function PaginaEvidencia() {
  const { id } = useParams<{ id: string }>();
  const [tabActiva, setTabActiva] = useState<TabEvidencia>("fotos");

  const {
    pasaporte,
    tipo,
    soporteAbierto,
    setSoporteAbierto,
    cargando,
    error,
    aviso,
    avisoExito,
    kilometraje,
    setKilometraje,
    gasolinaSegments,
    setGasolinaSegments,
    llavesCount,
    setLlavesCount,
    tarjetaCirculacion,
    setTarjetaCirculacion,
    talonVerificacion,
    setTalonVerificacion,
    hologramaVerificacion,
    setHologramaVerificacion,
    placaDelantera,
    setPlacaDelantera,
    placaTrasera,
    setPlacaTrasera,
    notas,
    setNotas,
    presentaDanosNuevos,
    setPresentaDanosNuevos,
    showCsatSheet,
    setShowCsatSheet,
    csatValor,
    setCsatValor,
    cesValor,
    setCesValor,
    enviandoFeedback,
    setEnviandoFeedback,
    enviando,
    fotosObligatorias,
    totalRequisitos,
    fotosObligCapturadas,
    totalCapturados,
    capturar,
    procesarArchivoSeleccionado,
    guardarBorrador,
    finalizar,
    enviarFeedback,
    omitirFeedback,
    obtenerFoto,
    inputArchivoRef,
  } = useEvidenciaPageLogic(id);

  if (cargando) {
    return (
      <output
        aria-label="Cargando evidencias"
        aria-busy="true"
        className="mx-auto flex h-screen w-full max-w-md flex-col items-center justify-center px-6 text-center text-[#0A1E3C]"
      >
        <div className="size-9 animate-spin rounded-full border-4 border-[#0066FF] border-t-transparent" />
        <p className="mt-4 font-display text-sm font-bold text-[#5A6B87]">
          Cargando checklist de evidencias...
        </p>
      </output>
    );
  }

  if (!pasaporte) {
    return (
      <div className="mx-auto flex h-screen w-full max-w-md flex-col justify-center p-6 text-center text-[#0A1E3C]">
        <h1 className="font-display text-lg font-black">No pudimos cargar las evidencias</h1>
        <p role="alert" className="mt-2 font-body text-xs text-[#5A6B87]">
          {aviso || "No encontramos la información de este traslado. Vuelve a intentarlo."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-[#0066FF] p-3 font-display text-xs font-bold text-white shadow-2xs"
          >
            Reintentar
          </button>
          <Link
            href={`/viajes/${id}`}
            className="inline-flex min-h-11 items-center justify-center font-display text-xs font-bold text-[#5A6B87]"
          >
            Volver al traslado
          </Link>
        </div>
      </div>
    );
  }

  const porcentaje = Math.round((totalCapturados / Math.max(1, totalRequisitos)) * 100);
  const esEvidenciaFinal = tipo === "final";

  function handleSiguiente() {
    if (totalCapturados >= totalRequisitos && (esEvidenciaFinal || tabActiva === "formulario")) {
      void finalizar();
      return;
    }
    if (tabActiva === "fotos") {
      setTabActiva("llaves");
      return;
    }
    if (tabActiva === "llaves") {
      setTabActiva("formulario");
      return;
    }
    if (tabActiva === "formulario") {
      void finalizar();
    }
  }

  return (
    <div
      data-inspeccion-evidencia
      className="mx-auto flex h-screen max-h-[100dvh] w-full max-w-md flex-col justify-between overflow-hidden bg-[#F4F8FD] text-[#0A1E3C] select-none"
    >
      {/* Input de archivo nativo oculto para subida de fotos en web */}
      <input
        ref={inputArchivoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void procesarArchivoSeleccionado(file);
          }
          e.target.value = "";
        }}
      />

      {/* CONTENIDO PRINCIPAL COMPACTO SIN SCROLL */}
      <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 px-4 pt-[max(10px,env(safe-area-inset-top))] pb-2.5">
        {/* 1. HEADER TÉCNICO */}
        <header
          aria-label="Encabezado técnico de evidencias"
          className="flex shrink-0 items-center justify-between gap-2"
        >
          {/* Volver */}
          <Link
            href={`/viajes/${id}`}
            aria-label="Volver al traslado"
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-1 font-display text-xs font-black text-[#0A1E3C] transition hover:text-[#0057D9] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0057D9]"
          >
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
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Volver</span>
          </Link>

          {/* Soporte */}
          <button
            type="button"
            onClick={() => setSoporteAbierto(true)}
            aria-label="Abrir soporte rápido"
            className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg px-2 font-display text-xs font-black text-[#0A1E3C] transition hover:text-[#0057D9] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0057D9]"
          >
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
            >
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
            <span>Soporte</span>
          </button>

          {/* Emergencia Modular Rojo */}
          <EmergencyPanel
            trasladoId={id}
            compact
            headerPill
            pillLabel="Emerg."
            pillTone="soft"
          />
        </header>

        {/* 2. INDICADOR DE PROGRESO GENERAL */}
        <section
          aria-label="Progreso general de requisitos"
          className="flex shrink-0 flex-col gap-1.5"
        >
          <div className="flex items-center justify-between font-display text-[11px] font-black tracking-tight">
            <span className="text-[#0A1E3C]">
              Progreso: {totalCapturados}/{totalRequisitos} requisitos ({porcentaje}%)
            </span>
            <span className="text-[#0066FF]">{porcentaje}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={porcentaje}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progreso de evidencias: ${porcentaje}%`}
            className="h-2 w-full overflow-hidden rounded-full bg-[#E5ECF6]"
          >
            <div
              className="h-full rounded-full bg-[#0066FF] transition-all duration-300 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, porcentaje))}%` }}
            />
          </div>
        </section>

        {/* 3. MENÚ DE CONTROL POR PESTAÑAS (TABS DE SEGMENTACIÓN) */}
        <nav
          aria-label="Pestañas de captura de evidencias"
          className="grid shrink-0 grid-cols-3 gap-2"
        >
          {/* Pestaña 1: FOTOS */}
          <button
            type="button"
            onClick={() => setTabActiva("fotos")}
            aria-current={tabActiva === "fotos" ? "page" : undefined}
            className={`flex min-h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-center transition active:scale-[0.98] ${
              tabActiva === "fotos"
                ? "border border-[#8AB4F8] bg-[#E1EDFF] font-display text-xs font-black text-[#0057D9] shadow-2xs"
                : "border border-transparent bg-[#F0F5FA] font-display text-xs font-bold text-[#5A6B87] hover:bg-[#E8EFF8]"
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span className="truncate">FOTOS ({fotosObligCapturadas}/5)</span>
          </button>

          {/* Pestaña 2: LLAVES */}
          <button
            type="button"
            onClick={() => setTabActiva("llaves")}
            aria-current={tabActiva === "llaves" ? "page" : undefined}
            className={`flex min-h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-center transition active:scale-[0.98] ${
              tabActiva === "llaves"
                ? "border border-[#8AB4F8] bg-[#E1EDFF] font-display text-xs font-black text-[#0057D9] shadow-2xs"
                : "border border-transparent bg-[#F0F5FA] font-display text-xs font-bold text-[#5A6B87] hover:bg-[#E8EFF8]"
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <circle cx="7.5" cy="15.5" r="5.5" />
              <path d="m21 2-9.6 9.6" />
              <path d="m15.5 9.5 3 3L22 9l-3-3z" />
            </svg>
            <span className="truncate">LLAVES</span>
          </button>

          {/* Pestaña 3: FORMULARIO */}
          <button
            type="button"
            onClick={() => setTabActiva("formulario")}
            aria-current={tabActiva === "formulario" ? "page" : undefined}
            className={`flex min-h-[40px] cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-center transition active:scale-[0.98] ${
              tabActiva === "formulario"
                ? "border border-[#8AB4F8] bg-[#E1EDFF] font-display text-xs font-black text-[#0057D9] shadow-2xs"
                : "border border-transparent bg-[#F0F5FA] font-display text-xs font-bold text-[#5A6B87] hover:bg-[#E8EFF8]"
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
              <path d="M9 12h6" />
              <path d="M9 16h6" />
            </svg>
            <span className="truncate">FORMULARIO</span>
          </button>
        </nav>

        {/* 4. CONTENIDO DE LA PESTAÑA ACTIVA */}
        {tabActiva === "fotos" && (
          <section
            aria-label="Fotos del vehículo"
            className="flex min-h-0 flex-1 flex-col justify-between rounded-2xl border border-[#DCE7F5] bg-white p-3.5 shadow-2xs"
          >
            <div className="flex shrink-0 flex-col">
              <h2 className="font-display text-base font-black tracking-tight text-[#0A1E3C]">
                Fotos del vehículo
              </h2>
              <p className="mt-0.5 font-body text-xs text-[#5A6B87]">
                Toma 5 fotos del vehículo según las indicaciones.
              </p>
            </div>

            {/* Mosaico de Carga: Fila 1 (3 slots) y Fila 2 (2 slots centrados) */}
            <div className="my-auto flex flex-col gap-2.5">
              {/* Fila superior: 1. Frontal, 2. Trasera, 3. Lateral izq. */}
              <div className="grid grid-cols-3 gap-2.5">
                {SLOTS_FOTOS.slice(0, 3).map((slot) => {
                  const foto = obtenerFoto(slot.angulo);
                  const src = foto ? fotoSrc(foto) : null;
                  const capturada = Boolean(foto);
                  const subiendo = enviando === slot.angulo;

                  return (
                    <button
                      key={slot.angulo}
                      type="button"
                      onClick={() => capturar(slot.angulo)}
                      disabled={subiendo}
                      aria-label={
                        capturada
                          ? `${slot.etiqueta}: Foto capturada. Toca para volver a capturar.`
                          : `${slot.etiqueta}: Toca para capturar fotografía.`
                      }
                      className={`relative flex aspect-[1/1.05] cursor-pointer flex-col items-center justify-center rounded-xl p-1.5 text-center transition active:scale-95 ${
                        capturada
                          ? "border border-[#8AB4F8] bg-[#F4F8FD]"
                          : "border border-dashed border-[#B8D3F2] bg-[#F7FAFD] hover:bg-[#EEF5FD]"
                      }`}
                    >
                      {src ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={slot.etiqueta}
                            className="size-full rounded-lg object-cover"
                          />
                          <div className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xs">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        </>
                      ) : subiendo ? (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="size-5 animate-spin rounded-full border-2 border-[#0066FF] border-t-transparent" />
                          <span className="font-body text-[10px] font-bold text-[#0066FF]">Subiendo</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex size-9 items-center justify-center text-[#5A6B87]">
                            <svg
                              width="26"
                              height="26"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.1"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                          </div>
                          <span className="mt-1 font-body text-[11px] font-bold text-[#5A6B87] leading-tight">
                            {slot.etiqueta}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Fila inferior: 4. Lateral der., 5. Tablero / Interior (Centrados) */}
              <div className="flex justify-center gap-2.5">
                {SLOTS_FOTOS.slice(3, 5).map((slot) => {
                  const foto = obtenerFoto(slot.angulo);
                  const src = foto ? fotoSrc(foto) : null;
                  const capturada = Boolean(foto);
                  const subiendo = enviando === slot.angulo;

                  return (
                    <button
                      key={slot.angulo}
                      type="button"
                      onClick={() => capturar(slot.angulo)}
                      disabled={subiendo}
                      aria-label={
                        capturada
                          ? `${slot.etiqueta}: Foto capturada. Toca para volver a capturar.`
                          : `${slot.etiqueta}: Toca para capturar fotografía.`
                      }
                      className={`relative flex aspect-[1/1.05] w-[calc((100%-1.25rem)/3)] cursor-pointer flex-col items-center justify-center rounded-xl p-1.5 text-center transition active:scale-95 ${
                        capturada
                          ? "border border-[#8AB4F8] bg-[#F4F8FD]"
                          : "border border-dashed border-[#B8D3F2] bg-[#F7FAFD] hover:bg-[#EEF5FD]"
                      }`}
                    >
                      {src ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={slot.etiqueta}
                            className="size-full rounded-lg object-cover"
                          />
                          <div className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xs">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        </>
                      ) : subiendo ? (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="size-5 animate-spin rounded-full border-2 border-[#0066FF] border-t-transparent" />
                          <span className="font-body text-[10px] font-bold text-[#0066FF]">Subiendo</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex size-9 items-center justify-center text-[#5A6B87]">
                            <svg
                              width="26"
                              height="26"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.1"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                          </div>
                          <span className="mt-1 font-body text-[11px] font-bold text-[#5A6B87] leading-tight">
                            {slot.etiqueta}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. BANNER INFORMATIVO DE CALIDAD */}
            <div
              role="note"
              className="flex shrink-0 items-center gap-2.5 rounded-xl border border-[#CCE0F8] bg-[#EAF2FD] p-2.5 text-xs text-[#0A2540]"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0066FF] text-white font-bold text-[13px]" aria-hidden="true">
                i
              </div>
              <p className="font-body text-[11px] leading-snug font-medium text-[#1E3A5F]">
                Asegúrate de que las fotos sean claras, con buena iluminación y sin personas.
              </p>
            </div>
          </section>
        )}

        {/* PESTAÑA 2: LLAVES */}
        {tabActiva === "llaves" && (
          <section
            aria-label="Llaves del vehículo"
            className="flex min-h-0 flex-1 flex-col justify-between rounded-2xl border border-[#DCE7F5] bg-white p-4 shadow-2xs"
          >
            <div>
              <h2 className="font-display text-base font-black tracking-tight text-[#0A1E3C]">
                Llaves del vehículo
              </h2>
              <p className="mt-0.5 font-body text-xs text-[#5A6B87]">
                Indica la cantidad de llaves físicas recibidas para la custodia.
              </p>
            </div>

            <div className="my-auto flex flex-col items-center justify-center gap-4 py-2">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-[#EAF2FD] text-[#0066FF]">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7.5" cy="15.5" r="5.5" />
                  <path d="m21 2-9.6 9.6" />
                  <path d="m15.5 9.5 3 3L22 9l-3-3z" />
                </svg>
              </div>

              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => setLlavesCount(Math.max(0, llavesCount - 1))}
                  aria-label="Disminuir llaves"
                  className="flex size-12 cursor-pointer items-center justify-center rounded-2xl border border-[#DCE5F2] bg-[#F4F8FD] font-display text-2xl font-black text-[#0A1E3C] transition hover:bg-[#E8F0FA] active:scale-95"
                >
                  -
                </button>
                <div className="flex flex-col items-center">
                  <span className="font-display text-4xl font-black text-[#0066FF] tabular-nums">
                    {llavesCount}
                  </span>
                  <span className="font-body text-[11px] font-bold text-[#5A6B87] uppercase tracking-wide">
                    {llavesCount === 1 ? "Llave física" : "Llaves físicas"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLlavesCount(llavesCount + 1)}
                  aria-label="Aumentar llaves"
                  className="flex size-12 cursor-pointer items-center justify-center rounded-2xl border border-[#DCE5F2] bg-[#F4F8FD] font-display text-2xl font-black text-[#0A1E3C] transition hover:bg-[#E8F0FA] active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            <div
              role="note"
              className="flex shrink-0 items-center gap-2.5 rounded-xl border border-[#CCE0F8] bg-[#EAF2FD] p-2.5 text-xs text-[#0A2540]"
            >
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0066FF] text-white font-bold text-[13px]" aria-hidden="true">
                i
              </div>
              <p className="font-body text-[11px] leading-snug font-medium text-[#1E3A5F]">
                Verifica que las llaves correspondan a la unidad antes de guardarlas en tu resguardo.
              </p>
            </div>
          </section>
        )}

        {/* PESTAÑA 3: FORMULARIO */}
        {tabActiva === "formulario" && (
          <section
            aria-label="Formulario de inspección"
            className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto rounded-2xl border border-[#DCE7F5] bg-white p-3.5 shadow-2xs"
          >
            <div>
              <h2 className="font-display text-base font-black tracking-tight text-[#0A1E3C]">
                Datos de inspección
              </h2>
              <p className="mt-0.5 font-body text-xs text-[#5A6B87]">
                Registra el odómetro, combustible y documentación.
              </p>
            </div>

            <div className="my-2 flex flex-col gap-3">
              {/* Odómetro */}
              <div className="flex flex-col gap-1">
                <label htmlFor="input-km" className="font-display text-[10px] font-black uppercase tracking-wider text-[#5A6B87]">
                  Kilometraje / Odómetro
                </label>
                <div className="relative">
                  <input
                    id="input-km"
                    type="number"
                    inputMode="numeric"
                    placeholder="ej. 45200"
                    value={kilometraje}
                    onChange={(e) => setKilometraje(e.target.value)}
                    className="w-full rounded-xl border border-[#DCE5F2] bg-[#F8FAFD] px-3 py-2 font-display text-sm font-bold text-[#0A1E3C] outline-none transition focus:border-[#0066FF] focus:bg-white"
                  />
                  <span className="pointer-events-none absolute right-3 top-2.5 font-body text-xs font-bold text-[#5A6B87]">
                    km
                  </span>
                </div>
              </div>

              {/* Nivel de Combustible */}
              <div className="flex flex-col gap-1">
                <span className="font-display text-[10px] font-black uppercase tracking-wider text-[#5A6B87]">
                  Nivel de Combustible: {OPCIONES_COMBUSTIBLE[gasolinaSegments] || "1/2"}
                </span>
                <div className="grid grid-cols-7 gap-1">
                  {OPCIONES_COMBUSTIBLE.map((nivel, idx) => (
                    <button
                      key={nivel}
                      type="button"
                      onClick={() => setGasolinaSegments(idx)}
                      className={`min-h-[34px] rounded-lg border font-display text-xs font-bold transition active:scale-95 ${
                        gasolinaSegments === idx
                          ? "border-[#0066FF] bg-[#0066FF] text-white shadow-2xs"
                          : "border-[#DCE5F2] bg-[#F8FAFD] text-[#5A6B87] hover:bg-[#EEF4FB]"
                      }`}
                    >
                      {nivel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Documentos */}
              <div className="flex flex-col gap-2 rounded-xl border border-[#E2EAF4] bg-[#F8FAFD] p-2.5">
                <span className="font-display text-[10px] font-black uppercase tracking-wider text-[#5A6B87]">
                  Documentación del Vehículo
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex cursor-pointer items-center gap-1.5 font-body font-semibold text-[#0A1E3C]">
                    <input
                      type="checkbox"
                      checked={tarjetaCirculacion === "si"}
                      onChange={(e) => setTarjetaCirculacion(e.target.checked ? "si" : "no")}
                      className="size-4 rounded accent-[#0066FF]"
                    />
                    <span>Tarjeta circulación</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5 font-body font-semibold text-[#0A1E3C]">
                    <input
                      type="checkbox"
                      checked={talonVerificacion === "si"}
                      onChange={(e) => setTalonVerificacion(e.target.checked ? "si" : "no")}
                      className="size-4 rounded accent-[#0066FF]"
                    />
                    <span>Talón verificación</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5 font-body font-semibold text-[#0A1E3C]">
                    <input
                      type="checkbox"
                      checked={placaDelantera === "si"}
                      onChange={(e) => setPlacaDelantera(e.target.checked ? "si" : "no")}
                      className="size-4 rounded accent-[#0066FF]"
                    />
                    <span>Placa delantera</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5 font-body font-semibold text-[#0A1E3C]">
                    <input
                      type="checkbox"
                      checked={placaTrasera === "si"}
                      onChange={(e) => setPlacaTrasera(e.target.checked ? "si" : "no")}
                      className="size-4 rounded accent-[#0066FF]"
                    />
                    <span>Placa trasera</span>
                  </label>
                </div>
              </div>

              {/* Daños o Notas */}
              <div className="flex flex-col gap-1.5">
                <label className="flex cursor-pointer items-center gap-1.5 font-body text-xs font-bold text-[#0A1E3C]">
                  <input
                    type="checkbox"
                    checked={presentaDanosNuevos}
                    onChange={(e) => setPresentaDanosNuevos(e.target.checked)}
                    className="size-4 rounded accent-[#0066FF]"
                  />
                  <span>¿Presenta daños o detalles físicos preexistentes?</span>
                </label>
                {presentaDanosNuevos && (
                  <textarea
                    rows={2}
                    placeholder="Describe los rayones, golpes o detalles observados..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    className="w-full rounded-xl border border-[#DCE5F2] bg-[#F8FAFD] p-2 font-body text-xs font-medium text-[#0A1E3C] outline-none transition focus:border-[#0066FF] focus:bg-white"
                  />
                )}
              </div>
            </div>

            {error && (
              <p role="alert" className="font-body text-xs font-semibold text-[#DC2626]">
                {error}
              </p>
            )}
            {avisoExito && (
              <p role="status" className="font-body text-xs font-semibold text-[#0066FF]">
                {avisoExito}
              </p>
            )}
          </section>
        )}

        {/* 6. FILA DE ACCIONES BASE (FIJOS ARRIBA DEL MENÚ) */}
        <section
          data-trip-primary
          aria-label="Acciones de evidencia"
          className="shrink-0 pt-0.5"
        >
          {error && tabActiva !== "formulario" && (
            <p role="alert" className="mb-1.5 font-body text-xs font-semibold text-[#DC2626]">
              {error}
            </p>
          )}

          <div className="flex w-full items-center gap-2.5">
            {/* Botón izquierdo (35%): Guardar en estilo secundario */}
            <button
              type="button"
              onClick={guardarBorrador}
              disabled={Boolean(enviando)}
              aria-label="Guardar borrador"
              className="flex-[0.35] inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#C5D7F2] bg-[#EAF2FD] px-2 py-2.5 font-display text-xs font-extrabold text-[#0066FF] shadow-2xs transition hover:bg-[#DEECFD] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>{enviando === "guardar" ? "Guardando…" : "Guardar"}</span>
            </button>

            {/* Botón derecho (65%): Finalizar evidencias ➔ (o Siguiente ➔ en inicial) */}
            <button
              type="button"
              onClick={handleSiguiente}
              disabled={Boolean(enviando)}
              className="flex-[0.65] inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-4 py-2.5 font-display text-xs font-extrabold text-white shadow-[0_4px_14px_rgba(0,102,255,0.3)] transition hover:bg-[#0052CC] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando === "confirmar" ? (
                TEXTOS_CARGANDO.actualizando
              ) : esEvidenciaFinal ? (
                <>
                  <span>Finalizar evidencias</span>
                  <span aria-hidden="true">➔</span>
                </>
              ) : tabActiva === "formulario" && totalCapturados >= totalRequisitos ? (
                <>
                  <span>Finalizar evidencias</span>
                  <span aria-hidden="true">✓</span>
                </>
              ) : (
                <>
                  <span>Siguiente</span>
                  <span aria-hidden="true">➔</span>
                </>
              )}
            </button>
          </div>
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
            <span className="leading-none">Mi cuenta</span>
          </Link>
        </div>
      </nav>

      {/* R5 — CSAT/CES Bottom Sheet */}
      <EvidenciaCsatSheet
        showCsatSheet={showCsatSheet}
        setShowCsatSheet={setShowCsatSheet}
        csatValor={csatValor}
        setCsatValor={setCsatValor}
        cesValor={cesValor}
        setCesValor={setCesValor}
        enviandoFeedback={enviandoFeedback}
        setEnviandoFeedback={setEnviandoFeedback}
        onEnviarFeedback={enviarFeedback}
        onOmitirFeedback={omitirFeedback}
      />

      {/* Bottom Sheet de Soporte */}
      <EvidenciaSoporteSheet
        soporteAbierto={soporteAbierto}
        setSoporteAbierto={setSoporteAbierto}
      />
    </div>
  );
}
