"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Aviso } from "@ruum/ui";
import { traducirErrorAuth, validarDestinoSeguro } from "@ruum/shared/utils";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";

function Icono({ tipo, className = "" }: { tipo: "car" | "document" | "card" | "bell" | "mail" | "lock" | "eye" | "globe" | "arrow"; className?: string }) {
  const comunes = { className, width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths = {
    car: <><path d="m5 11 1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><path d="M3 11h18v7H3zM6 18v2m12-2v2M6 14h.01M18 14h.01"/><path d="M3 14H2m20 0h-1"/></>,
    document: <><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v5h4M10 12h6m-6 4h6"/></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18m-14 5h4"/></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18m0-18a15 15 0 0 0 0 18"/></>,
    arrow: <><path d="M4 12h15m-6-6 6 6-6 6"/></>,
  };
  return <svg {...comunes}>{paths[tipo]}</svg>;
}

const caracteristicas = [
  ["car", "Traslados", "Gestión en tiempo real"],
  ["document", "Documentación", "Todo en un solo lugar"],
  ["card", "Pagos", "Procesos simples y seguros"],
  ["bell", "Incidencias y alertas", "Respuesta oportuna"],
] as const;

function FormularioLoginAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destinoPostLogin = validarDestinoSeguro(searchParams.get("next"), "/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordarme, setRecordarme] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "no_autorizado") setError("Esta cuenta no tiene acceso a la Torre de Control.");
  }, []);

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setMensaje(null);
    try {
      if (!tieneSupabaseConfigurado()) throw new Error("Supabase no está configurado. El acceso estará disponible al conectar el servicio.");
      const cliente = crearClienteNavegador();
      const { error: errorAuth } = await cliente.auth.signInWithPassword({ email, password });
      if (errorAuth) throw errorAuth;
      router.push(destinoPostLogin);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error && err.message.startsWith("Supabase no") ? err.message : traducirErrorAuth(err));
    } finally {
      setEnviando(false);
    }
  }

  async function recuperarPassword() {
    setError(null);
    setMensaje(null);
    if (!email) {
      setError("Ingresa tu correo electrónico para enviarte el enlace de recuperación.");
      document.getElementById("login-email")?.focus();
      return;
    }
    if (!tieneSupabaseConfigurado()) {
      setError("La recuperación estará disponible al conectar el servicio de acceso.");
      return;
    }
    try {
      const cliente = crearClienteNavegador();
      const { error: errorAuth } = await cliente.auth.resetPasswordForEmail(email);
      if (errorAuth) throw errorAuth;
      setMensaje("Si existe una cuenta asociada, recibirás un enlace para restablecer tu contraseña.");
    } catch (err) {
      setError(traducirErrorAuth(err));
    }
  }

  return (
    <main className="login-screen">
      <section className="login-brand" aria-label="Ruum Ruum, movilidad que conecta operaciones">
        <div className="login-brand__photo" />
        <div className="login-brand__shade" />
        <div className="login-brand__content">
          <Link href="/" className="login-brand__logo" aria-label="Ruum Ruum, inicio">
          <Image src="/imagenes/ruum-logo-dark.svg" alt="Ruum Ruum" width={186} height={40} className="login-brand__mark" />
            <span className="login-brand__tagline">Tu traslado, tu control</span>
          </Link>
          <div className="login-brand__intro">
            <h1>Movilidad<br />que conecta<br /><span>operaciones</span></h1>
            <p>Seguridad, evidencia y trazabilidad<br className="desktop-break" /> en cada traslado.</p>
          </div>
          <ul className="login-features">
            {caracteristicas.map(([icono, titulo, detalle]) => (
              <li key={titulo}><span className="login-feature__icon"><Icono tipo={icono} /></span><span><strong>{titulo}</strong><small>{detalle}</small></span></li>
            ))}
          </ul>
          <footer className="login-brand__footer"><span />CONDUCIENDO OPERACIONES MÁS INTELIGENTES</footer>
        </div>
      </section>

      <section className="login-access" aria-label="Acceso a la Torre de Control">
        <div className="login-language"><Icono tipo="globe" /><select aria-label="Idioma" defaultValue="es"><option value="es">ES</option><option value="en">EN</option></select><span aria-hidden="true">⌄</span></div>
        <div className="login-card-wrap">
          <section className="login-card" aria-labelledby="titulo-acceso-admin">
            <div className="login-card__brand"><Image src="/imagenes/ruum-logo-navy.svg" alt="Ruum Ruum" width={186} height={40} /><span>Tu traslado, tu control</span></div>
            <h2 id="titulo-acceso-admin">Bienvenido</h2>
            <p className="login-card__lead">Ingresa a la Torre de Control para gestionar tus operaciones.</p>
            <form onSubmit={iniciarSesion} className="login-form">
              <label className="login-label" htmlFor="login-email">Correo electrónico</label>
              <div className="login-input-wrap"><Icono tipo="mail" /><input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ruum.ruum.mx@gmail.com" required autoComplete="email" /></div>
              <div className="login-password-label"><label className="login-label" htmlFor="login-password">Contraseña</label><button type="button" className="login-text-link" onClick={recuperarPassword}>¿Olvidaste tu contraseña?</button></div>
              <div className="login-input-wrap"><Icono tipo="lock" /><input id="login-password" type={mostrarPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingresa tu contraseña" required autoComplete="current-password" /><button type="button" className="login-eye" onClick={() => setMostrarPassword((visible) => !visible)} aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={mostrarPassword}><Icono tipo="eye" /></button></div>
              <label className="login-remember"><input type="checkbox" checked={recordarme} onChange={(e) => setRecordarme(e.target.checked)} /><span>Recordarme en este dispositivo</span></label>
              {error && <div role="status" aria-live="polite"><Aviso tono="danger">{error}</Aviso></div>}
              {mensaje && <div role="status" aria-live="polite"><Aviso tono="info">{mensaje}</Aviso></div>}
              <button type="submit" disabled={enviando} className="login-submit">{enviando ? "Ingresando…" : <>Ingresar <Icono tipo="arrow" /></>}</button>
            </form>
            <div className="login-divider"><span />o<span /></div>
            <p className="login-request">¿No tienes una cuenta? <a href="mailto:soporte@ruumruum.mx?subject=Solicitud%20de%20acceso%20a%20Torre%20de%20Control">Solicita acceso</a></p>
          </section>
        </div>
        <footer className="login-access__footer">RUUM RUUM<br />TORRE DE CONTROL</footer>
      </section>
    </main>
  );
}

export default function PaginaLogin() {
  return <Suspense fallback={<main className="login-screen login-screen--loading"><div className="login-loading">Cargando acceso…</div></main>}><FormularioLoginAdmin /></Suspense>;
}
