"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Aviso } from "@ruum/ui";
import { listarEmpresasAdmin, type DatosEmpresasAdmin } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import { AdminPageHeader, AdminPanel } from "../../admin-ui";
import {
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  AdminTabs
} from "../../admin-components";
import {
  DATOS_VACIOS,
  TABS,
  etiqueta,
  moneda,
  prepararPasaporte,
  resumenControl,
  tonoEstadoEmpresa,
  tonoVerificacion,
  type TabPasaporte
} from "./PasaporteEmpresarialHelpers";
import { Dato, Kpi } from "./PasaporteEmpresarialComponentes";
import {
  VistaControl,
  VistaExpediente,
  VistaFlota,
  VistaRutas,
  VistaTraslados
} from "./PasaporteEmpresarialVistas";

export default function PaginaPasaporteEmpresarial() {
  const { id } = useParams<{ id: string }>();
  const [datos, setDatos] = useState<DatosEmpresasAdmin>(DATOS_VACIOS);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizadoEn, setActualizadoEn] = useState<Date | null>(null);
  const [tab, setTab] = useState<TabPasaporte>("control");

  const cargar = useCallback(async () => {
    if (!tieneSupabaseConfigurado()) {
      setCargando(false);
      setError("El Pasaporte Empresarial requiere conexión real a Supabase.");
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const respuesta = await listarEmpresasAdmin(crearClienteNavegador());
      setDatos(respuesta);
      setActualizadoEn(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos cargar el Pasaporte Empresarial.");
      setDatos(DATOS_VACIOS);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const pasaporte = useMemo(() => prepararPasaporte(datos, id), [datos, id]);

  if (cargando) {
    return (
      <main className="space-y-6">
        <AdminPageHeader
          etiqueta="Pasaporte Empresarial"
          titulo="Cargando empresa"
          descripcion="Consolidando empresa, flota, conductores, rutas, traslados y expediente documental."
          breadcrumb={[{ label: "Empresas", href: "/empresas" }, { label: "Pasaporte" }]}
          estadoConexion="actualizando"
          tipoDatos="administrativos"
        />
        <AdminLoadingState label="Cargando Pasaporte Empresarial" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-6">
        <AdminPageHeader
          etiqueta="Pasaporte Empresarial"
          titulo="No disponible"
          descripcion="La vista necesita datos administrativos reales para construir el control empresarial."
          breadcrumb={[{ label: "Empresas", href: "/empresas" }, { label: "Pasaporte" }]}
          estadoConexion="sin_conexion"
          tipoDatos="administrativos"
        />
        <AdminErrorState
          description={error}
          action={<AdminButton onClick={() => void cargar()}>Reintentar</AdminButton>}
        />
      </main>
    );
  }

  if (!pasaporte) {
    return (
      <main className="space-y-6">
        <AdminPageHeader
          etiqueta="Pasaporte Empresarial"
          titulo="Empresa no encontrada"
          descripcion="No encontramos una empresa con ese identificador en la fuente administrativa."
          breadcrumb={[{ label: "Empresas", href: "/empresas" }, { label: "Pasaporte" }]}
          estadoConexion="datos_en_vivo"
          tipoDatos="administrativos"
        />
        <AdminEmptyState
          title="Sin expediente"
          description="Regresa a Empresas para seleccionar una cuenta corporativa vigente."
          action={
            <Link href="/empresas">
              <AdminButton>Ver empresas</AdminButton>
            </Link>
          }
        />
      </main>
    );
  }

  const {
    empresa,
    usuarios,
    vehiculos,
    conductores,
    traslados,
    documentos,
    versionesFiscales,
    versionesCondiciones,
    cambiosSensibles,
    origenes,
    destinos,
    alertas,
    trasladosActivos
  } = pasaporte;
  const titular = usuarios.find((usuario) => usuario.rol === "titular_empresa");
  const creditoUsado = Math.max(
    0,
    Number(empresa.limite_credito_mxn ?? 0) - Number(empresa.credito_disponible_mxn ?? 0)
  );

  return (
    <main className="space-y-6">
      <AdminPageHeader
        etiqueta="Pasaporte Empresarial"
        titulo={empresa.nombre}
        descripcion="Expediente operativo para controlar la relación corporativa: flota, conductores, lugares, traslados, documentos y autorizaciones."
        breadcrumb={[{ label: "Empresas", href: "/empresas" }, { label: empresa.nombre }]}
        estadoConexion="datos_en_vivo"
        ultimaActualizacion={actualizadoEn}
        tipoDatos="administrativos"
        contadorResultados={traslados.length}
        accion={
          <AdminButton onClick={() => void cargar()} variant="secondary">
            Actualizar
          </AdminButton>
        }
        accionesSecundarias={
          <Link href="/empresas">
            <AdminButton variant="quiet">Volver</AdminButton>
          </Link>
        }
      />

      {alertas.length > 0 && (
        <Aviso tono="atencion">
          {alertas.slice(0, 3).join(" ")}
          {alertas.length > 3 ? ` ${alertas.length - 3} alerta(s) adicional(es).` : ""}
        </Aviso>
      )}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Kpi
          etiqueta="Traslados activos"
          valor={trasladosActivos.length}
          detalle={`${traslados.filter((t) => t.tiene_incidencia_abierta).length} con incidencia abierta`}
          tono={trasladosActivos.length > 0 ? "info" : "neutral"}
        />
        <Kpi
          etiqueta="Flota vinculada"
          valor={vehiculos.length}
          detalle={`${vehiculos.filter((v) => v.puede_circular_rodando).length} pueden circular rodando`}
          tono={vehiculos.length ? "success" : "warning"}
        />
        <Kpi
          etiqueta="Conductores"
          valor={conductores.length}
          detalle={`${conductores.filter((c) => c.documentos_vigentes).length} con documentos vigentes`}
          tono={conductores.length ? "success" : "warning"}
        />
        <Kpi
          etiqueta="Crédito usado"
          valor={moneda(creditoUsado)}
          detalle={`Disponible ${moneda(empresa.credito_disponible_mxn)}`}
          tono={creditoUsado > 0 ? "info" : "neutral"}
        />
      </section>

      <AdminPanel>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-ui-fg">Identidad corporativa</h2>
                <p className="mt-1 font-body text-sm text-ui-fg-muted">{empresa.razon_social ?? "Razón social pendiente"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AdminBadge tone={tonoEstadoEmpresa(empresa.estado_operativo)}>
                  {etiqueta(empresa.estado_operativo)}
                </AdminBadge>
                <AdminBadge tone={tonoVerificacion(empresa.estado_verificacion)}>
                  {etiqueta(empresa.estado_verificacion)}
                </AdminBadge>
              </div>
            </div>
            <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
              <Dato etiqueta="RFC" valor={empresa.rfc} mono />
              <Dato etiqueta="Regimen fiscal" valor={empresa.regimen_fiscal} />
              <Dato etiqueta="CP fiscal" valor={empresa.codigo_postal_fiscal} mono />
              <Dato etiqueta="Uso CFDI" valor={empresa.uso_cfdi} />
              <Dato etiqueta="Correo facturacion" valor={empresa.correo_facturacion} />
              <Dato etiqueta="Condiciones de pago" valor={empresa.condiciones_pago} />
              <Dato etiqueta="Dias de credito" valor={`${empresa.dias_credito ?? 0}`} mono />
              <Dato etiqueta="Orden de compra" valor={empresa.requiere_orden_compra ? "Requerida" : "No requerida"} />
              <Dato etiqueta="Titular" valor={titular?.nombre ?? "Sin titular"} />
            </dl>
          </section>
          <section className="border-t border-ui-line pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <h3 className="font-display text-lg font-semibold text-ui-fg">Semaforo de control</h3>
            <ul className="mt-4 space-y-3">
              {resumenControl(pasaporte).map((item) => (
                <li
                  key={item.etiqueta}
                  className="flex items-start justify-between gap-3 border-b border-ui-line pb-3 last:border-b-0"
                >
                  <span className="font-body text-sm font-medium text-ui-fg">{item.etiqueta}</span>
                  <AdminBadge tone={item.tono}>{item.valor}</AdminBadge>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </AdminPanel>

      <AdminPanel>
        <AdminTabs
          items={TABS}
          value={tab}
          onValueChange={setTab}
          label="Secciones del Pasaporte Empresarial"
          renderPanel={() => (
            <div className="pt-5">
              {tab === "control" && (
                <VistaControl
                  empresa={empresa}
                  usuarios={usuarios}
                  alertas={alertas}
                  cambios={cambiosSensibles}
                  versionesCondiciones={versionesCondiciones}
                />
              )}
              {tab === "flota" && <VistaFlota vehiculos={vehiculos} conductores={conductores} />}
              {tab === "rutas" && <VistaRutas origenes={origenes} destinos={destinos} />}
              {tab === "traslados" && <VistaTraslados traslados={traslados} />}
              {tab === "expediente" && (
                <VistaExpediente
                  documentos={documentos}
                  versionesFiscales={versionesFiscales}
                  versionesCondiciones={versionesCondiciones}
                  cambios={cambiosSensibles}
                />
              )}
            </div>
          )}
        />
      </AdminPanel>
    </main>
  );
}
