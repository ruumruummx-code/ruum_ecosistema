"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Aviso, Field } from "@ruum/ui";
import { traducirErrorAuth } from "@ruum/shared/utils";
import { normalizarCorreoRegistro } from "../../lib/registro-usuario";
import { registrarEventoUx } from "../../lib/analytics";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { botonAzul, botonContorno, LogoRuum, PantallaPublica } from "../experiencia-publica";

interface LoginClienteProps {
  motivo: string | null;
  siguiente: string;
}

export function LoginCliente({ motivo, siguiente }: LoginClienteProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tocados, setTocados] = useState({ email: false, password: false });
  const correoRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const correoNormalizado = normalizarCorreoRegistro(email);
  const errorCorreo = !correoNormalizado
    ? "Introduce tu correo electrónico."
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)
      ? "Introduce un correo válido, como correo@ejemplo.com."
      : undefined;
  const errorPassword = password.length === 0 ? "Introduce tu contraseña." : undefined;

  useEffect(() => {
    registrarEventoUx("login_visto", {
      reason: motivo,
      tiene_next: siguiente !== "/"
    });
  }, [motivo, siguiente]);

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setTocados({ email: true, password: true });
    if (errorCorreo || errorPassword) {
      (errorCorreo ? correoRef : passwordRef).current?.focus();
      return;
    }
    setEnviando(true);
    setError(null);
    registrarEventoUx("login_enviado", { reason: motivo });

    try {
      const cliente = crearClienteNavegador();
      const emailNormalizado = normalizarCorreoRegistro(email);
      const { error: errorAuth } = await cliente.auth.signInWithPassword({ email: emailNormalizado, password });
      if (errorAuth) throw errorAuth;
      registrarEventoUx("login_exitoso", {
        reason: motivo,
        destino_protegido: siguiente !== "/"
      });
      router.push(siguiente);
      router.refresh();
    } catch (err) {
      setError(traducirErrorAuth(err));
      registrarEventoUx("login_error", { reason: motivo });
    } finally {
      setEnviando(false);
    }
  }

  if (!tieneSupabaseConfigurado()) {
    return (
      <PantallaPublica>
        <section className="flex min-h-screen flex-col px-5 py-12 text-center">
          <LogoRuum className="mx-auto" />
          <h1 className="mt-16 font-display text-2xl font-extrabold">Accede a tu cuenta</h1>
          <div className="mt-6">
            <Aviso tono="danger">
              Supabase no está configurado todavía. El inicio de sesión no está disponible en este entorno.
            </Aviso>
          </div>
        </section>
      </PantallaPublica>
    );
  }

  return (
    <PantallaPublica>
      <section className="flex min-h-screen flex-col px-5 py-8 sm:py-10">
        <LogoRuum className="mx-auto text-center" />

        <Link href="/" className="mt-5 inline-flex min-h-11 items-center self-start rounded font-body text-xs text-text-secondary transition hover:text-text-primary focus-visible:outline-focus">
          ← Atrás
        </Link>

        <div className="mt-2 rounded-card border border-border bg-surface px-5 py-7 shadow-[var(--ruum-shadow-3)]">
          <h1 className="font-display text-2xl font-extrabold leading-tight text-text-primary">Accede a tu cuenta</h1>
          <p className="mt-2 font-body text-sm leading-6 text-text-secondary">
            Consulta tus traslados y solicita nuevos servicios.
          </p>
          {motivo === "email_confirmation" && (
            <div className="mt-4" role="status">
              <Aviso tono="atencion">
                Para solicitar tu primer traslado debes confirmar tu correo e iniciar sesión.
              </Aviso>
            </div>
          )}
          {motivo === "authentication_required" && (
            <div className="mt-4" role="status">
              <Aviso tono="atencion">
                Inicia sesión para solicitar un traslado. Si acabas de registrarte, confirma primero tu correo.
              </Aviso>
            </div>
          )}

          <form className="mt-7 grid gap-4" onSubmit={iniciarSesion} noValidate>
            <div className="relative">
              <Field
                ref={correoRef}
                id="login-email"
                name="email"
                etiqueta="Correo electrónico"
                etiquetaClassName="leading-5"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                onBlur={() => setTocados((actual) => ({ ...actual, email: true }))}
                error={tocados.email ? errorCorreo : undefined}
                required
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="email"
                className="pl-11"
                placeholder="correo@ejemplo.com"
              />
              <svg className="pointer-events-none absolute left-3.5 top-[41px] size-5 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </div>
            <Field
              ref={passwordRef}
              id="login-password"
              name="password"
              etiqueta="Contraseña"
              type="password"
              passwordToggleClassName="text-text-secondary hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-focus"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              onBlur={() => setTocados((actual) => ({ ...actual, password: true }))}
              error={tocados.password ? errorPassword : undefined}
              required
              autoComplete="current-password"
              placeholder="Tu contraseña"
            />

            <div className="flex justify-end">
              <Link
                href="/recuperar-password"
                className="font-body text-xs text-route-action underline-offset-2 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && (
              <div role="alert" aria-live="assertive" aria-atomic="true">
                <Aviso tono="danger">{error}</Aviso>
              </div>
            )}

            <button type="submit" disabled={enviando} className={`${botonAzul} mt-2`}>
              {enviando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <Link href="/registro" className={`${botonContorno} mt-4`}>
          Registrarme
        </Link>
        <div className="mt-7 text-center font-body text-sm leading-6 text-text-secondary">
          <p className="font-semibold text-text-primary">Gestiona tus traslados en tiempo real.</p>
          <p>Seguimiento de vehículos y solicitudes.</p>
        </div>
        <nav aria-label="Información y ayuda" className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1 border-t border-border pt-3 font-body text-xs text-text-secondary">
          <Link href="/legal/privacidad" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-text-primary">Política de privacidad</Link>
          <Link href="/legal/terminos" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-text-primary">Términos de uso</Link>
          <Link href="/soporte" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-text-primary">Soporte</Link>
        </nav>
      </section>
    </PantallaPublica>
  );
}
