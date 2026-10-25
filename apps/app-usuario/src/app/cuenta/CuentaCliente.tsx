"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Icono, SENDAS_ICONO, useDialogAccesible } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import { logStructuredError } from "../../lib/logger";
import { iniciales } from "./cuenta-utils";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type SeccionCuenta = "perfil" | "soporte" | "legal";

export interface CuentaClienteProps {
  usuario: Usuario | null;
  seccionInicial?: SeccionCuenta | null;
  correoRegistro?: string | null;
  fotoUrl?: string | null;
  totalVehiculos?: number;
  totalTraslados?: number;
  incidenciasAbiertas?: number;
}

const SECCIONES = {
  perfil: {
    titulo: "Perfil",
    descripcion: "Edita tu información personal",
    colorBg: "bg-[#edf4fe] text-[#2563eb] dark:bg-[#0c2646] dark:text-[#4d94ff]",
    icono: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  },
  soporte: {
    titulo: "Soporte",
    descripcion: "Obtén ayuda y contáctanos",
    colorBg: "bg-[#ecfdf5] text-[#10b981] dark:bg-[#09281e] dark:text-[#34d399]",
    icono: "M4 13v-1a8 8 0 0 1 16 0v1 M4 13h3v6H4v-6Z M20 13h-3v6h3v-6Z",
  },
  legal: {
    titulo: "Legal y cuenta",
    descripcion: "Términos, privacidad y seguridad",
    colorBg: "bg-[#fff7ed] text-[#f97316] dark:bg-[#331c0e] dark:text-[#fb923c]",
    icono: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
  },
};

const OPCIONES: Record<
  SeccionCuenta,
  { titulo: string; href: string; icono: string; verificacion?: boolean; destructivo?: boolean }[]
> = {
  perfil: [
    { titulo: "Datos personales", href: "/cuenta/datos-personales", icono: SECCIONES.perfil.icono },
    { titulo: "Contraseña", href: "/cuenta/cambiar-contrasena", icono: SENDAS_ICONO.candado },
    { titulo: "Verificación y facturación", href: "/cuenta/verificacion-documentos", icono: SECCIONES.legal.icono, verificacion: true },
    { titulo: "Cargas masivas pendientes", href: "/viajes/masivo", icono: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" },
    { titulo: "Preferencias", href: "/cuenta/preferencias", icono: "M4 21V3 M12 21V3 M20 21V3 M1 8h6 M9 16h6 M17 8h6" },
  ],
  soporte: [
    { titulo: "Preguntas frecuentes", href: "/preguntas-frecuentes", icono: "M9 9a3 3 0 0 1 6 0c0 2-3 3-3 3 M12 17h.01" },
    { titulo: "Contactar soporte", href: "/soporte", icono: SECCIONES.soporte.icono },
    { titulo: "Reportar problema", href: "/soporte?motivo=problema_traslado", icono: "M12 3 2 21h20L12 3Z M12 9v5 M12 17h.01" },
    { titulo: "Ayuda con evidencia", href: "/soporte?motivo=ayuda_evidencia", icono: "M3 7h4l2-3h6l2 3h4v14H3V7Z M15 13a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" },
  ],
  legal: [
    { titulo: "Términos y condiciones", href: "/legal/terminos", icono: "M14 2H4v20h16V8L14 2Z M14 2v6h6" },
    { titulo: "Aviso de privacidad", href: "/legal/privacidad", icono: SECCIONES.legal.icono },
    { titulo: "Eliminar cuenta", href: "/soporte?motivo=eliminar_cuenta", icono: "M3 6h18 M5 6v16h14V6 M9 6V3h6v3", destructivo: true },
  ],
};

function Chevron({ className = "size-4 text-[#94a3b8]" }: { className?: string }) {
  return <Icono d="m9 18 6-6-6-6" className={className} />;
}

function BadgeVerificacion({ estado }: { estado: Usuario["estado_verificacion"] | undefined }) {
  const texto = estado === "verificado" ? "Verificado" : estado === "en_revision" ? "En revisión" : estado === "rechazado" ? "Rechazado" : "Pendiente";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-[#eaf8f0] px-2.5 py-0.5 text-[11px] font-bold text-[#10b981] dark:bg-[#09281e] dark:text-[#34d399]"
      title={texto}
    >
      <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {texto}
    </span>
  );
}

function HojaCuenta({
  seccion,
  estado,
  cerrar,
}: {
  seccion: SeccionCuenta;
  estado: Usuario["estado_verificacion"] | undefined;
  cerrar: () => void;
}) {
  const cierreRef = useRef<HTMLButtonElement>(null);
  const gestoRef = useRef<number | null>(null);
  const dialogRef = useDialogAccesible({ focoInicial: cierreRef, alCancelar: cerrar });
  const titulo = SECCIONES[seccion].titulo;

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby="hoja-cuenta-titulo"
      className="user-account-sheet user-v2-scope"
      onClick={(event) => {
        if (event.target === event.currentTarget) cerrar();
      }}
    >
      <div className="user-account-sheet-panel">
        <div
          className="user-account-sheet-grip"
          aria-hidden="true"
          onPointerDown={(event) => {
            gestoRef.current = event.clientY;
            event.currentTarget.setPointerCapture?.(event.pointerId);
          }}
          onPointerUp={(event) => {
            if (gestoRef.current !== null && event.clientY - gestoRef.current > 60) cerrar();
            gestoRef.current = null;
          }}
          onPointerCancel={() => {
            gestoRef.current = null;
          }}
        >
          <span />
        </div>
        <div className="user-account-sheet-heading">
          <h2 id="hoja-cuenta-titulo">{titulo}</h2>
          <button
            ref={cierreRef}
            type="button"
            onClick={cerrar}
            aria-label={`Cerrar panel de ${titulo}`}
            className="user-account-sheet-close cursor-pointer"
          >
            <Icono d="M6 6l12 12 M6 18 18 6" className="size-5" />
          </button>
        </div>
        <nav aria-label={titulo}>
          {OPCIONES[seccion].map((opcion) => (
            <Link
              key={opcion.href}
              href={opcion.href}
              onClick={cerrar}
              className={`user-account-row ${opcion.destructivo ? "is-destructive" : ""}`}
            >
              <Icono d={opcion.icono} className="size-5 shrink-0" />
              <span className="user-account-row-label" title={opcion.titulo}>
                {opcion.titulo}
              </span>
              {opcion.verificacion && <BadgeVerificacion estado={estado} />}
              <Chevron />
            </Link>
          ))}
        </nav>
      </div>
    </dialog>
  );
}

