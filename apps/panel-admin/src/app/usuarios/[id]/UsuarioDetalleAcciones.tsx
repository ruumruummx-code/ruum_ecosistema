"use client";

import { useState } from "react";
import { Aviso } from "@ruum/ui";
import { AdminDialog } from "../../admin-components";
import {
  actualizarUsuarioAdmin,
  suspenderUsuarioAdmin,
  reactivarUsuarioAdmin,
  cerrarCuentaUsuarioAdmin
} from "@ruum/api/services";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import type { UsuarioRow } from "./UsuarioDetalleTipos";

export function Campo({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-xs font-medium text-ui-fg-muted">{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring" />
    </label>
  );
}

export function EditarUsuario({ usuario, onActualizado, onCancelar }: { usuario: UsuarioRow; onActualizado: (u: UsuarioRow) => void; onCancelar: () => void }) {
  const [nombre, setNombre] = useState(usuario.nombre ?? "");
  const [telefono, setTelefono] = useState(usuario.telefono ?? "");
  const [correoFacturacion, setCorreoFacturacion] = useState(usuario.correo_facturacion ?? "");
  const [calle, setCalle] = useState(usuario.calle ?? "");
  const [numero, setNumero] = useState(usuario.numero ?? "");
  const [colonia, setColonia] = useState(usuario.colonia ?? "");
  const [ciudad, setCiudad] = useState(usuario.ciudad ?? "");
  const [estado, setEstado] = useState(usuario.estado ?? "");
  const [pais, setPais] = useState(usuario.pais ?? "");
  const [codigoPostal, setCodigoPostal] = useState(usuario.codigo_postal ?? "");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setProcesando(true);
    setError(null);
    try {
      const cliente = crearClienteNavegador();
      const actualizado = await actualizarUsuarioAdmin(cliente, usuario.id, {
        nombre: nombre.trim() || null,
        telefono: telefono.trim() || null,
        correo_facturacion: correoFacturacion.trim() || null,
        calle: calle.trim() || null,
        numero: numero.trim() || null,
        colonia: colonia.trim() || null,
        ciudad: ciudad.trim() || null,
        estado: estado.trim() || null,
        pais: pais.trim() || null,
        codigo_postal: codigoPostal.trim() || null
      });
      onActualizado(actualizado);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div id="editar-datos-usuario" className="rounded-lg border border-ui-line bg-ui-card p-5">
      <h2 className="font-display text-lg font-semibold text-ui-fg">Editar datos</h2>
      {error && <div className="mt-2"><Aviso tono="danger">{error}</Aviso></div>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre" value={nombre} onChange={setNombre} />
        <Campo label="Teléfono" value={telefono} onChange={setTelefono} />
        <Campo label="Correo de facturación" value={correoFacturacion} onChange={setCorreoFacturacion} />
        <Campo label="Calle" value={calle} onChange={setCalle} />
        <Campo label="Número" value={numero} onChange={setNumero} />
        <Campo label="Colonia" value={colonia} onChange={setColonia} />
        <Campo label="Ciudad" value={ciudad} onChange={setCiudad} />
        <Campo label="Estado" value={estado} onChange={setEstado} />
        <Campo label="País" value={pais} onChange={setPais} />
        <Campo label="Código postal" value={codigoPostal} onChange={setCodigoPostal} />
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={guardar} disabled={procesando} className="rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-on-brand hover:bg-ui-brand-hover disabled:opacity-50">
          {procesando ? "Guardando..." : "Guardar cambios"}
        </button>
        <button onClick={onCancelar} disabled={procesando} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-medium hover:bg-ui-muted">Cancelar</button>
      </div>
    </div>
  );
}

export function SuspenderCuenta({ usuarioId, onCompletado }: { usuarioId: string; onCompletado: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ejecutar() {
    if (!motivo.trim() || !confirmado) return;
    setProcesando(true); setError(null);
    try {
      const cliente = crearClienteNavegador();
      await suspenderUsuarioAdmin(cliente, usuarioId, motivo.trim());
      setAbierto(false);
      onCompletado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo suspender.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-ui-warning/35 bg-ui-warning-soft p-4">
        <p className="font-body text-sm font-semibold text-ui-warning">Suspender cuenta</p>
        <p className="mt-1 font-body text-xs text-ui-fg-muted">Pausa el acceso sin cerrar el expediente del usuario.</p>
        <button onClick={() => setAbierto(true)} className="mt-3 rounded-lg border border-ui-warning bg-ui-warning px-4 py-2 font-body text-sm font-semibold text-ui-on-brand shadow-sm hover:bg-ui-warning/90">Suspender cuenta</button>
      </div>
      <AdminDialog
        open={abierto}
        title="Suspender cuenta"
        description="El usuario no podrá acceder hasta que un administrador reactive la cuenta."
        onOpenChange={(open) => { if (!procesando) setAbierto(open); }}
        footer={
          <>
            <button onClick={() => setAbierto(false)} disabled={procesando} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-medium">Cancelar</button>
            <button onClick={ejecutar} disabled={procesando || !motivo.trim() || !confirmado} className="rounded-lg bg-ui-danger px-4 py-2 font-body text-sm font-semibold text-ui-on-brand disabled:opacity-50">{procesando ? "Suspendiendo..." : "Confirmar suspensión"}</button>
          </>
        }
      >
        <div className="space-y-3">
          {error && <Aviso tono="danger">{error}</Aviso>}
          <div className="rounded-lg border border-ui-warning/25 bg-ui-warning-soft p-3 font-body text-sm text-ui-fg-muted">
            <p className="font-semibold text-ui-warning">Impacto de la suspensión</p>
            <p className="mt-1">Se bloquea el acceso. Los traslados, pagos e historial se conservan para seguimiento operativo.</p>
          </div>
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs font-medium text-ui-fg-muted">Motivo de la suspensión</span>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} className="min-h-[88px] rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm" rows={3} />
          </label>
          <label className="flex gap-2 rounded-lg border border-ui-danger/25 bg-ui-danger-soft p-3 font-body text-sm text-ui-fg-muted">
            <input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} className="mt-1" />
            Confirmo que revisé el expediente y entiendo que esta acción bloquea el acceso del usuario.
          </label>
        </div>
      </AdminDialog>
    </>
  );
}

export function ReactivarCuenta({ usuarioId, onCompletado }: { usuarioId: string; onCompletado: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);

  if (!abierto) return <button onClick={() => setAbierto(true)} className="rounded-lg border border-ui-success/40 bg-ui-success/10 px-4 py-2 font-body text-sm font-medium text-ui-success hover:bg-ui-success/20">Reactivar cuenta</button>;

  async function ejecutar() {
    if (!motivo.trim()) return;
    setProcesando(true);
    try {
      const cliente = crearClienteNavegador();
      await reactivarUsuarioAdmin(cliente, usuarioId, motivo.trim());
      setAbierto(false);
      onCompletado();
    } catch { /* */ }
    finally { setProcesando(false); }
  }

  return (
    <div className="rounded-lg border border-ui-success/30 bg-ui-success-soft p-4">
      <p className="font-body text-sm font-semibold text-ui-success">Reactivar cuenta</p>
      <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la reactivación" className="mt-3 w-full rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm" rows={2} />
      <div className="mt-3 flex gap-2">
        <button onClick={ejecutar} disabled={procesando || !motivo.trim()} className="rounded-lg bg-ui-success px-4 py-2 font-body text-sm font-semibold text-ui-on-brand disabled:opacity-50">{procesando ? "Reactivando..." : "Confirmar reactivación"}</button>
        <button onClick={() => setAbierto(false)} disabled={procesando} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-medium">Cancelar</button>
      </div>
    </div>
  );
}

export function CerrarCuenta({ usuarioId, onCompletado }: { usuarioId: string; onCompletado: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [procesando, setProcesando] = useState(false);

  async function ejecutar() {
    if (!motivo.trim() || confirmacion !== "CERRAR") return;
    setProcesando(true);
    try {
      const cliente = crearClienteNavegador();
      await cerrarCuentaUsuarioAdmin(cliente, usuarioId, motivo.trim());
      setAbierto(false);
      onCompletado();
    } catch { /* */ }
    finally { setProcesando(false); }
  }

  return (
    <>
      <div className="rounded-lg border border-ui-danger/35 bg-ui-danger-soft p-4">
        <p className="font-body text-sm font-semibold text-ui-danger">Cerrar cuenta</p>
        <p className="mt-1 font-body text-xs text-ui-fg-muted">Cierre definitivo con confirmación escrita obligatoria.</p>
        <button onClick={() => setAbierto(true)} className="mt-3 rounded-lg border border-ui-danger bg-ui-danger px-4 py-2 font-body text-sm font-semibold text-ui-on-brand shadow-sm hover:bg-ui-danger/90">Cerrar cuenta</button>
      </div>
      <AdminDialog
        open={abierto}
        title="Cerrar cuenta permanentemente"
        description="Esta acción no se puede deshacer y debe quedar justificada para auditoría."
        onOpenChange={(open) => { if (!procesando) setAbierto(open); }}
        footer={
          <>
            <button onClick={() => setAbierto(false)} disabled={procesando} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-medium">Cancelar</button>
            <button onClick={ejecutar} disabled={procesando || !motivo.trim() || confirmacion !== "CERRAR"} className="rounded-lg bg-ui-danger px-4 py-2 font-body text-sm font-semibold text-ui-on-brand disabled:opacity-50">{procesando ? "Cerrando..." : "Cerrar cuenta definitivamente"}</button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="rounded-lg border border-ui-danger/25 bg-ui-danger-soft p-3 font-body text-sm text-ui-fg-muted">
            <p className="font-semibold text-ui-danger">Impacto del cierre</p>
            <p className="mt-1">Se bloquea el acceso de forma definitiva. Traslados, pagos y auditoría se conservan para trazabilidad.</p>
          </div>
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs font-medium text-ui-fg-muted">Motivo del cierre</span>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} className="min-h-[88px] rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm" rows={3} />
          </label>
          <label className="flex flex-col gap-1 rounded-lg border border-ui-danger/25 bg-ui-danger-soft p-3">
            <span className="font-body text-xs font-medium text-ui-danger">Escribe CERRAR para confirmar</span>
            <input type="text" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} className="rounded-lg border border-ui-danger/30 px-3 py-2 font-body text-sm" />
          </label>
        </div>
      </AdminDialog>
    </>
  );
}
