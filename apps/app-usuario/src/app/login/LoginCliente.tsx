"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Aviso,
  MobileShell,
  MobileCard,
} from "@ruum/ui";
import { traducirErrorAuth } from "@ruum/shared/utils";
import { normalizarCorreoRegistro } from "../../lib/registro-usuario";
import { registrarEventoUx } from "../../lib/analytics";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { LogoRuum } from "../experiencia-publica";

interface LoginClienteProps {
  motivo: string | null;
  siguiente: string;
  /** Mensaje de éxito a mostrar (p. ej. tras restablecer la contraseña). */
  aviso?: string | null;
}

function IconoCorreo({ className = "size-4.5 text-[#566889] dark:text-[#8293b0]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IconoCandado({ className = "size-4.5 text-[#566889] dark:text-[#8293b0]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function IconoOjo() {
  return (
    <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s2.7-5.5 9.5-5.5 9.5 5.5 9.5 5.5-2.7 5.5-9.5 5.5-9.5-5.5Z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

function IconoOjoCerrado() {
  return (
    <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M9.9 5.9A9.4 9.4 0 0 1 12 5.5c4.8 0 7.9 4.2 9.5 6.5a17 17 0 0 1-2.3 2.9M14.5 14.5A4.6 4.6 0 0 1 12 15.5c-2.9 0-5.3-2.2-6.9-3.9" />
    </svg>
  );
}

function IconoFlechaDerecha({ className = "size-4.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function IconoEscudoCheck({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconoUsuarioSeguro({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m16 11 2 2 4-4" />
    </svg>
  );
}

const INPUT_BASE =
  "w-full rounded-2xl border bg-[#f4f7fc] py-3 pl-10 pr-3.5 text-[15px] font-medium text-[#0a2342] outline-none transition placeholder:text-[#6b7c96] focus:border-[#0066FF] focus:bg-white focus:ring-4 focus:ring-[#0066FF]/10 dark:border-[#1a3a5c] dark:bg-[#07192f] dark:text-[#f6f8fb] dark:placeholder:text-[#8293b0] dark:focus:border-[#4d94ff] dark:focus:bg-[#0a2342]";

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
      tiene_next: siguiente !== "/",
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
      const { error: errorAuth } = await cliente.auth.signInWithPassword({
        email: emailNormalizado,
        password,
      });
      if (errorAuth) throw errorAuth;
      registrarEventoUx("login_exitoso", {
        reason: motivo,
        destino_protegido: siguiente !== "/",
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
      <MobileShell
        as="main"
        variant="compact"
        padding="md"
        className="login-usuario login-container h-dvh max-h-dvh overflow-hidden !pb-0"
        style={{ height: "100dvh", maxHeight: "100dvh", overflow: "hidden" }}
      >
        <div className="flex min-h-[80dvh] flex-col items-center justify-center text-center">
          <div className="login-usuario__brand login-logo mx-auto h-9 w-auto md:h-16 flex items-center justify-center" aria-label="Ruum Ruum">
            <Image
              src="/imagenes/ruum-logo-simbolo.png"
              alt="Ruum Ruum"
              width={48}
              height={48}
              priority
              className="h-full w-auto object-contain"
            />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
            Accede a tu cuenta
          </h1>
          <div className="mt-6 w-full max-w-sm">
            <Aviso tono="danger">
              Supabase no está configurado todavía. El inicio de sesión no está disponible en este entorno.
            </Aviso>
          </div>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell
      as="main"
      variant="compact"
      padding="none"
      conFondoCanvas
      className="login-usuario login-container relative h-dvh max-h-dvh overflow-hidden !pb-0 bg-[#f4f7fb] dark:bg-[#061529]"
      contentClassName="h-full justify-between sm:justify-center sm:gap-6 relative z-10"
      style={{ height: "100dvh", maxHeight: "100dvh", overflow: "hidden" }}
    >
      {/* Elemento gráfico decorativo superior (Ruta con pin) */}
      <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 select-none opacity-40 dark:opacity-20 sm:h-56 sm:w-56" aria-hidden="true">
        <svg viewBox="0 0 200 200" fill="none" className="h-full w-full">
          <path d="M20 180 C80 140, 110 90, 150 40" stroke="url(#routeGrad)" strokeWidth="18" strokeLinecap="round" strokeDasharray="1 28" />
          <path d="M20 180 C80 140, 110 90, 150 40" stroke="#00D1D1" strokeWidth="3" strokeDasharray="6 8" />
          <circle cx="150" cy="40" r="16" fill="#0066FF" fillOpacity="0.15" />
          <circle cx="150" cy="40" r="10" fill="#0066FF" />
          <circle cx="150" cy="40" r="4" fill="#ffffff" />
          <defs>
            <linearGradient id="routeGrad" x1="20" y1="180" x2="150" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00D1D1" />
              <stop offset="1" stopColor="#0066FF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Contenedor principal de acceso con contención no-scroll */}
      <div className="mx-auto flex h-full w-full max-w-[440px] flex-col justify-between px-4 py-2.5 sm:justify-center sm:gap-5 sm:px-6 sm:py-6">
        {/* Marca oficial y eslogan integrado */}
        <div className="flex flex-col items-center pt-1 text-center sm:pt-2">
          <div
            className="login-usuario__brand login-logo mx-auto h-9 w-auto md:h-16 flex items-center justify-center"
            aria-label="Ruum Ruum"
          >
            <Image
              src="/imagenes/ruum-logo-simbolo.png"
              alt="Ruum Ruum"
              width={46}
              height={46}
              priority
              className="h-full w-auto object-contain"
            />
          </div>
          <span className="mt-1 font-display text-[21px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb] leading-none sm:text-[24px]">
            Ruum Ruum
          </span>
          <p className="mt-0.5 text-[12.5px] font-medium text-[#566889] dark:text-[#a8b5cc] sm:text-[13px]">
            Tu traslado, en orden.
          </p>
        </div>

        {/* Mensajes de aviso */}
        {aviso && (
          <div className="mb-1" role="status">
            <Aviso tono="success">{aviso}</Aviso>
          </div>
        )}
        {motivo === "email_confirmation" && (
          <div className="mb-1" role="status">
            <Aviso tono="atencion">
              Para solicitar tu primer traslado debes confirmar tu correo e iniciar sesión.
            </Aviso>
          </div>
        )}
        {motivo === "authentication_required" && (
          <div className="mb-1" role="status">
            <Aviso tono="atencion">
              Inicia sesión para solicitar un traslado. Si acabas de registrarte, confirma primero tu correo.
            </Aviso>
          </div>
        )}

        {/* Tarjeta de Formulario Principal */}
        <MobileCard padding="md" elevated className="border border-[#e2e8f0]/80 bg-white/95 shadow-[0_8px_30px_rgba(10,35,66,0.06)] backdrop-blur-sm dark:border-[#1a3a5c] dark:bg-[#0a2342]/95 sm:p-7">
          <div className="mb-3 text-center sm:mb-4">
            <h1 className="text-[20px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb] sm:text-[22px]">
              Inicia sesión
            </h1>
            <p className="mt-0.5 text-[12px] font-medium text-[#566889] dark:text-[#a8b5cc] sm:text-[12.5px]">
              Accede a tu cuenta para continuar
            </p>
          </div>

          <form onSubmit={iniciarSesion} noValidate className="flex flex-col gap-2.5 sm:gap-3.5">
            {/* Campo: Correo electrónico */}
            <div className="flex flex-col gap-1 sm:gap-1.5">
              <label
                htmlFor="login-email"
                className="text-[12px] font-semibold text-[#334155] dark:text-[#cbd5e1]"
              >
                Correo electrónico
              </label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                >
                  <IconoCorreo />
                </span>
                <input
                  ref={correoRef}
                  id="login-email"
                  name="email"
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  onBlur={() => setTocados((actual) => ({ ...actual, email: true }))}
                  aria-invalid={Boolean(mostrarErrorCorreo)}
                  aria-describedby={mostrarErrorCorreo ? "login-email-error" : undefined}
                  required
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="email"
                  placeholder="lomelinhectorm@gmail.com"
                  className={[
                    INPUT_BASE,
                    mostrarErrorCorreo
                      ? "border-red-400 bg-red-50/40 focus:border-red-500"
                      : "border-[#d8e2ee]",
                  ].join(" ")}
                />
              </div>
              {mostrarErrorCorreo && (
                <p id="login-email-error" role="alert" className="text-[12px] font-bold text-[#9a2637] dark:text-[#ff6b7a]">
                  {mostrarErrorCorreo}
                </p>
              )}
            </div>

            {/* Campo: Contraseña */}
            <div className="flex flex-col gap-1 sm:gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-[12px] font-semibold text-[#334155] dark:text-[#cbd5e1]"
                >
                  Contraseña
                </label>
                <Link
                  href="/recuperar-password"
                  className="text-[12px] font-bold text-[#0066FF] hover:underline dark:text-[#4d94ff] sm:text-[12.5px]"
                >
                  ¿La olvidaste?
                </Link>
              </div>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                >
                  <IconoCandado />
                </span>
                <input
                  ref={passwordRef}
                  id="login-password"
                  name="password"
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  onBlur={() => setTocados((actual) => ({ ...actual, password: true }))}
                  aria-invalid={Boolean(mostrarErrorPassword)}
                  aria-describedby={mostrarErrorPassword ? "login-password-error" : undefined}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={[
                    INPUT_BASE,
                    "pr-11",
                    mostrarErrorPassword
                      ? "border-red-400 bg-red-50/40 focus:border-red-500"
                      : "border-[#d8e2ee]",
                  ].join(" ")}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center text-[#566889] hover:text-[#0a2342] transition cursor-pointer dark:hover:text-[#f6f8fb]"
                >
                  {passwordVisible ? <IconoOjoCerrado /> : <IconoOjo />}
                </button>
              </div>
              {mostrarErrorPassword && (
                <p id="login-password-error" role="alert" className="text-[12px] font-bold text-[#9a2637] dark:text-[#ff6b7a]">
                  {mostrarErrorPassword}
                </p>
              )}
            </div>

            {/* Error general */}
            {error && (
              <div role="alert" aria-live="assertive" className="mt-0.5">
                <Aviso tono="danger">{error}</Aviso>
              </div>
            )}

            {/* Botón Iniciar sesión (CTA Principal con flecha indicadora y esquinas 16px) */}
            <button
              type="submit"
              disabled={enviando}
              className="mt-1 flex h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0a2342] px-5 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#103460] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0066FF] dark:hover:bg-[#1a75ff] sm:h-[52px]"
            >
              {enviando ? (
                <span>Iniciando sesión…</span>
              ) : (
                <>
                  <span>Iniciar sesión</span>
                  <IconoFlechaDerecha />
                </>
              )}
            </button>
          </form>

          {/* Separador sutil */}
          <div className="relative my-2.5 flex items-center justify-center sm:my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e2e8f0] dark:border-[#1a3a5c]" />
            </div>
            <div className="relative flex justify-center bg-white px-2.5 dark:bg-[#0a2342]">
              <span className="text-[11px] font-semibold text-[#8b9bb0]">o</span>
            </div>
          </div>

          {/* Enlaces de registro y onboarding */}
          <div className="flex flex-col gap-1 text-center text-[13px] font-medium text-[#4e5f80] dark:text-[#a8b5cc] sm:gap-1.5 sm:text-[13.5px]">
            <p>
              ¿No tienes cuenta?{" "}
              <Link href="/registro" className="font-bold text-[#0066FF] hover:underline dark:text-[#4d94ff]">
                Regístrate gratis
              </Link>
            </p>
            <p className="text-[12px] sm:text-[12.5px]">
              ¿Primera vez aquí?{" "}
              <Link href="/onboarding" className="font-bold text-[#0066FF] hover:underline dark:text-[#4d94ff]">
                Conoce cómo funciona Ruum
              </Link>
            </p>
          </div>
        </MobileCard>

        {/* Footer de Garantías de seguridad (equilibrado, sin saturar) */}
        <div
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-[#566889] dark:text-[#a8b5cc] sm:gap-x-5 sm:text-[11.5px]"
          aria-label="Garantías de seguridad"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="text-emerald-600 dark:text-emerald-400"><IconoEscudoCheck /></span>
            Datos protegidos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-[#008B8B] dark:text-[#00D1D1]"><IconoCandado className="size-3.5 text-[#008B8B] dark:text-[#00D1D1]" /></span>
            Cifrado TLS/SSL
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-[#0066FF] dark:text-[#4d94ff]"><IconoUsuarioSeguro /></span>
            Tu información segura
          </span>
        </div>

        {/* Términos y privacidad */}
        <p className="pb-0.5 text-center text-[10.5px] font-medium leading-relaxed text-[#8b9bb0] dark:text-[#6b7a99] sm:text-[11px]">
          Al continuar, aceptas nuestros{" "}
          <Link href="/legal/terminos" className="font-semibold text-[#0066FF] hover:underline dark:text-[#4d94ff]">
            Términos y condiciones
          </Link>{" "}
          y{" "}
          <Link href="/legal/privacidad" className="font-semibold text-[#0066FF] hover:underline dark:text-[#4d94ff]">
            Aviso de privacidad
          </Link>
        </p>
      </div>
    </MobileShell>
  );
}