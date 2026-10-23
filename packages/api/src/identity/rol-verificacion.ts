import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { EVENTO_FALLO_VERIFICACION_ROL } from "@ruum/shared/seguridad";
import { registrarEventoOperativoApp } from "../operations/queries/observabilidad";

type Cliente = SupabaseClient<Database>;

export interface DetalleFalloVerificacionRol {
  /** Ruta donde se intentó verificar el rol (sin query string). */
  pathname: string;
  /** Código de error corto; nunca el mensaje completo (puede traer detalle sensible). */
  motivo: string;
  ambito: "app-conductor" | "app-usuario";
}

/**
 * Registra el fallo de verificación de rol como evento operativo: es la métrica
 * que permite alertar sobre fallos de clasificación de identidad del middleware.
 *
 * Nunca lanza: la observabilidad no debe modificar la decisión de acceso
 * (en app-conductor, el fallo de verificación termina en 503).
 */
export async function registrarFalloVerificacionRol(
  cliente: Cliente,
  detalle: DetalleFalloVerificacionRol
): Promise<void> {
  try {
    await registrarEventoOperativoApp(cliente, {
      tipo: EVENTO_FALLO_VERIFICACION_ROL,
      versionApp: process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "desconocida",
      detalle: {
        scope: "seguridad|middleware",
        ambito: detalle.ambito,
        pathname: detalle.pathname.slice(0, 120),
        motivo: detalle.motivo.slice(0, 80),
        severity: "error"
      }
    });
  } catch {
    /* observability must never break operation */
  }
}
