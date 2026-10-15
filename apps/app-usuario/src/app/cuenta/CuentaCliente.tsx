"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import {
  Icono,
  SENDAS_ICONO,
  MobileRow,
  MobileListGroup,
  MobileBadge,
  type MobileRowTonoIcono,
} from "@ruum/ui";
import { iniciales } from "./cuenta-utils";
import type { Database } from "@ruum/shared/types";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Vehiculo = Database["public"]["Tables"]["vehiculos"]["Row"];

export interface CuentaClienteProps {
  usuario: Usuario | null;
  correoRegistro?: string | null;
  fotoUrl?: string | null;
  vehiculos?: Vehiculo[];
  totalTraslados?: number;
}

/* ---------- Piezas de iconos ---------- */

function IconoAuto({ className = "size-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5.2 10.5 6.7 6.8A2 2 0 0 1 8.55 5.5h6.9a2 2 0 0 1 1.85 1.3l1.5 3.7c1.05.32 1.7 1.28 1.7 2.38v4.37a1 1 0 0 1-1 1h-1.4a1 1 0 0 1-1-1v-.75H6.9v.75a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-4.37c0-1.1.65-2.06 1.7-2.38Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M6.5 10.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="7.2" cy="14.4" r="1.3" fill="currentColor" />
      <circle cx="16.8" cy="14.4" r="1.3" fill="currentColor" />
    </svg>
  );
}

function etiquetaVerificacion(estado: string | null | undefined): string {
  switch (estado) {
    case "verificado":
      return "Verificado";
    case "en_revision":
      return "En revisión";
    case "rechazado":
      return "Documentación rechazada";
    case "pendiente":
      return "Pendiente de verificación";
    default:
      return estado ? estado.replaceAll("_", " ") : "Pendiente de verificación";
  }
}

function nombreVehiculo(v: Vehiculo): string {
  return [v.marca, v.modelo, v.anio].filter(Boolean).join(" ") || "Vehículo";
}

/* ---------- Estilos de tonos de icono ---------- */

const TONO_ICONO_CLASES: Record<MobileRowTonoIcono, string> = {
  base: "bg-[#edf4fe] text-[#104ca0] dark:bg-[#0f2d52] dark:text-[#6ba8ff]",
  verde: "bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]",
  azul: "bg-[#e6f0ff] text-[#0066ff] dark:bg-[#0f2d52] dark:text-[#4d94ff]",
  ambar: "bg-[#fef4e6] text-[#765100] dark:bg-[#3d2e00] dark:text-[#ffc933]",
  rojo: "bg-[#fdeaea] text-[#9a2637] dark:bg-[#3d0f1a] dark:text-[#ff6b7a]",
  morado: "bg-[#f3eefb] text-[#5e3b8c] dark:bg-[#2b1945] dark:text-[#bf9ff0]",
  neutro: "bg-[#eff3f8] text-[#3b4c68] dark:bg-[#1a2e4a] dark:text-[#a8b5cc]",
};

/* ---------- Subcomponente de Chevron para Acordeón ---------- */

