"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Icono, SENDAS_ICONO, useDialogAccesible } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import { crearClienteNavegador } from "../../lib/supabase-browser";
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
  perfil: { titulo: "Perfil", icono: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" },
  soporte: { titulo: "Soporte", icono: "M4 13v-1a8 8 0 0 1 16 0v1 M4 13h3v6H4v-6Z M20 13h-3v6h3v-6Z" },
  legal: { titulo: "Legal y cuenta", icono: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" },
};
const OPCIONES: Record<SeccionCuenta, { titulo: string; href: string; icono: string; verificacion?: boolean; destructivo?: boolean }[]> = {
  perfil: [
    { titulo: "Datos personales", href: "/cuenta/datos-personales", icono: SECCIONES.perfil.icono },
    { titulo: "Contraseña", href: "/cuenta/cambiar-contrasena", icono: SENDAS_ICONO.candado },
    { titulo: "Verificación y facturación", href: "/cuenta/verificacion-documentos", icono: SECCIONES.legal.icono, verificacion: true },
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
function Chevron() { return <Icono d="m9 18 6-6-6-6" className="size-4 shrink-0" />; }
function BadgeVerificacion({ estado }: { estado: Usuario["estado_verificacion"] | undefined }) {
  const texto = estado === "verificado" ? "Verificado" : estado === "en_revision" ? "En revisión" : estado === "rechazado" ? "Rechazado" : "Pendiente";
  return <span className={`user-account-badge ${estado === "verificado" ? "is-verified" : ""}`} title={texto}>{texto}</span>;
}

function HojaCuenta({ seccion, estado, cerrar }: { seccion: SeccionCuenta; estado: Usuario["estado_verificacion"] | undefined; cerrar: () => void }) {
  const cierreRef = useRef<HTMLButtonElement>(null);
  const gestoRef = useRef<number | null>(null);
  const dialogRef = useDialogAccesible({ focoInicial: cierreRef, alCancelar: cerrar });
  const titulo = SECCIONES[seccion].titulo;
  return (
    <dialog ref={dialogRef} aria-modal="true" aria-labelledby="hoja-cuenta-titulo" className="user-account-sheet user-v2-scope" onClick={(event) => { if (event.target === event.currentTarget) cerrar(); }}>
      <div className="user-account-sheet-panel">
        <div className="user-account-sheet-grip" aria-hidden="true"
          onPointerDown={(event) => { gestoRef.current = event.clientY; event.currentTarget.setPointerCapture?.(event.pointerId); }}
          onPointerUp={(event) => { if (gestoRef.current !== null && event.clientY - gestoRef.current > 60) cerrar(); gestoRef.current = null; }}
          onPointerCancel={() => { gestoRef.current = null; }}><span /></div>
        <div className="user-account-sheet-heading">
          <h2 id="hoja-cuenta-titulo">{titulo}</h2>
          <button ref={cierreRef} type="button" onClick={cerrar} aria-label={`Cerrar panel de ${titulo}`} className="user-account-sheet-close"><Icono d="M6 6l12 12 M6 18 18 6" className="size-5" /></button>
        </div>
        <nav aria-label={titulo}>
          {OPCIONES[seccion].map((opcion) => (
            <Link key={opcion.href} href={opcion.href} onClick={cerrar} className={`user-account-row ${opcion.destructivo ? "is-destructive" : ""}`}>
              <Icono d={opcion.icono} className="size-5 shrink-0" />
              <span className="user-account-row-label" title={opcion.titulo}>{opcion.titulo}</span>
              {opcion.verificacion && <BadgeVerificacion estado={estado} />}
              <Chevron />
            </Link>
          ))}
        </nav>
      </div>
    </dialog>
  );
}

export function CuentaCliente({ seccionInicial = null, usuario, correoRegistro = null, fotoUrl = null, totalVehiculos = 0, totalTraslados = 0, incidenciasAbiertas = 0 }: CuentaClienteProps) {
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
      router.replace("/login");
      router.refresh();
    } catch {
      setErrorSesion("No pudimos cerrar tu sesión. Intenta de nuevo.");
      setCerrandoSesion(false);
      salidaRef.current = false;
    }
  }

  return (
    <div className="user-account-view">
      <section aria-label="Perfil" className="user-account-profile">
        <div className="user-account-identity">
          {fotoUrl ? <Image src={fotoUrl} alt={`Foto de perfil de ${nombre}`} width={56} height={56} className="user-account-avatar" unoptimized /> : <span className="user-account-avatar" aria-hidden="true">{iniciales(usuario?.nombre)}</span>}
          <div className="user-account-contact">
            <h2 title={nombre}>{nombre}</h2>
            <p title={correo}>{correo}</p>
            <p title={telefono}>{telefono}</p>
          </div>
        </div>
        <dl className="user-account-stats">
          {[
            { etiqueta: "Traslados", valor: totalTraslados },
            { etiqueta: "Vehículos", valor: totalVehiculos },
            { etiqueta: "Incidencias", valor: incidenciasAbiertas, detalle: "Incidencias abiertas" },
          ].map(({ etiqueta, valor, detalle }) => <div key={etiqueta} title={detalle}><dt aria-label={detalle}>{etiqueta}</dt><dd>{valor}</dd></div>)}
        </dl>
      </section>
      <nav aria-label="Ajustes de cuenta" className="user-account-menu">
        {(Object.entries(SECCIONES) as [SeccionCuenta, { titulo: string; icono: string }][]).map(([id, opcion]) => (
          <button key={id} type="button" className="user-account-row" aria-haspopup="dialog" onClick={() => setSeccion(id)}>
            <Icono d={opcion.icono} className="size-5 shrink-0" />
            <span className="user-account-row-label">{opcion.titulo}</span>
            {id === "perfil" && <BadgeVerificacion estado={usuario?.estado_verificacion} />}
            <Chevron />
          </button>
        ))}
        <button type="button" className="user-account-row is-destructive" onClick={cerrarSesion} disabled={cerrandoSesion} aria-busy={cerrandoSesion}>
          <Icono d="M9 21H3V3h6 M16 17l5-5-5-5 M21 12H9" className="size-5 shrink-0" />
          <span className="user-account-row-label">{cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión"}</span>
          <Chevron />
        </button>
      </nav>
      {errorSesion && <p role="alert" className="user-account-error">{errorSesion}</p>}
      {seccion && <HojaCuenta seccion={seccion} estado={usuario?.estado_verificacion} cerrar={cerrarHoja} />}
    </div>
  );
}
