import { useEffect } from "react";
import {
  guardarBorradorTrasladoLocal,
  leerBorradorTrasladoLocal,
  limpiarBorradorTrasladoLocal,
  ofuscarNumero,
} from "@/lib/borrador-traslado";
import { RETRASO_GUARDADO_BORRADOR_MS, type PrefijoDomicilio } from "../constants";
import type { BorradorTrasladoLocal } from "@/lib/borrador-traslado";
import type { TipoVehiculo } from "@ruum/shared/types";
import type {
  CondicionVehiculo,
  DatosFormulario,
  ModalidadProgramacion,
  TipoRutaTraslado,
  TransmisionVehiculo,
} from "../types";
import type { SettersFormulario } from "./useSettersFormulario";

type ConsultarCodigoPostal = (prefijo: PrefijoDomicilio, codigoPostal: string) => Promise<void>;

interface DependenciasBorrador {
  datos: DatosFormulario;
  paso: number;
  claveIdempotencia: string;
  enviando: boolean;
  resultado: { ok: boolean; mensaje: string } | null;
  borradorDisponible: BorradorTrasladoLocal | null;
  consultarCodigoPostal: ConsultarCodigoPostal;
  setDatos: SettersFormulario["setDatos"];
  setPaso: SettersFormulario["setPaso"];
  setTarifaPreviaAceptada: SettersFormulario["setTarifaPreviaAceptada"];
  setTarifaPreviaSnapshot: SettersFormulario["setTarifaPreviaSnapshot"];
  setErrorPaso: SettersFormulario["setErrorPaso"];
  setClaveIdempotencia: SettersFormulario["setClaveIdempotencia"];
  setBorradorDisponible: SettersFormulario["setBorradorDisponible"];
  setEstadoGuardado: SettersFormulario["setEstadoGuardado"];
  setTiempoUltimoGuardado: SettersFormulario["setTiempoUltimoGuardado"];
}

/**
 * God-hook (auditoría): bloque de borrador local — lectura al montar,
 * guardado con debounce, restaurar y descartar. Se mueve intacto.
 */
