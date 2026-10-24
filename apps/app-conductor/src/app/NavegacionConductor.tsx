"use client";

import { useEffect } from "react";
import { useViajeActivo } from "./ViajeActivoContext";
import { ConductorNav } from "./components/ConductorNav";

const EXCLUIDOS_NAVEGACION = [
  "/panel",
  "/login",
  "/registro",
  "/onboarding",
  "/recuperar-password",
  "/nueva-password",
  "/actualizacion-requerida",
  "/auth/",
];

const DESTINOS_CONDUCTOR: { href: string; etiqueta: string }[] = [
  { href: "/panel", etiqueta: "Inicio" },
  { href: "/viajes", etiqueta: "Traslados" },
  { href: "/cuenta", etiqueta: "Cuenta" },
];

/**
 * Navegación consistente para la operación del conductor.
 * Delegá la renderización de la navegación a `ConductorNav` (parametrizable)
 * y elimina la lista de exclusiones hardcodeada del cuerpo del componente.
 */
export function NavegacionConductor() {
  const { viajeActivo, viajeActivoSinActualizar } = useViajeActivo();
  useEffect(() => {
    document.body.classList.toggle("conductor-tiene-viaje-activo", Boolean(viajeActivo));
    return () => document.body.classList.remove("conductor-tiene-viaje-activo");
  }, [viajeActivo]);

  return (
    <ConductorNav
      destinos={DESTINOS_CONDUCTOR}
      excluidos={EXCLUIDOS_NAVEGACION}
      mostrarMobileNav
      viajeActivo={viajeActivo}
      viajeActivoSinActualizar={viajeActivoSinActualizar}
    />
  );
}
