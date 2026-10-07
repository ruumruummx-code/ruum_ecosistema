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
  /** Mensaje de éxito a mostrar (p. ej. tras restablecer la contraseña). */
  aviso?: string | null;
}

export function LoginCliente({ motivo, siguiente, aviso }: LoginClienteProps) {
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
      ? "Introduce un correo válido, como correo@ejemplo.com. El acceso está disponible con correo electrónico."
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
          <LoginMarca />
          <h1 className="mt-12 font-display text-2xl font-extrabold">Accede a tu cuenta</h1>
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
      <section className="login-usuario flex min-h-screen flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-9 sm:py-10">
        <LoginMarca />
        <header className="mt-6 text-center">
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-4xl">Ruum Ruum</h1>
          <p className="mt-1.5 font-display text-lg font-semibold text-text-secondary sm:text-xl">Tu traslado, en orden.</p>
          <p className="mt-4 font-body text-sm leading-6 text-text-secondary">Seguridad, evidencia y trazabilidad en cada viaje.</p>
        </header>

        {aviso && (
          <div className="mt-5" role="status">
            <Aviso tono="success">{aviso}</Aviso>
          </div>
        )}
        {motivo === "email_confirmation" && (
          <div className="mt-5" role="status">
            <Aviso tono="atencion">
              Para solicitar tu primer traslado debes confirmar tu correo e iniciar sesión.
            </Aviso>
          </div>
        )}
        {motivo === "authentication_required" && (
          <div className="mt-5" role="status">
            <Aviso tono="atencion">
              Inicia sesión para solicitar un traslado. Si acabas de registrarte, confirma primero tu correo.
            </Aviso>
          </div>
        )}

        <div className="login-usuario__card mt-8 rounded-[24px] border border-border bg-surface px-5 py-6 shadow-[0_12px_32px_rgba(22,119,255,0.12)] sm:px-7">
          <h2 className="sr-only">Accede a tu cuenta</h2>
          <form className="grid gap-5" onSubmit={iniciarSesion} noValidate>
            <div className="relative">
              <Field
                ref={correoRef}
                id="login-email"
                name="email"
                etiqueta="Correo electrónico"
                etiquetaClassName="leading-5"
                type="text"
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
                placeholder="tu@correo.com"
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
              etiquetaClassName="text-base font-medium"
              type="password"
              passwordToggleClassName="text-text-secondary hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-focus"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              onBlur={() => setTocados((actual) => ({ ...actual, password: true }))}
              error={tocados.password ? errorPassword : undefined}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />

            <div className="flex justify-end">
              <Link
                href="/recuperar-password"
                className="font-body text-sm font-medium text-route-action underline underline-offset-4 hover:text-text-primary"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && (
              <div role="alert" aria-live="assertive" aria-atomic="true">
                <Aviso tono="danger">{error}</Aviso>
              </div>
            )}

            <button type="submit" disabled={enviando} aria-busy={enviando} className={`${botonAzul} login-usuario__submit mt-1 min-h-[60px] rounded-2xl text-lg font-semibold text-white`}>
              {enviando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <div className="login-usuario__divider mt-5 flex items-center gap-4 font-body text-sm font-semibold text-text-secondary" aria-hidden="true"><span />o<span /></div>
        <Link href="/registro" className={`${botonContorno} login-usuario__register mt-4 min-h-[56px] rounded-2xl border-2 text-base font-bold`}>
          Registrarme
        </Link>
        <div className="login-usuario__benefits mt-auto pt-10">
          <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-[var(--ruum-teal)] bg-[color-mix(in_srgb,var(--ruum-teal)_12%,white)] px-3 py-3 font-body text-[11px] font-medium text-text-primary sm:text-xs">
            <li className="inline-flex items-center gap-1"><CheckIcon />Conductor certificado</li>
            <li className="inline-flex items-center gap-1"><CheckIcon />Evidencia en cada etapa</li>
            <li className="inline-flex items-center gap-1"><CheckIcon />Soporte humano</li>
          </ul>
          <p className="mt-4 text-center font-body text-xs leading-5 text-text-secondary">
            Al continuar aceptas <Link href="/legal/terminos" className="underline underline-offset-2 hover:text-text-primary">Términos</Link> y <Link href="/legal/privacidad" className="underline underline-offset-2 hover:text-text-primary">Aviso de Privacidad</Link>.
          </p>
          <nav aria-label="Ayuda" className="mt-2 flex justify-center font-body text-xs text-text-secondary">
            <Link href="/soporte" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-text-primary">Soporte</Link>
          </nav>
        </div>
      </section>
    </PantallaPublica>
  );
}

function LoginMarca() {
  return (
    <div className="login-usuario__brand" aria-label="Ruum Ruum">
      <LogoRuum variante="simbolo" className="mx-auto" />
    </div>
  );
}

function CheckIcon() {
  return <svg className="size-4 shrink-0 text-[var(--ruum-teal-deep)]" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" /><path d="m6.5 10 2.3 2.3 4.8-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
