"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Aviso } from "@ruum/ui";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import {
  listarVehiculosAdminPaginados,
  obtenerEvidenciaVehiculo,
  actualizarVehiculoAdmin,
  resolverUrlEvidencia,
  type DatosVehiculosAdmin,
  type EvidenciaVehiculoTraslado,
  type VehiculoActualizarAdmin
} from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { AdminPageHeader, AdminPanel } from "../admin-ui";
import { AdminButton, AdminEmptyState, AdminErrorState, AdminLoadingState } from "../admin-components";
import {
  ETIQUETA_CATEGORIA,
  ETIQUETA_CONDICION,
  ETIQUETA_GAMA,
  estadoDocumental,
  fechaCorta,
  type Vehiculo
} from "./VehiculosTipos";
import { ModalDetalleVehiculo } from "./ModalDetalleVehiculo";
import { ModalEditarVehiculo } from "./ModalEditarVehiculo";

type EstadoConexionVista = "datos_en_vivo" | "actualizando" | "sin_conexion" | "desactualizado";
const TAMANO_PAGINA = 25;

export default function PaginaVehiculosAdmin() {
  const [datos, setDatos] = useState<DatosVehiculosAdmin>({ vehiculos: [], usuarios: [] });
  const [cargando, setCargando] = useState(true);
  const [actualizandoManual, setActualizandoManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busquedaInput, setBusquedaInput] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalResultados, setTotalResultados] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [estadoConexion, setEstadoConexion] = useState<EstadoConexionVista>("actualizando");
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);

  const [detalleVehiculoId, setDetalleVehiculoId] = useState<string | null>(null);
  const [evidencia, setEvidencia] = useState<EvidenciaVehiculoTraslado[]>([]);
  const [cargandoEvidencia, setCargandoEvidencia] = useState(false);
  const [urlsFirmadas, setUrlsFirmadas] = useState<Map<string, string>>(new Map());
  const [errorEvidencia, setErrorEvidencia] = useState<string | null>(null);

  const [editando, setEditando] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<VehiculoActualizarAdmin>({});
  const [versionEditando, setVersionEditando] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);
  const [avisoGuardado, setAvisoGuardado] = useState<string | null>(null);

  const cargar = useCallback(
    async (manual = false, paginaSolicitada = pagina) => {
      if (manual) setActualizandoManual(true);
      else setCargando(true);

      if (!tieneSupabaseConfigurado()) {
        setDatos({ vehiculos: [], usuarios: [] });
        setError("Supabase no configurado.");
        setEstadoConexion("sin_conexion");
        setUltimaActualizacion(new Date());
        setCargando(false);
        setActualizandoManual(false);
        return;
      }

      try {
        setError(null);
        const respuesta = await listarVehiculosAdminPaginados(
          crearClienteNavegador(),
          paginaSolicitada,
          TAMANO_PAGINA,
          busqueda
        );
        setDatos({ vehiculos: respuesta.vehiculos, usuarios: respuesta.usuarios });
        setPagina(respuesta.paginacion.pagina);
        setTotalResultados(respuesta.paginacion.total);
        setTotalPaginas(respuesta.paginacion.total_paginas);
        setEstadoConexion("datos_en_vivo");
        setUltimaActualizacion(new Date());
      } catch {
        setError("No pudimos cargar el inventario de vehículos.");
        setEstadoConexion((estadoAnterior) =>
          estadoAnterior === "datos_en_vivo" ? "desactualizado" : "sin_conexion"
        );
      } finally {
        setCargando(false);
        setActualizandoManual(false);
      }
    },
    [busqueda, pagina]
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPagina(1);
      setBusqueda(busquedaInput.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [busquedaInput]);

  const usuarioPorId = useMemo(
    () => new Map(datos.usuarios.map((usuario) => [usuario.id, usuario])),
    [datos.usuarios]
  );
  const vehiculosFiltrados = datos.vehiculos;

  async function abrirDetalle(vehiculoId: string) {
    setDetalleVehiculoId(vehiculoId);
    setCargandoEvidencia(true);
    setErrorEvidencia(null);
    setUrlsFirmadas(new Map());
    try {
      const cliente = crearClienteNavegador();
      const evidenciaData = await obtenerEvidenciaVehiculo(cliente, vehiculoId);
      setEvidencia(evidenciaData);

      const urls = new Map<string, string>();
      for (const traslado of evidenciaData) {
        for (const foto of traslado.fotos) {
          if (foto.url) {
            const firmada = await resolverUrlEvidencia(cliente, foto.url);
            if (firmada) urls.set(foto.id, firmada);
          }
        }
      }
      setUrlsFirmadas(urls);
    } catch {
      setErrorEvidencia("No se pudo cargar la evidencia del vehículo.");
    } finally {
      setCargandoEvidencia(false);
    }
  }

  function cerrarDetalle() {
    setDetalleVehiculoId(null);
    setEvidencia([]);
    setEditando(null);
    setErrorEdicion(null);
    setAvisoGuardado(null);
  }

  function iniciarEdicion(vehiculo: Vehiculo) {
    setEditando(vehiculo.id);
    setVersionEditando((vehiculo as Vehiculo & { version?: number }).version ?? 0);
    setEditForm({
      tipo: vehiculo.tipo,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      color: vehiculo.color ?? undefined,
      placas: vehiculo.placas ?? undefined,
      vin: vehiculo.vin ?? undefined,
      transmision: vehiculo.transmision ?? undefined,
      tiene_tarjeta_circulacion: vehiculo.tiene_tarjeta_circulacion,
      tiene_verificacion: vehiculo.tiene_verificacion,
      tiene_placas: vehiculo.tiene_placas,
      puede_circular_rodando: vehiculo.puede_circular_rodando,
      permiso_especial_vigente: vehiculo.permiso_especial_vigente ?? undefined,
      estado_general_declarado: vehiculo.estado_general_declarado ?? undefined,
      categoria_tarifa: vehiculo.categoria_tarifa ?? undefined,
      gama: vehiculo.gama ?? undefined,
      condicion: vehiculo.condicion ?? undefined
    });
    setErrorEdicion(null);
    setAvisoGuardado(null);
  }

  async function guardarEdicion() {
    if (!editando) return;
    setGuardando(true);
    setErrorEdicion(null);
    setAvisoGuardado(null);
    try {
      const datosLimpios: VehiculoActualizarAdmin = {};
      for (const [key, value] of Object.entries(editForm)) {
        if (value !== undefined) {
          (datosLimpios as Record<string, unknown>)[key] = value;
        }
      }
      const cliente = crearClienteNavegador();
      await actualizarVehiculoAdmin(cliente, editando, datosLimpios, versionEditando);
      setAvisoGuardado("Vehículo actualizado correctamente.");
      setEditando(null);
      void cargar(true, pagina);
    } catch (err) {
      setErrorEdicion(err instanceof Error ? err.message : "Error al guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  }

  const vehiculoDetalle = useMemo(
    () => vehiculosFiltrados.find((v) => v.id === detalleVehiculoId) ?? null,
    [detalleVehiculoId, vehiculosFiltrados]
  );
  const vehiculoEdicion = datos.vehiculos.find((v) => v.id === editando) ?? null;
  const exportHref = `/api/exportaciones/vehiculos${busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : ""}`;

  return (
    <main className="admin-page-shell">
      <AdminPageHeader
        etiqueta="Gestión"
        titulo="Vehículos"
        descripcion="Registro operativo de vehículos asociados a usuarios, documentación mínima, placas y clasificación tarifaria."
        estadoConexion={estadoConexion}
        ultimaActualizacion={ultimaActualizacion}
        tipoDatos="administrativos"
        contadorResultados={totalResultados}
        accion={
          <div className="flex flex-wrap gap-2">
            <a
              className="inline-flex items-center rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-semibold text-ui-fg transition hover:bg-ui-muted"
              href={exportHref}
            >
              Exportar CSV
            </a>
            <AdminButton variant="secondary" loading={actualizandoManual} onClick={() => void cargar(true, pagina)}>
              Actualizar
            </AdminButton>
          </div>
        }
      />

      {avisoGuardado && <Aviso tono="info">{avisoGuardado}</Aviso>}
      {error && (
        <div className="mt-4">
          <AdminErrorState
            description={error}
            action={
              <AdminButton variant="secondary" onClick={() => void cargar(true)}>
                Reintentar
              </AdminButton>
            }
          />
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <label className="sr-only" htmlFor="buscar-vehiculos">
          Buscar vehículos
        </label>
        <input
          id="buscar-vehiculos"
          type="search"
          value={busquedaInput}
          onChange={(event) => setBusquedaInput(event.target.value)}
          placeholder="Buscar por marca, modelo, placas, VIN o usuario..."
          className="flex-1 rounded-lg border border-ui-line-strong bg-ui-card px-3.5 py-2.5 font-body text-sm text-ui-fg placeholder:text-ui-fg-muted focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring"
        />
        {(busquedaInput || busqueda) && (
          <AdminButton
            variant="quiet"
            onClick={() => {
              setBusquedaInput("");
              setBusqueda("");
              setPagina(1);
            }}
            aria-label="Limpiar búsqueda"
          >
            Limpiar
          </AdminButton>
        )}
      </div>

      {cargando ? (
        <div className="mt-4">
          <AdminLoadingState label="Cargando vehículos" />
        </div>
      ) : vehiculosFiltrados.length === 0 ? (
        <div className="mt-4">
          <AdminEmptyState
            title={busqueda.trim() ? "Sin resultados" : "Sin vehículos"}
            description={
              busqueda.trim()
                ? "No encontramos vehículos con esa búsqueda."
                : "No hay vehículos registrados."
            }
            action={
              busqueda.trim() ? (
                <AdminButton
                  variant="secondary"
                  onClick={() => {
                    setBusquedaInput("");
                    setBusqueda("");
                    setPagina(1);
                  }}
                >
                  Limpiar búsqueda
                </AdminButton>
              ) : undefined
            }
          />
        </div>
      ) : (
        <AdminPanel className="admin-table-card mt-4">
          <table>
            <caption className="sr-only">Lista de vehículos registrados</caption>
            <thead>
              <tr>
                <th>Vehículo</th>
                <th>Usuario</th>
                <th>Placas / VIN</th>
                <th>Documentación</th>
                <th>Tarifa</th>
                <th>Alta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehiculosFiltrados.map((vehiculo) => {
                const usuario = usuarioPorId.get(vehiculo.usuario_id);
                const documental = estadoDocumental(vehiculo);
                return (
                  <tr key={vehiculo.id}>
                    <td data-label="Vehículo">
                      <p className="font-body font-semibold text-ui-fg">
                        {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}
                      </p>
                      <p className="mt-1 text-xs text-ui-fg-muted">
                        {ETIQUETA_TIPO_VEHICULO[vehiculo.tipo]}
                        {vehiculo.color ? ` · ${vehiculo.color}` : ""}
                      </p>
                    </td>
                    <td data-label="Usuario">
                      <p className="font-body text-sm text-ui-fg">
                        {usuario?.nombre ?? usuario?.razon_social ?? "Usuario sin nombre"}
                      </p>
                      <p className="mt-1 font-mono-ruum text-sm text-ui-fg-muted">
                        {usuario?.correo_facturacion ?? vehiculo.usuario_id.slice(0, 8).toUpperCase()}
                      </p>
                    </td>
                    <td data-label="Placas / VIN">
                      <p className="font-mono-ruum text-xs text-ui-fg">{vehiculo.placas ?? "Sin placas"}</p>
                      <p className="mt-1 font-mono-ruum text-sm text-ui-fg-muted">{vehiculo.vin ?? "VIN pendiente"}</p>
                    </td>
                    <td data-label="Documentación">
                      <span className={`rounded-full border px-2.5 py-1 font-body text-xs font-semibold ${documental.clase}`}>
                        {documental.texto}
                      </span>
                    </td>
                    <td data-label="Tarifa">
                      <p className="font-body text-sm text-ui-fg">
                        {vehiculo.categoria_tarifa ? ETIQUETA_CATEGORIA[vehiculo.categoria_tarifa] : "Sin categoría"}
                      </p>
                      <p className="mt-1 text-xs text-ui-fg-muted">
                        {[
                          vehiculo.gama ? ETIQUETA_GAMA[vehiculo.gama] : null,
                          vehiculo.condicion ? ETIQUETA_CONDICION[vehiculo.condicion] : null
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Pendiente"}
                      </p>
                    </td>
                    <td className="font-body text-sm text-ui-fg-muted" data-label="Alta">
                      {fechaCorta(vehiculo.creado_en)}
                    </td>
                    <td data-label="Acciones">
                      <div className="flex gap-2">
                        <AdminButton variant="quiet" onClick={() => void abrirDetalle(vehiculo.id)}>
                          Evidencia
                        </AdminButton>
                        <AdminButton variant="quiet" onClick={() => iniciarEdicion(vehiculo)}>
                          Editar
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ui-line px-4 py-3">
            <p className="font-body text-sm text-ui-fg-muted">
              Página {totalPaginas === 0 ? 0 : pagina} de {totalPaginas} · {totalResultados} vehículos
            </p>
            <div className="flex gap-2">
              <AdminButton
                variant="secondary"
                disabled={pagina <= 1 || actualizandoManual}
                onClick={() => {
                  const anterior = Math.max(1, pagina - 1);
                  setPagina(anterior);
                }}
              >
                Anterior
              </AdminButton>
              <AdminButton
                variant="secondary"
                disabled={pagina >= totalPaginas || actualizandoManual}
                onClick={() => {
                  const siguiente = Math.min(totalPaginas, pagina + 1);
                  setPagina(siguiente);
                }}
              >
                Siguiente
              </AdminButton>
            </div>
          </div>
        </AdminPanel>
      )}

      {detalleVehiculoId && vehiculoDetalle && (
        <ModalDetalleVehiculo
          vehiculo={vehiculoDetalle}
          evidencia={evidencia}
          cargandoEvidencia={cargandoEvidencia}
          errorEvidencia={errorEvidencia}
          urlsFirmadas={urlsFirmadas}
          onCerrar={cerrarDetalle}
        />
      )}

      {editando && vehiculoEdicion && (
        <ModalEditarVehiculo
          vehiculo={vehiculoEdicion}
          editForm={editForm}
          setEditForm={setEditForm}
          versionEditando={versionEditando}
          guardando={guardando}
          errorEdicion={errorEdicion}
          avisoGuardado={avisoGuardado}
          onCancelar={() => {
            setEditando(null);
            setErrorEdicion(null);
          }}
          onGuardar={() => void guardarEdicion()}
        />
      )}
    </main>
  );
}
