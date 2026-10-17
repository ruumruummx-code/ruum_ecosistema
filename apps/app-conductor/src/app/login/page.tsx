"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, LogoMarca } from "@ruum/ui";
import { traducirErrorAuth, validarDestinoSeguro } from "@ruum/shared/utils";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { onboardingVisto } from "../../lib/onboarding-visto";
import { CONTACTOS_SOPORTE_CONDUCTOR } from "../../lib/contactos-soporte";

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

  const validarEmail = (value: string) => {
    if (!value) {
      setEmailError(null);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
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
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
      setEmailError("Formato de correo inválido");
      return;
    }
    if (!password) {
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
          <LogoMarca tamano={32} mostrarDescriptor={false} mostrarRespaldo={false} />
          <h1 id="titulo-inicio-conductor">Iniciar sesión</h1>
        </header>
        <form className={styles.form} onSubmit={iniciarSesion} noValidate>
          <div className={styles.field}>
            <label htmlFor="correo-conductor">Correo</label>
            <input id="correo-conductor" name="email" type="email" value={email}
              onChange={manejarCambioEmail} onBlur={manejarBlurEmail} required
              autoComplete="username" inputMode="email" enterKeyHint="next"
              autoCapitalize="none" autoCorrect="off" spellCheck={false}
              aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "login-status" : undefined}
              disabled={supabaseNoConfigurado} />
          </div>
          <div className={styles.field}>
            <div className={styles.fieldHeading}>
              <label htmlFor="password-conductor">Contraseña</label>
              <Link href="/recuperar-password" aria-label="Recuperar contraseña">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input id="password-conductor" name="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} required
              autoComplete="current-password" enterKeyHint="go" disabled={supabaseNoConfigurado} />
          </div>
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
            Al entrar aceptas los <Link href="/legal/terminos">Términos</Link> y el{" "}
            <Link href="/legal/privacidad">Aviso de Privacidad</Link>.
          </p>
          <p className={styles.signup}>
            ¿Aún no estás certificado?{" "}
            <Link href="/registro" aria-label="Solicitar certificación como conductor">Crea tu cuenta.</Link>
          </p>
        </form>
      </section>
      <footer className={styles.support} aria-label="Soporte de acceso">
        <a href={CONTACTOS_SOPORTE_CONDUCTOR.soporte.whatsapp.href}
          target="_blank" rel="noopener noreferrer">
          <span aria-hidden="true">🟢</span> WhatsApp Soporte
        </a>
        <a href={CONTACTOS_SOPORTE_CONDUCTOR.soporte.telefono.href}>
          <span aria-hidden="true">📞</span> Llamar
        </a>
      </footer>
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
