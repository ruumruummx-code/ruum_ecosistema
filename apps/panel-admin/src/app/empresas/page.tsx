"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Aviso } from "@ruum/ui";
import {
  crearEmpresaCorporativaAdmin,
  listarEmpresasAdmin,
  tienePermisoAdmin,
  type DatosEmpresasAdmin
} from "@ruum/api/services";
import type { Database } from "@ruum/shared/types";
import { crearClienteNavegador, puedeUsarDatosDemo, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { AdminPageHeader } from "../admin-ui";
import { AdminButton, AdminEmptyState, AdminErrorState, AdminLoadingState } from "../admin-components";
import {
  type EstadoConexionVista,
  DATOS_DEMO,
  FORM_INICIAL,
  RFC_MEXICO,
  CORREO_BASICO,
  Badge,
  moneda,
  textoEstadoOperativo,
  agruparPor
} from "./EmpresasTipos";
import { AccionesEmpresa } from "./AccionesEmpresa";
import { AltaEmpresaForm } from "./AltaEmpresaForm";

export default function PaginaEmpresasAdmin() {
  const [datos, setDatos] = useState<DatosEmpresasAdmin>(DATOS_DEMO);
  const [esDemo, setEsDemo] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [actualizandoManual, setActualizandoManual] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [empresaAbiertaId, setEmpresaAbiertaId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState(FORM_INICIAL);
  const [mensaje, setMensaje] = useState<{ tono: "info" | "danger" | "atencion"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [puedeGestionarEmpresas, setPuedeGestionarEmpresas] = useState(false);
  const [estadoConexion, setEstadoConexion] = useState<EstadoConexionVista>("actualizando");
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);

  async function cargar(manual = false) {
    if (manual) setActualizandoManual(true);
    else setCargando(true);

    if (!tieneSupabaseConfigurado()) {
      setDatos(DATOS_DEMO);
      setEsDemo(true);
      setPuedeGestionarEmpresas(false);
      setErrorCarga(null);
      setEstadoConexion("demo");
      setUltimaActualizacion(new Date());
      setCargando(false);
      setActualizandoManual(false);
      return;
    }

    try {
      setErrorCarga(null);
      const cliente = crearClienteNavegador();
      const [datosEmpresas, puedeGestionar] = await Promise.all([
        listarEmpresasAdmin(cliente),
        tienePermisoAdmin(cliente, "empresas:gestionar")
      ]);
      setDatos(datosEmpresas);
      setPuedeGestionarEmpresas(puedeGestionar);
      setEsDemo(false);
      setEstadoConexion("datos_en_vivo");
      setUltimaActualizacion(new Date());
    } catch {
      if (puedeUsarDatosDemo()) {
        setDatos(DATOS_DEMO);
        setEsDemo(true);
        setPuedeGestionarEmpresas(false);
        setErrorCarga(null);
        setEstadoConexion("demo");
        setUltimaActualizacion(new Date());
      } else {
        setDatos(DATOS_DEMO);
        setEsDemo(false);
        setPuedeGestionarEmpresas(false);
        setErrorCarga("No pudimos cargar las empresas corporativas.");
        setEstadoConexion("sin_conexion");
      }
    } finally {
      setCargando(false);
      setActualizandoManual(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  const usuariosPorEmpresa = useMemo(() => agruparPor(datos.usuarios), [datos.usuarios]);
  const vehiculosPorEmpresa = useMemo(() => agruparPor(datos.vehiculos), [datos.vehiculos]);
  const conductoresPorEmpresa = useMemo(() => agruparPor(datos.conductores), [datos.conductores]);
  const documentosPorEmpresa = useMemo(() => agruparPor(datos.documentos), [datos.documentos]);
  const fiscalPorEmpresa = useMemo(() => agruparPor(datos.versionesFiscales), [datos.versionesFiscales]);
  const condicionesPorEmpresa = useMemo(() => agruparPor(datos.versionesCondiciones), [datos.versionesCondiciones]);
  const cambiosPorEmpresa = useMemo(() => agruparPor(datos.cambiosSensibles), [datos.cambiosSensibles]);

  const TrasladosPorEmpresa = useMemo(() => {
    const empresaPorUsuario = new Map(datos.usuarios.filter((usuario) => usuario.empresa_id).map((usuario) => [usuario.id, usuario.empresa_id as string]));
    const mapa = new Map<string, Database["public"]["Tables"]["traslados"]["Row"][]>();
    for (const traslado of datos.traslados) {
      const empresaId = empresaPorUsuario.get(traslado.usuario_id);
      if (!empresaId) continue;
      mapa.set(empresaId, [...(mapa.get(empresaId) ?? []), traslado]);
    }
    return mapa;
  }, [datos.traslados, datos.usuarios]);

  const rfcDuplicado = useMemo(() => {
    const rfc = formulario.rfc.trim().toUpperCase();
    return Boolean(rfc && datos.empresas.some((empresa) => empresa.rfc?.toUpperCase() === rfc));
  }, [datos.empresas, formulario.rfc]);
  const formularioIncompleto = !formulario.nombre.trim() || !formulario.rfc.trim() || !formulario.titular_nombre.trim() || !formulario.titular_correo.trim();

  function actualizarCampo(campo: keyof typeof FORM_INICIAL, valor: string | boolean) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function crearEmpresa() {
    setMensaje(null);
    const rfc = formulario.rfc.trim().toUpperCase();
    const nombre = formulario.nombre.trim();
    const titularNombre = formulario.titular_nombre.trim();
    const titularCorreo = formulario.titular_correo.trim().toLowerCase();
    const correoFacturacion = (formulario.correo_facturacion || titularCorreo).trim().toLowerCase();
    const limiteCredito = Number(formulario.limite_credito_mxn || 0);
    const creditoDisponible = Number(formulario.credito_disponible_mxn || formulario.limite_credito_mxn || 0);
    const diasCredito = Number(formulario.dias_credito || 0);
    if (!nombre) {
      setMensaje({ tono: "danger", texto: "Captura el nombre comercial de la empresa." });
      return;
    }
    if (!RFC_MEXICO.test(rfc)) {
      setMensaje({ tono: "danger", texto: "Captura un RFC mexicano formalmente válido." });
      return;
    }
    if (!titularNombre) {
      setMensaje({ tono: "danger", texto: "Captura el nombre del titular." });
      return;
    }
    if (!CORREO_BASICO.test(titularCorreo)) {
      setMensaje({ tono: "danger", texto: "Captura un correo válido para el titular." });
      return;
    }
    if (correoFacturacion && !CORREO_BASICO.test(correoFacturacion)) {
      setMensaje({ tono: "danger", texto: "Captura un correo de facturación válido." });
      return;
    }
    if (![limiteCredito, creditoDisponible, diasCredito].every((valor) => Number.isFinite(valor) && valor >= 0)) {
      setMensaje({ tono: "danger", texto: "Crédito y días de pago deben ser números mayores o iguales a cero." });
      return;
    }
    if (rfcDuplicado) {
      setMensaje({ tono: "danger", texto: "Ya existe una empresa con ese RFC." });
      return;
    }
    if (esDemo) {
      setMensaje({ tono: "atencion", texto: "El alta de empresas requiere conexión real a Supabase." });
      return;
    }
    if (!puedeGestionarEmpresas) {
      setMensaje({ tono: "danger", texto: "Tu rol puede consultar empresas, pero no tiene permiso para crear empresas corporativas." });
      return;
    }

    setGuardando(true);
    try {
      await crearEmpresaCorporativaAdmin(crearClienteNavegador(), {
        empresa: {
          nombre,
          rfc,
          razon_social: formulario.razon_social.trim(),
          regimen_fiscal: formulario.regimen_fiscal.trim(),
          codigo_postal_fiscal: formulario.codigo_postal_fiscal.trim(),
          uso_cfdi: formulario.uso_cfdi.trim(),
          correo_facturacion: correoFacturacion,
          condiciones_pago: formulario.condiciones_pago.trim(),
          estado_verificacion: "en_revision",
          limite_credito_mxn: limiteCredito,
          credito_disponible_mxn: creditoDisponible,
          dias_credito: diasCredito,
          requiere_orden_compra: formulario.requiere_orden_compra
        },
        titular: {
          nombre: titularNombre,
          telefono: formulario.titular_telefono.trim(),
          correo_facturacion: titularCorreo,
          estado_verificacion: "verificado",
          metodo_pago_registrado: formulario.metodo_pago_registrado
        }
      });
      setFormulario(FORM_INICIAL);
      setMostrarFormulario(false);
      setMensaje({ tono: "info", texto: "Empresa corporativa creada con fiscal, titular, crédito y condiciones versionadas." });
      await cargar();
    } catch (error) {
      setMensaje({ tono: "danger", texto: error instanceof Error ? error.message : "No se pudo crear la empresa." });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="admin-page-shell">
      <AdminPageHeader
        etiqueta="Gestión"
        titulo="Empresas"
        descripcion="Operación corporativa con RFC único, titulares, permisos, flota, conductores, condiciones comerciales, documentos, crédito y aprobaciones."
        estadoConexion={estadoConexion}
        ultimaActualizacion={ultimaActualizacion}
        tipoDatos="administrativos"
        contadorResultados={datos.empresas.length}
        accion={(
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="secondary" loading={actualizandoManual} onClick={() => void cargar(true)}>
              Actualizar
            </AdminButton>
            <AdminButton
              variant={mostrarFormulario ? "secondary" : undefined}
              disabled={!puedeGestionarEmpresas}
              onClick={() => setMostrarFormulario((actual) => !actual)}
            >
              {mostrarFormulario ? "Cerrar alta" : "Crear empresa"}
            </AdminButton>
          </div>
        )}
      />

      {mensaje && <div className="mt-4"><Aviso tono={mensaje.tono}>{mensaje.texto}</Aviso></div>}
      {esDemo && <div className="mt-4"><Aviso tono="info">Estás viendo el módulo sin datos reales de Supabase. No se muestran fixtures demo.</Aviso></div>}
      {!esDemo && !cargando && !puedeGestionarEmpresas && (
        <div className="mt-4">
          <Aviso tono="atencion">Tu rol puede consultar empresas, pero el alta requiere permiso empresas:gestionar.</Aviso>
        </div>
      )}
      {errorCarga && <div className="mt-4"><AdminErrorState description={errorCarga} action={<AdminButton variant="secondary" onClick={() => void cargar(true)}>Reintentar</AdminButton>} /></div>}

      {mostrarFormulario && (
        <AltaEmpresaForm
          formulario={formulario}
          guardando={guardando}
          rfcDuplicado={rfcDuplicado}
          formularioIncompleto={formularioIncompleto}
          esDemo={esDemo}
          puedeGestionarEmpresas={puedeGestionarEmpresas}
          onActualizarCampo={actualizarCampo}
          onLimpiar={() => setFormulario(FORM_INICIAL)}
          onCerrar={() => setMostrarFormulario(false)}
          onSubmit={crearEmpresa}
        />
      )}

      {cargando ? (
        <div className="mt-6"><AdminLoadingState label="Cargando empresas" /></div>
      ) : (
        <section className="mt-6">
          {datos.empresas.length === 0 ? (
            <AdminEmptyState title="Sin empresas" description="No hay empresas registradas en la fuente real." action={<AdminButton onClick={() => setMostrarFormulario(true)}>Crear empresa</AdminButton>} />
          ) : (
            <div className="admin-table-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] font-body text-sm">
                  <caption className="sr-only">Lista de empresas registradas</caption>
                  <thead>
                    <tr className="border-b border-ui-line text-left text-xs uppercase tracking-wide text-ui-fg-muted">
                      <th className="left-0 z-10 bg-ui-card px-4 py-3 sm:sticky">Empresa</th>
                      <th className="px-4 py-3">RFC</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Titular</th>
                      <th className="px-4 py-3 text-center">Usuarios</th>
                      <th className="px-4 py-3 text-center">Flota</th>
                      <th className="px-4 py-3 text-center">Conductores</th>
                      <th className="px-4 py-3 text-right">Traslados</th>
                      <th className="px-4 py-3 text-right">Crédito</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.empresas.map((empresa, indice) => {
                      const usuarios = usuariosPorEmpresa.get(empresa.id) ?? [];
                      const vehiculos = vehiculosPorEmpresa.get(empresa.id) ?? [];
                      const conductores = conductoresPorEmpresa.get(empresa.id) ?? [];
                      const documentos = documentosPorEmpresa.get(empresa.id) ?? [];
                      const Traslados = TrasladosPorEmpresa.get(empresa.id) ?? [];
                      const versionesFiscales = fiscalPorEmpresa.get(empresa.id) ?? [];
                      const versionesCondiciones = condicionesPorEmpresa.get(empresa.id) ?? [];
                      const cambios = cambiosPorEmpresa.get(empresa.id) ?? [];
                      const cambiosPendientes = cambios.filter((cambio) => cambio.estado === "pendiente");
                      const titular = usuarios.find((usuario) => usuario.rol === "titular_empresa");
                      const abierta = empresaAbiertaId === empresa.id;
                      const fondoFila = indice % 2 === 1 ? "bg-ui-muted" : "bg-ui-card";
                      const fondoSticky = indice % 2 === 1 ? "bg-ui-muted" : "bg-ui-card";
                      return (
                        <Fragment key={empresa.id}>
                          <tr className={`border-b border-ui-line ${fondoFila}`}>
                            <td data-label="Empresa" className={`left-0 z-[1] px-4 py-4 sm:sticky ${fondoSticky}`}>
                              <button
                                type="button"
                                onClick={() => setEmpresaAbiertaId((actual) => actual === empresa.id ? null : empresa.id)}
                                className="text-left font-semibold text-ui-fg hover:text-ui-brand hover:underline"
                              >
                                {empresa.nombre}
                              </button>
                              <p className="mt-1 max-w-[280px] truncate text-xs text-ui-fg-muted" title={empresa.razon_social ?? empresa.nombre}>{empresa.razon_social ?? "Sin razón social"}</p>
                            </td>
                            <td data-label="RFC" className="px-4 py-4 font-mono-ruum text-xs text-ui-fg-muted">{empresa.rfc ?? "Pendiente"}</td>
                            <td data-label="Estado" className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                <Badge estado={empresa.estado_operativo} texto={textoEstadoOperativo(empresa.estado_operativo)} />
                                {cambiosPendientes.length > 0 ? (
                                  <Badge estado="pendiente" texto="Cambios pendientes" />
                                ) : (
                                  <Badge estado={empresa.estado_verificacion} />
                                )}
                              </div>
                            </td>
                            <td data-label="Titular" className="px-4 py-4">
                              <p className="font-medium text-ui-fg">{titular?.nombre ?? "No registrado"}</p>
                              <p className="mt-1 max-w-[220px] truncate text-xs text-ui-fg-muted" title={titular?.correo_facturacion ?? undefined}>{titular?.correo_facturacion ?? "Sin correo"}</p>
                            </td>
                            <td data-label="Usuarios" className="px-4 py-4 text-center font-mono-ruum">{usuarios.length}</td>
                            <td data-label="Flota" className="px-4 py-4 text-center font-mono-ruum">{vehiculos.length}</td>
                            <td data-label="Conductores" className="px-4 py-4 text-center font-mono-ruum">{conductores.length}</td>
                            <td data-label="Traslados" className="px-4 py-4 text-right font-mono-ruum">{Traslados.length}</td>
                            <td data-label="Crédito" className="px-4 py-4 text-right">
                              <p className="font-mono-ruum font-semibold">{moneda(empresa.limite_credito_mxn)}</p>
                              <p className="mt-1 text-xs text-ui-fg-muted">{empresa.dias_credito ?? 0} días</p>
                            </td>
                            <td data-label="Acciones" className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <Link
                                  href={`/empresas/${empresa.id}`}
                                  className="inline-flex min-h-8 items-center rounded-md border border-ui-focus/35 bg-ui-brand-soft px-3 py-1.5 font-body text-xs font-semibold text-ui-brand-soft-fg hover:bg-ui-brand hover:text-ui-on-brand"
                                >
                                  Pasaporte
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => setEmpresaAbiertaId((actual) => actual === empresa.id ? null : empresa.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-ui-line-strong px-3 py-1.5 font-body text-xs font-semibold text-ui-fg hover:bg-ui-muted"
                                  aria-expanded={abierta}
                                  aria-controls={`detalle-empresa-${empresa.id}`}
                                >
                                  <span aria-hidden="true">✎</span> {abierta ? "Ocultar" : "Gestionar"}
                                </button>
                                <button type="button" className="rounded-md border border-ui-line-strong px-2.5 py-1.5 font-body text-xs font-semibold text-ui-fg-muted opacity-60" aria-label={`Acciones rápidas para ${empresa.nombre}`}>...</button>
                              </div>
                            </td>
                          </tr>
                          {abierta && (
                            <tr className="border-b border-ui-line bg-ui-card">
                              <td colSpan={10} className="px-4 py-5">
                                <div id={`detalle-empresa-${empresa.id}`} className="rounded-lg border border-ui-line bg-ui-card p-5">
                                  {cambiosPendientes.length > 0 && (
                                    <div className="mb-4 rounded-lg border border-ui-warning/35 bg-ui-warning-soft px-4 py-3">
                                      <p className="font-body text-sm font-semibold text-ui-warning">Cambios pendientes de aprobación</p>
                                      <p className="mt-1 font-body text-sm text-ui-fg-muted">Estado operativo principal: {textoEstadoOperativo(empresa.estado_operativo)}. Los cambios fiscales se revisan en la pestaña Fiscal y facturación.</p>
                                    </div>
                                  )}
                                  <AccionesEmpresa
                                    empresa={empresa}
                                    usuarios={usuarios}
                                    vehiculos={vehiculos}
                                    conductores={conductores}
                                    documentos={documentos}
                                    Traslados={Traslados}
                                    versionesFiscales={versionesFiscales}
                                    versionesCondiciones={versionesCondiciones}
                                    cambiosPendientes={cambiosPendientes}
                                    onActualizado={() => void cargar(true)}
                                  />
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
