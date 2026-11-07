"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SafetyButton, useStreetMode } from "@ruum/ui";
import { useViajeActivo } from "./ViajeActivoContext";

/**
 * Modo calle V1.0 (cap. 23): se activa con traslado activo.
 * Botones ≥56px, texto ≥17px, botón de seguridad persistente ≤1 toque.
 */
export function ModoCalleActivador() {
  const pathname = usePathname();
  const { viajeActivo } = useViajeActivo();
  const activo = Boolean(viajeActivo);
  useStreetMode(activo);

  useEffect(() => {
    document.documentElement.dataset.street = activo ? "true" : "false";
    return () => {
      document.documentElement.dataset.street = "false";
    };
  }, [activo]);

  // Las vistas de Traslados integran su propio acceso de seguridad en el marco.
  if (!activo || pathname === "/viajes" || pathname.startsWith("/viajes/")) return null;
  return <SafetyButton />;
}
