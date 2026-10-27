"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { validarFila, parsearArchivoPlantilla, type FilaValidada } from "@/lib/carga-masiva";
import { logStructuredWarn } from "@/lib/logger";
import { obtenerHeadersCsrfAsync, obtenerTokenCsrfCliente } from "@/lib/csrf";

export const STORAGE_KEY_CARGA_ACTIVA = "ruum_carga_masiva_activa_id";

/**
 * Realiza fetch con reintentos automáticos y backoff exponencial ante errores de red,
 * límites de tasa (429) o fallas transitorias de servidor (502, 503, 504).
 */
export async function fetchConReintento(
  url: string,
  options: RequestInit = {},
  maxIntentos = 3,
  demoraBaseMs = 1000
): Promise<Response> {
  let ultimoError: unknown = null;
  for (let intento = 0; intento < maxIntentos; intento++) {
    try {
      const res = await fetch(url, options);
      if ((res.status === 429 || (res.status >= 500 && res.status <= 504)) && intento < maxIntentos - 1) {
        const factor = Math.pow(2, intento);
        await new Promise((resolve) => setTimeout(resolve, demoraBaseMs * factor));
        continue;
      }
      return res;
    } catch (err) {
      ultimoError = err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw err;
      }
      if (intento < maxIntentos - 1) {
        const factor = Math.pow(2, intento);
        await new Promise((resolve) => setTimeout(resolve, demoraBaseMs * factor));
      }
    }
  }
  if (ultimoError instanceof Error) throw ultimoError;
  throw new Error("No se pudo completar la solicitud tras varios reintentos.");
}

// ── Tipos públicos ──────────────────────────────────────────────────────────

export type EstadoCarga =
  | "idle"
  | "parseando"
  | "validando"
  | "resultados"
  | "geocodificando"
  | "cotizando"
  | "checkout"
  | "pagado";

export type EstadoFilaGranular = "pendiente" | "geocodificando" | "cotizado" | "error";

export interface FilaMasiva extends FilaValidada {
  tarifa?: number | null;
  distanciaKm?: number | null;
  eliminada?: boolean;
  validando?: boolean;
  estadoGranular?: EstadoFilaGranular;
}
interface State {
  estado: EstadoCarga; filas: FilaMasiva[]; totalMXN: number; error: string | null;
  progreso: number; stripeClientSecret: string | null; cargaId: string | null; pagoConfirmado: boolean;
}
type Action =
  | { type: "PARSEANDO" | "RESET" | "GEOCODIFICANDO" | "COTIZANDO" | "PAGO_OK" }
  | { type: "VALIDACION_OK"; filas: FilaMasiva[] }
  | { type: "FILA_VALIDADA"; fila: FilaMasiva }
  | { type: "ERROR"; mensaje: string }
  | { type: "CORREGIR_CAMPOS"; indice: number; cambios: Record<string, string> }
  | { type: "ELIMINAR_FILA"; indice: number }
  | { type: "PROGRESO"; valor: number }
  | { type: "COTIZACION_OK"; filas: FilaMasiva[]; totalMXN: number }
  | { type: "CHECKOUT"; stripeClientSecret: string; cargaId: string }
  | { type: "REANUDAR_CHECKOUT"; stripeClientSecret: string; cargaId: string; filas: FilaMasiva[]; totalMXN: number };
