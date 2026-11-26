import type { Database } from "@ruum/shared/types";

export type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];
export type PagosRow = Database["public"]["Tables"]["pagos"]["Row"];
export type IncidenciaRow = Database["public"]["Tables"]["incidencias"]["Row"];
export type EmpresaRow = Database["public"]["Tables"]["empresas"]["Row"];
export type ViajeRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
export type FormatoExportacionPrivacidad = "json" | "csv" | "pdf";
export type BitacoraPrivacidad = { tipo: "exportacion" | "anonimizacion"; fecha: string; detalle: string };

export type Tab = "datos" | "Traslados" | "pagos" | "incidencias" | "sesiones" | "privacidad" | "auditoria";

export const ETIQUETA_VERIFICACION: Record<string, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  verificado: "Verificado",
  rechazado: "Rechazado"
};

export const ETIQUETA_ESTADO_CUENTA: Record<string, string> = {
  activa: "Activa",
  suspendida: "Suspendida",
  cerrada: "Cerrada"
};

export const TAB_ETIQUETAS: Record<Tab, string> = {
  datos: "Datos",
  Traslados: "Traslados",
  pagos: "Pagos",
  incidencias: "Incidencias",
  sesiones: "Sesiones",
  privacidad: "Privacidad",
  auditoria: "Auditoría"
};

export type ConteosTabs = Partial<Record<Tab, number | null>>;

export const TARJETAS_RESUMEN: Array<{ tab: Tab; etiqueta: string; icono: string }> = [
  { tab: "Traslados", etiqueta: "Traslados", icono: "↗" },
  { tab: "pagos", etiqueta: "Pagos", icono: "$" },
  { tab: "incidencias", etiqueta: "Incidencias", icono: "!" },
  { tab: "sesiones", etiqueta: "Sesiones", icono: "◎" },
  { tab: "auditoria", etiqueta: "Auditoría", icono: "✓" }
];

export function formatearTelefono(valor: string | null | undefined) {
  if (!valor) return null;
  const digitos = valor.replace(/\D/g, "");
  const nacional = digitos.length === 12 && digitos.startsWith("52") ? digitos.slice(2) : digitos;
  if (nacional.length !== 10) return valor;
  return `(${nacional.slice(0, 3)}) ${nacional.slice(3, 6)}-${nacional.slice(6)}`;
}

export function formatearFechaCompacta(fecha: string | null | undefined) {
  if (!fecha) return null;
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return null;
  return `${valor.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" })} ${valor.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
}

export function aTitleCase(valor: string | null | undefined) {
  if (!valor) return null;
  const palabrasMinusculas = new Set(["de", "del", "la", "las", "los", "y", "e"]);
  const acronimos = new Set(["sa", "s.a.", "cv", "c.v.", "rfc"]);
  return valor
    .toLocaleLowerCase("es-MX")
    .split(/(\s+)/)
    .map((parte, indice) => {
      if (/^\s+$/.test(parte)) return parte;
      if (acronimos.has(parte)) return parte.toLocaleUpperCase("es-MX");
      if (indice > 0 && palabrasMinusculas.has(parte)) return parte;
      return parte.charAt(0).toLocaleUpperCase("es-MX") + parte.slice(1);
    })
    .join("");
}

export function folioCorto(folio: string | null | undefined) {
  return folio ? folio.slice(0, 8) : "Sin folio";
}

export function formatearFechaOperativa(fecha: string | null | undefined) {
  if (!fecha) return "Sin fecha";
  const valor = new Date(fecha);
  return `${valor.toLocaleDateString("es-MX")} - ${valor.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} hrs`;
}

export function descripcionVehiculo(viaje: ViajeRow) {
  const partes = [viaje.vehiculo_marca, viaje.vehiculo_modelo, viaje.vehiculo_anio].filter(Boolean);
  return partes.length ? partes.join(" ") : null;
}

export function dinero(monto: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(monto);
}

export function tonoEstadoTraslado(estado: string | null | undefined): "neutral" | "info" | "success" | "warning" | "danger" {
  if (!estado) return "neutral";
  if (estado === "solicitud_creada" || estado === "cotizacion_generada") return "info";
  if (estado === "servicio_completado" || estado === "entrega_confirmada" || estado === "evidencia_final_completada") return "success";
  if (estado.includes("cancel") || estado.includes("fall") || estado.includes("incidencia") || estado === "rechazado") return "danger";
  if (estado.includes("traslado") || estado.includes("conductor") || estado.includes("proceso") || estado.includes("confirmado") || estado.includes("evidencia")) return "warning";
  return "neutral";
}

export function etiquetaEstadoTraslado(estado: string | null | undefined) {
  if (!estado) return "Sin estado";
  const etiquetas: Record<string, string> = {
    solicitud_creada: "Solicitud creada",
    cotizacion_generada: "Cotización generada",
    servicio_confirmado: "Servicio confirmado",
    pendiente_de_conductor: "Pendiente de conductor",
    conductor_asignado: "Conductor asignado",
    en_recoleccion: "En recolección",
    en_traslado: "En traslado",
    evidencia_inicial_en_proceso: "Evidencia inicial en proceso",
    evidencia_inicial_completada: "Evidencia inicial completada",
    evidencia_final_en_proceso: "Evidencia final en proceso",
    evidencia_final_completada: "Evidencia final completada",
    entrega_confirmada: "Entrega confirmada",
    servicio_completado: "Completado",
    cancelado: "Cancelado",
    cancelado_por_usuario: "Cancelado por usuario",
    cancelado_por_admin: "Cancelado por admin",
    incidencia: "Incidencia"
  };
  return etiquetas[estado] ?? aTitleCase(estado.replaceAll("_", " ")) ?? "Sin estado";
}

export function estadoDocumentoIdentidad(usuario: UsuarioRow): { estado: string; tono: "neutral" | "info" | "success" | "warning" | "danger"; detalle: string } {
  if (!usuario.doc_identidad_url && !usuario.doc_identidad_subido_en) {
    return { estado: "Sin documento", tono: "neutral", detalle: "No hay documento de identidad activo ni fecha de carga registrada." };
  }

  if (!usuario.doc_identidad_subido_en) {
    return { estado: usuario.doc_identidad_url ? "Activo" : "Sin documento", tono: usuario.doc_identidad_url ? "info" : "neutral", detalle: "El documento no tiene fecha de carga disponible para calcular retención." };
  }

  const carga = new Date(usuario.doc_identidad_subido_en);
  const vence = new Date(carga);
  vence.setDate(vence.getDate() + 90);
  const diasRestantes = Math.ceil((vence.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (!usuario.doc_identidad_url) {
    return { estado: "Sin documento activo", tono: "success", detalle: `Última retención calculada hasta ${vence.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}.` };
  }

  if (diasRestantes <= 0) {
    return { estado: "Retención vencida", tono: "danger", detalle: `Debe eliminarse o revisarse: venció el ${vence.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}.` };
  }

  return { estado: `Expira en ${diasRestantes} días`, tono: diasRestantes <= 15 ? "warning" : "info", detalle: `Documento de identidad cargado; eliminación automática prevista para ${vence.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}.` };
}
