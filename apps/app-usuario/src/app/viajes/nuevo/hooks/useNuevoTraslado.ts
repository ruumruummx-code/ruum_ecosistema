"use client";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import {
  crearTraslado,
  previsualizarTarifaUsuario,
} from "@ruum/api/services";
import { registrarEventoUx, iniciarFlujoTraslado, registrarPasoIniciado, registrarPasoCompletado, registrarAbandono } from "@/lib/analytics";
import {
  esErrorConfiguracionMapbox,
  mensajeErrorMapbox,
  sugerirDireccionesAutocomplete,
  tieneMapboxConfigurado
} from "@/lib/mapbox";
import { tipoSugeridoParaVehiculo } from "@/lib/catalogo-vehiculos";
import { limpiarBorradorTrasladoLocal } from "@/lib/borrador-traslado";
import { erroresFormulario } from "../schema";
import { CAMPOS_PASO_TARIFA, codigoPostalCompleto, generarTarifaSnapshot, haCambiadoTarifa } from "../tarifa-gate";
import { construirPayloadCreacion, type CoordenadasTraslado, type CoordenadasParada } from "../adapters";
import { useGeocodificacion } from "./useGeocodificacion";
import { useAutocompleteDirecciones } from "./useAutocompleteDirecciones";
import { useBorradorTraslado } from "./useBorradorTraslado";
import { useCatalogosTraslado } from "./useCatalogosTraslado";
import { useCodigoPostal } from "./useCodigoPostal";
import { useCotizacionTraslado } from "./useCotizacionTraslado";
import { usePagoTraslado } from "./usePagoTraslado";
import { useSesionTraslado } from "./useSesionTraslado";
import { useValidacionTraslado } from "./useValidacionTraslado";
import { useSettersFormulario } from "./useSettersFormulario";
import { useNuevoTrasladoState } from "@/state/AppStateProvider";
import {
  CAMPOS_PASO_RUTA,
  CAMPOS_PASO_VEHICULO,
  CAMPOS_PASO_VEHICULO_DETALLE,
  CAMPOS_RUTA_DESTINO_CONTACTOS,
  CAMPOS_RUTA_ORIGEN,
  domicilioCompleto,
  mensajeAmigableErrorCreacion,
  pasoDeCampo,
  telefonoLocalMx,
  type PrefijoDomicilio
} from "../constants";
import type {
  CondicionVehiculo,
  DatosFormulario,
  ErroresFormulario,
  ParadaForm,
  VehiculoGuardado
} from "../types";

