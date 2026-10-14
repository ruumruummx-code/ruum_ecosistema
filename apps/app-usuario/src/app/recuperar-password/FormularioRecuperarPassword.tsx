"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Aviso, MobileShell, MobileCard, MobileButton } from "@ruum/ui";
import { TEXTOS_CARGANDO } from "@ruum/shared/constants";
import { traducirErrorAuth } from "@ruum/shared/utils";
import { registrarEventoUx } from "../../lib/analytics";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { LogoRuum } from "../experiencia-publica";

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
  const correoRef = useRef<HTMLInputElement>(null);
  const ultimoEnvioRef = useRef<number>(0);

  useEffect(() => {
    registrarEventoUx("recuperacion_vista");
    if (errorInicial) {
      registrarEventoUx("recuperacion_error", { motivo: "enlace_invalido" });
    }
  }, [errorInicial]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
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
        email.trim(),
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

  return (
    <MobileShell variant="compact">
      <div className="flex min-h-dvh flex-col justify-center px-4 py-8 sm:px-6">
        <Link
          href="/login"
          className="mb-6 inline-flex min-h-11 items-center gap-1 text-[13.5px] font-bold text-[#104ca0] transition hover:text-[#0a2342] dark:text-[#6ba8ff] dark:hover:text-[#a8b5cc]"
        >
          ← Volver al inicio de sesión
        </Link>

        <div className="mb-8 flex justify-center">
          <LogoRuum />
        </div>

        <MobileCard elevated className="p-6 sm:p-7">
          {enviado ? (
            /* Estado de éxito */
            <div className="flex flex-col items-center gap-3.5 text-center">
              <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]">
                <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <h1 className="text-[20px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
                Correo enviado
              </h1>
              <p className="text-[13.5px] font-medium leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
                Revisa tu bandeja de entrada en{" "}
                <strong className="font-bold text-[#0a2342] dark:text-[#f6f8fb]">{email.trim()}</strong>, incluyendo
                la carpeta de spam. El enlace expira en 60 minutos.
              </p>
              <p className="text-[12px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">
                Si no llega en unos minutos, puedes solicitar otro enlace. Espera 30 segundos entre intentos.
              </p>
              <MobileButton
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => {
                  setEnviado(false);
                  setError(null);
                  setErrorCampo(null);
                  window.setTimeout(() => correoRef.current?.focus(), 0);
                }}
              >
                Solicitar otro enlace
              </MobileButton>
            </div>
          ) : (
            /* Formulario */
            <>
              <h1 className="text-[20px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
                Recuperar contraseña
              </h1>
              <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
                Escribe el correo con el que te registraste y te enviamos un enlace para crear una nueva contraseña.
              </p>

              <form className="mt-6 flex flex-col gap-4" onSubmit={enviar} noValidate>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="correo" className="text-[12px] font-semibold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4e5f80] dark:text-[#a8b5cc]">
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="5" width="18" height="14" rx="3" />
                        <path d="m4 7 8 6 8-6" />
                      </svg>
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
                      className="w-full rounded-2xl border border-[#e6edf6] bg-[#fafcfe] py-3.5 pl-10 pr-3.5 text-[14.5px] font-medium text-[#0a2342] outline-none transition placeholder:text-[#8b9bb0] focus:border-[#0a2342] focus:bg-white focus:ring-4 focus:ring-[#0a2342]/5 dark:border-[#1a3a5c] dark:bg-[#061529] dark:text-[#f6f8fb] dark:focus:border-[#4d94ff] dark:focus:bg-[#0a2342]"
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

                <MobileButton
                  type="submit"
                  disabled={enviando}
                  loading={enviando}
                  className="mt-2"
                >
                  {enviando ? TEXTOS_CARGANDO.enviando : "Enviar enlace de recuperación"}
                </MobileButton>
              </form>
            </>
          )}
        </MobileCard>
      </div>
    </MobileShell>
  );
}
