import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { registrarEvento } from "./auditoria";

type Cliente = SupabaseClient<Database>;
type RolUsuario = Database["public"]["Enums"]["rol_usuario"];
type EstadoVerificacion = Database["public"]["Enums"]["estado_verificacion"];

// ============================================================================
// 1. FUNCIONES PURAS DE ENMASCARAMIENTO DE PII (CB-1 / T3 / CA-2)
// ============================================================================

/**
 * Enmascara un RFC dejando visibles los primeros 4 caracteres y los últimos 2 (ej. GODE••••••GR).
 * Si el RFC es inválido o muy corto, se oculta completamente.
 */
export function enmascararRfc(rfc?: string | null): string {
  if (!rfc) return "No registrado";
  const limpio = rfc.trim().toUpperCase();
  if (limpio.length < 10) return "••••••••••";
  const inicio = limpio.slice(0, 4);
  const fin = limpio.slice(-2);
  const asteriscos = "•".repeat(Math.max(4, limpio.length - 6));
  return `${inicio}${asteriscos}${fin}`;
}

/**
 * Enmascara un VIN (Número de Identificación Vehicular) dejando los primeros 3 (WMI)
 * y los últimos 4 dígitos (ej. 3VW••••••••••5432).
 */
export function enmascararVin(vin?: string | null): string {
  if (!vin) return "No registrado";
  const limpio = vin.trim().toUpperCase();
  if (limpio.length < 8) return "••••••••";
  const wmi = limpio.slice(0, 3);
  const fin = limpio.slice(-4);
  const asteriscos = "•".repeat(Math.max(6, limpio.length - 7));
  return `${wmi}${asteriscos}${fin}`;
}

/**
 * Enmascara un número telefónico mostrando código de país y los últimos 4 dígitos (ej. +52 •••••• 4321).
 */
export function enmascararTelefono(telefono?: string | null): string {
  if (!telefono) return "Sin teléfono registrado";
  const limpio = telefono.trim();
  const soloDigitos = limpio.replace(/\D/g, "");
  if (soloDigitos.length < 7) return "••••••••••";
  const ultimosCuatro = soloDigitos.slice(-4);
  const prefijo = limpio.startsWith("+") ? limpio.slice(0, 3) : "+52";
  return `${prefijo} •••••• ${ultimosCuatro}`;
}

/**
 * Enmascara o resume el crédito empresarial para no revelar límites bancarios ni saldos en claro.
 */
export function enmascararCreditoEmpresarial(empresa?: { credito_activo?: boolean; linea_credito?: number | null } | null): string {
  if (!empresa) return "Sin crédito corporativo";
  if (empresa.credito_activo) {
    return "Línea corporativa activa (Facturación mensual)";
  }
  return "Crédito corporativo no asignado";
}

/**
 * Enmascara la dirección completa para no sobreexponer calle y número interior en la vista general.
 */
export function enmascararDireccionResumen(usuario?: {
  colonia?: string | null;
  ciudad?: string | null;
  estado?: string | null;
  codigo_postal?: string | null;
} | null): string {
  if (!usuario) return "Dirección no registrada";
  const partes = [usuario.colonia, usuario.ciudad ?? usuario.estado, usuario.codigo_postal ? `CP ${usuario.codigo_postal}` : null].filter(Boolean);
  return partes.length > 0 ? partes.join(", ") : "Dirección no registrada";
}

// ============================================================================
// 2. CONTRATOS DE DTO POR SECCIÓN (CB-1 / T1, T2 / CA-1)
// ============================================================================

export interface SolicitudConductorResumenDTO {
  id: string;
  estado: string;
  pasoActual: number;
  enviadoEn: string | null;
  actualizadoEn: string;
  esPendiente: boolean;
}

export interface RolEfectivoCuentaDTO {
  rolEfectivo: RolUsuario | "conductor";
  rolBaseUsuario: RolUsuario;
  esConductorAprobado: boolean;
  estadoConductor: "sin_solicitud" | "solicitud_pendiente" | "conductor_activo" | "solicitud_rechazada";
  solicitudConductor: SolicitudConductorResumenDTO | null;
}

export interface IdentidadCuentaDTO {
  id: string;
  nombre: string;
  primerNombre: string;
  correo: string;
  telefonoEnmascarado: string;
  pais: string;
  estadoResidencia: string;
  ciudad: string;
  codigoPostal: string;
  direccionResumen: string;
  fotoPerfilUrl: string | null;
  estadoVerificacion: EstadoVerificacion;
  etiquetaVerificacion: string;
  creadoEn: string;
  rol: RolEfectivoCuentaDTO;
}

export interface VehiculoCuentaDTO {
  id: string;
  marca: string;
  modelo: string;
  anio: number | null;
  color: string | null;
  placas: string | null;
  vinEnmascarado: string;
  tipoVehiculo: string | null;
  activo: boolean;
}

