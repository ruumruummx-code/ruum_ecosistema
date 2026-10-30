"use server";
import type { Json } from "@ruum/shared/types";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "../../lib/supabase-server";
import {
  aplicarOperacionLibreta,
  ErrorLibreta,
  CLAVE_LIBRETA,
  leerLibreta,
  type LibretaUbicaciones,
  type OperacionUbicacion,
} from "./libreta-ubicaciones";
export async function guardarOperacionUbicacion(
  operacion: OperacionUbicacion,
): Promise<
  { ok: true; libreta: LibretaUbicaciones } | { ok: false; mensaje: string }
> {
  try {
    const cliente = await crearClienteServidor();
    const { data: auth, error: errorAuth } = await cliente.auth.getUser();
    if (errorAuth || !auth.user)
      return {
        ok: false,
        mensaje: "Inicia sesión de nuevo para guardar tus ubicaciones.",
      };
    for (let intento = 0; intento < 3; intento++) {
      const { data: actual, error: lectura } = await cliente
        .from("usuarios")
        .select("id, preferencias, actualizado_en")
        .eq("auth_user_id", auth.user.id)
        .single();
      if (lectura || !actual)
        throw new ErrorLibreta(
          "No pudimos consultar tus ubicaciones. Inténtalo de nuevo.",
        );
      const libreta = aplicarOperacionLibreta(
        leerLibreta(actual.preferencias),
        operacion,
      );
      const previas =
        actual.preferencias &&
        typeof actual.preferencias === "object" &&
        !Array.isArray(actual.preferencias)
          ? actual.preferencias
          : {};
      const timestamp = new Date(
        Math.max(Date.now(), (Date.parse(actual.actualizado_en) || 0) + 1),
      ).toISOString();
      const { data: guardada, error } = await cliente
        .from("usuarios")
        .update({
          preferencias: {
            ...previas,
            [CLAVE_LIBRETA]: libreta,
          } as unknown as NonNullable<Json>,
          actualizado_en: timestamp,
        })
        .eq("id", actual.id)
        .eq("auth_user_id", auth.user.id)
        .eq("actualizado_en", actual.actualizado_en)
        .select("id")
        .maybeSingle();
      if (error)
        throw new ErrorLibreta(
          "No pudimos guardar tu ubicación. Inténtalo de nuevo.",
        );
      if (guardada) {
        revalidatePath("/ubicaciones");
        revalidatePath("/cuenta");
        return { ok: true, libreta };
      }
    }
    return {
      ok: false,
      mensaje:
        "Tus ubicaciones cambiaron en otra sesión. Actualiza la lista y vuelve a intentarlo.",
    };
  } catch (error) {
    return {
      ok: false,
      mensaje:
        error instanceof ErrorLibreta
          ? error.message
          : "No pudimos guardar tus ubicaciones. Inténtalo de nuevo.",
    };
  }
}
