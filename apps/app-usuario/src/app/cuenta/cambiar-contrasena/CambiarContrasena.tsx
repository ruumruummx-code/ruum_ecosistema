"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAltoViewportCuenta } from "../useAltoViewportCuenta";
import { crearClienteNavegador } from "../../../lib/supabase-browser";

const requisitos = [
  { texto: "Mínimo 8 caracteres", cumple: (v: string) => v.length >= 8 },
  { texto: "Al menos una letra minúscula", cumple: (v: string) => /[a-z]/.test(v) },
  { texto: "Al menos una letra mayúscula", cumple: (v: string) => /[A-Z]/.test(v) },
  { texto: "Al menos un número", cumple: (v: string) => /[0-9]/.test(v) },
];

function IconoOjo() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s2.7-5.5 9.5-5.5 9.5 5.5 9.5 5.5-2.7 5.5-9.5 5.5-9.5-5.5Z" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

function IconoOjoCerrado() {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M9.9 5.9A9.4 9.4 0 0 1 12 5.5c4.8 0 7.9 4.2 9.5 6.5a17 17 0 0 1-2.3 2.9M14.5 14.5A4.6 4.6 0 0 1 12 15.5c-2.9 0-5.3-2.2-6.9-3.9" />
    </svg>
  );
}

function IconoFlechaDerecha() {
  return (
    <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function CampoClave({
  id,
  titulo,
  placeholder,
  valor,
  cambiar,
  actual = false,
  disabled = false,
}: {
  id: string;
  titulo: string;
  placeholder?: string;
  valor: string;
  cambiar: (v: string) => void;
  actual?: boolean;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-[#e2e8f0] bg-white p-3.5 shadow-2xs transition focus-within:border-[#0066FF] focus-within:ring-4 focus-within:ring-[#0066FF]/10 dark:border-[#1a3a5c] dark:bg-[#0a2342] sm:p-4">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[12px] font-semibold text-[#64748b] dark:text-[#a8b5cc]">
          {titulo}
        </label>
        {actual && (
          <Link
            href="/recuperar-password"
            className="text-[12px] font-semibold text-[#0066FF] hover:underline dark:text-[#4d94ff]"
          >
            ¿La olvidaste?
          </Link>
        )}
      </div>
      <div className="relative flex items-center justify-between">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={actual ? "current-password" : "new-password"}
          required
          maxLength={128}
          disabled={disabled}
          value={valor}
          onChange={(event) => cambiar(event.target.value)}
          placeholder={placeholder}
          className="w-full border-0 bg-transparent p-0 text-[15px] font-medium text-[#0a2342] outline-none placeholder:text-[#94a3b8] dark:text-[#f6f8fb] dark:placeholder:text-[#64748b]"
        />
        <button
          type="button"
          disabled={disabled}
          aria-label={`${visible ? "Ocultar" : "Mostrar"} ${titulo.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          className="ml-2 flex size-8 shrink-0 items-center justify-center text-[#94a3b8] hover:text-[#0a2342] transition cursor-pointer dark:hover:text-white"
        >
          {visible ? <IconoOjoCerrado /> : <IconoOjo />}
        </button>
      </div>
    </div>
  );
}

export function CambiarContrasena() {
  const viewportRef = useRef<HTMLDivElement>(null);
  useAltoViewportCuenta(viewportRef);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [mantenerSesion, setMantenerSesion] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const bloqueo = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const cumplidos = requisitos.filter((r) => r.cumple(nueva)).length;
  const valida = Boolean(actual && cumplidos === 4 && nueva === confirmacion && nueva !== actual);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bloqueo.current || !valida) return;
    bloqueo.current = true;
    setGuardando(true);
    setError(null);
    setExito(false);
    try {
      const cliente = crearClienteNavegador();
      const { data, error: errorUsuario } = await cliente.auth.getUser();
      if (errorUsuario || !data.user?.email) {
        throw new Error("Tu sesión no está disponible. Inicia sesión nuevamente.");
      }
      const { data: verificacion, error: errorClave } = await cliente.auth.signInWithPassword({
        email: data.user.email,
        password: actual,
      });
      if (errorClave || verificacion.user?.id !== data.user.id) {
        throw new Error("No pudimos verificar tu contraseña actual. Revísala e inténtalo de nuevo.");
      }
      const { error: errorGuardar } = await cliente.auth.updateUser({ password: nueva });
      if (errorGuardar) {
        throw new Error("No pudimos actualizar tu contraseña. Inténtalo nuevamente; si persiste, contacta a soporte.");
      }
      setActual("");
      setNueva("");
      setConfirmacion("");
      setExito(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos actualizar tu contraseña. Inténtalo de nuevo.");
    } finally {
      bloqueo.current = false;
      setGuardando(false);
    }
  }

  return (
    <div ref={viewportRef} className="mx-auto flex w-full max-w-[440px] flex-col justify-between px-4 py-4 sm:px-6 user-v2-scope">
      {/* Cabecera superior con botón de retorno, logo Ruum y selector de idioma */}
      <div>
        <div className="relative mb-3 flex items-center justify-between">
          <Link
            href="/cuenta?seccion=perfil"
            aria-label="Volver a mi cuenta"
            className="flex size-10 items-center justify-center rounded-full bg-[#f1f5fa] text-[#0a2342] transition hover:bg-[#e2ecf9] dark:bg-[#0f2d52] dark:text-white"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Logotipo centrado */}
          <div className="flex flex-col items-center">
            <Image
              src="/imagenes/ruum-logo-simbolo.png"
              alt="Ruum Ruum"
              width={40}
              height={40}
              priority
              className="h-9 w-auto object-contain"
            />
            <span className="font-display text-[15px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb]">
              Ruum Ruum
            </span>
          </div>

          {/* Selector de idioma */}
          <div className="flex items-center">
            <span className="rounded-full bg-[#f1f5fa] px-2.5 py-1 text-xs font-bold text-[#0a2342] dark:bg-[#0f2d52] dark:text-white">
              ES ∨
            </span>
          </div>
        </div>

        {/* Título y subtítulo */}
        <div className="mb-4 text-center">
          <h1 className="text-[22px] font-extrabold tracking-tight text-[#0a2342] dark:text-[#f6f8fb] sm:text-[24px]">
            Cambia tu contraseña
          </h1>
          <p className="mt-0.5 text-[13px] font-medium text-[#64748b] dark:text-[#a8b5cc]">
            Elige una contraseña segura para proteger tu cuenta.
          </p>
        </div>

        {/* Formulario */}
        <form id="cambiar-clave-form" onSubmit={guardar} aria-busy={guardando} className="flex flex-col gap-3">
          <CampoClave
            id="actual"
            titulo="Contraseña actual"
            placeholder="Ingresa tu contraseña actual"
            valor={actual}
            cambiar={setActual}
            actual
            disabled={guardando}
          />

          <CampoClave
            id="nueva"
            titulo="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            valor={nueva}
            cambiar={setNueva}
            disabled={guardando}
          />

          <CampoClave
            id="confirmacion"
            titulo="Confirmar nueva contraseña"
            placeholder="Repite tu nueva contraseña"
            valor={confirmacion}
            cambiar={setConfirmacion}
            disabled={guardando}
          />

          {/* Caja de Requisitos de Contraseña */}
          <div className="rounded-2xl border border-[#d6e4f7] bg-[#f0f6fd] p-4 text-left dark:border-[#1a3a5c] dark:bg-[#091f38]">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-full bg-[#00D1D1]/20 text-[#008B8B] dark:text-[#00D1D1]">
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <h2 className="text-[13px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">
                Tu contraseña debe incluir:
              </h2>
            </div>
            <ul
              className="mt-3 space-y-1.5"
              role="list"
              aria-label="Requisitos de la nueva contraseña"
            >
              {requisitos.map((r) => {
                const cumplido = r.cumple(nueva);
                return (
                  <li
                    key={r.texto}
                    className={`flex items-center gap-2 text-[12.5px] font-medium transition-colors ${
                      cumplido
                        ? "is-met text-[#0f6b48] dark:text-[#4dd9a3]"
                        : "text-[#64748b] dark:text-[#8293b0]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        cumplido
                          ? "bg-[#10b981] text-white"
                          : "border border-[#94a3b8] text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span>{r.texto}</span>
                    <span className="sr-only">{cumplido ? ": cumplido" : ": pendiente"}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Casilla: Mantenerme conectado tras restablecer */}
          <label className="flex items-start gap-3 rounded-xl p-1 cursor-pointer">
            <input
              type="checkbox"
              checked={mantenerSesion}
              onChange={(e) => setMantenerSesion(e.target.checked)}
              className="mt-0.5 size-4.5 rounded border-[#94a3b8] text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
            />
            <div className="text-[12.5px] leading-tight">
              <span className="font-bold text-[#0a2342] dark:text-[#f6f8fb]">
                Mantenerme conectado tras restablecer
              </span>
              <p className="mt-0.5 text-[11.5px] text-[#64748b] dark:text-[#94a3b8]">
                Cerrará tus sesiones activas en otros dispositivos por seguridad.
              </p>
            </div>
          </label>

          {/* Mensajes de coincidencia o error */}
          {confirmacion && (
            <p
              className={`text-[12px] font-bold ${
                confirmacion === nueva
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {confirmacion === nueva ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
            </p>
          )}
          {nueva && actual === nueva && (
            <p className="text-[12px] font-bold text-rose-600 dark:text-rose-400">
              La nueva contraseña debe ser diferente a la actual.
            </p>
          )}

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-bold text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </div>
          )}

          {exito && (
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              Tu contraseña se actualizó correctamente.
            </div>
          )}

          {/* Botón CTA Principal */}
          <button
            type="submit"
            form="cambiar-clave-form"
            disabled={!valida || guardando}
            aria-label="Guardar"
            className="mt-2 flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0a2342] px-5 text-[15px] font-bold text-white shadow-sm transition hover:bg-[#103460] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0066FF] dark:hover:bg-[#1a75ff] cursor-pointer sm:h-[52px]"
          >
            {guardando ? (
              <span>Guardando…</span>
            ) : (
              <>
                <span>Actualizar contraseña</span>
                <IconoFlechaDerecha />
              </>
            )}
          </button>
        </form>

        <div className="mt-3 flex justify-center">
          <Link
            href="/cuenta?seccion=perfil"
            className="text-[12.5px] font-semibold text-[#64748b] hover:underline dark:text-[#a8b5cc]"
          >
            Cancelar
          </Link>
        </div>
      </div>
    </div>
  );
}