export interface ActividadRecienteCuentaDTO {
  id: string;
  tipo: "traslado";
  titulo: string;
  fecha: string;
  fechaFormateada: string;
  estado: string;
  tono: "verde" | "azul" | "naranja" | "neutro";
  enlace: string;
}

export interface TrasladosResumenCuentaDTO {
  totalTraslados: number;
  incidenciasAbiertas: number;
  actividadesRecientes: ActividadRecienteCuentaDTO[];
}

export interface EmpresaCuentaDTO {
  id: string;
  nombreComercial: string;
  razonSocial: string;
  rfcEnmascarado: string;
  regimenFiscal: string | null;
  codigoPostalFiscal: string | null;
  creditoResumen: string;
}

export interface DocumentoCuentaDTO {
  id: string;
  tipo: string;
  estado: string;
  actualizadoEn: string;
  // CB-1 / CA-3: urlFirmada es estrictamente opcional y se resuelve bajo demanda
  urlFirmada?: string | null;
}

export interface CuentaUsuarioDTO {
  identidad: IdentidadCuentaDTO;
  vehiculos: VehiculoCuentaDTO[];
  empresa: EmpresaCuentaDTO | null;
  trasladosResumen: TrasladosResumenCuentaDTO;
  datosAuxiliaresCargados: boolean;
  auxiliaresConFallo?: string[];
}

// ============================================================================
// 3. RESOLUCIÓN DE ROL EFECTIVO (CB-2 / T5, T6 / CA-5, CA-6)
// ============================================================================

/**
 * Consulta la fuente de verdad del rol efectivo del usuario (CB-2 / T5, T6 / CA-5, CA-6).
 * Alineado con 'sin_rol' de F1 y transición autorizada de Flujo 13.
 * Identifica y visibiliza explícitamente el estado 'solicitud_conductor_pendiente'.
 */
