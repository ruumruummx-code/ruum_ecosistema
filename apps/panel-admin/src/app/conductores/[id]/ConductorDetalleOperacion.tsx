"use client";

import { useEffect, useMemo, useState } from "react";
import { Aviso } from "@ruum/ui";
import type { Json } from "@ruum/shared/types";
import {
  actualizarConductorAdmin,
  solicitarAprobacionAdmin
} from "@ruum/api/services";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import type {
  ConductorRow,
  DetalleSolicitudConductorAdmin
} from "./ConductorDetalleTipos";
import {
  evaluarElegibilidad,
  formatoPorcentaje,
  etiquetaNivel,
  textoEstadoConductor,
  textoJson,
  urlMapaDomicilio,
  telefonoLlamada,
  MOTIVOS_BAJA,
  MOTIVOS_SUSPENSION
} from "./ConductorDetalleTipos";
import {
  SeccionAcordeon,
  KpiCard,
  BadgeNeutro,
  IconoPausa,
  IconoBaja
} from "./ConductorDetalleComponentes";

export function DesempenoScore({
  conductor,
  documentosAprobados,
  diasVigencia,
  onActualizado,
  onAviso
}: {
  conductor: ConductorRow | null;
  documentosAprobados: boolean;
  diasVigencia: number | null;
  onActualizado: () => Promise<void> | void;
  onAviso: (aviso: { tono: "info" | "danger"; texto: string }) => void;
}) {
  const elegibilidad = evaluarElegibilidad({ conductor, documentosAprobados, diasVigencia });
  const totalEventosOperativos = conductor
    ? conductor.traslados_completados + conductor.cancelaciones_sin_justificacion_count + conductor.no_presentaciones_6m
    : 0;
  const efectividad = conductor && totalEventosOperativos > 0
    ? (conductor.traslados_completados / totalEventosOperativos) * 100
    : null;
  const tonoElegibilidad = elegibilidad.tono === "success"
    ? "border-ui-success/30 bg-ui-success-soft text-ui-success"
    : elegibilidad.tono === "danger"
      ? "border-ui-danger/30 bg-ui-danger-soft text-ui-danger"
      : "border-ui-warning/35 bg-ui-warning-soft text-ui-warning";

  return (
    <SeccionAcordeon titulo="Desempeño y Score" distintivo={<span className={`rounded-full border px-3 py-1 font-body text-xs font-semibold ${tonoElegibilidad}`}>{elegibilidad.texto}</span>}>
      <div className={`mt-4 rounded-lg border px-3 py-3 ${tonoElegibilidad}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-sm font-semibold">{elegibilidad.texto} · {elegibilidad.detalle}</p>
          <span className="rounded-full border border-current/20 px-2.5 py-1 font-body text-xs font-semibold">
            {textoEstadoConductor(conductor?.estado)}
          </span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <KpiCard
          etiqueta="Calificación"
          valor={conductor ? <span className="inline-flex items-center gap-2"><span aria-hidden="true">⭐</span>{conductor.calificacion_promedio.toFixed(2)} / 5.0</span> : "Sin alta"}
          detalle={conductor ? "Promedio acumulado del conductor." : "Se activará cuando exista conductor asociado."}
          tono={conductor && conductor.calificacion_promedio >= 4.5 ? "success" : "neutral"}
        />
        <KpiCard
          etiqueta="Rendimiento"
          valor={efectividad === null ? <BadgeNeutro>Sin actividad previa</BadgeNeutro> : formatoPorcentaje(efectividad)}
          detalle={conductor ? `Cancelaciones: ${conductor.cancelaciones_sin_justificacion_count} · No presentaciones 6m: ${conductor.no_presentaciones_6m}` : "Sin historial operativo."}
          tono={efectividad !== null && efectividad >= 90 ? "success" : "neutral"}
        />
        <KpiCard
          etiqueta="Historial"
          valor={conductor ? `${conductor.traslados_completados} traslados` : "Sin historial"}
          detalle={`Nivel CONCER: ${etiquetaNivel(conductor?.nivel_operativo_vigente ?? conductor?.nivel_por_experiencia)}`}
        />
        <KpiCard
          etiqueta="Penalizaciones"
          valor={conductor ? `${conductor.suspensiones_activas} activas` : "Sin conductor"}
          detalle={conductor ? `Incidencias graves: ${conductor.incidencias_graves_6m} en 6m · ${conductor.incidencias_graves_12m} en 12m` : "Sin expediente operativo."}
          tono={conductor && conductor.suspensiones_activas > 0 ? "danger" : "success"}
        />
      </div>
      <AccionesCriticasPasaporte conductor={conductor} onActualizado={onActualizado} onAviso={onAviso} />
    </SeccionAcordeon>
  );
}

export function AccionesCriticasPasaporte({
  conductor,
  onActualizado,
  onAviso
}: {
  conductor: ConductorRow | null;
  onActualizado: () => Promise<void> | void;
  onAviso: (aviso: { tono: "info" | "danger"; texto: string }) => void;
}) {
  const [accion, setAccion] = useState<"suspender" | "baja" | null>(null);
  const [motivo, setMotivo] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cerrar() {
    setAccion(null);
    setMotivo("");
    setConfirmacion("");
    setError(null);
  }

  async function ejecutar() {
    if (!conductor || !accion || !motivo.trim()) return;
    if (accion === "baja" && confirmacion !== "BAJA") return;
    setProcesando(true);
    setError(null);
    try {
      const cliente = crearClienteNavegador();
      const nuevoEstado = accion === "suspender" ? "suspendido" : "baja";
      const aprobacionId = await solicitarAprobacionAdmin(cliente, {
        tipo: "sancion",
        capacidad: "conductores:sancionar",
        recurso: "conductores",
        recursoId: conductor.id,
        accion: "suspender",
        payload: { nuevo_estado: nuevoEstado, motivo: motivo.trim() } as Json
      });
      await onActualizado();
      onAviso({
        tono: "info",
        texto: `Solicitud de aprobación #${aprobacionId.slice(0, 8).toUpperCase()} creada. Autorízala en Aprobaciones duales para ejecutar la ${accion === "suspender" ? "suspensión" : "baja definitiva"}.`
      });
      cerrar();
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : "No se pudo completar la acción.";
      setError(mensaje);
    } finally {
      setProcesando(false);
    }
  }

  const titulo = accion === "baja" ? "Baja definitiva" : "Suspender conductor";
  const efecto = accion === "baja"
    ? "La cuenta queda bloqueada permanentemente y no podrá operar traslados."
    : "El conductor no podrá recibir nuevos traslados hasta que se reactive.";
  const motivos = accion === "baja" ? MOTIVOS_BAJA : MOTIVOS_SUSPENSION;

  return (
    <div className="mt-4 rounded-lg border border-ui-line bg-ui-muted p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-body text-sm font-semibold text-ui-fg">Acciones operativas</h3>
          <p className="mt-1 font-body text-sm text-ui-fg-muted">Suspender impide nuevos Traslados hasta reactivación; baja definitiva bloquea la cuenta operativa.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAccion("suspender")}
            disabled={!conductor || procesando}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ui-line-strong bg-ui-card px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconoPausa /> Suspender
          </button>
          <button
            type="button"
            onClick={() => setAccion("baja")}
            disabled={!conductor || procesando}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ui-danger/40 bg-ui-danger/10 px-4 py-2 font-body text-sm font-semibold text-ui-danger hover:bg-ui-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconoBaja /> Baja definitiva
          </button>
        </div>
      </div>
      {!conductor && <p className="mt-3 font-body text-sm text-ui-fg-muted">Disponible cuando la solicitud tenga conductor asociado.</p>}
      {accion && conductor && (
        <div role="dialog" aria-modal="true" aria-labelledby="accion-critica-pasaporte" className="mt-4 rounded-lg border border-ui-line bg-ui-card p-4">
          <p id="accion-critica-pasaporte" className={`flex items-center gap-2 font-body text-sm font-semibold ${accion === "baja" ? "text-ui-danger" : "text-ui-warning"}`}>
            {accion === "baja" ? <IconoBaja /> : <IconoPausa />} {titulo}
          </p>
          <div className="mt-3 rounded-lg border border-ui-line bg-ui-muted px-3 py-2 font-body text-sm text-ui-fg-muted">
            <p><span className="font-semibold text-ui-fg">Conductor:</span> {conductor.nombre}</p>
            <p><span className="font-semibold text-ui-fg">Estado actual:</span> {textoEstadoConductor(conductor.estado)}</p>
            <p><span className="font-semibold text-ui-fg">Efecto:</span> {efecto}</p>
          </div>
          {error && <div className="mt-3"><Aviso tono="danger">{error}</Aviso></div>}
          <details className="mt-3 rounded-lg border border-ui-line bg-ui-muted p-3">
            <summary className="cursor-pointer list-none font-body text-sm font-semibold text-ui-fg">
              Motivos principales
            </summary>
            <div className="mt-3 grid gap-2">
              {motivos.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => setMotivo(opcion)}
                  className={`min-h-11 rounded-lg border px-3 py-2 text-left font-body text-sm font-medium transition ${motivo === opcion ? "border-ui-brand bg-ui-brand-soft text-ui-brand-soft-fg" : "border-ui-line bg-ui-card text-ui-fg-muted hover:bg-ui-muted"}`}
                >
                  {opcion}
                </button>
              ))}
            </div>
          </details>
          <label className="mt-3 flex flex-col gap-1">
            <span className="font-body text-xs font-medium text-ui-fg-muted">Motivo</span>
            <textarea
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              className="min-h-[88px] rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring"
              placeholder={accion === "baja" ? "Motivo de la baja definitiva" : "Motivo de la suspensión"}
            />
          </label>
          {accion === "baja" && (
            <label className="mt-3 flex flex-col gap-1 rounded-lg border border-ui-danger/25 bg-ui-danger-soft p-3">
              <span className="font-body text-xs font-medium text-ui-danger">Escribe BAJA para confirmar la revocación definitiva</span>
              <input
                type="text"
                value={confirmacion}
                onChange={(event) => setConfirmacion(event.target.value)}
                className="rounded-lg border border-ui-danger/30 px-3 py-2 font-body text-sm focus:border-ui-danger focus:outline-none focus:ring-2 focus:ring-ui-danger/20"
                placeholder="BAJA"
              />
            </label>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={ejecutar}
              disabled={procesando || !motivo.trim() || (accion === "baja" && confirmacion !== "BAJA")}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ui-danger px-4 py-2 font-body text-sm font-semibold text-ui-on-brand hover:bg-ui-danger/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {procesando ? "Procesando..." : `Solicitar ${accion === "baja" ? "baja definitiva" : "suspensión"}`}
            </button>
            <button
              type="button"
              onClick={cerrar}
              disabled={procesando}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-medium hover:bg-ui-muted"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CampoEditable({
  label,
  value,
  onChange,
  inputMode = "text",
  readOnly = false
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  inputMode?: "text" | "tel" | "numeric";
  readOnly?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-xs font-medium text-ui-fg-muted">{label}</span>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-11 rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm text-ui-fg focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring ${readOnly ? "bg-ui-brand/[0.04] text-ui-fg-muted" : "bg-ui-card"}`}
      />
    </label>
  );
}