export function useBorradorTraslado({
  datos,
  paso,
  claveIdempotencia,
  enviando,
  resultado,
  borradorDisponible,
  consultarCodigoPostal,
  setDatos,
  setPaso,
  setTarifaPreviaAceptada,
  setTarifaPreviaSnapshot,
  setErrorPaso,
  setClaveIdempotencia,
  setBorradorDisponible,
  setEstadoGuardado,
  setTiempoUltimoGuardado,
}: DependenciasBorrador) {
  // Borrador: lectura al montar
  useEffect(() => {
    const timer = setTimeout(() => {
      const borrador = leerBorradorTrasladoLocal();
      setBorradorDisponible(borrador);
      setClaveIdempotencia(borrador?.claveIdempotencia ?? crypto.randomUUID());
    }, 0);
    return () => clearTimeout(timer);
  }, [setBorradorDisponible, setClaveIdempotencia]);

  // Borrador: guardado con debounce
  useEffect(() => {
    if (enviando || resultado) return;
    const hayContenido = [datos.marca, datos.modelo, datos.origenCodigoPostal, datos.destinoCodigoPostal, datos.entregaNombre].some(
      (v) => v.trim()
    );
    if (!hayContenido) return;

    setEstadoGuardado("guardando");

    const timer = setTimeout(() => {
      guardarBorradorTrasladoLocal({
        claveIdempotencia,
        paso,
        tipo: datos.tipo,
        transmision: datos.transmision,
        marca: datos.marca,
        modelo: datos.modelo,
        anio: datos.anio,
        color: datos.color,
        condicion: datos.condicion,
        estadoGeneral: datos.estadoGeneral,
        tieneTarjeta: datos.tieneTarjeta,
        tieneVerificacion: datos.tieneVerificacion,
        tienePlacas: datos.tienePlacas,
        puedeCircular: datos.puedeCircular,
        origenCodigoPostal: datos.origenCodigoPostal,
        origenEstado: datos.origenEstado,
        origenCiudad: datos.origenCiudad,
        origenColonia: datos.origenColonia,
        origenLatOfuscada: typeof datos.origenLat === "number" ? ofuscarNumero(datos.origenLat) : null,
        origenLngOfuscada: typeof datos.origenLng === "number" ? ofuscarNumero(datos.origenLng) : null,
        origenPoiGenerico: datos.origenColonia
          ? `${datos.origenColonia}, ${datos.origenCiudad || datos.origenEstado}`
          : (datos.origenCiudad || null),
        destinoCodigoPostal: datos.destinoCodigoPostal,
        destinoEstado: datos.destinoEstado,
        destinoCiudad: datos.destinoCiudad,
        destinoColonia: datos.destinoColonia,
        destinoLatOfuscada: typeof datos.destinoLat === "number" ? ofuscarNumero(datos.destinoLat) : null,
        destinoLngOfuscada: typeof datos.destinoLng === "number" ? ofuscarNumero(datos.destinoLng) : null,
        destinoPoiGenerico: datos.destinoColonia
          ? `${datos.destinoColonia}, ${datos.destinoCiudad || datos.destinoEstado}`
          : (datos.destinoCiudad || null),
        entregaNombre: datos.entregaNombre,
        entregaApellido: datos.entregaApellido,
        recepcionNombre: datos.recepcionNombre,
        recepcionApellido: datos.recepcionApellido,
        modalidadProgramacion: datos.modalidadProgramacion,
        fechaHoraProgramada: datos.fechaHoraProgramada,
        tipoRuta: datos.tipoRuta,
        ventanaRecoleccion: datos.ventanaRecoleccion,
        ventanaEntrega: datos.ventanaEntrega
      });
      setEstadoGuardado("guardado");
      setTiempoUltimoGuardado(new Date().toISOString());
    }, RETRASO_GUARDADO_BORRADOR_MS);

    return () => clearTimeout(timer);
  }, [
    enviando, resultado, paso, claveIdempotencia,
    datos.tipo, datos.transmision, datos.marca, datos.modelo, datos.anio, datos.color, datos.condicion, datos.estadoGeneral,
    datos.tieneTarjeta, datos.tieneVerificacion, datos.tienePlacas, datos.puedeCircular,
    datos.origenCodigoPostal, datos.origenEstado, datos.origenCiudad, datos.origenColonia,
    datos.origenLat, datos.origenLng,
    datos.destinoCodigoPostal, datos.destinoEstado, datos.destinoCiudad, datos.destinoColonia,
    datos.destinoLat, datos.destinoLng,
    datos.entregaNombre, datos.entregaApellido, datos.recepcionNombre, datos.recepcionApellido,
    datos.modalidadProgramacion, datos.fechaHoraProgramada, datos.tipoRuta,
    datos.ventanaRecoleccion, datos.ventanaEntrega,
    setEstadoGuardado, setTiempoUltimoGuardado
  ]);

  function restaurarBorrador() {
    const borrador = borradorDisponible;
    if (!borrador) return;

    let fechaRestaurada = borrador.fechaHoraProgramada;
    let modalidadRestaurada = (borrador.modalidadProgramacion || datos.modalidadProgramacion) as ModalidadProgramacion;

    if (fechaRestaurada && new Date(fechaRestaurada).getTime() <= Date.now()) {
      fechaRestaurada = "";
      modalidadRestaurada = "lo_antes_posible";
      setErrorPaso("La fecha programada en tu borrador ya pasó. Se restableció a 'Lo antes posible'.");
    }

    setDatos((prev) => ({
      ...prev,
      tipo: (borrador.tipo || prev.tipo) as TipoVehiculo,
      transmision: (borrador.transmision || prev.transmision) as TransmisionVehiculo,
      marca: borrador.marca,
      modelo: borrador.modelo,
      anio: borrador.anio,
      color: borrador.color,
      condicion: (borrador.condicion || prev.condicion) as CondicionVehiculo | "",
      estadoGeneral: borrador.estadoGeneral,
      tieneTarjeta: borrador.tieneTarjeta,
      tieneVerificacion: borrador.tieneVerificacion,
      tienePlacas: borrador.tienePlacas,
      puedeCircular: borrador.puedeCircular,
      origenCodigoPostal: borrador.origenCodigoPostal,
      origenEstado: borrador.origenEstado,
      origenCiudad: borrador.origenCiudad,
      origenColonia: borrador.origenColonia,
      origenLat: borrador.origenLatOfuscada ?? prev.origenLat,
      origenLng: borrador.origenLngOfuscada ?? prev.origenLng,
      destinoCodigoPostal: borrador.destinoCodigoPostal,
      destinoEstado: borrador.destinoEstado,
      destinoCiudad: borrador.destinoCiudad,
      destinoColonia: borrador.destinoColonia,
      destinoLat: borrador.destinoLatOfuscada ?? prev.destinoLat,
      destinoLng: borrador.destinoLngOfuscada ?? prev.destinoLng,
      entregaNombre: borrador.entregaNombre,
      entregaApellido: borrador.entregaApellido,
      recepcionNombre: borrador.recepcionNombre,
      recepcionApellido: borrador.recepcionApellido,
      modalidadProgramacion: modalidadRestaurada,
      fechaHoraProgramada: fechaRestaurada,
      tipoRuta: (borrador.tipoRuta || prev.tipoRuta) as TipoRutaTraslado,
      ventanaRecoleccion: borrador.ventanaRecoleccion,
      ventanaEntrega: borrador.ventanaEntrega
    }));

    setPaso(0);
    setTarifaPreviaAceptada(false);
    setTarifaPreviaSnapshot(null);
    setClaveIdempotencia(borrador.claveIdempotencia);
    setBorradorDisponible(null);

    if (borrador.origenCodigoPostal.length === 5) void consultarCodigoPostal("origen", borrador.origenCodigoPostal);
    if (borrador.destinoCodigoPostal.length === 5) void consultarCodigoPostal("destino", borrador.destinoCodigoPostal);
  }

  function descartarBorrador() {
    limpiarBorradorTrasladoLocal();
    setClaveIdempotencia(crypto.randomUUID());
    setBorradorDisponible(null);
  }

  return { restaurarBorrador, descartarBorrador };
}
