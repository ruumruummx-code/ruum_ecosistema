import { useCallback, useEffect, useRef } from "react";
import { consultarCodigoPostalMx } from "@/lib/codigos-postales";
import { sugerirDireccionesPorCodigoPostal } from "@/lib/mapbox";
import { RETRASO_CONSULTA_CODIGO_POSTAL_MS, soloDigitos } from "../constants";
import type { PrefijoDomicilio } from "../constants";
import type { DatosFormulario } from "../types";
import type { SettersFormulario } from "./useSettersFormulario";

type ActualizarCampo = <K extends keyof DatosFormulario>(campo: K, valor: DatosFormulario[K]) => void;

interface DependenciasCodigoPostal {
  actualizar: ActualizarCampo;
  datosRef: { current: DatosFormulario };
  setDatos: SettersFormulario["setDatos"];
  setCpConsultando: SettersFormulario["setCpConsultando"];
  setCpAviso: SettersFormulario["setCpAviso"];
  setCpOpciones: SettersFormulario["setCpOpciones"];
  setPlacesOpciones: SettersFormulario["setPlacesOpciones"];
}

/**
 * God-hook (auditoría): bloque de consulta de código postal — timers,
 * AbortControllers y secuencias por prefijo, más los 5 callbacks que los
 * operan. Se mueve intacto; el comportamiento (debounce, cancelación,
 * fallback a captura manual) no cambia.
 */
