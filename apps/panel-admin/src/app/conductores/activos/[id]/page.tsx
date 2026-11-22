"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Aviso } from "@ruum/ui";
import type { Database, Json } from "@ruum/shared/types";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import {
  obtenerConductorAdmin,
  actualizarConductorAdmin,
  obtenerVehiculosDeConductorAdmin,
  obtenerEmpresaDeConductorAdmin,
  obtenerHistorialEstatusConductorAdmin,
  verificarVigenciasDocumentosConductor,
  solicitarAprobacionAdmin
} from "@ruum/api/services";
import { obtenerDocumentosConductorAdmin, obtenerSolicitudRecienteConductorAdmin } from "@ruum/api/drivers";

type ConductorRow = Database["public"]["Tables"]["conductores"]["Row"];
type DocumentoRow = Database["public"]["Tables"]["documentos_conductor"]["Row"];
type VehiculoRow = Database["public"]["Tables"]["vehiculos"]["Row"];
type EmpresaRow = Database["public"]["Tables"]["empresas"]["Row"];
type HistorialEstatus = {
  id: string;
  conductor_id: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  motivo: string | null;
  cambiado_por: string;
  cambiado_en: string;
};

const ESTADO_CLASE: Record<string, string> = {
  activo: "border-ui-success/30 bg-ui-success-soft text-ui-success",
  suspendido_7d: "border-ui-danger/30 bg-ui-danger-soft text-ui-danger",
  suspendido_14d: "border-ui-danger/30 bg-ui-danger-soft text-ui-danger",
  suspendido_30d: "border-ui-danger/30 bg-ui-danger-soft text-ui-danger",
  suspendido_indefinido: "border-ui-danger/30 bg-ui-danger-soft text-ui-danger",
  bloqueado_permanente: "border-ui-line-strong bg-ui-muted text-ui-fg-muted",
  modo_prueba_supervisada: "border-ui-warning/30 bg-ui-warning-soft text-ui-warning",
  pendiente_verificacion: "border-ui-line-strong bg-ui-muted text-ui-fg-muted"
};

const ETIQUETA_ESTADO: Record<string, string> = {
  activo: "Activo",
  suspendido_7d: "Suspendido (7d)",
  suspendido_14d: "Suspendido (14d)",
  suspendido_30d: "Suspendido (30d)",
  suspendido_indefinido: "Suspendido",
  bloqueado_permanente: "Baja",
  modo_prueba_supervisada: "Modo prueba",
  pendiente_verificacion: "Pendiente"
};

const ETIQUETA_DOCUMENTO: Record<string, string> = {
  licencia_frente: "Licencia · frente",
  licencia_reverso: "Licencia · reverso",
  identificacion_oficial: "Identificación oficial",
  documento_operativo: "Documento operativo adicional"
};

