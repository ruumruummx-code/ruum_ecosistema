"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Aviso } from "@ruum/ui";
import { TEXTOS_CARGANDO } from "@ruum/shared/constants";
import { traducirErrorAuth } from "@ruum/shared/utils";
import { registrarEventoUx } from "../../lib/analytics";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import {
  botonAzul,
  botonContorno,
  CampoOscuro,
  LogoRuum,
  PantallaPublica,
} from "../experiencia-publica";

export default function PaginaRecuperarPassword() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* ACC-5 (auditoría): error del formulario vs error del campo. El primero se
     anuncia con role="alert" (assertive); el segundo se asocia al input. */
  const [errorCampo, setErrorCampo] = useState<string | null>(null);
  const correoRef = useRef<HTMLInputElement>(null);
  const ultimoEnvioRef = useRef<number>(0);

  useEffect(() => {
    registrarEventoUx("recuperacion_vista");
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "enlace_invalido") {
      setError("El enlace para restablecer tu contraseña no es válido o ya ha expirado. Por favor, solicita uno nuevo.");
      registrarEventoUx("recuperacion_error", { motivo: "enlace_invalido" });
    }
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const correo = email.trim();
    if (!correo) {
      setError("Escribe tu correo electrónico.");
      setErrorCampo("Escribe tu correo electrónico.");
      registrarEventoUx("recuperacion_error", { motivo: "email_vacio" });
      /* ACC-5 (auditoría): el foco no se movía al campo inválido. El patrón
         correcto ya existe en LoginCliente.tsx. */
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
    <PantallaPublica>
      <section className="flex min-h-screen flex-col px-5 py-10">
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center font-body text-sm text-route-action transition hover:text-text-primary"
        >
          ← Volver al inicio de sesión
        </Link>

        <LogoRuum className="mx-auto mt-8 text-center" />

        <div className="mt-14 rounded-card border border-border bg-surface px-5 py-7 shadow-[var(--ruum-shadow-3)]">
          {enviado ? (
            /* Estado de éxito */
            <div className="grid gap-4 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-control-soft">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="#1d9e75" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 className="font-display text-[22px] font-extrabold leading-tight text-text-primary">
                Correo enviado
              </h1>
              <p className="font-body text-sm leading-6 text-text-secondary">
                Revisa tu bandeja de entrada en{" "}
                <span className="font-semibold text-text-primary">{email.trim()}</span>, incluyendo
                la carpeta de spam. El enlace expira en 60 minutos.
              </p>
              <p className="font-body text-xs text-text-tertiary">
                Si no llega en unos minutos, puedes solicitar otro enlace. Espera 30 segundos entre intentos.
              </p>
              <button
                type="button"
                onClick={() => {
                    setEnviado(false);
                    setError(null);
                    setErrorCampo(null);
                    window.setTimeout(() => correoRef.current?.focus(), 0);
                  }}
                className={botonContorno}
              >
                Solicitar otro enlace
              </button>
            </div>
          ) : (
            /* Formulario */
            <>
              <h1 className="font-display text-[22px] font-extrabold leading-tight text-text-primary">
                Recuperar contraseña
              </h1>
              <p className="mt-2 font-body text-xs leading-5 text-text-secondary">
                Escribe el correo con el que te registraste y te enviamos un enlace para crear una nueva contraseña.
              </p>

              <form className="mt-7 grid gap-4" onSubmit={enviar} noValidate>
                <CampoOscuro
                  ref={correoRef}
                  etiqueta="Correo electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorCampo) setErrorCampo(null);
                  }}
                  error={errorCampo}
                  required
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                />

                {/* ACC-5 (auditoría): antes el wrapper usaba aria-live="polite",
                    que anulaba el role="alert" del Aviso (assertive) y el lector
                    no interrumpía al usuario para anunciar un error. */}
                {error && (
                  <div role="alert" aria-atomic="true">
                    <Aviso tono="danger">{error}</Aviso>
                  </div>
                )}

                <button type="submit" disabled={enviando} aria-busy={enviando} className={`${botonAzul} mt-2`}>
                  {enviando ? TEXTOS_CARGANDO.enviando : "Enviar enlace de recuperación"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </PantallaPublica>
  );
}
