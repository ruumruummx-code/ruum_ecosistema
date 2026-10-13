"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fortalezaPassword, passwordCumpleRequisitos, traducirErrorAuth } from "@ruum/shared/utils";
import { registrarEventoUx } from "../../lib/analytics";
import { tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import {
  CLAVE_CORREO_CONFIRMACION,
  normalizarCorreoRegistro,
  soloDigitos,
  telefonoLocalMx,
} from "../../lib/registro-usuario";

/* ─────────────────────────────────────────────────────────────
   Iconos SVG accesibles
───────────────────────────────────────────────────────────── */

function IconoFlechaAtras({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

function IconoFlechaDerecha({ className = "size-4.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function IconoUsuario({ className = "size-4.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconoUsuarioPlus({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function IconoCorreo({ className = "size-4.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconoCandado({ className = "size-4.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconoLlave({ className = "size-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15.5 8.5 2 2" />
      <path d="M21 3a3 3 0 0 0-3 3l-8.5 8.5a5 5 0 1 0 3 3L21 9V3z" />
    </svg>
  );
}

function IconoOjo({ className = "size-4.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconoOjoCerrado({ className = "size-4.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m2 2 20 20" />
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    </svg>
  );
}

function IconoCheckCirculo({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconoCirculoVacio({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function IconoAlertaTriangulo({ className = "size-4.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconoInfo({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Componente principal PaginaRegistro
───────────────────────────────────────────────────────────── */

export default function PaginaRegistro() {
  const router = useRouter();

  /* Paso 1: datos básicos */
  const tipoCuenta = "personal";
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");

  /* Verificación de teléfono por SMS (Twilio Verify) */
  const [telefonoVerificado, setTelefonoVerificado] = useState(false);
  const [telefonoVerificadoValor, setTelefonoVerificadoValor] = useState("");
  const [tokenVerificacionTelefono, setTokenVerificacionTelefono] = useState<string | null>(null);
  const [modalVerificacionAbierto, setModalVerificacionAbierto] = useState(false);
  const [codigoOtp, setCodigoOtp] = useState("");
  const [enviandoOtp, setEnviandoOtp] = useState(false);
  const [verificandoOtp, setVerificandoOtp] = useState(false);
  const [errorOtp, setErrorOtp] = useState<string | null>(null);
  const [segundosReenvio, setSegundosReenvio] = useState(0);

  /* Paso 2: credenciales */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  /* Estado de la UI */
  const [paso, setPaso] = useState<1 | 2>(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCampo, setErrorCampo] = useState<{ campo: string; mensaje: string } | null>(null);

  const nombreRef = useRef<HTMLInputElement>(null);
  const apellidoRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmarRef = useRef<HTMLInputElement>(null);
  const terminosRef = useRef<HTMLInputElement>(null);

  const pwd = fortalezaPassword(password);

  // Atajo Escape para cerrar modal OTP
  useEffect(() => {
    if (!modalVerificacionAbierto) return;
    function manejarKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModalVerificacionAbierto(false);
        telefonoRef.current?.focus();
      }
    }
    window.addEventListener("keydown", manejarKeyDown);
    return () => window.removeEventListener("keydown", manejarKeyDown);
  }, [modalVerificacionAbierto]);

  // Temporizador para reenvío de SMS
  useEffect(() => {
    if (segundosReenvio <= 0) return;
    const interval = setInterval(() => {
      setSegundosReenvio((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [segundosReenvio]);

  useEffect(() => {
    registrarEventoUx("registro_visto", { paso: 1 });
  }, []);

  useEffect(() => {
    registrarEventoUx("registro_paso_visto", { paso });
  }, [paso]);

  /* Validación paso 1 */
  function validarPaso1(): { campo: string; mensaje: string } | null {
    if (!nombre.trim()) return { campo: "nombre", mensaje: "Escribe tu nombre." };
    if (!apellido.trim()) return { campo: "apellido", mensaje: "Escribe tu apellido." };
    const tel = soloDigitos(telefono);
    if (tel.length !== 10) return { campo: "telefono", mensaje: "El teléfono debe tener 10 dígitos." };
    return null;
  }

  /* Validación paso 2 */
  function validarPaso2(): { campo: string; mensaje: string } | null {
    const correo = normalizarCorreoRegistro(email);
    if (!correo) return { campo: "email", mensaje: "Escribe tu correo electrónico." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      return { campo: "email", mensaje: "El formato del correo no es válido." };
    if (!passwordCumpleRequisitos(password))
      return { campo: "password", mensaje: "La contraseña debe incluir minúscula, mayúscula y número." };
    if (password !== confirmarPassword)
      return { campo: "confirmarPassword", mensaje: "Las contraseñas no coinciden." };
    if (!aceptaTerminos) return { campo: "terminos", mensaje: "Acepta los términos para continuar." };
    return null;
  }

  const refs = {
    nombre: nombreRef,
    apellido: apellidoRef,
    telefono: telefonoRef,
    email: emailRef,
    password: passwordRef,
    confirmarPassword: confirmarRef,
  };

  function reportarError(fallo: { campo: string; mensaje: string } | null) {
    if (!fallo) {
      setError(null);
      setErrorCampo(null);
      return false;
    }
    setError(null);
    setErrorCampo({ campo: fallo.campo, mensaje: fallo.mensaje });
    if (fallo.campo === "terminos") {
      terminosRef.current?.focus();
    } else {
      (refs as Record<string, React.RefObject<HTMLInputElement | null>>)[fallo.campo]?.current?.focus();
    }
    return true;
  }

  /* Envío de código OTP SMS */
  async function enviarOtpSms(digitos: string) {
    setEnviandoOtp(true);
    setErrorOtp(null);
    try {
      const res = await fetch("/api/auth/phone-verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono: digitos }),
      });
      const cuerpo = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!res.ok) {
        setErrorOtp(cuerpo?.error ?? "No pudimos enviar el código SMS. Intenta de nuevo.");
      } else {
        setSegundosReenvio(60);
      }
    } catch {
      setErrorOtp("No se pudo enviar el mensaje SMS. Revisa tu conexión.");
    } finally {
      setEnviandoOtp(false);
      requestAnimationFrame(() => otpRef.current?.focus());
    }
  }

  /* Verificación de código OTP SMS */
  async function confirmarCodigoOtp(e: React.FormEvent) {
    e.preventDefault();
    const digitos = soloDigitos(telefono, 10);
    const codigo = soloDigitos(codigoOtp, 6);

    if (codigo.length !== 6) {
      setErrorOtp("El código debe tener 6 dígitos.");
      requestAnimationFrame(() => otpRef.current?.focus());
      return;
    }

    setVerificandoOtp(true);
    setErrorOtp(null);

    try {
      const res = await fetch("/api/auth/phone-verify/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono: digitos, codigo }),
      });
      const cuerpo = (await res.json().catch(() => null)) as {
        ok?: boolean;
        token?: string;
        error?: string;
      } | null;

      if (!res.ok || !cuerpo?.token) {
        setErrorOtp(cuerpo?.error ?? "El código ingresado es incorrecto o ha expirado.");
        requestAnimationFrame(() => otpRef.current?.focus());
        return;
      }

      setTelefonoVerificado(true);
      setTelefonoVerificadoValor(digitos);
      setTokenVerificacionTelefono(cuerpo.token);
      setModalVerificacionAbierto(false);

      setPaso(2);
      requestAnimationFrame(() => emailRef.current?.focus());
    } catch {
      setErrorOtp("Ocurrió un error al verificar el código. Intenta de nuevo.");
      requestAnimationFrame(() => otpRef.current?.focus());
    } finally {
      setVerificandoOtp(false);
    }
  }

  /* Avanzar del paso 1 al paso 2 */
  async function avanzarPaso2(e?: React.FormEvent) {
    e?.preventDefault();
    const err = validarPaso1();
    if (reportarError(err)) return;

    const digitos = soloDigitos(telefono, 10);
    if (telefonoVerificado && tokenVerificacionTelefono && telefonoVerificadoValor === digitos) {
      setPaso(2);
      requestAnimationFrame(() => emailRef.current?.focus());
      return;
    }

    setModalVerificacionAbierto(true);
    setCodigoOtp("");
    setErrorOtp(null);
    await enviarOtpSms(digitos);
  }

  /* Crear cuenta (Paso 2) */
  async function crearCuenta(e: React.FormEvent) {
    e.preventDefault();
    const err = validarPaso2();
    if (reportarError(err)) return;

    const digitos = soloDigitos(telefono, 10);
    if (!telefonoVerificado || !tokenVerificacionTelefono || telefonoVerificadoValor !== digitos) {
      setError("Debes verificar tu número de teléfono celular por SMS antes de crear tu cuenta.");
      setPaso(1);
      return;
    }

    setEnviando(true);
    setError(null);
    registrarEventoUx("registro_enviado", { tipo_cuenta: tipoCuenta });

    try {
      const correo = normalizarCorreoRegistro(email);

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          telefono: digitos,
          email: correo,
          password,
          tipoCuenta,
          aceptaTerminos: true,
          tokenVerificacionTelefono,
        }),
      });

      const cuerpo = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        requiereConfirmacion?: boolean;
        correo?: string;
      } | null;

      if (!res.ok) {
        setError(cuerpo?.error ?? "No pudimos crear la cuenta. Intenta de nuevo.");
        registrarEventoUx("registro_error", { tipo_cuenta: tipoCuenta });
        return;
      }

      if (!cuerpo?.requiereConfirmacion) {
        registrarEventoUx("registro_exitoso", { tipo_cuenta: tipoCuenta, requiere_confirmacion: false });
        router.push("/");
        router.refresh();
      } else {
        try {
          window.sessionStorage.setItem(CLAVE_CORREO_CONFIRMACION, cuerpo.correo ?? correo);
        } catch {
          // ignore
        }
        registrarEventoUx("registro_exitoso", { tipo_cuenta: tipoCuenta, requiere_confirmacion: true });
        router.push("/registro/confirma-correo");
      }
    } catch (err: unknown) {
      setError(traducirErrorAuth(err, "No pudimos crear la cuenta. Intenta de nuevo."));
      registrarEventoUx("registro_error", { tipo_cuenta: tipoCuenta });
    } finally {
      setEnviando(false);
    }
  }

  if (!tieneSupabaseConfigurado()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef2f7] p-4 font-sans">
        <div className="w-full max-w-[420px] rounded-[36px] border border-[#e9eef3] bg-white p-7 text-center shadow-xl">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <IconoAlertaTriangulo className="size-7" />
          </div>
          <h1 className="text-xl font-extrabold text-[#0a2342]">Servicio no disponible</h1>
          <p className="mt-2 text-sm text-[#4e5f80]">
            Supabase no está configurado en este entorno. El registro no está disponible.
          </p>
        </div>
      </div>
    );
  }

  // Comprobaciones en tiempo real para contraseña en Paso 2
  const checkLongitud = password.length >= 8;
  const checkMinuscula = /[a-z]/.test(password);
  const checkMayuscula = /[A-Z]/.test(password);
  const checkNumero = /[0-9]/.test(password);
  const hayConfirmacion = confirmarPassword.length > 0;
  const coincidePassword = password === confirmarPassword;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eef2f7] p-3 sm:p-5 font-sans">
      <div className="relative flex w-full max-w-[480px] flex-col overflow-hidden rounded-[32px] sm:rounded-[36px] border border-[#e9eef3] bg-white shadow-[0_25px_60px_rgba(0,0,0,0.12)]">
        
        {/* Encabezado */}
        <header className="flex items-center border-b border-[#f0f4fa] bg-white px-5 py-3.5 shrink-0">
          {paso === 2 ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setErrorCampo(null);
                setPaso(1);
                requestAnimationFrame(() => nombreRef.current?.focus());
              }}
              aria-label="Volver al paso 1"
              className="mr-3.5 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#edf4fe] text-[#0a2342] transition-all hover:bg-[#e3ebf5] active:scale-95"
            >
              <IconoFlechaAtras />
            </button>
          ) : (
            <Link
              href="/"
              aria-label="Volver al inicio"
              className="mr-3.5 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#edf4fe] text-[#0a2342] transition-all hover:bg-[#e3ebf5] active:scale-95"
            >
              <IconoFlechaAtras />
            </Link>
          )}

          <div>
            <h1 className="text-[17px] font-bold tracking-tight text-[#0a2342] leading-tight">
              Crear cuenta
            </h1>
            <p className="text-[11.5px] font-medium text-[#4e5f80] mt-0.5">
              {paso === 1 ? "Paso 1 de 3 · Datos básicos" : "Paso 2 de 3 · Acceso"}
            </p>
          </div>
        </header>

        {/* Barra de progreso */}
        <div className="bg-white px-5 pt-3.5 shrink-0">
          <div className="h-[5px] w-full overflow-hidden rounded-full bg-[#e8eef6] mb-2">
            <div
              className={[
                "h-full rounded-full transition-all duration-300",
                paso === 1 ? "w-1/3" : "w-2/3",
              ].join(" ")}
              style={{ background: "linear-gradient(90deg, #0a2342, #2e5a88)" }}
            />
          </div>
          <div className="flex justify-between pb-2 text-[10px] font-bold uppercase tracking-wider text-[#a6b7cb]">
            <span className={paso === 1 ? "text-[#0a2342]" : "text-[#1f6b4a] font-bold flex items-center gap-1"}>
              {paso === 2 && "✓"} Datos básicos
            </span>
            <span className={paso === 2 ? "text-[#0a2342]" : "text-[#a6b7cb]"}>
              Acceso
            </span>
            <span className="text-[#a6b7cb]">
              Verificación
            </span>
          </div>
        </div>

        {/* Contenido principal scrollable */}
        <div className="flex flex-1 flex-col bg-white px-6 py-6 sm:px-7 sm:py-7 overflow-y-auto">
          
          {/* ═════════════════════════════════════════════════════════
              PASO 1: DATOS BÁSICOS
          ═════════════════════════════════════════════════════════ */}
          {paso === 1 && (
            <form onSubmit={avanzarPaso2} noValidate className="flex flex-1 flex-col">
              {/* Icono de bienvenida */}
              <div className="mb-4 flex justify-center">
                <div className="relative flex size-20 items-center justify-center rounded-[28px] text-white shadow-[0_18px_36px_-12px_rgba(11,30,51,0.4)]"
                  style={{ background: "linear-gradient(135deg, #0a2342 0%, #2e5a88 100%)" }}
                >
                  <IconoUsuarioPlus className="size-8 text-white" />
                  <div className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#e9f3ee] text-xs text-[#1f6b4a]">
                    <IconoCheckCirculo className="size-3.5" />
                  </div>
                </div>
              </div>

              {/* Título y descripción */}
              <h2 className="text-center text-[24px] font-extrabold tracking-tight text-[#0a2342] leading-tight mb-1.5">
                Tus datos básicos
              </h2>
              <p className="text-center text-[13.5px] font-medium text-[#4e5f80] leading-relaxed mb-5">
                Solo necesitamos tus datos básicos para empezar.
              </p>

              {/* Formulario */}
              <div className="flex flex-col gap-3.5">
                {/* Nombre y Apellido en 2 columnas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="nombre" className="text-[11px] font-bold uppercase tracking-wider text-[#4e5f80]">
                      Nombre
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0bfd0]">
                        <IconoUsuario className="size-4" />
                      </span>
                      <input
                        ref={nombreRef}
                        id="nombre"
                        type="text"
                        required
                        autoComplete="given-name"
                        placeholder="Laura"
                        value={nombre}
                        onChange={(e) => {
                          setNombre(e.target.value);
                          if (errorCampo?.campo === "nombre") setErrorCampo(null);
                        }}
                        aria-invalid={errorCampo?.campo === "nombre" ? "true" : undefined}
                        aria-describedby={errorCampo?.campo === "nombre" ? "nombre-error" : undefined}
                        className={[
                          "w-full rounded-2xl border py-3.5 pl-10 pr-3 text-[14.5px] font-medium text-[#0a2342] outline-none transition",
                          errorCampo?.campo === "nombre"
                            ? "border-red-400 bg-red-50/40 focus:border-red-500"
                            : "border-[#e6edf6] bg-[#fafcfe] focus:border-[#0a2342] focus:bg-white focus:ring-4 focus:ring-[#0a2342]/5",
                        ].join(" ")}
                      />
                    </div>
                    {errorCampo?.campo === "nombre" && (
                      <p id="nombre-error" role="alert" className="text-[11.5px] font-bold text-[#b33c3c]">
                        {errorCampo.mensaje}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="apellido" className="text-[11px] font-bold uppercase tracking-wider text-[#4e5f80]">
                      Apellido
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0bfd0]">
                        <IconoUsuario className="size-4" />
                      </span>
                      <input
                        ref={apellidoRef}
                        id="apellido"
                        type="text"
                        required
                        autoComplete="family-name"
                        placeholder="Martínez"
                        value={apellido}
                        onChange={(e) => {
                          setApellido(e.target.value);
                          if (errorCampo?.campo === "apellido") setErrorCampo(null);
                        }}
                        aria-invalid={errorCampo?.campo === "apellido" ? "true" : undefined}
                        aria-describedby={errorCampo?.campo === "apellido" ? "apellido-error" : undefined}
                        className={[
                          "w-full rounded-2xl border py-3.5 pl-10 pr-3 text-[14.5px] font-medium text-[#0a2342] outline-none transition",
                          errorCampo?.campo === "apellido"
                            ? "border-red-400 bg-red-50/40 focus:border-red-500"
                            : "border-[#e6edf6] bg-[#fafcfe] focus:border-[#0a2342] focus:bg-white focus:ring-4 focus:ring-[#0a2342]/5",
                        ].join(" ")}
                      />
                    </div>
                    {errorCampo?.campo === "apellido" && (
                      <p id="apellido-error" role="alert" className="text-[11.5px] font-bold text-[#b33c3c]">
                        {errorCampo.mensaje}
                      </p>
                    )}
                  </div>
                </div>

                {/* Teléfono celular con prefijo +52 */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="telefono" className="text-[11px] font-bold uppercase tracking-wider text-[#4e5f80]">
                    Teléfono celular
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-[14.5px] text-[#4e5f80]">
                      +52
                    </span>
                    <input
                      ref={telefonoRef}
                      id="telefono"
                      type="tel"
                      required
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={14}
                      placeholder="55 1234 5678"
                      value={telefono}
                      onChange={(e) => {
                        const nuevoTel = telefonoLocalMx(e.target.value);
                        setTelefono(nuevoTel);
                        if (telefonoVerificado && soloDigitos(nuevoTel) !== telefonoVerificadoValor) {
                          setTelefonoVerificado(false);
                          setTokenVerificacionTelefono(null);
                        }
                        if (errorCampo?.campo === "telefono") setErrorCampo(null);
                      }}
                      aria-invalid={errorCampo?.campo === "telefono" ? "true" : undefined}
                      aria-describedby={errorCampo?.campo === "telefono" ? "telefono-error" : "telefono-ayuda"}
                      className={[
                        "w-full rounded-2xl border py-3.5 pl-15 pr-10 text-[15px] font-medium text-[#0a2342] outline-none transition",
                        errorCampo?.campo === "telefono"
                          ? "border-red-400 bg-red-50/40 focus:border-red-500"
                          : "border-[#e6edf6] bg-[#fafcfe] focus:border-[#0a2342] focus:bg-white focus:ring-4 focus:ring-[#0a2342]/5",
                      ].join(" ")}
                    />
                    {telefonoVerificado && (
                      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <IconoCheckCirculo className="size-3" /> Verificado
                      </span>
                    )}
                  </div>

                  {errorCampo?.campo === "telefono" ? (
                    <p id="telefono-error" role="alert" className="text-[11.5px] font-bold text-[#b33c3c]">
                      {errorCampo.mensaje}
                    </p>
                  ) : (
                    <p id="telefono-ayuda" className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#4e5f80]">
                      <IconoInfo className="text-[#2e5a88] shrink-0" />
                      Para notificaciones de tu traslado. Sin código de país.
                    </p>
                  )}
                </div>
              </div>

              {/* Error general */}
              {error && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-800">
                  <IconoAlertaTriangulo className="size-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Botón Continuar */}
              <button
                type="submit"
                disabled={enviandoOtp}
                className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[18px] bg-[#0a2342] py-4 px-5 text-[16px] font-bold text-white shadow-[0_14px_28px_-10px_rgba(11,30,51,0.45)] transition hover:bg-[#143560] active:scale-[0.98] disabled:opacity-60"
              >
                <span>{enviandoOtp ? "Enviando código SMS…" : "Continuar"}</span>
                <IconoFlechaDerecha />
              </button>

              {/* Enlace a Login */}
              <div className="mt-4 text-center text-[13px] font-medium text-[#4e5f80]">
                ¿Ya tienes cuenta?
                <Link href="/login" className="ml-1 font-bold text-[#0a2342] hover:underline">
                  Inicia sesión
                </Link>
              </div>
            </form>
          )}

          {/* ═════════════════════════════════════════════════════════
              PASO 2: ACCESO / CREDENCIALES
          ═════════════════════════════════════════════════════════ */}
          {paso === 2 && (
            <form onSubmit={crearCuenta} noValidate className="flex flex-1 flex-col">
              {/* Icono de credenciales */}
              <div className="mb-3.5 flex justify-center">
                <div className="relative flex size-[76px] items-center justify-center rounded-[26px] text-white shadow-[0_18px_36px_-12px_rgba(11,30,51,0.4)]"
                  style={{ background: "linear-gradient(135deg, #0a2342 0%, #2e5a88 100%)" }}
                >
                  <IconoLlave className="size-7.5 text-white" />
                  <div className="absolute -bottom-1 -right-1 flex size-6.5 items-center justify-center rounded-full border-2 border-white bg-[#e9f3ee] text-xs text-[#1f6b4a]">
                    <IconoCandado className="size-3.5" />
                  </div>
                </div>
              </div>

              {/* Título y descripción */}
              <h2 className="text-center text-[23px] font-extrabold tracking-tight text-[#0a2342] leading-tight mb-1">
                Elige tus credenciales
              </h2>
              <p className="text-center text-[13px] font-medium text-[#4e5f80] leading-relaxed mb-4">
                Con esto accederás a tu cuenta y recibirás notificaciones de tus traslados.
              </p>

              <div className="flex flex-col gap-3.5">
                {/* Correo electrónico */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-[#4e5f80]">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0bfd0]">
                      <IconoCorreo className="size-4" />
                    </span>
                    <input
                      ref={emailRef}
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorCampo?.campo === "email") setErrorCampo(null);
                      }}
                      aria-invalid={errorCampo?.campo === "email" ? "true" : undefined}
                      aria-describedby={errorCampo?.campo === "email" ? "email-error" : undefined}
                      className={[
                        "w-full rounded-2xl border py-3.5 pl-10 pr-3.5 text-[14.5px] font-medium text-[#0a2342] outline-none transition",
                        errorCampo?.campo === "email"
                          ? "border-red-400 bg-red-50/40 focus:border-red-500"
                          : "border-[#e6edf6] bg-[#fafcfe] focus:border-[#0a2342] focus:bg-white focus:ring-4 focus:ring-[#0a2342]/5",
                      ].join(" ")}
                    />
                  </div>
                  {errorCampo?.campo === "email" && (
                    <p id="email-error" role="alert" className="text-[11.5px] font-bold text-[#b33c3c]">
                      {errorCampo.mensaje}
                    </p>
                  )}
                </div>

                {/* Contraseña */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-[#4e5f80]">
                    Contraseña
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0bfd0]">
                      <IconoCandado className="size-4" />
                    </span>
                    <input
                      ref={passwordRef}
                      id="password"
                      type={mostrarPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorCampo?.campo === "password") setErrorCampo(null);
                      }}
                      aria-invalid={errorCampo?.campo === "password" ? "true" : undefined}
                      aria-describedby={errorCampo?.campo === "password" ? "password-error" : undefined}
                      className={[
                        "w-full rounded-2xl border py-3.5 pl-10 pr-11 text-[14.5px] font-medium text-[#0a2342] outline-none transition",
                        errorCampo?.campo === "password"
                          ? "border-red-400 bg-red-50/40 focus:border-red-500"
                          : "border-[#e6edf6] bg-[#fafcfe] focus:border-[#0a2342] focus:bg-white focus:ring-4 focus:ring-[#0a2342]/5",
                      ].join(" ")}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setMostrarPassword((v) => !v)}
                      aria-label={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b0bfd0] hover:text-[#0a2342] transition cursor-pointer"
                    >
                      {mostrarPassword ? <IconoOjoCerrado className="size-4.5" /> : <IconoOjo className="size-4.5" />}
                    </button>
                  </div>
                  {errorCampo?.campo === "password" && (
                    <p id="password-error" role="alert" className="text-[11.5px] font-bold text-[#b33c3c]">
                      {errorCampo.mensaje}
                    </p>
                  )}

                  {/* Requisitos de contraseña interactivos */}
                  <div className="mt-1 flex flex-col gap-1.5 rounded-2xl border border-[#eef2f7] bg-[#f8fafd] p-3.5" aria-label="Requisitos de contraseña">
                    <div className={["flex items-center gap-2 text-[12px] font-medium transition", checkLongitud ? "text-[#1f6b4a] font-semibold" : "text-[#4e5f80]"].join(" ")}>
                      {checkLongitud ? <IconoCheckCirculo className="size-3.5 text-emerald-600" /> : <IconoCirculoVacio className="size-3.5 text-[#b0bfd0]" />}
                      <span>Mínimo 8 caracteres</span>
                    </div>
                    <div className={["flex items-center gap-2 text-[12px] font-medium transition", checkMinuscula ? "text-[#1f6b4a] font-semibold" : "text-[#4e5f80]"].join(" ")}>
                      {checkMinuscula ? <IconoCheckCirculo className="size-3.5 text-emerald-600" /> : <IconoCirculoVacio className="size-3.5 text-[#b0bfd0]" />}
                      <span>Al menos una letra minúscula</span>
                    </div>
                    <div className={["flex items-center gap-2 text-[12px] font-medium transition", checkMayuscula ? "text-[#1f6b4a] font-semibold" : "text-[#4e5f80]"].join(" ")}>
                      {checkMayuscula ? <IconoCheckCirculo className="size-3.5 text-emerald-600" /> : <IconoCirculoVacio className="size-3.5 text-[#b0bfd0]" />}
                      <span>Al menos una letra mayúscula</span>
                    </div>
                    <div className={["flex items-center gap-2 text-[12px] font-medium transition", checkNumero ? "text-[#1f6b4a] font-semibold" : "text-[#4e5f80]"].join(" ")}>
                      {checkNumero ? <IconoCheckCirculo className="size-3.5 text-emerald-600" /> : <IconoCirculoVacio className="size-3.5 text-[#b0bfd0]" />}
                      <span>Al menos un número</span>
                    </div>
                  </div>
                </div>

                {/* Confirmar contraseña */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirmarPassword" className="text-[11px] font-bold uppercase tracking-wider text-[#4e5f80]">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b0bfd0]">
                      <IconoCandado className="size-4" />
                    </span>
                    <input
                      ref={confirmarRef}
                      id="confirmarPassword"
                      type={mostrarConfirmar ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="Repite tu contraseña"
                      value={confirmarPassword}
                      onChange={(e) => {
                        setConfirmarPassword(e.target.value);
                        if (errorCampo?.campo === "confirmarPassword") setErrorCampo(null);
                      }}
                      aria-invalid={errorCampo?.campo === "confirmarPassword" ? "true" : undefined}
                      aria-describedby={errorCampo?.campo === "confirmarPassword" ? "confirmar-error" : undefined}
                      className={[
                        "w-full rounded-2xl border py-3.5 pl-10 pr-11 text-[14.5px] font-medium text-[#0a2342] outline-none transition",
                        errorCampo?.campo === "confirmarPassword"
                          ? "border-red-400 bg-red-50/40 focus:border-red-500"
                          : "border-[#e6edf6] bg-[#fafcfe] focus:border-[#0a2342] focus:bg-white focus:ring-4 focus:ring-[#0a2342]/5",
                      ].join(" ")}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setMostrarConfirmar((v) => !v)}
                      aria-label={mostrarConfirmar ? "Ocultar confirmación" : "Ver confirmación"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b0bfd0] hover:text-[#0a2342] transition cursor-pointer"
                    >
                      {mostrarConfirmar ? <IconoOjoCerrado className="size-4.5" /> : <IconoOjo className="size-4.5" />}
                    </button>
                  </div>
                  {errorCampo?.campo === "confirmarPassword" ? (
                    <p id="confirmar-error" role="alert" className="text-[11.5px] font-bold text-[#b33c3c]">
                      {errorCampo.mensaje}
                    </p>
                  ) : hayConfirmacion ? (
                    <div className={["flex items-center gap-1.5 text-[12px] font-semibold mt-0.5", coincidePassword ? "text-[#1f6b4a]" : "text-[#b33c3c]"].join(" ")}>
                      {coincidePassword ? (
                        <>
                          <IconoCheckCirculo className="size-3.5" />
                          <span>Las contraseñas coinciden</span>
                        </>
                      ) : (
                        <>
                          <IconoAlertaTriangulo className="size-3.5" />
                          <span>Las contraseñas no coinciden</span>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Términos y condiciones */}
                <div className="pt-1">
                  <label className="flex cursor-pointer items-start gap-3 select-none">
                    <input
                      ref={terminosRef}
                      type="checkbox"
                      checked={aceptaTerminos}
                      onChange={(e) => {
                        setAceptaTerminos(e.target.checked);
                        if (errorCampo?.campo === "terminos") setErrorCampo(null);
                      }}
                      aria-invalid={errorCampo?.campo === "terminos" ? "true" : undefined}
                      aria-describedby={errorCampo?.campo === "terminos" ? "terminos-error" : undefined}
                      className="mt-0.5 size-5 shrink-0 rounded-md border-2 border-[#d5e2f0] accent-[#0a2342] cursor-pointer"
                    />
                    <span className="text-[12.5px] font-medium text-[#4d6079] leading-snug">
                      Acepto los{" "}
                      <Link
                        href="/legal/terminos"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#2e5a88] hover:underline"
                      >
                        Términos y condiciones
                      </Link>{" "}
                      y el{" "}
                      <Link
                        href="/legal/privacidad"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-[#2e5a88] hover:underline"
                      >
                        Aviso de privacidad
                      </Link>{" "}
                      de Ruum Ruum.
                    </span>
                  </label>
                  {errorCampo?.campo === "terminos" && (
                    <p id="terminos-error" role="alert" className="mt-1.5 text-[11.5px] font-bold text-[#b33c3c]">
                      {errorCampo.mensaje}
                    </p>
                  )}
                </div>
              </div>

              {/* Error general */}
              {error && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-800">
                  <IconoAlertaTriangulo className="size-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Botón Crear cuenta */}
              <button
                type="submit"
                disabled={enviando}
                aria-busy={enviando}
                className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-[18px] bg-[#0a2342] py-4 px-5 text-[16px] font-bold text-white shadow-[0_14px_28px_-10px_rgba(11,30,51,0.45)] transition hover:bg-[#143560] active:scale-[0.98] disabled:opacity-60"
              >
                <IconoUsuarioPlus className="size-5 text-white" />
                <span>{enviando ? "Creando tu cuenta…" : "Crear cuenta"}</span>
              </button>

              {/* Enlace a Login */}
              <div className="mt-4 text-center text-[13px] font-medium text-[#4e5f80]">
                ¿Ya tienes cuenta?
                <Link href="/login" className="ml-1 font-bold text-[#0a2342] hover:underline">
                  Inicia sesión
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* ═════════════════════════════════════════════════════════
            OVERLAY DE PROCESAMIENTO
        ═════════════════════════════════════════════════════════ */}
        {enviando && (
          <div
            role="status"
            aria-live="polite"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm p-6 text-center animate-fade-in"
          >
            <div className="size-14 rounded-full border-4 border-[#e8eef6] border-t-[#0a2342] animate-spin mb-4" />
            <h3 className="text-[19px] font-extrabold text-[#0a2342] tracking-tight mb-1">
              Creando tu cuenta...
            </h3>
            <p className="text-[13px] font-medium text-[#4e5f80]">
              Estamos registrando tus credenciales.
            </p>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            MODAL VERIFICACIÓN SMS (TWILIO VERIFY)
        ═════════════════════════════════════════════════════════ */}
        {modalVerificacionAbierto && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-sms-titulo"
            aria-describedby="modal-sms-desc"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          >
            <div className="relative w-full max-w-md rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl border border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setModalVerificacionAbierto(false);
                  telefonoRef.current?.focus();
                }}
                aria-label="Cerrar modal de verificación"
                className="absolute right-4.5 top-4.5 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
              >
                ✕
              </button>

              <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#f0f5fe] text-[#2e5a88]">
                <svg className="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z" />
                </svg>
              </div>

              <h2 id="modal-sms-titulo" className="text-center text-[20px] font-extrabold tracking-tight text-[#0a2342]">
                Verifica tu número celular
              </h2>
              <p id="modal-sms-desc" className="mt-1 text-center text-[13px] font-medium text-[#4e5f80] leading-relaxed">
                Enviamos un código de 6 dígitos por SMS al número{" "}
                <strong className="font-bold text-[#0a2342]">
                  +52 {telefono.length === 10 ? `${telefono.slice(0, 2)} ${telefono.slice(2, 6)} ${telefono.slice(6, 10)}` : telefono}
                </strong>.
              </p>

              <div className="text-center mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setModalVerificacionAbierto(false);
                    telefonoRef.current?.focus();
                  }}
                  className="text-[12px] font-bold text-[#2e5a88] hover:underline cursor-pointer"
                >
                  Editar número de teléfono
                </button>
              </div>

              <form onSubmit={confirmarCodigoOtp} className="mt-5 flex flex-col gap-3.5" noValidate>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="codigo-sms" className="text-center text-[11px] font-bold uppercase tracking-wider text-[#4e5f80]">
                    Código de verificación SMS
                  </label>
                  <input
                    id="codigo-sms"
                    ref={otpRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={codigoOtp}
                    onChange={(e) => {
                      setCodigoOtp(soloDigitos(e.target.value, 6));
                      if (errorOtp) setErrorOtp(null);
                    }}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.35em] font-mono text-2xl font-bold py-3.5 px-4 rounded-2xl border border-slate-300 bg-slate-50 text-[#0a2342] placeholder:text-slate-400 focus:border-[#0a2342] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#0a2342]/10 transition"
                    required
                  />
                </div>

                {errorOtp && (
                  <div role="alert" className="rounded-xl bg-red-50 p-3 border border-red-200 text-center">
                    <p className="text-xs text-red-700 font-bold">{errorOtp}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={codigoOtp.length !== 6 || verificandoOtp}
                  className="w-full rounded-2xl bg-[#0a2342] py-3.5 px-4 text-[15px] font-bold text-white shadow-lg transition hover:bg-[#143560] active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {verificandoOtp ? "Verificando código…" : "Verificar y continuar"}
                </button>

                <div className="flex flex-col items-center gap-1 pt-1 text-center">
                  {segundosReenvio > 0 ? (
                    <p className="text-[12px] font-medium text-[#4e5f80]">
                      Reenviar código en <span className="font-bold text-[#0a2342]">{segundosReenvio}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => enviarOtpSms(soloDigitos(telefono, 10))}
                      disabled={enviandoOtp}
                      className="text-[12px] font-bold text-[#2e5a88] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {enviandoOtp ? "Enviando código…" : "¿No recibiste el código? Reenviar SMS"}
                    </button>
                  )}
                  <span className="text-[11px] font-medium text-[#4e5f80]">
                    El código tiene una vigencia de 10 minutos.
                  </span>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
