"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Aviso, MobileShell, MobileCard } from "@ruum/ui";
import { TEXTOS_CARGANDO } from "@ruum/shared/constants";
import { traducirErrorAuth } from "@ruum/shared/utils";
import { registrarEventoUx } from "../../lib/analytics";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";

function IconoCorreo({ className = "size-4 text-[#566889]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IconoReloj({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconoRecargar({ className = "size-4.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M21 21v-5h-5" />
    </svg>
  );
}

function IconoAyudaCirculo({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IlustracionSobreVerificado() {
  return (
    <div className="relative mx-auto my-3 flex size-24 items-center justify-center sm:size-28" aria-hidden="true">
      <svg viewBox="0 0 120 120" fill="none" className="h-full w-full drop-shadow-md">
        {/* Resplandor ambiental de fondo */}
        <circle cx="60" cy="62" r="46" fill="#e8f2fe" className="dark:fill-[#0c2646]" />
        {/* Cuerpo del sobre */}
        <rect x="22" y="38" width="76" height="52" rx="10" fill="#c7defa" className="dark:fill-[#1a3a60]" />
        {/* Pliegue interno y sombra del sobre */}
        <path d="M22 48 L60 74 L98 48 L98 80 C98 85.5 93.5 90 88 90 L32 90 C26.5 90 22 85.5 22 80 Z" fill="#9ec5f7" className="dark:fill-[#122c4a]" />
        {/* Solapa superior del sobre */}
        <path d="M23 42 C24.5 39 27.5 38 31 38 L89 38 C92.5 38 95.5 39 97 42 L60 67 Z" fill="#d9e9fd" className="dark:fill-[#254d7d]" />
        <path d="M22 41 L60 68 L98 41" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.7" />
        {/* Destellos / Radiación de confirmación verde */}
        <path d="M78 18 L76 23" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M96 24 L92 28" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M103 40 L98 41" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
        {/* Badge circular con check de verificación */}
        <g transform="translate(68, 16)">
          <circle cx="16" cy="16" r="15" fill="#10b981" filter="drop-shadow(0 4px 6px rgba(16,185,129,0.3))" />
          <path d="M10.5 16 L14.5 20 L21.5 12" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

export function FormularioRecuperarPassword({
  errorInicial,
}: {
  /** Aviso de enlace inválido; lo resuelve `page.tsx` (Server Component) a
   *  partir de `searchParams`, igual que login/verificacion/soporte. */
  errorInicial: string | null;
}) {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(errorInicial);
  const [errorCampo, setErrorCampo] = useState<string | null>(null);
  const [segundosRestantes, setSegundosRestantes] = useState(30);
  const correoRef = useRef<HTMLInputElement>(null);
  const ultimoEnvioRef = useRef<number>(0);

  useEffect(() => {
    registrarEventoUx("recuperacion_vista");
    if (errorInicial) {
      registrarEventoUx("recuperacion_error", { motivo: "enlace_invalido" });
    }
  }, [errorInicial]);

  // Manejo de la cuenta regresiva de 30 segundos tras enviar el enlace
  useEffect(() => {
    if (!enviado) return;
    setSegundosRestantes(30);
    const intervalo = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(intervalo);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [enviado]);

  async function enviar(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const correo = email.trim();
    if (!correo) {
      setError("Escribe tu correo electrónico.");
      setErrorCampo("Escribe tu correo electrónico.");
      registrarEventoUx("recuperacion_error", { motivo: "email_vacio" });
      correoRef.current?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setError("Escribe un correo válido, como correo@ejemplo.com.");
      setErrorCampo("Escribe un correo válido, como correo@ejemplo.com.");
      registrarEventoUx("recuperacion_error", { motivo: "email_invalido" });
      correoRef.current?.focus();
      return;
    }
    const ahora = Date.now();
    if (ahora - ultimoEnvioRef.current < 30000) {
      setError("Ya enviamos un enlace hace unos segundos. Revisa tu bandeja o espera 30 segundos antes de solicitar otro.");
      return;
    }
    ultimoEnvioRef.current = ahora;
    setEnviando(true);
    setError(null);
    registrarEventoUx("recuperacion_enviada");

    try {
      if (!tieneSupabaseConfigurado()) {
        throw new Error("Supabase no está configurado en este entorno.");
      }
      const cliente = crearClienteNavegador();
      const { error: errorAuth } = await cliente.auth.resetPasswordForEmail(
        correo,
        { redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/nueva-password` }
      );
      if (errorAuth) throw errorAuth;
      setEnviado(true);
      registrarEventoUx("recuperacion_exitosa");
    } catch (err) {
      setError(traducirErrorAuth(err, "No pudimos enviar el correo. Intenta de nuevo."));
      registrarEventoUx("recuperacion_error", { motivo: "proveedor" });
    } finally {
      setEnviando(false);
    }
  }

  function handleReintentar() {
    setEnviado(false);
    setError(null);
    setErrorCampo(null);
    window.setTimeout(() => correoRef.current?.focus(), 0);
  }

  function handleReenviar() {
    if (segundosRestantes > 0 || enviando) return;
    if (email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      enviar();
    }
  }

  return (
    <MobileShell variant="compact" className="min-h-dvh bg-[#f4f7fb] dark:bg-[#061529]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-between px-4 py-4 sm:justify-center sm:gap-4 sm:px-6 sm:py-6">
        <div>
          {/* Enlace superior de retorno accesible */}
          <Link
            href="/login"
            className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-[13.5px] font-bold text-[#0066FF] transition hover:text-[#0a2342] dark:text-[#4d94ff] dark:hover:text-[#a8b5cc]"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver al inicio de sesión
          </Link>

          {/* Logotipo oficial sin caja contenedora recortada (integración fluida con el fondo) */}
          <div className="mb-4 flex justify-center" aria-label="Ruum Ruum">
            <Image
              src="/imagenes/ruum-logo.svg"
              alt="Ruum Ruum"
              width={160}
              height={38}
              priority
              className="ruum-logo-light h-9 w-auto object-contain dark:hidden"
            />
            <Image
              src="/imagenes/ruum-logo-dark.svg"
              alt="Ruum Ruum"
              width={160}
              height={38}
              priority
              className="ruum-logo-dark hidden h-9 w-auto object-contain dark:block"
            />
          </div>
        </div>

        {/* Tarjeta de Contenido */}
        <MobileCard elevated className="border border-[#e2e8f0]/80 bg-white/95 p-5 shadow-[0_8px_30px_rgba(10,35,66,0.06)] backdrop-blur-sm dark:border-[#1a3a5c] dark:bg-[#0a2342]/95 sm:p-7">
          {enviado ? (
            /* Estado de éxito: Pantalla Correo Enviado */
            <div className="flex flex-col items-center text-center">
              {/* Ilustración moderna del sobre y check de confirmación */}
              <IlustracionSobreVerificado />

              <h1 className="mt-1 text-[22px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb] sm:text-[24px]">
                Correo enviado
              </h1>

              <p className="mt-1 text-[13px] font-medium text-[#566889] dark:text-[#a8b5cc] sm:text-[13.5px]">
                Revisa tu bandeja de entrada en
              </p>

              {/* Contenedor del correo electrónico de alta legibilidad */}
              <div className="my-2.5 inline-flex max-w-full items-center gap-2 rounded-xl bg-[#eef4fc] px-4 py-2 dark:bg-[#0c223c]">
                <IconoCorreo className="size-4 shrink-0 text-[#0066FF] dark:text-[#4d94ff]" />
                <span className="truncate text-[14px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">
                  {email.trim() || "tu correo electrónico"}
                </span>
              </div>

              {/* Advertencias de spam y expiración de 60 minutos */}
              <p className="text-[12.5px] font-medium leading-relaxed text-[#566889] dark:text-[#a8b5cc]">
                incluyendo la carpeta de spam.
                <br />
                El enlace expira en <strong className="font-semibold text-[#0a2342] dark:text-white">60 minutos</strong>.
              </p>

              {/* Callout de asistencia temporal */}
              <div className="mt-4 flex w-full items-start gap-3 rounded-2xl border border-[#d8e4f5] bg-[#f0f6fd] p-3 text-left dark:border-[#1a3a5c] dark:bg-[#091f38]">
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#0066FF]/10 text-[#0066FF] dark:bg-[#4d94ff]/20 dark:text-[#4d94ff]">
                  <IconoReloj className="size-3.5" />
                </div>
                <div className="flex-1 text-[12px] leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
                  <p className="font-semibold text-[#0a2342] dark:text-[#f6f8fb]">
                    Si no llega en unos minutos, puedes solicitar otro enlace.
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-[#566889] dark:text-[#94a3b8]">
                    {segundosRestantes > 0
                      ? `Podrás solicitar otro enlace en ${segundosRestantes} segundos.`
                      : "Espera 30 segundos entre intentos."}
                  </p>
                </div>
              </div>

              {/* Botón de acción: Reenviar enlace con estados activos/desactivados accesibles */}
              <button
                type="button"
                disabled={segundosRestantes > 0 || enviando}
                aria-disabled={segundosRestantes > 0 || enviando}
                onClick={handleReenviar}
                className={`mt-4 flex h-[48px] w-full items-center justify-center gap-2 rounded-2xl px-5 text-[14.5px] font-bold transition sm:h-[50px] ${
                  segundosRestantes > 0 || enviando
                    ? "cursor-not-allowed bg-[#0066FF]/40 text-white/90 opacity-70"
                    : "cursor-pointer bg-[#0066FF] text-white shadow-sm hover:bg-[#0052cc] active:scale-[0.98] dark:bg-[#0066FF] dark:hover:bg-[#1a75ff]"
                }`}
              >
                <IconoRecargar className={enviando ? "animate-spin" : ""} />
                <span>
                  {enviando
                    ? TEXTOS_CARGANDO.enviando
                    : segundosRestantes > 0
                      ? `Reenviar correo (${segundosRestantes}s)`
                      : "Reenviar correo"}
                </span>
              </button>
              <span className="sr-only" aria-live="polite">
                {segundosRestantes === 0 ? "Ya puedes solicitar otro enlace de recuperación." : ""}
              </span>

              {/* Enlace secundario para solicitar otro enlace / cambiar dirección */}
              <button
                type="button"
                onClick={handleReintentar}
                className="mt-2.5 text-[12px] font-medium text-[#566889] hover:underline dark:text-[#a8b5cc]"
              >
                Solicitar otro enlace
              </button>
            </div>
          ) : (
            /* Formulario de Solicitud Inicial */
            <>
              <h1 className="text-[20px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb] sm:text-[22px]">
                Recuperar contraseña
              </h1>
              <p className="mt-1 text-[13px] font-medium leading-relaxed text-[#566889] dark:text-[#a8b5cc]">
                Escribe el correo con el que te registraste y te enviamos un enlace para crear una nueva contraseña.
              </p>

              <form className="mt-5 flex flex-col gap-3.5" onSubmit={enviar} noValidate>
                <div className="flex flex-col gap-1 sm:gap-1.5">
                  <label htmlFor="correo" className="text-[12px] font-semibold text-[#334155] dark:text-[#cbd5e1]">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566889] dark:text-[#a8b5cc]">
                      <IconoCorreo />
                    </span>
                    <input
                      id="correo"
                      ref={correoRef}
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorCampo) setErrorCampo(null);
                      }}
                      required
                      autoComplete="email"
                      placeholder="correo@ejemplo.com"
                      className="w-full rounded-2xl border border-[#d8e2ee] bg-[#f4f7fc] py-3 pl-10 pr-3.5 text-[15px] font-medium text-[#0a2342] outline-none transition placeholder:text-[#6b7c96] focus:border-[#0066FF] focus:bg-white focus:ring-4 focus:ring-[#0066FF]/10 dark:border-[#1a3a5c] dark:bg-[#07192f] dark:text-[#f6f8fb] dark:focus:border-[#4d94ff] dark:focus:bg-[#0a2342]"
                    />
                  </div>
                  {errorCampo && (
                    <p className="text-[12px] font-bold text-[#9a2637] dark:text-[#ff6b7a]">{errorCampo}</p>
                  )}
                </div>

                {error && (
                  <div role="alert" aria-atomic="true">
                    <Aviso tono="danger">{error}</Aviso>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={enviando}
                  className="mt-2 flex h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0066FF] px-5 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#0052cc] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0066FF] dark:hover:bg-[#1a75ff] sm:h-[50px]"
                >
                  {enviando ? TEXTOS_CARGANDO.enviando : "Enviar enlace de recuperación"}
                </button>
              </form>
            </>
          )}
        </MobileCard>

        {/* Enlace inferior de soporte y ayuda */}
        <div className="mt-4 flex justify-center pb-2">
          <Link
            href="/soporte"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0066FF] hover:underline dark:text-[#4d94ff]"
          >
            <IconoAyudaCirculo className="size-4" />
            ¿Necesitas ayuda?
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}