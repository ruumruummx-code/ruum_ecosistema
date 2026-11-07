"use client";
import { ConductorScreen, ConductorPageHeader } from "../components/ConductorScreen";

import { useEffect, useState } from "react";
import { Button, Field, Aviso } from "@ruum/ui";
import { crearClienteNavegador, tieneSupabaseConfigurado, obtenerOriginApp } from "../../lib/supabase-browser";
import { traducirErrorAuth } from "@ruum/shared/utils";

export default function PaginaRecuperarPasswordConductor() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "enlace_invalido") {
        setError("El enlace para restablecer tu contraseña no es válido o ya ha expirado. Por favor, solicita uno nuevo.");
      }
    }
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Escribe tu correo electrónico."); return; }
    setEnviando(true);
    setError(null);
    try {
      if (!tieneSupabaseConfigurado()) throw new Error("Supabase no está configurado.");
      const cliente = crearClienteNavegador();
      const { error: errorAuth } = await cliente.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${obtenerOriginApp()}/auth/callback?type=recovery&next=/nueva-password` }
      );
      if (errorAuth) throw errorAuth;
      setEnviado(true);
    } catch (err) {
      setError(traducirErrorAuth(err, "No pudimos enviar el correo. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ConductorScreen variant="access" label="Recuperar acceso" header={<ConductorPageHeader title="Recuperar contraseña" backHref="/login" backLabel="Volver al inicio de sesión" />} footer={!enviado && <Button type="submit" form="conductor-recovery" loading={enviando} className="w-full">Enviar enlace</Button>}>
      <section aria-label="Solicitud de enlace de recuperación">
         <p className="mt-1 font-body text-sm leading-6 text-text-secondary">
           Escribe el correo con el que te registraste y te enviamos un enlace seguro.
         </p>

        {enviado ? (
          <div className="mt-6 grid gap-4 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-control-soft text-success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <p className="font-body text-sm leading-6 text-text-tertiary/80">
              Correo enviado a <strong>{email}</strong>. Revisa tu bandeja incluyendo spam. El enlace expira en 60 minutos.
            </p>
            <p className="font-body text-xs leading-5 text-text-tertiary/70">
              Ábrelo desde este mismo teléfono y navegador — por seguridad, no funciona si lo abres en otro dispositivo.
            </p>
            <button
              type="button"
              onClick={() => { setEnviado(false); setEmail(""); }}
              className="font-body text-sm font-semibold text-route-action underline-offset-2 hover:underline"
            >
              Solicitar otro enlace
            </button>
          </div>
        ) : (
          <form id="conductor-recovery" className="mt-7 grid gap-4" onSubmit={enviar}>
            <Field
              etiqueta="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            {error && (
              <output aria-live="polite" aria-atomic="true">
                <Aviso tono="danger">{error}</Aviso>
              </output>
            )}
          </form>
        )}

      </section>
    </ConductorScreen>
  );
}