function ChevronAcordeon({ abierto }: { abierto: boolean }) {
  return (
    <svg
      className={`size-4 shrink-0 transition-transform duration-200 ease-in-out ${
        abierto ? "rotate-90 text-[#104ca0] dark:text-[#6ba8ff]" : "rotate-0 text-[#8b9bb0] dark:text-[#6b7a99]"
      }`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-testid="chevron-acordeon"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/* ---------- Subcomponente de Sección Acordeón ---------- */

interface AcordeonSeccionProps {
  id: string;
  titulo: string;
  subtitulo?: string;
  icono: React.ReactNode;
  tonoIcono?: MobileRowTonoIcono;
  badge?: React.ReactNode;
  abierto: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AcordeonSeccion({
  id,
  titulo,
  subtitulo,
  icono,
  tonoIcono = "base",
  badge,
  abierto,
  onToggle,
  children,
}: AcordeonSeccionProps) {
  const botonId = `acordeon-btn-${id}`;
  const panelId = `acordeon-panel-${id}`;

  return (
    <div className="mb-3.5 overflow-hidden rounded-2xl border border-[#e6edf6] bg-white shadow-[0_2px_10px_rgba(10,35,66,0.04)] transition-colors dark:border-[#1a3a5c] dark:bg-[#0a2342] dark:shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
      <button
        type="button"
        id={botonId}
        aria-expanded={abierto}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex min-h-[58px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f8fafd] active:bg-[#f0f5fe] dark:hover:bg-[#0f2d52]/60 dark:active:bg-[#0f2d52]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className={[
              "flex size-10 shrink-0 items-center justify-center rounded-[13px] transition-transform",
              TONO_ICONO_CLASES[tonoIcono],
            ].join(" ")}
          >
            {icono}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-bold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
              {titulo}
            </span>
            {subtitulo && (
              <span className="mt-0.5 block truncate text-[12px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">
                {subtitulo}
              </span>
            )}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {badge}
          <ChevronAcordeon abierto={abierto} />
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={botonId}
        className="grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-in-out"
        style={{
          gridTemplateRows: abierto ? "1fr" : "0fr",
          opacity: abierto ? 1 : 0,
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-[#eef2f7] dark:border-[#1a3a5c]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CuentaCliente({
  usuario,
  correoRegistro = null,
  fotoUrl = null,
  vehiculos = [],
  totalTraslados = 0,
}: CuentaClienteProps) {
  const router = useRouter();
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Record<string, boolean>>({
    perfil: false,
    soporte: false,
    legal: false,
  });

  function toggleSeccion(seccionId: string) {
    setSeccionesAbiertas((prev) => ({
      ...prev,
      [seccionId]: !prev[seccionId],
    }));
  }

  const nombreMostrar = usuario?.nombre?.trim() || "Mi cuenta";
  const correoMostrar = correoRegistro?.trim() || "Sin correo registrado";
  const telefonoMostrar = usuario?.telefono?.trim() || "Sin teléfono registrado";
  const verificado = usuario?.estado_verificacion === "verificado";
  const sinIncidencias = usuario?.traslados_completados_sin_incidencia ?? 0;

  async function handleCerrarSesion() {
    setCerrandoSesion(true);
    try {
      const cliente = crearClienteNavegador();
      await cliente.auth.signOut();
    } catch {
      // ignore
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col">
      <h1 className="pb-3 text-[26px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
        Cuenta
      </h1>

      {/* Héroe de perfil.
          Nota: colores blancos como valores arbitrarios (text-[#fff],
          rgba) y NO como text-white/* — el scope user-v2-secondary-screen
          re-mapea [class*="text-white"] a azul oscuro y rompería el
          contraste sobre el fondo oscuro. */}
      <section
        aria-label="Perfil"
        className="relative mb-5 overflow-hidden rounded-[26px] p-6 text-[#fff] shadow-[0_16px_32px_-12px_rgba(10,35,66,0.4)]"
        style={{ background: "linear-gradient(135deg, #0a2342 0%, #143560 100%)" }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }}
        />
        <div className="relative z-[1] mb-5 flex items-center gap-4">
          {fotoUrl ? (
            <Image
              src={fotoUrl}
              alt={`Foto de perfil de ${nombreMostrar}`}
              width={72}
              height={72}
              className="size-[72px] shrink-0 rounded-full border-[2.5px] border-[rgba(255,255,255,0.25)] object-cover"
              unoptimized
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-[72px] shrink-0 items-center justify-center rounded-full border-[2.5px] border-[rgba(255,255,255,0.25)] bg-white/15 text-[30px] font-bold text-[#fff]"
            >
              {iniciales(usuario?.nombre)}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-[20px] font-extrabold tracking-tight">{nombreMostrar}</h2>
            <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] font-medium text-[rgba(255,255,255,0.7)]">
              <Icono d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z M22 6 12 13 2 6" className="size-3 shrink-0" />
              <span className="truncate">{correoMostrar}</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-[rgba(255,255,255,0.7)]">
              <Icono d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" className="size-3 shrink-0" />
              {telefonoMostrar}
            </p>
          </div>
        </div>
        <dl className="relative z-[1] flex rounded-2xl bg-white/[0.08] py-3.5">
          {[
            { valor: String(totalTraslados), etiqueta: "Traslados" },
            { valor: String(vehiculos.length), etiqueta: "Vehículos" },
            { valor: String(sinIncidencias), etiqueta: "Sin incidencias" },
          ].map(({ valor, etiqueta }) => (
            <div key={etiqueta} className="flex-1 text-center first:border-l-0 border-l border-[rgba(255,255,255,0.12)]">
              <dd className="text-[18px] font-extrabold tracking-tight">{valor}</dd>
              <dt className="mt-[3px] text-[10px] font-semibold uppercase tracking-[0.4px] text-[rgba(255,255,255,0.6)]">{etiqueta}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Mis vehículos */}
      <div className="mb-5">
        <h2 className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]">
          Mis vehículos
        </h2>
        <div
          role="list"
          aria-label="Mis vehículos"
          className="flex gap-3 overflow-x-auto pb-1.5"
          style={{ scrollbarWidth: "none" }}
        >
          {vehiculos.map((vehiculo) => (
            <Link
              key={vehiculo.id}
              role="listitem"
              href="/cuenta/vehiculos"
              aria-label={`Gestionar vehículo ${nombreVehiculo(vehiculo)}`}
              className="w-[200px] shrink-0 rounded-2xl border border-[#e6edf6] bg-white p-4 shadow-[0_2px_10px_rgba(10,35,66,0.04)] transition-transform active:scale-[0.98] dark:border-[#1a3a5c] dark:bg-[#0a2342]"
            >
              <span className="mb-2.5 flex items-start justify-between">
                <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-[13px] bg-[#edf4fe] text-[#104ca0] dark:bg-[#0f2d52] dark:text-[#6ba8ff]">
                  <IconoAuto />
                </span>
                <span className="rounded-full bg-[#edf4fe] px-2.5 py-[3px] text-[11px] font-bold text-[#104ca0] dark:bg-[#0f2d52] dark:text-[#6ba8ff]">
                  {vehiculo.alias?.trim() || "Mi vehículo"}
                </span>
              </span>
              <span className="mb-1 block truncate text-[14.5px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
                {nombreVehiculo(vehiculo)}
              </span>
              <span className="block text-[12px] font-semibold tracking-[0.5px] text-[#4e5f80] dark:text-[#a8b5cc]">
                {vehiculo.placas?.trim() || "Sin placas"}
              </span>
            </Link>
          ))}
          <Link
            href="/cuenta/vehiculos"
            aria-label="Agregar vehículo"
            className="flex min-w-[130px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#c8dcf8] bg-[#f8fafd] p-4 text-[13px] font-semibold text-[#104ca0] transition-transform active:scale-[0.98] dark:border-[#1d4576] dark:bg-[#0a2342]/50 dark:text-[#6ba8ff]"
          >
            <Icono d="M12 8.5v7M8.5 12h7 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" className="size-[22px] text-[#104ca0]/70 dark:text-[#6ba8ff]/70" />
            <span>Agregar vehículo</span>
          </Link>
        </div>
      </div>

      {/* Acordeón: Perfil */}
      <AcordeonSeccion
        id="perfil"
        titulo="Perfil"
        subtitulo="Datos personales, contraseña y documentos"
        icono={
          <Icono
            d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
            className="size-[19px]"
          />
        }
        tonoIcono="base"
        abierto={Boolean(seccionesAbiertas.perfil)}
        onToggle={() => toggleSeccion("perfil")}
      >
        <nav aria-label="Perfil">
          <MobileRow
            href="/cuenta/datos-personales"
            enlaceComponente={Link}
            icono={<Icono d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" className="size-[17px]" />}
            tonoIcono="base"
            titulo="Datos personales"
            subtitulo="Nombre, correo, teléfono, dirección"
            conDivisor={false}
          />
          <MobileRow
            href="/cuenta/cambiar-contrasena"
            enlaceComponente={Link}
            icono={<Icono d={SENDAS_ICONO.candado} className="size-[17px]" />}
            tonoIcono="base"
            titulo="Contraseña"
            subtitulo="Cambiar contraseña de acceso"
          />
          <MobileRow
            href="/cuenta/verificacion-documentos"
            enlaceComponente={Link}
            icono={<Icono d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z M9 12l2 2 4-4" className="size-[17px]" />}
            tonoIcono="verde"
            titulo="Verificación y facturación"
            subtitulo="INE, licencia, comprobante y datos fiscales"
            badge={
              <MobileBadge
                variante={verificado ? "exito" : "pendiente"}
                texto={etiquetaVerificacion(usuario?.estado_verificacion)}
                size="sm"
              />
            }
          />
          <MobileRow
            href="/cuenta/preferencias"
            enlaceComponente={Link}
            icono={<Icono d="M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6" className="size-[17px]" />}
            tonoIcono="morado"
            titulo="Preferencias"
            subtitulo="Notificaciones, alertas, idioma y tema"
          />
        </nav>
      </AcordeonSeccion>

      {/* Acordeón: Soporte */}
      <AcordeonSeccion
        id="soporte"
        titulo="Soporte"
        subtitulo="Preguntas frecuentes, contacto y reporte"
        icono={
          <Icono
            d="M4 13v-1a8 8 0 0 1 16 0v1 M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2Z M20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z"
            className="size-[19px]"
          />
        }
        tonoIcono="base"
        abierto={Boolean(seccionesAbiertas.soporte)}
        onToggle={() => toggleSeccion("soporte")}
      >
        <div className="grid grid-cols-2 gap-2.5 p-3">
          {[
            {
              href: "/preguntas-frecuentes",
              icono: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01",
              tono: "base" as const,
              titulo: "Preguntas frecuentes",
              subtitulo: "Respuestas rápidas",
            },
            {
              href: "/soporte",
              icono: "M4 13v-1a8 8 0 0 1 16 0v1 M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2Z M20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z",
              tono: "base" as const,
              titulo: "Contactar soporte",
              subtitulo: "Chat 24/7",
            },
            {
              href: "/soporte?motivo=problema_traslado",
              icono: "M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z M12 8v5 M12 16.5h.01",
              tono: "ambar" as const,
              titulo: "Reportar problema",
              subtitulo: "Con un traslado",
            },
            {
              href: "/soporte?motivo=ayuda_evidencia",
              icono: "M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z M12 16.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z",
              tono: "rojo" as const,
              titulo: "Ayuda con evidencia",
              subtitulo: "Fotos y checks",
            },
          ].map(({ href, icono, titulo, subtitulo, tono }) => {
            const tonoClases = {
              base: "bg-[#edf4fe] text-[#104ca0] dark:bg-[#0f2d52] dark:text-[#6ba8ff]",
              ambar: "bg-[#fef4e6] text-[#765100] dark:bg-[#3d2e00] dark:text-[#ffc933]",
              rojo: "bg-[#fdeaea] text-[#9a2637] dark:bg-[#3d0f1a] dark:text-[#ff6b7a]",
            }[tono];

            return (
              <Link
                key={titulo}
                href={href}
                className="flex flex-col gap-2 rounded-xl border border-[#e6edf6] bg-white p-3.5 shadow-none transition-transform active:scale-[0.98] dark:border-[#1a3a5c] dark:bg-[#0a2342]"
              >
                <span aria-hidden="true" className={["flex size-9 items-center justify-center rounded-xl", tonoClases].join(" ")}>
                  <Icono d={icono} className="size-4" />
                </span>
                <span className="text-[13px] font-bold leading-snug tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
                  {titulo}
                </span>
                <span className="-mt-1 text-[11.5px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">
                  {subtitulo}
                </span>
              </Link>
            );
          })}
        </div>
      </AcordeonSeccion>

      {/* Acordeón: Legal y cuenta */}
      <AcordeonSeccion
        id="legal"
        titulo="Legal y cuenta"
        subtitulo="Términos, privacidad, sesión y baja"
        icono={
          <Icono
            d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
            className="size-[19px]"
          />
        }
        tonoIcono="neutro"
        abierto={Boolean(seccionesAbiertas.legal)}
        onToggle={() => toggleSeccion("legal")}
      >
        <nav aria-label="Legal y cuenta">
          <MobileRow
            href="/legal/terminos"
            enlaceComponente={Link}
            icono={<Icono d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6" className="size-[17px]" />}
            tonoIcono="base"
            titulo="Términos y condiciones"
            conDivisor={false}
          />
          <MobileRow
            href="/legal/privacidad"
            enlaceComponente={Link}
            icono={<Icono d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" className="size-[17px]" />}
            tonoIcono="base"
            titulo="Aviso de privacidad"
          />
          <MobileRow
            onClick={handleCerrarSesion}
            disabled={cerrandoSesion}
            icono={<Icono d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" className="size-[17px]" />}
            tonoIcono="base"
            titulo={cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión"}
          />
          <MobileRow
            href="/soporte?motivo=eliminar_cuenta"
            enlaceComponente={Link}
            icono={<Icono d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" className="size-[17px]" />}
            tonoIcono="rojo"
            destructivo={true}
            titulo="Eliminar cuenta"
            subtitulo="Baja definitiva del usuario"
          />
        </nav>
      </AcordeonSeccion>

      <p className="px-0 py-3 text-center text-[11.5px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">
        Ruum Ruum Usuario · v1.0.0 (MVP)
      </p>
    </div>
  );
}
