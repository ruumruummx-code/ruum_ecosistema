"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAltoViewportCuenta } from "../useAltoViewportCuenta";
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
  return <div className="user-password-field">
    <div className="user-password-field-heading"><label htmlFor={id}>{titulo}</label>{actual && <Link href="/recuperar-password">¿Olvidaste tu contraseña?</Link>}</div>
    <div className="user-password-input-row">
      <input id={id} type={visible ? "text" : "password"} autoComplete={actual ? "current-password" : "new-password"} required maxLength={128} disabled={disabled} value={valor} onChange={event => cambiar(event.target.value)} />
      <button type="button" disabled={disabled} aria-label={`${visible ? "Ocultar" : "Mostrar"} ${titulo.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? "Ocultar" : "Mostrar"}</button>
    </div>
  </div>;
}

export function CambiarContrasena() {
  const viewportRef = useRef<HTMLDivElement>(null);
  useAltoViewportCuenta(viewportRef);
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

  return <div ref={viewportRef} className="user-password-editor user-v2-scope">
    <header className="user-profile-appbar"><Link href="/cuenta?seccion=perfil" aria-label="Volver a mi cuenta" className="user-profile-back">‹ Atrás</Link><h1>Cambiar contraseña</h1><span aria-hidden="true" /></header>
    <form id="cambiar-clave-form" onSubmit={guardar} aria-busy={guardando} className="user-password-form">
      <CampoClave id="actual" titulo="Contraseña actual" valor={actual} cambiar={setActual} actual disabled={guardando} />
      <CampoClave id="nueva" titulo="Nueva contraseña" valor={nueva} cambiar={setNueva} disabled={guardando} />
      <ul className="user-password-requirements" aria-label="Requisitos de la nueva contraseña">
        {requisitos.map(r => <li key={r.texto} className={r.cumple(nueva) ? "is-met" : ""}><span aria-hidden="true">{r.cumple(nueva) ? "✓" : "○"}</span><span>{r.texto.replace("Al menos una letra ", "").replace("Al menos un ", "")}</span><span className="sr-only">{r.cumple(nueva) ? ": cumplido" : ": pendiente"}</span></li>)}
      </ul>
      <CampoClave id="confirmacion" titulo="Confirmar nueva contraseña" valor={confirmacion} cambiar={setConfirmacion} disabled={guardando} />
      <div className="user-password-match" aria-live="polite">
        {confirmacion && <p className={confirmacion === nueva ? "is-met" : "is-error"}>{confirmacion === nueva ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}</p>}
        {nueva && actual === nueva && <p className="is-error">La nueva contraseña debe ser diferente a la actual.</p>}
      </div>
    </form>
    <footer className="user-password-actions">
      <div className="user-password-feedback" aria-live="polite">{error && <p role="alert">{error}</p>}{exito && <p role="status">Tu contraseña se actualizó correctamente.</p>}</div>
      <div><Link href="/cuenta?seccion=perfil">Cancelar</Link><button type="submit" form="cambiar-clave-form" disabled={!valida || guardando}>{guardando ? "Guardando…" : "Guardar"}</button></div>
    </footer>
  </div>;
}
