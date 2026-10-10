"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import { iniciales } from "./cuenta-ui";
import { PreferenciasToggles } from "./PreferenciasToggles";
import type { Database } from "@ruum/shared/types";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Vehiculo = Database["public"]["Tables"]["vehiculos"]["Row"];

export interface CuentaClienteProps {
  usuario: Usuario | null;
  fotoUrl?: string | null;
  vehiculos?: Vehiculo[];
  totalTraslados?: number;
}

/* ---------- Iconos (SVG inline, sin dependencias) ---------- */

function Icono({ d, className = "size-[17px]" }: { d: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function IconoChevron({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

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

/* ---------- Piezas ---------- */

type TonoIcono = "base" | "green" | "orange" | "purple" | "red";

const ICONO_FONDO: Record<TonoIcono, string> = {
  base: "bg-[#f0f5fe] text-[#2e5a88]",
  green: "bg-[#e9f3ee] text-[#1f6b4a]",
  orange: "bg-[#fef4e6] text-[#b36b1e]",
  purple: "bg-[#f2eef9] text-[#5e3b8c]",
  red: "bg-[#fdeaea] text-[#b33c3c]",
};

function EtiquetaSeccion({ children }: { children: string }) {
  return (
    <h2 className="mb-2.5 mt-1 px-1 text-[12px] font-bold uppercase tracking-[0.8px] text-[#8b9bb0]">
      {children}
    </h2>
  );
}

function FilaEnlace({
  href,
  icono,
  tono = "base",
  titulo,
  tituloRojo = false,
  subtitulo,
  insignia,
  insigniaVerde = false,
}: {
  href: string;
  icono: string;
  tono?: TonoIcono;
  titulo: string;
  tituloRojo?: boolean;
  subtitulo?: string;
  insignia?: string;
  insigniaVerde?: boolean;
}) {
  return (
    <Link
      href={href}
      className="relative flex items-center gap-3.5 px-[18px] py-[15px] transition-colors active:bg-[#f8fbfe]"
    >
      <span aria-hidden="true" className={["flex size-10 shrink-0 items-center justify-center rounded-[13px]", ICONO_FONDO[tono]].join(" ")}>
        <Icono d={icono} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={["mb-0.5 block text-[14.5px] font-bold tracking-tight", tituloRojo ? "text-[#b33c3c]" : "text-[#0b1e33]"].join(" ")}>
          {titulo}
        </span>
        {subtitulo && (
          <span className="block truncate text-[12px] font-medium text-[#8b9bb0]">{subtitulo}</span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2.5">
        {insignia && (
          <span className={["rounded-[20px] px-2.5 py-1 text-[11px] font-bold", insigniaVerde ? "bg-[#e9f3ee] text-[#1f6b4a]" : "bg-[#eef3fa] text-[#2e5a88]"].join(" ")}>
            {insignia}
          </span>
        )}
        <IconoChevron className="text-[#c3cfdd]" />
      </span>
    </Link>
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

export function CuentaCliente({ usuario, fotoUrl = null, vehiculos = [], totalTraslados = 0 }: CuentaClienteProps) {
  const router = useRouter();
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const nombreMostrar = usuario?.nombre?.trim() || "Mi cuenta";
  const correoMostrar = usuario?.correo_facturacion?.trim() || "Sin correo registrado";
  const telefonoMostrar = usuario?.telefono?.trim() || "Sin teléfono registrado";
  const verificado = usuario?.estado_verificacion === "verificado";
  const metodoSub = usuario?.metodo_pago_registrado ? "Registrada y activa" : "Sin tarjeta registrada";
  const facturacionInsignia = usuario?.rfc?.trim() ? "Configurado" : "Pendiente";
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
    <div className="flex flex-col">
      <h1 className="pb-3 text-[26px] font-extrabold tracking-tight text-[#0b1e33]">Cuenta</h1>

      {/* Héroe de perfil */}
      <section
        aria-label="Perfil"
        className="relative mb-5 overflow-hidden rounded-[26px] p-6 text-white shadow-[0_16px_32px_-12px_rgba(11,30,51,0.4)]"
        style={{ background: "linear-gradient(135deg, #0b1e33 0%, #162c47 100%)" }}
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
              className="size-[72px] shrink-0 rounded-full border-[2.5px] border-white/25 object-cover"
              unoptimized
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-[72px] shrink-0 items-center justify-center rounded-full border-[2.5px] border-white/25 bg-white/15 text-[30px] font-bold text-white"
            >
              {iniciales(usuario?.nombre)}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-[20px] font-extrabold tracking-tight">{nombreMostrar}</h2>
            <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] font-medium text-white/70">
              <Icono d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z M22 6 12 13 2 6" className="size-3 shrink-0" />
              <span className="truncate">{correoMostrar}</span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-white/70">
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
            <div key={etiqueta} className="flex-1 text-center first:border-l-0 border-l border-white/10">
              <dd className="text-[18px] font-extrabold tracking-tight">{valor}</dd>
              <dt className="mt-[3px] text-[10px] font-semibold uppercase tracking-[0.4px] text-white/60">{etiqueta}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Mis vehículos */}
      <EtiquetaSeccion>Mis vehículos</EtiquetaSeccion>
      <div
        role="list"
        aria-label="Mis vehículos"
        className="mb-[18px] flex gap-3 overflow-x-auto pb-1.5"
        style={{ scrollbarWidth: "none" }}
      >
        {vehiculos.map((vehiculo) => (
          <Link
            key={vehiculo.id}
            role="listitem"
            href="/cuenta/vehiculos"
            aria-label={`Gestionar vehículo ${nombreVehiculo(vehiculo)}`}
            className="w-[200px] shrink-0 rounded-[20px] border border-[#eef2f7] bg-white p-4 shadow-[0_6px_16px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.98]"
          >
            <span className="mb-2.5 flex items-start justify-between">
              <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-[13px] bg-[#eef3fa] text-[#2e5a88]">
                <IconoAuto />
              </span>
              <span className="rounded-[20px] bg-[#f0f5fe] px-2.5 py-[3px] text-[11px] font-bold text-[#2e5a88]">
                {vehiculo.alias?.trim() || "Mi vehículo"}
              </span>
            </span>
            <span className="mb-1 block truncate text-[14.5px] font-extrabold tracking-tight text-[#0b1e33]">
              {nombreVehiculo(vehiculo)}
            </span>
            <span className="block text-[12px] font-semibold tracking-[0.5px] text-[#8b9bb0]">
              {vehiculo.placas?.trim() || "Sin placas"}
            </span>
          </Link>
        ))}
        <Link
          href="/cuenta/vehiculos"
          aria-label="Agregar vehículo"
          className="flex min-w-[130px] shrink-0 flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-[#d5e2f0] bg-[#f8fbfe] p-4 text-[13px] font-semibold text-[#2e5a88] transition-transform active:scale-[0.98]"
        >
          <Icono d="M12 8.5v7M8.5 12h7 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" className="size-[22px] text-[#a6b7cb]" />
          <span>Agregar vehículo</span>
        </Link>
      </div>

      {/* Perfil */}
      <EtiquetaSeccion>Perfil</EtiquetaSeccion>
      <nav aria-label="Perfil" className="mb-[18px] overflow-hidden rounded-[22px] border border-[#eef2f7] bg-white py-1 shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
        <FilaEnlace
          href="/cuenta/perfil"
          icono="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
          titulo="Datos personales"
          subtitulo="Nombre, correo, teléfono, dirección"
        />
        <FilaEnlace
          href="/cuenta/perfil#acceso"
          icono="M3 11h18v11H3z M7 11V7a5 5 0 0 1 10 0v4"
          titulo="Contraseña"
          subtitulo="Cambiar contraseña de acceso"
        />
        <FilaEnlace
          href="/verificacion"
          icono="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z M9 12l2 2 4-4"
          tono="green"
          titulo="Verificación"
          subtitulo={verificado ? "Identidad y documentos verificados" : "Completa tu verificación de identidad"}
          insignia={etiquetaVerificacion(usuario?.estado_verificacion)}
          insigniaVerde={verificado}
        />
      </nav>

      {/* Pagos y facturación */}
      <EtiquetaSeccion>Pagos y facturación</EtiquetaSeccion>
      <nav aria-label="Pagos y facturación" className="mb-[18px] overflow-hidden rounded-[22px] border border-[#eef2f7] bg-white py-1 shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
        <FilaEnlace
          href="/cuenta/metodos-pago"
          icono="M2 5h20v14H2z M2 10h20"
          titulo="Métodos de pago"
          subtitulo={metodoSub}
        />
        <FilaEnlace
          href="/cuenta/facturacion"
          icono="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M16 13H8 M16 17H8"
          tono="orange"
          titulo="Facturación"
          subtitulo="RFC y datos fiscales"
          insignia={facturacionInsignia}
        />
      </nav>

      {/* Notificaciones */}
      <EtiquetaSeccion>Notificaciones</EtiquetaSeccion>
      <div className="mb-[18px] rounded-[22px] border border-[#eef2f7] bg-white px-[18px] py-2 shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
        {usuario ? (
          <PreferenciasToggles usuario={usuario} />
        ) : (
          <p className="py-4 text-[13px] font-medium text-[#8b9bb0]">
            Inicia sesión para configurar tus notificaciones.
          </p>
        )}
      </div>

      {/* Soporte */}
      <EtiquetaSeccion>Soporte</EtiquetaSeccion>
      <div className="mb-[18px] grid grid-cols-2 gap-2.5">
        {[
          { href: "/soporte#faqs", icono: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01", titulo: "Preguntas frecuentes", subtitulo: "Respuestas rápidas" },
          { href: "/soporte", icono: "M4 13v-1a8 8 0 0 1 16 0v1 M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2Z M20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z", titulo: "Contactar soporte", subtitulo: "Chat 24/7" },
          { href: "/soporte#reporte-titulo", icono: "M10.3 3.9 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z M12 8v5 M12 16.5h.01", tono: "orange" as TonoIcono, titulo: "Reportar problema", subtitulo: "Con un traslado" },
          { href: "/soporte", icono: "M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z M12 16.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z", tono: "red" as TonoIcono, titulo: "Ayuda con evidencia", subtitulo: "Fotos y checks" },
        ].map(({ href, icono, titulo, subtitulo, tono }) => (
          <Link
            key={titulo}
            href={href}
            className="flex flex-col gap-2.5 rounded-[18px] border border-[#eef2f7] bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-transform active:scale-[0.98]"
          >
            <span aria-hidden="true" className={["flex size-9 items-center justify-center rounded-xl", ICONO_FONDO[tono ?? "base"]].join(" ")}>
              <Icono d={icono} className="size-4" />
            </span>
            <span className="text-[13px] font-bold leading-snug tracking-tight text-[#0b1e33]">{titulo}</span>
            <span className="-mt-1.5 text-[11px] font-medium text-[#8b9bb0]">{subtitulo}</span>
          </Link>
        ))}
      </div>

      {/* Empresarial */}
      <Link
        href="/soporte"
        aria-label="Ruum Ruum Empresarial: gestiona flotas, centros de costo y facturación. Contactar soporte."
        className="mb-[18px] flex items-center gap-3.5 rounded-[20px] border border-[#e0d5f0] p-[18px] transition-transform active:scale-[0.99]"
        style={{ background: "linear-gradient(135deg, #f2eef9 0%, #e9e2f5 100%)" }}
      >
        <span aria-hidden="true" className="flex size-[46px] shrink-0 items-center justify-center rounded-2xl bg-white text-[#5e3b8c] shadow-[0_4px_10px_rgba(94,59,140,0.1)]">
          <Icono d="M3 21h18 M5 21V7l7-4 7 4v14 M9 21v-4h6v4 M9 10h.01 M15 10h.01 M9 14h.01 M15 14h.01" className="size-5" />
        </span>
        <span className="flex-1">
          <span className="mb-0.5 block text-[14px] font-extrabold tracking-tight text-[#3d2566]">
            Ruum Ruum Empresarial
          </span>
          <span className="block text-[12px] font-medium text-[#6b5296]">
            Gestiona flotas, centros de costo y facturación
          </span>
        </span>
        <IconoChevron className="shrink-0 text-[#9b7fc4]" />
      </Link>

      {/* Legal y cuenta */}
      <EtiquetaSeccion>Legal y cuenta</EtiquetaSeccion>
      <nav aria-label="Legal y cuenta" className="mb-2 overflow-hidden rounded-[22px] border border-[#eef2f7] bg-white py-1 shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
        <FilaEnlace
          href="/legal/terminos"
          icono="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6"
          titulo="Términos y condiciones"
        />
        <FilaEnlace
          href="/legal/privacidad"
          icono="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
          titulo="Aviso de privacidad"
        />
        <div className="relative">
          <button
            type="button"
            onClick={handleCerrarSesion}
            disabled={cerrandoSesion}
            className="flex w-full items-center gap-3.5 px-[18px] py-[15px] text-left transition-colors active:bg-[#f8fbfe] disabled:opacity-60"
          >
            <span aria-hidden="true" className={["flex size-10 shrink-0 items-center justify-center rounded-[13px]", ICONO_FONDO.base].join(" ")}>
              <Icono d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="mb-0.5 block text-[14.5px] font-bold tracking-tight text-[#0b1e33]">
                {cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión"}
              </span>
            </span>
            <IconoChevron className="shrink-0 text-[#c3cfdd]" />
          </button>
        </div>
        <FilaEnlace
          href="/soporte?motivo=eliminar_cuenta"
          icono="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
          tono="red"
          titulo="Eliminar cuenta"
          tituloRojo
          subtitulo="Baja definitiva del usuario"
        />
      </nav>

      <p className="px-0 py-2 text-center text-[11px] font-medium text-[#b0bfd0]">
        Ruum Ruum Usuario · v1.0.0 (MVP)
      </p>
    </div>
  );
}
