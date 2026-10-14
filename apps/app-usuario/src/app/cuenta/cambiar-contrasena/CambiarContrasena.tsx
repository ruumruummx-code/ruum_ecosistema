"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Icono, SENDAS_ICONO } from "@ruum/ui";
import { crearClienteNavegador } from "../../../lib/supabase-browser";

const requisitos = [
  { texto: "Mínimo 8 caracteres", cumple: (v: string) => v.length >= 8 },
  { texto: "Al menos una letra minúscula", cumple: (v: string) => /[a-z]/.test(v) },
  { texto: "Al menos una letra mayúscula", cumple: (v: string) => /[A-Z]/.test(v) },
  { texto: "Al menos un número", cumple: (v: string) => /[0-9]/.test(v) },
];

function CampoClave({ id, titulo, valor, cambiar, actual = false, disabled = false }: {
  id: string; titulo: string; valor: string; cambiar: (v: string) => void; actual?: boolean; disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return <div className="mb-[18px]">
    <label htmlFor={id} className="mb-2 block text-[11.5px] font-bold uppercase tracking-wide text-[#6b7c94]">{titulo} <span className="text-[#e84a3e]">*</span></label>
    <div className="relative">
      <Icono d={SENDAS_ICONO.candado} className="pointer-events-none absolute left-[18px] top-[18px] size-[18px] text-[#8b9bb0]" />
      <input id={id} type={visible ? "text" : "password"} autoComplete={actual ? "current-password" : "new-password"} required maxLength={128} disabled={disabled} value={valor} onChange={e => cambiar(e.target.value)} placeholder={actual ? "Ingresa tu contraseña actual" : titulo} className="w-full rounded-2xl border border-[#e6edf6] bg-[#fafcfe] py-4 pl-[52px] pr-[76px] text-[15px] text-[#0b1e33] outline-none focus:border-[#0b1e33] focus:ring-2 focus:ring-[#0b1e33]/10" />
      <button type="button" disabled={disabled} aria-label={`${visible ? "Ocultar" : "Mostrar"} ${titulo.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)} className="absolute right-2 top-2 rounded-xl p-2.5 text-xs font-semibold text-[#2e5a88]">{visible ? "Ocultar" : "Mostrar"}</button>
    </div>
  </div>;
}

export function CambiarContrasena() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const bloqueo = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const cumplidos = requisitos.filter(r => r.cumple(nueva)).length;
  const valida = Boolean(actual && cumplidos === 4 && nueva === confirmacion && nueva !== actual);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bloqueo.current || !valida) return;
    bloqueo.current = true;
    setGuardando(true); setError(null); setExito(false);
    try {
      const cliente = crearClienteNavegador();
      const { data, error: errorUsuario } = await cliente.auth.getUser();
      if (errorUsuario || !data.user?.email) throw new Error("Tu sesión no está disponible. Inicia sesión nuevamente.");
      const { data: verificacion, error: errorClave } = await cliente.auth.signInWithPassword({ email: data.user.email, password: actual });
      if (errorClave || verificacion.user?.id !== data.user.id) throw new Error("No pudimos verificar tu contraseña actual. Revísala e inténtalo de nuevo.");
      const { error: errorGuardar } = await cliente.auth.updateUser({ password: nueva });
      if (errorGuardar) throw new Error("No pudimos actualizar tu contraseña. Inténtalo nuevamente; si persiste, contacta a soporte.");
      setActual(""); setNueva(""); setConfirmacion(""); setExito(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos actualizar tu contraseña. Inténtalo de nuevo.");
    } finally {
      bloqueo.current = false; setGuardando(false);
    }
  }

  return <div className="mx-auto w-full max-w-[420px] text-[#0b1e33]">
    <header className="mb-7 flex items-center gap-3.5 border-b border-[#f0f4fa] pb-4">
      <Link href="/cuenta" aria-label="Volver a mi cuenta" className="flex size-10 items-center justify-center rounded-full bg-[#f2f6fc]">←</Link>
      <div><h1 className="text-[17px] font-bold">Cambiar contraseña</h1><p className="text-xs text-[#6b7c94]">Seguridad de tu cuenta</p></div>
    </header>
    <div className="relative mx-auto mb-5 flex size-[76px] items-center justify-center rounded-[26px] bg-gradient-to-br from-[#0b1e33] to-[#2e5a88] text-[#fff] shadow-lg">
      <Icono d={SENDAS_ICONO.candado} className="size-8" /><span className="absolute -bottom-1 -right-1 rounded-full border-[3px] border-white bg-[#e9f3ee] px-1.5 text-sm text-[#1f6b4a]">✓</span>
    </div>
    <h2 className="text-center text-[23px] font-extrabold tracking-tight">Protege tu cuenta</h2>
    <p className="mb-7 mt-2 text-center text-[13.5px] leading-relaxed text-[#6b7c94]">Actualiza tu contraseña para mantener tu cuenta segura.</p>
    <p className="mb-[22px] rounded-2xl border border-[#dfe8f3] bg-[#f0f5fe] p-4 text-[12.5px] leading-relaxed text-[#3d5470]">Elige una contraseña segura que no utilices en otros servicios. Necesitarás tu contraseña actual para realizar el cambio.</p>
    {error && <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {exito && <p role="status" className="mb-4 rounded-2xl border border-green-200 bg-[#e9f3ee] p-4 text-sm text-[#1f6b4a]">Tu contraseña se actualizó correctamente.</p>}
    <form onSubmit={guardar} aria-busy={guardando}>
      <CampoClave id="actual" titulo="Contraseña actual" valor={actual} cambiar={setActual} actual disabled={guardando} />
      <Link href="/recuperar-password" className="mb-5 block text-right text-xs font-semibold text-[#2e5a88]">¿Olvidaste tu contraseña?</Link>
      <hr className="my-5 border-[#f0f4fa]" />
      <CampoClave id="nueva" titulo="Nueva contraseña" valor={nueva} cambiar={setNueva} disabled={guardando} />
      {nueva && <div className="mb-3" aria-live="polite"><div className="mb-1 flex gap-1" aria-hidden="true">{[1, 2, 3, 4].map(n => <span key={n} className={`h-[5px] flex-1 rounded-full ${n <= cumplidos ? cumplidos < 2 ? "bg-red-400" : cumplidos < 4 ? "bg-amber-400" : "bg-green-600" : "bg-[#e8eef6]"}`} />)}</div><p className="text-xs text-[#6b7c94]">{cumplidos < 2 ? "Contraseña débil" : cumplidos < 4 ? "Contraseña regular" : "Contraseña muy segura"}</p></div>}
      <ul className="mb-5 space-y-2 rounded-[14px] border border-[#eef2f7] bg-[#f8fafd] p-4 text-[12.5px]">{requisitos.map(r => <li key={r.texto} className={r.cumple(nueva) ? "font-semibold text-[#1f6b4a]" : "text-[#6b7c94]"}><span aria-hidden="true" className="mr-2">{r.cumple(nueva) ? "✓" : "○"}</span>{r.texto}</li>)}</ul>
      <CampoClave id="confirmacion" titulo="Confirmar nueva contraseña" valor={confirmacion} cambiar={setConfirmacion} disabled={guardando} />
      {confirmacion && <p role="status" className={`mb-4 text-xs font-semibold ${confirmacion === nueva ? "text-[#1f6b4a]" : "text-red-700"}`}>{confirmacion === nueva ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}</p>}
      {nueva && actual === nueva && <p className="mb-4 text-xs text-red-700">La nueva contraseña debe ser diferente a la actual.</p>}
      <button type="submit" disabled={!valida || guardando} className="mt-3 w-full rounded-[18px] bg-[#0b1e33] p-[19px] text-base font-bold text-[#fff] shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">{guardando ? "Actualizando contraseña…" : "Guardar nueva contraseña"}</button>
    </form>
    <p className="py-5 text-center text-[13.5px] text-[#6b7c94]">¿No quieres cambiarla? <Link href="/cuenta" className="font-bold text-[#0b1e33]">Cancelar</Link></p>
  </div>;
}
