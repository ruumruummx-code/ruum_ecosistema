"use client";

import { useState, useTransition } from "react";
import { Button, Tabs } from "@ruum/ui";
import {
  actualizarEmpresaCorporativaAdmin,
  cambiarEstadoEmpresaAdmin,
  guardarDocumentoEmpresaAdmin,
  guardarUsuarioEmpresaAdmin,
  resolverCambioEmpresaAdmin,
  validarDocumentoEmpresa,
  type DatosEmpresasAdmin
} from "@ruum/api/services";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import { AdminDialog } from "../admin-components";
import {
  type Empresa,
  type Usuario,
  type CambioSensible,
  type TabEmpresa,
  TABS_EMPRESA,
  RFC_MEXICO,
  USUARIO_INICIAL,
  DOCUMENTO_INICIAL,
  Badge,
  Dato,
  CampoTexto,
  KpiEmpresa,
  fecha,
  moneda
} from "./EmpresasTipos";

interface AccionesEmpresaProps {
  empresa: Empresa;
  usuarios: Usuario[];
  vehiculos: DatosEmpresasAdmin["vehiculos"];
  conductores: DatosEmpresasAdmin["conductores"];
  documentos: DatosEmpresasAdmin["documentos"];
  Traslados: DatosEmpresasAdmin["traslados"];
  versionesFiscales: DatosEmpresasAdmin["versionesFiscales"];
  versionesCondiciones: DatosEmpresasAdmin["versionesCondiciones"];
  cambiosPendientes: CambioSensible[];
  onActualizado: () => void;
}

