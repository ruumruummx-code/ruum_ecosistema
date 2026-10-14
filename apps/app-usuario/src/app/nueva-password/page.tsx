"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Aviso, Field, MobileShell, MobileCard, MobileButton } from "@ruum/ui";
import { fortalezaPassword, observarSesionRecuperacion, passwordCumpleRequisitos, requisitosPassword, traducirErrorAuth } from "@ruum/shared/utils";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { LogoRuum } from "../experiencia-publica";

export default function PaginaNuevaPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sesionLista, setSesionLista] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [errorCampo, setErrorCampo] = useState<{ campo: "password" | "confirmar"; mensaje: string } | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmarRef = useRef<HTMLInputElement>(null);
  const montadoRef = useRef(true);
  const redireccionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      if (redireccionRef.current) clearTimeout(redireccionRef.current);
    };
  }, []);

  useEffect(() => {
    if (!tieneSupabaseConfigurado()) {
      const timer = setTimeout(() => {
        if (montadoRef.current) setVerificando(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    let activo = true;
    let cleanupObserver: (() => void) | null = null;

    async function verificarAutorizacion() {
      try {
        const res = await fetch("/api/recovery/verify", { cache: "no-store", credentials: "same-origin" });
        const data = (await res.json().catch(() => ({}))) as { authorized?: boolean; autorizado?: boolean };
        const autorizadoServidor = Boolean(data.authorized ?? data.autorizado);
        if (autorizadoServidor && activo && montadoRef.current) {
          setSesionLista(true);
          setVerificando(false);
          return;
        }
      } catch {
        // fallback a observer
      }

      if (!activo || !montadoRef.current) return;

      const cliente = crearClienteNavegador();
      cleanupObserver = observarSesionRecuperacion(
        cliente.auth,
        ({ sesionLista: lista, verificando: enVerificacion }) => {
          if (!activo || !montadoRef.current) return;
          setSesionLista(lista);
          setVerificando(enVerificacion);
        },
        2500,
        { soloRecovery: true }
      );
    }

    void verificarAutorizacion();

    return () => {
      activo = false;
      if (cleanupObserver) cleanupObserver();
    };
  }, []);

  async function establecer(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordCumpleRequisitos(password)) {
      setError("La contraseña debe incluir minúscula, mayúscula y número.");
      setErrorCampo({ campo: "password", mensaje: "La contraseña debe incluir minúscula, mayúscula y número." });
      passwordRef.current?.focus();
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      setErrorCampo({ campo: "confirmar", mensaje: "Las contraseñas no coinciden." });
      confirmarRef.current?.focus();
      return;
    }

    setEnviando(true);
    setError(null);
    setErrorCampo(null);

    try {
      if (!tieneSupabaseConfigurado()) {
        throw new Error("Supabase no está configurado en este entorno.");
      }
      const cliente = crearClienteNavegador();
      const { error: errUpdate } = await cliente.auth.updateUser({ password });
      if (errUpdate) throw errUpdate;

      try {
        await fetch("/api/recovery/clear", { method: "POST", cache: "no-store", credentials: "same-origin" });
      } catch {}

      try {
        await cliente.auth.signOut();
      } catch {}

      if (!montadoRef.current) return;
      setListo(true);
      redireccionRef.current = setTimeout(() => {
        if (montadoRef.current) router.push("/login?contrasena=actualizada");
      }, 2500);
    } catch (err) {
      if (montadoRef.current) setError(traducirErrorAuth(err, "No pudimos actualizar la contraseña. Intenta de nuevo."));
    } finally {
      if (montadoRef.current) setEnviando(false);
    }
  }

  const pwd = fortalezaPassword(password);

  return (
    <MobileShell variant="compact">
      <div className="flex min-h-dvh flex-col justify-center px-4 py-8 sm:px-6">
        <Link
          href="/login"
          className="mb-6 inline-flex min-h-11 items-center gap-1 text-[13.5px] font-bold text-[#104ca0] transition hover:text-[#0a2342] dark:text-[#6ba8ff] dark:hover:text-[#a8b5cc]"
        >
          ← Inicio de sesión
        </Link>

        <div className="mb-8 flex justify-center">
          <LogoRuum />
        </div>

        <MobileCard
          elevated
          className="p-6 sm:p-7"
          aria-live="polite"
          aria-atomic="true"
        >
          {verificando ? (
            <p className="py-6 text-center text-[14px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">
              Verificando enlace…
            </p>
          ) : listo ? (
            <div className="flex flex-col items-center gap-3.5 text-center">
              <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]">
                <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <h1 className="text-[20px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
                Contraseña actualizada
              </h1>
              <p className="text-[13.5px] font-medium leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
                Tu contraseña fue actualizada y cerramos esta sesión por seguridad.
                Inicia sesión de nuevo para continuar. Redirigiendo…
              </p>
            </div>
          ) : !sesionLista ? (
            <div className="flex flex-col gap-3.5" role="alert">
              <h1 className="text-[20px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
                Enlace inválido o expirado
              </h1>
              <p className="text-[13.5px] font-medium leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
                El enlace de recuperación expiró o ya fue usado. Los enlaces son válidos por 60 minutos y solo se pueden usar una vez.
              </p>
              <Link
                href="/recuperar-password"
                className="mt-2 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#0a2342] px-6 text-[15px] font-bold text-white shadow-lg transition hover:bg-[#143560] active:scale-98 dark:bg-[#104ca0] dark:hover:bg-[#0d3f85]"
              >
                Solicitar un nuevo enlace
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-[20px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
                Nueva contraseña
              </h1>
              <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
                Elige una contraseña segura. Mínimo 8 caracteres.
              </p>

              <form className="mt-6 flex flex-col gap-4" onSubmit={establecer} noValidate>
                {/* Contraseña */}
                <div className="flex flex-col gap-1.5">
                  <Field
                    ref={passwordRef}
                    etiqueta="Nueva contraseña"
                    etiquetaClassName="text-[12px] font-semibold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorCampo?.campo === "password") setErrorCampo(null);
                    }}
                    error={errorCampo?.campo === "password" ? errorCampo.mensaje : undefined}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-2xl border border-[#e6edf6] bg-[#fafcfe] py-3.5 px-4 text-[14.5px] font-medium text-[#0a2342] outline-none transition placeholder:text-[#8b9bb0] focus:border-[#0a2342] focus:bg-white focus:ring-4 focus:ring-[#0a2342]/5 dark:border-[#1a3a5c] dark:bg-[#061529] dark:text-[#f6f8fb] dark:focus:border-[#4d94ff] dark:focus:bg-[#0a2342]"
                  />
                  {password.length > 0 && (
                    <div className="mt-1 flex flex-col gap-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((n) => (
                          <div
                            key={n}
                            className={[
                              "h-1 flex-1 rounded-full transition-all",
                              n <= pwd.nivel
                                ? pwd.nivel === 1
                                  ? "bg-[#9a2637]"
                                  : pwd.nivel === 2
                                    ? "bg-[#765100]"
                                    : "bg-[#08705f]"
                                : "bg-[#e6edf6] dark:bg-[#1a3a5c]",
                            ].join(" ")}
                          />
                        ))}
                      </div>
                      {pwd.etiqueta && (
                        <span className="text-[11.5px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">{pwd.etiqueta}</span>
                      )}
                    </div>
                  )}
                  <ul className="mt-1 flex flex-col gap-1 text-[12px] leading-5" aria-label="Requisitos de contraseña">
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
                          className={requisito.cumplido ? "font-semibold text-[#08705f] dark:text-[#4dd9a3]" : "font-medium text-[#4e5f80] dark:text-[#a8b5cc]"}
                        >
                          {requisito.cumplido ? "✓" : "○"} {etiquetas[requisito.clave]}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Field
                    ref={confirmarRef}
                    etiqueta="Confirmar nueva contraseña"
                    etiquetaClassName="text-[12px] font-semibold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]"
                    type="password"
                    value={confirmar}
                    onChange={(e) => {
                      setConfirmar(e.target.value);
                      if (errorCampo?.campo === "confirmar") setErrorCampo(null);
                    }}
                    error={errorCampo?.campo === "confirmar" ? errorCampo.mensaje : undefined}
                    required
                    autoComplete="new-password"
                    placeholder="Repite tu contraseña"
                    className="w-full rounded-2xl border border-[#e6edf6] bg-[#fafcfe] py-3.5 px-4 text-[14.5px] font-medium text-[#0a2342] outline-none transition placeholder:text-[#8b9bb0] focus:border-[#0a2342] focus:bg-white focus:ring-4 focus:ring-[#0a2342]/5 dark:border-[#1a3a5c] dark:bg-[#061529] dark:text-[#f6f8fb] dark:focus:border-[#4d94ff] dark:focus:bg-[#0a2342]"
                  />
                </div>

                {error && (
                  <div role="alert" aria-atomic="true">
                    <Aviso tono="danger">{error}</Aviso>
                  </div>
                )}

                <MobileButton
                  type="submit"
                  disabled={enviando}
                  loading={enviando}
                  className="mt-2"
                >
                  {enviando ? "Guardando…" : "Guardar nueva contraseña"}
                </MobileButton>
              </form>
            </>
          )}
        </MobileCard>
      </div>
    </MobileShell>
  );
}
