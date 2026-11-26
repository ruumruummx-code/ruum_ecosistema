"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminBadge } from "../../admin-components";
import { AccionesVerificacion } from "../AccionesVerificacion";
import {
  listarTrasladosDeUsuario,
  listarPagosDeUsuario,
  listarIncidenciasDeUsuario,
  listarSesionesUsuario,
  revocarSesionUsuario,
  obtenerAuditoriaUsuario
} from "@ruum/api/services";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import type {
  UsuarioRow,
  PagosRow,
  IncidenciaRow,
  ViajeRow
} from "./UsuarioDetalleTipos";
import {
  ETIQUETA_VERIFICACION,
  ETIQUETA_ESTADO_CUENTA,
  aTitleCase,
  formatearTelefono,
  formatearFechaCompacta,
  formatearFechaOperativa,
  folioCorto,
  etiquetaEstadoTraslado
} from "./UsuarioDetalleTipos";
import {
  Seccion,
  Dato,
  ValorVacio,
  BadgeEstadoTraslado,
  DetalleViajeDrawer
} from "./UsuarioDetalleComponentes";
import {
  EditarUsuario,
  SuspenderCuenta,
  ReactivarCuenta,
  CerrarCuenta
} from "./UsuarioDetalleAcciones";

export function ActividadReciente({ usuarioId }: { usuarioId: string }) {
  const [actividad, setActividad] = useState<Array<{ etiqueta: string; valor: string | null }>>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    async function cargarActividad() {
      try {
        const cliente = crearClienteNavegador();
        const [sesiones, Traslados] = await Promise.all([
          listarSesionesUsuario(cliente, usuarioId).catch(() => []),
          listarTrasladosDeUsuario(cliente, usuarioId).catch(() => [])
        ]);
        if (cancelado) return;
        const ultimaSesion = sesiones
          .map((sesion) => sesion.ultimo_acceso ?? sesion.creada_en)
          .filter((fecha): fecha is string => Boolean(fecha))
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
        const ultimoViaje = Traslados
          .map((viaje) => viaje.creado_en)
          .filter((fecha): fecha is string => Boolean(fecha))
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
        setActividad([
          { etiqueta: "Último inicio de sesión", valor: formatearFechaCompacta(ultimaSesion) },
          { etiqueta: "Último viaje", valor: formatearFechaCompacta(ultimoViaje) }
        ]);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    void cargarActividad();
    return () => { cancelado = true; };
  }, [usuarioId]);

  const conActividad = actividad.some((item) => item.valor);
  return (
    <div className="mt-6 rounded-lg border border-ui-line bg-ui-card p-4">
      <h3 className="font-display text-base font-semibold text-ui-fg">Actividad reciente</h3>
      {cargando ? (
        <p className="mt-2 font-body text-sm text-ui-fg-muted">Cargando actividad...</p>
      ) : conActividad ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {actividad.map((item) => (
            <div key={item.etiqueta} className="rounded-lg border border-ui-line px-3 py-2">
              <p className="font-body text-xs text-ui-fg-muted">{item.etiqueta}</p>
              <p className="mt-1 font-body text-sm font-semibold text-ui-fg">{item.valor ?? <ValorVacio />}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 font-body text-sm text-ui-fg-muted">Sin actividad registrada.</p>
      )}
    </div>
  );
}

export function TabDatos({ usuario, onActualizado, onAviso }: { usuario: UsuarioRow; onActualizado: (u: UsuarioRow) => void; onAviso: (a: { tono: "info" | "danger"; texto: string }) => void }) {
  const [editando, setEditando] = useState(false);
  const direccionVacia = !usuario.calle && !usuario.numero && !usuario.colonia && !usuario.ciudad && !usuario.estado && !usuario.pais && !usuario.codigo_postal;
  const inconsistenciaTerminos = usuario.estado_verificacion === "verificado" && !usuario.terminos_aceptados_en;
  return (
    <>
      {inconsistenciaTerminos && (
        <div className="mb-6 rounded-lg border border-ui-warning/40 bg-ui-warning-soft p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ui-warning/15 font-body text-base font-bold text-ui-warning" aria-hidden="true">!</span>
              <div>
                <h2 className="font-display text-base font-semibold text-ui-warning">Inconsistencia de verificación</h2>
                <p className="mt-1 font-body text-sm leading-6 text-ui-fg-muted">
                  La cuenta aparece verificada sin aceptación de términos. Regulariza el estado antes de aprobar nuevas acciones sensibles.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => document.getElementById("verificacion-documentos")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="rounded-lg border border-ui-warning/45 bg-ui-card px-3 py-2 font-body text-sm font-semibold text-ui-warning hover:bg-ui-warning-soft"
            >
              Ver detalles
            </button>
          </div>
        </div>
      )}

      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <Seccion
          titulo="Datos personales"
          consistente
          action={!editando && <button onClick={() => setEditando(true)} className="rounded-lg border border-ui-brand bg-ui-brand px-3 py-1.5 font-body text-xs font-semibold text-ui-fg hover:bg-ui-brand-hover">Editar datos</button>}
        >
          <Dato etiqueta="Nombre" valor={aTitleCase(usuario.nombre)} />
          <Dato etiqueta="Teléfono" valor={formatearTelefono(usuario.telefono)} />
          <Dato etiqueta="Correo de facturación" valor={usuario.correo_facturacion} />
          <Dato etiqueta="Tipo de cuenta" valor={aTitleCase(usuario.tipo_cuenta)} />
          <Dato etiqueta="Rol" valor={aTitleCase(usuario.rol.replaceAll("_", " "))} />
          <Dato etiqueta="RFC" valor={usuario.rfc} />
          <Dato etiqueta="Razón social" valor={aTitleCase(usuario.razon_social)} />
        </Seccion>
        <Seccion
          titulo="Dirección"
          consistente
          action={!editando && <button onClick={() => setEditando(true)} className="rounded-lg border border-ui-line-strong px-3 py-1.5 font-body text-xs font-semibold text-ui-fg-muted hover:bg-ui-muted hover:text-ui-fg">{direccionVacia ? "+ Agregar dirección" : "Editar dirección"}</button>}
        >
          <Dato etiqueta="Calle" valor={usuario.calle} />
          <Dato etiqueta="Número" valor={usuario.numero} />
          <Dato etiqueta="Colonia" valor={usuario.colonia} />
          <Dato etiqueta="Ciudad" valor={usuario.ciudad} />
          <Dato etiqueta="Estado" valor={usuario.estado} />
          <Dato etiqueta="País" valor={usuario.pais} />
          <Dato etiqueta="Código postal" valor={usuario.codigo_postal} />
        </Seccion>
        <Seccion titulo="Estados" consistente>
          <Dato etiqueta="Verificación" valor={ETIQUETA_VERIFICACION[usuario.estado_verificacion]} />
          <Dato etiqueta="Estado de cuenta" valor={ETIQUETA_ESTADO_CUENTA[usuario.estado_cuenta ?? "activa"]} />
          <Dato etiqueta="Método de pago" valor={usuario.metodo_pago_registrado ? "Registrado" : "Sin registrar"} />
          <Dato etiqueta="Traslados sin incidencia" valor={String(usuario.traslados_completados_sin_incidencia)} />
        </Seccion>
        <Seccion titulo="Fechas" consistente>
          <Dato etiqueta="Registrado" valor={formatearFechaCompacta(usuario.creado_en)} />
          <Dato etiqueta="Actualizado" valor={formatearFechaCompacta(usuario.actualizado_en)} />
          <Dato etiqueta="Términos aceptados" valor={formatearFechaCompacta(usuario.terminos_aceptados_en) ?? "No aceptados"} />
        </Seccion>
      </div>

      <ActividadReciente usuarioId={usuario.id} />

      {editando && (
        <div className="mt-6">
          <EditarUsuario
            usuario={usuario}
            onCancelar={() => setEditando(false)}
            onActualizado={(u) => {
              onActualizado(u);
              setEditando(false);
              onAviso({ tono: "info", texto: "Datos personales actualizados correctamente." });
            }}
          />
        </div>
      )}

      <div id="verificacion-documentos" className="mt-10 scroll-mt-24">
        <h2 className="font-display text-lg font-semibold text-ui-fg">Verificación y documentos</h2>
        <div className="mt-3 rounded-lg border border-ui-line bg-ui-card p-4">
          <AccionesVerificacion usuario={usuario} onActualizado={() => window.location.reload()} />
        </div>
      </div>

      <div className="mt-10 rounded-lg border border-ui-danger/35 bg-ui-danger-soft p-5">
        <h2 className="font-display text-lg font-semibold text-ui-danger">Zona de riesgo</h2>
        <p className="mt-1 font-body text-sm text-ui-fg-muted">Estas acciones afectan la cuenta del usuario de forma permanente o temporal.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(usuario.estado_cuenta ?? "activa") !== "suspendida" && (
            <SuspenderCuenta usuarioId={usuario.id} onCompletado={() => { window.location.reload(); }} />
          )}
          {(usuario.estado_cuenta ?? "activa") !== "activa" && (
            <ReactivarCuenta usuarioId={usuario.id} onCompletado={() => { window.location.reload(); }} />
          )}
          {(usuario.estado_cuenta ?? "activa") !== "cerrada" && (
            <CerrarCuenta usuarioId={usuario.id} onCompletado={() => { window.location.reload(); }} />
          )}
        </div>
      </div>
    </>
  );
}

export function TabTraslados({ usuarioId }: { usuarioId: string }) {
  const [Traslados, setTraslados] = useState<ViajeRow[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [pagina, setPagina] = useState(1);
  const [seleccionado, setSeleccionado] = useState<ViajeRow | null>(null);
  const tamanoPagina = 10;

  useEffect(() => {
    const cliente = crearClienteNavegador();
    listarTrasladosDeUsuario(cliente, usuarioId).then(setTraslados).catch(() => setTraslados([])).finally(() => setCargando(false));
  }, [usuarioId]);

  const estados = useMemo(() => {
    return Array.from(new Set((Traslados ?? []).map((viaje) => viaje.estado).filter(Boolean) as string[])).sort();
  }, [Traslados]);

  const TrasladosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es-MX");
    return (Traslados ?? []).filter((viaje) => {
      const folio = viaje.traslado_id?.toLocaleLowerCase("es-MX") ?? "";
      const coincideFolio = !termino || folio.includes(termino);
      const coincideEstado = estadoFiltro === "todos" || viaje.estado === estadoFiltro;
      const fecha = viaje.creado_en ? new Date(viaje.creado_en) : null;
      const despuesDeInicio = !fechaDesde || (fecha && fecha >= new Date(`${fechaDesde}T00:00:00`));
      const antesDeFin = !fechaHasta || (fecha && fecha <= new Date(`${fechaHasta}T23:59:59`));
      return coincideFolio && coincideEstado && despuesDeInicio && antesDeFin;
    });
  }, [busqueda, estadoFiltro, fechaDesde, fechaHasta, Traslados]);

  useEffect(() => { setPagina(1); }, [busqueda, estadoFiltro, fechaDesde, fechaHasta]);

  const totalPaginas = Math.max(1, Math.ceil(TrasladosFiltrados.length / tamanoPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const TrasladosPagina = TrasladosFiltrados.slice((paginaActual - 1) * tamanoPagina, paginaActual * tamanoPagina);

  async function copiarFolio(evento: React.MouseEvent, folio: string | null) {
    evento.stopPropagation();
    if (!folio) return;
    await navigator.clipboard.writeText(folio);
  }

  if (cargando) return <p className="font-body text-ui-fg-muted">Cargando traslados...</p>;
  if (!Traslados?.length) return <p className="font-body text-ui-fg-muted">Sin traslados registrados.</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-ui-line bg-ui-card p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(180px,1fr)_180px_160px_160px]">
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs font-medium text-ui-fg-muted">Buscar por folio</span>
            <input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Ej. 8f2a1c3b" className="rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs font-medium text-ui-fg-muted">Estado</span>
            <select value={estadoFiltro} onChange={(evento) => setEstadoFiltro(evento.target.value)} className="rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring">
              <option value="todos">Todos</option>
              {estados.map((estado) => <option key={estado} value={estado}>{etiquetaEstadoTraslado(estado)}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs font-medium text-ui-fg-muted">Desde</span>
            <input type="date" value={fechaDesde} onChange={(evento) => setFechaDesde(evento.target.value)} className="rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs font-medium text-ui-fg-muted">Hasta</span>
            <input type="date" value={fechaHasta} onChange={(evento) => setFechaHasta(evento.target.value)} className="rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring" />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-ui-line bg-ui-card">
        <table className="w-full font-body text-sm">
          <thead><tr className="border-b border-ui-line text-left text-xs uppercase tracking-wide text-ui-fg-muted">
            <th className="px-4 py-3">Folio</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Origen</th>
            <th className="px-4 py-3">Destino</th>
            <th className="px-4 py-3">Creación</th>
            <th className="px-4 py-3 text-right">Acción</th>
          </tr></thead>
          <tbody>
            {TrasladosPagina.map((viaje) => (
              <tr key={viaje.traslado_id} onClick={() => setSeleccionado(viaje)} className="group cursor-pointer border-b border-ui-line transition-colors last:border-0 hover:bg-ui-muted">
                <td className="px-4 py-3">
                  <span className="font-mono-ruum text-sm font-semibold text-ui-fg">{folioCorto(viaje.traslado_id)}</span>
                  <span className="ml-2 font-body text-xs text-ui-fg-muted opacity-0 transition-opacity group-hover:opacity-100">clic para detalle</span>
                </td>
                <td className="px-4 py-3"><BadgeEstadoTraslado viaje={viaje} /></td>
                <td className="px-4 py-3 text-ui-fg-muted">{viaje.origen_direccion || viaje.origen_ciudad || <ValorVacio />}</td>
                <td className="px-4 py-3 text-ui-fg-muted">{viaje.destino_direccion || viaje.destino_ciudad || <ValorVacio />}</td>
                <td className="px-4 py-3 text-ui-fg-muted">{formatearFechaOperativa(viaje.creado_en)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <button type="button" onClick={(evento) => copiarFolio(evento, viaje.traslado_id)} className="rounded-md border border-ui-line-strong px-2.5 py-1 font-body text-xs font-semibold text-ui-fg-muted hover:border-ui-focus hover:text-ui-brand">Copiar folio</button>
                    <button type="button" onClick={(evento) => { evento.stopPropagation(); setSeleccionado(viaje); }} className="rounded-md border border-ui-line-strong px-2.5 py-1 font-body text-xs font-semibold text-ui-fg-muted hover:border-ui-focus hover:text-ui-brand">Ver detalle</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!TrasladosPagina.length && <p className="px-4 py-8 text-center font-body text-sm text-ui-fg-muted">Sin traslados para los filtros seleccionados.</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ui-line px-4 py-3">
          <p className="font-body text-sm text-ui-fg-muted">Mostrando {TrasladosPagina.length} de {TrasladosFiltrados.length} traslados</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPagina((valor) => Math.max(1, valor - 1))} disabled={paginaActual === 1} className="rounded-lg border border-ui-line-strong px-3 py-1.5 font-body text-sm font-semibold text-ui-fg-muted disabled:opacity-50">Anterior</button>
            <span className="rounded-lg bg-ui-muted px-3 py-1.5 font-body text-sm text-ui-fg-muted">Página {paginaActual} de {totalPaginas}</span>
            <button type="button" onClick={() => setPagina((valor) => Math.min(totalPaginas, valor + 1))} disabled={paginaActual === totalPaginas} className="rounded-lg border border-ui-line-strong px-3 py-1.5 font-body text-sm font-semibold text-ui-fg-muted disabled:opacity-50">Siguiente</button>
          </div>
        </div>
      </div>

      <DetalleViajeDrawer viaje={seleccionado} onCerrar={() => setSeleccionado(null)} />
    </div>
  );
}

export function TabPagos({ usuarioId }: { usuarioId: string }) {
  const [pagos, setPagos] = useState<PagosRow[] | null>(null);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    const cliente = crearClienteNavegador();
    listarPagosDeUsuario(cliente, usuarioId).then(setPagos).catch(() => setPagos([])).finally(() => setCargando(false));
  }, [usuarioId]);

  if (cargando) return <p className="font-body text-ui-fg-muted">Cargando pagos...</p>;
  if (!pagos?.length) return <p className="font-body text-ui-fg-muted">Sin pagos registrados.</p>;

  return (
    <div className="overflow-hidden rounded-lg border border-ui-line bg-ui-card">
      <table className="w-full font-body text-sm">
        <thead><tr className="border-b border-ui-line text-left text-xs uppercase tracking-wide text-ui-fg-muted">
          <th className="px-4 py-3">Monto</th>
          <th className="px-4 py-3">Estado</th>
          <th className="px-4 py-3">Método</th>
          <th className="px-4 py-3">Fecha</th>
        </tr></thead>
        <tbody>
          {pagos.map((p) => (
            <tr key={p.id} className="border-b border-ui-line last:border-0">
              <td className="px-4 py-3 font-mono-ruum">${(p.monto ?? 0).toFixed(2)}</td>
              <td className="px-4 py-3 capitalize">{p.estado?.replaceAll("_", " ")}</td>
              <td className="px-4 py-3 text-ui-fg-muted">{p.metodo || <ValorVacio />}</td>
              <td className="px-4 py-3 text-ui-fg-muted">{new Date(p.registrado_en).toLocaleDateString("es-MX")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TabIncidencias({ usuarioId }: { usuarioId: string }) {
  const [incidencias, setIncidencias] = useState<IncidenciaRow[] | null>(null);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    const cliente = crearClienteNavegador();
    listarIncidenciasDeUsuario(cliente, usuarioId).then(setIncidencias).catch(() => setIncidencias([])).finally(() => setCargando(false));
  }, [usuarioId]);

  if (cargando) return <p className="font-body text-ui-fg-muted">Cargando incidencias...</p>;
  if (!incidencias?.length) return <p className="font-body text-ui-fg-muted">Sin incidencias registradas.</p>;

  return (
    <div className="overflow-hidden rounded-lg border border-ui-line bg-ui-card">
      <table className="w-full font-body text-sm">
        <thead><tr className="border-b border-ui-line text-left text-xs uppercase tracking-wide text-ui-fg-muted">
          <th className="px-4 py-3">Tipo</th>
          <th className="px-4 py-3">Estado</th>
          <th className="px-4 py-3">Fecha</th>
        </tr></thead>
        <tbody>
          {incidencias.map((inc) => (
            <tr key={inc.id} className="border-b border-ui-line last:border-0">
              <td className="px-4 py-3 capitalize">{inc.tipo?.replaceAll("_", " ")}</td>
              <td className="px-4 py-3 capitalize">{inc.resuelta ? "Resuelta" : "Abierta"}</td>
              <td className="px-4 py-3 text-ui-fg-muted">{new Date(inc.creada_en).toLocaleDateString("es-MX")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TabSesiones({ usuarioId }: { usuarioId: string }) {
  const [sesiones, setSesiones] = useState<Array<{ id: string; creada_en: string; ultimo_acceso: string | null; agente_usuario: string | null; direccion_ip: string | null; activa: boolean }> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [revocando, setRevocando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const cliente = crearClienteNavegador();
    listarSesionesUsuario(cliente, usuarioId).then(setSesiones).catch(() => setSesiones([])).finally(() => setCargando(false));
  }, [usuarioId]);

  useEffect(() => { void cargar(); }, [cargar]);

  async function revocar(sesionId: string) {
    setRevocando(sesionId);
    try {
      const cliente = crearClienteNavegador();
      await revocarSesionUsuario(cliente, sesionId);
      void cargar();
    } catch { /* ignore */ }
    finally { setRevocando(null); }
  }

  if (cargando) return <p className="font-body text-ui-fg-muted">Cargando sesiones...</p>;
  if (!sesiones?.length) return <p className="font-body text-ui-fg-muted">Sin sesiones activas.</p>;

  return (
    <div className="overflow-hidden rounded-lg border border-ui-line bg-ui-card">
      <table className="w-full font-body text-sm">
        <thead><tr className="border-b border-ui-line text-left text-xs uppercase tracking-wide text-ui-fg-muted">
          <th className="px-4 py-3">Dispositivo</th>
          <th className="px-4 py-3">IP</th>
          <th className="px-4 py-3">Último acceso</th>
          <th className="px-4 py-3">Estado</th>
          <th className="px-4 py-3">Acción</th>
        </tr></thead>
        <tbody>
          {sesiones.map((s) => (
            <tr key={s.id} className="border-b border-ui-line last:border-0">
              <td className="px-4 py-3 font-body text-sm">{s.agente_usuario?.slice(0, 60) || <ValorVacio />}</td>
              <td className="px-4 py-3 font-mono-ruum text-xs">{s.direccion_ip || <ValorVacio />}</td>
              <td className="px-4 py-3 text-ui-fg-muted">{s.ultimo_acceso ? new Date(s.ultimo_acceso).toLocaleString("es-MX") : <ValorVacio />}</td>
              <td className="px-4 py-3">
                <AdminBadge tone={s.activa ? "success" : "danger"}>{s.activa ? "Activa" : "Revocada"}</AdminBadge>
              </td>
              <td className="px-4 py-3">
                {s.activa && (
                  <button onClick={() => revocar(s.id)} disabled={revocando === s.id}
                    className="rounded-md border border-ui-danger/40 px-3 py-1 font-body text-xs text-ui-danger hover:bg-ui-danger/10 disabled:opacity-50"
                  >{revocando === s.id ? "Revocando..." : "Revocar"}</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TabAuditoria({ usuarioId }: { usuarioId: string }) {
  const [eventos, setEventos] = useState<Array<{ evento: string; creado_en: string; datos: Record<string, unknown> | null }> | null>(null);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    const cliente = crearClienteNavegador();
    obtenerAuditoriaUsuario(cliente, usuarioId).then(setEventos).catch(() => setEventos([])).finally(() => setCargando(false));
  }, [usuarioId]);

  if (cargando) return <p className="font-body text-ui-fg-muted">Cargando auditoría...</p>;
  if (!eventos?.length) return <p className="font-body text-ui-fg-muted">Sin eventos de auditoría.</p>;

  return (
    <div className="overflow-hidden rounded-lg border border-ui-line bg-ui-card">
      <table className="w-full font-body text-sm">
        <thead><tr className="border-b border-ui-line text-left text-xs uppercase tracking-wide text-ui-fg-muted">
          <th className="px-4 py-3">Evento</th>
          <th className="px-4 py-3">Fecha</th>
          <th className="px-4 py-3">Detalle</th>
        </tr></thead>
        <tbody>
          {eventos.map((e, i) => (
            <tr key={i} className="border-b border-ui-line last:border-0">
              <td className="px-4 py-3 font-medium capitalize">{e.evento.replaceAll("_", " ")}</td>
              <td className="px-4 py-3 text-ui-fg-muted">{new Date(e.creado_en).toLocaleString("es-MX")}</td>
              <td className="px-4 py-3 font-mono-ruum text-xs text-ui-fg-muted">{e.datos ? JSON.stringify(e.datos).slice(0, 120) : <ValorVacio />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