export function AccionesEmpresa({
  empresa,
  usuarios,
  vehiculos,
  conductores,
  documentos,
  Traslados,
  versionesFiscales,
  versionesCondiciones,
  cambiosPendientes,
  onActualizado
}: AccionesEmpresaProps) {
  const [tab, setTab] = useState<TabEmpresa>("resumen");
  const [form, setForm] = useState({
    nombre: empresa.nombre,
    rfc: empresa.rfc ?? "",
    razon_social: empresa.razon_social ?? "",
    regimen_fiscal: empresa.regimen_fiscal ?? "",
    codigo_postal_fiscal: empresa.codigo_postal_fiscal ?? "",
    uso_cfdi: empresa.uso_cfdi ?? "",
    correo_facturacion: empresa.correo_facturacion ?? "",
    condiciones_pago: empresa.condiciones_pago ?? "",
    limite_credito_mxn: String(empresa.limite_credito_mxn ?? 0),
    credito_disponible_mxn: String(empresa.credito_disponible_mxn ?? 0),
    dias_credito: String(empresa.dias_credito ?? 0),
    requiere_orden_compra: empresa.requiere_orden_compra ?? false,
    motivo: "Actualización administrativa de empresa"
  });
  const [usuario, setUsuario] = useState(USUARIO_INICIAL);
  const [documento, setDocumento] = useState(DOCUMENTO_INICIAL);
  const [motivoEstado, setMotivoEstado] = useState("");
  const [accionRiesgo, setAccionRiesgo] = useState<"suspender" | "reactivar" | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  function ejecutar(accion: () => Promise<void>, ok: string) {
    setMensaje(null);
    startTransition(async () => {
      try {
        await accion();
        setMensaje(ok);
        onActualizado();
      } catch (error) {
        setMensaje(error instanceof Error ? error.message : "No se pudo completar la acción.");
      }
    });
  }

  const rfcValido = RFC_MEXICO.test(form.rfc.trim().toUpperCase());
  const titular = usuarios.find((item) => item.rol === "titular_empresa");

  function ejecutarCambioEstado() {
    if (!accionRiesgo || !motivoEstado.trim()) return;
    const estado = accionRiesgo === "suspender" ? "suspendida" : "activa";
    ejecutar(
      () => cambiarEstadoEmpresaAdmin(crearClienteNavegador(), empresa.id, estado, motivoEstado).then(() => undefined),
      accionRiesgo === "suspender" ? "Empresa suspendida." : "Empresa reactivada."
    );
    setAccionRiesgo(null);
  }

  return (
    <div className="mt-5 border-t border-ui-line pt-5">
      <Tabs
        etiqueta="Secciones administrativas de empresa"
        value={tab}
        onSeleccion={(id) => setTab(id as typeof tab)}
        tabs={TABS_EMPRESA.map((t) => ({ id: t.id, etiqueta: t.etiqueta }))}
        renderPanel={() => (
          <div className="pt-3">
            {tab === "resumen" && (
              <div className="grid gap-4">
                {cambiosPendientes.length > 0 && (
                  <div className="rounded-lg border border-ui-warning/35 bg-ui-warning-soft p-4">
                    <p className="font-body text-sm font-semibold text-ui-warning">Cambios pendientes de aprobación</p>
                    <p className="mt-1 font-body text-sm text-ui-fg-muted">La empresa está activa, pero tiene ajustes fiscales o comerciales esperando revisión.</p>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <KpiEmpresa icono="T" etiqueta="Titular" valor={titular?.nombre ?? "No registrado"} detalle={titular?.correo_facturacion ?? undefined} />
                  <KpiEmpresa icono="V" etiqueta="Flota" valor={String(vehiculos.length)} detalle="vehículos" />
                  <KpiEmpresa icono="C" etiqueta="Conductores" valor={String(conductores.length)} detalle="asignados" />
                  <KpiEmpresa icono="R" etiqueta="Traslados" valor={String(Traslados.length)} detalle="histórico corporativo" />
                  <KpiEmpresa icono="$" etiqueta="Límite crédito" valor={moneda(empresa.limite_credito_mxn)} detalle={`${empresa.dias_credito ?? 0} días`} />
                </div>
                <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Dato etiqueta="Nombre comercial" valor={empresa.nombre} />
                  <Dato etiqueta="Razón social" valor={empresa.razon_social} />
                  <Dato etiqueta="RFC" valor={empresa.rfc} />
                  <Dato etiqueta="Correo de facturación" valor={empresa.correo_facturacion} />
                  <Dato etiqueta="Crédito disponible" valor={moneda(empresa.credito_disponible_mxn)} />
                  <Dato etiqueta="Condiciones" valor={empresa.condiciones_pago} />
                </dl>
              </div>
            )}
            {tab === "fiscal" && (
              <div className="grid gap-4">
                {cambiosPendientes.length > 0 && (
                  <div className="rounded-lg border border-ui-warning/30 bg-ui-warning-soft p-4">
                    <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-warning">Revisión fiscal pendiente</p>
                    <div className="mt-3 grid gap-2">
                      {cambiosPendientes.map((cambio) => (
                        <div key={cambio.id} className="flex flex-col gap-2 rounded-lg bg-ui-card p-3 font-body text-sm sm:flex-row sm:items-center sm:justify-between">
                          <span>{cambio.tipo.replaceAll("_", " ")} · {cambio.motivo}</span>
                          <span className="flex flex-wrap gap-2">
                            <Button variant="quiet" disabled={pendiente} onClick={() => ejecutar(() => resolverCambioEmpresaAdmin(crearClienteNavegador(), cambio.id, true, "Aprobado desde Empresas").then(() => undefined), "Cambio sensible aprobado.")}>Aprobar</Button>
                            <Button variant="quiet" disabled={pendiente} onClick={() => ejecutar(() => resolverCambioEmpresaAdmin(crearClienteNavegador(), cambio.id, false, "Rechazado desde Empresas").then(() => undefined), "Cambio sensible rechazado.")}>Rechazar</Button>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid gap-3 rounded-lg border border-ui-line p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Edición fiscal y facturación</p>
                    <Badge estado={rfcValido ? "verificado" : "rechazado"} texto={rfcValido ? "RFC formal válido" : "RFC inválido"} />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <CampoTexto label="Nombre comercial" value={form.nombre} onChange={(valor) => setForm({ ...form, nombre: valor })} placeholder="Nombre visible" />
                    <CampoTexto label="RFC" value={form.rfc} onChange={(valor) => setForm({ ...form, rfc: valor.toUpperCase() })} placeholder="RFC de la empresa" />
                    <CampoTexto label="Razón social" value={form.razon_social} onChange={(valor) => setForm({ ...form, razon_social: valor })} placeholder="Razón social completa" />
                    <CampoTexto label="Correo de facturación" value={form.correo_facturacion} onChange={(valor) => setForm({ ...form, correo_facturacion: valor })} placeholder="facturacion@empresa.com" type="email" />
                    <CampoTexto label="Régimen fiscal" value={form.regimen_fiscal} onChange={(valor) => setForm({ ...form, regimen_fiscal: valor })} placeholder="Ej. 601" />
                    <CampoTexto label="Código postal fiscal" value={form.codigo_postal_fiscal} onChange={(valor) => setForm({ ...form, codigo_postal_fiscal: valor })} placeholder="5 dígitos" />
                    <CampoTexto label="Uso CFDI" value={form.uso_cfdi} onChange={(valor) => setForm({ ...form, uso_cfdi: valor })} placeholder="Ej. G03" />
                    <CampoTexto label="Condiciones de pago" value={form.condiciones_pago} onChange={(valor) => setForm({ ...form, condiciones_pago: valor })} placeholder="Crédito / contado / OC" />
                    <CampoTexto label="Límite de crédito" value={form.limite_credito_mxn} onChange={(valor) => setForm({ ...form, limite_credito_mxn: valor })} type="number" min="0" />
                    <CampoTexto label="Crédito disponible" value={form.credito_disponible_mxn} onChange={(valor) => setForm({ ...form, credito_disponible_mxn: valor })} type="number" min="0" />
                    <CampoTexto label="Días de crédito" value={form.dias_credito} onChange={(valor) => setForm({ ...form, dias_credito: valor })} type="number" min="0" />
                  </div>
                  <label className="flex items-center gap-2 font-body text-sm">
                    <input type="checkbox" checked={form.requiere_orden_compra} onChange={(e) => setForm({ ...form, requiere_orden_compra: e.target.checked })} className="size-4 rounded border-ui-line-strong" />
                    Requiere orden de compra
                  </label>
                  <CampoTexto label="Motivo del cambio" value={form.motivo} onChange={(valor) => setForm({ ...form, motivo: valor })} placeholder="Justificación para auditoría" />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={pendiente || !rfcValido}
                      onClick={() => ejecutar(
                        () => actualizarEmpresaCorporativaAdmin(crearClienteNavegador(), empresa.id, {
                          nombre: form.nombre,
                          rfc: form.rfc,
                          razon_social: form.razon_social,
                          regimen_fiscal: form.regimen_fiscal,
                          codigo_postal_fiscal: form.codigo_postal_fiscal,
                          uso_cfdi: form.uso_cfdi,
                          correo_facturacion: form.correo_facturacion,
                          condiciones_pago: form.condiciones_pago,
                          limite_credito_mxn: Number(form.limite_credito_mxn || 0),
                          credito_disponible_mxn: Number(form.credito_disponible_mxn || form.limite_credito_mxn || 0),
                          dias_credito: Number(form.dias_credito || 0),
                          requiere_orden_compra: form.requiere_orden_compra
                        }, form.motivo).then(() => undefined),
                        "Actualización enviada. Los cambios sensibles quedan pendientes de aprobación."
                      )}
                    >
                      Guardar / solicitar aprobación
                    </Button>
                    <Button variant="quiet" disabled={pendiente} onClick={() => ejecutar(() => validarDocumentoEmpresa(crearClienteNavegador(), empresa.id, "verificado", "").then(() => undefined), "Empresa aprobada.")}>Aprobar RFC / CFDI</Button>
                    <Button variant="quiet" disabled={pendiente} onClick={() => ejecutar(() => validarDocumentoEmpresa(crearClienteNavegador(), empresa.id, "rechazado", "").then(() => undefined), "Empresa rechazada.")}>Rechazar</Button>
                  </div>
                </div>
                <div className="rounded-lg border border-ui-line p-4">
                  <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Versiones fiscales</p>
                  <div className="mt-3 grid gap-2 font-body text-sm">
                    {versionesFiscales.length === 0 ? <span className="text-ui-fg-muted">Sin versiones registradas</span> : versionesFiscales.map((v) => (
                      <span key={v.id}>v{v.version} · {v.rfc} · desde {fecha(v.vigente_desde)}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {tab === "usuarios" && (
              <div className="grid gap-4">
                <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {usuarios.length === 0 ? (
                    <Dato etiqueta="Usuarios" valor="No registrados" />
                  ) : usuarios.map((item) => (
                    <Dato key={item.id} etiqueta={item.rol === "titular_empresa" ? "Titular" : "Usuario autorizado"} valor={item.nombre ?? item.correo_facturacion} />
                  ))}
                </dl>
                <div className="grid gap-3 rounded-lg border border-ui-line p-4">
                  <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Agregar o actualizar usuario empresarial</p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="font-body text-xs font-semibold text-ui-fg-muted">Rol</span>
                      <select value={usuario.rol} onChange={(e) => setUsuario({ ...usuario, rol: e.target.value as "titular_empresa" | "usuario_autorizado" })} className="rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm">
                        <option value="titular_empresa">Titular empresa</option>
                        <option value="usuario_autorizado">Usuario autorizado</option>
                      </select>
                    </label>
                    <CampoTexto label="Nombre completo" value={usuario.nombre} onChange={(valor) => setUsuario({ ...usuario, nombre: valor })} placeholder="Nombre y apellidos" />
                    <CampoTexto label="Correo" value={usuario.correo_facturacion} onChange={(valor) => setUsuario({ ...usuario, correo_facturacion: valor })} placeholder="correo@empresa.com" type="email" />
                    <CampoTexto label="Teléfono" value={usuario.telefono} onChange={(valor) => setUsuario({ ...usuario, telefono: valor })} placeholder="10 dígitos" />
                  </div>
                  <label className="flex items-center gap-2 font-body text-sm">
                    <input type="checkbox" checked={usuario.metodo_pago_registrado} onChange={(e) => setUsuario({ ...usuario, metodo_pago_registrado: e.target.checked })} className="size-4 rounded border-ui-line-strong" />
                    Puede operar pago corporativo
                  </label>
                  <Button disabled={pendiente} onClick={() => ejecutar(() => guardarUsuarioEmpresaAdmin(crearClienteNavegador(), empresa.id, usuario).then(() => undefined), "Usuario empresarial guardado.")}>Guardar usuario</Button>
                </div>
              </div>
            )}
            {tab === "documentos" && (
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {documentos.length === 0 ? (
                    <Dato etiqueta="Documentos" valor="No registrados" />
                  ) : documentos.map((doc) => (
                    <Dato key={doc.id} etiqueta={doc.tipo} valor={`${doc.nombre} · vence ${fecha(doc.vigente_hasta)}`} />
                  ))}
                </div>
                <div className="grid gap-3 rounded-lg border border-ui-line p-4">
                  <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Registrar contrato o documento</p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <CampoTexto label="Tipo de documento" value={documento.tipo} onChange={(valor) => setDocumento({ ...documento, tipo: valor })} placeholder="Contrato, NDA, anexo" />
                    <CampoTexto label="Nombre del documento" value={documento.nombre} onChange={(valor) => setDocumento({ ...documento, nombre: valor })} placeholder="Contrato marco" />
                    <CampoTexto label="Folio del contrato" value={documento.folio} onChange={(valor) => setDocumento({ ...documento, folio: valor })} placeholder="Folio interno" />
                    <CampoTexto label="URL privada" value={documento.url} onChange={(valor) => setDocumento({ ...documento, url: valor })} placeholder="Ruta segura del archivo" />
                    <CampoTexto label="Fecha de inicio" value={documento.vigente_desde} onChange={(valor) => setDocumento({ ...documento, vigente_desde: valor })} type="date" />
                    <CampoTexto label="Fecha de vencimiento" value={documento.vigente_hasta} onChange={(valor) => setDocumento({ ...documento, vigente_hasta: valor })} type="date" />
                  </div>
                  <Button disabled={pendiente} onClick={() => ejecutar(() => guardarDocumentoEmpresaAdmin(crearClienteNavegador(), empresa.id, documento).then(() => undefined), "Documento registrado.")}>Registrar documento</Button>
                </div>
              </div>
            )}
            {tab === "riesgo" && (
              <div className="rounded-lg border border-ui-danger/35 bg-ui-danger-soft p-4">
                <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-danger">Suspensión y reactivación</p>
                <p className="mt-1 font-body text-sm text-ui-fg-muted">Acciones críticas para detener o reactivar la operación corporativa. Requieren motivo y confirmación.</p>
                <label className="mt-4 flex flex-col gap-1.5">
                  <span className="font-body text-xs font-semibold text-ui-fg-muted">Motivo obligatorio</span>
                  <textarea value={motivoEstado} onChange={(e) => setMotivoEstado(e.target.value)} className="min-h-24 rounded-lg border border-ui-danger/25 bg-ui-card px-3 py-2 font-body text-sm" placeholder="Describe la razón operativa o de cumplimiento." />
                </label>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="quiet" disabled={pendiente || !motivoEstado.trim()} onClick={() => setAccionRiesgo("suspender")}>Suspender empresa</Button>
                  <Button variant="quiet" disabled={pendiente || !motivoEstado.trim()} onClick={() => setAccionRiesgo("reactivar")}>Reactivar empresa</Button>
                </div>
              </div>
            )}
          </div>
        )}
      />

      <AdminDialog
        open={Boolean(accionRiesgo)}
        title={accionRiesgo === "suspender" ? "Confirmar suspensión" : "Confirmar reactivación"}
        description="Esta acción modifica el estado operativo de la cuenta empresarial y quedará registrada para auditoría."
        onOpenChange={(open) => { if (!pendiente && !open) setAccionRiesgo(null); }}
        footer={
          <>
            <Button variant="quiet" disabled={pendiente} onClick={() => setAccionRiesgo(null)}>Cancelar</Button>
            <Button disabled={pendiente || !motivoEstado.trim()} onClick={ejecutarCambioEstado}>
              {accionRiesgo === "suspender" ? "Confirmar suspensión" : "Confirmar reactivación"}
            </Button>
          </>
        }
      >
        <div className="rounded-lg border border-ui-danger/25 bg-ui-danger-soft p-3 font-body text-sm text-ui-fg-muted">
          <p className="font-semibold text-ui-danger">Motivo registrado</p>
          <p className="mt-1">{motivoEstado || "Sin motivo capturado."}</p>
        </div>
      </AdminDialog>

      {mensaje && <p className="font-body text-sm text-ui-fg-muted">{mensaje}</p>}
    </div>
  );
}
