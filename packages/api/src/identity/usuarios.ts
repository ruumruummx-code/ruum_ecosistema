import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@ruum/shared/types";
import { assertAdminAnyPermission, assertAdminPermission } from "../services/permisos-admin";

type Cliente = SupabaseClient<Database>;
type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];
type EstadoVerificacion = Database["public"]["Enums"]["estado_verificacion"];
type PagoRow = Database["public"]["Tables"]["pagos"]["Row"];
type IncidenciaRow = Database["public"]["Tables"]["incidencias"]["Row"];
type EmpresaRow = Database["public"]["Tables"]["empresas"]["Row"];

export async function listarUsuariosAdmin(cliente: Cliente): Promise<UsuarioRow[]> {
  await assertAdminPermission(cliente, "usuarios:leer");
  const { data, error } = await cliente.from("usuarios").select("*").order("creado_en", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function validarDocumentoUsuario(
  cliente: Cliente,
  usuarioId: string,
  estadoVerificacion: EstadoVerificacion,
  motivo?: string
) {
  await assertAdminPermission(cliente, "usuarios:validar");
  const rpc = cliente.rpc.bind(cliente) as unknown as (
    fn: "admin_actualiza_usuario_verificacion",
    args: { p_usuario_id: string; p_estado: EstadoVerificacion; p_motivo: string | null }
  ) => Promise<{ error: Error | null }>;
  const { error } = await rpc("admin_actualiza_usuario_verificacion", {
    p_usuario_id: usuarioId,
    p_estado: estadoVerificacion,
    p_motivo: motivo?.trim() || null
  });
  if (error) throw error;
}

export async function obtenerUrlDocumentoIdentidadUsuario(
  cliente: Cliente,
  storagePath: string,
  expiracionSegundos = 1800
): Promise<string> {
  await assertAdminPermission(cliente, "usuarios:leer");
  const { data, error } = await cliente.storage
    .from("documentos-identidad")
    .createSignedUrl(storagePath, expiracionSegundos);
  if (error) throw error;
  return data.signedUrl;
}

export async function obtenerUsuarioAdmin(cliente: Cliente, usuarioId: string): Promise<UsuarioRow | null> {
  await assertAdminPermission(cliente, "usuarios:leer");
  const { data, error } = await cliente.from("usuarios").select("*").eq("id", usuarioId).maybeSingle();
  if (error) throw error;
  return data;
}

export type UsuarioActualizableAdmin = Pick<
  Database["public"]["Tables"]["usuarios"]["Update"],
  "nombre" | "telefono" | "correo_facturacion" | "pais" | "estado" | "ciudad" | "codigo_postal" | "colonia" | "calle" | "numero" | "direccion_principal" | "foto_url"
>;

export async function actualizarUsuarioAdmin(cliente: Cliente, usuarioId: string, datos: UsuarioActualizableAdmin): Promise<UsuarioRow> {
  await assertAdminPermission(cliente, "usuarios:validar");
  const rpc = cliente.rpc.bind(cliente) as unknown as (
    fn: "admin_actualizar_usuario_atomic",
    args: { p_usuario_id: string; p_datos: UsuarioActualizableAdmin }
  ) => Promise<{ error: unknown }>;
  const { error } = await rpc("admin_actualizar_usuario_atomic", { p_usuario_id: usuarioId, p_datos: datos });
  if (error) throw error;
  const { data, error: errorLectura } = await cliente.from("usuarios").select("*").eq("id", usuarioId).single();
  if (errorLectura) throw errorLectura;
  return data;
}

export async function cambiarAccesoAuthAdmin(
  cliente: Cliente,
  recurso: "usuario" | "conductor",
  id: string,
  accion: "suspender" | "reactivar" | "baja",
  motivo: string
) {
  const { data: sesion } = await cliente.auth.getSession();
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (sesion.session?.access_token) headers.authorization = `Bearer ${sesion.session.access_token}`;
  const respuesta = await fetch("/api/admin-auth/estado-acceso", {
    method: "POST",
    headers,
    body: JSON.stringify({ recurso, id, accion, motivo })
  });
  if (respuesta.ok) return;
  const payload = await respuesta.json().catch(() => ({})) as { mensaje?: string; error?: string };
  throw new Error(payload.mensaje ?? payload.error ?? "No se pudo actualizar el acceso Auth.");
}

export async function suspenderUsuarioAdmin(cliente: Cliente, usuarioId: string, motivo: string): Promise<void> {
  await assertAdminPermission(cliente, "usuarios:validar");
  await cambiarAccesoAuthAdmin(cliente, "usuario", usuarioId, "suspender", motivo);
}

export async function reactivarUsuarioAdmin(cliente: Cliente, usuarioId: string, motivo: string): Promise<void> {
  await assertAdminPermission(cliente, "usuarios:validar");
  await cambiarAccesoAuthAdmin(cliente, "usuario", usuarioId, "reactivar", motivo);
}

export async function cerrarCuentaUsuarioAdmin(cliente: Cliente, usuarioId: string, motivo: string): Promise<void> {
  await assertAdminPermission(cliente, "usuarios:validar");
  await cambiarAccesoAuthAdmin(cliente, "usuario", usuarioId, "baja", motivo);
}

export async function listarSesionesUsuario(cliente: Cliente, usuarioId: string): Promise<Array<{ id: string; creada_en: string; ultimo_acceso: string | null; agente_usuario: string | null; direccion_ip: string | null; activa: boolean }>> {
  await assertAdminPermission(cliente, "usuarios:leer");
  if (!usuarioId) return [];
  const { data: usuario } = await cliente.from("usuarios").select("auth_user_id").eq("id", usuarioId).maybeSingle();
  if (!usuario?.auth_user_id) return [];

  const { data: sesiones } = await (cliente as unknown as { from: (t: string) => any }).from("sesiones_usuario").select("*").eq("auth_user_id", usuario.auth_user_id).order("creada_en", { ascending: false }) as unknown as { data: Array<{ id: string; creada_en: string; ultimo_acceso: string | null; agente_usuario: string | null; direccion_ip: string | null; activa: boolean | null }> | null };
  if (!sesiones) return [];
  return (sesiones as Array<{ id: string; creada_en: string; ultimo_acceso: string | null; agente_usuario: string | null; direccion_ip: string | null; activa: boolean }>).map((s) => ({
    ...s,
    activa: s.activa ?? false
  }));
}

export async function revocarSesionUsuario(cliente: Cliente, sesionId: string): Promise<void> {
  await assertAdminPermission(cliente, "usuarios:validar");
  throw new Error(`La revocacion individual de sesion ${sesionId} no se puede confirmar contra Supabase Auth. Suspende la cuenta para revocar el acceso real.`);
}

export async function listarPagosDeUsuario(cliente: Cliente, usuarioId: string): Promise<PagoRow[]> {
  await assertAdminPermission(cliente, "pagos:leer");
  const { data, error } = await (cliente as unknown as { from: (t: string) => any }).from("pagos").select("*").eq("usuario_id", usuarioId).order("creado_en", { ascending: false }) as unknown as { data: PagoRow[] | null; error: unknown };
  if (error) throw error;
  return data ?? [];
}

export async function listarIncidenciasDeUsuario(cliente: Cliente, usuarioId: string): Promise<IncidenciaRow[]> {
  await assertAdminPermission(cliente, "incidencias:leer");
  const { data, error } = await (cliente as unknown as { from: (t: string) => any }).from("incidencias").select("*").eq("usuario_id", usuarioId).order("creada_en", { ascending: false }) as unknown as { data: IncidenciaRow[] | null; error: unknown };
  if (error) throw error;
  return data ?? [];
}

export async function listarEmpresasDeUsuario(cliente: Cliente, usuarioId: string): Promise<EmpresaRow[]> {
  await assertAdminPermission(cliente, "empresas:leer");
  const { data: usuario } = await cliente.from("usuarios").select("empresa_id").eq("id", usuarioId).maybeSingle();
  if (!usuario?.empresa_id) return [];
  const { data, error } = await cliente.from("empresas").select("*").eq("id", usuario.empresa_id);
  if (error) throw error;
  return data ?? [];
}

export async function obtenerAuditoriaUsuario(cliente: Cliente, usuarioId: string): Promise<Array<{ evento: string; creado_en: string; datos: Record<string, unknown> | null }>> {
  await assertAdminPermission(cliente, "usuarios:leer");
  const { data, error } = await cliente
    .from("registro_auditoria")
    .select("evento, timestamp, datos")
    .eq("actor_id", usuarioId)
    .order("timestamp", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((r: { evento: string; timestamp: string; datos: unknown }) => ({
    evento: r.evento,
    creado_en: r.timestamp,
    datos: r.datos as Record<string, unknown> | null
  }));
}

/** PRD §17.5 — lista paginada de usuarios. */

export interface PaginacionUsuarios {
  data: UsuarioRow[];
  paginacion: { pagina: number; tamano: number; total: number; total_paginas: number };
}

export async function listarUsuariosAdminPaginados(
  cliente: Cliente,
  pagina: number,
  tamano: number,
  busqueda?: string
): Promise<PaginacionUsuarios> {
  await assertAdminPermission(cliente, "usuarios:leer");
  const rpc = cliente.rpc.bind(cliente) as unknown as (
    fn: "listar_usuarios_admin_paginados",
    args: { p_pagina: number; p_tamano: number; p_busqueda: string | null }
  ) => Promise<{ data: PaginacionUsuarios | null; error: unknown }>;
  const { data, error } = await rpc("listar_usuarios_admin_paginados", {
    p_pagina: pagina,
    p_tamano: tamano,
    p_busqueda: busqueda?.trim() || null
  });
  if (error) throw error;
  if (!data) return { data: [], paginacion: { pagina: 1, tamano: 25, total: 0, total_paginas: 0 } };
  return data;
}

export async function invitarUsuarioAdmin(
  cliente: Cliente,
  datos: { correo: string; nombre?: string | null; tipoCuenta: "personal" | "empresa"; perfilEmpresa?: "administrador_flota" | "usuario_final" | "finanzas" }
): Promise<string> {
  await assertAdminPermission(cliente, "usuarios:validar");
  const respuesta = await fetch("/api/admin-auth/invitar-usuario", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(datos)
  });
  const payload = await respuesta.json().catch(() => ({})) as { usuarioId?: string; mensaje?: string; error?: string };
  if (!respuesta.ok || !payload.usuarioId) {
    throw new Error(payload.mensaje ?? payload.error ?? "No se pudo enviar la invitacion real.");
  }
  return payload.usuarioId;
}

/**
 * FASE 6 — Frontera de estado de cuenta (ruta estado-acceso): cambia entre
 * activa/suspendida/cerrada. Solo la forma del RPC vive aquí.
 */
export async function actualizarEstadoCuentaUsuario(
  cliente: Cliente,
  params: { usuarioId: string; estado: string; motivo: string | null }
): Promise<void> {
  const { error } = await cliente.rpc("admin_actualizar_estado_cuenta_usuario" as never, {
    p_usuario_id: params.usuarioId,
    p_estado: params.estado,
    p_motivo: params.motivo
  } as never);
  if (error) throw error;
}

/** FASE 6 cierre — resuelve public.usuarios.id desde auth.users.id bajo RLS. */
export async function obtenerUsuarioIdPorAuth(cliente: Cliente, authUserId: string): Promise<string | null> {
  const { data, error } = await cliente.from("usuarios").select("id").eq("auth_user_id", authUserId).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/**
 * FIX C1 (ticket seguridad Fase 2) + fronteras FASE 6: clasifica el rol de una
 * identidad Auth para el middleware de app-usuario, SIN que la app toque
 * PostgREST directamente (check-fronteras exige 0 `.from` en apps/*).
 * Un JWT válido de conductor no tiene fila en `usuarios` pero sí en
 * `conductores`; sin este gate entraba a /viajes/*, /cuenta, etc.
 */
export type RolApp = "usuario" | "conductor" | "ninguno";

export async function clasificarRolApp(cliente: Cliente, authUserId: string): Promise<RolApp> {
  const { data: perfilUsuario, error: errorUsuario } = await cliente
    .from("usuarios")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (errorUsuario) throw errorUsuario;
  if (perfilUsuario) return "usuario";

  const { data: perfilConductor, error: errorConductor } = await cliente
    .from("conductores")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (errorConductor) throw errorConductor;
  return perfilConductor ? "conductor" : "ninguno";
}

/** FASE 6 cierre — contacto mínimo visible por RLS para un traslado asignado. */
export async function obtenerContactoUsuarioVisible(cliente: Cliente, usuarioId: string): Promise<{ nombre: string | null; telefono: string | null } | null> {
  const { data, error } = await cliente.from("usuarios").select("nombre,telefono").eq("id", usuarioId).maybeSingle();
  if (error) throw error;
  return data;
}


/**
 * FASE 6 — Preferencias de usuario (libreta de ubicaciones, etc.) bajo frontera arquitectónica.
 */
export interface UsuarioPreferenciasRow {
  id: string;
  preferencias: Json | null;
  actualizado_en: string;
}

export async function obtenerPreferenciasUsuarioPorAuth(
  cliente: Cliente,
  authUserId: string
): Promise<UsuarioPreferenciasRow | null> {
  const { data, error } = await cliente
    .from("usuarios")
    .select("id, preferencias, actualizado_en")
    .eq("auth_user_id", authUserId)
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarPreferenciasUsuarioOptimista(
  cliente: Cliente,
  params: {
    id: string;
    authUserId: string;
    actualizadoEnPrevio: string;
    preferencias: NonNullable<Json>;
    nuevoTimestamp: string;
  }
): Promise<{ id: string } | null> {
  const { data, error } = await cliente
    .from("usuarios")
    .update({
      preferencias: params.preferencias,
      actualizado_en: params.nuevoTimestamp
    })
    .eq("id", params.id)
    .eq("auth_user_id", params.authUserId)
    .eq("actualizado_en", params.actualizadoEnPrevio)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return data;
}
