"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ConsentimientoTerminosWall, requiereConsentimiento } from "./ConsentimientoTerminos";
import { crearClienteNavegador } from "../lib/supabase-browser";
import { obtenerUsuarioActual } from "@ruum/api/services";

/**
 * M3 — Puerta global del muro de consentimiento PR-07.
 *
 * ConsentimientoTerminosWall existía pero solo se importaba en su propio
 * test: ningún usuario sin evidencia de consentimiento lo veía nunca. Esta
 * puerta se monta en el layout raíz y muestra el muro cuando hay sesión
 * activa y `version_terminos_aceptada` es null.
 *
 * Reglas:
 * - Sin sesión → no hace nada (el muro es solo para usuarios autenticados).
 * - En flujos de autenticación/recuperación y páginas legales no se interpone.
 * - Ante cualquier error (Supabase caído, red) falla abierto: nunca bloquea
 *   la app; el consentimiento se pedirá en la siguiente navegación.
 */
const RUTAS_SIN_MURO = [
  "/login",
  "/registro",
  "/recuperar-password",
  "/nueva-password",
  "/auth/",
  "/legal/",
];

function esRutaSinMuro(pathname: string | null): boolean {
  if (!pathname) return false;
  return RUTAS_SIN_MURO.some((base) => pathname === base || pathname.startsWith(base));
}

export function PuertaConsentimiento() {
  const pathname = usePathname();
  const [requiere, setRequiere] = useState(false);

  useEffect(() => {
    let activo = true;
    if (esRutaSinMuro(pathname)) return;
    void (async () => {
      try {
        const cliente = crearClienteNavegador();
        const { data: { session } } = await cliente.auth.getSession();
        if (!activo || !session) return;
        const usuario = await obtenerUsuarioActual(cliente);
        if (!activo) return;
        if (requiereConsentimiento(usuario?.version_terminos_aceptada)) {
          setRequiere(true);
        }
      } catch {
        // Fail-open: sin verificación no hay barrera (se reintentará al navegar).
      }
    })();
    return () => {
      activo = false;
    };
  }, [pathname]);

  if (!requiere) return null;
  return <ConsentimientoTerminosWall onAceptado={() => setRequiere(false)} />;
}
