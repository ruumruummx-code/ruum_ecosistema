"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Aviso } from "@ruum/ui";
import { Button, Card, InputConIcono, Label, NativeSelect } from "@ruum/ui/base";
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
    <main className="grid min-h-dvh bg-ui-bg text-ui-fg lg:grid-cols-[minmax(0,1.1fr)_minmax(28rem,1fr)]">
      {/* Panel de marca: siempre en la variante oscura del sistema base. */}
      <section data-theme="dark" className="relative hidden overflow-hidden bg-ui-bg text-ui-fg lg:flex" aria-label="Ruum Ruum, movilidad que conecta operaciones">
        <Image src="/imagenes/torre-control-flota.webp" alt="" aria-hidden="true" fill priority sizes="55vw" className="object-cover opacity-30" />
        <div className="absolute inset-0 bg-ui-header-wave opacity-80" aria-hidden="true" />
        <div className="relative flex w-full flex-col justify-between gap-10 p-12 xl:p-16">
          <Link href="/" className="flex w-fit flex-col gap-2 rounded-md" aria-label="Ruum Ruum, inicio">
            <Image src="/imagenes/ruum-logo-dark.svg" alt="Ruum Ruum" width={186} height={40} />
            <span className="text-sm text-ui-fg-muted">Tu traslado, tu control</span>
          </Link>
          <div className="max-w-lg">
            <h1 className="text-3xl font-semibold tracking-tight xl:text-4xl">Movilidad que conecta operaciones</h1>
            <p className="mt-3 text-base text-ui-fg-muted">Seguridad, evidencia y trazabilidad en cada traslado.</p>
          </div>
          <ul className="grid max-w-xl grid-cols-2 gap-3">
            {caracteristicas.map(([icono, titulo, detalle]) => (
              <li key={titulo} className="flex items-start gap-3 rounded-lg border border-ui-line bg-ui-card/60 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-ui-brand-soft text-ui-brand-soft-fg"><Icono tipo={icono} className="size-5" /></span>
                <span className="min-w-0"><strong className="block text-sm font-semibold">{titulo}</strong><small className="block text-xs text-ui-fg-muted">{detalle}</small></span>
              </li>
            ))}
          </ul>
          <p className="font-mono-ruum text-xs uppercase tracking-widest text-ui-fg-muted">Conduciendo operaciones más inteligentes</p>
        </div>
      </section>

      <section className="flex flex-col px-4 py-6 sm:px-8" aria-label="Acceso a la Torre de Control">
        <div className="flex items-center justify-end gap-2 text-ui-fg-muted">
          <Icono tipo="globe" className="size-4" />
          <NativeSelect aria-label="Idioma" defaultValue="es" className="h-9 w-20 text-sm"><option value="es">ES</option><option value="en">EN</option></NativeSelect>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <Card asChild className="w-full max-w-md p-6 shadow-ui-md sm:p-8">
            <section aria-labelledby="titulo-acceso-admin">
              <div className="mb-6 flex flex-col gap-1 lg:hidden">
                <Image src="/imagenes/ruum-logo-navy.svg" alt="Ruum Ruum" width={160} height={34} className="ruum-logo-navy" />
                <span className="text-sm text-ui-fg-muted">Tu traslado, tu control</span>
              </div>
              <p className="font-mono-ruum text-xs font-medium uppercase tracking-widest text-ui-brand">Torre de Control</p>
              <h2 id="titulo-acceso-admin" className="mt-1 text-2xl font-semibold tracking-tight">Bienvenido</h2>
              <p className="mt-1 text-sm text-ui-fg-muted">Ingresa a la Torre de Control para gestionar tus operaciones.</p>
              <form onSubmit={iniciarSesion} className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="login-email">Correo electrónico</Label>
                  <InputConIcono id="login-email" icono={<Icono tipo="mail" />} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@empresa.mx" required autoComplete="email" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Button type="button" variant="link" size="sm" onClick={recuperarPassword}>¿Olvidaste tu contraseña?</Button>
                  </div>
                  <InputConIcono
                    id="login-password"
                    icono={<Icono tipo="lock" />}
                    type={mostrarPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    required
                    autoComplete="current-password"
                    accion={
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => setMostrarPassword((visible) => !visible)} aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={mostrarPassword}>
                        <Icono tipo="eye" />
                      </Button>
                    }
                  />
                </div>
                <label className="flex min-h-11 items-center gap-2 text-sm text-ui-fg">
                  <input type="checkbox" className="size-4 accent-ui-brand" checked={recordarme} onChange={(e) => setRecordarme(e.target.checked)} />
                  <span>Recordarme en este dispositivo</span>
                </label>
                {error && <div role="status" aria-live="polite"><Aviso tono="danger">{error}</Aviso></div>}
                {mensaje && <div role="status" aria-live="polite"><Aviso tono="info">{mensaje}</Aviso></div>}
                <Button type="submit" size="lg" disabled={enviando} className="w-full">
                  {enviando ? "Ingresando…" : <>Ingresar <Icono tipo="arrow" /></>}
                </Button>
              </form>
              <p className="mt-6 border-t border-ui-line pt-5 text-center text-sm text-ui-fg-muted">
                ¿No tienes una cuenta?{" "}
                <a className="font-semibold text-ui-brand underline-offset-4 hover:underline" href="mailto:soporte@ruumruum.mx?subject=Solicitud%20de%20acceso%20a%20Torre%20de%20Control">Solicita acceso</a>
              </p>
            </section>
          </Card>
        </div>
        <p className="text-center font-mono-ruum text-xs uppercase tracking-widest text-ui-fg-muted">Ruum Ruum · Torre de Control</p>
      </section>
    </main>
  );
}

export default function PaginaLogin() {
  return <Suspense fallback={<main className="grid min-h-dvh place-items-center bg-ui-bg text-sm text-ui-fg-muted" role="status">Cargando acceso…</main>}><FormularioLoginAdmin /></Suspense>;
}
