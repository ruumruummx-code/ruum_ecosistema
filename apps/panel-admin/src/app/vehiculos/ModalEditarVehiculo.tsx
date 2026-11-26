import type { Dispatch, SetStateAction } from "react";
import { Aviso } from "@ruum/ui";
import type { VehiculoActualizarAdmin } from "@ruum/api/services";
import { AdminButton } from "../admin-components";
import type { Vehiculo } from "./VehiculosTipos";

export function ModalEditarVehiculo({
  vehiculo,
  editForm,
  setEditForm,
  versionEditando,
  guardando,
  errorEdicion,
  avisoGuardado,
  onCancelar,
  onGuardar
}: {
  vehiculo: Vehiculo;
  editForm: VehiculoActualizarAdmin;
  setEditForm: Dispatch<SetStateAction<VehiculoActualizarAdmin>>;
  versionEditando: number;
  guardando: boolean;
  errorEdicion: string | null;
  avisoGuardado: string | null;
  onCancelar: () => void;
  onGuardar: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="editar-vehiculo-titulo"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ui-overlay pt-10"
    >
      <div className="mx-4 mb-10 w-full max-w-2xl rounded-lg border border-ui-line bg-ui-card shadow-xl">
        <div className="flex items-center justify-between border-b border-ui-line px-6 py-4">
          <div>
            <h2 id="editar-vehiculo-titulo" className="font-display text-lg font-semibold text-ui-fg">
              Editar vehículo · {vehiculo.marca} {vehiculo.modelo}
            </h2>
            <p className="font-body text-sm text-ui-fg-muted">
              v{versionEditando} · Los cambios se auditan automáticamente
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg p-2 text-ui-fg-muted hover:bg-ui-muted hover:text-ui-fg"
            aria-label="Cerrar edición"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-6">
          {errorEdicion && <Aviso tono="danger">{errorEdicion}</Aviso>}
          {avisoGuardado && <Aviso tono="info">{avisoGuardado}</Aviso>}

          <div className="grid grid-cols-2 gap-4">
            <CampoEdicion label="Marca">
              <input
                data-ruum-label="Marca"
                value={editForm.marca ?? ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, marca: e.target.value }))}
                className="w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm"
              />
            </CampoEdicion>
            <CampoEdicion label="Modelo">
              <input
                data-ruum-label="Modelo"
                value={editForm.modelo ?? ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, modelo: e.target.value }))}
                className="w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm"
              />
            </CampoEdicion>
            <CampoEdicion label="Año">
              <input
                type="number"
                value={editForm.anio ?? ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, anio: Number(e.target.value) }))}
                className="w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm"
              />
            </CampoEdicion>
            <CampoEdicion label="Color">
              <input
                data-ruum-label="Color"
                value={editForm.color ?? ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, color: e.target.value }))}
                className="w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm"
              />
            </CampoEdicion>
            <CampoEdicion label="Placas">
              <input
                data-ruum-label="Placas"
                data-ruum-uppercase="off"
                value={editForm.placas ?? ""}
                onChange={(e) => setEditForm((prev) => ({ ...prev, placas: e.target.value }))}
                className="w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm"
              />
            </CampoEdicion>
            <CampoEdicion label="VIN">
              <input
                data-ruum-label="VIN"
                data-ruum-uppercase="on"
                value={editForm.vin ?? ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, vin: e.target.value.toLocaleUpperCase("es-MX") }))
                }
                className="w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm"
              />
            </CampoEdicion>
          </div>

          <div className="border-t border-ui-line pt-4">
            <p className="mb-3 font-body text-sm font-semibold text-ui-fg">Documentación</p>
            <div className="grid grid-cols-2 gap-3">
              <CheckboxField
                label="Tarjeta de circulación"
                checked={editForm.tiene_tarjeta_circulacion ?? false}
                onChange={(v) => setEditForm((prev) => ({ ...prev, tiene_tarjeta_circulacion: v }))}
              />
              <CheckboxField
                label="Verificación"
                checked={editForm.tiene_verificacion ?? false}
                onChange={(v) => setEditForm((prev) => ({ ...prev, tiene_verificacion: v }))}
              />
              <CheckboxField
                label="Placas"
                checked={editForm.tiene_placas ?? false}
                onChange={(v) => setEditForm((prev) => ({ ...prev, tiene_placas: v }))}
              />
              <CheckboxField
                label="Puede circular rodando"
                checked={editForm.puede_circular_rodando ?? false}
                onChange={(v) => setEditForm((prev) => ({ ...prev, puede_circular_rodando: v }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-ui-line pt-4">
            <p className="font-body text-xs text-ui-fg-muted">
              Versión actual: {versionEditando} · Se incrementará al guardar
            </p>
            <div className="flex gap-2">
              <AdminButton variant="secondary" onClick={onCancelar}>
                Cancelar
              </AdminButton>
              <AdminButton loading={guardando} onClick={onGuardar}>
                Guardar cambios
              </AdminButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CampoEdicion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-body text-xs font-semibold text-ui-fg-muted">{label}</span>
      {children}
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-ui-line-strong px-3 py-2.5 hover:bg-ui-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-ui-line-strong text-ui-brand focus:ring-ui-brand/30"
      />
      <span className="font-body text-sm text-ui-fg">{label}</span>
    </label>
  );
}