const inicial: State = { estado: "idle", filas: [], totalMXN: 0, error: null, progreso: 0, stripeClientSecret: null, cargaId: null, pagoConfirmado: false };
function revalidarFila(fila: FilaMasiva): FilaMasiva {
  const v = validarFila(fila.datos, fila.indice);
  return {
    ...fila,
    ...v,
    estadoGranular: v.estado === "error" || fila.errorCotizacion ? "error" : fila.tarifa != null ? "cotizado" : "pendiente",
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PARSEANDO":
      return { ...inicial, estado: "parseando" };
    case "VALIDACION_OK":
      return {
        ...state,
        estado: "resultados",
        filas: action.filas.map((f) => ({
          ...f,
          estadoGranular: f.estado === "error" || f.errorCotizacion ? "error" : f.tarifa != null ? "cotizado" : "pendiente",
        })),
        error: null,
      };
    case "FILA_VALIDADA":
      return {
        ...state,
        filas: state.filas.map((f) =>
          f.indice === action.fila.indice
            ? {
                ...action.fila,
                eliminada: f.eliminada,
                estadoGranular: action.fila.estado === "error" || action.fila.errorCotizacion ? "error" : action.fila.tarifa != null ? "cotizado" : "pendiente",
              }
            : f
        ),
      };
    case "ERROR":
      return { ...state, error: action.mensaje, estado: state.estado === "parseando" ? "idle" : "resultados" };
    case "CORREGIR_CAMPOS": {
      const filas = state.filas.map((f) => {
        if (f.indice !== action.indice) return f;
        const datos = { ...f.datos, ...action.cambios };
        return { ...revalidarFila({ ...f, datos, errorCotizacion: undefined, tarifa: null, distanciaKm: null }), validando: true };
      });
      return { ...state, filas };
    }
    case "ELIMINAR_FILA": {
      const filas = state.filas.map((f) =>
        f.indice === action.indice ? { ...f, eliminada: true } : f,
      );
      return { ...state, filas };
    }
    case "GEOCODIFICANDO":
      return {
        ...state,
        estado: "geocodificando",
        progreso: 0,
        error: null,
        filas: state.filas.map((f) =>
          !f.eliminada && f.estado === "correcto" ? { ...f, estadoGranular: "geocodificando" } : f
        ),
      };
    case "PROGRESO":
      return { ...state, progreso: action.valor };
    case "COTIZANDO":
      return { ...state, estado: "cotizando", progreso: 50 };
    case "COTIZACION_OK": {
      const filasCotizadas = action.filas.map((f) => ({
        ...f,
        estadoGranular: (f.estado === "error" || f.errorCotizacion ? "error" : f.tarifa != null ? "cotizado" : "pendiente") as EstadoFilaGranular,
      }));
      // Si la cotización fue parcial, conservamos las filas previas con incidencias que quedaron en borrador
      const indicesCotizados = new Set(filasCotizadas.map((f) => f.indice));
      const filasPendientesConservadas = state.filas.filter(
        (f) => !f.eliminada && f.estado === "error" && !indicesCotizados.has(f.indice)
      );
      return {
        ...state,
        estado: "checkout",
        filas: [...filasCotizadas, ...filasPendientesConservadas],
        totalMXN: action.totalMXN,
        progreso: 100,
      };
    }
    case "CHECKOUT":
      return { ...state, stripeClientSecret: action.stripeClientSecret, cargaId: action.cargaId };
    case "REANUDAR_CHECKOUT":
      return {
        ...state,
        estado: "checkout",
        stripeClientSecret: action.stripeClientSecret,
        cargaId: action.cargaId,
        filas: action.filas,
        totalMXN: action.totalMXN,
        progreso: 100,
        error: null,
      };
    case "PAGO_OK":
      return { ...state, estado: "pagado", pagoConfirmado: true };
    case "RESET":
      return inicial;
  }
}

// ── Hook principal ──────────────────────────────────────────────────────────

