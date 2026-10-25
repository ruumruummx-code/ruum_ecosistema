"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { validarFila, normalizarFilaPlantilla, valorCelda, type FilaValidada } from "@/lib/carga-masiva";
import { logStructuredWarn } from "@/lib/logger";
import { obtenerHeadersCsrf, obtenerTokenCsrfCliente } from "@/lib/csrf";

export const STORAGE_KEY_CARGA_ACTIVA = "ruum_carga_masiva_activa_id";

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

export interface FilaMasiva extends FilaValidada {
  tarifa?: number | null;
  distanciaKm?: number | null;
  eliminada?: boolean;
  validando?: boolean;
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
  | { type: "CORREGIR_CAMPO"; indice: number; campo: string; valor: string }
  | { type: "ELIMINAR_FILA"; indice: number }
  | { type: "PROGRESO"; valor: number }
  | { type: "COTIZACION_OK"; filas: FilaMasiva[]; totalMXN: number }
  | { type: "CHECKOUT"; stripeClientSecret: string; cargaId: string }
  | { type: "REANUDAR_CHECKOUT"; stripeClientSecret: string; cargaId: string; filas: FilaMasiva[]; totalMXN: number };
const inicial: State = { estado: "idle", filas: [], totalMXN: 0, error: null, progreso: 0, stripeClientSecret: null, cargaId: null, pagoConfirmado: false };
function revalidarFila(fila: FilaMasiva): FilaMasiva {
  return { ...fila, ...validarFila(fila.datos, fila.indice) };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PARSEANDO":
      return { ...inicial, estado: "parseando" };
    case "VALIDACION_OK":
      return { ...state, estado: "resultados", filas: action.filas, error: null };
    case "FILA_VALIDADA":
      return { ...state, filas: state.filas.map(f => f.indice === action.fila.indice ? { ...action.fila, eliminada: f.eliminada } : f) };
    case "ERROR":
      return { ...state, error: action.mensaje, estado: state.estado === "parseando" ? "idle" : "resultados" };
    case "CORREGIR_CAMPO": {
      const filas = state.filas.map((f) => {
        if (f.indice !== action.indice) return f;
        const datos = { ...f.datos, [action.campo]: action.valor };
        return { ...revalidarFila({ ...f, datos }), validando: true };
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
      return { ...state, estado: "geocodificando", progreso: 0, error: null };
    case "PROGRESO":
      return { ...state, progreso: action.valor };
    case "COTIZANDO":
      return { ...state, estado: "cotizando", progreso: 0 };
    case "COTIZACION_OK":
      return { ...state, estado: "checkout", filas: action.filas, totalMXN: action.totalMXN, progreso: 100 };
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
   * Parsea el archivo XLSX/CSV con exceljs (lazy import) y lo valida
   * contra la API de validación del servidor.
   */
  const cargarArchivo = useCallback(async (archivo: File) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "PARSEANDO" });
    claveCobro.current = null;

    try {
      if (!archivo.name.toLowerCase().endsWith(".xlsx") || archivo.size > 5 * 1024 * 1024) throw new Error("Selecciona la plantilla oficial .xlsx de hasta 5 MB.");
      // Parsear con ExcelJS en el navegador
      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const buffer = await archivo.arrayBuffer();
      await wb.xlsx.load(buffer);

      const ws = wb.getWorksheet("Traslados");
      if (!ws) throw new Error("El archivo no contiene hojas válidas.");

      // Obtener encabezados de la primera fila
      const headerRow = ws.getRow(1);
      const headers: Record<number, string> = {};
      headerRow.eachCell((cell, col) => {
        const val = valorCelda(cell.value);
        if (val) headers[col] = val;
      });

      const filasBruto: Record<string, string>[] = [];
      if (!["vehiculo_marca", "vehiculo_modelo", "origen_codigo_postal", "destino_codigo_postal"].every(h => Object.values(headers).includes(h))) throw new Error("Usa los encabezados de la plantilla oficial.");
      ws.eachRow((row, rowNum) => {
        if (rowNum === 1) return; // saltar encabezados
        const obj: Record<string, string> = {};
        let capturada = false;
        row.eachCell((cell, col) => {
          const key = headers[col];
          if (key) obj[key] = valorCelda(cell.value);
          if (key && obj[key] && cell.type !== 6) capturada = true;
        });
        if (capturada) filasBruto.push(normalizarFilaPlantilla(obj));
      });

      if (filasBruto.length === 0) {
        dispatch({ type: "ERROR", mensaje: "El archivo no contiene datos." });
        return;
      }

      if (filasBruto.length > 100) throw new Error("El límite es de 100 traslados por lote.");
      if (controller.signal.aborted) return;

      // Validar en servidor
      const res = await fetch("/api/viajes/masivos/validate", {
        method: "POST",
        headers: obtenerHeadersCsrf({ "Content-Type": "application/json" }),
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
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      dispatch({ type: "ERROR", mensaje: err instanceof Error ? err.message : "Error al procesar el archivo." });
    }
  }, []);

  /** Corrige un campo en una fila específica y re-valida localmente */
  const corregirCampo = useCallback((indice: number, campo: string, valor: string) => {
    claveCobro.current = null;
    dispatch({ type: "CORREGIR_CAMPO", indice, campo, valor });
    const fila = state.filas.find(f => f.indice === indice);
    if (!fila) return;
    correcciones.current.get(indice)?.abort();
    const controller = new AbortController();
    correcciones.current.set(indice, controller);
    const datos = { ...fila.datos, [campo]: valor };
    void (async () => {
      try {
        const res = await fetch("/api/viajes/masivos/validate", {
          method: "POST",
          headers: obtenerHeadersCsrf({ "Content-Type": "application/json" }),
          body: JSON.stringify({ filas: [datos] }),
          signal: controller.signal,
        });
        const resultado = await res.json();
        if (!res.ok) throw new Error(resultado.error ?? "No se pudo revalidar la fila.");
        if (!controller.signal.aborted) dispatch({ type: "FILA_VALIDADA", fila: { ...resultado.filas[0], indice, validando: false } });
      } catch (err) {
        if (controller.signal.aborted) return;
        logStructuredWarn("viajes/useCargaMasiva", "revalidacion_fila_fallida", err, { indice, campo });
        dispatch({ type: "FILA_VALIDADA", fila: { ...validarFila(datos, indice), estado: "error", errores: { [campo]: "No se pudo verificar. Edita el campo para reintentar." }, validando: false } });
      }
    })();
  }, [state.filas]);

  /** Elimina una fila con error del flujo */
  const eliminarFila = useCallback((indice: number) => {
    claveCobro.current = null;
    dispatch({ type: "ELIMINAR_FILA", indice });
  }, []);

  /**
   * Geocodifica todos los pares CP origen/destino y luego cotiza.
   * Sólo activa las filas en estado "correcto" y no eliminadas.
   */
  const geocodificarYCotizar = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const filasActivas = state.filas.filter((f) => !f.eliminada && f.estado === "correcto");
    if (filasActivas.length === 0) return;

    dispatch({ type: "GEOCODIFICANDO" });

    try {
      const clave = claveCobro.current ?? crypto.randomUUID();
      claveCobro.current = clave;
      const res = await fetch("/api/viajes/masivos/cotizar", {
        method: "POST",
        headers: obtenerHeadersCsrf({ "Content-Type": "application/json" }),
        body: JSON.stringify({ filas: filasActivas.map(f => f.datos), clave }),
        signal: controller.signal,
      });
      const resultado = await res.json();
      if (controller.signal.aborted) return;
      if (!res.ok) throw new Error(resultado.error ?? "No se pudo cotizar.");
      if (resultado.filas) { dispatch({ type: "VALIDACION_OK", filas: resultado.filas }); return; }
      try {
        localStorage.setItem(STORAGE_KEY_CARGA_ACTIVA, resultado.id);
      } catch {
        // Ignore
      }
      setCargaPendienteStorage(resultado.id);
      dispatch({ type: "CHECKOUT", stripeClientSecret: resultado.clientSecret, cargaId: resultado.id });
      dispatch({ type: "COTIZACION_OK", filas: resultado.cotizaciones, totalMXN: resultado.totalMXN });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      dispatch({ type: "ERROR", mensaje: err instanceof Error ? err.message : "Error al procesar." });
    }
  }, [state.filas]);

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

  /** Reanuda una carga pendiente previamente guardada */
  const reanudarCarga = useCallback(async (id: string): Promise<boolean> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "COTIZANDO" });
    try {
      const res = await fetch(`/api/viajes/masivos/pendientes?id=${encodeURIComponent(id)}`, {
        signal: controller.signal,
      });
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
      await fetch(`/api/viajes/masivos/pendientes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: obtenerHeadersCsrf(),
      });
    } catch (err) {
      // Ignorar errores de red en descarte dejando traza estructurada
      logStructuredWarn("viajes/useCargaMasiva", "descartar_carga_red_fallido", err, { cargaId: id });
    } finally {
      try { localStorage.removeItem(STORAGE_KEY_CARGA_ACTIVA); } catch {}
      setCargaPendienteStorage(null);
      claveCobro.current = null;
      dispatch({ type: "RESET" });
    }
  }, []);

  /** Consulta lista de cargas pendientes desde el servidor */
  const consultarCargasPendientes = useCallback(async () => {
    try {
      const res = await fetch("/api/viajes/masivos/pendientes");
      const data = await res.json();
      return (data.pendientes ?? []) as Array<{ id: string; totalMXN: number; cantidad_traslados: number; creado_en?: string }>;
    } catch (err) {
      logStructuredWarn("viajes/useCargaMasiva", "consultar_cargas_pendientes_fallido", err);
      return [];
    }
  }, []);

  const filasVisibles = state.filas.filter((f) => !f.eliminada);
  const filasConError = filasVisibles.filter((f) => f.estado === "error");
  const filasCorrectas = filasVisibles.filter((f) => f.estado === "correcto");
  const todasListas = filasVisibles.length > 0 && filasConError.length === 0 && !filasVisibles.some(f => f.validando);

  return {
    ...state,
    filasVisibles,
    filasConError,
    filasCorrectas,
    todasListas,
    cargaPendienteStorage,
    cargarArchivo,
    corregirCampo,
    eliminarFila,
    geocodificarYCotizar,
    confirmarPago,
    cancelar,
    reanudarCarga,
    descartarCargaPendiente,
    consultarCargasPendientes,
  };
}

