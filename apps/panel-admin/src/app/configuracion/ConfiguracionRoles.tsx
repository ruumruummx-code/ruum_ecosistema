"use client";

import { useMemo, useState } from "react";
import type { AdminColaborador, CapacidadAdmin } from "@ruum/api/services";
import { CONFIG_ROL_ADMIN, type RolAdminOperativo } from "../../lib/roles-admin";
import {
  AdminBadge,
  AdminButton,
  AdminErrorState,
  AdminInput,
  AdminLoadingState,
  AdminSelect,
  AdminTextarea
} from "../admin-components";
import {
  CATEGORIAS_CAPACIDAD,
  formatearFecha,
  categoriaCapacidad,
  claseTipoCapacidad,
  type AccionCapacidad
} from "./ConfiguracionTipos";

interface ConfiguracionRolesProps {
  colaboradores: AdminColaborador[];
  colaboradorId: string;
  cargandoRoles: boolean;
  errorRoles: string | null;
  capacidades: CapacidadAdmin[];
  rolSeleccionado: RolAdminOperativo;
  motivoRol: string;
  onColaboradorChange: (id: string) => void;
  onRolChange: (rol: RolAdminOperativo) => void;
  onMotivoRolChange: (motivo: string) => void;
  onAbrirDialogoRol: () => void;
  onAbrirDialogoCapacidad: (capacidad?: string, accion?: AccionCapacidad) => void;
  onAbrirDialogoAltaAdmin: () => void;
  onRecargarRoles: () => void;
}

