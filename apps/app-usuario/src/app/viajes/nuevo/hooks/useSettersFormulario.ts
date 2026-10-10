import { useMemo, type SetStateAction } from "react";
import type { PrevisualizacionTarifa } from "@ruum/api/services";
import type { DatosCodigoPostal } from "@/lib/codigos-postales";
import type { BorradorTrasladoLocal } from "@/lib/borrador-traslado";
import type {
  NuevoTrasladoState,
  RutaEstimacion,
  SetNuevoTrasladoField,
  SugerenciaDireccion,
  TrasladoCreado,
} from "@/state/app-state";
import type { Usuario } from "@ruum/shared/types";
import type {
  DatosFormulario,
  ErroresFormulario,
  VehiculoGuardado,
} from "../types";
import type { PrefijoDomicilio, SubpasoRuta } from "../constants";

/**
 * God-hook (auditoría): useNuevoTraslado agrupaba ~45 setters envueltos uno
 * por uno con useCallback. Todos son mecánicos — delegan en `setFormulario`
 * sin lógica propia — así que se generan en un único useMemo.
 *
 * Estabilidad referencial: idéntica a la anterior. `setFormulario` es estable
 * (dispatch), por lo que el objeto no cambia de identidad entre renders y los
 * efectos que dependen de un setter no se re-disparan.
 *
 * Fuera quedan los setters con lógica propia (realtime o guarda de tarifa),
 * que viven en su sub-hook de dominio: `actualizar`, `setCotizacionAceptada`,
 * `setAceptandoCotizacion`, `setErrorAceptacion`, `setPagoConfirmado`.
 */
export function useSettersFormulario(setFormulario: SetNuevoTrasladoField) {
  return useMemo(() => {
    const set = <K extends keyof NuevoTrasladoState>(
      key: K,
      value: SetStateAction<NuevoTrasladoState[K]>
    ) => setFormulario(key, value);

    return {
      setFormulario,
      setEstadoGuardado: (v: SetStateAction<NuevoTrasladoState["estadoGuardado"]>) => set("estadoGuardado", v),
      setTiempoUltimoGuardado: (v: SetStateAction<string | null>) => set("tiempoUltimoGuardado", v),
      setPaso: (v: SetStateAction<number>) => set("paso", v),
      setDatos: (v: SetStateAction<DatosFormulario>) => set("datos", v),
      setEnviando: (v: SetStateAction<boolean>) => set("enviando", v),
      setResultado: (v: SetStateAction<{ ok: boolean; mensaje: string } | null>) => set("resultado", v),
      setBloqueoVerificacion: (v: SetStateAction<string | null>) => set("bloqueoVerificacion", v),
      setUsuario: (v: SetStateAction<Usuario>) => set("usuario", v),
      setSesionReal: (v: SetStateAction<boolean>) => set("sesionReal", v),
      setCargandoSesion: (v: SetStateAction<boolean>) => set("cargandoSesion", v),
      setAceptaPoliticasPagoCancelacion: (v: SetStateAction<boolean>) => set("aceptaPoliticasPagoCancelacion", v),
      setCpConsultando: (v: SetStateAction<PrefijoDomicilio | null>) => set("cpConsultando", v),
      setCpAviso: (v: SetStateAction<Record<PrefijoDomicilio, string | null>>) => set("cpAviso", v),
      setCpOpciones: (v: SetStateAction<Record<PrefijoDomicilio, DatosCodigoPostal | null>>) => set("cpOpciones", v),
      setPlacesOpciones: (v: SetStateAction<Record<PrefijoDomicilio, string[]>>) => set("placesOpciones", v),
      setSubpasoRuta: (v: SetStateAction<SubpasoRuta>) => set("subpasoRuta", v),
      setVehiculosGuardados: (v: SetStateAction<VehiculoGuardado[]>) => set("vehiculosGuardados", v),
      setVehiculoSeleccionadoId: (v: SetStateAction<string>) => set("vehiculoSeleccionadoId", v),
      setErrorPaso: (v: SetStateAction<string | null>) => set("errorPaso", v),
      setErrores: (v: SetStateAction<ErroresFormulario>) => set("errores", v),
      setDetallesVehiculoExpandido: (v: SetStateAction<boolean>) => set("detallesVehiculoExpandido", v),
      setOrigenBusqueda: (v: SetStateAction<string>) => set("origenBusqueda", v),
      setDestinoBusqueda: (v: SetStateAction<string>) => set("destinoBusqueda", v),
      setOrigenSugerencias: (v: SetStateAction<SugerenciaDireccion[]>) => set("origenSugerencias", v),
      setDestinoSugerencias: (v: SetStateAction<SugerenciaDireccion[]>) => set("destinoSugerencias", v),
      setBuscandoOrigen: (v: SetStateAction<boolean>) => set("buscandoOrigen", v),
      setBuscandoDestino: (v: SetStateAction<boolean>) => set("buscandoDestino", v),
      setPrevisualizacion: (v: SetStateAction<PrevisualizacionTarifa | null>) => set("previsualizacion", v),
      setPrevisualizando: (v: SetStateAction<boolean>) => set("previsualizando", v),
      setTarifaPreviaAceptada: (v: SetStateAction<boolean>) => set("tarifaPreviaAceptada", v),
      setTarifaPreviaSnapshot: (v: SetStateAction<string | null>) => set("tarifaPreviaSnapshot", v),
      setRutaEstimacion: (v: SetStateAction<RutaEstimacion | null>) => set("rutaEstimacion", v),
      setRutaCalculando: (v: SetStateAction<boolean>) => set("rutaCalculando", v),
      setRutaAviso: (v: SetStateAction<string | null>) => set("rutaAviso", v),
      setRutaReintento: (v: SetStateAction<number>) => set("rutaReintento", v),
      setBorradorDisponible: (v: SetStateAction<BorradorTrasladoLocal | null>) => set("borradorDisponible", v),
      setClaveIdempotencia: (v: SetStateAction<string>) => set("claveIdempotencia", v),
      setTrasladoCreado: (v: SetStateAction<TrasladoCreado | null>) => set("trasladoCreado", v),
      setReintentoAceptacion: (v: SetStateAction<number>) => set("reintentoAceptacion", v),
    };
  }, [setFormulario]);
}

export type SettersFormulario = ReturnType<typeof useSettersFormulario>;
