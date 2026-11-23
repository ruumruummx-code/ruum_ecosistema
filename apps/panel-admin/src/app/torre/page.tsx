"use client";

import { useCallback, useEffect, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Badge, Button, Card, NativeSelect } from "@ruum/ui/base";
import { Copy, RefreshCw } from "lucide-react";
import { ESTADOS_OPERATIVOS, estaViajando } from "@ruum/shared/states";
import type { EstadoTraslado } from "@ruum/shared/types";
import {
  listarAtencionPrioritaria,
  obtenerFiltrosTorre,
  obtenerKpisTorre,
  obtenerTimelineTraslado,
  type EventoTimeline,
  type FiltrosDisponibles,
  type FiltrosTorre,
  type ItemAtencion,
  type KpisTorre
} from "@ruum/api/operations";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { AdminPageHeader } from "../admin-ui";
import { AdminDrawer, AdminEmptyState, AdminErrorState, AdminLoadingState } from "../admin-components";

const FILTROS_VACIOS: FiltrosTorre = { empresaId: null, operacionId: null, ciudad: null, operativo: null };
const VACIOS: FiltrosDisponibles = { empresas: [], operaciones: [], ciudades: [] };

function TarjetaKpi({ etiqueta, valor, href, tono }: { etiqueta: string; valor: number; href: string; tono?: "warning" | "danger" }) {
  const alerta = tono && valor > 0;
  return (
    <Card asChild className="flex flex-col gap-1 p-4 transition-colors hover:border-ui-line-strong hover:bg-ui-muted">
      <Link href={href}>
        <span className="text-xs font-medium text-ui-fg-muted">{etiqueta}</span>
        <span className="flex items-baseline justify-between gap-2">
          <strong className={`text-3xl font-semibold tabular-nums tracking-tight ${alerta ? (tono === "danger" ? "text-ui-danger" : "text-ui-warning") : "text-ui-fg"}`}>{valor}</strong>
          {alerta && <Badge tone={tono}>{tono === "danger" ? "Crítico" : "Atención"}</Badge>}
        </span>
      </Link>
    </Card>
  );
}