export function ConfiguracionRoles({
  colaboradores,
  colaboradorId,
  cargandoRoles,
  errorRoles,
  capacidades,
  rolSeleccionado,
  motivoRol,
  onColaboradorChange,
  onRolChange,
  onMotivoRolChange,
  onAbrirDialogoRol,
  onAbrirDialogoCapacidad,
  onAbrirDialogoAltaAdmin,
  onRecargarRoles
}: ConfiguracionRolesProps) {
  const [busquedaCapacidad, setBusquedaCapacidad] = useState("");

  const colaboradorSeleccionado = colaboradores.find((item) => item.id === colaboradorId) ?? null;
  const rolBase = CONFIG_ROL_ADMIN[rolSeleccionado];

  const capacidadesFiltradas = useMemo(() => {
    const q = busquedaCapacidad.trim().toLowerCase();
    if (!q) return capacidades;
    return capacidades.filter((capacidad) => [
      capacidad.capacidad,
      capacidad.origen,
      capacidad.motivo ?? "",
      categoriaCapacidad(capacidad.capacidad)
    ].join(" ").toLowerCase().includes(q));
  }, [busquedaCapacidad, capacidades]);

  const capacidadesPorCategoria = useMemo(() => {
    return capacidadesFiltradas.reduce<Record<string, CapacidadAdmin[]>>((acc, capacidad) => {
      const categoria = categoriaCapacidad(capacidad.capacidad);
      (acc[categoria] ??= []).push(capacidad);
      return acc;
    }, {});
  }, [capacidadesFiltradas]);

  return (
    <>
      <section className="mt-6 rounded-2xl border border-ui-line bg-ui-card p-5" aria-labelledby="roles-capacidades-direccion">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <AdminBadge tone="warning">Solo Dirección</AdminBadge>
            <h2 id="roles-capacidades-direccion" className="mt-3 font-display text-xl font-semibold text-ui-fg">Roles y capacidades por colaborador</h2>
            <p className="mt-1 max-w-3xl font-body text-sm text-ui-fg-muted">
              Configura el rol operativo base y los permisos efectivos de un colaborador de Torre de Control. Cada cambio exige motivo y se ejecuta por RPC auditado.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="secondary" onClick={onAbrirDialogoAltaAdmin}>
              Dar de alta usuario
            </AdminButton>
            <AdminButton variant="secondary" onClick={onRecargarRoles} disabled={cargandoRoles}>
              Actualizar
            </AdminButton>
          </div>
        </div>

        {cargandoRoles ? (
          <div className="mt-5"><AdminLoadingState label="Cargando roles y capacidades" /></div>
        ) : errorRoles ? (
          <div className="mt-5">
            <AdminErrorState title="Roles no disponibles" description={errorRoles} action={<AdminButton onClick={onRecargarRoles}>Reintentar</AdminButton>} />
          </div>
        ) : (
          <div className="mt-5 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <AdminSelect
                label="Colaborador"
                description="Administrador registrado en Torre de Control."
                value={colaboradorId}
                onChange={(e) => onColaboradorChange(e.target.value)}
              >
                <option value="">Seleccionar colaborador</option>
                {colaboradores.map((colaborador) => (
                  <option key={colaborador.id} value={colaborador.id}>{colaborador.nombre} ({colaborador.rol_operativo})</option>
                ))}
              </AdminSelect>

              {colaboradorSeleccionado && (
                <div className="rounded-xl border border-ui-line bg-ui-muted p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-ui-fg">{colaboradorSeleccionado.nombre}</h3>
                      <p className="mt-1 font-body text-xs text-ui-fg-muted">Alta {formatearFecha(colaboradorSeleccionado.creado_en)}</p>
                    </div>
                    <AdminBadge tone={colaboradorSeleccionado.rol_operativo === "direccion" ? "warning" : "neutral"}>{colaboradorSeleccionado.rol_operativo}</AdminBadge>
                  </div>
                </div>
              )}

              <AdminSelect
                label="Rol operativo base"
                description="Define dashboard, navegación y permisos base."
                value={rolSeleccionado}
                onChange={(e) => onRolChange(e.target.value as RolAdminOperativo)}
                disabled={!colaboradorSeleccionado}
              >
                {Object.entries(CONFIG_ROL_ADMIN).map(([clave, rol]) => (
                  <option key={clave} value={clave}>{rol.etiqueta}</option>
                ))}
              </AdminSelect>

              <AdminTextarea
                label="Motivo del cambio de rol"
                description={`${motivoRol.trim().length}/10 caracteres mínimos.`}
                value={motivoRol}
                onChange={(e) => onMotivoRolChange(e.target.value)}
                error={motivoRol.length > 0 && motivoRol.trim().length < 10 ? "Escribe al menos 10 caracteres." : undefined}
                rows={3}
              />
              <div className="flex items-center justify-between gap-3">
                <AdminBadge tone="warning">Cambio crítico</AdminBadge>
                <span className={`font-mono-ruum text-xs ${motivoRol.trim().length >= 10 ? "text-ui-success" : "text-ui-warning"}`}>
                  {motivoRol.trim().length}/10
                </span>
              </div>

              <AdminButton
                onClick={onAbrirDialogoRol}
                variant="danger"
                disabled={!colaboradorSeleccionado || rolSeleccionado === colaboradorSeleccionado.rol_operativo || motivoRol.trim().length < 10}
              >
                Preparar cambio de rol
              </AdminButton>

              <div className="rounded-xl border border-ui-line p-4">
                <h3 className="font-body text-sm font-semibold text-ui-fg">Rol seleccionado</h3>
                <p className="mt-1 font-body text-sm text-ui-fg-muted">{rolBase.descripcion}</p>
                <p className="mt-3 font-body text-xs text-ui-fg-muted">{rolBase.rutasPermitidas.length} rutas base · {rolBase.indicadores.length} indicadores visibles</p>
              </div>
            </aside>

            <section>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold text-ui-fg">Capacidades efectivas</h3>
                  <p className="mt-1 font-body text-sm text-ui-fg-muted">El origen indica si la capacidad viene del rol base o de un override individual.</p>
                </div>
                <AdminButton variant="secondary" onClick={() => onAbrirDialogoCapacidad()} disabled={!colaboradorSeleccionado}>
                  Configurar capacidad
                </AdminButton>
              </div>
              <div className="mt-4">
                <AdminInput
                  label="Buscar capacidad"
                  type="search"
                  placeholder="Ej. Traslados, pagos, auditoria"
                  value={busquedaCapacidad}
                  onChange={(e) => setBusquedaCapacidad(e.target.value)}
                />
              </div>
              <div className="mt-4 grid gap-4">
                {CATEGORIAS_CAPACIDAD.map((categoria) => {
                  const items = capacidadesPorCategoria[categoria] ?? [];
                  if (items.length === 0) return null;
                  return (
                    <section key={categoria} className="rounded-xl border border-ui-line bg-ui-muted p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="font-body text-sm font-semibold text-ui-fg">{categoria}</h4>
                        <AdminBadge tone="neutral">{items.length}</AdminBadge>
                      </div>
                      <div className="mt-3 grid gap-2">
                        {items.map((capacidad) => (
                          <article key={capacidad.capacidad} className="rounded-lg border border-ui-line bg-ui-card px-3 py-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`grid size-7 place-items-center rounded-full border ${claseTipoCapacidad(capacidad.capacidad)}`} aria-hidden="true">
                                    <span className="size-1.5 rounded-full bg-current" />
                                  </span>
                                  <p className="font-mono-ruum text-xs font-semibold text-ui-fg">{capacidad.capacidad}</p>
                                  <AdminBadge tone={capacidad.origen === "override" ? "warning" : "neutral"}>{capacidad.origen === "override" ? "Override individual" : "Rol base"}</AdminBadge>
                                  <AdminBadge tone={capacidad.concedida ? "success" : "danger"}>{capacidad.concedida ? "Concedida" : "Revocada"}</AdminBadge>
                                </div>
                                <p className="mt-2 font-body text-xs text-ui-fg-muted">{capacidad.motivo ?? "Sin motivo individual"}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => onAbrirDialogoCapacidad(capacidad.capacidad, capacidad.concedida ? "revocar" : "conceder")}
                                className={`font-body text-xs font-semibold hover:underline ${capacidad.concedida ? "text-ui-danger" : "text-ui-brand-soft-fg"}`}
                              >
                                {capacidad.concedida ? "Revocar" : "Conceder"}
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })}
                {capacidades.length === 0 && (
                  <p className="rounded-xl border border-dashed border-ui-line px-4 py-8 text-center font-body text-sm text-ui-fg-muted">Selecciona un colaborador para revisar sus capacidades.</p>
                )}
                {capacidades.length > 0 && capacidadesFiltradas.length === 0 && (
                  <p className="rounded-xl border border-dashed border-ui-line px-4 py-8 text-center font-body text-sm text-ui-fg-muted">No hay capacidades que coincidan con la búsqueda.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-ui-line bg-ui-card p-5">
        <h2 className="font-display text-xl font-semibold text-ui-fg">Matriz efectiva de roles</h2>
        <p className="mt-1 font-body text-sm text-ui-fg-muted">Esta vista se genera desde la misma definición de roles que controla la navegación del panel.</p>
        <div className="mt-5 grid gap-4">
          {Object.entries(CONFIG_ROL_ADMIN).map(([clave, rol]) => {
            const porcentaje = Math.max(8, Math.round((rol.rutasPermitidas.length / CONFIG_ROL_ADMIN.direccion.rutasPermitidas.length) * 100));
            return (
              <article key={clave} className="rounded-xl border border-ui-line p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-body text-sm font-semibold text-ui-fg">{rol.etiqueta}</h3>
                      <AdminBadge tone={clave === "direccion" ? "warning" : "neutral"}>{clave}</AdminBadge>
                    </div>
                    <p className="mt-1 font-body text-xs text-ui-fg-muted">{rol.descripcion}</p>
                  </div>
                  <p className="font-mono-ruum text-xs text-ui-fg-muted">{rol.rutasPermitidas.length} rutas base</p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-ui-muted" title={rol.descripcion}>
                  <div className="h-2 rounded-full bg-ui-brand" style={{ width: `${porcentaje}%` }} />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
