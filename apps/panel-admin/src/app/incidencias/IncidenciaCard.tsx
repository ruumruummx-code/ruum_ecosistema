"use client";

import { useState } from "react";
import Link from "next/link";
import {
  extraerRutaIncidencia,
  obtenerAdminActual,
  resolverUrlEvidencia
} from "@ruum/api/services";
import {
  asignarIncidenciaAdmin,
  escalarIncidenciaAdmin,
  listarHistorialIncidencia,
  resolverIncidenciaAdmin,
  type MovimientoIncidencia
} from "@ruum/api/incidents";
import { ETIQUETA_ESTADO_INCIDENCIA, ETIQUETA_SEVERIDAD_INCIDENCIA } from "@ruum/shared/constants";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import { AdminButton, AdminDialog, AdminTooltip } from "../admin-components";
import { AdminPanel } from "../admin-ui";
import { BadgeIncidencia } from "./IncidenciasComponentes";
import {
  type Incidencia,
  type FiltroResponsable,
  RESPONSABLES_ASIGNABLES,
  CLASE_BADGE,
  etiquetaTipo,
  etiquetaResponsable,
  etiquetaOrigen,
  origenInferido,
  responsableSugerido,
  gravedadIncidencia,
  horasTranscurridas,
  formatoDuracion,
  slaIncidencia
} from "./IncidenciasTipos";

interface IncidenciaCardProps {
  incidencia: Incidencia;
  ahora: Date;
  responsable: Exclude<FiltroResponsable, "todos"> | "";
  onResponsable: (value: Exclude<FiltroResponsable, "todos">) => void;
  onAccion: (accion: string) => void;
  onCambio: () => void;
  esDemo: boolean;
}

