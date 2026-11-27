"use client";
import { Button as BaseButton } from "@ruum/ui/base";
import { ConductorScreen, ConductorPageHeader } from "../components/ConductorScreen";

import { useEffect, useRef, useState } from "react";
import { Field, Aviso } from "@ruum/ui";
import { ConductorButton as Button } from "@/components/v2/ConductorUI";
import { tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { traducirErrorAuth } from "@ruum/shared/utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PaginaRecuperarPasswordConductor() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segundosEspera, setSegundosEspera] = useState(0);
  const ultimoEnvioRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "enlace_invalido") {
        setError("El enlace para restablecer tu contraseña no es válido o ya ha expirado. Por favor, solicita uno nuevo.");
      }
    }
  }, []);

  const hayEspera = segundosEspera > 0;
  useEffect(() => {
    if (!hayEspera) return;
    const timer = window.setInterval(() => {
      setSegundosEspera((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hayEspera]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    const correo = email.trim().toLowerCase();
    if (!correo || !EMAIL_REGEX.test(correo)) {
      setError("Escribe un correo electrónico válido, como tu@correo.com.");
      return;
    }
    if (Date.now() - ultimoEnvioRef.current < 30_000) {
      setError("Ya enviamos un enlace hace unos segundos. Espera un momento antes de solicitar otro.");
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      if (!tieneSupabaseConfigurado()) throw new Error("Supabase no está configurado.");
      const res = await fetch("/api/recovery/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: correo }),
        signal: AbortSignal.timeout(12_000),
      });
      const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(cuerpo?.error || "No pudimos enviar el correo. Intenta de nuevo.");
      }
      ultimoEnvioRef.current = Date.now();
      setSegundosEspera(30);
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : traducirErrorAuth(err, "No pudimos enviar el correo. Intenta de nuevo."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ConductorScreen variant="access" label="Recuperar acceso" header={<ConductorPageHeader title="Recuperar contraseña" backHref="/login" backLabel="Volver al inicio de sesión" />} footer={!enviado && <Button type="submit" form="conductor-recovery" loading={enviando} className="w-full">Enviar enlace</Button>}>
      <section aria-label="Solicitud de enlace de recuperación">
         <p className="mt-1 font-body text-sm leading-6 text-ui-fg-muted">
           Escribe el correo con el que te registraste y te enviamos un enlace seguro.
         </p>

        {enviado ? (
          <div className="mt-6 grid gap-4 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-ui-success-soft text-ui-success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <p className="font-body text-sm leading-6 text-ui-fg-muted/80">
              Correo enviado a <strong>{email}</strong>. Revisa tu bandeja incluyendo spam. El enlace expira en 60 minutos.
            </p>
            <p className="font-body text-xs leading-5 text-ui-fg-muted/70">
              Ábrelo desde este mismo teléfono y navegador — por seguridad, no funciona si lo abres en otro dispositivo.
            </p>
            <BaseButton variant="ghost"
              type="button"
              disabled={segundosEspera > 0 || enviando}
              onClick={() => { setEnviado(false); setError(null); }}
              className="font-body text-sm font-semibold text-ui-brand underline-offset-2 hover:underline disabled:opacity-50"
            >
              {segundosEspera > 0 ? `Solicitar otro enlace (${segundosEspera}s)` : "Solicitar otro enlace"}
            </BaseButton>
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
