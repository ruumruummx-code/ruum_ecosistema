"use client";

import type { AdminColaborador, ConfiguracionAdmin } from "@ruum/api/services";
import { CONFIG_ROL_ADMIN, type RolAdminOperativo } from "../../lib/roles-admin";
import {
  AdminBadge,
  AdminButton,
  AdminDialog,
  AdminInput,
  AdminSelect,
  AdminTextarea
} from "../admin-components";
import { EditorNormativo } from "./ConfiguracionNormativa";
import type { AccionCapacidad, NuevoAdminPanel } from "./ConfiguracionTipos";

interface DialogosConfiguracionProps {
  dialogoAltaAdmin: boolean;
  guardandoAltaAdmin: boolean;
  nuevoAdmin: NuevoAdminPanel;
  onNuevoAdminChange: (nuevo: NuevoAdminPanel) => void;
  onCerrarAltaAdmin: () => void;
  onGuardarAltaAdmin: () => void;

  dialogoRol: boolean;
  guardandoRol: boolean;
  colaboradorSeleccionado: AdminColaborador | null;
  rolSeleccionado: RolAdminOperativo;
  motivoRol: string;
  onMotivoRolChange: (motivo: string) => void;
  onCerrarDialogoRol: () => void;
  onConfirmarRol: () => void;

  dialogoCapacidad: boolean;
  guardandoCapacidad: boolean;
  capacidadSeleccionada: string;
  accionCapacidad: AccionCapacidad;
  motivoCapacidad: string;
  capacidadesCatalogoFiltradas: string[];
  onCapacidadChange: (capacidad: string) => void;
  onAccionCapacidadChange: (accion: AccionCapacidad) => void;
  onMotivoCapacidadChange: (motivo: string) => void;
  onCerrarDialogoCapacidad: () => void;
  onGuardarCapacidad: () => void;

  editando: ConfiguracionAdmin | null;
  guardandoNorma: boolean;
  json: string;
  jsonError: string | null;
  motivoNorma: string;
  onJsonChange: (siguiente: string) => void;
  onMotivoNormaChange: (motivo: string) => void;
  onCerrarEditorNorma: () => void;
  onGuardarNorma: () => void;
}