export default function PaginaTorre() {
  const [kpis, setKpis] = useState<KpisTorre | null>(null);
  const [items, setItems] = useState<ItemAtencion[]>([]);
  const [disponibles, setDisponibles] = useState<FiltrosDisponibles>(VACIOS);
  const [filtros, setFiltros] = useState<FiltrosTorre>(FILTROS_VACIOS);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();
  const [seleccionado, setSeleccionado] = useState<ItemAtencion | null>(null);
  const [timeline, setTimeline] = useState<EventoTimeline[] | null>(null);

  const cargar = useCallback(async (f: FiltrosTorre) => {
    setError(null);
    if (!tieneSupabaseConfigurado()) {
      setError("Supabase no está configurado en este entorno.");
      setCargando(false);
      return;
    }
    try {
      const cliente = crearClienteNavegador();
      const [k, lista, disp] = await Promise.all([
        obtenerKpisTorre(cliente, f),
        listarAtencionPrioritaria(cliente, f),
        obtenerFiltrosTorre(cliente)
      ]);
      setKpis(k);
      setItems(lista);
      setDisponibles(disp);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la Torre.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void cargar(FILTROS_VACIOS), 0);
    return () => clearTimeout(timer);
  }, [cargar]);

  function aplicarFiltros() {
    setCargando(true);
    startTransition(async () => {
      await cargar(filtros);
    });
  }

  function abrirDetalle(item: ItemAtencion) {
    setSeleccionado(item);
    setTimeline(null);
    setMensaje(null);
    startTransition(async () => {
      try {
        setTimeline(await obtenerTimelineTraslado(crearClienteNavegador(), item.trasladoId));
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar el timeline.");
      }
    });
  }

  function copiarId() {
    if (!seleccionado) return;
    const id = seleccionado.trasladoId;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(id).then(
        () => setMensaje("ID copiado."),
        () => setMensaje(id)
      );
    } else {
      setMensaje(id);
    }
  }

  if (cargando && !kpis) return <main className="admin-page-shell"><AdminLoadingState label="Cargando Torre de Control…" /></main>;
  if (error && !kpis) {
    return <main className="admin-page-shell"><AdminErrorState description={error} action={<Button onClick={() => void cargar(filtros)}>Reintentar</Button>} /></main>;
  }

  return (
    <main className="admin-page-shell">
      <AdminPageHeader
        etiqueta="Operación en vivo"
        titulo="Torre de Control"
        descripcion="Qué ocurre, qué va retrasado y qué necesita intervención — en una pantalla."
        accion={<Button onClick={aplicarFiltros} disabled={pendiente}><RefreshCw className={pendiente ? "motion-safe:animate-spin" : undefined} />{pendiente ? "Actualizando…" : "Actualizar"}</Button>}
      />

      {mensaje ? <p role="status" className="mt-4 rounded-md bg-ui-success-soft px-4 py-2 text-sm text-ui-success">{mensaje}</p> : null}
      {error ? <p role="alert" className="mt-4 rounded-md bg-ui-danger-soft px-4 py-2 text-sm text-ui-danger">{error}</p> : null}

      <section aria-label="Filtros" className="mt-6 flex flex-wrap items-end gap-3">
        <CampoFiltro etiqueta="Empresa">
          <NativeSelect value={filtros.empresaId ?? ""} onChange={(e) => setFiltros((f) => ({ ...f, empresaId: e.target.value || null }))}>
            <option value="">Todas</option>
            {disponibles.empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </NativeSelect>
        </CampoFiltro>
        <CampoFiltro etiqueta="Operación">
          <NativeSelect value={filtros.operacionId ?? ""} onChange={(e) => setFiltros((f) => ({ ...f, operacionId: e.target.value || null }))}>
            <option value="">Todas</option>
            {disponibles.operaciones.map((o) => (
              <option key={o.id} value={o.id}>{o.folio} — {o.nombre}</option>
            ))}
          </NativeSelect>
        </CampoFiltro>
        <CampoFiltro etiqueta="Región">
          <NativeSelect value={filtros.ciudad ?? ""} onChange={(e) => setFiltros((f) => ({ ...f, ciudad: e.target.value || null }))}>
            <option value="">Todas</option>
            {disponibles.ciudades.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </NativeSelect>
        </CampoFiltro>
        <CampoFiltro etiqueta="Estado operativo">
          <NativeSelect value={filtros.operativo ?? ""} onChange={(e) => setFiltros((f) => ({ ...f, operativo: e.target.value || null }))}>
            <option value="">Todos</option>
            {ESTADOS_OPERATIVOS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </NativeSelect>
        </CampoFiltro>
        <Button variant="outline" onClick={aplicarFiltros} disabled={pendiente}>Aplicar</Button>
        <Button variant="ghost" onClick={() => { setFiltros(FILTROS_VACIOS); setCargando(true); void cargar(FILTROS_VACIOS); }} disabled={pendiente}>
          Limpiar
        </Button>
      </section>

      {kpis ? (
        <section aria-label="Indicadores" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          <TarjetaKpi etiqueta="Operaciones activas" valor={kpis.operacionesActivas} href="/operaciones" />
          <TarjetaKpi etiqueta="Traslados activos" valor={kpis.trasladosActivos} href="/viajes?filtro=activos" />
          <TarjetaKpi etiqueta="Sin conductor" valor={kpis.sinConductor} href="/viajes?filtro=sin_asignacion" tono="warning" />
          <TarjetaKpi etiqueta="Asignaciones rechazadas" valor={kpis.asignacionesRechazadas} href="/asignaciones" tono="warning" />
          <TarjetaKpi etiqueta="Conductores sin señal" valor={kpis.conductoresSinSenal} href="/mapa" tono="warning" />
          <TarjetaKpi etiqueta="Traslados retrasados" valor={kpis.trasladosRetrasados} href="/viajes" tono="warning" />
          <TarjetaKpi etiqueta="SLA en riesgo" valor={kpis.slaEnRiesgo} href="/alertas-sla" tono="warning" />
          <TarjetaKpi etiqueta="SLA vencido" valor={kpis.slaVencido} href="/alertas-sla" tono="danger" />
          <TarjetaKpi etiqueta="Incidencias abiertas" valor={kpis.incidenciasAbiertas} href="/incidencias" tono="danger" />
          <TarjetaKpi etiqueta="Entregas próximas" valor={kpis.entregasProximas} href="/viajes?filtro=inician_60" />
          <TarjetaKpi etiqueta="Evidencias pendientes" valor={kpis.evidenciasPendientes} href="/viajes" tono="warning" />
        </section>
      ) : null}

      <Card asChild className="mt-6 overflow-hidden">
        <section aria-labelledby="torre-atencion">
          <div className="flex items-center justify-between gap-4 p-5">
            <h2 id="torre-atencion" className="text-base font-semibold text-ui-fg">Atención prioritaria</h2>
            <Badge tone={items.length ? "danger" : "success"}>{items.length} {items.length === 1 ? "traslado" : "traslados"}</Badge>
          </div>
          {items.length === 0 ? (
            <div className="px-5 pb-5">
              <AdminEmptyState title="Sin focos rojos" description="Ningún traslado requiere intervención con estos filtros." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Traslados que requieren intervención, ordenados por prioridad</caption>
                <thead className="bg-ui-muted text-left text-xs text-ui-fg-muted">
                  <tr>
                    {["Prioridad", "Traslado", "Motivo", "Estado", "Viaje", "Ciudad", "Horas", "Detalle"].map((columna) => (
                      <th key={columna} scope="col" className="px-5 py-2.5 font-medium">{columna}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ui-line">
                  {items.map((item) => (
                    <tr key={item.trasladoId} className="hover:bg-ui-muted">
                      <td className="px-5 py-3"><Badge tone={tonoPrioridad(item.prioridad)}>{textoPrioridad(item.prioridad)}</Badge></td>
                      <td className="px-5 py-3"><Link href={`/viajes/${item.trasladoId}`} className="font-mono-ruum font-medium text-ui-brand hover:underline">{item.trasladoId.slice(0, 8)}…</Link></td>
                      <td className="px-5 py-3 text-ui-fg">{item.motivo}</td>
                      <td className="px-5 py-3 text-ui-fg-muted">{item.estado.replaceAll("_", " ")}</td>
                      <td className="px-5 py-3">{estaViajando(item.estado as EstadoTraslado) ? <Badge tone="info" dot>En viaje</Badge> : <span className="text-ui-fg-muted">—</span>}</td>
                      <td className="px-5 py-3 text-ui-fg">{item.ciudadOrigen ?? "—"}</td>
                      <td className="px-5 py-3 tabular-nums text-ui-fg">{item.horasEnEstado} h</td>
                      <td className="px-5 py-3">
                        <Button variant="outline" size="sm" onClick={() => abrirDetalle(item)} disabled={pendiente}>
                          Abrir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Card>

      <AdminDrawer
        open={Boolean(seleccionado)}
        title={seleccionado ? `Traslado ${seleccionado.trasladoId.slice(0, 8)}…` : "Detalle"}
        description={seleccionado?.motivo}
        onOpenChange={(open) => { if (!open) { setSeleccionado(null); setTimeline(null); } }}
        footer={seleccionado && (
          <>
            <Button variant="ghost" size="sm" onClick={copiarId}><Copy />Copiar ID</Button>
            <Button asChild variant="outline" size="sm"><Link href="/incidencias">Incidencias</Link></Button>
            {seleccionado.operacionId ? <Button asChild variant="outline" size="sm"><Link href={`/operaciones/${seleccionado.operacionId}`}>Ver operación</Link></Button> : null}
            <Button asChild size="sm"><Link href={`/viajes/${seleccionado.trasladoId}`}>Abrir viaje</Link></Button>
          </>
        )}
      >
        {seleccionado && (
          <div className="flex flex-col gap-6">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-ui-fg-muted">Estado legacy</dt><dd className="text-ui-fg">{seleccionado.estado}</dd>
              <dt className="text-ui-fg-muted">Estado operativo</dt><dd className="text-ui-fg">{seleccionado.operativo || "—"}</dd>
              <dt className="text-ui-fg-muted">Conductor</dt><dd className="font-mono-ruum text-ui-fg">{seleccionado.conductorId ? `${seleccionado.conductorId.slice(0, 8)}…` : "sin asignar"}</dd>
              <dt className="text-ui-fg-muted">Operación</dt><dd className="font-mono-ruum text-ui-fg">{seleccionado.operacionFolio ?? "—"}</dd>
            </dl>
            <div>
              <h3 className="text-sm font-semibold text-ui-fg">Timeline</h3>
              {timeline === null ? (
                <p className="mt-2 text-sm text-ui-fg-muted" role="status">Cargando timeline…</p>
              ) : timeline.length === 0 ? (
                <p className="mt-2 text-sm text-ui-fg-muted">Sin movimientos registrados.</p>
              ) : (
                <ol className="mt-3 flex flex-col gap-3 border-l border-ui-line pl-4">
                  {timeline.map((evento, indice) => (
                    <li key={`${evento.fecha}-${indice}`} className="text-sm">
                      <strong className="font-semibold text-ui-fg">{evento.titulo}</strong>
                      {evento.detalle ? <span className="text-ui-fg-muted"> — {evento.detalle}</span> : null}
                      <small className="block text-xs text-ui-fg-muted">{new Date(evento.fecha).toLocaleString("es-MX")} · {evento.tipo}</small>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </AdminDrawer>
    </main>
  );
}

function CampoFiltro({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="flex min-w-48 flex-col gap-1.5 text-sm font-medium text-ui-fg">
      {etiqueta}
      {children}
    </label>
  );
}

function tonoPrioridad(prioridad: number) {
  if (prioridad >= 90) return "danger" as const;
  if (prioridad >= 60) return "warning" as const;
  return "neutral" as const;
}

function textoPrioridad(prioridad: number) {
  if (prioridad >= 90) return `Crítica · ${prioridad}`;
  if (prioridad >= 60) return `Alta · ${prioridad}`;
  return `Media · ${prioridad}`;
}