const ESTADO_DOCUMENTO: Record<string, { texto: string; clase: string }> = {
  en_revision: { texto: "En revisión", clase: "border-ui-brand/30 bg-ui-brand-soft text-ui-brand-soft-fg" },
  aprobado: { texto: "Aprobado", clase: "border-ui-success/30 bg-ui-success-soft text-ui-success" },
  rechazado: { texto: "Rechazado", clase: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger" },
  vencido: { texto: "Vencido", clase: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger" }
};

function fecha(valor: string | null) {
  return valor ? new Date(valor).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "—";
}

const ESTADOS_SUSPENDIDOS = new Set(["suspendido_7d", "suspendido_14d", "suspendido_30d", "suspendido_indefinido"]);

function textoEstado(estado: string) {
  return ETIQUETA_ESTADO[estado] ?? estado;
}

function subtituloConductor(conductor: ConductorRow) {
  const licencia = conductor.licencia_numero ? `Licencia ${conductor.licencia_numero}` : "Licencia no registrada";
  const tipo = conductor.licencia_tipo ? ` (Tipo ${conductor.licencia_tipo})` : "";
  return `${textoEstado(conductor.estado)} · ${licencia}${tipo}`;
}

function telefonoHref(valor: string | null | undefined) {
  const digitos = valor?.replace(/\D/g, "") ?? "";
  return digitos ? `tel:${digitos}` : null;
}

function domicilioFormateado(conductor: ConductorRow) {
  const linea1 = [conductor.calle, conductor.numero].filter(Boolean).join(" ");
  const linea2 = [conductor.colonia, conductor.codigo_postal].filter(Boolean).join(", ");
  const linea3 = [conductor.ciudad_municipio, conductor.estado_residencia].filter(Boolean).join(", ");
  return [linea1, linea2, linea3, conductor.referencias ? `Referencias: ${conductor.referencias}` : null].filter((linea): linea is string => Boolean(linea));
}

function mapaHref(conductor: ConductorRow) {
  const direccion = domicilioFormateado(conductor).filter((linea) => !linea.startsWith("Referencias:")).join(", ");
  return direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}` : null;
}

function estadoCumplimientoDocumentos(documentos: DocumentoRow[]) {
  const vigentes = documentos.filter((doc) => doc.estado === "aprobado").length;
  const total = documentos.length;
  if (total === 0) return { texto: "Sin documentos", clase: "border-ui-warning/30 bg-ui-warning-soft text-ui-warning" };
  if (vigentes === total) return { texto: `${vigentes} documentos vigentes`, clase: "border-ui-success/30 bg-ui-success-soft text-ui-success" };
  return { texto: `${vigentes} de ${total} vigentes`, clase: "border-ui-warning/30 bg-ui-warning-soft text-ui-warning" };
}

export default function PaginaDetalleConductorAdmin() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const solicitudParam = searchParams.get("solicitud");

  const [conductor, setConductor] = useState<ConductorRow | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoRow[]>([]);
  const [vehiculos, setVehiculos] = useState<VehiculoRow[]>([]);
  const [empresa, setEmpresa] = useState<EmpresaRow | null>(null);
  const [historial, setHistorial] = useState<HistorialEstatus[]>([]);
  const [pasaporteHref, setPasaporteHref] = useState<string | null>(solicitudParam ? `/conductores/${solicitudParam}` : null);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);
  const [editandoDatos, setEditandoDatos] = useState(false);

  const cargar = useCallback(async () => {
    if (!tieneSupabaseConfigurado()) { setCargando(false); return; }
    try {
      const cliente = crearClienteNavegador();
      const c = await obtenerConductorAdmin(cliente, id);
      setConductor(c);
      const [d, v, e, h, solicitud] = await Promise.all([
        obtenerDocumentosConductorAdmin(cliente, id).catch(() => []),
        obtenerVehiculosDeConductorAdmin(cliente, id).catch(() => []),
        obtenerEmpresaDeConductorAdmin(cliente, id).catch(() => null),
        obtenerHistorialEstatusConductorAdmin(cliente, id).catch(() => []),
        solicitudParam
          ? Promise.resolve({ id: solicitudParam })
          : obtenerSolicitudRecienteConductorAdmin(cliente, id).catch(() => null)
      ]);
      void verificarVigenciasDocumentosConductor(cliente, id).catch(() => undefined);
      setDocumentos(d);
      setVehiculos(v);
      setEmpresa(e);
      setHistorial(h);
      if (solicitud?.id) setPasaporteHref(`/conductores/${solicitud.id}`);
    } catch { setConductor(null); }
    finally { setCargando(false); }
  }, [id, solicitudParam]);

  useEffect(() => { void cargar(); }, [cargar]);

  if (cargando) return <main className="mx-auto max-w-3xl px-6 py-8"><p className="font-body text-ui-fg-muted">Cargando…</p></main>;
  if (!conductor) return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Aviso tono="danger">No se encontró el conductor.</Aviso>
      <Link href={pasaporteHref ?? "/conductores"} className="mt-4 inline-block font-body text-sm text-ui-brand hover:underline">Volver</Link>
    </main>
  );

  const documentosActuales = Object.entries(
    documentos.reduce((acc, doc) => {
      if (!acc[doc.tipo] || doc.version > acc[doc.tipo].version) acc[doc.tipo] = doc;
      return acc;
    }, {} as Record<string, DocumentoRow>)
  ).map(([, doc]) => doc);
  const domicilio = domicilioFormateado(conductor);
  const mapa = mapaHref(conductor);
  const cumplimientoDocumentos = estadoCumplimientoDocumentos(documentosActuales);
  const telefonoPrincipal = telefonoHref(conductor.telefono);
  const telefonoEmergencia = telefonoHref(conductor.contacto_emergencia_telefono);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={pasaporteHref ?? "/conductores/activos"} className="font-body text-sm text-ui-fg-muted hover:text-ui-fg">&larr; Volver</Link>
          <Link href="/conductores/activos" className="font-body text-sm text-ui-brand-soft-fg hover:underline">Conductores activos</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="#editar-datos" onClick={() => setEditandoDatos(true)} className="inline-flex min-h-10 items-center rounded-lg border border-ui-line-strong bg-ui-card px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted">Editar datos</a>
          {pasaporteHref && (
            <Link href={pasaporteHref} className="inline-flex min-h-10 items-center rounded-lg border border-ui-brand/30 bg-ui-brand-soft px-4 py-2 font-body text-sm font-semibold text-ui-brand-soft-fg hover:bg-ui-brand-soft">
              Abrir Pasaporte Digital
            </Link>
          )}
          <a href={telefonoPrincipal ?? undefined} aria-disabled={!telefonoPrincipal} className="inline-flex min-h-10 items-center rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-on-brand hover:bg-ui-brand/90 aria-disabled:pointer-events-none aria-disabled:opacity-50">Llamar</a>
          {(conductor.estado === "suspendido_7d" || conductor.estado === "suspendido_14d" || conductor.estado === "suspendido_30d" || conductor.estado === "suspendido_indefinido") && (
            <ReactivarConductor conductorId={conductor.id} onCompletado={() => { void cargar(); setAviso({ tono: "info", texto: "Conductor reactivado." }); }} compacto />
          )}
        </div>
      </div>

      {aviso && <div className="mt-4"><Aviso tono={aviso.tono}>{aviso.texto}</Aviso></div>}

      <header className="mt-6 rounded-lg border border-ui-line bg-ui-card p-5 shadow-ui-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold">{conductor.nombre}</h1>
            <p className="mt-1 font-body text-sm font-medium text-ui-fg-muted">{subtituloConductor(conductor)}</p>
            <p className="mt-2 max-w-2xl font-body text-sm text-ui-fg-muted">
              Ficha ejecutiva para operar la cuenta del conductor. El expediente documental y la trazabilidad viven en el Pasaporte Digital.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 font-body text-xs font-medium ${ESTADO_CLASE[conductor.estado] ?? ""}`}>{textoEstado(conductor.estado)}</span>
            <span className={`rounded-full border px-3 py-1 font-body text-xs font-medium ${cumplimientoDocumentos.clase}`}>{cumplimientoDocumentos.texto}</span>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-6">
          <Seccion titulo="Resumen" tono="resumen">
            <Dato etiqueta="Nombre" valor={conductor.nombre} />
            <Dato etiqueta="Estado" valor={textoEstado(conductor.estado)} />
            <Dato etiqueta="Teléfono" valor={conductor.telefono} copiar llamarHref={telefonoPrincipal} />
            <Dato etiqueta="CURP" valor={conductor.curp} copiar />
            <Dato etiqueta="Licencia" valor={conductor.licencia_numero} copiar />
          </Seccion>

          <Seccion titulo="Datos personales" tono="personales">
            <Dato etiqueta="Tipo licencia" valor={conductor.licencia_tipo} />
            <Dato etiqueta="Vigencia de licencia" valor={conductor.licencia_vigencia} destacado />
            <Dato etiqueta="Contacto emergencia" valor={conductor.contacto_emergencia_nombre} />
            <Dato etiqueta="Tel. emergencia" valor={conductor.contacto_emergencia_telefono} copiar llamarHref={telefonoEmergencia} />
          </Seccion>

          <Seccion titulo="Domicilio" tono="domicilio">
            <div className="rounded-xl border border-ui-line bg-ui-card px-4 py-3">
              {domicilio.length > 0 ? (
                <address className="not-italic font-body text-sm leading-6 text-ui-fg">
                  {domicilio.map((linea) => <span key={linea} className="block">{linea}</span>)}
                </address>
              ) : (
                <p className="font-body text-sm text-ui-fg-muted">Sin domicilio registrado.</p>
              )}
              {mapa && (
                <a href={mapa} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-ui-brand/30 px-3 py-2 font-body text-sm font-semibold text-ui-brand-soft-fg hover:bg-ui-brand-soft">
                  Ver en mapa
                </a>
              )}
            </div>
          </Seccion>

          <Seccion titulo="Fechas" tono="fechas">
            <Dato etiqueta="Vigencia" valor={conductor.licencia_vigencia ? `Vigencia ${conductor.licencia_vigencia}` : null} destacado />
            <Dato etiqueta="Registrado" valor={`Registrado ${fecha(conductor.creado_en)}`} />
            <Dato etiqueta="Actualizado" valor={`Actualizado ${fecha(conductor.actualizado_en)}`} />
          </Seccion>

          <section id="editar-datos" className="scroll-mt-8 rounded-lg border border-ui-line bg-ui-card p-4">
            <EditarConductor conductor={conductor} editando={editandoDatos} setEditando={setEditandoDatos} onActualizado={(c) => { setConductor(c); setAviso({ tono: "info", texto: "Conductor actualizado." }); }} />
          </section>
        </section>

        <section className="space-y-6">
          <Seccion titulo="Acciones" tono="acciones">
            <div className="grid gap-3">
              {telefonoPrincipal ? (
                <a href={telefonoPrincipal} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-on-brand hover:bg-ui-brand/90">Llamar</a>
              ) : (
                <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ui-line px-4 py-2 font-body text-sm text-ui-fg-muted">Sin teléfono</span>
              )}
              {conductor.estado === "activo" && (
                <SuspenderConductor conductor={conductor} onCompletado={() => { void cargar(); setAviso({ tono: "info", texto: "Conductor suspendido." }); }} />
              )}
              {ESTADOS_SUSPENDIDOS.has(conductor.estado) && (
                <ReactivarConductor conductorId={conductor.id} onCompletado={() => { void cargar(); setAviso({ tono: "info", texto: "Conductor reactivado." }); }} />
              )}
              {conductor.estado !== "bloqueado_permanente" && (
                <details className="rounded-lg border border-ui-line bg-ui-card">
                  <summary className="cursor-pointer px-4 py-3 font-body text-sm font-semibold text-ui-fg">Más acciones</summary>
                  <div className="border-t border-ui-line p-3">
                    <DarBajaConductor conductor={conductor} onCompletado={() => { void cargar(); setAviso({ tono: "info", texto: "Conductor dado de baja." }); }} />
                  </div>
                </details>
              )}
            </div>
          </Seccion>

          <div className="rounded-lg border border-ui-line bg-ui-brand-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">Documentos</h2>
              <span className={`rounded-full border px-3 py-1 font-body text-xs font-semibold ${cumplimientoDocumentos.clase}`}>{cumplimientoDocumentos.texto}</span>
            </div>
            <p className="mt-2 font-body text-sm text-ui-fg-muted">
              Resumen operativo de cumplimiento. Revisa archivos, validaciones e historial en el Pasaporte Digital.
            </p>
          {documentosActuales.length === 0 ? <p className="font-body text-sm text-ui-fg-muted">Sin documentos registrados.</p> : (
            <div className="mt-3 space-y-3">
              {documentosActuales.map((doc) => (
                <FilaDocumento key={doc.id} documento={doc} />
              ))}
            </div>
          )}
            {pasaporteHref ? (
              <Link href={pasaporteHref} className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-on-brand hover:bg-ui-brand-hover">
                Abrir expediente completo
              </Link>
            ) : (
              <p className="mt-4 rounded-lg border border-ui-warning/30 bg-ui-warning-soft px-3 py-2 font-body text-sm text-ui-warning">
                No encontramos una solicitud vinculada para abrir el Pasaporte Digital.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const SECCION_CLASE: Record<string, string> = {
  resumen: "bg-ui-brand-soft",
  personales: "bg-ui-card",
  domicilio: "bg-ui-success-soft",
  fechas: "bg-ui-warning-soft",
  acciones: "bg-ui-brand/[0.025]"
};

function Seccion({ titulo, children, tono = "personales" }: { titulo: string; children: ReactNode; tono?: keyof typeof SECCION_CLASE }) {
  return (
    <section className={`rounded-lg border border-ui-line p-4 shadow-ui-sm ${SECCION_CLASE[tono]}`}>
      <h2 className="font-display text-lg font-semibold text-ui-fg">{titulo}</h2>
      <div className="mt-3 divide-y divide-ui-line">{children}</div>
    </section>
  );
}

function Dato({
  etiqueta,
  valor,
  copiar = false,
  llamarHref,
  destacado = false
}: {
  etiqueta: string;
  valor: string | null | undefined;
  copiar?: boolean;
  llamarHref?: string | null;
  destacado?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);
  async function copiarValor() {
    if (!valor) return;
    await navigator.clipboard.writeText(valor);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), 1200);
  }
  return (
    <div className="group grid gap-2 py-3 font-body text-sm sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center">
      <span className="text-ui-fg-muted">{etiqueta}</span>
      <span className={`min-w-0 break-words text-left font-medium ${destacado ? "rounded-lg border border-ui-warning/30 bg-ui-warning-soft px-3 py-2 text-ui-warning" : "text-ui-fg"}`}>
        {valor ?? <span className="text-ui-fg-muted">—</span>}
      </span>
      <span className="flex flex-wrap gap-2 sm:justify-end">
        {llamarHref && (
          <a href={llamarHref} className="inline-flex min-h-9 items-center rounded-md border border-ui-brand/30 px-2.5 py-1 font-body text-xs font-semibold text-ui-brand-soft-fg hover:bg-ui-brand-soft">
            Llamar
          </a>
        )}
        {copiar && valor ? (
          <span className="relative inline-flex">
            <button type="button" onClick={copiarValor} className="inline-flex min-h-9 items-center rounded-md border border-ui-line px-2.5 py-1 font-body text-xs font-semibold text-ui-fg-muted transition hover:bg-ui-muted hover:text-ui-fg" title={`Copiar ${etiqueta}`}>
              Copiar
            </button>
            {copiado && (
              <span className="absolute -top-8 right-0 rounded-md bg-ui-brand px-2 py-1 font-body text-xs font-semibold text-ui-on-brand shadow-ui-md">
                Copiado
              </span>
            )}
          </span>
        ) : null}
      </span>
    </div>
  );
}

function FilaDocumento({ documento }: { documento: DocumentoRow }) {
  const estado = ESTADO_DOCUMENTO[documento.estado] ?? ESTADO_DOCUMENTO.en_revision;

  return (
    <div className="rounded-lg border border-ui-line bg-ui-card p-3 transition hover:border-ui-line-strong hover:bg-ui-brand-hover/[0.015]">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <p className="truncate font-body text-sm font-semibold">{ETIQUETA_DOCUMENTO[documento.tipo] ?? documento.tipo}</p>
          <p className="mt-0.5 font-body text-xs text-ui-fg-muted">Versión {documento.version} · {fecha(documento.creado_en)}</p>
          <p className="mt-0.5 truncate font-body text-xs text-ui-fg-muted">{documento.nombre_archivo}</p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 font-body text-xs font-medium ${estado.clase}`}>{estado.texto}</span>
      </div>
      {(documento.motivo_rechazo || documento.notas_admin) && (
        <p className="mt-3 rounded-lg bg-ui-warning-soft px-3 py-2 font-body text-xs text-ui-warning">{documento.motivo_rechazo ?? documento.notas_admin}</p>
      )}
    </div>
  );
}

function EditarConductor({
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
        <p className="mt-1 font-body text-sm text-ui-fg-muted">Usa el botón “Editar datos” de la cabecera para modificar esta ficha.</p>
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
      {error && <div className="mt-2"><Aviso tono="danger">{error}</Aviso></div>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre" value={datos.nombre} onChange={(v) => setDatos({ ...datos, nombre: v })} />
        <Campo label="Teléfono" value={datos.telefono} onChange={(v) => setDatos({ ...datos, telefono: v })} />
        <Campo label="CURP" value={datos.curp} onChange={(v) => setDatos({ ...datos, curp: v })} />
        <Campo label="Licencia" value={datos.licencia_numero} onChange={(v) => setDatos({ ...datos, licencia_numero: v.toLocaleUpperCase("es-MX") })} />
        <Campo label="Tipo licencia" value={datos.licencia_tipo} onChange={(v) => setDatos({ ...datos, licencia_tipo: v })} />
        <Campo label="Vigencia" value={datos.licencia_vigencia} onChange={(v) => setDatos({ ...datos, licencia_vigencia: v })} />
        <Campo label="Código postal" value={datos.codigo_postal} onChange={(v) => setDatos({ ...datos, codigo_postal: v })} />
        <Campo label="Estado" value={datos.estado_residencia} onChange={(v) => setDatos({ ...datos, estado_residencia: v })} />
        <Campo label="Ciudad/Municipio" value={datos.ciudad_municipio} onChange={(v) => setDatos({ ...datos, ciudad_municipio: v })} />
        <Campo label="Colonia" value={datos.colonia} onChange={(v) => setDatos({ ...datos, colonia: v })} />
        <Campo label="Calle" value={datos.calle} onChange={(v) => setDatos({ ...datos, calle: v })} />
        <Campo label="Número" value={datos.numero} onChange={(v) => setDatos({ ...datos, numero: v })} />
        <Campo label="Referencias" value={datos.referencias} onChange={(v) => setDatos({ ...datos, referencias: v })} />
        <Campo label="Contacto emergencia" value={datos.contacto_emergencia_nombre} onChange={(v) => setDatos({ ...datos, contacto_emergencia_nombre: v })} />
        <Campo label="Tel. emergencia" value={datos.contacto_emergencia_telefono} onChange={(v) => setDatos({ ...datos, contacto_emergencia_telefono: v })} />
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={guardar} disabled={procesando} className="rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-on-brand hover:bg-ui-brand-hover disabled:opacity-50">{procesando ? "Guardando…" : "Guardar cambios"}</button>
        <button onClick={() => setEditando(false)} disabled={procesando} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-medium hover:bg-ui-muted">Cancelar</button>
      </div>
    </div>
  );
}

function Campo({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-xs font-medium text-ui-fg-muted">{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} data-ruum-label={label} className="rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring" />
    </label>
  );
}

function IconoPausa() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 5v14" />
      <path d="M16 5v14" />
    </svg>
  );
}

function IconoBaja() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function SuspenderConductor({ conductor, onCompletado, compacto = false }: { conductor: ConductorRow; onCompletado: () => void; compacto?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);
  if (!abierto) return <button onClick={() => setAbierto(true)} className={`${compacto ? "rounded-lg px-4 py-2" : "rounded-lg px-4 py-2"} inline-flex min-h-10 items-center justify-center gap-2 border border-ui-line-strong bg-ui-card font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted`}><IconoPausa />Suspender</button>;
  async function ejecutar() {
    if (!motivo.trim()) return;
    setProcesando(true); setAviso(null);
    try {
      const cliente = crearClienteNavegador();
      const aprobacionId = await solicitarAprobacionAdmin(cliente, {
        tipo: "sancion",
        capacidad: "conductores:sancionar",
        recurso: "conductores",
        recursoId: conductor.id,
        accion: "suspender",
        payload: { nuevo_estado: "suspendido", motivo: motivo.trim() } as Json
      });
      setAviso({ tono: "info", texto: `Solicitud de aprobación #${aprobacionId.slice(0, 8).toUpperCase()} creada. Autorízala en Aprobaciones duales para ejecutar la suspensión.` });
    }
    catch (err) {
      const mensaje = err instanceof Error ? err.message : "No se pudo suspender.";
      setAviso({ tono: "danger", texto: mensaje });
    }
    finally { setProcesando(false); }
  }
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="suspender-conductor-titulo" className="rounded-lg border border-ui-warning/30 bg-ui-warning-soft p-4">
      <p id="suspender-conductor-titulo" className="flex items-center gap-2 font-body text-sm font-semibold text-ui-warning"><IconoPausa /> Suspender conductor</p>
      <div className="mt-3 rounded-lg border border-ui-line bg-ui-card px-3 py-2 font-body text-sm text-ui-fg-muted">
        <p><span className="font-semibold text-ui-fg">Conductor:</span> {conductor.nombre}</p>
        <p><span className="font-semibold text-ui-fg">Estado actual:</span> {textoEstado(conductor.estado)}</p>
        <p><span className="font-semibold text-ui-fg">Efecto:</span> El conductor no podrá recibir nuevos traslados hasta que se reactive.</p>
      </div>
      {aviso && <div className="mt-2"><Aviso tono={aviso.tono}>{aviso.texto}</Aviso></div>}
      <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la suspensión" className="mt-3 w-full rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm" rows={2} />
      <div className="mt-3 flex gap-2">
        <button onClick={ejecutar} disabled={procesando || !motivo.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ui-warning px-4 py-2 font-body text-sm font-semibold text-ui-on-brand disabled:opacity-50"><IconoPausa />{procesando ? "Suspendiendo…" : "Confirmar suspensión"}</button>
        <button onClick={() => setAbierto(false)} disabled={procesando} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-medium hover:bg-ui-muted">Cancelar</button>
      </div>
    </div>
  );
}

