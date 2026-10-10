import { useMemo } from "react";
import { determinarMomentoPago, calcularCargoCancelacion } from "@ruum/shared/rules";
import {
  clasificacionesPorVehiculo,
  modelosPorMarca,
  resumenClasificacionVehiculo,
} from "@/lib/catalogo-vehiculos";
import type { Usuario } from "@ruum/shared/types";

interface DependenciasCatalogos {
  marca: string;
  modelo: string;
  usuario: Usuario;
}

/**
 * God-hook (auditoría): memos de catálogo de vehículos y cómputos de pago.
 * Se mueven intactos.
 */
export function useCatalogosTraslado({ marca, modelo, usuario }: DependenciasCatalogos) {
  const modelosDisponibles = useMemo(() => modelosPorMarca(marca), [marca]);
  const clasificacionCatalogo = useMemo(
    () => resumenClasificacionVehiculo(marca, modelo),
    [marca, modelo]
  );
  const clasificacionesCatalogo = useMemo(
    () => clasificacionesPorVehiculo(marca, modelo),
    [marca, modelo]
  );
  const categoriaCatalogo = useMemo(() => {
    const valores = [...new Set(clasificacionesCatalogo.map((vehiculo) => vehiculo.categoria))];
    return valores.length ? valores.join(" / ") : "Pendiente";
  }, [clasificacionesCatalogo]);
  const gamaCatalogo = useMemo(() => {
    const valores = [...new Set(clasificacionesCatalogo.map((vehiculo) => vehiculo.gama))];
    return valores.length ? valores.join(" / ") : "Pendiente";
  }, [clasificacionesCatalogo]);

  const momentoPago = useMemo(() => determinarMomentoPago(usuario), [usuario]);
  const politicaCancelacion = useMemo(() => calcularCargoCancelacion(0, 0, false, false), []);

  return {
    modelosDisponibles,
    clasificacionCatalogo,
    categoriaCatalogo,
    gamaCatalogo,
    momentoPago,
    politicaCancelacion,
  };
}
