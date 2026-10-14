"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { traducirErrorAuth } from "@ruum/shared/utils";
import { registrarEventoUx } from "@/lib/analytics";
import {
  CLAVE_CORREO_CONFIRMACION,
  CLAVE_REENVIO_CONFIRMACION_HASTA,
  normalizarCorreoRegistro,
  soloDigitos,
} from "@/lib/registro-usuario";

const COOLDOWN_SEGUNDOS = 60;
const EXPIRACION_SEGUNDOS = 300; // 5 minutos

function correoInicial(): string {
  if (typeof window === "undefined") return "";
  try {
    return normalizarCorreoRegistro(window.sessionStorage.getItem(CLAVE_CORREO_CONFIRMACION) ?? "");
  } catch {
    return "";
  }
}

function restanteInicial(): number {
  if (typeof window === "undefined") return 0;
  try {
    const hasta = Number(window.localStorage.getItem(CLAVE_REENVIO_CONFIRMACION_HASTA) ?? 0);
    return Math.max(0, Math.ceil((hasta - Date.now()) / 1000));
  } catch {
    return 0;
  }
}

function limpiarMarcadoresConfirmacion() {
  try {
    window.sessionStorage.removeItem(CLAVE_CORREO_CONFIRMACION);
    window.localStorage.removeItem(CLAVE_REENVIO_CONFIRMACION_HASTA);
  } catch {
    /* El navegador puede bloquear storage; la pantalla funciona igual. */
  }
}

