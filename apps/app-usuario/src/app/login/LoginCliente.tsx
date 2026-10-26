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

function IconoRayo({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconoUsuarioConfiable({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m16 11 2 2 4-4" />
    </svg>
  );
}

function IconoChevronAbajo({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IlustracionHeroLogin({ className = "w-full max-w-lg h-auto" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} aria-hidden="true">
      <svg viewBox="0 0 540 380" fill="none" className="w-full h-auto drop-shadow-sm">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pinGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="40%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#003599" />
          </linearGradient>
          <linearGradient id="roadGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0c2340" />
            <stop offset="60%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="bldgGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="bldgGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="carBodyGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Nubes y fondo de skyline */}
        <path d="M140 240 L140 180 L180 180 L180 240 Z" fill="url(#bldgGrad2)" />
        <path d="M190 250 L190 140 L240 140 L240 250 Z" fill="url(#bldgGrad1)" />
        <rect x="250" y="110" width="55" height="150" rx="4" fill="url(#bldgGrad2)" />
        <rect x="315" y="90" width="60" height="175" rx="4" fill="url(#bldgGrad1)" />
        <rect x="385" y="130" width="45" height="135" rx="3" fill="url(#bldgGrad2)" />
        <rect x="440" y="160" width="55" height="105" rx="3" fill="url(#bldgGrad1)" />

        {/* Ventanas sutiles de los edificios */}
        <line x1="260" y1="125" x2="295" y2="125" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="260" y1="140" x2="295" y2="140" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="325" y1="105" x2="365" y2="105" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1="325" y1="120" x2="365" y2="120" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1="325" y1="135" x2="365" y2="135" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray="4 3" />

        {/* Canopias verdes / vegetación urbana */}
        <circle cx="160" cy="245" r="28" fill="#16a34a" fillOpacity="0.85" />
        <circle cx="210" cy="248" r="24" fill="#22c55e" fillOpacity="0.9" />
        <circle cx="430" cy="255" r="32" fill="#15803d" fillOpacity="0.85" />
        <circle cx="480" cy="250" r="26" fill="#22c55e" fillOpacity="0.9" />
        <circle cx="510" cy="260" r="30" fill="#16a34a" fillOpacity="0.85" />

        {/* Carretera curvada hacia la ciudad */}
        <path
          d="M 20 350 Q 180 230 360 260 T 540 280 L 540 370 L 20 370 Z"
          fill="#e2e8f0"
        />
        <path
          d="M 30 345 Q 185 235 360 262 T 540 282 L 540 355 Q 360 335 120 370 Z"
          fill="url(#roadGrad)"
        />
        {/* Bordes blancos de la carretera */}
        <path
          d="M 30 345 Q 185 235 360 262 T 540 282"
          stroke="#ffffff"
          strokeWidth="3.5"
          fill="none"
        />
        <path
          d="M 120 370 Q 360 335 540 355"
          stroke="#ffffff"
          strokeWidth="3"
          strokeOpacity="0.7"
          fill="none"
        />

        {/* Línea central luminosa cyan con destello */}
        <path
          d="M 65 348 Q 200 248 360 268 T 540 288"
          stroke="#00D1D1"
          strokeWidth="3.5"
          strokeDasharray="14 10"
          fill="none"
          filter="url(#glowCyan)"
        />

        {/* Destello / Resplandor bajo el automóvil */}
        <ellipse cx="270" cy="298" rx="42" ry="9" fill="#00D1D1" fillOpacity="0.45" filter="url(#glowCyan)" />

        {/* Automóvil Moderno (Sedán blanco visto desde atrás / 3/4) */}
        <g transform="translate(225, 250)">
          {/* Sombra del auto */}
          <ellipse cx="45" cy="46" rx="44" ry="7" fill="#0c2340" fillOpacity="0.4" />
          {/* Carrocería */}
          <path
            d="M 10 36 C 10 32 16 28 24 26 L 32 14 C 34 11 38 10 44 10 L 52 10 C 58 10 62 11 64 14 L 70 26 C 76 28 82 32 82 36 L 82 42 C 82 44 80 46 76 46 L 72 46 C 70 46 68 44 68 42 L 24 42 C 24 44 22 46 20 46 L 16 46 C 12 46 10 44 10 42 Z"
            fill="url(#carBodyGrad)"
            stroke="#94a3b8"
            strokeWidth="0.8"
          />
          {/* Vidrio trasero oscuro */}
          <path
            d="M 33 16 L 44 13 L 52 13 L 63 16 L 68 25 L 26 25 Z"
            fill="#0f172a"
          />
          {/* Luces traseras LED horizontales rojas */}
          <rect x="14" y="32" width="16" height="4" rx="1.5" fill="#ef4444" />
          <rect x="62" y="32" width="16" height="4" rx="1.5" fill="#ef4444" />
          <line x1="30" y1="34" x2="62" y2="34" stroke="#f43f5e" strokeWidth="1.5" strokeOpacity="0.8" />
          {/* Difusor y placa */}
          <rect x="40" y="37" width="12" height="5" rx="1" fill="#1e293b" />
          {/* Llantas */}
          <rect x="14" y="41" width="10" height="6" rx="2" fill="#0f172a" />
          <rect x="68" y="41" width="10" height="6" rx="2" fill="#0f172a" />
        </g>

        {/* Pin de Ubicación 3D Gigante en el primer plano izquierdo */}
        <g transform="translate(45, 120)">
          {/* Sombra elíptica en el suelo */}
          <ellipse cx="60" cy="180" rx="42" ry="12" fill="#0c2340" fillOpacity="0.35" />
          {/* Halo azul de energía alrededor de la punta */}
          <circle cx="60" cy="180" r="10" fill="#00D1D1" fillOpacity="0.3" filter="url(#glowCyan)" />
          <circle cx="60" cy="180" r="4" fill="#00D1D1" />

          {/* Cuerpo principal del Pin */}
          <path
            d="M 60 10 C 26 10 0 36 0 70 C 0 115 60 178 60 178 C 60 178 120 115 120 70 C 120 36 94 10 60 10 Z"
            fill="url(#pinGrad)"
            filter="drop-shadow(0 12px 24px rgba(0, 102, 255, 0.35))"
          />

          {/* Brillo 3D en el borde superior izquierdo */}
          <path
            d="M 60 14 C 30 14 6 38 6 70 C 6 95 24 128 42 154 C 32 132 16 102 16 72 C 16 42 36 22 60 22 C 78 22 94 32 102 46 C 92 26 78 14 60 14 Z"
            fill="#60a5fa"
            fillOpacity="0.55"
          />

          {/* Círculo central blanco */}
          <circle cx="60" cy="70" r="24" fill="#ffffff" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
          {/* Sutil profundidad interior */}
          <circle cx="60" cy="70" r="16" fill="#f0f7ff" />
        </g>
      </svg>
    </div>
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
  const [idioma, setIdioma] = useState<"ES" | "EN">("ES");
  const [menuIdiomaAbierto, setMenuIdiomaAbierto] = useState(false);
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
      className="login-usuario login-container relative h-dvh max-h-dvh overflow-hidden !pb-0 bg-[#f4f7fb] dark:bg-[#061529] flex flex-col"
      contentClassName="h-full justify-between sm:justify-center relative z-10 max-w-[480px] lg:max-w-none lg:w-full lg:p-0"
      style={{ height: "100dvh", maxHeight: "100dvh", overflow: "hidden" }}
    >
      {/* Elemento gráfico decorativo superior móvil */}
      <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 select-none opacity-40 dark:opacity-20 sm:h-56 sm:w-56 lg:hidden" aria-hidden="true">
        <svg viewBox="0 0 200 200" fill="none" className="h-full w-full">
          <path d="M20 180 C80 140, 110 90, 150 40" stroke="url(#routeGradMobile)" strokeWidth="18" strokeLinecap="round" strokeDasharray="1 28" />
          <path d="M20 180 C80 140, 110 90, 150 40" stroke="#00D1D1" strokeWidth="3" strokeDasharray="6 8" />
          <circle cx="150" cy="40" r="16" fill="#0066FF" fillOpacity="0.15" />
          <circle cx="150" cy="40" r="10" fill="#0066FF" />
          <circle cx="150" cy="40" r="4" fill="#ffffff" />
          <defs>
            <linearGradient id="routeGradMobile" x1="20" y1="180" x2="150" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00D1D1" />
              <stop offset="1" stopColor="#0066FF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Fondo degradado ambiental para escritorio */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden hidden lg:block" aria-hidden="true">
        <div className="absolute -right-32 -top-32 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-blue-100/40 via-cyan-50/30 to-transparent blur-3xl dark:from-blue-900/20 dark:via-cyan-900/10" />
        <div className="absolute left-1/4 -bottom-32 h-[450px] w-[450px] rounded-full bg-gradient-to-tr from-sky-100/30 to-transparent blur-3xl dark:from-blue-950/20" />
      </div>

      {/* Barra de navegación superior de escritorio (lg+) */}
      <header
        aria-label="Barra superior de inicio de sesión"
        className="hidden lg:flex items-center justify-between px-10 xl:px-14 py-4 xl:py-5 w-full z-20 shrink-0"
      >
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/imagenes/ruum-logo.svg"
            alt="Ruum Ruum"
            width={140}
            height={32}
            priority
            className="h-8 w-auto dark:hidden"
          />
          <Image
            src="/imagenes/ruum-logo-dark.svg"
            alt="Ruum Ruum"
            width={140}
            height={32}
            priority
            className="h-8 w-auto hidden dark:block"
          />
        </Link>

        <div className="flex items-center gap-5 text-xs xl:text-sm font-medium text-slate-500 dark:text-slate-400">
          <span>¿Primera vez aquí?</span>
          <Link
            href="/registro"
            className="rounded-xl border border-[#0066FF] px-4 py-1.5 font-display text-xs xl:text-sm font-bold text-[#0066FF] transition hover:bg-[#0066FF] hover:text-white dark:border-[#4d94ff] dark:text-[#4d94ff] dark:hover:bg-[#4d94ff] dark:hover:text-[#061529]"
          >
            Regístrate gratis
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuIdiomaAbierto(!menuIdiomaAbierto)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-slate-700 hover:bg-slate-100 transition dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Seleccionar idioma"
              aria-expanded={menuIdiomaAbierto}
            >
              <span>{idioma}</span>
              <IconoChevronAbajo className="size-3 text-slate-500" />
            </button>
            {menuIdiomaAbierto && (
              <div className="absolute right-0 mt-1 w-20 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-[#0a2342] z-30">
                <button
                  type="button"
                  onClick={() => { setIdioma("ES"); setMenuIdiomaAbierto(false); }}
                  className={`w-full rounded-lg px-2.5 py-1 text-left text-xs font-semibold ${idioma === "ES" ? "bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-300" : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                >
                  ES
                </button>
                <button
                  type="button"
                  onClick={() => { setIdioma("EN"); setMenuIdiomaAbierto(false); }}
                  className={`w-full rounded-lg px-2.5 py-1 text-left text-xs font-semibold ${idioma === "EN" ? "bg-blue-50 text-[#0066FF] dark:bg-blue-950 dark:text-blue-300" : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                >
                  EN
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Cuerpo principal (Grid 2 columnas en lg+, contenedor centrado en móvil) */}
      <div className="flex-1 flex flex-col lg:flex-row w-full h-full overflow-hidden z-10">
        {/* Columna Izquierda: Brand & Hero Content (solo en lg+) */}
        <section
          aria-label="Información de bienvenida y propuesta de valor"
          className="hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between px-10 xl:px-16 py-3 xl:py-5 overflow-hidden"
        >
          {/* Header del Hero */}
          <div>
            <div className="flex items-center gap-2">
              <span className="h-0.5 w-7 rounded-full bg-[#00D1D1]" aria-hidden="true" />
              <span className="font-display text-[11px] font-extrabold uppercase tracking-widest text-[#008B8B] dark:text-[#00D1D1]">
                MOVILIDAD INTELIGENTE
              </span>
            </div>
            <h1 className="mt-2.5 font-display text-4xl xl:text-5xl font-black tracking-tight text-[#0a2342] dark:text-white leading-[1.12]">
              Tu traslado, <br />
              <span className="text-[#0066FF] dark:text-[#38bdf8]">en orden.</span>
            </h1>

            {/* Fila de 3 Pilares: Rápido, Seguro, Confiable */}
            <div className="mt-5 flex items-center gap-8 xl:gap-10">
              <div className="flex flex-col items-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-blue-100/70 text-[#0066FF] shadow-2xs dark:bg-blue-950/60 dark:text-[#38bdf8]">
                  <IconoRayo className="size-5" />
                </span>
                <span className="mt-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  Rápido
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-blue-100/70 text-[#0066FF] shadow-2xs dark:bg-blue-950/60 dark:text-[#38bdf8]">
                  <IconoEscudoCheck className="size-5" />
                </span>
                <span className="mt-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  Seguro
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-blue-100/70 text-[#0066FF] shadow-2xs dark:bg-blue-950/60 dark:text-[#38bdf8]">
                  <IconoUsuarioConfiable className="size-5" />
                </span>
                <span className="mt-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  Confiable
                </span>
              </div>
            </div>
          </div>

          {/* Ilustración Vectorial Central: Pin 3D, Carretera, Sedán y Ciudad */}
          <div className="my-auto py-1 max-h-[300px] flex items-center">
            <IlustracionHeroLogin />
          </div>

          {/* Footer Inferior Izquierdo */}
          <p className="mt-auto pt-2 text-[10px] xl:text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
            PERSONAS &bull; EMPRESAS &bull; CIUDADES EN MOVIMIENTO
          </p>
        </section>

        {/* Columna Derecha: Tarjeta de Login (Centrada en móvil y en escritorio) */}
        <section
          aria-label="Formulario de inicio de sesión"
          className="mx-auto flex h-full w-full max-w-[440px] lg:max-w-none lg:w-1/2 xl:w-5/12 flex-col justify-between lg:justify-center px-4 py-2 sm:px-6 sm:py-5 lg:p-6 xl:p-10 overflow-y-auto"
        >
          {/* Card Flotante */}
          <div className="w-full max-w-[440px] mx-auto rounded-3xl lg:rounded-[2.2rem] border border-[#e2e8f0]/80 bg-white/95 p-5 sm:p-6 lg:p-7 shadow-[0_8px_30px_rgba(10,35,66,0.06)] lg:shadow-[0_20px_55px_-12px_rgba(10,35,66,0.16)] backdrop-blur-sm dark:border-[#1a3a5c] dark:bg-[#0a2342]/95">
            {/* Marca oficial y eslogan integrado */}
            <div className="flex flex-col items-center pt-0 text-center">
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
              <span className="mt-1 font-display text-[20px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb] leading-none sm:text-[22px]">
                Ruum Ruum
              </span>
              <p className="mt-0.5 text-[12px] font-medium text-[#566889] dark:text-[#a8b5cc] sm:text-[12.5px]">
                Tu traslado, en orden.
              </p>
            </div>

            {/* Título de acción */}
            <div className="my-2.5 text-center sm:my-3">
              <h2 className="text-[19px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb] sm:text-[21px]">
                Inicia sesión
                <span className="sr-only"> — Iniciar sesión | Bienvenido de nuevo</span>
              </h2>
              <p className="mt-0.5 text-[11.5px] font-medium text-[#566889] dark:text-[#a8b5cc] sm:text-[12px]">
                Accede a tu cuenta para continuar
              </p>
            </div>

            {/* Mensajes de aviso */}
            {aviso && (
              <div className="mb-2" role="status">
                <Aviso tono="success">{aviso}</Aviso>
              </div>
            )}
            {motivo === "email_confirmation" && (
              <div className="mb-2" role="status">
                <Aviso tono="atencion">
                  Para solicitar tu primer traslado debes confirmar tu correo e iniciar sesión.
                </Aviso>
              </div>
            )}
            {motivo === "authentication_required" && (
              <div className="mb-2" role="status">
                <Aviso tono="atencion">
                  Inicia sesión para solicitar un traslado. Si acabas de registrarte, confirma primero tu correo.
                </Aviso>
              </div>
            )}

            <form onSubmit={iniciarSesion} noValidate className="flex flex-col gap-2 sm:gap-2.5">
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
                    type="email"
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

              {/* Botón Iniciar sesión (CTA Principal con flecha indicadora) */}
              <button
                type="submit"
                disabled={enviando}
                className="mt-1 flex h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#0a2342] px-5 text-[14.5px] font-bold text-white shadow-sm transition hover:bg-[#103460] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0066FF] dark:hover:bg-[#1a75ff] sm:h-[48px] cursor-pointer"
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

            {/* Separador de línea con un círculo central */}
            <div className="relative my-2.5 flex items-center justify-center sm:my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#e2e8f0] dark:border-[#1a3a5c]" />
              </div>
              <div className="relative flex justify-center bg-white px-2.5 dark:bg-[#0a2342]">
                <span className="size-2 rounded-full border border-slate-300 bg-white dark:border-slate-600 dark:bg-[#0a2342]" />
              </div>
            </div>

            {/* Enlaces secundarios */}
            <div className="flex flex-col gap-1 text-center text-[12.5px] font-medium text-[#4e5f80] dark:text-[#a8b5cc] sm:gap-1.5 sm:text-[13px]">
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

            {/* Footer de Insignias de confianza */}
            <div
              role="region"
              aria-label="Garantías de seguridad"
              className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-[#566889] dark:text-[#a8b5cc] sm:gap-x-5 sm:text-[11.5px]"
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
          </div>

          {/* Términos y privacidad */}
          <p className="mt-2.5 pb-0.5 text-center text-[10.5px] font-medium leading-relaxed text-[#8b9bb0] dark:text-[#6b7a99] sm:text-[11px]">
            Al continuar, aceptas nuestros{" "}
            <Link href="/legal/terminos" className="font-semibold text-[#0066FF] hover:underline dark:text-[#4d94ff]">
              Términos y condiciones
            </Link>{" "}
            y{" "}
            <Link href="/legal/privacidad" className="font-semibold text-[#0066FF] hover:underline dark:text-[#4d94ff]">
              Aviso de privacidad
            </Link>
          </p>
        </section>
      </div>
    </MobileShell>
  );
}