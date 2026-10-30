"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {consultarSolicitudFactura,consultarTotalDefinitivo,solicitarFactura,facturaVerificable,type SolicitudFactura} from "@ruum/api/billing";
import {crearClienteNavegador} from "@/lib/supabase-browser";
export function FacturacionTraslado({trasladoId}:{trasladoId:string}) {
  const [solicitud,setSolicitud]=useState<SolicitudFactura|null>(null),[error,setError]=useState("");
  const [ocupado,setOcupado]=useState(false),[cargando,setCargando]=useState(true);
  const [total,setTotal]=useState<{total:number;fuente:string}|null>(null);
  useEffect(()=>{let activo=true;const cliente=crearClienteNavegador();void Promise.all([consultarSolicitudFactura(cliente,trasladoId),consultarTotalDefinitivo(cliente,trasladoId)]).then(([data,cierre])=>{if(activo){setSolicitud(data);setTotal(cierre);}}).catch(()=>{if(activo)setError("No se pudo consultar la solicitud fiscal o el total definitivo.");}).finally(()=>{if(activo)setCargando(false);});return()=>{activo=false;};},[trasladoId]);
  async function solicitar(){if(ocupado)return;setOcupado(true);setError("");try{setSolicitud(await solicitarFactura(crearClienteNavegador(),trasladoId));}catch(err){setError((err as {message?:string}).message??"No se pudo guardar la solicitud.");}finally{setOcupado(false);}}
  const emitida=facturaVerificable(solicitud);
  return <section className="mt-6 rounded-xl border p-4" aria-label="Factura fiscal"><h2 className="font-bold">Factura fiscal</h2>
    <p>El pago del servicio no equivale a una factura emitida.</p>
    {total&&<p>Total definitivo del servicio: {new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(total.total)} · Fuente: {total.fuente.replaceAll("_"," ")}</p>}
    {emitida&&solicitud?<p>Factura emitida · UUID {solicitud.uuid_fiscal} · Ambiente {solicitud.ambiente}</p>:<p>{solicitud?.estado==="solicitada"?"Solicitud registrada; emisión pendiente.":solicitud?.estado==="en_proceso"?"Emisión en proceso; aún no hay comprobante fiscal.":"Facturación pendiente/no ejercitada."}</p>}
    {solicitud?.error_detalle&&<p role="alert">{solicitud.error_detalle}</p>}{error&&<p role="alert">{error}</p>}
    <Link href="/cuenta/facturacion">Revisar datos fiscales</Link>
    {!emitida&&<button type="button" className="ml-4 rounded border px-3 py-2" disabled={ocupado||cargando||solicitud?.estado==="solicitada"||solicitud?.estado==="en_proceso"} onClick={()=>void solicitar()}>{ocupado?"Guardando solicitud…":"Solicitar factura"}</button>}
  </section>;
}
