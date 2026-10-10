import { useCallback, useMemo } from "react";
import { esquemaSolicitudTraslado, erroresFormulario } from "../schema";
import { CAMPOS_PASO_TARIFA, generarTarifaSnapshot } from "../tarifa-gate";
import {
  CAMPOS_PASO_RUTA,
  CAMPOS_PASO_VEHICULO,
  CAMPOS_PASO_VEHICULO_DETALLE,
  CAMPOS_RUTA_DESTINO_CONTACTOS,
  CAMPOS_RUTA_ORIGEN,
  pasoDeCampo,
} from "../constants";
import { registrarEventoUx } from "@/lib/analytics";
import type {
  DatosFormulario,
  ErroresFormulario,
  ParadaForm,
  VehiculoGuardado,
} from "../types";
import type { SettersFormulario } from "./useSettersFormulario";

interface DependenciasValidacion {
  datos: DatosFormulario;
  paso: number;
  tarifaPreviaAceptada: boolean;
  vehiculoSeleccionadoId: string;
  vehiculosGuardados: VehiculoGuardado[];
  aceptaPoliticasPagoCancelacion: boolean;
  previsualizacion: { tarifa?: number | null } | null;
  setErrores: SettersFormulario["setErrores"];
  setErrorPaso: SettersFormulario["setErrorPaso"];
  setPaso: SettersFormulario["setPaso"];
  setDetallesVehiculoExpandido: SettersFormulario["setDetallesVehiculoExpandido"];
  setSubpasoRuta: SettersFormulario["setSubpasoRuta"];
  setTarifaPreviaAceptada: SettersFormulario["setTarifaPreviaAceptada"];
  setTarifaPreviaSnapshot: SettersFormulario["setTarifaPreviaSnapshot"];
}

/**
 * God-hook (auditoría): bloque de validación del wizard — construcción del
 * payload a validar, errores por parada, validación por campo/paso y la
 * aceptación de tarifa del gate. Se mueve intacto.
 */
export function useValidacionTraslado({
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
}: DependenciasValidacion) {
  const enfocarPrimerError = useCallback((campos: string[]) => {
    if (campos.length === 0) return;
    const primer = campos[0]!;
    setTimeout(() => {
      const candidato =
        document.getElementById(primer) ??
        (document.querySelector(`[name="${primer}"]`) as HTMLElement | null) ??
        (document.querySelector(`[data-ruum-label]`) as HTMLElement | null) ??
        (document.querySelector('[aria-invalid="true"]') as HTMLElement | null);
      if (candidato) {
        candidato.focus();
        candidato.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 60);
  }, []);

  const datosParaValidacion = useCallback(() => {
    return {
      ...datos,
      vehiculoSeleccionadoId,
      vehiculosUsuarioIds: vehiculosGuardados.map((v) => v.id),
      aceptaPoliticas: aceptaPoliticasPagoCancelacion,
      zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }, [aceptaPoliticasPagoCancelacion, datos, vehiculoSeleccionadoId, vehiculosGuardados]);

  const erroresParadas = useMemo(() => {
    const res = esquemaSolicitudTraslado.safeParse(datosParaValidacion());
    if (res.success) return undefined;
    const byIdx: Array<Partial<Record<keyof ParadaForm, string>>> = [];
    for (const issue of res.error.issues) {
      if (issue.path[0] === "paradas" && typeof issue.path[1] === "number") {
        const idx = issue.path[1] as number;
        const field = String(issue.path[2] ?? "calle") as keyof ParadaForm;
        byIdx[idx] = { ...byIdx[idx], [field]: issue.message };
      }
    }
    return byIdx.length ? byIdx : undefined;
  }, [datosParaValidacion]);

  const validarCampo = useCallback((campo: keyof DatosFormulario) => {
    const res = esquemaSolicitudTraslado.safeParse(datosParaValidacion());
    if (!res.success) {
      const map = erroresFormulario(res) as ErroresFormulario;
      if (map[campo]) {
        setErrores((prev) => ({ ...prev, [campo]: map[campo] }));
      } else {
        setErrores((prev) => {
          if (!prev[campo]) return prev;
          const n = { ...prev };
          delete n[campo];
          return n;
        });
      }
    } else {
      setErrores((prev) => {
        if (!prev[campo]) return prev;
        const n = { ...prev };
        delete n[campo];
        return n;
      });
    }
  }, [datosParaValidacion, setErrores]);

  const validarPasoActual = useCallback(() => {
    if (paso > 0 && paso < 3 && !tarifaPreviaAceptada) {
      setErrorPaso("Tu tarifa cambió o requiere confirmación. Por favor revísala en el paso inicial.");
      setPaso(0);
      return false;
    }

    const todos = erroresFormulario(esquemaSolicitudTraslado.safeParse(datosParaValidacion()));
    const siguientesErrores = Object.fromEntries(
      Object.entries(todos).filter(([campo]) => {
        if (paso === 0) return CAMPOS_PASO_TARIFA.has(campo as keyof DatosFormulario);
        if (paso === 1) return CAMPOS_PASO_VEHICULO.has(campo as string) || campo === "vehiculoSeleccionadoId";
        if (paso === 2) return CAMPOS_PASO_RUTA.has(campo) || campo === "paradas";
        return pasoDeCampo(campo) === paso;
      })
    ) as ErroresFormulario;

    const totalErrores = Object.keys(siguientesErrores).length;
    setErrores(siguientesErrores);

    if (totalErrores) {
      const esDetalleVehiculo = paso === 1 && Object.keys(siguientesErrores).some((c) => CAMPOS_PASO_VEHICULO_DETALLE.has(c));
      if (esDetalleVehiculo) setDetallesVehiculoExpandido(true);
      setErrorPaso(`${totalErrores} ${totalErrores === 1 ? "campo por completar" : "campos por completar"}. Revisa los campos marcados${paso === 1 ? " — color, placas, VIN y documentación son obligatorios" : ""}.`);
      if (paso === 2) {
        const primerCampo = Object.keys(siguientesErrores)[0]!;
        if (CAMPOS_RUTA_ORIGEN.has(primerCampo)) setSubpasoRuta("origen");
        else if (CAMPOS_RUTA_DESTINO_CONTACTOS.has(primerCampo)) setSubpasoRuta("destino_contactos");
      }
      enfocarPrimerError(Object.keys(siguientesErrores));
    } else {
      setErrorPaso(null);
    }
    return totalErrores === 0;
  }, [datosParaValidacion, enfocarPrimerError, paso, setDetallesVehiculoExpandido, setErrorPaso, setErrores, setPaso, setSubpasoRuta, tarifaPreviaAceptada]);

  const aceptarTarifaYContinuar = useCallback(() => {
    if (!validarPasoActual()) return;
    setTarifaPreviaAceptada(true);
    setTarifaPreviaSnapshot(generarTarifaSnapshot(datos));
    setErrorPaso(null);
    registrarEventoUx("tarifa_gate_aceptada", {
      monto: previsualizacion?.tarifa ?? null,
      marca: datos.marca,
      modelo: datos.modelo
    });
    setPaso(1);
  }, [datos, previsualizacion, setErrorPaso, setPaso, setTarifaPreviaAceptada, setTarifaPreviaSnapshot, validarPasoActual]);

  return { datosParaValidacion, enfocarPrimerError, erroresParadas, validarCampo, validarPasoActual, aceptarTarifaYContinuar };
}