export function useCodigoPostal({
  actualizar,
  datosRef,
  setDatos,
  setCpConsultando,
  setCpAviso,
  setCpOpciones,
  setPlacesOpciones,
}: DependenciasCodigoPostal) {
  const seqCodigoPostalRef = useRef<Record<PrefijoDomicilio, number>>({ origen: 0, destino: 0 });
  const codigoPostalTimersRef = useRef<Record<PrefijoDomicilio, ReturnType<typeof setTimeout> | null>>({ origen: null, destino: null });
  const codigoPostalAbortRef = useRef<Record<PrefijoDomicilio, AbortController | null>>({ origen: null, destino: null });
  const codigoPostalSolicitadoRef = useRef<Record<PrefijoDomicilio, string>>({ origen: "", destino: "" });

  // Limpieza al desmontar: timers y peticiones en vuelo propias del sub-hook.
  useEffect(() => () => {
    (Object.keys(codigoPostalTimersRef.current) as PrefijoDomicilio[]).forEach((prefijo) => {
      const timer = codigoPostalTimersRef.current[prefijo];
      if (timer) clearTimeout(timer);
      codigoPostalAbortRef.current[prefijo]?.abort();
    });
  }, []);

  const limpiarConsultaCodigoPostal = useCallback((prefijo: PrefijoDomicilio) => {
    const timer = codigoPostalTimersRef.current[prefijo];
    if (timer) clearTimeout(timer);
    codigoPostalTimersRef.current[prefijo] = null;
    codigoPostalAbortRef.current[prefijo]?.abort();
    codigoPostalAbortRef.current[prefijo] = null;
    codigoPostalSolicitadoRef.current[prefijo] = "";
    ++seqCodigoPostalRef.current[prefijo];
    setCpConsultando((actual) => actual === prefijo ? null : actual);
    setCpAviso((prev) => prev[prefijo] === null ? prev : { ...prev, [prefijo]: null });
    setCpOpciones((prev) => prev[prefijo] === null ? prev : { ...prev, [prefijo]: null });
    setPlacesOpciones((prev) => prev[prefijo].length === 0 ? prev : { ...prev, [prefijo]: [] });
  }, [setCpAviso, setCpConsultando, setCpOpciones, setPlacesOpciones]);

  const ejecutarConsultaCodigoPostal = useCallback(async (prefijo: PrefijoDomicilio, cp: string, secuencia: number) => {
    const vigente = () => seqCodigoPostalRef.current[prefijo] === secuencia;
    if (!vigente()) return;

    const controller = new AbortController();
    codigoPostalAbortRef.current[prefijo] = controller;
    let avisoMapbox: string | null = null;
    try {
      const sugerenciasMapboxPromise = sugerirDireccionesPorCodigoPostal(cp, controller.signal).catch(() => {
        // Mapbox es complementario: un fallo externo no invalida el catálogo
        // postal local ni debe presentarse como CP inexistente.
        avisoMapbox = "No pudimos cargar referencias de Mapbox. Puedes continuar con el catálogo postal local.";
        return [] as string[];
      });
      const [sugerenciasMapbox, datosCp] = await Promise.all([
        sugerenciasMapboxPromise,
        consultarCodigoPostalMx(cp)
      ]);
      if (!vigente()) return;
      setPlacesOpciones((prev) => ({ ...prev, [prefijo]: sugerenciasMapbox }));
      if (!datosCp) {
        setCpAviso((prev) => ({
          ...prev,
          [prefijo]: "No pudimos encontrar ese CP. Captura estado, ciudad y colonia manualmente."
        }));
        setCpOpciones((prev) => ({ ...prev, [prefijo]: null }));
        return;
      }
      const ciudad = datosCp.ciudades[0] ?? datosCp.colonias[0] ?? "";
      const colonia = datosCp.colonias[0] ?? ciudad;

      setDatos((prev) => ({
        ...prev,
        [`${prefijo}Estado`]: datosCp.estado || prev[`${prefijo}Estado` as keyof DatosFormulario],
        [`${prefijo}Ciudad`]: ciudad || prev[`${prefijo}Ciudad` as keyof DatosFormulario],
        [`${prefijo}Colonia`]: colonia || prev[`${prefijo}Colonia` as keyof DatosFormulario]
      }));
      setCpOpciones((prev) => ({ ...prev, [prefijo]: datosCp }));
      if (avisoMapbox) setCpAviso((prev) => ({ ...prev, [prefijo]: avisoMapbox }));
    } catch {
      if (vigente()) {
        setCpAviso((prev) => ({
          ...prev,
          [prefijo]: "No pudimos encontrar ese CP. Captura estado, ciudad y colonia manualmente."
        }));
      }
    } finally {
      if (codigoPostalAbortRef.current[prefijo] === controller) codigoPostalAbortRef.current[prefijo] = null;
      if (vigente()) setCpConsultando(null);
    }
  }, [setCpAviso, setCpConsultando, setCpOpciones, setDatos, setPlacesOpciones]);

  const programarConsultaCodigoPostal = useCallback((prefijo: PrefijoDomicilio, cp: string) => {
    if (codigoPostalSolicitadoRef.current[prefijo] === cp) return;
    const timerAnterior = codigoPostalTimersRef.current[prefijo];
    if (timerAnterior) clearTimeout(timerAnterior);
    codigoPostalAbortRef.current[prefijo]?.abort();
    codigoPostalAbortRef.current[prefijo] = null;

    const secuencia = ++seqCodigoPostalRef.current[prefijo];
    codigoPostalSolicitadoRef.current[prefijo] = cp;
    setCpConsultando(prefijo);
    setCpAviso((prev) => prev[prefijo] === null ? prev : { ...prev, [prefijo]: null });
    setCpOpciones((prev) => prev[prefijo] === null ? prev : { ...prev, [prefijo]: null });
    setPlacesOpciones((prev) => prev[prefijo].length === 0 ? prev : { ...prev, [prefijo]: [] });
    const timer = setTimeout(() => {
      codigoPostalTimersRef.current[prefijo] = null;
      void ejecutarConsultaCodigoPostal(prefijo, cp, secuencia);
    }, RETRASO_CONSULTA_CODIGO_POSTAL_MS);
    codigoPostalTimersRef.current[prefijo] = timer;
  }, [ejecutarConsultaCodigoPostal, setCpAviso, setCpConsultando, setCpOpciones, setPlacesOpciones]);

  const consultarCodigoPostal = useCallback((prefijo: PrefijoDomicilio, codigoPostal: string): Promise<void> => {
    const cp = soloDigitos(codigoPostal, 5);
    const campo = `${prefijo}CodigoPostal` as keyof DatosFormulario;
    if (datosRef.current[campo] !== cp) actualizar(campo, cp as never);
    if (cp.length !== 5) limpiarConsultaCodigoPostal(prefijo);
    else programarConsultaCodigoPostal(prefijo, cp);
    return Promise.resolve();
  }, [actualizar, datosRef, limpiarConsultaCodigoPostal, programarConsultaCodigoPostal]);

  const actualizarCodigoPostal = useCallback((prefijo: PrefijoDomicilio, valor: string) => {
    const cp = soloDigitos(valor, 5);
    actualizar(`${prefijo}CodigoPostal` as keyof DatosFormulario, cp as never);
    if (cp.length === 5) programarConsultaCodigoPostal(prefijo, cp);
    else limpiarConsultaCodigoPostal(prefijo);
  }, [actualizar, limpiarConsultaCodigoPostal, programarConsultaCodigoPostal]);

  return { consultarCodigoPostal, actualizarCodigoPostal };
}