export function IncidenciaCard({
  incidencia,
  ahora,
  responsable,
  onResponsable,
  onAccion,
  onCambio,
  esDemo
}: IncidenciaCardProps) {
  const gravedad = gravedadIncidencia(incidencia);
  const origen = origenInferido(incidencia);
  const sla = incidencia.sla_vence_en
    ? (() => {
        const restanteMs = new Date(incidencia.sla_vence_en as string).getTime() - ahora.getTime();
        const restanteHoras = restanteMs / 3_600_000;
        return {
          texto: incidencia.resuelta
            ? "SLA cerrado"
            : restanteHoras > 0
              ? `${formatoDuracion(restanteHoras)} restantes (acuerdo)`
              : `${formatoDuracion(Math.abs(restanteHoras))} vencido`,
          enRiesgo: !incidencia.resuelta && restanteHoras > 0 && restanteHoras < 8,
          vencido: !incidencia.resuelta && restanteHoras <= 0
        };
      })()
    : slaIncidencia(incidencia, ahora);
  const estado = incidencia.estado ?? (incidencia.resuelta ? "resuelta" : "abierta");
  const severidad = incidencia.severidad ?? "medium";
  const trasladoHref = incidencia.traslado_id ? `/viajes/${incidencia.traslado_id}` : "/viajes";
  const { ruta: evidenciaRuta, nombre: evidenciaNombre, textoLimpio } = extraerRutaIncidencia(incidencia.descripcion);
  const [cargandoEvidencia, setCargandoEvidencia] = useState(false);
  const [dialogo, setDialogo] = useState<null | "resolver" | "escalar">(null);
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [historial, setHistorial] = useState<MovimientoIncidencia[] | null>(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const cerrada = estado === "resuelta" || estado === "cerrada";

  async function handleVerEvidencia() {
    if (!evidenciaRuta) return;
    setCargandoEvidencia(true);
    try {
      const cliente = crearClienteNavegador();
      const urlTemporal = await resolverUrlEvidencia(cliente, evidenciaRuta, 60 * 30);
      if (urlTemporal) {
        window.open(urlTemporal, "_blank", "noopener,noreferrer");
      } else {
        onAccion("No se pudo generar la URL temporal de la evidencia.");
      }
    } catch {
      onAccion("Error al abrir la evidencia.");
    } finally {
      setCargandoEvidencia(false);
    }
  }

  async function ejecutarDialogo() {
    if (!dialogo) return;
    if (esDemo) {
      onAccion(`[${dialogo}] solo demo: sin persistir.`);
      setDialogo(null);
      setMotivo("");
      return;
    }
    setProcesando(true);
    try {
      const cliente = crearClienteNavegador();
      if (dialogo === "resolver") {
        await resolverIncidenciaAdmin(cliente, incidencia.id, motivo.trim() || null);
        onAccion("Incidencia resuelta. El traslado conserva su estado operativo.");
      } else {
        await escalarIncidenciaAdmin(cliente, incidencia.id, motivo.trim());
        onAccion("Incidencia escalada a supervisión.");
      }
      setDialogo(null);
      setMotivo("");
      setHistorial(null);
      onCambio();
    } catch (e) {
      onAccion(e instanceof Error ? e.message : "No se pudo completar la acción.");
    } finally {
      setProcesando(false);
    }
  }

  async function asignarme() {
    if (esDemo) {
      onAccion("[asignar] solo demo: sin persistir.");
      return;
    }
    setProcesando(true);
    try {
      const cliente = crearClienteNavegador();
      const admin = await obtenerAdminActual(cliente);
      if (!admin) throw new Error("Sin sesión administrativa.");
      await asignarIncidenciaAdmin(cliente, incidencia.id, admin.id);
      onAccion("Te asignaste la incidencia.");
      onCambio();
    } catch (e) {
      onAccion(e instanceof Error ? e.message : "No se pudo asignar.");
    } finally {
      setProcesando(false);
    }
  }

  async function alternarHistorial() {
    const siguiente = !mostrarHistorial;
    setMostrarHistorial(siguiente);
    if (siguiente && historial === null && !esDemo) {
      setCargandoHistorial(true);
      try {
        setHistorial(await listarHistorialIncidencia(crearClienteNavegador(), incidencia.id));
      } catch (e) {
        onAccion(e instanceof Error ? e.message : "No se pudo cargar el historial.");
        setMostrarHistorial(false);
      } finally {
        setCargandoHistorial(false);
      }
    }
  }

  return (
    <AdminPanel className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-mono-ruum text-xs uppercase tracking-wide text-ui-fg-muted">Caso {incidencia.id.slice(0, 16).toUpperCase()}</p>
          <h2 className="mt-1 font-display text-xl font-semibold capitalize text-ui-fg">{etiquetaTipo(incidencia.tipo)}</h2>
          <p className="mt-2 max-w-3xl font-body text-sm text-ui-fg-muted whitespace-pre-line">{textoLimpio || incidencia.descripcion}</p>
          {evidenciaNombre && (
            <p className="mt-1 font-body text-xs text-ui-fg-muted">📎 Evidencia: {evidenciaNombre}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <BadgeIncidencia className={CLASE_BADGE.estado[incidencia.resuelta ? "resuelta" : "abierta"]}>
            {ETIQUETA_ESTADO_INCIDENCIA[estado] ?? estado}
          </BadgeIncidencia>
          <BadgeIncidencia className={CLASE_BADGE.gravedad[gravedad]}>{gravedad}</BadgeIncidencia>
          <BadgeIncidencia className="border-ui-line bg-ui-card text-ui-fg-muted">
            Sev. {ETIQUETA_SEVERIDAD_INCIDENCIA[severidad] ?? severidad}
          </BadgeIncidencia>
          {incidencia.nivel_escalamiento > 0 ? (
            <BadgeIncidencia className="border-ui-danger/30 bg-ui-danger-soft text-ui-danger">
              Escalada N{incidencia.nivel_escalamiento}
            </BadgeIncidencia>
          ) : null}
        </div>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div>
          <dt className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Origen</dt>
          <dd className="mt-1 font-body text-sm font-medium">{etiquetaOrigen(origen)}</dd>
        </div>
        <div>
          <dt className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Creación</dt>
          <dd className="mt-1 font-body text-sm font-medium">{new Date(incidencia.creada_en).toLocaleString("es-MX")}</dd>
        </div>
        <div>
          <dt className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Transcurrido</dt>
          <dd className="mt-1 font-mono-ruum text-sm font-medium">{formatoDuracion(horasTranscurridas(incidencia.creada_en, ahora))}</dd>
        </div>
        <div>
          <dt className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">SLA</dt>
          <dd className={`mt-1 font-body text-sm font-semibold ${sla.vencido || sla.enRiesgo ? "text-ui-danger" : "text-ui-success"}`}>{sla.texto}</dd>
        </div>
        <div>
          <dt className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Responsable Torre</dt>
          <dd className="mt-1 font-body text-sm font-medium">
            {incidencia.responsable_admin_id ? `Admin ${incidencia.responsable_admin_id.slice(0, 8)}…` : "Sin asignar"}
          </dd>
        </div>
        <div>
          <dt className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Reportada por</dt>
          <dd className="mt-1 font-body text-sm font-medium capitalize">{incidencia.reportada_por}</dd>
        </div>
        <div>
          <dt className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Momento</dt>
          <dd className="mt-1 font-body text-sm font-medium capitalize">{incidencia.momento.replaceAll("_", " ")}</dd>
        </div>
      </dl>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(220px,280px)_1fr] lg:items-end">
        <label className="flex flex-col gap-1 font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">
          Responsable
          <select
            value={responsable}
            onChange={(event) => onResponsable(event.target.value as Exclude<FiltroResponsable, "todos">)}
            className="min-h-10 rounded-lg border border-ui-line bg-ui-card px-3 py-2 font-body text-sm font-semibold normal-case tracking-normal text-ui-fg outline-none transition-colors focus:border-ui-focus"
          >
            <option value="">Seleccionar operador</option>
            {RESPONSABLES_ASIGNABLES.map((item) => (
              <option key={item.valor} value={item.valor}>{item.etiqueta}</option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Link href={trasladoHref} className="inline-flex min-h-10 items-center justify-center rounded-lg border border-ui-line px-4 py-2 font-body text-sm font-semibold text-ui-fg-muted transition-colors hover:border-ui-brand/50 hover:text-ui-fg">
            Ver origen
          </Link>
          <AdminButton variant="quiet" type="button" onClick={() => void asignarme()} disabled={procesando || cerrada}>
            Asignarme
          </AdminButton>
          <AdminButton variant="quiet" type="button" onClick={() => setDialogo("escalar")} disabled={procesando || cerrada}>
            Escalar
          </AdminButton>
          <AdminButton variant="quiet" type="button" onClick={() => setDialogo("resolver")} disabled={procesando || cerrada}>
            Resolver
          </AdminButton>
          <AdminButton variant="quiet" type="button" onClick={() => void alternarHistorial()} disabled={cargandoHistorial}>
            {mostrarHistorial ? "Ocultar historial" : "Historial"}
          </AdminButton>
          {evidenciaRuta ? (
            <AdminButton
              variant="secondary"
              type="button"
              loading={cargandoEvidencia}
              onClick={() => void handleVerEvidencia()}
            >
              Vista previa evidencia
            </AdminButton>
          ) : (
            <AdminTooltip label="Este registro no tiene evidencia adjunta en la bandeja actual.">
              <span>
                <AdminButton variant="quiet" type="button" disabled>Vista previa evidencia</AdminButton>
              </span>
            </AdminTooltip>
          )}
        </div>
      </div>

      {!responsable && (
        <p className="mt-3 font-body text-xs text-ui-fg-muted">
          Responsable sugerido: {etiquetaResponsable(responsableSugerido(incidencia))}. La asignación rápida queda visible para operar sin abrir el detalle.
        </p>
      )}

      {mostrarHistorial && (
        <div className="mt-5">
          <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Historial</h3>
          {cargandoHistorial ? (
            <p className="mt-2 font-body text-sm text-ui-fg-muted">Cargando historial…</p>
          ) : historial === null || historial.length === 0 ? (
            <p className="mt-2 font-body text-sm text-ui-fg-muted">Sin movimientos registrados.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {historial.map((movimiento) => (
                <li key={movimiento.id} className="font-body text-sm text-ui-fg-muted">
                  <strong className="text-ui-fg">{movimiento.accion}</strong>
                  {movimiento.estado_anterior || movimiento.estado_nuevo
                    ? ` · ${movimiento.estado_anterior ?? "?"} → ${movimiento.estado_nuevo ?? "?"}`
                    : null}{" "}
                  <span>· {movimiento.actor}{movimiento.motivo ? ` · ${movimiento.motivo}` : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <AdminDialog
        open={dialogo !== null}
        title={dialogo === "resolver" ? "Resolver incidencia" : "Escalar incidencia"}
        description={
          dialogo === "resolver"
            ? "Se marca resuelta y se apaga el flag del traslado sin mover su estado operativo."
            : "Sube un nivel y avisa a supervisión."
        }
        onOpenChange={(abierto) => { if (!abierto) { setDialogo(null); setMotivo(""); } }}
        footer={
          <>
            <button type="button" onClick={() => { setDialogo(null); setMotivo(""); }} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted">Cancelar</button>
            <button
              type="button"
              onClick={() => void ejecutarDialogo()}
              disabled={procesando || (dialogo === "escalar" && motivo.trim().length < 5)}
              className="rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-brand-hover"
            >
              {procesando ? "Procesando…" : "Confirmar"}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="font-body text-sm font-semibold text-ui-fg-muted">
              Motivo {dialogo === "escalar" ? "*" : "(opcional)"}
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm text-ui-fg"
              placeholder={dialogo === "escalar" ? "Motivo obligatorio (mín. 5 caracteres)" : "Motivo de resolución"}
              rows={3}
            />
          </div>
        </div>
      </AdminDialog>
    </AdminPanel>
  );
}
