import type { SupabaseClient } from "@supabase/supabase-js";
export interface SolicitudFactura {
  id: string; estado: "solicitada"|"en_proceso"|"rechazada"|"emitida";
  error_detalle: string|null; uuid_fiscal: string|null; xml_ruta: string|null; pdf_ruta: string|null;
  proveedor_id: string|null; ambiente: "pruebas"|"produccion"|null;
}
export function facturaVerificable(solicitud:SolicitudFactura|null):boolean {
  return Boolean(solicitud?.estado==="emitida"&&solicitud.uuid_fiscal&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(solicitud.uuid_fiscal)
    &&solicitud.xml_ruta&&solicitud.pdf_ruta&&solicitud.proveedor_id&&solicitud.ambiente);
}
export async function consultarTotalDefinitivo(cliente: SupabaseClient, trasladoId: string): Promise<{total:number;fuente:string}|null> {
  const {data,error}=await cliente.from("totales_definitivos_traslado").select("total,fuente").eq("traslado_id",trasladoId).maybeSingle();
  if(error)throw error;return data;
}
export async function consultarSolicitudFactura(cliente: SupabaseClient, trasladoId: string): Promise<SolicitudFactura|null> {
  const {data,error}=await cliente.from("solicitudes_factura").select("*").eq("traslado_id",trasladoId).maybeSingle();
  if(error)throw error;return data;
}
export async function solicitarFactura(cliente: SupabaseClient, trasladoId: string): Promise<SolicitudFactura> {
  const {data,error}=await cliente.rpc("solicitar_factura_traslado",{p_traslado_id:trasladoId});
  if(error)throw error;if(!data)throw new Error("No se guardó la solicitud de factura.");return data;
}
