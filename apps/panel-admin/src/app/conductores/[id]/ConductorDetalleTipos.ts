import type { Database, Json } from "@ruum/shared/types";
import type { DetalleSolicitudConductorAdmin, EstadoDocumentoConductor } from "@ruum/api/services";

export type DocumentoRow = Database["public"]["Tables"]["documentos_conductor"]["Row"];
export type ConductorRow = Database["public"]["Tables"]["conductores"]["Row"];
export type EstadoSolicitud = Database["public"]["Enums"]["estado_expediente_conductor"];
export type { DetalleSolicitudConductorAdmin, EstadoDocumentoConductor };

export const DOCUMENTOS_REQUERIDOS = ["licencia_frente", "licencia_reverso", "identificacion_oficial"] as const;
export const CONSENTIMIENTOS_REQUERIDOS = ["terminos_servicio", "aviso_privacidad", "autorizacion_antecedentes", "declaracion_suspensiones"] as const;

export const MOTIVOS_SUSPENSION = [
  "Documentación vencida o inconsistente",
  "Incidencia operativa grave en revisión",
  "No presentación o cancelación sin justificación",
  "Contacto o datos críticos no verificados",
  "Solicitud de Torre de Control"
];

export const MOTIVOS_BAJA = [
  "Reincidencia en faltas operativas graves",
  "Documentación falsa o no verificable",
  "Uso indebido de la plataforma",
  "Riesgo de seguridad confirmado",
  "Solicitud formal del conductor"
];

export const ETIQUETA_DOCUMENTO: Record<string, string> = {
  licencia_frente: "Licencia frente",
  licencia_reverso: "Licencia reverso",
  identificacion_oficial: "Identificación oficial",
  documento_operativo: "Documento operativo adicional"
};

export const ETIQUETA_CONSENTIMIENTO: Record<string, string> = {
  terminos_servicio: "Términos de servicio",
  aviso_privacidad: "Aviso de privacidad",
  autorizacion_antecedentes: "Autorización de antecedentes",
  declaracion_suspensiones: "Declaración de no suspensión"
};

export const ETIQUETA_ESTADO: Record<EstadoSolicitud, string> = {
  borrador: "Borrador",
  correo_pendiente: "Correo pendiente",
  datos_incompletos: "Datos incompletos",
  documentos_pendientes: "Documentos pendientes",
  listo_para_enviar: "Lista para enviar",
  en_revision: "En revisión",
  requiere_correccion: "Requiere corrección",
  aprobado: "Aprobada",
  rechazado: "Rechazada",
  suspendido: "Suspendida"
};

export const ETIQUETA_DECISION: Record<string, string> = {
  registro_inicial: "Estado inicial",
  cambio_estado: "Cambio de estado",
  aprobar_documento: "Documento aprobado",
  rechazar_documento: "Documento rechazado",
  vencer_documento: "Documento vencido",
  solicitar_correccion: "Corrección solicitada",
  aprobar_solicitud: "Solicitud aprobada",
  rechazar_solicitud: "Solicitud rechazada"
};

