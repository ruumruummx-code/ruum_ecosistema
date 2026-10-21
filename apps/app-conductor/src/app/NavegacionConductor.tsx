"use client";

import { useEffect, useState } from "react";
import { obtenerConductorActual } from "@ruum/api/services";
import { contarNotificacionesNoLeidas } from "@ruum/api/drivers";
import { useViajeActivo } from "./ViajeActivoContext";
import { ConductorNav } from "./components/ConductorNav";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../lib/supabase-browser";

const EXCLUIDOS_NAVEGACION = [
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
  { href: "/ganancias", etiqueta: "Ganancias" },
  { href: "/notificaciones", etiqueta: "Notificaciones" },
  { href: "/cuenta", etiqueta: "Cuenta" },
];

/**
 * Navegación consistente para la operación del conductor.
 * Delegá la renderización de la navegación a `ConductorNav` (parametrizable)
 * y elimina la lista de exclusiones hardcodeada del cuerpo del componente.
 */
export function NavegacionConductor() {
  const { viajeActivo, viajeActivoSinActualizar } = useViajeActivo();
  const [nombreConductor, setNombreConductor] = useState<string | null>(null);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

  useEffect(() => {
    if (!tieneSupabaseConfigurado()) return;

    let activo = true;
    const cargarEncabezado = async () => {
      try {
        const cliente = crearClienteNavegador();
        const [perfil, notificaciones] = await Promise.allSettled([
          obtenerConductorActual(cliente),
          contarNotificacionesNoLeidas(cliente),
        ]);

        if (!activo) return;
        setNombreConductor(perfil.status === "fulfilled" ? perfil.value?.nombre ?? null : null);
        setNotificacionesNoLeidas(notificaciones.status === "fulfilled" ? notificaciones.value : 0);
      } catch {
        if (activo) {
          setNombreConductor(null);
          setNotificacionesNoLeidas(0);
        }
      }
    };

    void cargarEncabezado();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("conductor-tiene-viaje-activo", Boolean(viajeActivo));
    return () => document.body.classList.remove("conductor-tiene-viaje-activo");
  }, [viajeActivo]);

  return (
    <ConductorNav
      destinos={DESTINOS_CONDUCTOR}
      excluidos={EXCLUIDOS_NAVEGACION}
      mostrarHeader
      mostrarMobileNav
      viajeActivo={viajeActivo}
      viajeActivoSinActualizar={viajeActivoSinActualizar}
      notificacionesNoLeidas={notificacionesNoLeidas}
      nombreConductor={nombreConductor}
    />
  );
}
