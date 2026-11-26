"use client";

import { useEffect, useMemo, useState } from "react";
import { Aviso, Button } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import {
  cancelarCargaTrasladosMasivosAdmin,
  crearTrasladosMasivosAdmin,
  listarCargasTrasladosMasivosAdmin,
  listarEmpresasAdmin,
  procesarCargaTrasladosMasivosAdmin,
  type CargaTrasladosMasivosAdmin,
  type DatosEmpresasAdmin,
  type FilaCargaTrasladosMasivosAdmin,
  type ResultadoCargaTrasladosMasivos
} from "@ruum/api/services";
import { crearClienteNavegador, puedeUsarDatosDemo, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { AdminPageHeader, AdminPanel } from "../admin-ui";
import {
  EJEMPLO_CSV,
  enriquecerFila,
  revisarCsv,
  sha256Archivo,
  type FilaPrevalidada
} from "./MasivosCsvParser";
import { progresoCarga, TablaHistorialMasivos } from "./TablaHistorialMasivos";

type Empresa = Database["public"]["Tables"]["empresas"]["Row"];
type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

const DATOS_EMPRESAS_DEMO: DatosEmpresasAdmin = {
  empresas: [],
  usuarios: [],
  traslados: [],
  vehiculos: [],
  conductores: [],
  documentos: [],
  versionesFiscales: [],
  versionesCondiciones: [],
  cambiosSensibles: []
};

const ESTADOS_TERMINALES = new Set<CargaTrasladosMasivosAdmin["estado"]>([
  "procesada",
  "procesada_con_errores",
  "rechazada",
  "cancelada"
]);

export default function PaginaTrasladosMasivosAdmin() {
  const [empresasDatos, setEmpresasDatos] = useState<DatosEmpresasAdmin>(DATOS_EMPRESAS_DEMO);
  const [cargas, setCargas] = useState<CargaTrasladosMasivosAdmin[]>([]);
  const [filas, setFilas] = useState<FilaCargaTrasladosMasivosAdmin[]>([]);
  const [empresaId, setEmpresaId] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [hashArchivo, setHashArchivo] = useState("");
  const [tamanoArchivo, setTamanoArchivo] = useState(0);
  const [mimeArchivo, setMimeArchivo] = useState("text/csv");
  const [filasCsv, setFilasCsv] = useState<FilaPrevalidada[]>([]);
  const [erroresArchivo, setErroresArchivo] = useState<string[]>([]);
  const [aviso, setAviso] = useState<{ tono: "info" | "danger" | "atencion"; texto: string } | null>(null);
  const [resultado, setResultado] = useState<ResultadoCargaTrasladosMasivos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [cargaActivaId, setCargaActivaId] = useState<string | null>(null);
  const [esDemo, setEsDemo] = useState(true);

  async function cargar() {
    if (!tieneSupabaseConfigurado()) {
      setEmpresasDatos(DATOS_EMPRESAS_DEMO);
      setCargas([]);
      setFilas([]);
      setEsDemo(true);
      setCargando(false);
      return;
    }

    try {
      const cliente = crearClienteNavegador();
      const [empresas, masivos] = await Promise.all([
        listarEmpresasAdmin(cliente),
        listarCargasTrasladosMasivosAdmin(cliente)
      ]);
      setEmpresasDatos(empresas);
      setCargas(masivos.cargas);
      setFilas(masivos.filas);
      setEsDemo(false);
    } catch {
      if (puedeUsarDatosDemo()) {
        setEmpresasDatos(DATOS_EMPRESAS_DEMO);
        setCargas([]);
        setFilas([]);
        setEsDemo(true);
      } else {
        setAviso({ tono: "danger", texto: "No se pudieron cargar empresas o cargas masivas." });
        setEsDemo(false);
      }
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  const empresas = empresasDatos.empresas;
  const usuariosEmpresa = useMemo(
    () => empresasDatos.usuarios.filter((usuario) => usuario.empresa_id === empresaId),
    [empresaId, empresasDatos.usuarios]
  );
  const filasConError = filasCsv.filter((fila) => fila.errores.length > 0);
  const filasValidas = filasCsv.filter((fila) => fila.errores.length === 0);
  const cargaActiva = useMemo(() => cargas.find((carga) => carga.id === cargaActivaId) ?? null, [cargaActivaId, cargas]);
  const filasPorCarga = useMemo(() => {
    const mapa = new Map<string, FilaCargaTrasladosMasivosAdmin[]>();
    for (const fila of filas) mapa.set(fila.carga_id, [...(mapa.get(fila.carga_id) ?? []), fila]);
    return mapa;
  }, [filas]);

  async function leerArchivo(archivo: File | null) {
    setResultado(null);
    setAviso(null);
    setHashArchivo("");
    setTamanoArchivo(0);
    setMimeArchivo("text/csv");
    setErroresArchivo([]);
    setCargaActivaId(null);
    if (!archivo) return;
    if (!archivo.name.toLowerCase().endsWith(".csv")) {
      setAviso({ tono: "danger", texto: "El archivo debe ser CSV." });
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      setAviso({ tono: "danger", texto: "El archivo debe pesar máximo 5 MB." });
      return;
    }
    setNombreArchivo(archivo.name);
    setTamanoArchivo(archivo.size);
    setMimeArchivo(archivo.type || "text/csv");
    const contenido = await archivo.text();
    const revision = revisarCsv(contenido);
    setAviso({
      tono: "info",
      texto: `Archivo leído: ${revision.filas.length} filas. Enriqueciendo CP, clasificación y ruta...`
    });
    const filasParseadas = await Promise.all(revision.filas.map((fila, indice) => enriquecerFila(fila, indice + 2)));
    const hash = await sha256Archivo(archivo);
    setHashArchivo(hash);
    setErroresArchivo(revision.errores);
    setFilasCsv(filasParseadas);
    setAviso({
      tono: revision.errores.length > 0 ? "danger" : "info",
      texto: `Archivo leído: ${filasParseadas.length} filas. ${filasParseadas.filter((fila) => fila.errores.length === 0).length} listas para encolar.`
    });
  }

  async function enviar() {
    setAviso(null);
    setResultado(null);
    if (!empresaId) {
      setAviso({ tono: "danger", texto: "Selecciona una empresa." });
      return;
    }
    if (!usuarioId) {
      setAviso({ tono: "danger", texto: "Selecciona el usuario solicitante." });
      return;
    }
    if (filasCsv.length === 0) {
      setAviso({ tono: "danger", texto: "Carga un CSV antes de procesar." });
      return;
    }
    if (erroresArchivo.length > 0) {
      setAviso({ tono: "danger", texto: "Corrige el formato del archivo antes de encolar el lote." });
      return;
    }
    if (filasConError.length > 0) {
      setAviso({ tono: "danger", texto: "Corrige las filas con error antes de enviar el lote." });
      return;
    }
    if (!hashArchivo) {
      setAviso({ tono: "danger", texto: "No se pudo calcular la huella SHA-256 del archivo." });
      return;
    }

    if (esDemo) {
      setAviso({ tono: "atencion", texto: "La carga masiva requiere conexión real a Supabase." });
      return;
    }

    setProcesando(true);
    try {
      const respuesta = await crearTrasladosMasivosAdmin(crearClienteNavegador(), {
        empresaId,
        usuarioId,
        nombreArchivo,
        hashArchivo,
        tamanoBytes: tamanoArchivo,
        mimeType: mimeArchivo,
        filas: filasValidas.map((fila) => fila.datos)
      });
      setResultado(respuesta);
      setCargaActivaId(respuesta.carga_id);
      setAviso({
        tono: "info",
        texto: respuesta.reutilizada
          ? "Archivo ya registrado. Retomando progreso del lote existente."
          : "Carga validada en backend y encolada."
      });
      await cargar();
      await procesarCarga(respuesta.carga_id);
    } catch (error) {
      setAviso({
        tono: "danger",
        texto: error instanceof Error ? error.message : "No se pudo procesar la carga masiva."
      });
    } finally {
      setProcesando(false);
    }
  }

  async function procesarCarga(cargaId: string) {
    setProcesando(true);
    setCargaActivaId(cargaId);
    try {
      let actual: ResultadoCargaTrasladosMasivos | null = null;
      for (let intento = 0; intento < 60; intento += 1) {
        actual = await procesarCargaTrasladosMasivosAdmin(crearClienteNavegador(), cargaId, 50);
        setResultado(actual);
        await cargar();
        if (ESTADOS_TERMINALES.has(actual.estado)) break;
      }
      if (actual) {
        setAviso({
          tono:
            actual.estado === "procesada"
              ? "info"
              : actual.estado === "procesada_con_errores"
                ? "atencion"
                : "danger",
          texto: `Carga ${actual.estado.replaceAll("_", " ")}: ${actual.filas_creadas} creadas, ${actual.filas_error} con error.`
        });
      }
    } catch (error) {
      setAviso({
        tono: "danger",
        texto: error instanceof Error ? error.message : "No se pudo continuar el procesamiento."
      });
    } finally {
      setProcesando(false);
    }
  }

  async function cancelarCarga(cargaId: string) {
    try {
      await cancelarCargaTrasladosMasivosAdmin(
        crearClienteNavegador(),
        cargaId,
        "Cancelada desde panel antes de iniciar procesamiento"
      );
      setAviso({ tono: "info", texto: "Carga cancelada." });
      await cargar();
    } catch (error) {
      setAviso({ tono: "danger", texto: error instanceof Error ? error.message : "No se pudo cancelar la carga." });
    }
  }

  return (
    <main className="admin-page-shell">
      <AdminPageHeader
        etiqueta="Corporativos"
        titulo="Traslados masivos"
        descripcion="Carga CSV para empresas: vehículos, origen, destino y datos operativos. Las tarifas se aplican desde la política normativa vigente."
      />

      {aviso && (
        <div className="mt-4">
          <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <AdminPanel>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Empresa</span>
              <select
                value={empresaId}
                onChange={(event) => {
                  setEmpresaId(event.target.value);
                  setUsuarioId("");
                }}
                className="rounded-lg border border-ui-line-strong bg-ui-card px-3.5 py-2.5 font-body text-sm text-ui-fg focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring"
              >
                <option value="">Seleccionar empresa</option>
                {empresas.map((empresa: Empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5">
              <span className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">
                Usuario solicitante
              </span>
              <select
                value={usuarioId}
                onChange={(event) => setUsuarioId(event.target.value)}
                className="rounded-lg border border-ui-line-strong bg-ui-card px-3.5 py-2.5 font-body text-sm text-ui-fg focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring"
                disabled={!empresaId}
              >
                <option value="">Seleccionar usuario</option>
                {usuariosEmpresa.map((usuario: Usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre ?? usuario.correo_facturacion ?? usuario.id.slice(0, 8).toUpperCase()} ·{" "}
                    {usuario.rol.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-body text-sm font-semibold text-ui-fg">Orden operativa CSV</p>
                <p className="mt-1 font-body text-sm text-ui-fg-muted">
                  Máximo según rol y 5 MB. Captura vehículo, dirección humana, contactos y programación; Ruum completa
                  CP, ruta y clasificación.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/api/plantillas/viajes-masivos"
                  download="plantilla-traslados-masivos-ruum.xlsx"
                  className="rounded-lg border border-ui-brand bg-ui-brand px-3 py-2 font-body text-sm font-semibold text-ui-on-brand transition-colors hover:bg-ui-brand/90"
                >
                  Descargar orden XLSX
                </a>
                <a
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent(EJEMPLO_CSV)}`}
                  download="plantilla-traslados-masivos-ruum.csv"
                  className="rounded-lg border border-ui-line px-3 py-2 font-body text-sm font-semibold text-ui-fg-muted transition-colors hover:border-ui-brand/40 hover:text-ui-brand-soft-fg"
                >
                  Orden CSV
                </a>
              </div>
            </div>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => void leerArchivo(event.target.files?.[0] ?? null)}
              className="rounded-lg border border-dashed border-ui-line-strong bg-ui-card px-3.5 py-4 font-body text-sm text-ui-fg file:mr-4 file:rounded-md file:border-0 file:bg-ui-brand file:px-3 file:py-2 file:font-body file:text-sm file:font-semibold file:text-ui-on-brand"
            />
            {erroresArchivo.length > 0 && (
              <Aviso tono="danger">Formato inválido: {erroresArchivo.slice(0, 4).join(", ")}</Aviso>
            )}
            {hashArchivo && (
              <p className="font-mono-ruum text-xs text-ui-fg-muted">
                SHA-256 {hashArchivo.slice(0, 16)}... · {Math.round(tamanoArchivo / 1024)} KB · {mimeArchivo}
              </p>
            )}
          </div>

          {filasCsv.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full">
                <caption className="sr-only">Prevalidación de filas CSV</caption>
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Referencia</th>
                    <th>Vehículo</th>
                    <th>Ruta</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filasCsv.slice(0, 80).map((fila) => (
                    <tr key={fila.numero}>
                      <td className="font-mono-ruum text-sm">{fila.numero}</td>
                      <td>{fila.datos.referencia_externa || "Sin referencia"}</td>
                      <td>
                        {fila.datos.vehiculo_marca} {fila.datos.vehiculo_modelo}
                      </td>
                      <td>
                        {fila.datos.origen_ciudad || "Origen"} → {fila.datos.destino_ciudad || "Destino"}
                      </td>
                      <td>
                        {fila.errores.length === 0 ? (
                          <span className="rounded-full border border-ui-success/30 bg-ui-success-soft px-2.5 py-1 font-body text-xs font-semibold text-ui-success">
                            {fila.advertencias.length > 0 ? `Lista con ${fila.advertencias.length} alerta(s)` : "Lista"}
                          </span>
                        ) : (
                          <span className="font-body text-xs text-ui-danger">{fila.errores.join(", ")}</span>
                        )}
                        {fila.errores.length === 0 && fila.advertencias.length > 0 && (
                          <p className="mt-1 max-w-md font-body text-xs text-ui-fg-muted">
                            {fila.advertencias.slice(0, 2).join(" · ")}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>

        <AdminPanel>
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Resumen</p>
          <dl className="mt-4 grid gap-3">
            <div className="flex items-center justify-between">
              <dt className="font-body text-sm text-ui-fg-muted">Archivo</dt>
              <dd className="font-body text-sm font-semibold text-ui-fg">{nombreArchivo || "Pendiente"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-body text-sm text-ui-fg-muted">Filas leídas</dt>
              <dd className="font-mono-ruum text-sm text-ui-fg">{filasCsv.length}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-body text-sm text-ui-fg-muted">Listas</dt>
              <dd className="font-mono-ruum text-sm text-ui-success">{filasValidas.length}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-body text-sm text-ui-fg-muted">Con error</dt>
              <dd className="font-mono-ruum text-sm text-ui-danger">{filasConError.length}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-body text-sm text-ui-fg-muted">Hash</dt>
              <dd className="font-mono-ruum text-xs text-ui-fg">{hashArchivo ? `${hashArchivo.slice(0, 10)}...` : "Pendiente"}</dd>
            </div>
          </dl>
          {cargaActiva && (
            <div className="mt-4 rounded-lg border border-ui-line p-3">
              <div className="flex items-center justify-between font-body text-sm">
                <span>{cargaActiva.estado.replaceAll("_", " ")}</span>
                <span className="font-mono-ruum">{progresoCarga(cargaActiva)}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ui-muted">
                <div className="h-full bg-ui-brand" style={{ width: `${progresoCarga(cargaActiva)}%` }} />
              </div>
              <p className="mt-2 font-body text-xs text-ui-fg-muted">
                {cargaActiva.filas_procesadas}/{cargaActiva.total_filas} filas procesadas
              </p>
            </div>
          )}
          <Button
            className="mt-5 w-full"
            onClick={enviar}
            disabled={procesando || cargando || filasCsv.length === 0 || erroresArchivo.length > 0}
          >
            {procesando ? "Procesando..." : "Encolar y procesar"}
          </Button>
          {resultado && (
            <p className="mt-3 font-body text-sm text-ui-fg-muted">
              Lote {resultado.carga_id.slice(0, 8).toUpperCase()} · {resultado.estado.replaceAll("_", " ")} ·{" "}
              {resultado.filas_procesadas}/{resultado.total_filas}
            </p>
          )}
        </AdminPanel>
      </div>

      <TablaHistorialMasivos
        cargas={cargas}
        filasPorCarga={filasPorCarga}
        cargando={cargando}
        procesando={procesando}
        onProcesarCarga={(id) => void procesarCarga(id)}
        onCancelarCarga={(id) => void cancelarCarga(id)}
      />
    </main>
  );
}