function ReactivarConductor({ conductorId, onCompletado, compacto = false }: { conductorId: string; onCompletado: () => void; compacto?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);
  if (!abierto) return <button onClick={() => setAbierto(true)} className={`${compacto ? "rounded-lg px-4 py-2" : "rounded-lg px-4 py-2"} border border-ui-success/40 bg-ui-success/10 font-body text-sm font-medium text-ui-success hover:bg-ui-success/20`}>Reactivar</button>;
  async function ejecutar() {
    if (!motivo.trim()) return; setProcesando(true);
    setAviso(null);
    try {
      const cliente = crearClienteNavegador();
      const aprobacionId = await solicitarAprobacionAdmin(cliente, {
        tipo: "sancion",
        capacidad: "conductores:sancionar",
        recurso: "conductores",
        recursoId: conductorId,
        accion: "suspender",
        payload: { nuevo_estado: "activo", motivo: motivo.trim() } as Json
      });
      setAviso({ tono: "info", texto: `Solicitud de aprobación #${aprobacionId.slice(0, 8).toUpperCase()} creada. Autorízala en Aprobaciones duales para ejecutar la reactivación.` });
    }
    catch (err) {
      const mensaje = err instanceof Error ? err.message : "No se pudo reactivar.";
      setAviso({ tono: "danger", texto: mensaje });
    }
    finally { setProcesando(false); }
  }
  return (
    <div className="rounded-lg border border-ui-success/30 bg-ui-success-soft p-4">
      <p className="font-body text-sm font-semibold text-ui-success">Reactivar conductor</p>
      <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la reactivación" className="mt-3 w-full rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm" rows={2} />
      {aviso && <div className="mt-2"><Aviso tono={aviso.tono}>{aviso.texto}</Aviso></div>}
      <div className="mt-3 flex gap-2">
        <button onClick={ejecutar} disabled={procesando || !motivo.trim()} className="rounded-lg bg-ui-success px-4 py-2 font-body text-sm font-semibold text-ui-on-brand disabled:opacity-50">{procesando ? "Reactivando…" : "Confirmar reactivación"}</button>
        <button onClick={() => setAbierto(false)} disabled={procesando} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-medium">Cancelar</button>
      </div>
    </div>
  );
}

