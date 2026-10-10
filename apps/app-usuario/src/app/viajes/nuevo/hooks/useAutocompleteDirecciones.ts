import { useCallback, useEffect, type RefObject } from "react";
import { haCambiadoTarifa } from "../tarifa-gate";
import { sugerirDireccionesAutocomplete } from "@/lib/mapbox";
import type { PrefijoDomicilio } from "../constants";
import type { DatosFormulario } from "../types";
import type { SettersFormulario } from "./useSettersFormulario";

type SugerenciaDireccion = Awaited<ReturnType<typeof sugerirDireccionesAutocomplete>>[number];

type ConsultarCodigoPostal = (prefijo: PrefijoDomicilio, codigoPostal: string) => Promise<void>;

interface DependenciasAutocomplete {
  origenBusqueda: string;
  destinoBusqueda: string;
  pasoRef: RefObject<number>;
  tarifaPreviaSnapshotRef: RefObject<string | null>;
  datosRef: RefObject<DatosFormulario>;
  consultarCodigoPostal: ConsultarCodigoPostal;
  setDatos: SettersFormulario["setDatos"];
  setErrorPaso: SettersFormulario["setErrorPaso"];
  setTarifaPreviaAceptada: SettersFormulario["setTarifaPreviaAceptada"];
  setOrigenBusqueda: SettersFormulario["setOrigenBusqueda"];
  setDestinoBusqueda: SettersFormulario["setDestinoBusqueda"];
  setOrigenSugerencias: SettersFormulario["setOrigenSugerencias"];
  setDestinoSugerencias: SettersFormulario["setDestinoSugerencias"];
  setBuscandoOrigen: SettersFormulario["setBuscandoOrigen"];
  setBuscandoDestino: SettersFormulario["setBuscandoDestino"];
}

/**
 * God-hook (auditoría): buscador autocomplete de direcciones Mapbox
 * (origen/destino) y aplicación de sugerencias (CP y dirección, con guarda
 * de tarifa). Se mueve intacto.
 */
export function useAutocompleteDirecciones({
  origenBusqueda,
  destinoBusqueda,
  pasoRef,
  tarifaPreviaSnapshotRef,
  datosRef,
  consultarCodigoPostal,
  setDatos,
  setErrorPaso,
  setTarifaPreviaAceptada,
  setOrigenBusqueda,
  setDestinoBusqueda,
  setOrigenSugerencias,
  setDestinoSugerencias,
  setBuscandoOrigen,
  setBuscandoDestino,
}: DependenciasAutocomplete) {
  // Buscador autocomplete Mapbox
  useEffect(() => {
    if (origenBusqueda.trim().length < 3) {
      setOrigenSugerencias([]);
      return;
    }
    let cancelado = false;
    const t = setTimeout(async () => {
      setBuscandoOrigen(true);
      try {
        const res = await sugerirDireccionesAutocomplete(origenBusqueda);
        if (!cancelado) setOrigenSugerencias(res);
      } finally {
        if (!cancelado) setBuscandoOrigen(false);
      }
    }, 350);
    return () => { cancelado = true; clearTimeout(t); };
  }, [origenBusqueda, setBuscandoOrigen, setOrigenSugerencias]);

  useEffect(() => {
    if (destinoBusqueda.trim().length < 3) {
      setDestinoSugerencias([]);
      return;
    }
    let cancelado = false;
    const t = setTimeout(async () => {
      setBuscandoDestino(true);
      try {
        const res = await sugerirDireccionesAutocomplete(destinoBusqueda);
        if (!cancelado) setDestinoSugerencias(res);
      } finally {
        if (!cancelado) setBuscandoDestino(false);
      }
    }, 350);
    return () => { cancelado = true; clearTimeout(t); };
  }, [destinoBusqueda, setBuscandoDestino, setDestinoSugerencias]);

  const aplicarSugerenciaCp = useCallback((prefijo: PrefijoDomicilio, ciudad: string, colonia: string) => {
    setDatos((prev) => ({
      ...prev,
      [`${prefijo}Ciudad`]: ciudad,
      [`${prefijo}Colonia`]: colonia
    }));
  }, [setDatos]);

  const aplicarSugerenciaDireccion = useCallback((prefijo: PrefijoDomicilio, s: SugerenciaDireccion) => {
    const calleExtraida = s.direccion || s.textoCompleto.split(",")[0] || "";

    if (pasoRef.current > 0 && tarifaPreviaSnapshotRef.current && s.codigoPostal) {
      const campoCp = `${prefijo}CodigoPostal` as keyof DatosFormulario;
      const datosNuevos = { ...datosRef.current, [campoCp]: s.codigoPostal };
      if (haCambiadoTarifa(tarifaPreviaSnapshotRef.current, datosNuevos)) {
        setTarifaPreviaAceptada(false);
        setErrorPaso("Tu tarifa puede haber cambiado. Confírmala antes de continuar.");
      }
    }

    setDatos((prev) => ({
      ...prev,
      [`${prefijo}Calle`]: calleExtraida || prev[`${prefijo}Calle` as keyof DatosFormulario] as string,
      [`${prefijo}Colonia`]: s.colonia || prev[`${prefijo}Colonia` as keyof DatosFormulario] as string,
      [`${prefijo}Ciudad`]: s.ciudad || prev[`${prefijo}Ciudad` as keyof DatosFormulario] as string,
      [`${prefijo}Estado`]: s.estado || prev[`${prefijo}Estado` as keyof DatosFormulario] as string,
      [`${prefijo}CodigoPostal`]: s.codigoPostal || prev[`${prefijo}CodigoPostal` as keyof DatosFormulario] as string,
      ...(prefijo === "origen" && s.lat && s.lng ? { origenLat: s.lat, origenLng: s.lng } : {}),
    }));
    if (prefijo === "origen") { setOrigenBusqueda(s.textoCompleto); setOrigenSugerencias([]); }
    else { setDestinoBusqueda(s.textoCompleto); setDestinoSugerencias([]); }
    if (s.codigoPostal && s.codigoPostal.length === 5) void consultarCodigoPostal(prefijo, s.codigoPostal);
  }, [consultarCodigoPostal, datosRef, pasoRef, tarifaPreviaSnapshotRef, setDestinoBusqueda, setDestinoSugerencias, setErrorPaso, setOrigenBusqueda, setOrigenSugerencias, setDatos, setTarifaPreviaAceptada]);

  return { aplicarSugerenciaCp, aplicarSugerenciaDireccion };
}
