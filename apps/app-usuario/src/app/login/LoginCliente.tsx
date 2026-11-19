"use client";

import { obtenerDispositivo } from "@/lib/device-id";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Bell, CarFront, ChevronDown, CreditCard, Eye, EyeOff, FileText, Globe, LockKeyhole, Mail } from "lucide-react";
import { Aviso } from "@ruum/ui";
import { Button, Card, Input, InputConIcono, Label, NativeSelect } from "@ruum/ui/base";
import styles from "./login.module.css";
import { traducirErrorAuth } from "@ruum/shared/utils";
import { normalizarCorreoRegistro } from "../../lib/registro-usuario";
import { registrarEventoUx } from "../../lib/analytics";
import { obtenerHeadersCsrf } from "../../lib/csrf";
import { tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { VerificacionHumana } from "../../components/VerificacionHumana";

interface LoginClienteProps {
  motivo: string | null;
  siguiente: string;
  /** Mensaje de éxito a mostrar (p. ej. tras restablecer la contraseña). */
  aviso?: string | null;
}

const beneficios = [
  { icono: CarFront, titulo: "Traslados", detalle: "Gestión en tiempo real" },
  { icono: FileText, titulo: "Documentación", detalle: "Todo en un solo lugar" },
  { icono: CreditCard, titulo: "Pagos", detalle: "Procesos simples y seguros" },
  { icono: Bell, titulo: "Incidencias y alertas", detalle: "Respuesta oportuna" },
];

const claveCorreo = "ruum-login-correo";
const enlace = "text-sm font-semibold text-ui-brand hover:underline";
const campo = "h-12 rounded-xl bg-ui-muted aria-invalid:border-ui-danger";

function MarcaLogin({ clara = false }: { clara?: boolean }) {
  return (
    <div className={clara ? styles.logo : styles.logoTarjeta}>
      {/* El SVG local conserva su formato y evita los estilos en línea del optimizador. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={clara ? "/ruum-logo-dark.svg" : "/ruum-logo.svg"} alt="Ruum Ruum" width={260} height={56} />
      <span>Tu traslado, tu control</span>
    </div>
  );
}

export function LoginCliente({ motivo, siguiente, aviso }: LoginClienteProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [recordar, setRecordar] = useState(false);

  useEffect(() => {
    try {
      const correoGuardado = localStorage.getItem(claveCorreo);
      if (correoGuardado) {
        setEmail(correoGuardado);
        setRecordar(true);
      }
    } catch {
      // El almacenamiento puede estar deshabilitado en el navegador.
    }
  }, []);

  function actualizarPreferencia(activar: boolean) {
    setRecordar(activar);
    if (!activar) {
      try {
        localStorage.removeItem(claveCorreo);
      } catch {
        // La preferencia no debe bloquear el acceso.
      }
    }
  }
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tocados, setTocados] = useState({ email: false, password: false });
  const [captchaRequerido, setCaptchaRequerido] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recibirToken = useCallback((token: string | null) => setCaptchaToken(token), []);
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
      const emailNormalizado = normalizarCorreoRegistro(email);
      const dispositivo = obtenerDispositivo();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: obtenerHeadersCsrf({
          "Content-Type": "application/json",
          ...(dispositivo ? { "x-device-id": dispositivo } : {}),
        }),
        body: JSON.stringify({
          email: emailNormalizado,
          password,
          captchaToken: captchaToken ?? undefined,
        }),
        signal: AbortSignal.timeout(12_000),
      });
      const cuerpo = (await res.json().catch(() => null)) as { error?: string; captchaRequerido?: boolean } | null;
      if (res.status === 428 && cuerpo?.captchaRequerido) {
        // El token de Turnstile es de un solo uso: se pide uno nuevo.
        setCaptchaRequerido(true);
        setCaptchaToken(null);
      }
      if (!res.ok) throw new Error(cuerpo?.error ?? "No pudimos iniciar sesión.");
      setCaptchaRequerido(false);
      setCaptchaToken(null);
      registrarEventoUx("login_exitoso", {
        reason: motivo,
        destino_protegido: siguiente !== "/",
      });
      if (recordar) {
        try {
          localStorage.setItem(claveCorreo, emailNormalizado);
        } catch {
          // La preferencia no debe bloquear el acceso.
        }
      }
      router.push(siguiente);
      router.refresh();
    } catch (err) {
      const nombre = err instanceof Error ? err.name : "";
      if (nombre === "TimeoutError" || nombre === "AbortError") {
        setError("El servidor tardó demasiado en responder. Revisa tu conexión e inténtalo de nuevo.");
      } else if (err instanceof TypeError) {
        setError("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
      } else {
        setError(err instanceof Error ? err.message : traducirErrorAuth(err));
      }
      registrarEventoUx("login_error", { reason: motivo });
    } finally {
      setEnviando(false);
    }
  }


  const configurado = tieneSupabaseConfigurado();

  return (
    <main className={styles.pagina}>
      <section aria-label="Información de bienvenida y propuesta de valor" className={styles.marca}>
        <div className={styles.foto} aria-hidden="true" />
        <div className={styles.conexiones} aria-hidden="true" />
        <MarcaLogin clara />
        <div className={styles.propuesta}>
          <h1 className="font-extrabold tracking-tight">
            Movilidad<br /> que conecta<br /> <span>operaciones</span>
          </h1>
          <p>Seguridad, evidencia y trazabilidad en cada traslado.</p>
          <ul className={styles.beneficios}>
            {beneficios.map(({ icono: Icono, titulo, detalle }) => (
              <li key={titulo}>
                <span className={styles.icono}><Icono aria-hidden="true" /></span>
                <div>
                  <p className="font-semibold">{titulo}</p>
                  <p className="text-sm">{detalle}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className={styles.lema}>CONDUCIENDO<br /> OPERACIONES MÁS INTELIGENTES</p>
      </section>

      <section aria-label="Formulario de inicio de sesión" className={styles.panel}>
        <div className={styles.idioma}>
          <Globe size={18} aria-hidden="true" />
          <NativeSelect aria-label="Idioma" defaultValue="es" className="appearance-none border-0 bg-transparent py-0 pl-8 pr-7 text-sm font-semibold shadow-none">
            <option value="es">ES</option>
          </NativeSelect>
          <ChevronDown size={14} aria-hidden="true" />
        </div>

        <Card className={styles.tarjeta}>
          <MarcaLogin />
          <header className={styles.encabezado}>
            <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">Bienvenido</h2>
            <p className="mt-1 text-base text-ui-fg-muted">Ingresa a la Torre de Control para gestionar tus operaciones.</p>
          </header>

          {aviso && <div role="status"><Aviso tono="success">{aviso}</Aviso></div>}
          {motivo === "email_confirmation" && (
            <div role="status"><Aviso tono="atencion">Para solicitar tu primer traslado debes confirmar tu correo e iniciar sesión.</Aviso></div>
          )}
          {motivo === "cuenta_distinta" && (
            <div role="status"><Aviso tono="atencion">El enlace que abriste pertenece a otra cuenta. Mantuvimos tu sesión actual; si quieres usar la otra cuenta, cierra sesión e ingresa con ella.</Aviso></div>
          )}
          {motivo === "authentication_required" && (
            <div role="status"><Aviso tono="atencion">Inicia sesión para solicitar un traslado. Si acabas de registrarte, confirma primero tu correo.</Aviso></div>
          )}

          {configurado ? (
            <form onSubmit={iniciarSesion} noValidate className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="login-email">Correo electrónico</Label>
                <InputConIcono
                  ref={correoRef}
                  id="login-email"
                  name="email"
                  type="email"
                  icono={<Mail />}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  onBlur={() => setTocados((actual) => ({ ...actual, email: true }))}
                  aria-invalid={Boolean(mostrarErrorCorreo)}
                  aria-describedby={mostrarErrorCorreo ? "login-email-error" : undefined}
                  autoComplete="username"
                  placeholder="ruum.ruum.mx@gmail.com"
                  required
                  className={campo}
                />
                {mostrarErrorCorreo && <p id="login-email-error" role="alert" className="text-sm text-ui-danger">{mostrarErrorCorreo}</p>}
              </div>
              <div className="grid gap-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Link href="/recuperar-password" prefetch={false} className={enlace}>¿Olvidaste tu contraseña?</Link>
                </div>
                <InputConIcono
                  ref={passwordRef}
                  id="login-password"
                  name="password"
                  type={passwordVisible ? "text" : "password"}
                  icono={<LockKeyhole />}
                  accion={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setPasswordVisible((visible) => !visible)}
                    >
                      {passwordVisible ? <EyeOff /> : <Eye />}
                    </Button>
                  }
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  onBlur={() => setTocados((actual) => ({ ...actual, password: true }))}
                  aria-invalid={Boolean(mostrarErrorPassword)}
                  aria-describedby={mostrarErrorPassword ? "login-password-error" : undefined}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  className={campo}
                />
                {mostrarErrorPassword && <p id="login-password-error" role="alert" className="text-sm text-ui-danger">{mostrarErrorPassword}</p>}
              </div>
              <Label className="flex cursor-pointer items-center gap-2 text-ui-fg-muted">
                <Input type="checkbox" checked={recordar} onChange={(e) => actualizarPreferencia(e.target.checked)} className="size-5 cursor-pointer accent-ui-brand" />
                Recordarme en este dispositivo
              </Label>
              {captchaRequerido && <VerificacionHumana key={error ?? "captcha"} onToken={recibirToken} />}
              {error && <div role="alert"><Aviso tono="danger">{error}</Aviso></div>}
              <Button type="submit" disabled={enviando || (captchaRequerido && !captchaToken)} size="lg" className={styles.ingresar}>
                {enviando ? "Iniciando sesión…" : "Ingresar"}
                {!enviando && <ArrowRight aria-hidden="true" />}
              </Button>
            </form>
          ) : (
            <Aviso tono="danger">Supabase no está configurado todavía. El inicio de sesión no está disponible en este entorno.</Aviso>
          )}

          <div className={styles.separador} aria-hidden="true">o</div>
          <p className={styles.acceso}>
            ¿No tienes una cuenta?{" "}
            <Link href="/registro" prefetch={false} className={enlace}>Solicita acceso</Link>
          </p>
        </Card>

        <footer className={styles.pie}>RUUM RUUM<br /> TORRE DE CONTROL</footer>
      </section>
    </main>
  );
}