export function useCargaMasiva() {
  const [state, dispatch] = useReducer(reducer, inicial);
  const abortRef = useRef<AbortController | null>(null);
  const claveCobro = useRef<string | null>(null);
  const correcciones = useRef(new Map<number, AbortController>());
  const [cargaPendienteStorage, setCargaPendienteStorage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const guardada = localStorage.getItem(STORAGE_KEY_CARGA_ACTIVA);
      if (guardada) setCargaPendienteStorage(guardada);
    } catch {
      // Ignore storage access error
    }

    if (typeof window !== "undefined" && !obtenerTokenCsrfCliente() && !process.env.VITEST) {
      void fetch("/api/csrf", { method: "GET", cache: "no-store" });
    }
  }, []);

  useEffect(() => {
    const pendientes = correcciones.current;
    return () => { abortRef.current?.abort(); pendientes.forEach(c => c.abort()); };
  }, []);

  const cancelar = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_CARGA_ACTIVA);
    } catch {
      // Ignore
    }
    setCargaPendienteStorage(null);
    claveCobro.current = null;
    abortRef.current?.abort();
    correcciones.current.forEach(c => c.abort());
    correcciones.current.clear();
    dispatch({ type: "RESET" });
  }, []);

  /**
   * Parsea el archivo XLSX con Web Worker y lo valida
   * contra la API de validación del servidor.
   */
  const cargarArchivo = useCallback(async (archivo: File) => {
    correcciones.current.forEach(controller => controller.abort());
    correcciones.current.clear();
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "PARSEANDO" });
    claveCobro.current = null;

    try {
      const filasBruto = await parsearArchivoPlantilla(archivo, controller.signal);
      if (controller.signal.aborted) return;

      // Validar en servidor
      const headersCsrf = await obtenerHeadersCsrfAsync({ "Content-Type": "application/json" });
      const res = await fetch("/api/viajes/masivos/validate", {
        method: "POST",
        headers: headersCsrf,
        body: JSON.stringify({ filas: filasBruto }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error de validación." })) as { error?: string };
        throw new Error(err.error ?? "Error al validar el archivo.");
      }

      const resultado = await res.json() as { filas: FilaValidada[] };
      if (controller.signal.aborted) return;

      dispatch({ type: "VALIDACION_OK", filas: resultado.filas });
      return true;
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      dispatch({ type: "ERROR", mensaje: err instanceof Error ? err.message : "Error al procesar el archivo." });
      return false;
    }
  }, []);

  /** Corrige un campo en una fila específica y re-valida localmente */
  const corregirCampos = useCallback((indice: number, cambios: Record<string, string>) => {
    claveCobro.current = null;
    dispatch({ type: "CORREGIR_CAMPOS", indice, cambios });
    const fila = state.filas.find(f => f.indice === indice);
    if (!fila) return;
    correcciones.current.get(indice)?.abort();
    const controller = new AbortController();
    correcciones.current.set(indice, controller);
    const datos = { ...fila.datos, ...cambios };
    void (async () => {
      try {
        const res = await fetch("/api/viajes/masivos/validate", {
          method: "POST",
          headers: await obtenerHeadersCsrfAsync({ "Content-Type": "application/json" }),
          body: JSON.stringify({ filas: [datos] }),
          signal: controller.signal,
        });
        const resultado = await res.json();
        if (!res.ok) throw new Error(resultado.error ?? "No se pudo revalidar la fila.");
        if (!controller.signal.aborted) dispatch({ type: "FILA_VALIDADA", fila: { ...resultado.filas[0], indice, validando: false } });
      } catch (err) {
        if (controller.signal.aborted) return;
        logStructuredWarn("viajes/useCargaMasiva", "revalidacion_fila_fallida", err, { indice, campos: Object.keys(cambios) });
        dispatch({ type: "FILA_VALIDADA", fila: { ...validarFila(datos, indice), estado: "error", errores: { ...validarFila(datos, indice).errores }, errorCotizacion: err instanceof Error ? err.message : "No se pudo verificar la fila. Intenta guardarla de nuevo.", validando: false } });
      }
    })();
  }, [state.filas]);

  const corregirCampo = useCallback((indice: number, campo: string, valor: string) => corregirCampos(indice, { [campo]: valor }), [corregirCampos]);

  /** Elimina una fila con error del flujo */
  const eliminarFila = useCallback((indice: number) => {
    claveCobro.current = null;
    dispatch({ type: "ELIMINAR_FILA", indice });
  }, []);

  /**
   * Geocodifica todos los pares CP origen/destino y luego cotiza.
   * Si soloValidas es true, permite cotizar únicamente las filas válidas excluyendo las que tengan error.
   */
  const geocodificarYCotizar = useCallback(async (opciones?: { soloValidas?: boolean }) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const filasActivas = state.filas.filter((f) => !f.eliminada && (opciones?.soloValidas ? f.estado === "correcto" : true));
    if (filasActivas.length === 0) return;
    if (filasActivas.some(f => f.validando)) { dispatch({ type: "ERROR", mensaje: "Espera a que termine la validación de las filas." }); return; }

    dispatch({ type: "GEOCODIFICANDO" });

    try {
      const clave = claveCobro.current ?? crypto.randomUUID();
      claveCobro.current = clave;
      const headersCsrf = await obtenerHeadersCsrfAsync({ "Content-Type": "application/json" });
      const res = await fetch("/api/viajes/masivos/cotizar", {
        method: "POST",
        headers: headersCsrf,
        body: JSON.stringify({
          filas: filasActivas.map(f => f.datos),
          clave,
          permitirParcial: Boolean(opciones?.soloValidas),
        }),
        signal: controller.signal,
      });
      const resultado = await res.json();
      if (controller.signal.aborted) return;
      if (!res.ok) throw new Error(resultado.error ?? "No se pudo cotizar.");
      if (resultado.filas) {
        const indicesEnviados = new Set(filasActivas.map(f => f.indice));
        const revisadas = resultado.filas.map((f: FilaMasiva, i: number) => ({ ...f, indice: filasActivas[f.indice]?.indice ?? filasActivas[i]?.indice ?? f.indice }));
        dispatch({ type: "VALIDACION_OK", filas: [...revisadas, ...state.filas.filter(f => !indicesEnviados.has(f.indice))] });
        return;
      }
      try {
        localStorage.setItem(STORAGE_KEY_CARGA_ACTIVA, resultado.id);
      } catch {
        // Ignore
      }
      setCargaPendienteStorage(resultado.id);
      dispatch({ type: "CHECKOUT", stripeClientSecret: resultado.clientSecret, cargaId: resultado.id });
      dispatch({ type: "COTIZACION_OK", filas: [...resultado.cotizaciones, ...(resultado.filasConError ?? [])].map((f: FilaMasiva, i: number) => ({ ...f, indice: filasActivas[f.indice]?.indice ?? filasActivas[i]?.indice ?? f.indice })), totalMXN: resultado.totalMXN });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      dispatch({ type: "ERROR", mensaje: err instanceof Error ? err.message : "Error al procesar." });
    }
  }, [state.filas]);

  /** Cotiza inmediatamente solo las filas que son válidas */
  const cotizarSoloValidas = useCallback(async () => {
    return geocodificarYCotizar({ soloValidas: true });
  }, [geocodificarYCotizar]);

  /** Llama cuando Stripe confirma el pago */
  const confirmarPago = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY_CARGA_ACTIVA);
    } catch {
      // Ignore
    }
    setCargaPendienteStorage(null);
    dispatch({ type: "PAGO_OK" });
  }, []);

  /** Reanuda una carga pendiente previamente guardada con reintento automático y backoff */
  const reanudarCarga = useCallback(async (id: string): Promise<boolean> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "COTIZANDO" });
    try {
      const res = await fetchConReintento(
        `/api/viajes/masivos/pendientes?id=${encodeURIComponent(id)}`,
        { signal: controller.signal },
        3,
        1000
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo recuperar la carga pendiente.");
      if (data.pagado) {
        try { localStorage.removeItem(STORAGE_KEY_CARGA_ACTIVA); } catch {}
        setCargaPendienteStorage(null);
        dispatch({ type: "PAGO_OK" });
        return true;
      }
      if (data.expirado) {
        try { localStorage.removeItem(STORAGE_KEY_CARGA_ACTIVA); } catch {}
        setCargaPendienteStorage(null);
        dispatch({ type: "ERROR", mensaje: data.error ?? "La carga masiva ya no está disponible." });
        return false;
      }
      if (!data.clientSecret) throw new Error("No se pudo obtener la sesión de pago de la carga.");

      try { localStorage.setItem(STORAGE_KEY_CARGA_ACTIVA, id); } catch {}
      setCargaPendienteStorage(id);
      const filasCarga = Array.isArray(data.cotizaciones) && data.cotizaciones.length > 0
        ? data.cotizaciones
        : (data.filas ?? []);
      dispatch({
        type: "REANUDAR_CHECKOUT",
        cargaId: id,
        stripeClientSecret: data.clientSecret,
        filas: filasCarga,
        totalMXN: data.totalMXN ?? 0,
      });
      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return false;
      dispatch({ type: "ERROR", mensaje: err instanceof Error ? err.message : "Error al reanudar la carga." });
      return false;
    }
  }, []);

  /** Descarta una carga pendiente */
  const descartarCargaPendiente = useCallback(async (id: string): Promise<void> => {
    try {
      const headersCsrf = await obtenerHeadersCsrfAsync();
      const respuesta = await fetch(`/api/viajes/masivos/pendientes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: headersCsrf,
      });
      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => ({}));
        throw new Error(detalle.error ?? "No se pudo descartar la carga pendiente.");
      }
    } catch (err) {
      // Conservar el lote y permitir reintentar si el servidor rechazó el descarte.
      logStructuredWarn("viajes/useCargaMasiva", "descartar_carga_red_fallido", err, { cargaId: id });
      throw err;
    }
    try { localStorage.removeItem(STORAGE_KEY_CARGA_ACTIVA); } catch {}
    setCargaPendienteStorage(null);
    claveCobro.current = null;
    dispatch({ type: "RESET" });
  }, []);

  /** Consulta lista de cargas pendientes desde el servidor con reintento automático y backoff */
  const consultarCargasPendientes = useCallback(async () => {
    try {
      const res = await fetchConReintento("/api/viajes/masivos/pendientes", {}, 3, 1000);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No pudimos consultar las cargas pendientes.");
      const lista = data.pendientes ?? data.cargas;
      if (!Array.isArray(lista)) throw new Error("La consulta de cargas pendientes devolvió una respuesta inválida.");
      return lista as Array<{ id: string; totalMXN: number; cantidad_traslados: number; creado_en?: string }>;
    } catch (err) {
      logStructuredWarn("viajes/useCargaMasiva", "consultar_cargas_pendientes_fallido", err);
      throw err;
    }
  }, []);

  /** Consulta el estado de pago de una carga masiva con reintento y backoff exponencial */
  const consultarEstadoPago = useCallback(async (id: string): Promise<{ pagado: boolean; error?: string }> => {
    const res = await fetchConReintento(
      `/api/viajes/masivos/estado?id=${encodeURIComponent(id)}`,
      {},
      3,
      1000
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "No se pudo consultar el estado del pago.");
    return data as { pagado: boolean; error?: string };
  }, []);

  const filasVisibles = state.filas.filter((f) => !f.eliminada);
  const filasConError = filasVisibles.filter((f) => f.estado === "error" || Boolean(f.errorCotizacion));
  const filasCorrectas = filasVisibles.filter((f) => f.estado === "correcto" && !f.errorCotizacion && !f.validando);
  const filasCotizables = filasVisibles.filter((f) => f.estado === "correcto" && !f.errorCotizacion && !f.validando);
  const todasListas = filasVisibles.length > 0 && filasConError.length === 0 && !filasVisibles.some(f => f.validando);

  return {
    ...state,
    filasVisibles,
    filasConError,
    filasCorrectas,
    filasCotizables,
    todasListas,
    cargaPendienteStorage,
    cargarArchivo,
    corregirCampo,
    corregirCampos,
    eliminarFila,
    geocodificarYCotizar,
    cotizarSoloValidas,
    confirmarPago,
    cancelar,
    reanudarCarga,
    descartarCargaPendiente,
    consultarCargasPendientes,
    consultarEstadoPago,
  };
}