export function useNuevoTraslado() {
  const { geocodificarRuta, geocodificarRutaConParadas } = useGeocodificacion();
  const router = useRouter();

  const { state: formulario, setField, reset } = useNuevoTrasladoState();
  const {
    paso,
    datos,
    enviando,
    resultado,
    bloqueoVerificacion,
    usuario,
    sesionReal,
    cargandoSesion,
    aceptaPoliticasPagoCancelacion,
    cpConsultando,
    cpAviso,
    cpOpciones,
    placesOpciones,
    subpasoRuta,
    vehiculosGuardados,
    vehiculoSeleccionadoId,
    errorPaso,
    errores,
    detallesVehiculoExpandido,
    origenBusqueda,
    destinoBusqueda,
    origenSugerencias,
    destinoSugerencias,
    buscandoOrigen,
    buscandoDestino,
    previsualizacion,
    previsualizando,
    tarifaPreviaAceptada,
    tarifaPreviaSnapshot,
    rutaEstimacion,
    rutaCalculando,
    rutaAviso,
    rutaReintento,
    borradorDisponible,
    claveIdempotencia,
    trasladoCreado,
    reintentoAceptacion,
    estadoGuardado,
    tiempoUltimoGuardado
  } = formulario;

  const estadoTrasladoId = trasladoCreado?.id ?? "nuevo";

  const {
    setFormulario,
    setEstadoGuardado,
    setTiempoUltimoGuardado,
    setPaso,
    setDatos,
    setEnviando,
    setResultado,
    setBloqueoVerificacion,
    setUsuario,
    setSesionReal,
    setCargandoSesion,
    setAceptaPoliticasPagoCancelacion,
    setCpConsultando,
    setCpAviso,
    setCpOpciones,
    setPlacesOpciones,
    setSubpasoRuta,
    setVehiculosGuardados,
    setVehiculoSeleccionadoId,
    setErrorPaso,
    setErrores,
    setDetallesVehiculoExpandido,
    setOrigenBusqueda,
    setDestinoBusqueda,
    setOrigenSugerencias,
    setDestinoSugerencias,
    setBuscandoOrigen,
    setBuscandoDestino,
    setPrevisualizacion,
    setPrevisualizando,
    setTarifaPreviaAceptada,
    setTarifaPreviaSnapshot,
    setRutaEstimacion,
    setRutaCalculando,
    setRutaAviso,
    setRutaReintento,
    setBorradorDisponible,
    setClaveIdempotencia,
    setTrasladoCreado,
    setReintentoAceptacion,
  } = useSettersFormulario(setField);

  const {
    cotizacionAceptada,
    aceptandoCotizacion,
    errorAceptacion,
    setCotizacionAceptada,
    setAceptandoCotizacion,
    setErrorAceptacion,
    reintentarAceptacion,
  } = useCotizacionTraslado({
    estadoTrasladoId,
    trasladoCreado,
    reintentoAceptacion,
    setReintentoAceptacion,
  });

  const {
    pagoConfirmado,
    setPagoConfirmado,
    verificandoPago,
    errorVerificacionPago,
    manejarPagoStripeConfirmado,
  } = usePagoTraslado({ estadoTrasladoId, trasladoCreado });  // Analítica del gate de tarifa (Paso 0)
  const tarifaGateVistaRegistrada = useRef(false);
  const tarifaGateCalculadaRegistrada = useRef(false);
  const tarifaGateNoDisponibleRegistrada = useRef(false);
  const tarifaGateAbandonadaRegistrada = useRef(false);
  const pasoRef = useRef(paso);
  pasoRef.current = paso;
  const tarifaPreviaAceptadaRef = useRef(tarifaPreviaAceptada);
  tarifaPreviaAceptadaRef.current = tarifaPreviaAceptada;
  const formEnviadoRef = useRef(false);

  // Borrador local no sensible

  const seqGeocodificaRef = useRef(0);
  const abortGeocodificaRef = useRef<AbortController | null>(null);
  // 1.4 Debounce dinámico — inmediato si onBlur, 650ms si typing
  const geocodificacionInmediataRef = useRef(false);
  const solicitarGeocodificacionInmediata = useCallback(() => {
    geocodificacionInmediataRef.current = true;
  }, []);
  const datosRef = useRef(datos);
  datosRef.current = datos;
  const erroresRef = useRef(errores);
  erroresRef.current = errores;
  const tarifaPreviaSnapshotRef = useRef(tarifaPreviaSnapshot);
  tarifaPreviaSnapshotRef.current = tarifaPreviaSnapshot;

  // El provider vive en el layout para que el estado sea único. El wizard se
  // reinicia al entrar para no reutilizar un envío anterior de la misma sesión.
  useEffect(() => {
    reset();
  }, [reset]);

  // Modelos y catálogo
  const {
    modelosDisponibles,
    clasificacionCatalogo,
    categoriaCatalogo,
    gamaCatalogo,
    momentoPago,
    politicaCancelacion,
  } = useCatalogosTraslado({ marca: datos.marca, modelo: datos.modelo, usuario });
  const cpTarifaListo = useMemo(
    () => codigoPostalCompleto(datos.origenCodigoPostal) && codigoPostalCompleto(datos.destinoCodigoPostal),
    [datos.destinoCodigoPostal, datos.origenCodigoPostal]
  );

  // Evento inicial + 3.1 flujo duración y abandono
  useEffect(() => {
    registrarEventoUx("traslado_nuevo_visto");
    iniciarFlujoTraslado();
    registrarPasoIniciado(paso);
    const handleBeforeUnload = () => registrarAbandono(paso, "usuario_navegó_fuera");
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      registrarAbandono(paso, "unmount_flujo");
    };
  }, []);

  // 3.1 tracking duración por paso
  const prevPasoRef = useRef(paso);
  useEffect(() => {
    if (prevPasoRef.current !== paso) {
      registrarPasoCompletado(prevPasoRef.current);
      registrarPasoIniciado(paso);
      prevPasoRef.current = paso;
    }
  }, [paso]);

  // Analítica gate tarifa
  useEffect(() => {
    if (paso === 0 && !tarifaGateVistaRegistrada.current) {
      tarifaGateVistaRegistrada.current = true;
      registrarEventoUx("tarifa_gate_vista");
    }
  }, [paso]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pasoRef.current === 0 && !tarifaPreviaAceptadaRef.current && !tarifaGateAbandonadaRegistrada.current) {
        tarifaGateAbandonadaRegistrada.current = true;
        registrarEventoUx("tarifa_gate_abandonada");
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (pasoRef.current === 0 && !tarifaPreviaAceptadaRef.current && !formEnviadoRef.current && !tarifaGateAbandonadaRegistrada.current) {
        tarifaGateAbandonadaRegistrada.current = true;
        registrarEventoUx("tarifa_gate_abandonada");
      }
    };
  }, []);

  // Geocodificación y cálculo de ruta Mapbox con debounce y AbortController
  useEffect(() => {
    const origenTieneCalle = Boolean(datos.origenCalle.trim());
    const destinoTieneCalle = Boolean(datos.destinoCalle.trim());
    const origenCPValido = codigoPostalCompleto(datos.origenCodigoPostal);
    const destinoCPValido = codigoPostalCompleto(datos.destinoCodigoPostal);

    const origenDireccion = origenTieneCalle
      ? domicilioCompleto({
          calle: datos.origenCalle,
          numero: datos.origenNumero,
          colonia: datos.origenColonia,
          codigoPostal: datos.origenCodigoPostal,
          ciudad: datos.origenCiudad,
          estado: datos.origenEstado
        })
      : origenCPValido
        ? `${datos.origenCodigoPostal.trim()}, México`
        : "";

    const destinoDireccion = destinoTieneCalle
      ? domicilioCompleto({
          calle: datos.destinoCalle,
          numero: datos.destinoNumero,
          colonia: datos.destinoColonia,
          codigoPostal: datos.destinoCodigoPostal,
          ciudad: datos.destinoCiudad,
          estado: datos.destinoEstado
        })
      : destinoCPValido
        ? `${datos.destinoCodigoPostal.trim()}, México`
        : "";

    const paradasDirecciones = (datos.paradas ?? []).map((p) => domicilioCompleto({
      calle: p.calle, numero: p.numero, colonia: p.colonia, codigoPostal: p.codigoPostal, ciudad: p.ciudad, estado: p.estado
    }));

    if (!origenDireccion.trim() || !destinoDireccion.trim()) {
      abortGeocodificaRef.current?.abort();
      const timer = setTimeout(() => {
        setRutaEstimacion(null);
        setRutaAviso(null);
        setRutaCalculando(false);
        setPrevisualizacion(null);
      }, 0);
      return () => clearTimeout(timer);
    }

    // Invalida el cálculo anterior antes del debounce para no mostrar una
    // tarifa construida con direcciones viejas mientras llega la respuesta.
    setRutaEstimacion(null);
    setRutaAviso(null);
    setRutaCalculando(true);
    setPrevisualizacion(null);

    // 1.4 Debounce dinámico: 0 si viene de onBlur, 650 si es typing
    const delay = geocodificacionInmediataRef.current ? 0 : 650;
    geocodificacionInmediataRef.current = false;
    const timer = setTimeout(async () => {
      abortGeocodificaRef.current?.abort();
      const controller = new AbortController();
      abortGeocodificaRef.current = controller;
      const seqActual = ++seqGeocodificaRef.current;
      const esStale = () => seqGeocodificaRef.current !== seqActual || controller.signal.aborted;

      setRutaCalculando(true);
      setRutaAviso(null);
      try {
        const usarParadas = paradasDirecciones.some((d) => d.trim());
        const coordsOrigen = datos.origenLat !== undefined && datos.origenLng !== undefined ? { lat: datos.origenLat, lng: datos.origenLng } : undefined;
        const coordenadas = usarParadas
          ? await geocodificarRutaConParadas(origenDireccion, destinoDireccion, paradasDirecciones, coordsOrigen, controller.signal)
          : await geocodificarRuta(origenDireccion, destinoDireccion, coordsOrigen, controller.signal);
        if (esStale()) return;
        setRutaEstimacion(coordenadas as typeof rutaEstimacion);
        if (coordenadas.incompletas) {
          setRutaAviso(
            tieneMapboxConfigurado()
              ? "No pudimos resolver una de las direcciones (origen, destino o alguna parada). Revisa calle, número, colonia y CP."
              : "Mapbox no está configurado; se guardará la solicitud sin distancia ni tiempo estimado."
          );
        } else if (coordenadas.distanciaKm === undefined || coordenadas.tiempoEstimadoHoras === undefined) {
          setRutaAviso("Mapbox resolvió las direcciones, pero no devolvió una ruta con distancia y tiempo.");
        }
      } catch (error) {
        if (esStale()) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRutaEstimacion({ incompletas: true });
        setRutaAviso(mensajeErrorMapbox(error));
      } finally {
        if (!esStale()) setRutaCalculando(false);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      abortGeocodificaRef.current?.abort();
    };
  }, [
    datos.origenCalle, datos.origenNumero, datos.origenColonia, datos.origenCodigoPostal, datos.origenCiudad, datos.origenEstado,
    datos.destinoCalle, datos.destinoNumero, datos.destinoColonia, datos.destinoCodigoPostal, datos.destinoCiudad, datos.destinoEstado,
    datos.paradas,
    datos.origenLat, datos.origenLng, geocodificarRuta, geocodificarRutaConParadas,
    rutaReintento, setPrevisualizacion, setRutaAviso, setRutaCalculando, setRutaEstimacion
  ]);

  // Cálculo de tarifa real desde Paso 0
  useEffect(() => {
    if (!sesionReal) {
      return;
    }
    if (!cpTarifaListo) {
      const timer = setTimeout(() => setPrevisualizacion(null), 0);
      return () => clearTimeout(timer);
    }
    if (!datos.marca.trim() || !datos.modelo.trim() || !datos.condicion) {
      const timer = setTimeout(() => setPrevisualizacion(null), 0);
      return () => clearTimeout(timer);
    }
    if (rutaEstimacion?.incompletas && rutaAviso && !rutaCalculando) {
      const timer = setTimeout(() => setPrevisualizacion({
        disponible: false,
        motivo: "No pudimos calcular la ruta automáticamente. Puedes enviar la solicitud y nuestro equipo confirmará la distancia y la cotización."
      }), 0);
      return () => clearTimeout(timer);
    }
    if (rutaEstimacion?.distanciaKm === undefined || rutaEstimacion.tiempoEstimadoHoras === undefined) {
      const timer = setTimeout(() => setPrevisualizacion(null), 0);
      return () => clearTimeout(timer);
    }
    if (datos.modalidadProgramacion === "programado" && !datos.fechaHoraProgramada) {
      const timer = setTimeout(() => setPrevisualizacion(null), 0);
      return () => clearTimeout(timer);
    }

    const distanciaKm = rutaEstimacion.distanciaKm;
    const tiempoEstimadoHoras = rutaEstimacion.tiempoEstimadoHoras;
    const condicionSeleccionada = datos.condicion ? (datos.condicion as CondicionVehiculo) : undefined;
    let cancelado = false;
    const timer = setTimeout(async () => {
      setPrevisualizando(true);
      try {
        const cliente = crearClienteNavegador();
        const res = await previsualizarTarifaUsuario(cliente, {
          marca: datos.marca,
          modelo: datos.modelo,
          distanciaKm,
          tiempoEstimadoHoras,
          fechaHora: datos.modalidadProgramacion === "programado" && datos.fechaHoraProgramada ? new Date(datos.fechaHoraProgramada) : null,
          condicion: condicionSeleccionada
        });
        if (!cancelado) {
          setPrevisualizacion(res);
          if (res?.disponible) {
            if (!tarifaGateCalculadaRegistrada.current) {
              tarifaGateCalculadaRegistrada.current = true;
              registrarEventoUx("tarifa_gate_calculada", { monto: res.tarifa });
            }
          } else if (res && !res.disponible) {
            if (!tarifaGateNoDisponibleRegistrada.current) {
              tarifaGateNoDisponibleRegistrada.current = true;
              registrarEventoUx("tarifa_gate_no_disponible");
            }
          }
        }
      } catch {
        if (!cancelado) setPrevisualizacion(null);
      } finally {
        if (!cancelado) setPrevisualizando(false);
      }
    }, 600);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [
    sesionReal, datos.marca, datos.modelo, datos.condicion,
    datos.modalidadProgramacion, datos.fechaHoraProgramada, rutaEstimacion,
    cpTarifaListo, rutaAviso, rutaCalculando, setPrevisualizacion, setPrevisualizando
  ]);

  // Carga de sesión de usuario y vehículos
  useSesionTraslado({
    router,
    setBloqueoVerificacion,
    setCargandoSesion,
    setResultado,
    setSesionReal,
    setUsuario,
    setVehiculosGuardados,
  });

  // Métodos de formulario
  const actualizar = useCallback(<K extends keyof DatosFormulario>(campo: K, valor: DatosFormulario[K]) => {
    setErrorPaso(null);
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const siguiente = { ...prev };
      delete siguiente[campo];
      return siguiente;
    });

    if (pasoRef.current > 0 && tarifaPreviaSnapshotRef.current && CAMPOS_PASO_TARIFA.has(campo)) {
      const datosNuevos = { ...datosRef.current, [campo]: valor };
      if (haCambiadoTarifa(tarifaPreviaSnapshotRef.current, datosNuevos)) {
        setTarifaPreviaAceptada(false);
        setErrorPaso("Tu tarifa puede haber cambiado. Confírmala antes de continuar.");
        // 3.1 tarifa validación fallida
        try {
          const prev = JSON.parse(tarifaPreviaSnapshotRef.current) as Record<string, unknown>;
          registrarEventoUx("tarifa_validacion_fallida", {
            paso: pasoRef.current,
            razon: String(campo),
            tarifa_anterior: String(prev.marca ?? ""),
            tarifa_nueva: String(valor ?? ""),
            timestamp: new Date().toISOString(),
          } as never);
        } catch {}
      }
    }

    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }, [setDatos, setErrorPaso, setErrores, setTarifaPreviaAceptada]);

  const { consultarCodigoPostal, actualizarCodigoPostal } = useCodigoPostal({
    actualizar,
    datosRef,
    setDatos,
    setCpConsultando,
    setCpAviso,
    setCpOpciones,
    setPlacesOpciones,
  });

  const { restaurarBorrador, descartarBorrador } = useBorradorTraslado({
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
  });

  const { aplicarSugerenciaCp, aplicarSugerenciaDireccion } = useAutocompleteDirecciones({
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
  });

  const actualizarTelefono = useCallback((campo: "entregaTelefono" | "recepcionTelefono", valor: string) => {
    actualizar(campo, telefonoLocalMx(valor));
  }, [actualizar]);

  const actualizarMarcaCatalogo = useCallback((marca: string) => {
    const cambioMarca = marca !== datosRef.current.marca;
    actualizar("marca", marca);
    if (cambioMarca && datosRef.current.modelo) actualizar("modelo", "");
  }, [actualizar]);

  const actualizarModeloCatalogo = useCallback((modelo: string) => {
    actualizar("modelo", modelo);
    const tipoSugerido = tipoSugeridoParaVehiculo(datosRef.current.marca, modelo);
    if (tipoSugerido) actualizar("tipo", tipoSugerido);
  }, [actualizar]);

  const actualizarParadas = useCallback((paradas: ParadaForm[]) => {
    setErrorPaso(null);
    setDatos((prev) => ({ ...prev, paradas }));
  }, [setDatos, setErrorPaso]);

  const reintentarRuta = useCallback(() => {
    setRutaReintento((valor) => valor + 1);
  }, [setRutaReintento]);

  const aplicarVehiculoGuardado = useCallback((vehiculo: VehiculoGuardado) => {
    const transmisionGuardada =
      vehiculo.transmision === "manual" || vehiculo.transmision === "automatica" || vehiculo.transmision === "electrica"
        ? vehiculo.transmision
        : datosRef.current.transmision;

    if (pasoRef.current > 0 && tarifaPreviaSnapshotRef.current) {
      const datosNuevos = {
        ...datosRef.current,
        marca: vehiculo.marca ?? "",
        modelo: vehiculo.modelo ?? "",
        condicion: (vehiculo.condicion as CondicionVehiculo) ?? datosRef.current.condicion
      };
      if (haCambiadoTarifa(tarifaPreviaSnapshotRef.current, datosNuevos)) {
        setTarifaPreviaAceptada(false);
        setErrorPaso("Tu tarifa puede haber cambiado. Confírmala antes de continuar.");
      }
    }

    setVehiculoSeleccionadoId(vehiculo.id);
    setDatos((prev) => ({
      ...prev,
      tipo: vehiculo.tipo,
      transmision: transmisionGuardada,
      marca: vehiculo.marca ?? "",
      modelo: vehiculo.modelo ?? "",
      anio: vehiculo.anio ? String(vehiculo.anio) : "",
      color: vehiculo.color ?? "",
      placas: vehiculo.placas ?? "",
      vin: vehiculo.vin ?? "",
      condicion: (vehiculo.condicion as CondicionVehiculo) ?? prev.condicion,
      estadoGeneral: vehiculo.estado_general_declarado ?? prev.estadoGeneral,
      tieneTarjeta: Boolean(vehiculo.tiene_tarjeta_circulacion),
      tieneVerificacion: Boolean(vehiculo.tiene_verificacion),
      tienePlacas: Boolean(vehiculo.tiene_placas),
      puedeCircular: Boolean(vehiculo.puede_circular_rodando)
    }));
  }, [setDatos, setErrorPaso, setTarifaPreviaAceptada, setVehiculoSeleccionadoId]);

  const limpiarVehiculoGuardado = useCallback(() => {
    setVehiculoSeleccionadoId("");
  }, [setVehiculoSeleccionadoId]);

  const claseControl = useCallback((campo: keyof DatosFormulario) => (
    erroresRef.current[campo] ? "border-danger" : "border-ink/50"
  ), []);

  const {
    resultadoValidacion,
    enfocarPrimerError,
    erroresParadas,
    validarCampo,
    validarPasoActual,
    aceptarTarifaYContinuar,
  } = useValidacionTraslado({
    datos,
    paso,
    tarifaPreviaAceptada,
    vehiculoSeleccionadoId,
    vehiculosGuardados,
    aceptaPoliticasPagoCancelacion,
    previsualizacion,
    setErrores,
    setErrorPaso,
    setPaso,
    setDetallesVehiculoExpandido,
    setSubpasoRuta,
    setTarifaPreviaAceptada,
    setTarifaPreviaSnapshot,
  });

  const avanzarPaso = useCallback(() => {
    if (!validarPasoActual()) return;
    setPaso((p) => p + 1);
  }, [setPaso, validarPasoActual]);

  const retrocederPaso = useCallback(() => {
    setPaso((p) => p - 1);
  }, [setPaso]);

  const crear = useCallback(async (
    cliente: SupabaseClient<Database>,
    datosForm: DatosFormulario,
    vehiculoId: string,
    coordenadas: CoordenadasTraslado & { paradasCoords?: CoordenadasParada[] },
    idempotenciaKey: string
  ) => {
    try {
      if (!idempotenciaKey) throw new Error("No se pudo generar la clave de seguridad de la solicitud.");
      const payload = construirPayloadCreacion(datosForm, vehiculoId, coordenadas);
      const traslado = await crearTraslado(cliente, payload.vehiculo, payload.traslado, idempotenciaKey, payload.paradas);
      limpiarBorradorTrasladoLocal();
      return traslado;
    } catch (error) {
      Sentry.captureException(error, {
        tags: { componente: "NuevoTraslado", paso, etapa: "creacion" },
        contexts: { traslado: { paso, tarifaPreviaAceptada, datosCompletos: Boolean(datosForm.marca && datosForm.modelo) } },
      });
      throw error;
    }
  }, [paso, tarifaPreviaAceptada]);

  const enviarSolicitud = useCallback(async () => {
    if (!tarifaPreviaAceptada) {
      setErrorPaso("Tu tarifa puede haber cambiado. Confírmala antes de continuar.");
      setPaso(0);
      return;
    }

    // Reutiliza el parseo memoizado del hook de validación (un solo
    // safeParse por snapshot en vez de uno por consumidor).
    const validacionFinal = resultadoValidacion;
    if (!validacionFinal.success) {
      const siguientesErrores = erroresFormulario(validacionFinal) as ErroresFormulario;
      setErrores(siguientesErrores);
      const primerCampo = String(validacionFinal.error.issues[0]?.path[0] ?? "");
      const pasoDestino = pasoDeCampo(primerCampo);
      setPaso(pasoDestino);
      if (CAMPOS_PASO_VEHICULO_DETALLE.has(primerCampo)) setDetallesVehiculoExpandido(true);
      if (CAMPOS_RUTA_ORIGEN.has(primerCampo)) setSubpasoRuta("origen");
      else if (CAMPOS_RUTA_DESTINO_CONTACTOS.has(primerCampo)) setSubpasoRuta("destino_contactos");
      setErrorPaso(`${validacionFinal.error.issues.length} campos requieren atención. Revisa los campos marcados.`);
      enfocarPrimerError([primerCampo]);
      return;
    }

    setEnviando(true);
    setResultado(null);

    if (!tieneSupabaseConfigurado()) {
      setEnviando(false);
      setResultado({
        ok: false,
        mensaje: "Supabase no está configurado. No se puede crear una solicitud real en este entorno."
      });
      return;
    }

    if (cargandoSesion) {
      setEnviando(false);
      setResultado({ ok: false, mensaje: "Estamos validando tu sesión. Espera unos segundos e intenta de nuevo." });
      return;
    }

    if (!sesionReal) {
      setEnviando(false);
      registrarEventoUx("traslado_nuevo_sin_sesion", { origen: "envio" });
      router.push("/login?next=/viajes/nuevo&reason=authentication_required");
      return;
    }

    const anioNumerico = Number(datos.anio);
    const anioMaximo = new Date().getFullYear() + 1;
    if (!datos.anio || !Number.isInteger(anioNumerico) || anioNumerico < 1980 || anioNumerico > anioMaximo) {
      setEnviando(false);
      setResultado({
        ok: false,
        mensaje: `El año del vehículo debe ser un número entre 1980 y ${anioMaximo}.`
      });
      return;
    }

    // Sec3: defensa en cliente + validación servidor del paso del wizard (rechazar si <4)
    if (paso < 3) {
      setEnviando(false);
      setResultado({ ok: false, mensaje: "Debes completar todos los pasos del wizard antes de enviar." });
      return;
    }

    try {
      registrarEventoUx("traslado_nuevo_enviado", {
        modalidad: datos.modalidadProgramacion,
        tipo_servicio: datos.tipoServicio,
        tipo_ruta: datos.tipoRuta
      });
      // Sec3: validación servidor — el servidor es fuente de verdad, el cliente no puede falsificar paso
      // M9: fail-closed. Antes un 5xx o un error de red caía en console.warn y
      // el flujo continuaba sin validación: provocar el error la evitaba.
      // Ahora cualquier fallo de validación bloquea la creación.
      try {
        const respPaso = await fetch("/api/viajes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paso,
            wizardPaso: paso,
            ...datos,
            vehiculoSeleccionadoId,
            vehiculosUsuarioIds: vehiculosGuardados.map((v) => v.id),
            zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
            aceptaPoliticas: aceptaPoliticasPagoCancelacion,
            paradas: datos.paradas,
          }),
        });
        if (!respPaso.ok) {
          const j = await respPaso.json().catch(() => null) as { error?: string } | null;
          throw new Error(j?.error || `No pudimos validar tu solicitud en el servidor (código ${respPaso.status}). Intenta de nuevo.`);
        }
      } catch (e) {
        console.warn("[traslados/nuevo] validación paso servidor fallida: se bloquea la creación", e);
        throw e instanceof Error ? e : new Error("No pudimos validar tu solicitud en el servidor. Intenta de nuevo.");
      }
      const cliente = crearClienteNavegador();
      const origenDireccion = domicilioCompleto({
        calle: datos.origenCalle,
        numero: datos.origenNumero,
        colonia: datos.origenColonia,
        codigoPostal: datos.origenCodigoPostal,
        ciudad: datos.origenCiudad,
        estado: datos.origenEstado
      });
      const destinoDireccion = domicilioCompleto({
        calle: datos.destinoCalle,
        numero: datos.destinoNumero,
        colonia: datos.destinoColonia,
        codigoPostal: datos.destinoCodigoPostal,
        ciudad: datos.destinoCiudad,
        estado: datos.destinoEstado
      });

      let coordenadas: typeof rutaEstimacion = rutaEstimacion as typeof rutaEstimacion;
      if (!coordenadas) {
        try {
          const paradasDirs = (datos.paradas ?? []).map((p) => domicilioCompleto({
            calle: p.calle, numero: p.numero, colonia: p.colonia, codigoPostal: p.codigoPostal, ciudad: p.ciudad, estado: p.estado
          }));
          const origenActual = datos.origenLat !== undefined && datos.origenLng !== undefined ? { lat: datos.origenLat, lng: datos.origenLng } : undefined;
          coordenadas = paradasDirs.length
            ? await geocodificarRutaConParadas(origenDireccion, destinoDireccion, paradasDirs, origenActual)
            : await geocodificarRuta(origenDireccion, destinoDireccion, origenActual);
        } catch (error) {
          if (!esErrorConfiguracionMapbox(error)) throw error;
          setRutaAviso(mensajeErrorMapbox(error));
          coordenadas = { incompletas: true };
        }
      }

      if (coordenadas.incompletas && !tieneMapboxConfigurado()) {
        // Sec2: log genérico sin exponer nombre de variable de entorno; detalle va a observabilidad
        console.warn("[traslados/nuevo] servicio de mapas no configurado: origen/destino se guardan sin geocodificar.");
      }

      const nuevoTraslado = await crear(cliente, datos, vehiculoSeleccionadoId, coordenadas, claveIdempotencia);

      setTrasladoCreado({
        id: nuevoTraslado.id,
        tipoPago: nuevoTraslado.tipo_pago,
        precioCotizado: nuevoTraslado.precio_cotizado ?? null
      });
      formEnviadoRef.current = true;
      setPaso(4);
      registrarEventoUx("traslado_nuevo_exitoso", {
        tipo_pago: nuevoTraslado.tipo_pago,
        modalidad: datos.modalidadProgramacion,
        tipo_servicio: datos.tipoServicio,
        tipo_ruta: datos.tipoRuta
      });
    } catch (err) {
      // 3.2 Monitoreo Sentry con contexto
      const isMapbox = err instanceof Error && /Mapbox/i.test(err.message);
      const isSupabase = err instanceof Error && /supabase|auth|usuario/i.test(err.message);
      Sentry.captureException(err, {
        tags: {
          componente: "NuevoTraslado",
          paso,
          etapa: isMapbox ? "geocodificacion" : isSupabase ? "supabase" : "creacion",
          error_code: err instanceof Error ? err.name : "unknown",
        },
        contexts: {
          traslado: {
            paso,
            tarifaPreviaAceptada,
            datosCompletos: Boolean(datos.marca && datos.modelo && datos.origenCodigoPostal),
            modalidad: datos.modalidadProgramacion,
            tipo_servicio: datos.tipoServicio,
          },
        },
        extra: {
          mensaje: err instanceof Error ? err.message.slice(0, 500) : String(err).slice(0, 500),
        },
      });
      setResultado({
        ok: false,
        mensaje: mensajeAmigableErrorCreacion(err)
      });
      registrarEventoUx("traslado_nuevo_error", {
        modalidad: datos.modalidadProgramacion,
        tipo_servicio: datos.tipoServicio,
        tipo_ruta: datos.tipoRuta,
        error_code: err instanceof Error ? err.name : "unknown",
        timestamp: new Date().toISOString(),
      });
      // 3.1 eventos específicos
      if (isMapbox) {
        registrarEventoUx("traslado_geocodificacion_error", { paso, error_code: (err as Error & { status?: number })?.status?.toString() ?? "mapbox", timestamp: new Date().toISOString() } as never);
      }
    } finally {
      setEnviando(false);
    }
  }, [
    aceptaPoliticasPagoCancelacion, cargandoSesion, claveIdempotencia, crear, datos, resultadoValidacion, enfocarPrimerError,
    geocodificarRuta, geocodificarRutaConParadas,
    paso, router, sesionReal, setDetallesVehiculoExpandido, setEnviando, setErrorPaso,
    setErrores, setPaso, setResultado, setRutaAviso, setSubpasoRuta, setTrasladoCreado,
    tarifaPreviaAceptada, vehiculoSeleccionadoId, vehiculosGuardados, rutaEstimacion
  ]);

  // Bundles de callbacks por paso (props drilling): cada miembro es
  // referencialmente estable, así que el objeto conserva identidad entre
  // renders y los comparadores memo siguen siendo efectivos con
  // `prev.acciones === next.acciones`.
  const irAPasoInicial = useCallback(() => setPaso(0), [setPaso]);
  const accionesTarifa = useMemo(() => ({
    claseControl, actualizar, actualizarCodigoPostal, actualizarMarcaCatalogo,
    actualizarModeloCatalogo, validarCampo, onContinuar: aceptarTarifaYContinuar,
  }), [claseControl, actualizar, actualizarCodigoPostal, actualizarMarcaCatalogo, actualizarModeloCatalogo, validarCampo, aceptarTarifaYContinuar]);
  const accionesVehiculo = useMemo(() => ({
    claseControl, actualizar, actualizarMarcaCatalogo, actualizarModeloCatalogo,
    validarCampo, aplicarVehiculoGuardado, limpiarVehiculoGuardado,
    setDetallesVehiculoExpandido, onEditarTarifa: irAPasoInicial,
  }), [claseControl, actualizar, actualizarMarcaCatalogo, actualizarModeloCatalogo, validarCampo, aplicarVehiculoGuardado, limpiarVehiculoGuardado, setDetallesVehiculoExpandido, irAPasoInicial]);
  const accionesRuta = useMemo(() => ({
    claseControl, actualizar, actualizarTelefono, actualizarCodigoPostal,
    consultarCodigoPostal, validarCampo, aplicarSugerenciaCp,
    aplicarSugerenciaDireccion, setOrigenBusqueda, setDestinoBusqueda,
    onReintentarRuta: reintentarRuta, onParadasChange: actualizarParadas,
  }), [claseControl, actualizar, actualizarTelefono, actualizarCodigoPostal, consultarCodigoPostal, validarCampo, aplicarSugerenciaCp, aplicarSugerenciaDireccion, setOrigenBusqueda, setDestinoBusqueda, reintentarRuta, actualizarParadas]);
  const accionesDetalles = useMemo(() => ({
    actualizar, onEditarAgenda: irAPasoInicial, setAceptaPoliticasPagoCancelacion,
    enviarSolicitud, onRevisarTarifa: irAPasoInicial,
  }), [actualizar, irAPasoInicial, setAceptaPoliticasPagoCancelacion, enviarSolicitud]);

  return {
    // Paso
    paso,
    setPaso,
    avanzarPaso,
    retrocederPaso,
    // Formulario y validación
    datos,
    setDatos,
    actualizar,
    actualizarTelefono,
    actualizarMarcaCatalogo,
    actualizarModeloCatalogo,
    actualizarCodigoPostal,
    consultarCodigoPostal,
    aplicarSugerenciaCp,
    aplicarSugerenciaDireccion,
    aplicarVehiculoGuardado,
    limpiarVehiculoGuardado,
    claseControl,
    validarCampo,
    validarPasoActual,
    enviarSolicitud,
    aceptarTarifaYContinuar,
    errores,
    errorPaso,
    setErrorPaso,
    erroresParadas,
    actualizarParadas,
    // Catálogos y computados
    modelosDisponibles,
    clasificacionCatalogo,
    categoriaCatalogo,
    gamaCatalogo,
    momentoPago,
    politicaCancelacion,
    // CP y geocodificación
    cpConsultando,
    cpAviso,
    cpOpciones,
    placesOpciones,
    origenBusqueda,
    setOrigenBusqueda,
    destinoBusqueda,
    setDestinoBusqueda,
    origenSugerencias,
    destinoSugerencias,
    buscandoOrigen,
    buscandoDestino,
    rutaEstimacion,
    rutaCalculando,
    rutaAviso,
    reintentarRuta,
    // Vehículos y detalles
    vehiculosGuardados,
    vehiculoSeleccionadoId,
    detallesVehiculoExpandido,
    setDetallesVehiculoExpandido,
    // Tarifa
    previsualizacion,
    previsualizando,
    tarifaPreviaAceptada,
    tarifaPreviaSnapshot,
    // Sesión y estados
    cargandoSesion,
    sesionReal,
    usuario,
    bloqueoVerificacion,
    enviando,
    resultado,
    setResultado,
    aceptaPoliticasPagoCancelacion,
    setAceptaPoliticasPagoCancelacion,
    // Borrador y feedback guardado
    borradorDisponible,
    restaurarBorrador,
    descartarBorrador,
    estadoGuardado,
    tiempoUltimoGuardado,
    // Envío y estados finales
    trasladoCreado,
    cotizacionAceptada,
    aceptandoCotizacion,
    errorAceptacion,
    pagoConfirmado,
    setPagoConfirmado,
    verificandoPago,
    errorVerificacionPago,
    manejarPagoStripeConfirmado,
    reintentarAceptacion,
    // 1.4 debounce dinámico
    solicitarGeocodificacionInmediata,
    // Bundles de callbacks por paso (props drilling)
    accionesTarifa,
    accionesVehiculo,
    accionesRuta,
    accionesDetalles,
    // Export backward-compatibility
    crear
  };
}
