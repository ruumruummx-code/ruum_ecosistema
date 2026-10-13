"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Aviso,
  MobileShell,
  MobileCard,
  MobileButton,
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

function IconoCorreo({ className = "size-4 text-[#8b9bb0] dark:text-[#6b7a99]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function IconoCandado({ className = "size-4 text-[#8b9bb0] dark:text-[#6b7a99]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function IconoOjo() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s2.7-5.5 9.5-5.5 9.5 5.5 9.5 5.5-2.7 5.5-9.5 5.5-9.5-5.5-9.5-5.5Z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

function IconoOjoCerrado() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M9.9 5.9A9.4 9.4 0 0 1 12 5.5c4.8 0 7.9 4.2 9.5 6.5a17 17 0 0 1-2.3 2.9M14.5 14.5A4.6 4.6 0 0 1 12 15.5c-2.9 0-5.3-2.2-6.9-3.9" />
    </svg>
  );
}

function IconoEntrar() {
  return (
    <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="m10 17 5-5-5-5" />
      <path d="M15 12H3" />
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

const INPUT_BASE =
  "w-full rounded-2xl border bg-[#fafcfe] py-3.5 pl-10 pr-3.5 text-[14.5px] font-medium text-[#0a2342] outline-none transition placeholder:text-[#8b9bb0] focus:border-[#0a2342] focus:bg-white focus:ring-4 focus:ring-[#0a2342]/5 dark:border-[#1a3a5c] dark:bg-[#061529] dark:text-[#f6f8fb] dark:focus:border-[#4d94ff] dark:focus:bg-[#0a2342]";

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
      <MobileShell variant="compact" padding="md">
        <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
          <LogoRuum variante="simbolo" className="mx-auto" />
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
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
    <MobileShell variant="compact" padding="md" conFondoCanvas>
      {/* Contenedor principal de acceso */}
      <div className="flex flex-col pt-4 sm:pt-8">
        {/* Marca y bienvenida */}
        <div className="flex flex-col items-center pb-6 text-center">
          <div className="mx-auto" aria-label="Ruum Ruum">
            <LogoRuum variante="simbolo" className="mx-auto" />
          </div>
          <h1 className="mt-4 text-[24px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb] leading-tight sm:text-[26px]">
            Bienvenido de nuevo
          </h1>
          <p className="mt-1 text-[13.5px] font-medium text-[#4e5f80] dark:text-[#a8b5cc] leading-normal">
            Inicia sesión para gestionar tus traslados
          </p>
        </div>

        {/* Mensajes de aviso */}
        {aviso && (
          <div className="mb-4" role="status">
            <Aviso tono="success">{aviso}</Aviso>
          </div>
        )}
        {motivo === "email_confirmation" && (
          <div className="mb-4" role="status">
            <Aviso tono="atencion">
              Para solicitar tu primer traslado debes confirmar tu correo e iniciar sesión.
            </Aviso>
          </div>
        )}
        {motivo === "authentication_required" && (
          <div className="mb-4" role="status">
            <Aviso tono="atencion">
              Inicia sesión para solicitar un traslado. Si acabas de registrarte, confirma primero tu correo.
            </Aviso>
          </div>
        )}

        {/* Tarjeta de Formulario */}
        <MobileCard padding="md" elevated>
          <form onSubmit={iniciarSesion} noValidate className="flex flex-col gap-4">
            {/* Campo: Correo electrónico */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-email"
                className="text-[12px] font-semibold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]"
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
                  placeholder="tu@email.com"
                  className={[
                    INPUT_BASE,
                    mostrarErrorCorreo
                      ? "border-red-400 bg-red-50/40 focus:border-red-500"
                      : "border-[#e6edf6]",
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
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-[12px] font-semibold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]"
                >
                  Contraseña
                </label>
                <Link
                  href="/recuperar-password"
                  className="text-[12.5px] font-bold text-[#104ca0] hover:underline dark:text-[#6ba8ff]"
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
                      : "border-[#e6edf6]",
                  ].join(" ")}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8b9bb0] hover:text-[#0a2342] transition cursor-pointer dark:hover:text-[#f6f8fb]"
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
              <div role="alert" aria-live="assertive" className="mt-1">
                <Aviso tono="danger">{error}</Aviso>
              </div>
            )}

            {/* Botón Iniciar sesión (MobileButton 52px) */}
            <div className="mt-2">
              <MobileButton
                type="submit"
                variant="primary"
                loading={enviando}
                icon={<IconoEntrar />}
              >
                Iniciar sesión
              </MobileButton>
            </div>
          </form>
        </MobileCard>

        {/* Registro y bienvenida */}
        <div className="mt-6 flex flex-col gap-2 text-center text-[13.5px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">
          <p>
            ¿No tienes cuenta?
            <Link href="/registro" className="ml-1 font-bold text-[#0a2342] hover:underline dark:text-[#f6f8fb]">
              Regístrate gratis
            </Link>
          </p>
          <p className="text-[12.5px]">
            ¿Primera vez aquí?
            <Link href="/onboarding" className="ml-1 font-bold text-[#104ca0] hover:underline dark:text-[#6ba8ff]">
              Conoce cómo funciona Ruum
            </Link>
          </p>
        </div>

        {/* Garantías de seguridad */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[12px] font-semibold text-[#4e5f80] dark:text-[#a8b5cc]" aria-label="Garantías de seguridad">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-emerald-600 dark:text-emerald-400"><IconoEscudoCheck /></span>
            Datos protegidos
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-emerald-600 dark:text-emerald-400"><IconoCandado className="size-3.5" /></span>
            Cifrado TLS/SSL
          </span>
        </div>

        {/* Términos y privacidad */}
        <p className="mt-8 text-center text-[11.5px] font-medium leading-relaxed text-[#8b9bb0] dark:text-[#6b7a99]">
          Al continuar, aceptas nuestros{" "}
          <Link href="/legal/terminos" className="font-semibold text-[#104ca0] hover:underline dark:text-[#6ba8ff]">
            Términos y condiciones
          </Link>{" "}
          y{" "}
          <Link href="/legal/privacidad" className="font-semibold text-[#104ca0] hover:underline dark:text-[#6ba8ff]">
            Aviso de privacidad
          </Link>
        </p>
      </div>
    </MobileShell>
  );
}
