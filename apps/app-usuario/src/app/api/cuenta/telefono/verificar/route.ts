import { NextRequest, NextResponse } from "next/server";
import { validarSesionYRolUsuario } from "@/lib/guardia-rol-usuario";
import { crearClienteServicio } from "@/lib/supabase-servicio";
import { verificarCsrfORechazar } from "@/lib/csrf";
import { consumirTokenTelefono } from "@/lib/phone-verification";
import { soloDigitos } from "@/lib/registro-usuario";
import { logStructuredWarn } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Marca como verificado el teléfono de una cuenta creada mientras la
 * verificación SMS estuvo suspendida. Recibe el token firmado que emite
 * /api/auth/phone-verify/verify para el MISMO teléfono de la cuenta; el token
 * es de un solo uso. Sin esta verificación /api/viajes rechaza el primer
 * traslado (`telefono_no_verificado`).
 */
export async function POST(request: NextRequest) {
  const rechazoCsrf = verificarCsrfORechazar(request);
  if (rechazoCsrf) return rechazoCsrf;

  const auth = await validarSesionYRolUsuario();
  if (!auth.ok) return auth.errorResponse;
  const { user } = auth;

  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token : "";
  const telefono = soloDigitos(String(user.user_metadata?.telefono ?? ""), 15).slice(-10);
  if (telefono.length !== 10) {
    return NextResponse.json({ error: "Tu cuenta no tiene un teléfono registrado. Contacta a Soporte." }, { status: 409 });
  }

  const verificacion = await consumirTokenTelefono(telefono, token);
  if (!verificacion.valido) {
    return NextResponse.json({ error: verificacion.error ?? "No pudimos validar la verificación." }, { status: 400 });
  }

  try {
    const servicio = crearClienteServicio();
    const { error } = await servicio.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, telefono_verificado: true, telefono_verificado_en: new Date().toISOString() },
    });
    if (error) throw error;
  } catch (err) {
    logStructuredWarn("api/cuenta/telefono", "actualizar_telefono_verificado_fallido", err);
    return NextResponse.json({ error: "No pudimos guardar la verificación. Intenta de nuevo." }, { status: 503 });
  }

  // Refresca el JWT para que user_metadata refleje el cambio de inmediato.
  await cliente.auth.refreshSession().catch(() => undefined);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405, headers: { Allow: "POST" } });
}