function DarBajaConductor({ conductor, onCompletado }: { conductor: ConductorRow; onCompletado: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);
  if (!abierto) return <button onClick={() => setAbierto(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-ui-danger/40 bg-ui-danger/10 px-4 py-2 font-body text-sm font-semibold text-ui-danger hover:bg-ui-danger/20"><IconoBaja />Baja definitiva</button>;
  async function ejecutar() {
    if (!motivo.trim() || confirmacion !== "BAJA") return; setProcesando(true);
    setAviso(null);
    try {
      const cliente = crearClienteNavegador();
      const aprobacionId = await solicitarAprobacionAdmin(cliente, {
        tipo: "sancion",
        capacidad: "conductores:sancionar",
        recurso: "conductores",
        recursoId: conductor.id,
        accion: "suspender",
        payload: { nuevo_estado: "baja", motivo: motivo.trim() } as Json
      });
      setAviso({ tono: "info", texto: `Solicitud de aprobación #${aprobacionId.slice(0, 8).toUpperCase()} creada. Autorízala en Aprobaciones duales para ejecutar la baja definitiva.` });
    }
    catch (err) {
      const mensaje = err instanceof Error ? err.message : "No se pudo dar de baja.";
      setAviso({ tono: "danger", texto: mensaje });
    }
    finally { setProcesando(false); }
  }
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="baja-conductor-titulo" className="rounded-lg border border-ui-danger/30 bg-ui-danger-soft p-4">
      <p id="baja-conductor-titulo" className="flex items-center gap-2 font-body text-sm font-semibold text-ui-danger"><IconoBaja /> Baja definitiva</p>
      <div className="mt-3 rounded-lg border border-ui-danger/20 bg-ui-card px-3 py-2 font-body text-sm text-ui-fg-muted">
        <p><span className="font-semibold text-ui-fg">Conductor:</span> {conductor.nombre}</p>
        <p><span className="font-semibold text-ui-fg">Estado actual:</span> {textoEstado(conductor.estado)}</p>
        <p><span className="font-semibold text-ui-fg">Efecto:</span> La cuenta queda bloqueada permanentemente y no podrá operar traslados.</p>
      </div>
      <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la baja" className="mt-3 w-full rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm" rows={2} />
      {aviso && <div className="mt-2"><Aviso tono={aviso.tono}>{aviso.texto}</Aviso></div>}
      <label className="mt-3 flex flex-col gap-1">
        <span className="font-body text-xs font-medium text-ui-fg-muted">Escribe BAJA para confirmar</span>
        <input type="text" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} className="rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm" />
      </label>
      <div className="mt-3 flex gap-2">
        <button onClick={ejecutar} disabled={procesando || !motivo.trim() || confirmacion !== "BAJA"} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-ui-danger px-4 py-2 font-body text-sm font-semibold text-ui-on-brand disabled:opacity-50"><IconoBaja />{procesando ? "Dando de baja…" : "Dar de baja definitivamente"}</button>
        <button onClick={() => setAbierto(false)} disabled={procesando} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-medium">Cancelar</button>
      </div>
    </div>
  );
}