export const ESTADO_DOCUMENTO: Record<string, { texto: string; clase: string }> = {
  en_revision: { texto: "En revisión", clase: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning" },
  aprobado: { texto: "Aprobado", clase: "border-ui-success/30 bg-ui-success-soft text-ui-success" },
  rechazado: { texto: "Solicitar corrección", clase: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger" },
  vencido: { texto: "Vencido", clase: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger" }
};

export const ESTADO_SOLICITUD_CLASE: Record<EstadoSolicitud, string> = {
  borrador: "border-ui-line bg-ui-brand/[0.04] text-ui-fg-muted",
  correo_pendiente: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning",
  datos_incompletos: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning",
  documentos_pendientes: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning",
  listo_para_enviar: "border-ui-brand/30 bg-ui-brand-soft text-ui-brand-soft-fg",
  en_revision: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning",
  requiere_correccion: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger",
  aprobado: "border-ui-success/30 bg-ui-success-soft text-ui-success",
  rechazado: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger",
  suspendido: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger"
};

export function textoJson(valor: Json, ...llaves: string[]) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const mapa = valor as Record<string, Json>;
  for (const llave of llaves) {
    const posible = mapa[llave];
    if (typeof posible === "string" && posible.trim().length > 0) return posible.trim();
  }
  return null;
}

export function fecha(valor: string | null) {
  if (!valor) return "-";
  return new Date(valor).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export function truncarHash(hash: string) {
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

export function diasParaVencer(fechaIso: string | null) {
  if (!fechaIso) return null;
  const objetivo = new Date(fechaIso).getTime();
  if (Number.isNaN(objetivo)) return null;
  return Math.ceil((objetivo - Date.now()) / (1000 * 60 * 60 * 24));
}

export function estadoVigencia(dias: number | null) {
  if (dias === null) {
    return {
      clase: "border-ui-line bg-ui-brand/[0.04] text-ui-fg-muted",
      punto: "bg-ui-fg-muted",
      etiqueta: "Sin fecha registrada"
    };
  }
  if (dias < 0) {
    return {
      clase: "border-ui-danger/25 bg-ui-danger-soft text-ui-danger",
      punto: "bg-ui-danger",
      etiqueta: `Vencida hace ${Math.abs(dias)} día(s)`
    };
  }
  if (dias <= 30) {
    return {
      clase: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning",
      punto: "bg-ui-warning",
      etiqueta: `Vence en ${dias} día(s)`
    };
  }
  return {
    clase: "border-ui-success/30 bg-ui-success-soft text-ui-success",
    punto: "bg-ui-success",
    etiqueta: `Vigente (${dias} días)`
  };
}

export function limpiarTelefono(valor: string | null) {
  if (!valor) return "";
  return valor.replace(/\D/g, "");
}

export function telefonoLlamada(valor: string | null | undefined) {
  const digitos = limpiarTelefono(valor ?? null);
  return digitos ? `tel:${digitos}` : null;
}

export function textoEstadoConductor(valor: string | null | undefined) {
  if (!valor) return "Sin alta";
  return valor.replace(/_/g, " ");
}

export function urlMapaDomicilio(datos: {
  calle: string;
  numero: string;
  colonia: string;
  ciudad_municipio: string;
  estado_residencia: string;
  codigo_postal: string;
}) {
  const partes = [datos.calle, datos.numero, datos.colonia, datos.ciudad_municipio, datos.estado_residencia, datos.codigo_postal]
    .map((parte) => parte.trim())
    .filter(Boolean);
  if (partes.length === 0) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partes.join(", "))}`;
}

export function telefonoWhatsapp(valor: string | null) {
  const digitos = limpiarTelefono(valor);
  if (!digitos) return null;
  if (digitos.startsWith("52")) return digitos;
  return digitos.length === 10 ? `52${digitos}` : digitos;
}

export function formatoPorcentaje(valor: number | null) {
  if (valor === null || Number.isNaN(valor)) return "Sin historial";
  return `${Math.round(valor)}%`;
}

export function etiquetaNivel(valor: string | null | undefined) {
  if (!valor) return "Por asignar";
  return valor.replace(/_/g, " ");
}

export function evaluarElegibilidad({
  conductor,
  documentosAprobados,
  diasVigencia
}: {
  conductor: ConductorRow | null;
  documentosAprobados: boolean;
  diasVigencia: number | null;
}) {
  if (!conductor) {
    return { elegible: false, tono: "warning" as const, texto: "En revisión", detalle: "Pendiente de aprobación administrativa." };
  }
  if (conductor.suspensiones_activas > 0) {
    return { elegible: false, tono: "danger" as const, texto: "No elegible", detalle: `Bloqueado por ${conductor.suspensiones_activas} penalización(es) activa(s).` };
  }
  if (conductor.estado !== "activo" && conductor.estado !== "modo_prueba_supervisada") {
    return { elegible: false, tono: "danger" as const, texto: "No elegible", detalle: `Estatus operativo: ${conductor.estado.replace(/_/g, " ")}.` };
  }
  if (!documentosAprobados || !conductor.documentos_vigentes) {
    return { elegible: false, tono: "warning" as const, texto: "No elegible", detalle: "Documentos requeridos incompletos o no vigentes." };
  }
  if (diasVigencia !== null && diasVigencia < 0) {
    return { elegible: false, tono: "danger" as const, texto: "No elegible", detalle: "Licencia vencida." };
  }
  if (diasVigencia !== null && diasVigencia <= 30) {
    return { elegible: false, tono: "warning" as const, texto: "No elegible", detalle: `Licencia por vencer en ${diasVigencia} día(s).` };
  }
  if (!conductor.nivel_operativo_vigente) {
    return { elegible: false, tono: "warning" as const, texto: "No elegible", detalle: "Nivel operativo CONCER pendiente." };
  }
  return { elegible: true, tono: "success" as const, texto: "Elegible para asignación", detalle: `Nivel ${etiquetaNivel(conductor.nivel_operativo_vigente)} vigente.` };
}

export function esDocumentoVisible(documento: DocumentoRow) {
  return /\.(png|jpe?g|webp|gif|pdf)$/i.test(documento.nombre_archivo) || /\.(png|jpe?g|webp|gif|pdf)$/i.test(documento.url);
}