export async function obtenerRolEfectivoUsuario(
  cliente: Cliente,
  authUserId: string
): Promise<RolEfectivoCuentaDTO> {
  // 1. Rol base en tabla usuarios
  const { data: usuario, error: errUsuario } = await cliente
    .from("usuarios")
    .select("id, rol")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (errUsuario) throw errUsuario;
  const rolBase: RolUsuario = usuario?.rol ?? "sin_rol";

  // 2. Comprobar si existe perfil activo de conductor (F13 completado)
  const { data: conductor, error: errConductor } = await cliente
    .from("conductores")
    .select("id, estado")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (errConductor) throw errConductor;
  const esConductorAprobado = Boolean(conductor && conductor.estado === "activo");

  // 3. Comprobar si existe solicitud de conductor (F13 en curso / pendiente)
  const { data: solicitud, error: errSol } = await cliente
    .from("solicitudes_conductor")
    .select("id, estado, paso_actual, enviado_en, actualizado_en")
    .eq("auth_user_id", authUserId)
    .order("actualizado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (errSol) throw errSol;

  let estadoConductor: RolEfectivoCuentaDTO["estadoConductor"] = "sin_solicitud";
  let solicitudResumen: SolicitudConductorResumenDTO | null = null;

  if (esConductorAprobado) {
    estadoConductor = "conductor_activo";
  } else if (solicitud) {
    const estadoRaw = String(solicitud.estado ?? "").toLowerCase();
    const esPendiente = ["en_revision", "borrador", "enviada", "pendiente"].includes(estadoRaw);
    if (esPendiente) {
      estadoConductor = "solicitud_pendiente";
    } else if (estadoRaw === "rechazada" || estadoRaw === "rechazado") {
      estadoConductor = "solicitud_rechazada";
    }
    solicitudResumen = {
      id: solicitud.id,
      estado: solicitud.estado,
      pasoActual: solicitud.paso_actual ?? 1,
      enviadoEn: solicitud.enviado_en,
      actualizadoEn: solicitud.actualizado_en,
      esPendiente,
    };
  }

  // Seguridad y principio de menor privilegio (F1 / F13 / CB-2):
  // El rol efectivo "conductor" ÚNICAMENTE se otorga si existe verificación operativa aprobada en F13
  // (conductores.estado === "activo"). Ningún valor en usuarios.rol puede conceder privilegios de conductor
  // por vía alterna sin aprobación de F13. Si usuarios.rol tuviera anómalamente "conductor" sin perfil activo,
  // se degrada a "sin_rol" o "personal" según corresponda.
  const rolBaseSeguro: RolUsuario = rolBase === ("conductor" as unknown as RolUsuario) ? "sin_rol" : rolBase;
  const rolEfectivo: RolUsuario | "conductor" = esConductorAprobado ? "conductor" : rolBaseSeguro;

  return {
    rolEfectivo,
    rolBaseUsuario: rolBaseSeguro,
    esConductorAprobado,
    estadoConductor,
    solicitudConductor: solicitudResumen,
  };
}

// ============================================================================
// 4. AUDITORÍA DE ACCESO A PII SENSIBLE (CB-1 / T11 / CA-4)
// ============================================================================

export async function registrarAuditoriaAccesoPii(
  cliente: Cliente,
  params: {
    usuarioId: string;
    tipoDato: "rfc" | "vin" | "telefono" | "documento" | "direccion_completa";
    campo: string;
    motivo?: string;
  }
): Promise<void> {
  try {
    await registrarEvento(
      cliente,
      "consulta_dato_sensible" as any,
      "usuario",
      params.usuarioId,
      {
        tipoDato: params.tipoDato,
        campo: params.campo,
        motivo: params.motivo ?? "consulta_bajo_demanda",
        timestamp: new Date().toISOString(),
      }
    );
  } catch (err) {
    console.warn("[cuenta/pii] fallo_registro_auditoria_pii", {
      tipoDato: params.tipoDato,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ============================================================================
// 5. CARGA ESTRUCTURADA DE CUENTA EN TRES NIVELES (CB-3 / T8, T9 / CA-8, CA-9)
// ============================================================================

/**
 * Obtiene la URL firmada de un documento sensible estrictamente bajo demanda (CB-1 / T4 / CA-3).
 * Registra auditoría de acceso para cumplimiento de PII.
 */
export async function obtenerUrlDocumentoBajoDemanda(
  cliente: Cliente,
  params: {
    usuarioId: string;
    storagePath: string;
    tipoDocumento: string;
    expiracionSegundos?: number;
  }
): Promise<string> {
  // Auditoría sin exponer el contenido del documento
  await registrarAuditoriaAccesoPii(cliente, {
    usuarioId: params.usuarioId,
    tipoDato: "documento",
    campo: params.tipoDocumento,
    motivo: "solicitud_url_firmada_bajo_demanda",
  });

  const { data, error } = await cliente.storage
    .from("documentos-identidad")
    .createSignedUrl(params.storagePath, params.expiracionSegundos ?? 900); // 15 minutos

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Carga el DTO completo de la cuenta aplicando:
 * 1. Nivel Esencial (Bloqueante): Identidad, rol efectivo y correo.
 * 2. Nivel Diferido (Resiliente): Promise.allSettled para vehículos, empresa y resumen de traslados.
 * 3. Nivel Bajo Demanda: Exclusión total de URLs firmadas y PII sensible en claro.
 */
export async function obtenerCuentaUsuarioDTO(
  cliente: Cliente,
  authUserId: string,
  correoRegistro?: string | null
): Promise<CuentaUsuarioDTO | null> {
  // 1. NIVEL ESENCIAL: Usuario y Rol Efectivo
  const { data: usuario, error: errUsuario } = await cliente
    .from("usuarios")
    .select(
      "id, nombre, telefono, pais, estado, ciudad, codigo_postal, colonia, calle, numero, foto_url, estado_verificacion, empresa_id, creado_en"
    )
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (errUsuario || !usuario) return null;

  const rolInfo = await obtenerRolEfectivoUsuario(cliente, authUserId);
  const nombreCompleto = usuario.nombre?.trim() || "Usuario";
  const primerNombre = nombreCompleto.split(/\s+/)[0] || "Usuario";

  const etiquetasVerificacion: Record<string, string> = {
    verificado: "Verificado",
    en_revision: "En revisión",
    rechazado: "Documentación rechazada",
    pendiente: "Pendiente de verificación",
  };

  const estadoVerif = (usuario.estado_verificacion ?? "pendiente") as EstadoVerificacion;

  const identidad: IdentidadCuentaDTO = {
    id: usuario.id,
    nombre: nombreCompleto,
    primerNombre,
    correo: correoRegistro?.trim() || "Sin correo registrado",
    telefonoEnmascarado: enmascararTelefono(usuario.telefono),
    pais: usuario.pais?.trim() || "México",
    estadoResidencia: usuario.estado?.trim() || "No registrado",
    ciudad: usuario.ciudad?.trim() || "No registrada",
    codigoPostal: usuario.codigo_postal?.trim() || "No registrado",
    direccionResumen: enmascararDireccionResumen(usuario),
    fotoPerfilUrl: usuario.foto_url ?? null,
    estadoVerificacion: estadoVerif,
    etiquetaVerificacion: etiquetasVerificacion[estadoVerif] ?? "Pendiente de verificación",
    creadoEn: usuario.creado_en,
    rol: rolInfo,
  };

  // 2. NIVEL DIFERIDO: Carga auxiliar resiliente con Promise.allSettled
  const [resVehiculos, resEmpresa, resTraslados] = await Promise.allSettled([
    // Vehículos del usuario (solo campos whitelisted)
    cliente
      .from("vehiculos")
      .select("id, marca, modelo, anio, color, placas, vin, tipo")
      .eq("usuario_id", usuario.id),

    // Empresa vinculada (si aplica)
    usuario.empresa_id
      ? cliente
          .from("empresas")
          .select("id, nombre, razon_social, rfc, regimen_fiscal, codigo_postal_fiscal, limite_credito_mxn, credito_disponible_mxn")
          .eq("id", usuario.empresa_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),

    // Resumen de traslados mínimos usando la vista pasaporte_digital
    cliente
      .from("pasaporte_digital")
      .select("traslado_id, estado, creado_en, vehiculo_marca, vehiculo_modelo, vehiculo_placas, incidencias_abiertas")
      .eq("usuario_id", usuario.id)
      .order("creado_en", { ascending: false })
      .limit(10),
  ]);

  const auxiliaresConFallo: string[] = [];

  // Procesamiento de Vehículos
  let vehiculos: VehiculoCuentaDTO[] = [];
  if (resVehiculos.status === "fulfilled" && !resVehiculos.value.error && resVehiculos.value.data) {
    vehiculos = resVehiculos.value.data.map((v) => ({
      id: v.id,
      marca: v.marca,
      modelo: v.modelo,
      anio: v.anio,
      color: v.color,
      placas: v.placas,
      vinEnmascarado: enmascararVin(v.vin),
      tipoVehiculo: v.tipo,
      activo: true,
    }));
  } else if (resVehiculos.status === "rejected" || (resVehiculos.status === "fulfilled" && resVehiculos.value.error)) {
    auxiliaresConFallo.push("vehiculos");
  }

  // Procesamiento de Empresa
  let empresa: EmpresaCuentaDTO | null = null;
  if (resEmpresa.status === "fulfilled" && !resEmpresa.value.error && resEmpresa.value.data) {
    const emp = resEmpresa.value.data;
    empresa = {
      id: emp.id,
      nombreComercial: emp.nombre?.trim() || emp.razon_social?.trim() || "Empresa",
      razonSocial: emp.razon_social?.trim() || "No registrada",
      rfcEnmascarado: enmascararRfc(emp.rfc),
      regimenFiscal: emp.regimen_fiscal?.trim() || null,
      codigoPostalFiscal: emp.codigo_postal_fiscal?.trim() || null,
      creditoResumen: enmascararCreditoEmpresarial({
        credito_activo: (emp.limite_credito_mxn ?? 0) > 0,
        linea_credito: emp.limite_credito_mxn,
      }),
    };
  } else if (resEmpresa.status === "rejected" || (resEmpresa.status === "fulfilled" && resEmpresa.value.error)) {
    auxiliaresConFallo.push("empresa");
  }

  // Procesamiento de Resumen de Traslados
  let totalTraslados = 0;
  let incidenciasAbiertas = 0;
  const actividadesRecientes: ActividadRecienteCuentaDTO[] = [];

  if (resTraslados.status === "fulfilled" && !resTraslados.value.error && resTraslados.value.data) {
    const filas = resTraslados.value.data;
    totalTraslados = filas.length;
    incidenciasAbiertas = filas.reduce((acc, t) => acc + (t.incidencias_abiertas ?? 0), 0);

    for (const t of filas.slice(0, 4)) {
      if (!t.traslado_id || !t.creado_en) continue;
      const titulo = [t.vehiculo_marca, t.vehiculo_modelo, t.vehiculo_placas].filter(Boolean).join(" · ") || `Traslado ${t.traslado_id.slice(0, 8).toUpperCase()}`;
      actividadesRecientes.push({
        id: t.traslado_id,
        tipo: "traslado",
        titulo,
        fecha: t.creado_en,
        fechaFormateada: new Intl.DateTimeFormat("es-MX", {
          timeZone: "America/Mexico_City",
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(t.creado_en)),
        estado: t.estado ?? "desconocido",
        tono: t.estado === "servicio_cerrado" ? "verde" : t.estado === "traslado_en_curso" ? "azul" : "neutro",
        enlace: `/viajes/${t.traslado_id}`,
      });
    }
  } else if (resTraslados.status === "rejected" || (resTraslados.status === "fulfilled" && resTraslados.value.error)) {
    auxiliaresConFallo.push("traslados");
  }

  return {
    identidad,
    vehiculos,
    empresa,
    trasladosResumen: {
      totalTraslados,
      incidenciasAbiertas,
      actividadesRecientes,
    },
    datosAuxiliaresCargados: auxiliaresConFallo.length === 0,
    auxiliaresConFallo: auxiliaresConFallo.length > 0 ? auxiliaresConFallo : undefined,
  };
}
