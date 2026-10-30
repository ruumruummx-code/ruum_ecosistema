import { obtenerHeadersCsrfAsync } from "../../lib/csrf";
import type {
  LibretaUbicaciones,
  OperacionUbicacion,
} from "./libreta-ubicaciones";
export async function guardarOperacionUbicacion(
  operacion: OperacionUbicacion,
): Promise<
  { ok: true; libreta: LibretaUbicaciones } | { ok: false; mensaje: string }
> {
  try {
    const response = await fetch("/api/ubicaciones", {
      method: "POST",
      headers: await obtenerHeadersCsrfAsync({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(operacion),
      credentials: "same-origin",
      cache: "no-store",
    });
    const resultado = await response.json();
    if (!response.ok || resultado.ok !== true)
      return {
        ok: false,
        mensaje:
          typeof resultado.mensaje === "string"
            ? resultado.mensaje
            : "No pudimos guardar tu ubicación. Actualiza la página e inténtalo de nuevo.",
      };
    return resultado;
  } catch {
    return {
      ok: false,
      mensaje:
        "No pudimos guardar tu ubicación. Revisa tu conexión e inténtalo de nuevo.",
    };
  }
}
