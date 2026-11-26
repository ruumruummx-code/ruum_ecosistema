"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { obtenerAdminActual } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../lib/supabase-browser";
import { normalizarRolAdmin, puedeVerRuta } from "../lib/roles-admin";

/**
 * Guard de navegación por rol operativo.
 * Solo aplica con sesión admin real (Supabase configurado + fila en admins),
 * o en smoke tests con rol simulado via cookie / global.
 * La autoridad de datos sigue en `es_admin()` / RLS; esto es coherencia UX.
 */
export function GuardRutaRol({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [listo, setListo] = useState(() => {
    if (pathname === "/login" || pathname === "/sin-permiso") return true;
    return false;
  });

  useEffect(() => {
    let activo = true;

    async function resolver() {
      if (pathname === "/login" || pathname === "/sin-permiso") {
        if (activo) setListo(true);
        return;
      }

      // Soporte para smoke tests E2E y pruebas por rol
      const cookieRol = typeof document !== "undefined"
        ? document.cookie.split("; ").find((r) => r.startsWith("ruum_smoke_rol="))?.split("=")[1]
        : null;
      const rolSimulado = cookieRol ?? (typeof window !== "undefined" ? (window as unknown as { __RUUM_SMOKE_ROL__?: string }).__RUUM_SMOKE_ROL__ : null);

      if (rolSimulado) {
        const rol = normalizarRolAdmin(rolSimulado);
        if (!puedeVerRuta(rol, pathname)) {
          router.replace(`/sin-permiso?ruta=${encodeURIComponent(pathname)}`);
          return;
        }
        if (activo) setListo(true);
        return;
      }

      if (!tieneSupabaseConfigurado()) {
        if (activo) setListo(true);
        return;
      }

      setListo(false);
      try {
        const cliente = crearClienteNavegador();
        const admin = await obtenerAdminActual(cliente);
        if (!activo) return;
        if (!admin) {
          setListo(true);
          return;
        }
        const rolActual = normalizarRolAdmin(admin.rol_operativo);
        if (!puedeVerRuta(rolActual, pathname)) {
          router.replace(`/sin-permiso?ruta=${encodeURIComponent(pathname)}`);
          return;
        }
        setListo(true);
      } catch {
        if (activo) setListo(true);
      }
    }

    void resolver();
    return () => {
      activo = false;
    };
  }, [pathname, router]);

  if (!listo) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6" role="status" aria-live="polite">
        <p className="font-body text-sm text-ui-fg-muted">Verificando acceso…</p>
      </div>
    );
  }

  return <>{children}</>;
}