function formatearTiempo(segundos: number): string {
  const min = Math.floor(Math.max(0, segundos) / 60);
  const sec = Math.max(0, segundos) % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/* ─────────────────────────────────────────────────────────────
   Iconos SVG accesibles
───────────────────────────────────────────────────────────── */

function IconoSignal({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M2 18h3v4H2v-4zm6-5h3v9H8v-9zm6-5h3v14h-3V8zm6-5h3v19h-3V3z" />
    </svg>
  );
}

function IconoWifi({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
    </svg>
  );
}

function IconoBateria({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="2" y="7" width="16" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="4" y="9" width="11" height="6" rx="1" />
      <path d="M20 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconoFlechaAtras({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function IconoCorreoAbierto({ className = "size-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z" />
      <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" />
    </svg>
  );
}

function IconoEscudo({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2 3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm0 18c-3.75-1.07-6.5-5.18-6.95-9.25L12 7.73l6.95 3.02c-.45 4.07-3.2 8.18-6.95 9.25z" />
    </svg>
  );
}

function IconoReloj({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconoCheckCirculo({ className = "size-4.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconoAlertaCirculo({ className = "size-4.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3" />
    </svg>
  );
}

function IconoInfoCirculo({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="3" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Componente ContenidoConfirmaCorreo
───────────────────────────────────────────────────────────── */

function ContenidoConfirmaCorreo() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [digitos, setDigitos] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [cooldownRestante, setCooldownRestante] = useState(restanteInicial);
  const [tiempoRestante, setTiempoRestante] = useState(EXPIRACION_SEGUNDOS);
  const [verificando, setVerificando] = useState(false);
  const [verificadoExito, setVerificadoExito] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorShake, setErrorShake] = useState(false);

  const emailFromUrl = normalizarCorreoRegistro(searchParams.get("email") || "");
  const hayCooldown = cooldownRestante > 0;

  const [correo] = useState(() => {
    if (typeof window === "undefined") return emailFromUrl;
    try {
      return correoInicial() || emailFromUrl;
    } catch {
      return emailFromUrl;
    }
  });

  useEffect(() => {
    registrarEventoUx("registro_confirmacion_vista");
    if (emailFromUrl) {
      console.warn("[confirma-correo] param ?email= deprecado en uso");
      registrarEventoUx("registro_confirmacion_url_deprecada");
    }
  }, [emailFromUrl]);

  // Enfocar el primer input al cargar
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, []);

  // Temporizador de expiración (5 min)
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setError("El código ha expirado. Solicita uno nuevo.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Temporizador de cooldown de reenvío
  useEffect(() => {
    if (!hayCooldown) return;
    const timer = window.setInterval(() => {
      setCooldownRestante((valor) => Math.max(0, valor - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hayCooldown]);

  const distribuirDigitos = useCallback((str: string, desde: number) => {
    const chars = str.split("");
    setDigitos((prev) => {
      const next = [...prev];
      let ultimoIdx = desde;
      for (let i = 0; i < chars.length && desde + i < 6; i++) {
        next[desde + i] = chars[i];
        ultimoIdx = desde + i;
      }
      setTimeout(() => {
        const focoTarget = Math.min(5, ultimoIdx < 5 ? ultimoIdx + 1 : 5);
        inputRefs.current[focoTarget]?.focus();
      }, 0);
      return next;
    });
    setErrorShake(false);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, "");
    if (!rawVal) {
      setDigitos((prev) => {
        const next = [...prev];
        next[idx] = "";
        return next;
      });
      return;
    }

    if (rawVal.length > 1) {
      distribuirDigitos(rawVal, idx);
      return;
    }

    setDigitos((prev) => {
      const next = [...prev];
      next[idx] = rawVal;
      return next;
    });
    setErrorShake(false);

    if (idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      if (!digitos[idx] && idx > 0) {
        e.preventDefault();
        setDigitos((prev) => {
          const next = [...prev];
          next[idx - 1] = "";
          return next;
        });
        inputRefs.current[idx - 1]?.focus();
      } else if (digitos[idx]) {
        e.preventDefault();
        setDigitos((prev) => {
          const next = [...prev];
          next[idx] = "";
          return next;
        });
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      e.preventDefault();
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const textoPegado = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!textoPegado) return;
    distribuirDigitos(textoPegado, 0);
  };

  const codigoCompleto = digitos.join("");

  async function verificarCodigo(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const codigoLimpio = soloDigitos(codigoCompleto, 6);
    if (codigoLimpio.length !== 6) {
      setError("Ingresa los 6 dígitos del código.");
      return;
    }

    setVerificando(true);
    setMensajeExito(null);
    setError(null);
    setErrorShake(false);
    registrarEventoUx("registro_confirmacion_enviada");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: correo, codigo: codigoLimpio }),
        cache: "no-store",
      });
      const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(cuerpo?.error ?? "Código incorrecto. Intenta de nuevo.");
        setErrorShake(true);
        setTimeout(() => setErrorShake(false), 600);
        registrarEventoUx("registro_confirmacion_error");
        return;
      }

      setVerificadoExito(true);
      setMensajeExito("¡Código verificado! Redirigiendo...");
      registrarEventoUx("registro_confirmacion_exitosa");
      limpiarMarcadoresConfirmacion();
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(traducirErrorAuth(err, "Código incorrecto. Intenta de nuevo."));
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 600);
      registrarEventoUx("registro_confirmacion_error");
    } finally {
      setVerificando(false);
    }
  }

  async function reenviarCodigo() {
    if (!correo || hayCooldown || reenviando) return;
    setReenviando(true);
    setMensajeExito(null);
    setError(null);
    setErrorShake(false);

    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: correo }),
        cache: "no-store",
      });
      const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(
          cuerpo?.error ??
            (res.status === 429
              ? "Espera un momento antes de solicitar otro correo."
              : "No pudimos reenviar el correo. Espera un momento e intenta nuevamente.")
        );
        return;
      }
      const hasta = Date.now() + COOLDOWN_SEGUNDOS * 1000;
      window.localStorage.setItem(CLAVE_REENVIO_CONFIRMACION_HASTA, String(hasta));
      try {
        window.sessionStorage.setItem(CLAVE_CORREO_CONFIRMACION, correo);
      } catch {
        /* storage bloqueado */
      }
      setCooldownRestante(COOLDOWN_SEGUNDOS);
      setTiempoRestante(EXPIRACION_SEGUNDOS);
      setMensajeExito("Si el correo corresponde a una cuenta pendiente, enviamos un nuevo código de confirmación.");
    } catch (err) {
      setError(traducirErrorAuth(err, "No pudimos reenviar el correo. Espera un momento e intenta nuevamente."));
    } finally {
      setReenviando(false);
    }
  }

  if (!correo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef2f7] p-3 font-sans">
        <div className="relative flex h-[800px] max-h-[calc(100dvh-2rem)] w-full max-w-[420px] flex-col overflow-hidden rounded-[36px] border border-[#e9eef3] bg-white shadow-[0_25px_60px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.02)]">
          {/* Status bar */}
          <div className="flex items-center justify-between border-b border-[#f0f2f5] bg-white px-6 py-3.5 text-sm font-semibold text-[#1c1e21] shrink-0">
            <span>9:41</span>
            <span className="flex items-center gap-1.5 text-[#2e3a4b]">
              <IconoSignal className="size-3.5" />
              <IconoWifi className="size-3.5" />
              <IconoBateria className="size-4" />
            </span>
          </div>

          {/* Header */}
          <header className="flex items-center border-b border-[#f0f4fa] bg-white px-5 py-3 shrink-0">
            <Link
              href="/registro"
              aria-label="Volver"
              className="mr-3.5 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#f2f6fc] text-[#0b1e33] transition-all hover:bg-[#e3ebf5] active:scale-95"
            >
              <IconoFlechaAtras className="size-4" />
            </Link>
            <div>
              <h1 className="text-[17px] font-bold tracking-tight text-[#0b1e33] leading-tight">
                Confirmar email
              </h1>
              <p className="text-[11.5px] font-medium text-[#6b7c94] mt-0.5">
                Paso 2 de 3 · Verificación
              </p>
            </div>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[#f0f5fe] text-[#2e5a88]">
              <IconoCorreoAbierto className="size-8" />
            </div>
            <h2 className="text-xl font-extrabold text-[#0b1e33]">No encontramos tu correo</h2>
            <p className="mt-2 text-sm text-[#6b7c94]">
              El correo electrónico no está disponible. Puedes volver a la página de registro para intentarlo de nuevo.
            </p>
            <Link
              href="/registro"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#0b1e33] py-4 px-5 text-[15px] font-bold text-white shadow-[0_14px_28px_-10px_rgba(11,30,51,0.45)] transition hover:bg-[#143560] active:scale-[0.98]"
            >
              Volver a registrarme
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef2f7] p-3 font-sans">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              20% { transform: translateX(-6px); }
              40% { transform: translateX(6px); }
              60% { transform: translateX(-4px); }
              80% { transform: translateX(4px); }
            }
          `,
        }}
      />
      <div className="relative flex h-[800px] max-h-[calc(100dvh-2rem)] w-full max-w-[420px] flex-col overflow-hidden rounded-[36px] border border-[#e9eef3] bg-white shadow-[0_25px_60px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.02)]">
        {/* Status bar */}
        <div className="flex items-center justify-between border-b border-[#f0f2f5] bg-white px-6 py-3.5 text-sm font-semibold text-[#1c1e21] shrink-0">
          <span>9:41</span>
          <span className="flex items-center gap-1.5 text-[#2e3a4b]">
            <IconoSignal className="size-3.5" />
            <IconoWifi className="size-3.5" />
            <IconoBateria className="size-4" />
          </span>
        </div>

        {/* Header con botón atrás */}
        <header className="flex items-center border-b border-[#f0f4fa] bg-white px-5 py-3 shrink-0">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Volver"
            className="mr-3.5 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#f2f6fc] text-[#0b1e33] transition-all hover:bg-[#e3ebf5] active:scale-95"
          >
            <IconoFlechaAtras className="size-4" />
          </button>
          <div>
            <h1 className="text-[17px] font-bold tracking-tight text-[#0b1e33] leading-tight">
              Confirmar email
            </h1>
            <p className="text-[11.5px] font-medium text-[#6b7c94] mt-0.5">
              Paso 2 de 3 · Verificación
            </p>
          </div>
        </header>

        {/* Contenido principal con scroll */}
        <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-7 pb-6 bg-white [scrollbar-width:thin] [scrollbar-color:#cbd5e1_#f1f5f9]">
          {/* Icono de verificación */}
          <div className="flex justify-center mb-6">
            <div className="relative flex size-[84px] items-center justify-center rounded-[28px] bg-gradient-to-br from-[#0b1e33] to-[#2e5a88] text-white shadow-[0_18px_36px_-12px_rgba(11,30,51,0.4)]">
              <IconoCorreoAbierto className="size-9" />
              <div className="absolute -bottom-2 -right-2 flex size-[34px] items-center justify-center rounded-full border-[3px] border-white bg-[#e9f3ee] text-[#1f6b4a] shadow-sm">
                <IconoEscudo className="size-3.5" />
              </div>
            </div>
          </div>

          {/* Título y descripción */}
          <h2 className="text-[24px] font-[800] tracking-[-0.6px] text-center text-[#0b1e33] leading-tight mb-2.5">
            Revisa tu correo
          </h2>
          <p className="text-[13.5px] text-[#6b7c94] font-medium text-center leading-[1.55] mb-7">
            Enviamos un código de 6 dígitos a<br />
            <strong className="text-[#0b1e33] font-bold">{correo}</strong>
          </p>

          {/* Formulario e inputs de código - 6 dígitos */}
          <form onSubmit={verificarCodigo} noValidate className="flex flex-col">
            <label htmlFor="code1" className="sr-only">
              Código de verificación
            </label>
            <div
              className="flex justify-center gap-2 mb-[22px]"
              role="group"
              aria-label="Casillas de código"
            >
              {digitos.map((digito, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  id={`code${idx + 1}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]"
                  maxLength={1}
                  autoComplete={idx === 0 ? "one-time-code" : "off"}
                  aria-label={idx === 0 ? undefined : `Dígito ${idx + 1}`}
                  value={digito}
                  disabled={verificando || verificadoExito}
                  onChange={(e) => handleInput(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  onFocus={(e) => e.target.select()}
                  className={[
                    "w-[46px] h-[58px] border-2 rounded-[14px] text-center text-[22px] font-[800] text-[#0b1e33] outline-none transition-all caret-[#0b1e33]",
                    errorShake
                      ? "border-[#e84a3e] bg-[#fef5f5] animate-[shake_0.4s_ease]"
                      : digito
                      ? "border-[#0b1e33] bg-white"
                      : "border-[#e6edf6] bg-[#fafcfe]",
                    "focus:border-[#0b1e33] focus:bg-white focus:ring-4 focus:ring-[#0b1e33]/10 focus:-translate-y-0.5",
                  ].join(" ")}
                />
              ))}
            </div>

            {/* Temporizador */}
            <div className="flex justify-center items-center gap-2 mb-[26px] text-[13px] font-semibold text-[#6b7c94]">
              <IconoReloj className="size-3.5 text-[#2e5a88]" />
              <span>
                El código expira en{" "}
                <span className="font-[800] text-[#0b1e33]" id="timer">
                  {formatearTiempo(tiempoRestante)}
                </span>
              </span>
            </div>

            {/* Botón verificar */}
            <button
              type="submit"
              id="btnVerify"
              disabled={codigoCompleto.length !== 6 || verificando || verificadoExito || tiempoRestante <= 0}
              className="w-full bg-[#0b1e33] text-white border-0 py-[19px] px-[22px] rounded-[18px] font-bold text-[16.5px] flex items-center justify-center gap-2.5 shadow-[0_14px_28px_-10px_rgba(11,30,51,0.45)] cursor-pointer tracking-[-0.2px] mb-4 transition-all hover:bg-[#143560] active:scale-[0.98] disabled:bg-[#cbd5e1] disabled:shadow-none disabled:cursor-not-allowed disabled:opacity-70"
            >
              <IconoCheckCirculo className="size-[18px]" />
              {verificando ? "Verificando código..." : "Verificar código"}
            </button>
          </form>

          {/* Reenviar */}
          <div className="text-center text-[13.5px] text-[#6b7c94] font-medium mb-6">
            ¿No recibiste el código?
            <button
              type="button"
              id="resendLink"
              onClick={reenviarCodigo}
              disabled={hayCooldown || reenviando || verificando}
              className={`font-bold ml-1 transition cursor-pointer ${
                hayCooldown || reenviando || verificando
                  ? "text-[#b0bfd0] cursor-not-allowed"
                  : "text-[#2e5a88] hover:underline"
              }`}
            >
              {reenviando
                ? "Reenviando..."
                : hayCooldown
                ? `Reenviar (${cooldownRestante}s)`
                : "Reenviar"}
            </button>
          </div>

          {/* Mensaje de éxito */}
          {mensajeExito && (
            <div
              id="successMessage"
              role="status"
              className="flex items-center gap-2.5 bg-[#e9f3ee] border border-[#cbe5d9] rounded-[14px] p-3.5 text-[#1f6b4a] text-[13px] font-semibold mb-4 animate-fade-in"
            >
              <IconoCheckCirculo className="size-[18px] shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div
              id="errorMessage"
              role="alert"
              className="flex items-center gap-2.5 bg-[#fdeaea] border border-[#f5c6c6] rounded-[14px] p-3.5 text-[#b33c3c] text-[13px] font-semibold mb-4 animate-fade-in"
            >
              <IconoAlertaCirculo className="size-[18px] shrink-0" />
              <span id="errorText">{error}</span>
            </div>
          )}

          {/* Ayuda */}
          <div className="flex items-start gap-3 bg-[#f0f5fe] rounded-[16px] p-3.5 sm:p-4 border border-[#dfe8f3] mt-auto">
            <IconoInfoCirculo className="size-4 text-[#2e5a88] shrink-0 mt-0.5" />
            <div className="text-[12.5px] text-[#3d5470] font-medium leading-[1.5]">
              Revisa tu carpeta de spam si no ves el correo. Si el problema persiste,{" "}
              <a href="mailto:soporte@ruumruum.com" className="text-[#2e5a88] font-bold hover:underline">
                contacta a soporte
              </a>.
            </div>
          </div>
        </div>

        {/* Processing overlay */}
        {verificando && (
          <div
            id="processingOverlay"
            role="status"
            aria-live="polite"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-[6px] p-10 text-center animate-fade-in"
          >
            <div className="size-14 rounded-full border-4 border-[#e8eef6] border-t-[#0b1e33] animate-spin mb-6" />
            <div className="text-[19px] font-[800] text-[#0b1e33] tracking-[-0.3px] mb-2">
              Verificando código...
            </div>
            <div className="text-[13.5px] text-[#6b7c94] font-medium leading-[1.5]">
              Esto solo toma un momento.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaginaConfirmaCorreo() {
  return (
    <Suspense fallback={null}>
      <ContenidoConfirmaCorreo />
    </Suspense>
  );
}
