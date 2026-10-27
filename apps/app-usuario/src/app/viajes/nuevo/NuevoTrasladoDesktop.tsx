"use client";

import { useRef, type RefObject } from "react";
import type { useNuevoTraslado } from "./hooks/useNuevoTraslado";
import { UserDashboardLayout } from "../../../components/layout/UserDashboardLayout";
import { CotizadorPortal } from "./components/CotizadorPortal";

export interface NuevoTrasladoDesktopProps {
  t: ReturnType<typeof useNuevoTraslado>;
  nombreUsuario?: string | null;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}

/** Desktop usa los mismos pasos, validación y pago que el cotizador compartido. */
export function NuevoTrasladoDesktop({ t, nombreUsuario, headingRef }: NuevoTrasladoDesktopProps) {
  const encabezado = useRef<HTMLHeadingElement>(null);
  return <UserDashboardLayout idContenido="contenido-nuevo-traslado" nombre={nombreUsuario} totalVehiculos={t.vehiculosGuardados.length} padding="compacto">
    <CotizadorPortal t={t} headingRef={headingRef ?? encabezado} escritorio />
  </UserDashboardLayout>;
}
