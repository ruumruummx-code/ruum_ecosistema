// PRD §4.4 — ángulos mínimos obligatorios
export type AnguloEvidencia =
  | "frente"
  | "lado_piloto"
  | "lado_copiloto"
  | "trasera"
  | "tablero"
  | "dano_previo"
  | "adicional";

export type TipoEvidencia = "inicial" | "final";

export interface FotoEvidencia {
  id: string;
  traslado_id: string;
  tipo: TipoEvidencia;
  angulo: AnguloEvidencia;
  url?: string; // path en Storage; null/undefined si aún no sincronizada — PRD §4.15
  url_visual?: string | null; // URL firmada temporal para renderizar buckets privados
  local_path?: string; // PRD §4.15 — modo offline, almacenamiento local
  timestamp: string;
  lat?: number;
  lng?: number;
  sincronizada: boolean;
}

// PRD §4.4 — los 5 ángulos obligatorios para considerar evidencia completa
// (dano_previo y adicional son condicionales, no obligatorios por defecto)
export const ANGULOS_OBLIGATORIOS: AnguloEvidencia[] = [
  "frente",
  "lado_piloto",
  "lado_copiloto",
  "trasera",
  "tablero"
];

export const URL_PORTAL_REPUVE = "https://www2.repuve.gob.mx:8443/ciudadania/";

export type ResultadoVerificacionRepuveConductor =
  | "limpio"
  | "con_reporte_robo"
  | "con_aviso_recuperado"
  | "no_encontrado"
  | "error_portal";

export type ResultadoVerificacionRepuve =
  | ResultadoVerificacionRepuveConductor
  | "override_admin";

export type DictamenAuditoriaRepuve = "pendiente" | "aprobada" | "observada";

export type EstatusResumidoRepuve =
  | "pendiente"
  | "verificado_limpio"
  | "autorizado_por_soporte"
  | "en_revision_soporte";

export interface VerificacionRepuve {
  id: string;
  traslado_id: string;
  vehiculo_id: string;
  conductor_id: string | null;
  actor_rol: "conductor" | "admin";
  vin_esperado: string;
  placas_esperadas: string | null;
  vin_fisico: string;
  placas_fisicas: string | null;
  coincide_vin: boolean;
  coincide_placas: boolean;
  coincide: boolean;
  resultado: ResultadoVerificacionRepuve;
  captura_path: string | null;
  url_captura_firmada?: string | null;
  es_override_admin: boolean;
  motivo_override: string | null;
  autorizado_por_auth_id: string | null;
  requiere_auditoria: boolean;
  auditoria_dictamen: DictamenAuditoriaRepuve | null;
  auditoria_notas: string | null;
  auditoria_revisada_por: string | null;
  auditoria_revisada_en: string | null;
  creado_en: string;
}

export interface ResumenVerificacionRepuve {
  traslado_id: string;
  registrada: boolean;
  valida_para_avanzar: boolean;
  estatus_resumido: EstatusResumidoRepuve;
  coincide: boolean | null;
  actualizado_en: string | null;
}

export interface ResultadoRegistroVerificacionRepuve {
  id: string;
  traslado_id: string;
  coincide_vin: boolean;
  coincide_placas: boolean;
  coincide: boolean;
  resultado: ResultadoVerificacionRepuve;
  requiere_auditoria: boolean;
  puede_avanzar: boolean;
  creado_en: string;
}

