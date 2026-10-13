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
import { MobileBadge, MobileCard, MobileHeader, MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { VerificacionForm } from "./VerificacionForm";
import { obtenerUsuarioActual } from "@ruum/api/services";
import { destinoSeguro } from "@ruum/shared/utils";

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

/* Pantalla de espera para usuarios que ya enviaron su documentación manual */
function EsperandoRevision({ fotoPerfilUrl }: { fotoPerfilUrl: string | null }) {
  return (
    <div className="flex flex-col gap-5">
      <MobileCard padding="lg" elevated className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full border border-[#f3d8a2] bg-[#fef4e6] text-[#765100] dark:bg-[#3d2e00] dark:text-[#ffc933] dark:border-[#664d00]">
            <svg
              className="size-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
        </div>

        <div className="space-y-1.5">
          <MobileBadge variante="pendiente" texto="En revisión por el equipo" punto size="md" className="mx-auto" />
          <h2 className="text-[20px] font-bold text-[#0a2342] dark:text-[#f6f8fb] pt-1">En revisión documental</h2>
          <p className="text-[13.5px] leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
            Ya recibimos tu documentación. El equipo de Ruum la está revisando.
            El proceso toma entre <strong className="font-semibold text-[#0a2342] dark:text-white">24 y 48 horas hábiles</strong>.
          </p>
        </div>

        {/* Pasos */}
        <div className="flex flex-col gap-3 rounded-2xl border border-[#e6edf6] bg-[#f8fafd] p-4 text-left dark:border-[#1a3a5c] dark:bg-[#071930]">
          {[
            { label: "Cuenta creada", sub: "Correo y contraseña", done: true },
            { label: "Domicilio", sub: "Registrado", done: true },
            { label: "Identificación oficial", sub: "Recibida — en revisión", done: true },
            { label: "Aprobación de cuenta", sub: "Pendiente de revisión por el equipo", done: false },
          ].map(({ label, sub, done }) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={[
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  done
                    ? "bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]"
                    : "border border-[#f3d8a2] bg-[#fef4e6] text-[#765100] dark:bg-[#3d2e00] dark:text-[#ffc933] dark:border-[#664d00]",
                ].join(" ")}
              >
                {done ? (
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-[#0a2342] dark:text-[#f6f8fb] truncate">{label}</p>
                <p
                  className={[
                    "text-[11.5px] font-medium truncate",
                    !done ? "text-[#765100] dark:text-[#ffc933]" : "text-[#4e5f80] dark:text-[#a8b5cc]",
                  ].join(" ")}
                >
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2.5 rounded-2xl border border-[#f3d8a2] bg-[#fef4e6] p-3.5 text-left dark:border-[#664d00] dark:bg-[#3d2e00]/40">
          <svg className="mt-0.5 size-4 shrink-0 text-[#765100] dark:text-[#ffc933]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          <p className="text-[12px] leading-5 text-[#765100] dark:text-[#ffc933]">
            Te notificaremos por correo y SMS cuando quedes habilitado para solicitar traslados.
            Mientras tanto puedes explorar la app.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#0a2342] px-5 py-3.5 text-[15.5px] font-bold text-white shadow-[0_12px_24px_-8px_rgba(10,35,66,0.35)] transition hover:bg-[#162c47] active:scale-[0.98] dark:bg-[#4d94ff] dark:text-[#061529]"
          >
            Ir al inicio
          </Link>
        </div>

        <div
          aria-disabled="true"
          className="rounded-2xl border border-[#d7e1ee] bg-[#f8fafd] p-3.5 text-center text-[12px] font-medium text-[#4e5f80] dark:border-[#1a3a5c] dark:bg-[#071930] dark:text-[#a8b5cc]"
        >
          Podrás solicitar tu traslado cuando tu cuenta quede aprobada.
        </div>
      </MobileCard>

      {/* Acelerar con Didit */}
      <MobileCard padding="lg" elevated className="border-[#c8dcf8] bg-[#edf4fe]/40 dark:border-[#1d4576] dark:bg-[#0f2d52]/40 space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">Acelera la revisión con Didit</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
            Igual que en el registro de conductor, puedes completar la prueba de vida y validación biométrica mientras tu expediente está en revisión.
          </p>
        </div>
        <VerificacionForm fotoPerfilInicial={fotoPerfilUrl} soloDidit />
      </MobileCard>
    </div>
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
  } catch {
    /* si falla, mostrar el formulario normalmente */
  }

  /* Si ya está verificado → pantalla de éxito */
  if (estadoVerificacion === "verificado") {
    return (
      <>
        <NavegacionUsuario variante="claro" mostrarNavegacionInferior={false} />
        <MobileShell variant="compact" navInferiorVisible={false}>
          <MobileHeader titulo="Verificación" enlaceAtras="/" />
          <div className="py-4">
            <CuentaYaVerificada destino={destino} />
          </div>
        </MobileShell>
      </>
    );
  }

  /* Si ya subió documentación y está en revisión → pantalla de espera */
  const yaEnRevision = estadoVerificacion === "en_revision" || (docYaSubido && estadoVerificacion !== "rechazado");

  return (
    <>
      <NavegacionUsuario variante="claro" mostrarNavegacionInferior={false} />
      <MobileShell variant="compact" navInferiorVisible={false}>
        <MobileHeader
          titulo={yaEnRevision ? "Estado de cuenta" : "Verificación de cuenta"}
          subtitulo={yaEnRevision ? "Expediente en revisión" : "Validación oficial de identidad"}
          enlaceAtras="/"
        />

        <div className="flex flex-col gap-5 py-4">
          {yaEnRevision ? (
            <EsperandoRevision fotoPerfilUrl={fotoPerfilUrl} />
          ) : (
            <>
              {/* Encabezado descriptivo */}
              <div className="space-y-1.5 px-1">
                <h1 className="text-[22px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
                  Verificación de identidad
                </h1>
                <p className="text-[13.5px] leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
                  Para tu seguridad y la del conductor certificado, validamos tu identidad oficial antes del primer traslado.
                </p>

                {estadoVerificacion === "rechazado" && (
                  <div className="mt-3" role="alert" aria-live="assertive" aria-atomic="true">
                    <div className="flex items-start gap-3 rounded-2xl border border-[#f6ccd2] bg-[#fdeaea] p-4 text-[#9a2637] dark:border-[#661a29] dark:bg-[#3d0f1a] dark:text-[#ff6b7a]">
                      <svg
                        className="mt-0.5 size-5 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4m0 4h.01" />
                      </svg>
                      <p className="text-[12.5px] leading-5">
                        Tu verificación anterior no pudo confirmarse. Realiza la prueba biométrica con Didit o sube una foto clara de tu identificación oficial.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Checklist de progreso */}
              <MobileCard padding="md" elevated>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Cuenta creada", sub: "Correo y contraseña", done: true },
                    { label: "Teléfono registrado", sub: "Para notificaciones del traslado", done: true },
                    { label: "Identificación oficial", sub: "Validación biométrica o documental", done: false },
                  ].map(({ label, sub, done }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div
                        className={[
                          "flex size-7 shrink-0 items-center justify-center rounded-full",
                          done
                            ? "bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]"
                            : "border border-[#d7e1ee] bg-[#eff3f8] text-[#3b4c68] dark:bg-[#1a2e4a] dark:text-[#a8b5cc]",
                        ].join(" ")}
                      >
                        {done ? (
                          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : (
                          <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-[#0a2342] dark:text-[#f6f8fb] truncate">{label}</p>
                        <p className="text-[11.5px] font-medium text-[#4e5f80] dark:text-[#a8b5cc] truncate">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </MobileCard>

              {/* Nota de seguridad bancaria */}
              <div className="flex items-start gap-3 rounded-2xl border border-[#c8e6d8] bg-[#e9f3ee]/60 p-4 dark:border-[#135939] dark:bg-[#0a2e1f]/50">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#08705f] shadow-xs dark:bg-[#0a2342] dark:text-[#4dd9a3]" aria-hidden="true">
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4 18 6v5c0 4-2.5 6.8-6 8-3.5-1.2-6-4-6-8V6l6-2Z" />
                  </svg>
                </span>
                <p className="text-[12.5px] leading-relaxed text-[#08705f] dark:text-[#4dd9a3]">
                  Tus datos biométricos y documentos se procesan de forma encriptada bajo estándares bancarios. No se comparten con terceros ni con los conductores.
                </p>
              </div>

              {/* Formulario interactivo Didit + manual */}
              <VerificacionForm fotoPerfilInicial={fotoPerfilUrl} destinoExito={destino} />
            </>
          )}
        </div>
      </MobileShell>
    </>
  );
}