export function DialogosConfiguracion({
  dialogoAltaAdmin,
  guardandoAltaAdmin,
  nuevoAdmin,
  onNuevoAdminChange,
  onCerrarAltaAdmin,
  onGuardarAltaAdmin,

  dialogoRol,
  guardandoRol,
  colaboradorSeleccionado,
  rolSeleccionado,
  motivoRol,
  onMotivoRolChange,
  onCerrarDialogoRol,
  onConfirmarRol,

  dialogoCapacidad,
  guardandoCapacidad,
  capacidadSeleccionada,
  accionCapacidad,
  motivoCapacidad,
  capacidadesCatalogoFiltradas,
  onCapacidadChange,
  onAccionCapacidadChange,
  onMotivoCapacidadChange,
  onCerrarDialogoCapacidad,
  onGuardarCapacidad,

  editando,
  guardandoNorma,
  json,
  jsonError,
  motivoNorma,
  onJsonChange,
  onMotivoNormaChange,
  onCerrarEditorNorma,
  onGuardarNorma
}: DialogosConfiguracionProps) {
  return (
    <>
      <AdminDialog
        open={dialogoAltaAdmin}
        title="Dar de alta usuario del panel"
        description="Crea la identidad de acceso al panel, asigna rol operativo inicial y deja evidencia auditada."
        onOpenChange={(abierto) => { if (!abierto && !guardandoAltaAdmin) onCerrarAltaAdmin(); }}
        footer={<>
          <AdminButton variant="secondary" onClick={onCerrarAltaAdmin} disabled={guardandoAltaAdmin}>Cancelar</AdminButton>
          <AdminButton
            onClick={onGuardarAltaAdmin}
            loading={guardandoAltaAdmin}
            disabled={
              nuevoAdmin.nombre.trim().length < 3 ||
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoAdmin.correo.trim()) ||
              nuevoAdmin.motivo.trim().length < 10
            }
          >
            Crear acceso temporal
          </AdminButton>
        </>}
      >
        <div className="space-y-4">
          <AdminInput
            label="Nombre"
            value={nuevoAdmin.nombre}
            onChange={(e) => onNuevoAdminChange({ ...nuevoAdmin, nombre: e.target.value })}
            error={nuevoAdmin.nombre.length > 0 && nuevoAdmin.nombre.trim().length < 3 ? "Escribe el nombre completo." : undefined}
          />
          <AdminInput
            label="Correo"
            type="email"
            data-ruum-uppercase="off"
            value={nuevoAdmin.correo}
            onChange={(e) => onNuevoAdminChange({ ...nuevoAdmin, correo: e.target.value })}
            error={nuevoAdmin.correo.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoAdmin.correo.trim()) ? "Correo inválido." : undefined}
          />
          <AdminSelect
            label="Rol operativo inicial"
            description="Define navegación, dashboard y capacidades base desde el primer acceso."
            value={nuevoAdmin.rol}
            onChange={(e) => onNuevoAdminChange({ ...nuevoAdmin, rol: e.target.value as RolAdminOperativo })}
          >
            {Object.entries(CONFIG_ROL_ADMIN).map(([clave, rol]) => (
              <option key={clave} value={clave}>{rol.etiqueta}</option>
            ))}
          </AdminSelect>
          <AdminTextarea
            label="Motivo del alta"
            description="Mínimo 10 caracteres; se almacenará en auditoría de seguridad. La contraseña temporal se enviará por correo."
            value={nuevoAdmin.motivo}
            onChange={(e) => onNuevoAdminChange({ ...nuevoAdmin, motivo: e.target.value })}
            error={nuevoAdmin.motivo.length > 0 && nuevoAdmin.motivo.trim().length < 10 ? "Escribe al menos 10 caracteres." : undefined}
            rows={3}
          />
        </div>
      </AdminDialog>

      <AdminDialog
        open={dialogoRol}
        title="Confirmar cambio crítico de rol"
        description={`Cambiar el rol de ${colaboradorSeleccionado?.nombre ?? "este colaborador"} modifica accesos, navegación y capacidades base.`}
        onOpenChange={(abierto) => { if (!abierto && !guardandoRol) onCerrarDialogoRol(); }}
        footer={<>
          <AdminButton variant="secondary" onClick={onCerrarDialogoRol} disabled={guardandoRol}>Cancelar</AdminButton>
          <AdminButton
            variant="danger"
            onClick={onConfirmarRol}
            loading={guardandoRol}
            disabled={!colaboradorSeleccionado || rolSeleccionado === colaboradorSeleccionado.rol_operativo || motivoRol.trim().length < 10}
          >
            Confirmar cambio de rol
          </AdminButton>
        </>}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-ui-warning/30 bg-ui-warning-soft px-4 py-3">
            <div className="flex items-center gap-2">
              <AdminBadge tone="warning">Cambio crítico</AdminBadge>
              <p className="font-body text-sm font-semibold text-ui-fg">{colaboradorSeleccionado?.rol_operativo ?? "rol actual"} → {rolSeleccionado}</p>
            </div>
            <p className="mt-2 font-body text-sm text-ui-fg-muted">La fricción intencional protege cambios de acceso y deja evidencia auditada.</p>
          </div>
          <AdminTextarea
            label="Motivo obligatorio"
            description={`${motivoRol.trim().length}/10 caracteres mínimos.`}
            value={motivoRol}
            onChange={(e) => onMotivoRolChange(e.target.value)}
            error={motivoRol.length > 0 && motivoRol.trim().length < 10 ? "Escribe al menos 10 caracteres." : undefined}
            rows={3}
          />
        </div>
      </AdminDialog>

      <AdminDialog
        open={dialogoCapacidad}
        title={accionCapacidad === "conceder" ? "Conceder capacidad" : "Revocar capacidad"}
        description={`${accionCapacidad === "conceder" ? "Concede" : "Revoca"} una capacidad efectiva a ${colaboradorSeleccionado?.nombre ?? "el colaborador seleccionado"}.`}
        onOpenChange={(abierto) => { if (!abierto && !guardandoCapacidad) onCerrarDialogoCapacidad(); }}
        footer={<>
          <AdminButton variant="secondary" onClick={onCerrarDialogoCapacidad} disabled={guardandoCapacidad}>Cancelar</AdminButton>
          <AdminButton
            onClick={onGuardarCapacidad}
            loading={guardandoCapacidad}
            disabled={!capacidadSeleccionada || motivoCapacidad.trim().length < 10}
            variant={accionCapacidad === "revocar" ? "danger" : "primary"}
          >
            {accionCapacidad === "conceder" ? "Confirmar concesión" : "Confirmar revocación"}
          </AdminButton>
        </>}
      >
        <div className="space-y-4">
          <AdminSelect
            label="Capacidad"
            value={capacidadSeleccionada}
            onChange={(e) => onCapacidadChange(e.target.value)}
          >
            <option value="">Seleccionar capacidad</option>
            {capacidadesCatalogoFiltradas.map((capacidad) => (
              <option key={capacidad} value={capacidad}>{capacidad}</option>
            ))}
            <option value="capacidades:administrar" disabled>capacidades:administrar (no auto-asignable)</option>
          </AdminSelect>
          <div>
            <span className="block font-body text-sm font-medium text-ui-fg">Acción</span>
            <div className="mt-2 flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 font-body text-sm text-ui-fg">
                <input type="radio" checked={accionCapacidad === "conceder"} onChange={() => onAccionCapacidadChange("conceder")} className="accent-ui-brand" />
                Conceder
              </label>
              <label className="inline-flex items-center gap-2 font-body text-sm text-ui-fg">
                <input type="radio" checked={accionCapacidad === "revocar"} onChange={() => onAccionCapacidadChange("revocar")} className="accent-ui-brand" />
                Revocar
              </label>
            </div>
          </div>
          <AdminTextarea
            label="Motivo"
            description="Mínimo 10 caracteres; se almacena como evidencia del override."
            value={motivoCapacidad}
            onChange={(e) => onMotivoCapacidadChange(e.target.value)}
            error={motivoCapacidad.length > 0 && motivoCapacidad.trim().length < 10 ? "Escribe al menos 10 caracteres." : undefined}
            rows={3}
          />
        </div>
      </AdminDialog>

      <AdminDialog
        open={Boolean(editando)}
        title={editando ? `Editar ${editando.nombre}` : "Editar configuración"}
        description="El cambio se guarda en configuración normativa, con motivo obligatorio, control de versión y auditoría."
        onOpenChange={(abierto) => { if (!abierto && !guardandoNorma) onCerrarEditorNorma(); }}
        footer={<>
          <AdminButton variant="secondary" onClick={onCerrarEditorNorma} disabled={guardandoNorma}>Cancelar</AdminButton>
          <AdminButton onClick={onGuardarNorma} loading={guardandoNorma} disabled={motivoNorma.trim().length < 10 || Boolean(jsonError)}>Guardar cambio</AdminButton>
        </>}
      >
        <div className="space-y-4">
          {editando && (
            <EditorNormativo
              registro={editando}
              json={json}
              onChange={onJsonChange}
              error={jsonError}
            />
          )}
          <AdminTextarea
            label="Motivo del cambio"
            description="Mínimo 10 caracteres; se almacenará en auditoría de seguridad."
            value={motivoNorma}
            onChange={(e) => onMotivoNormaChange(e.target.value)}
            error={motivoNorma.length > 0 && motivoNorma.trim().length < 10 ? "Escribe al menos 10 caracteres." : undefined}
            rows={3}
          />
        </div>
      </AdminDialog>
    </>
  );
}