export function DomicilioContactoEditable({
  solicitud,
  conductor,
  correo,
  onGuardado
}: {
  solicitud: DetalleSolicitudConductorAdmin["solicitud"];
  conductor: ConductorRow | null;
  correo: string;
  onGuardado: () => Promise<void> | void;
}) {
  const valoresIniciales = useMemo(() => ({
    codigo_postal: conductor?.codigo_postal ?? textoJson(solicitud.domicilio, "codigo_postal") ?? "",
    estado_residencia: conductor?.estado_residencia ?? textoJson(solicitud.domicilio, "estado") ?? "",
    ciudad_municipio: conductor?.ciudad_municipio ?? textoJson(solicitud.domicilio, "ciudad_municipio", "ciudad") ?? "",
    colonia: conductor?.colonia ?? textoJson(solicitud.domicilio, "colonia") ?? "",
    calle: conductor?.calle ?? textoJson(solicitud.domicilio, "calle") ?? "",
    numero: conductor?.numero ?? textoJson(solicitud.domicilio, "numero") ?? "",
    referencias: conductor?.referencias ?? textoJson(solicitud.domicilio, "referencias") ?? "",
    contacto_emergencia_nombre: conductor?.contacto_emergencia_nombre ?? textoJson(solicitud.contacto_emergencia, "nombre") ?? "",
    contacto_emergencia_telefono: conductor?.contacto_emergencia_telefono ?? textoJson(solicitud.contacto_emergencia, "telefono") ?? ""
  }), [solicitud, conductor]);
  const [datos, setDatos] = useState(valoresIniciales);
  const [procesando, setProcesando] = useState(false);
  const [avisoLocal, setAvisoLocal] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);
  const mapa = urlMapaDomicilio(datos);
  const llamadaEmergencia = telefonoLlamada(datos.contacto_emergencia_telefono);

  useEffect(() => {
    setDatos(valoresIniciales);
  }, [valoresIniciales]);

  function actualizar<K extends keyof typeof datos>(campo: K, valor: string) {
    setDatos((actuales) => ({ ...actuales, [campo]: valor }));
  }

  async function guardar() {
    if (!conductor) {
      setAvisoLocal({ tono: "danger", texto: "Disponible cuando la solicitud tenga conductor asociado." });
      return;
    }
    setProcesando(true);
    setAvisoLocal(null);
    try {
      const cliente = crearClienteNavegador();
      await actualizarConductorAdmin(cliente, conductor.id, {
        nombre: conductor.nombre ?? "",
        telefono: conductor.telefono ?? "",
        curp: conductor.curp ?? "",
        licencia_numero: conductor.licencia_numero ?? "",
        licencia_tipo: conductor.licencia_tipo ?? "",
        licencia_vigencia: conductor.licencia_vigencia ?? "",
        foto_perfil_url: conductor.foto_perfil_url ?? null,
        ...datos
      });
      await onGuardado();
      setAvisoLocal({ tono: "info", texto: "Domicilio y contacto de emergencia actualizados." });
    } catch (err) {
      setAvisoLocal({ tono: "danger", texto: err instanceof Error ? err.message : "No se pudo guardar la información." });
    } finally {
      setProcesando(false);
    }
  }

  return (
    <SeccionAcordeon
      titulo="Domicilio y contacto de emergencia"
      distintivo={<span className="font-body text-xs text-ui-fg-muted">Editable</span>}
    >
      <div className="space-y-4">
        {avisoLocal && <Aviso tono={avisoLocal.tono}>{avisoLocal.texto}</Aviso>}
        <div className="rounded-lg border border-ui-line bg-ui-muted p-3">
          <p className="font-body text-sm font-semibold text-ui-fg">Domicilio formateado</p>
          <p className="mt-1 font-body text-sm text-ui-fg-muted">
            {[
              [datos.calle, datos.numero].filter(Boolean).join(" "),
              datos.colonia,
              datos.codigo_postal,
              datos.ciudad_municipio,
              datos.estado_residencia
            ].filter(Boolean).join(", ") || "Sin domicilio registrado."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={mapa ?? undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!mapa}
              className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 font-body text-sm font-semibold ${mapa ? "border-ui-brand/40 bg-ui-brand/10 text-ui-brand-soft-fg hover:bg-ui-brand/20" : "pointer-events-none border-ui-line bg-ui-brand/[0.04] text-ui-fg-muted"}`}
            >
              Ver mapa
            </a>
            <a
              href={llamadaEmergencia ?? undefined}
              aria-disabled={!llamadaEmergencia}
              className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 font-body text-sm font-semibold ${llamadaEmergencia ? "border-ui-success/40 bg-ui-success/10 text-ui-success hover:bg-ui-success/20" : "pointer-events-none border-ui-line bg-ui-brand/[0.04] text-ui-fg-muted"}`}
            >
              Llamar emergencia
            </a>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoEditable label="Código postal" value={datos.codigo_postal} inputMode="numeric" onChange={(valor) => actualizar("codigo_postal", valor)} />
          <CampoEditable label="Estado" value={datos.estado_residencia} onChange={(valor) => actualizar("estado_residencia", valor)} />
          <CampoEditable label="Municipio o ciudad" value={datos.ciudad_municipio} onChange={(valor) => actualizar("ciudad_municipio", valor)} />
          <CampoEditable label="Colonia" value={datos.colonia} onChange={(valor) => actualizar("colonia", valor)} />
          <CampoEditable label="Calle" value={datos.calle} onChange={(valor) => actualizar("calle", valor)} />
          <CampoEditable label="Número" value={datos.numero} onChange={(valor) => actualizar("numero", valor)} />
          <CampoEditable label="Referencias" value={datos.referencias} onChange={(valor) => actualizar("referencias", valor)} />
          <CampoEditable label="Correo electrónico" value={correo} onChange={() => undefined} readOnly />
          <CampoEditable label="Contacto de emergencia" value={datos.contacto_emergencia_nombre} onChange={(valor) => actualizar("contacto_emergencia_nombre", valor)} />
          <CampoEditable label="Teléfono de emergencia" value={datos.contacto_emergencia_telefono} inputMode="tel" onChange={(valor) => actualizar("contacto_emergencia_telefono", valor)} />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={procesando || !conductor}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-on-brand hover:bg-ui-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesando ? "Guardando..." : "Guardar datos"}
          </button>
        </div>
      </div>
    </SeccionAcordeon>
  );
}
