import type {EstadoEconomicoExplicito} from "@ruum/shared/constants";
export function estadoLiquidacion(payout:{estado:string;fecha_prevista?:string|null;pagado_en?:string|null;referencia_externa_validada?:string|null}):EstadoEconomicoExplicito {
  if(payout.estado==="procesado"&&payout.pagado_en&&Number.isFinite(Date.parse(payout.pagado_en))&&payout.referencia_externa_validada?.trim())return "pagado";
  if(payout.estado==="procesado")return "en_validacion";
  if(payout.estado==="pendiente")return payout.fecha_prevista?"programado":"confirmado";
  return "rechazado";
}
