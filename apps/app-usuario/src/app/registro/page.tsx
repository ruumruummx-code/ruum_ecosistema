"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Aviso, Field } from "@ruum/ui";
import { fortalezaPassword, passwordCumpleRequisitos, requisitosPassword, traducirErrorAuth } from "@ruum/shared/utils";
import { registrarEventoUx } from "../../lib/analytics";
import { tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import {
  CLAVE_CORREO_CONFIRMACION,
  normalizarCorreoRegistro,
  soloDigitos,
  telefonoLocalMx,
} from "../../lib/registro-usuario";
import {
  botonAzul,
  botonContorno,
  CampoOscuro,
} from "../experiencia-publica";
import { NavegacionUsuario } from "../NavegacionUsuario";

/* Barra de progreso visual */
function BarraProgreso({ paso }: { paso: 1 | 2 }) {
  return (
    <ol className="mb-7 grid grid-cols-2 gap-3" aria-label="Progreso del registro">
      {[1, 2].map((n) => (
        <li key={n} className="flex min-w-0 flex-col gap-2" aria-current={n === paso ? "step" : undefined}>
          <div
            className={[
              "h-1.5 rounded-full transition-all duration-300",
              n <= paso ? "bg-[var(--ruum-teal)]" : "bg-slate-200",
            ].join(" ")}
          />
          <span className={[
            "font-body text-xs transition-colors duration-200",
            n === paso ? "font-bold text-[var(--ruum-teal-deep)]" : "font-medium text-slate-500",
          ].join(" ")}>
            {n === 1 ? "Datos básicos" : "Acceso"}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ─────────────────────────────────────────
   Componente principal
───────────────────────────────────────── */
export default function PaginaRegistro() {
  const router = useRouter();

  /* Paso 1: datos básicos */
  const [tipoCuenta, setTipoCuenta] = useState<"personal" | "empresa">("personal");
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
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  /* Estado de la UI */
  const [paso, setPaso] = useState<1 | 2>(1);
  const [enviando, setEnviando] = useState(false);
  /* ACC-3 (auditoría): separamos el error global (fallo de envío) del error de
     campo, que se asocia al input y mueve el foco. */
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

  /* ── Validación paso 1 ──
     ACC-3 (auditoría): antes devolvía un único string que se pintaba como Aviso
     global, sin asociación con el campo ni movimiento de foco. Ahora se devuelve
     el campo culpable para poder marcarlo y enfocarlo. */
  function validarPaso1(): { campo: string; mensaje: string } | null {
    if (!nombre.trim()) return { campo: "nombre", mensaje: "Escribe tu nombre." };
    if (!apellido.trim()) return { campo: "apellido", mensaje: "Escribe tu apellido." };
    const tel = soloDigitos(telefono);
    if (tel.length !== 10) return { campo: "telefono", mensaje: "El teléfono debe tener 10 dígitos." };
    return null;
  }

  /* ── Validación paso 2 ── */
  function validarPaso2(): { campo: string; mensaje: string } | null {
    const correo = normalizarCorreoRegistro(email);
    if (!correo) return { campo: "email", mensaje: "Escribe tu correo electrónico." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      return { campo: "email", mensaje: "El formato del correo no es válido." };
    /* BUGFIX: antes solo se validaba longitud>=8 en el cliente. El servidor de
       Supabase Auth en supabase/config.toml fija ahora el mismo criterio
       (password_requirements = "lower_upper_letters_digits",
        minimum_password_length = 8), así que cliente y servidor coinciden. */
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

  /** Muestra el error en el campo correcto, lo marca y mueve el foco allí. */
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

  /* ── Crear cuenta ── */
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

      /* CORRECCIÓN rate-limit: el signUp directo desde el navegador no tenía
         throttling de aplicación. Ahora pasa por /api/auth/signup (10/h IP,
         5/h correo), que valida y crea la cuenta en servidor. */
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
          aceptaTerminos,
          tokenVerificacionTelefono,
        }),
        cache: "no-store",
      });
      const cuerpo = (await res.json().catch(() => null)) as {
        error?: string;
        requiereConfirmacion?: boolean;
        correo?: string;
      } | null;
      if (!res.ok) {
        /* El servidor ya devuelve copy listo y genérico (sin enumerar
           correos); se muestra tal cual en vez de traducir el error. */
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
        } catch { /* La pantalla también funciona si el navegador bloquea storage. */ }
        registrarEventoUx("registro_exitoso", { tipo_cuenta: tipoCuenta, requiere_confirmacion: true });
        /* CORRECCIÓN (auditoría S-8): el correo en el query string quedaba en los access
           logs del CDN, en el header Referer y en el historial del navegador. Es
           redundante: ya se guarda en sessionStorage y la pantalla lo recupera. */
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
      <div className="min-h-screen bg-[#f3f6f9]">
        <NavegacionUsuario titulo="¡Crea tu cuenta!" mostrarEnAcceso mostrarNavegacionInferior={false} />
        <main className="ruum-force-light px-4 py-10 sm:px-6">
          <section className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-md sm:p-8">
            <h1 className="font-display text-2xl font-extrabold text-[#0a2342]">Crear cuenta</h1>
            <div className="mt-6">
              <Aviso tono="danger">
                Supabase no está configurado. El registro no está disponible en este entorno.
              </Aviso>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6f9]">
      <NavegacionUsuario
        titulo={paso === 1 ? "¡Crea tu cuenta!" : "Configura tu acceso"}
        mostrarEnAcceso
        mostrarNavegacionInferior={false}
      />
      <main className="ruum-force-light min-h-[calc(100vh-80px)] bg-[#f3f6f9] px-4 py-8 sm:px-6 sm:py-10">
        <section className="mx-auto flex w-full max-w-xl flex-col">
        {/* Navegación superior */}
        <div className="flex items-center justify-between">
          {paso === 2 ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setErrorCampo(null);
                setPaso(1);
                requestAnimationFrame(() => nombreRef.current?.focus());
              }}
              className="cursor-pointer font-body text-xs font-semibold text-[var(--ruum-teal-deep)] transition duration-200 hover:text-[#0a2342]"
            >
              ← Atrás
            </button>
          ) : (
            <Link href="/" className="cursor-pointer font-body text-xs font-semibold text-[var(--ruum-teal-deep)] transition duration-200 hover:text-[#0a2342]">
              ← Atrás
            </Link>
          )}
          <span className="font-body text-xs font-medium text-slate-500">Paso {paso} de 2</span>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 py-7 shadow-md sm:px-8 sm:py-8">
          <BarraProgreso paso={paso} />

          {/* ════════════ PASO 1 ════════════ */}
          {paso === 1 && (
              /* ACC-3 (auditoría): el paso 1 no era un <form>. El botón era
                 type="button", así que Enter no enviaba y no había validación
                 nativa ni punto de asociación semántico. */
              <form onSubmit={avanzarPaso2} noValidate>
              <h1 className="font-display text-[22px] font-extrabold leading-tight text-text-primary">
                Tus datos básicos
              </h1>
              <p className="mt-2 font-body text-xs leading-5 text-text-secondary">
                Solo necesitamos tus datos básicos para empezar.
              </p>

              {/* Tipo de cuenta */}
              <div className="mt-6 grid grid-cols-2 gap-2">
                {(["personal", "empresa"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoCuenta(tipo)}
                    className={[
                      "rounded-lg border py-2.5 font-body text-sm font-semibold transition",
                      tipoCuenta === tipo
                        ? "border-[var(--ruum-teal-deep)] bg-[var(--ruum-teal)]/10 text-[var(--ruum-teal-deep)] shadow-sm"
                        : "border-slate-200 text-slate-500 hover:border-[var(--ruum-teal)] hover:text-[#0a2342]",
                    ].join(" ")}
                  >
                    {tipo === "personal" ? "Personal" : "Empresa"}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-4">
                <CampoOscuro
                  ref={nombreRef}
                  etiqueta="Nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => { setNombre(e.target.value); if (errorCampo?.campo === "nombre") setErrorCampo(null); }}
                  error={errorCampo?.campo === "nombre" ? errorCampo.mensaje : undefined}
                  required
                  autoComplete="given-name"
                  placeholder="Carlos"
                />
                <CampoOscuro
                  ref={apellidoRef}
                  etiqueta="Apellido"
                  type="text"
                  value={apellido}
                  onChange={(e) => { setApellido(e.target.value); if (errorCampo?.campo === "apellido") setErrorCampo(null); }}
                  error={errorCampo?.campo === "apellido" ? errorCampo.mensaje : undefined}
                  required
                  autoComplete="family-name"
                  placeholder="Mendoza"
                />
                <div className="relative">
                  <CampoOscuro
                    ref={telefonoRef}
                    etiqueta="Teléfono celular"
                    type="tel"
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
                    error={errorCampo?.campo === "telefono" ? errorCampo.mensaje : undefined}
                    required
                    autoComplete="tel"
                    placeholder="55 1234 5678"
                    ayuda={
                      telefonoVerificado ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                          <span aria-hidden>✓</span> Verificado por SMS
                        </span>
                      ) : (
                        "Para notificaciones de tu traslado. Sin código de país."
                      )
                    }
                    inputMode="numeric"
                  />
                  {telefonoVerificado && (
                    <span className="pointer-events-none absolute right-3 top-8 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      ✓ Verificado
                    </span>
                  )}
                </div>
              </div>

              {/* ACC-5 (auditoría): role="alert" en vez de role="status" +
                  aria-live="polite", que retrasaba el anuncio de un error. */}
              {error && (
              <div role="alert" aria-atomic="true" className="mt-4">
                <Aviso tono="danger">{error}</Aviso>
              </div>
            )}

              <button type="submit" disabled={enviandoOtp} className={`${botonAzul} mt-6`}>
                {enviandoOtp ? "Enviando código SMS…" : "Continuar"}
              </button>
              </form>
          )}

          {/* ════════════ PASO 2 ════════════ */}
          {paso === 2 && (
            <form className="grid gap-4" onSubmit={crearCuenta} noValidate>
              <h1 className="font-display text-[22px] font-extrabold leading-tight text-text-primary">
                Elige tus credenciales
              </h1>
              <p className="font-body text-xs leading-5 text-text-secondary">
                Con esto accederás a tu cuenta y recibirás notificaciones de tus traslados.
              </p>

              <CampoOscuro
                ref={emailRef}
                etiqueta="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errorCampo?.campo === "email") setErrorCampo(null); }}
                error={errorCampo?.campo === "email" ? errorCampo.mensaje : undefined}
                required
                autoComplete="email"
                placeholder="correo@ejemplo.com"
              />

              <div className="flex flex-col gap-1.5">
                  <Field
                    ref={passwordRef}
                    etiqueta="Contraseña"
                    etiquetaClassName="text-text-secondary text-xs font-medium"
                    type="password"
                    passwordToggleClassName="text-text-secondary hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-focus"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errorCampo?.campo === "password") setErrorCampo(null); }}
                    error={errorCampo?.campo === "password" ? errorCampo.mensaje : undefined}
                    required
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    /* ACC-9 (auditoría): placeholder slate-400 sobre blanco = 2.56:1.
                       slate-500 alcanza 4.6:1 y sigue siendo tenue. */
                    className="border-slate-300 bg-white text-[#0a2342] placeholder:text-slate-500 focus:border-[var(--ruum-teal-deep)] focus:ring-[var(--ruum-teal)]/25"
                  />
                {password.length > 0 && (
                  <>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          className={[
                            "h-1 flex-1 rounded-full transition-all",
                            n <= pwd.nivel
                              ? pwd.nivel === 1
                                ? "bg-red-500"
                                : pwd.nivel === 2
                                ? "bg-warning"
                                : "bg-green-500"
                              : "bg-border-strong",
                          ].join(" ")}
                        />
                      ))}
                    </div>
                    {pwd.etiqueta && (
                      <span className="font-body text-xs leading-5 text-text-tertiary">
                        {pwd.etiqueta}
                      </span>
                    )}
                  </>
                )}
                {/* Requisitos exigidos por el servidor (mismo patrón que app-conductor) */}
                <ul className="mt-1 flex flex-col gap-1 font-body text-xs leading-5" aria-label="Requisitos de contraseña">
                  {requisitosPassword(password).map((requisito) => {
                    const etiquetas: Record<string, string> = {
                      longitud: "Mínimo 8 caracteres",
                      minuscula: "Al menos una letra minúscula",
                      mayuscula: "Al menos una letra mayúscula",
                      numero: "Al menos un número",
                    };
                    return (
                      <li
                        key={requisito.clave}
                        className={requisito.cumplido ? "text-success" : "text-text-tertiary"}
                      >
                        {requisito.cumplido ? "✓" : "○"} {etiquetas[requisito.clave]}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <Field
                ref={confirmarRef}
                etiqueta="Confirmar contraseña"
                etiquetaClassName="text-text-secondary text-xs font-medium"
                type="password"
                passwordToggleClassName="text-text-secondary hover:bg-surface-elevated hover:text-text-primary focus-visible:outline-focus"
                value={confirmarPassword}
                onChange={(e) => { setConfirmarPassword(e.target.value); if (errorCampo?.campo === "confirmarPassword") setErrorCampo(null); }}
                error={errorCampo?.campo === "confirmarPassword" ? errorCampo.mensaje : undefined}
                required
                autoComplete="new-password"
                placeholder="Repite tu contraseña"
                className="border-slate-300 bg-white text-[#0a2342] placeholder:text-slate-500 focus:border-[var(--ruum-teal-deep)] focus:ring-[var(--ruum-teal)]/25"
              />

              {/* Términos — inline, no como .docx descargable */}
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface-elevated p-3.5">
                <input
                  ref={terminosRef}
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={(e) => { setAceptaTerminos(e.target.checked); if (errorCampo?.campo === "terminos") setErrorCampo(null); }}
                  aria-invalid={errorCampo?.campo === "terminos" ? true : undefined}
                  aria-describedby={errorCampo?.campo === "terminos" ? "terminos-error" : undefined}
                  className="mt-0.5 flex-shrink-0 accent-[#f5a623]"
                />
                <span className="font-body text-xs leading-5 text-text-secondary">
                  Acepto los{" "}
                  <Link
                    href="/legal/terminos"
                    className="text-route-action underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Términos y condiciones
                  </Link>{" "}
                  y el{" "}
                  <Link
                    href="/legal/privacidad"
                    className="text-route-action underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Aviso de privacidad
                  </Link>{" "}
                  de Ruum Ruum.
                </span>
              </label>

              {errorCampo?.campo === "terminos" && (
                <p id="terminos-error" role="alert" className="font-body text-xs leading-5 text-[var(--ruum-signal)]">
                  {errorCampo.mensaje}
                </p>
              )}

              {/* ACC-5 (auditoría): role="alert" para errores, no status/polite. */}
              {error && (
              <div role="alert" aria-atomic="true">
                <Aviso tono="danger">{error}</Aviso>
              </div>
            )}

              <button type="submit" disabled={enviando} aria-busy={enviando} className={`${botonAzul} mt-1`}>
                {enviando ? "Creando cuenta…" : "Crear cuenta"}
              </button>
            </form>
          )}
        </div>

        {paso === 1 && (
          <Link href="/login" className={`${botonContorno} mt-4`}>
            Ya tengo cuenta — iniciar sesión
          </Link>
        )}
        </section>
      </main>

      {/* ════════════ MODAL VERIFICACIÓN SMS ════════════ */}
      {modalVerificacionAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-sms-titulo"
          aria-describedby="modal-sms-desc"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-7 border border-slate-100">
            {/* Botón cerrar */}
            <button
              type="button"
              onClick={() => {
                setModalVerificacionAbierto(false);
                telefonoRef.current?.focus();
              }}
              aria-label="Cerrar modal de verificación"
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[var(--ruum-teal)]"
            >
              ✕
            </button>

            {/* Icono de teléfono / SMS */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0a2342]/5 text-[#0a2342] mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 id="modal-sms-titulo" className="font-display text-xl font-extrabold text-[#0a2342]">
              Verifica tu número celular
            </h2>
            <p id="modal-sms-desc" className="mt-1 font-body text-xs text-slate-600 leading-relaxed">
              Enviamos un código de 6 dígitos por SMS al número{" "}
              <strong className="font-semibold text-slate-900">
                +52 {telefono.length === 10 ? `${telefono.slice(0, 2)} ${telefono.slice(2, 6)} ${telefono.slice(6, 10)}` : telefono}
              </strong>.
            </p>

            <button
              type="button"
              onClick={() => {
                setModalVerificacionAbierto(false);
                telefonoRef.current?.focus();
              }}
              className="mt-1 inline-block text-xs font-semibold text-[var(--ruum-teal-deep)] hover:underline cursor-pointer"
            >
              Editar número de teléfono
            </button>

            <form onSubmit={confirmarCodigoOtp} className="mt-5 space-y-4" noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="codigo-sms" className="font-body text-xs font-medium text-slate-700">
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
                  className="w-full text-center tracking-[0.35em] font-mono text-2xl font-bold py-2.5 px-4 rounded-xl border border-slate-300 bg-slate-50 text-[#0a2342] placeholder:text-slate-400 focus:border-[var(--ruum-teal-deep)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--ruum-teal)]/20 transition"
                  required
                />
              </div>

              {errorOtp && (
                <div role="alert" className="rounded-lg bg-red-50 p-3 border border-red-200">
                  <p className="font-body text-xs text-red-700 font-medium">{errorOtp}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={codigoOtp.length !== 6 || verificandoOtp}
                className={`${botonAzul} w-full`}
              >
                {verificandoOtp ? "Verificando código…" : "Verificar y continuar"}
              </button>

              <div className="flex flex-col items-center gap-1.5 pt-1 text-center">
                {segundosReenvio > 0 ? (
                  <p className="font-body text-xs text-slate-500">
                    Reenviar código en <span className="font-semibold text-slate-700">{segundosReenvio}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => enviarOtpSms(soloDigitos(telefono, 10))}
                    disabled={enviandoOtp}
                    className="font-body text-xs font-semibold text-[var(--ruum-teal-deep)] hover:text-[#0a2342] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {enviandoOtp ? "Enviando código…" : "¿No recibiste el código? Reenviar SMS"}
                  </button>
                )}
                <span className="font-body text-[11px] text-slate-400">
                  El código tiene una vigencia de 10 minutos.
                </span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
