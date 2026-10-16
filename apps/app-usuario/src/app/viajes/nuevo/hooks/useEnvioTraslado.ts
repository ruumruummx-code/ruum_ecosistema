"use client";
import { useCallback, type RefObject } from "react";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import { crearTraslado } from "@ruum/api/services";
import { registrarEventoUx } from "@/lib/analytics";
import {
  esErrorConfiguracionMapbox,
  mensajeErrorMapbox,
  tieneMapboxConfigurado
} from "@/lib/mapbox";
import { limpiarBorradorTrasladoLocal } from "@/lib/borrador-traslado";
import { construirPayloadCreacion, type CoordenadasParada, type CoordenadasTraslado } from "../adapters";
import { domicilioCompleto } from "../constants";
import {
  CAMPOS_PASO_VEHICULO_DETALLE,
  CAMPOS_RUTA_DESTINO_CONTACTOS,
  CAMPOS_RUTA_ORIGEN,
  mensajeAmigableErrorCreacion,
  pasoDeCampo
} from "../constants";
import { erroresFormulario } from "../schema";
import type {
  DatosFormulario,
  ErroresFormulario,
  VehiculoGuardado
} from "../types";
import type { RutaEstimacion } from "@/state/app-state";
import type { useGeocodificacion } from "./useGeocodificacion";
import type { useSettersFormulario } from "./useSettersFormulario";
import type { useValidacionTraslado } from "./useValidacionTraslado";

/**
 * FIX A1 (ticket arquitectura Fase 4): manejador de envío extraído del
 * god-hook `useNuevoTraslado` (allí líneas 641-862: `crear` + `enviarSolicitud`).
 * Orquesta validación final, validación servidor fail-closed, geocodificación
 * de último momento, creación vía RPC y telemetría. Recibe estado por
 * parámetros y setters por inyección — no lee el provider directamente —
 * para mantenerlo testeable y con dependencias explícitas.
 */

type SettersEnvio = Pick<
  ReturnType<typeof useSettersFormulario>,
  | "setPaso"
  | "setEnviando"
  | "setResultado"
  | "setErrorPaso"
  | "setErrores"
  | "setDetallesVehiculoExpandido"
  | "setSubpasoRuta"
  | "setRutaAviso"
  | "setTrasladoCreado"
>;

export interface ParametrosEnvioTraslado {
  paso: number;
  datos: DatosFormulario;
  tarifaPreviaAceptada: boolean;
  aceptaPoliticasPagoCancelacion: boolean;
  cargandoSesion: boolean;
  sesionReal: boolean;
  vehiculoSeleccionadoId: string;
  vehiculosGuardados: VehiculoGuardado[];
  rutaEstimacion: RutaEstimacion | null;
  claveIdempotencia: string;
  resultadoValidacion: ReturnType<typeof useValidacionTraslado>["resultadoValidacion"];
  geocodificarRuta: ReturnType<typeof useGeocodificacion>["geocodificarRuta"];
  geocodificarRutaConParadas: ReturnType<typeof useGeocodificacion>["geocodificarRutaConParadas"];
  enfocarPrimerError: (campos: string[]) => void;
  router: ReturnType<typeof useRouter>;
  formEnviadoRef: RefObject<boolean>;
  setters: SettersEnvio;
}

export function useEnvioTraslado(params: ParametrosEnvioTraslado) {
  const {
    paso,
    datos,
    tarifaPreviaAceptada,
    aceptaPoliticasPagoCancelacion,
    cargandoSesion,
    sesionReal,
    vehiculoSeleccionadoId,
    vehiculosGuardados,
    rutaEstimacion,
    claveIdempotencia,
    resultadoValidacion,
    geocodificarRuta,
    geocodificarRutaConParadas,
    enfocarPrimerError,
    router,
    formEnviadoRef,
    setters
  } = params;
  const {
    setPaso,
    setEnviando,
    setResultado,
    setErrorPaso,
    setErrores,
    setDetallesVehiculoExpandido,
    setSubpasoRuta,
    setRutaAviso,
    setTrasladoCreado
  } = setters;

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
          const destinoActual = datos.destinoLat !== undefined && datos.destinoLng !== undefined ? { lat: datos.destinoLat, lng: datos.destinoLng } : undefined;
          coordenadas = paradasDirs.length
            ? await geocodificarRutaConParadas(origenDireccion, destinoDireccion, paradasDirs, origenActual, undefined, destinoActual)
            : await geocodificarRuta(origenDireccion, destinoDireccion, origenActual, undefined, destinoActual);
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
    formEnviadoRef,
    geocodificarRuta, geocodificarRutaConParadas,
    paso, router, sesionReal, setDetallesVehiculoExpandido, setEnviando, setErrorPaso,
    setErrores, setPaso, setResultado, setRutaAviso, setSubpasoRuta, setTrasladoCreado,
    tarifaPreviaAceptada, vehiculoSeleccionadoId, vehiculosGuardados, rutaEstimacion
  ]);

  return { crear, enviarSolicitud };
}
