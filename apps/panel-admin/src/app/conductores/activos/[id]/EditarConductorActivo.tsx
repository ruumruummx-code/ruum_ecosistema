import { useState } from "react";
import { Aviso } from "@ruum/ui";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { actualizarConductorAdmin } from "@ruum/api/services";
import type { ConductorRow } from "./ConductorActivoComponentes";

export function EditarConductor({
  conductor,
  editando,
  setEditando,
  onActualizado
}: {
  conductor: ConductorRow;
  editando: boolean;
  setEditando: (valor: boolean) => void;
  onActualizado: (c: ConductorRow) => void;
}) {
  const [datos, setDatos] = useState({
    nombre: conductor.nombre ?? "",
    telefono: conductor.telefono ?? "",
    curp: conductor.curp ?? "",
    licencia_numero: conductor.licencia_numero ?? "",
    licencia_tipo: conductor.licencia_tipo ?? "",
    licencia_vigencia: conductor.licencia_vigencia ?? "",
    codigo_postal: conductor.codigo_postal ?? "",
    estado_residencia: conductor.estado_residencia ?? "",
    ciudad_municipio: conductor.ciudad_municipio ?? "",
    colonia: conductor.colonia ?? "",
    calle: conductor.calle ?? "",
    numero: conductor.numero ?? "",
    referencias: conductor.referencias ?? "",
    contacto_emergencia_nombre: conductor.contacto_emergencia_nombre ?? "",
    contacto_emergencia_telefono: conductor.contacto_emergencia_telefono ?? ""
  });
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editando) {
    return (
      <div>
        <h2 className="font-display text-lg font-semibold">Editar datos</h2>
        <p className="mt-1 font-body text-sm text-ui-fg-muted">
          Usa el botón “Editar datos” de la cabecera para modificar esta ficha.
        </p>
      </div>
    );
  }

  async function guardar() {
    setProcesando(true);
    setError(null);
    try {
      const cliente = crearClienteNavegador();
      const actualizado = await actualizarConductorAdmin(cliente, conductor.id, datos);
      onActualizado(actualizado);
      setEditando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold">Editar datos</h2>
      {error && (
        <div className="mt-2">
          <Aviso tono="danger">{error}</Aviso>
        </div>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre" value={datos.nombre} onChange={(v) => setDatos({ ...datos, nombre: v })} />
        <Campo label="Teléfono" value={datos.telefono} onChange={(v) => setDatos({ ...datos, telefono: v })} />
        <Campo label="CURP" value={datos.curp} onChange={(v) => setDatos({ ...datos, curp: v })} />
        <Campo
          label="Licencia"
          value={datos.licencia_numero}
          onChange={(v) => setDatos({ ...datos, licencia_numero: v.toLocaleUpperCase("es-MX") })}
        />
        <Campo label="Tipo licencia" value={datos.licencia_tipo} onChange={(v) => setDatos({ ...datos, licencia_tipo: v })} />
        <Campo label="Vigencia" value={datos.licencia_vigencia} onChange={(v) => setDatos({ ...datos, licencia_vigencia: v })} />
        <Campo label="Código postal" value={datos.codigo_postal} onChange={(v) => setDatos({ ...datos, codigo_postal: v })} />
        <Campo label="Estado" value={datos.estado_residencia} onChange={(v) => setDatos({ ...datos, estado_residencia: v })} />
        <Campo label="Ciudad/Municipio" value={datos.ciudad_municipio} onChange={(v) => setDatos({ ...datos, ciudad_municipio: v })} />
        <Campo label="Colonia" value={datos.colonia} onChange={(v) => setDatos({ ...datos, colonia: v })} />
        <Campo label="Calle" value={datos.calle} onChange={(v) => setDatos({ ...datos, calle: v })} />
        <Campo label="Número" value={datos.numero} onChange={(v) => setDatos({ ...datos, numero: v })} />
        <Campo label="Referencias" value={datos.referencias} onChange={(v) => setDatos({ ...datos, referencias: v })} />
        <Campo
          label="Contacto emergencia"
          value={datos.contacto_emergencia_nombre}
          onChange={(v) => setDatos({ ...datos, contacto_emergencia_nombre: v })}
        />
        <Campo
          label="Tel. emergencia"
          value={datos.contacto_emergencia_telefono}
          onChange={(v) => setDatos({ ...datos, contacto_emergencia_telefono: v })}
        />
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={guardar}
          disabled={procesando}
          className="rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-on-brand hover:bg-ui-brand-hover disabled:opacity-50"
        >
          {procesando ? "Guardando…" : "Guardar cambios"}
        </button>
        <button
          onClick={() => setEditando(false)}
          disabled={procesando}
          className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-medium hover:bg-ui-muted"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Campo({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-xs font-medium text-ui-fg-muted">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-ruum-label={label}
        className="rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring"
      />
    </label>
  );
}
