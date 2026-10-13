"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MobileShell,
  MobileHeader,
  MobileCard,
  MobileRow,
  MobileListGroup,
  MobileBadge,
  MobileButton,
} from "@ruum/ui";

function IconoAuto() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function IconoEscudo() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconoDocumento() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function IconoCampana() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function IconoTarjeta() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

export function GaleriaComponentesMoviles() {
  const [cargando, setCargando] = useState(false);
  const [toggleNotif, setToggleNotif] = useState(true);

  return (
    <MobileShell variant="compact" conFondoCanvas padding="md">
      {/* Header oficial del sistema móvil */}
      <MobileHeader
        titulo="Sistema Móvil Ruum"
        subtitulo="Componentes Base & Tokens Accesibles"
        enlaceAtras="/"
        etiquetaAtras="Ir al inicio"
        accionDerecha={
          <MobileBadge variante="exito" texto="WCAG AA" punto size="sm" />
        }
      />

      <div className="mt-4 flex flex-col gap-6">
        {/* SECCIÓN 1: DECISIÓN DE PALETA Y CONTRASTE */}
        <section aria-labelledby="tokens-title">
          <h2
            id="tokens-title"
            className="mb-2.5 px-1 text-[12px] font-semibold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]"
          >
            1. Paleta Signature & Contraste WCAG AA
          </h2>
          <MobileCard padding="md" elevated>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#eef2f7] pb-2.5 dark:border-[#1a3a5c]">
                <div>
                  <p className="text-[14px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">
                    Navy Signature (#0A2342)
                  </p>
                  <p className="text-[12px] text-[#4e5f80] dark:text-[#a8b5cc]">
                    Texto y primario unificado
                  </p>
                </div>
                <span className="text-[12px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                  16.5:1 (AAA)
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-[#eef2f7] pb-2.5 dark:border-[#1a3a5c]">
                <div>
                  <p className="text-[14px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">
                    Muted Text (#4E5F80)
                  </p>
                  <p className="text-[12px] text-[#4e5f80] dark:text-[#a8b5cc]">
                    Texto secundario y labels ≥12px
                  </p>
                </div>
                <span className="text-[12px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                  5.1:1 (AA)
                </span>
              </div>

              {/* Pastillas semánticas */}
              <div>
                <p className="mb-2 text-[12px] font-semibold text-[#4e5f80] dark:text-[#a8b5cc]">
                  Pastillas Semánticas de Estado:
                </p>
                <div className="flex flex-wrap gap-2">
                  <MobileBadge variante="exito" texto="Completado (5.8:1)" punto />
                  <MobileBadge variante="en_ruta" texto="En ruta (5.4:1)" punto />
                  <MobileBadge variante="pendiente" texto="Pendiente (5.5:1)" punto />
                  <MobileBadge variante="error" texto="Alerta (6.1:1)" punto />
                  <MobileBadge variante="neutro" texto="Programado (5.5:1)" />
                </div>
              </div>
            </div>
          </MobileCard>
        </section>

        {/* SECCIÓN 2: TARJETA DE TRASLADO ACTIVO ("BOARDING PASS") */}
        <section aria-labelledby="boarding-pass-title">
          <h2
            id="boarding-pass-title"
            className="mb-2.5 px-1 text-[12px] font-semibold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]"
          >
            2. Tarjeta Operativa ("Boarding Pass")
          </h2>
          <MobileCard padding="none" elevated className="overflow-hidden">
            {/* Cabecera del traslado */}
            <div className="bg-[#0a2342] p-4 text-white dark:bg-[#061529]">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold tracking-wider uppercase text-[#a8b5cc]">
                  Traslado Activo #RR-8924
                </span>
                <MobileBadge variante="en_ruta" texto="En camino" punto size="sm" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <h3 className="text-[20px] font-extrabold leading-tight">
                    Mazda CX-5 2025
                  </h3>
                  <p className="text-[13px] text-[#a8b5cc]">Placas: NCD-48-21 · Blanco Perla</p>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] font-semibold uppercase text-[#a8b5cc]">ETA Estimado</span>
                  <span className="text-[18px] font-bold text-[#4dd9a3]">45 min</span>
                </div>
              </div>
            </div>

            {/* Ruta y evidencia */}
            <div className="p-4 space-y-3 bg-white dark:bg-[#0a2342]">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <span className="size-2.5 rounded-full bg-[#0a2342] dark:bg-[#4d94ff]" />
                  <span className="w-0.5 h-6 bg-[#d7e1ee] dark:bg-[#2d4f73]" />
                  <span className="size-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                </div>
                <div className="flex-1 space-y-2 text-[13px]">
                  <div>
                    <span className="text-[11px] font-semibold text-[#4e5f80] dark:text-[#a8b5cc] uppercase block">Origen</span>
                    <p className="font-semibold text-[#0a2342] dark:text-[#f6f8fb]">Av. Insurgentes Sur 1450, CDMX</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#4e5f80] dark:text-[#a8b5cc] uppercase block">Destino</span>
                    <p className="font-semibold text-[#0a2342] dark:text-[#f6f8fb]">Blvd. Bernardo Quintana 200, QRO</p>
                  </div>
                </div>
              </div>

              {/* Conductor y Cierre Documental */}
              <div className="pt-3 border-t border-[#eef2f7] dark:border-[#1a3a5c] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-full bg-[#edf4fe] flex items-center justify-center text-[#104ca0] font-bold text-xs dark:bg-[#0f2d52] dark:text-[#6ba8ff]">
                    RG
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">Roberto Gómez</p>
                    <p className="text-[11px] text-[#4e5f80] dark:text-[#a8b5cc]">Conductor certificado Didit</p>
                  </div>
                </div>
                <MobileBadge variante="exito" texto="Check inicial ✓" size="sm" />
              </div>
            </div>
          </MobileCard>
        </section>

        {/* SECCIÓN 3: LIST GROUPS & MOBILE ROW */}
        <section aria-labelledby="list-group-title">
          <MobileListGroup tituloSeccion="3. List Groups estilo nativo (Cuenta / Configuración)">
            <MobileRow
              icono={<IconoAuto />}
              tonoIcono="base"
              titulo="Vehículos registrados"
              subtitulo="2 unidades dadas de alta"
              badge={<span className="text-xs font-semibold text-[#4e5f80] dark:text-[#a8b5cc]">Ver flota</span>}
              onClick={() => alert("Clic en vehículos")}
            />
            <MobileRow
              icono={<IconoDocumento />}
              tonoIcono="verde"
              titulo="Pasaportes y facturación"
              subtitulo="Comprobantes fiscales CFDI 4.0"
              onClick={() => alert("Clic en facturación")}
            />
            <MobileRow
              icono={<IconoEscudo />}
              tonoIcono="morado"
              titulo="Verificación de identidad"
              subtitulo="Biometría aprobada"
              badge={<MobileBadge variante="exito" texto="Aprobada" size="sm" />}
            />
            <MobileRow
              icono={<IconoCampana />}
              tonoIcono="ambar"
              titulo="Notificaciones por SMS"
              subtitulo="Actualizaciones de estatus en tiempo real"
              mostrarChevron={false}
              derecha={
                <button
                  type="button"
                  onClick={() => setToggleNotif((v) => !v)}
                  className={[
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                    toggleNotif ? "bg-[#0a2342] dark:bg-[#4d94ff]" : "bg-[#d7e1ee] dark:bg-[#2d4f73]",
                  ].join(" ")}
                  aria-label="Alternar notificaciones"
                >
                  <span
                    className={[
                      "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200",
                      toggleNotif ? "translate-x-5" : "translate-x-0",
                    ].join(" ")}
                  />
                </button>
              }
            />
            <MobileRow
              icono={<IconoTarjeta />}
              tonoIcono="rojo"
              titulo="Cerrar sesión"
              subtitulo="Salir de este dispositivo"
              destructivo
              onClick={() => alert("Cerrar sesión")}
            />
          </MobileListGroup>
        </section>

        {/* SECCIÓN 4: BOTONES & CTA STICKY */}
        <section aria-labelledby="buttons-title">
          <h2
            id="buttons-title"
            className="mb-2.5 px-1 text-[12px] font-semibold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]"
          >
            4. Botones Móviles (52px & Microinteracciones)
          </h2>
          <div className="flex flex-col gap-3">
            <MobileButton
              variant="primary"
              loading={cargando}
              onClick={() => {
                setCargando(true);
                setTimeout(() => setCargando(false), 1500);
              }}
            >
              {cargando ? "Procesando..." : "Botón Primario (52px) · Probar loading"}
            </MobileButton>

            <MobileButton
              variant="secondary"
              onClick={() => alert("Acción secundaria")}
            >
              Botón Secundario (Borde y Superficie)
            </MobileButton>

            <MobileButton
              variant="danger"
              onClick={() => alert("Acción destructiva")}
            >
              Botón de Peligro (Cancelar traslado)
            </MobileButton>
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
