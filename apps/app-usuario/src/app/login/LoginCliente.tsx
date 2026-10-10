"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Aviso } from "@ruum/ui";
import { traducirErrorAuth } from "@ruum/shared/utils";
import { normalizarCorreoRegistro } from "../../lib/registro-usuario";
import { registrarEventoUx } from "../../lib/analytics";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { LogoRuum, PantallaPublica } from "../experiencia-publica";

interface LoginClienteProps {
  motivo: string | null;
  siguiente: string;
  /** Mensaje de éxito a mostrar (p. ej. tras restablecer la contraseña). */
  aviso?: string | null;
}

function IconoCorreo({ className = "size-[17px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IconoCandado({ className = "size-[17px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function IconoOjo() {
  return (
    <svg className="size-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s2.7-5.5 9.5-5.5 9.5 5.5 9.5 5.5-2.7 5.5-9.5 5.5-9.5-5.5-9.5-5.5Z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

function IconoOjoCerrado() {
  return (
    <svg className="size-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M9.9 5.9A9.4 9.4 0 0 1 12 5.5c4.8 0 7.9 4.2 9.5 6.5a17 17 0 0 1-2.3 2.9M14.5 14.5A4.6 4.6 0 0 1 12 15.5c-2.9 0-5.3-2.2-6.9-3.9" />
    </svg>
  );
}

function IconoEntrar() {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="m10 17 5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  );
}

function IconoEscudoCheck({ className = "size-[13px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

const INPUT_BASE =
  "w-full rounded-2xl border-[1.5px] bg-[#fafcfe] py-4 text-[15px] font-medium text-[#0b1e33] outline-none transition-all placeholder:font-medium placeholder:text-[#b0bfd0] focus:border-[#0b1e33] focus:bg-white focus:shadow-[0_0_0_3px_rgba(11,30,51,0.06)]";

export function LoginCliente({ motivo, siguiente, aviso }: LoginClienteProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
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
  const mostrarErrorCorreo = tocados.email ? errorCorreo : undefined;
  const mostrarErrorPassword = tocados.password ? errorPassword : undefined;

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
          <div className="mx-auto" aria-label="Ruum Ruum">
            <LogoRuum variante="simbolo" className="mx-auto" />
          </div>
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
      <section className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-8">
        {/* Marca */}
        <div className="flex flex-col items-center pb-9 pt-8">
          <div className="mx-auto" aria-label="Ruum Ruum">
            <LogoRuum variante="simbolo" className="mx-auto" />
          </div>
          <p className="mt-5 text-[26px] font-extrabold leading-tight tracking-tight text-[#0b1e33]">
            Ruum Ruum
          </p>
          <p className="mt-1.5 text-center text-[14px] font-medium leading-snug text-[#6b7c94]">
            Mueve tu auto sin soltar el control
          </p>
        </div>

        {/* Bienvenida */}
        <h1 className="mb-1.5 text-[24px] font-extrabold tracking-tight text-[#0b1e33]">
          Bienvenido de nuevo
        </h1>
        <p className="mb-8 text-[14px] font-medium text-[#6b7c94]">
          Inicia sesión para gestionar tus traslados
        </p>

        {aviso && (
          <div className="mb-5" role="status">
            <Aviso tono="success">{aviso}</Aviso>
          </div>
        )}
        {motivo === "email_confirmation" && (
          <div className="mb-5" role="status">
            <Aviso tono="atencion">
              Para solicitar tu primer traslado debes confirmar tu correo e iniciar sesión.
            </Aviso>
          </div>
        )}
        {motivo === "authentication_required" && (
          <div className="mb-5" role="status">
            <Aviso tono="atencion">
              Inicia sesión para solicitar un traslado. Si acabas de registrarte, confirma primero tu correo.
            </Aviso>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={iniciarSesion} noValidate>
          <div className="mb-[18px]">
            <label htmlFor="login-email" className="mb-[7px] block text-[12px] font-bold uppercase tracking-[0.2px] text-[#6b7c94]">
              Correo electrónico
            </label>
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-1/2 text-[#b0bfd0]">
                <IconoCorreo />
              </span>
              <input
                ref={correoRef}
                id="login-email"
                name="email"
                type="text"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                onBlur={() => setTocados((actual) => ({ ...actual, email: true }))}
                aria-invalid={Boolean(mostrarErrorCorreo)}
                aria-describedby={mostrarErrorCorreo ? "login-email-error" : undefined}
                required
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="email"
                placeholder="tu@email.com"
                className={`${INPUT_BASE} border-[#e6edf6] pl-[52px] pr-[18px] ${mostrarErrorCorreo ? "border-[#b33c3c] shadow-[0_0_0_3px_rgba(179,60,60,0.1)]" : ""}`}
              />
            </div>
            {mostrarErrorCorreo && (
              <p id="login-email-error" className="mt-1.5 text-[13px] font-medium text-[#b33c3c]">
                {mostrarErrorCorreo}
              </p>
            )}
          </div>

          <div className="mb-[18px]">
            <label htmlFor="login-password" className="mb-[7px] block text-[12px] font-bold uppercase tracking-[0.2px] text-[#6b7c94]">
              Contraseña
            </label>
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-1/2 text-[#b0bfd0]">
                <IconoCandado />
              </span>
              <input
                ref={passwordRef}
                id="login-password"
                name="password"
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                onBlur={() => setTocados((actual) => ({ ...actual, password: true }))}
                aria-invalid={Boolean(mostrarErrorPassword)}
                aria-describedby={mostrarErrorPassword ? "login-password-error" : undefined}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={`${INPUT_BASE} border-[#e6edf6] pl-[52px] pr-[52px] ${mostrarErrorPassword ? "border-[#b33c3c] shadow-[0_0_0_3px_rgba(179,60,60,0.1)]" : ""}`}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute right-[10px] top-1/2 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-xl text-[#b0bfd0] transition-colors hover:text-[#2e5a88] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-[#1677ff]"
              >
                {passwordVisible ? <IconoOjoCerrado /> : <IconoOjo />}
              </button>
            </div>
            {mostrarErrorPassword && (
              <p id="login-password-error" className="mt-1.5 text-[13px] font-medium text-[#b33c3c]">
                {mostrarErrorPassword}
              </p>
            )}
          </div>

          <Link
            href="/recuperar-password"
            className="mb-7 -mt-2 block min-h-11 text-right text-[13px] font-semibold leading-[44px] text-[#2e5a88]"
          >
            ¿Olvidaste tu contraseña?
          </Link>

          {error && (
            <div className="mb-5" role="alert" aria-live="assertive" aria-atomic="true">
              <Aviso tono="danger">{error}</Aviso>
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            aria-busy={enviando}
            className="mb-5 flex min-h-[60px] w-full items-center justify-center gap-2.5 rounded-[18px] bg-[#0b1e33] px-[22px] py-[19px] text-[16.5px] font-bold tracking-tight text-[#fff] shadow-[0_14px_28px_-10px_rgba(11,30,51,0.45)] transition-all active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            <IconoEntrar />
            {enviando ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>

        {/* Registro */}
        <p className="py-2 text-center text-[14px] font-medium text-[#6b7c94]">
          ¿No tienes cuenta?
          <Link href="/registro" className="ml-1 font-bold text-[#0b1e33] hover:underline">
            Regístrate gratis
          </Link>
        </p>

        {/* Confianza */}
        <div className="mt-3 flex items-center justify-center gap-5 px-0 py-5" aria-label="Garantías de seguridad">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8b9bb0]">
            <span className="text-[#2e9e6b]"><IconoEscudoCheck /></span>
            Datos seguros
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8b9bb0]">
            <span className="text-[#2e9e6b]"><IconoCandado className="size-[13px]" /></span>
            Cifrado SSL
          </span>
        </div>

        {/* Términos */}
        <p className="mt-auto px-0 pb-2 pt-5 text-center text-[11.5px] font-medium leading-relaxed text-[#a6b7cb]">
          Al continuar, aceptas nuestros{" "}
          <Link href="/legal/terminos" className="font-semibold text-[#2e5a88] hover:underline">
            Términos y condiciones
          </Link>{" "}
          y{" "}
          <Link href="/legal/privacidad" className="font-semibold text-[#2e5a88] hover:underline">
            Aviso de privacidad
          </Link>
        </p>
      </section>
    </PantallaPublica>
  );
}