function IlustracionCiudadInferior() {
  return (
    <div className="mt-4 flex w-full justify-center opacity-70 select-none pointer-events-none" aria-hidden="true">
      <svg viewBox="0 0 360 80" fill="none" className="w-full max-w-[380px] h-auto">
        {/* Silueta de edificios en el fondo */}
        <rect x="30" y="30" width="20" height="42" rx="2" fill="#d9e5f3" />
        <rect x="54" y="20" width="26" height="52" rx="2" fill="#cbdcf0" />
        <rect x="84" y="36" width="18" height="36" rx="2" fill="#d9e5f3" />
        <rect x="150" y="24" width="30" height="48" rx="2" fill="#cbdcf0" />
        <rect x="184" y="34" width="22" height="38" rx="2" fill="#d9e5f3" />
        <rect x="230" y="28" width="26" height="44" rx="2" fill="#cbdcf0" />
        <rect x="290" y="32" width="22" height="40" rx="2" fill="#d9e5f3" />

        {/* Árboles y follaje */}
        <ellipse cx="20" cy="58" rx="7" ry="12" fill="#b9d3ef" />
        <ellipse cx="120" cy="60" rx="6" ry="10" fill="#b9d3ef" />
        <ellipse cx="330" cy="58" rx="8" ry="14" fill="#b9d3ef" />

        {/* Bus de transporte público */}
        <g transform="translate(68, 50)">
          <rect x="0" y="0" width="40" height="20" rx="4" fill="#8cb2dc" />
          <rect x="4" y="4" width="7" height="6" rx="1" fill="#e8f2fe" />
          <rect x="14" y="4" width="7" height="6" rx="1" fill="#e8f2fe" />
          <rect x="24" y="4" width="7" height="6" rx="1" fill="#e8f2fe" />
          <circle cx="8" cy="20" r="3" fill="#475569" />
          <circle cx="32" cy="20" r="3" fill="#475569" />
        </g>

        {/* Auto compacto */}
        <g transform="translate(180, 56)">
          <path d="M4 10 L8 3 L24 3 L28 10 Z" fill="#8cb2dc" />
          <rect x="0" y="8" width="32" height="8" rx="3" fill="#608bbb" />
          <circle cx="6" cy="16" r="2.5" fill="#475569" />
          <circle cx="26" cy="16" r="2.5" fill="#475569" />
        </g>

        {/* Pin de ubicación decorativo */}
        <g transform="translate(245, 42)">
          <path d="M7 16 C7 16 14 9 14 6 C14 2.5 10.5 0 7 0 C3.5 0 0 2.5 0 6 C0 9 7 16 7 16 Z" fill="#8cb2dc" />
          <circle cx="7" cy="6" r="2.5" fill="#ffffff" />
        </g>

        {/* Línea de calle */}
        <line x1="0" y1="72" x2="360" y2="72" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8 6" />
      </svg>
    </div>
  );
}

