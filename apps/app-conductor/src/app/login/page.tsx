"use client";

import { Input as BaseInput, Button as BaseButton } from "@ruum/ui/base";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { traducirErrorAuth, validarDestinoSeguro } from "@ruum/shared/utils";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { onboardingVisto } from "../../lib/onboarding-visto";
import { esEmailLoginValido, validarCredencialesLogin } from "./login-validation";

import styles from "./login.module.css";

const MENSAJE_CORREO_INVALIDO = "Revisa tu correo; parece incompleto. Ejemplo: tu@correo.com";

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
          // Conserva el destino original (por ejemplo, un enlace a un traslado) al pasar por la bienvenida.
          const next = searchParams.get("next");
          router.replace(next ? `/onboarding?next=${encodeURIComponent(next)}` : "/onboarding");
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
  }, [router, searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  // El correo se valida al salir del campo o al enviar, no mientras se escribe;
  // al escribir solo se retira el error cuando el correo ya es válido.
  const manejarCambioEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError && (!value || esEmailLoginValido(value))) setEmailError(null);
  };

  const manejarBlurEmail = () => {
    setEmailError(email && !esEmailLoginValido(email) ? MENSAJE_CORREO_INVALIDO : null);
  };

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();
    const credencialInvalida = validarCredencialesLogin(email, password);
    if (credencialInvalida === "email") {
      setEmailError(MENSAJE_CORREO_INVALIDO);
      return;
    }
    if (credencialInvalida === "password") {
      setError("Ingresa tu contraseña para continuar.");
      return;
    }
    setEmailError(null);

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
          <div className={styles.intro}>
            <h1 id="titulo-inicio-conductor">Iniciar sesión</h1>
            <p>Accede a tu cuenta de conductor.</p>
          </div>
        </header>
        <form className={styles.form} onSubmit={iniciarSesion} noValidate>
          <div className={styles.field}>
            <label htmlFor="correo-conductor">Correo</label>
            <BaseInput id="correo-conductor" name="email" type="email" value={email}
              onChange={manejarCambioEmail} onBlur={manejarBlurEmail} required
              autoComplete="username" inputMode="email" enterKeyHint="next"
              autoCapitalize="none" autoCorrect="off" spellCheck={false}
              aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "login-status" : undefined}
              disabled={supabaseNoConfigurado} placeholder="tu@correo.com" />
          </div>
          <div className={styles.field}>
            <label htmlFor="password-conductor">Contraseña</label>
            <BaseInput id="password-conductor" name="password" type={mostrarContrasena ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)} required
              aria-invalid={Boolean(error)} aria-describedby={error ? "login-status" : undefined}
              autoComplete="current-password" enterKeyHint="go" disabled={supabaseNoConfigurado} placeholder="Ingresa tu contraseña" />
            <BaseButton variant="ghost" type="button" className={styles.visibility} onClick={() => setMostrarContrasena((visible) => !visible)} aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}>
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.7" />{!mostrarContrasena && <path d="M3 3l18 18" />}</svg>
            </BaseButton>
          </div>
          <Link className={styles.recovery} href="/recuperar-password">¿Olvidaste tu contraseña?</Link>
          {(supabaseNoConfigurado || emailError || error) && (
            <p id="login-status" className={styles.status} role={supabaseNoConfigurado ? "status" : "alert"} aria-atomic="true">
              {supabaseNoConfigurado ? "Acceso no disponible. Contacta a soporte." : emailError || error}
            </p>
          )}
          <BaseButton variant="primary" type="submit" aria-busy={enviando}
            disabled={enviando || supabaseNoConfigurado} className={styles.submit}>
            {enviando ? "Entrando…" : "Entrar"}
          </BaseButton>
          <p className={styles.legal}>
            Al entrar aceptas los <Link href="/legal/terminos?volver=%2Flogin">Términos y Condiciones</Link> y el{" "}
            <Link href="/legal/privacidad?volver=%2Flogin">Aviso de Privacidad</Link>.
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



  return (
    <div ref={screenRef} className={styles.screen} data-conductor-login>
      <Suspense fallback={<LoginSkeleton />}>
        <FormularioLogin />
      </Suspense>
    </div>
  );
}
