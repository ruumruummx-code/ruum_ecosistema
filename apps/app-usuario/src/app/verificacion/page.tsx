/**
 * /verificacion — Verificación just-in-time con Didit y respaldo manual.
 *
 * Estados posibles al llegar aquí:
 *  - pendiente     → nunca subió doc / no verificado → mostrar opciones (Didit o manual)
 *  - en_revision   → ya subió doc, esperando admin → mostrar confirmación de espera
 *  - verificado    → cuenta aprobada → mostrar pantalla de éxito
 *  - rechazado     → mostrar opciones con aviso para reintentar
 */
import Link from "next/link";
import { MobileBadge, MobileCard } from "@ruum/ui";
import { VerificacionForm } from "./VerificacionForm";
import { obtenerUsuarioActual } from "@ruum/api/services";
import { destinoSeguro } from "@ruum/shared/utils";
import { logStructuredWarn } from "../../lib/logger";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

/* Pantalla cuando el usuario ya está verificado */
function CuentaYaVerificada({ destino = "/viajes/nuevo" }: { destino?: string }) {
  return (
    <MobileCard padding="lg" elevated className="text-center space-y-4 border-[#c8e6d8] bg-[#e9f3ee]/40 dark:border-[#135939] dark:bg-[#0a2e1f]/40">
      <div className="flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]">
          <svg
            className="size-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      </div>

      <div className="space-y-1.5">
        <MobileBadge variante="exito" texto="Identidad confirmada" punto size="md" className="mx-auto" />
        <h2 className="text-[20px] font-bold text-[#0a2342] dark:text-[#f6f8fb] pt-1">Cuenta Verificada</h2>
        <p className="text-[13.5px] leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
          Tu identidad ya se encuentra validada y tu cuenta está lista para solicitar y gestionar traslados vehiculares con conductores certificados.
        </p>
      </div>

      <div className="pt-2 flex flex-col gap-3">
        <Link
          href={destino}
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#0a2342] px-5 py-3.5 text-[15.5px] font-bold text-white shadow-[0_12px_24px_-8px_rgba(10,35,66,0.35)] transition hover:bg-[#162c47] active:scale-[0.98] dark:bg-[#4d94ff] dark:text-[#061529]"
        >
          Solicitar traslado
        </Link>
        <Link
          href="/"
          className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-[#d7e1ee] bg-white px-5 py-3.5 text-[15.5px] font-bold text-[#0a2342] transition hover:bg-[#f6f8fb] active:scale-[0.98] dark:border-[#2d4f73] dark:bg-[#0a2342] dark:text-[#f6f8fb]"
        >
          Ir al inicio
        </Link>
      </div>
    </MobileCard>
  );
}

export default async function PaginaVerificacion({ searchParams }: Props) {
  const { next } = await searchParams;
  /* CORRECCIÓN open-redirect: el guard `startsWith("/") && !startsWith("//")`
     dejaba pasar `/\evil.com` (el parser WHATWG normaliza `\` a `/`).
     Se usa el sanitizador canónico, igual que en /auth/callback. */
  const destino = destinoSeguro(next, "/viajes/nuevo");

  /* Leer estado actual del usuario para decidir qué mostrar */
  let estadoVerificacion: string | null = null;
  let docYaSubido = false;
  let fotoPerfilUrl: string | null = null;
  try {
    const { crearClienteServidor } = await import("../../lib/supabase-server");
    const cliente = await crearClienteServidor();
    const usuario = await obtenerUsuarioActual(cliente);
    estadoVerificacion = usuario?.estado_verificacion ?? null;
    docYaSubido = !!usuario?.doc_identidad_url;
    fotoPerfilUrl = usuario?.foto_url ?? null;
  } catch (err) {
    /* si falla, mostrar el formulario normalmente */
    logStructuredWarn("verificacion", "lectura_estado_verificacion_fallida", err);
  }

  /* Si ya subió documentación y está en revisión → pantalla de espera */
  const yaEnRevision = estadoVerificacion === "en_revision" || (docYaSubido && estadoVerificacion !== "rechazado");

  return (
    <main className="verification-portal fixed inset-x-0 top-0 flex h-dvh flex-col overflow-hidden bg-[#f6f8fb] text-[#0a2342] dark:bg-[#071322] dark:text-white">
      <header className="grid shrink-0 grid-cols-[64px_1fr_64px] items-center border-b border-[#d7e1ee] px-3 pb-2 pt-[max(8px,env(safe-area-inset-top))] dark:border-[#1a3a5c]">
        <Link href="/" className="flex min-h-11 items-center text-sm font-semibold">‹ Atrás</Link>
        <h1 className="text-center text-[15px] font-bold">Verificación de identidad</h1>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-5 pb-[max(8px,env(safe-area-inset-bottom))]">
        <p className="shrink-0 py-3 text-center text-xs font-semibold text-[#4e5f80] dark:text-[#a8b5cc]">Paso 3 de 3</p>
        {estadoVerificacion === "rechazado" && <p role="alert" className="shrink-0 text-center text-xs text-red-700 dark:text-red-300">No pudimos confirmar tu identidad. Intenta de nuevo.</p>}
        {yaEnRevision && estadoVerificacion !== "verificado" && <p role="status" className="shrink-0 text-center text-xs text-[#4e5f80] dark:text-[#a8b5cc]">Documentación en revisión (24–48 h). Puedes acelerar con Didit.</p>}
        {estadoVerificacion === "verificado" ? <div className="my-auto"><CuentaYaVerificada destino={destino} /></div> : <VerificacionForm fotoPerfilInicial={fotoPerfilUrl} destinoExito={destino} soloDidit={yaEnRevision} />}
      </div>
    </main>
  );
}
