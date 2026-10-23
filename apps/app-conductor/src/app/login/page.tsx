"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@ruum/ui";
import { traducirErrorAuth, validarDestinoSeguro } from "@ruum/shared/utils";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { onboardingVisto } from "../../lib/onboarding-visto";
import { esEmailLoginValido, validarCredencialesLogin } from "./login-validation";

import styles from "./login.module.css";

function LoginSkeleton() {
  return (
    <div className={styles.loading} aria-busy="true">
      <output>Cargando acceso…</output>
    </div>
  );
}

function FormularioLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destinoPostLogin = validarDestinoSeguro(searchParams.get("next"), "/panel");

  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  // Primer arranque: mostrar el recorrido de bienvenida antes del acceso.
  useEffect(() => {
    let activo = true;
    onboardingVisto()
      .then((visto) => {
        if (activo && !visto) {
          router.replace("/onboarding");
          return;
        }
        if (activo) setCheckingOnboarding(false);
      })
      .catch(() => {
        if (activo) setCheckingOnboarding(false);
      });
    return () => {
      activo = false;
    };
  }, [router]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const validarEmail = (value: string) => {
    if (!value) {
      setEmailError(null);
      return;
    }
    if (!esEmailLoginValido(value)) {
      setEmailError("Formato de correo inválido");
    } else {
      setEmailError(null);
    }
  };

  const manejarCambioEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validarEmail(value);
  };

  const manejarBlurEmail = () => {
    if (email && !emailError) {
      validarEmail(email);
    }
  };

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();
    const credencialInvalida = validarCredencialesLogin(email, password);
    if (credencialInvalida === "email") {
      setEmailError("Formato de correo inválido");
      return;
    }
    if (credencialInvalida === "password") {
      setError("Ingresa tu contraseña para continuar.");
      return;
    }
    if (emailError) return;

    setEnviando(true);
    setError(null);

    try {
      const cliente = crearClienteNavegador();
      const { error: errorAuth } = await cliente.auth.signInWithPassword({ email: email.trim(), password });
      if (errorAuth) throw errorAuth;
      router.replace(destinoPostLogin);
    } catch (err) {
      setError(traducirErrorAuth(err));
    } finally {
      setEnviando(false);
    }
  }

  if (checkingOnboarding) {
    return <LoginSkeleton />;
  }

  const supabaseNoConfigurado = !tieneSupabaseConfigurado();

  return (
    <>
      <section className={styles.content} aria-labelledby="titulo-inicio-conductor">
        <header className={styles.header}>
          <Image src="/imagenes/ruum-logo.svg" alt="Ruum Ruum" width={190} height={62} priority className={styles.logo} />
          <div className={styles.intro}>
            <h1 id="titulo-inicio-conductor">Iniciar sesión</h1>
            <p>Ingresa para comenzar a conducir con nosotros</p>
          </div>
        </header>
        <form className={styles.form} onSubmit={iniciarSesion} noValidate>
          <div className={styles.field}>
            <svg className={styles.fieldIcon} width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
            <label htmlFor="correo-conductor">Correo</label>
            <input id="correo-conductor" name="email" type="email" value={email}
              onChange={manejarCambioEmail} onBlur={manejarBlurEmail} required
              autoComplete="username" inputMode="email" enterKeyHint="next"
              autoCapitalize="none" autoCorrect="off" spellCheck={false}
              aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "login-status" : undefined}
              disabled={supabaseNoConfigurado} placeholder="tu@correo.com" />
          </div>
          <div className={styles.field}>
            <svg className={styles.fieldIcon} width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v2" /></svg>
            <label htmlFor="password-conductor">Contraseña</label>
            <input id="password-conductor" name="password" type={mostrarContrasena ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)} required
              autoComplete="current-password" enterKeyHint="go" disabled={supabaseNoConfigurado} placeholder="Ingresa tu contraseña" />
            <button type="button" className={styles.visibility} onClick={() => setMostrarContrasena((visible) => !visible)} aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}>
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.7" />{!mostrarContrasena && <path d="M3 3l18 18" />}</svg>
            </button>
          </div>
          <Link className={styles.recovery} href="/recuperar-password">¿Olvidaste tu contraseña?</Link>
          {(supabaseNoConfigurado || emailError || error) && (
            <p id="login-status" className={styles.status} role="status" aria-atomic="true">
              {supabaseNoConfigurado ? "Acceso no disponible. Contacta a soporte." : emailError || error}
            </p>
          )}
          <Button type="submit" loading={enviando} icon="none"
            disabled={supabaseNoConfigurado || Boolean(emailError)} className={styles.submit}>
            Entrar
          </Button>
          <p className={styles.legal}>
            Al entrar aceptas los <Link href="/legal/terminos">Términos y Condiciones</Link> y el{" "}
            <Link href="/legal/privacidad">Aviso de Privacidad</Link>.
          </p>
          <div className={styles.signup}>
            <div className={styles.separator}><span>¿Aún no tienes una cuenta?</span></div>
            <Link href="/registro" aria-label="Crear cuenta de conductor">Crea tu cuenta</Link>
          </div>
        </form>
      </section>
    </>
  );
}

export default function PaginaLogin() {
  const screenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const screen = screenRef.current;
    const viewport = window.visualViewport;
    if (!screen || !viewport) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // iOS pans on focus; Android may resize only the visual viewport.
        screen.style.setProperty("--login-height", viewport.height + "px");
        screen.style.setProperty("--login-top", viewport.offsetTop + "px");
      });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={screenRef} className={styles.screen} data-conductor-login>
      <Suspense fallback={<LoginSkeleton />}>
        <FormularioLogin />
      </Suspense>
    </div>
  );
}