export function CuentaCliente({
  seccionInicial = null,
  usuario,
  correoRegistro = null,
  fotoUrl = null,
  totalVehiculos = 0,
  totalTraslados = 0,
  incidenciasAbiertas = 0,
}: CuentaClienteProps) {
  const router = useRouter();
  const [seccion, setSeccion] = useState<SeccionCuenta | null>(seccionInicial);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [errorSesion, setErrorSesion] = useState<string | null>(null);
  const salidaRef = useRef(false);
  const cerrarHoja = useCallback(() => setSeccion(null), []);
  const nombre = usuario?.nombre?.trim() || "Mi cuenta";
  const correo = correoRegistro?.trim() || "Sin correo registrado";
  const telefono = usuario?.telefono?.trim() || "Sin teléfono registrado";

  async function cerrarSesion() {
    if (salidaRef.current) return;
    salidaRef.current = true;
    setCerrandoSesion(true);
    setErrorSesion(null);
    try {
      const { error } = await crearClienteNavegador().auth.signOut();
      if (error) throw error;

      try {
        localStorage.removeItem("ruumruum.traslados-nuevo.borrador.v2");
        localStorage.removeItem("ruum-onboarding-paso");
        localStorage.removeItem("ruum-onboarding-paso:exp");
        localStorage.removeItem("ruum-onboarding-visto");
        localStorage.removeItem("ruum-onboarding-visto:exp");
      } catch {
        // En modo incógnito o storage no disponible
      }

      router.replace("/login");
      router.refresh();
    } catch (err) {
      logStructuredError("cuenta", "cerrar_sesion_fallido", err);
      setErrorSesion("No pudimos cerrar tu sesión. Intenta de nuevo.");
      setCerrandoSesion(false);
      salidaRef.current = false;
    }
  }

  return (
    <div className="flex flex-col gap-3.5 pb-6">
      {/* Tarjeta Superior de Perfil (Fondo azul marino oscuro V2) */}
      <section
        aria-label="Perfil"
        className="rounded-[24px] bg-[#0c2340] p-4.5 text-white shadow-md dark:bg-[#081a2e] sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Avatar con iniciales o foto + punto de estado en línea */}
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              {fotoUrl ? (
                <Image
                  src={fotoUrl}
                  alt={`Foto de perfil de ${nombre}`}
                  width={56}
                  height={56}
                  className="size-14 rounded-full border-2 border-white/20 object-cover"
                  unoptimized
                />
              ) : (
                <span className="flex size-14 items-center justify-center rounded-full bg-[#1b3b64] text-[18px] font-extrabold tracking-tight text-white border-2 border-white/20 shadow-inner">
                  {iniciales(usuario?.nombre)}
                </span>
              )}
              {/* Indicador en línea verde */}
              <span
                className="absolute bottom-0 right-0 size-3.5 rounded-full bg-[#22c55e] ring-2 ring-[#0c2340]"
                aria-hidden="true"
              />
            </div>

            {/* Información del usuario */}
            <div className="min-w-0">
              <h2 className="truncate font-display text-[15.5px] font-extrabold uppercase tracking-tight text-white sm:text-[16.5px]">
                {nombre}
              </h2>
              <p className="truncate text-[12.5px] font-medium text-slate-300">
                {correo}
              </p>
              <p className="truncate text-[12.5px] font-medium text-slate-300">
                {telefono}
              </p>
            </div>
          </div>

          {/* Badge de Verificado */}
          <div className="shrink-0">
            <BadgeVerificacion estado={usuario?.estado_verificacion ?? "verificado"} />
          </div>
        </div>

        {/* Separador sutil */}
        <div className="my-3.5 border-t border-white/10" />

        {/* 3 Métricas en fila horizontal */}
        <dl className="grid grid-cols-3 divide-x divide-white/10 text-center">
          {/* Incidencias */}
          <div className="px-2">
            <div className="flex items-center justify-center gap-1.5">
              <svg className="size-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <dd className="font-display text-[16px] font-bold text-white">
                {incidenciasAbiertas}
              </dd>
            </div>
            <dt className="text-[11px] font-medium text-slate-300">Incidencias</dt>
          </div>

          {/* Traslados */}
          <div className="px-2">
            <div className="flex items-center justify-center gap-1.5">
              <svg className="size-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <dd className="font-display text-[16px] font-bold text-white">
                {totalTraslados}
              </dd>
            </div>
            <dt className="text-[11px] font-medium text-slate-300">Traslados</dt>
          </div>

          {/* Vehículos */}
          <div className="px-2">
            <div className="flex items-center justify-center gap-1.5">
              <svg className="size-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 11l1.5-4.5h11L19 11M4 11h16v6a1 1 0 0 1-1 1h-1a2 2 0 0 1-4 0H10a2 2 0 0 1-4 0H5a1 1 0 0 1-1-1v-6z" />
                <circle cx="7.5" cy="17.5" r="1.5" />
                <circle cx="16.5" cy="17.5" r="1.5" />
              </svg>
              <dd className="font-display text-[16px] font-bold text-white">
                {totalVehiculos}
              </dd>
            </div>
            <dt className="text-[11px] font-medium text-slate-300">Vehículos</dt>
          </div>
        </dl>
      </section>

      {/* Menú de Tarjetas Independientes (Perfil, Soporte, Legal y Cerrar sesión) */}
      <nav aria-label="Ajustes de cuenta" className="flex flex-col gap-2.5">
        {(Object.entries(SECCIONES) as [SeccionCuenta, { titulo: string; descripcion: string; colorBg: string; icono: string }][]).map(
          ([id, opcion]) => (
            <button
              key={id}
              type="button"
              aria-haspopup="dialog"
              aria-label={opcion.titulo}
              onClick={() => setSeccion(id)}
              className="flex w-full items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white p-3.5 shadow-xs transition hover:bg-[#f8fafc] active:scale-[0.99] cursor-pointer dark:border-[#1a3a5c] dark:bg-[#0a2342] dark:hover:bg-[#0f2d52] sm:p-4"
            >
              <div className="flex items-center gap-3.5">
                <span className={`flex size-10.5 shrink-0 items-center justify-center rounded-xl ${opcion.colorBg}`}>
                  <Icono d={opcion.icono} className="size-5" />
                </span>
                <div className="text-left">
                  <span className="block font-display text-[14.5px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">
                    {opcion.titulo}
                  </span>
                  <span aria-hidden="true" className="block text-[12px] font-medium text-[#64748b] dark:text-[#94a3b8]">
                    {opcion.descripcion}
                  </span>
                </div>
              </div>
              <Chevron />
            </button>
          )
        )}

        {/* Botón Cerrar Sesión Destructivo */}
        <button
          type="button"
          onClick={cerrarSesion}
          disabled={cerrandoSesion}
          aria-busy={cerrandoSesion}
          aria-label={cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión"}
          className="is-destructive flex w-full items-center justify-between rounded-2xl border border-[#fee2e2] bg-white p-3.5 shadow-xs transition hover:bg-[#fef2f2] active:scale-[0.99] cursor-pointer dark:border-[#591d24] dark:bg-[#0a2342] dark:hover:bg-[#1f0d11] sm:p-4"
        >
          <div className="flex items-center gap-3.5">
            <span className="flex size-10.5 shrink-0 items-center justify-center rounded-xl bg-[#fef2f2] text-[#ef4444] dark:bg-[#331418] dark:text-[#f87171]">
              <Icono d="M9 21H3V3h6 M16 17l5-5-5-5 M21 12H9" className="size-5" />
            </span>
            <div className="text-left">
              <span className="block font-display text-[14.5px] font-bold text-[#ef4444] dark:text-[#f87171]">
                {cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión"}
              </span>
              <span aria-hidden="true" className="block text-[12px] font-medium text-[#64748b] dark:text-[#94a3b8]">
                Finaliza tu sesión de forma segura
              </span>
            </div>
          </div>
          <Chevron className="size-4 text-[#ef4444] dark:text-[#f87171]" />
        </button>
      </nav>

      {errorSesion && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-bold text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {errorSesion}
        </p>
      )}

      {/* Ilustración de paisaje urbano inferior */}
      <IlustracionCiudadInferior />

      {/* Hoja modal accesible para subsecciones */}
      {seccion && <HojaCuenta seccion={seccion} estado={usuario?.estado_verificacion} cerrar={cerrarHoja} />}
    </div>
  );
}