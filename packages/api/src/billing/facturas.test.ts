import {describe,it,expect,vi} from "vitest";
import {facturaVerificable,solicitarFactura,type SolicitudFactura} from "./facturas";
const base:SolicitudFactura={id:"solicitud",estado:"emitida",uuid_fiscal:"10000000-0000-4000-8000-000000000001",xml_ruta:"fiscal/factura.xml",pdf_ruta:"fiscal/factura.pdf",proveedor_id:"provider-invoice",ambiente:"pruebas",error_detalle:null};
describe("RR-REAL-007 estados fiscales respaldados",()=>{
  it("no infiere emisión por traslado o pago concluido",()=>{expect(facturaVerificable(null)).toBe(false);expect(facturaVerificable({...base,estado:"rechazada"})).toBe(false);});
  it("exige UUID, archivos, identificador y ambiente",()=>{for(const key of ["uuid_fiscal","xml_ruta","pdf_ruta","proveedor_id","ambiente"] as const)expect(facturaVerificable({...base,[key]:null})).toBe(false);expect(facturaVerificable(base)).toBe(true);});
  it("la solicitud usa el resultado persistido, incluido rechazo",async()=>{
    const rechazo={...base,estado:"rechazada",error_detalle:"emision_no_configurada"};
    const rpc=vi.fn(async()=>({data:rechazo,error:null}));
    expect(await solicitarFactura({rpc} as never,"trip")).toEqual(rechazo);
    expect(rpc).toHaveBeenCalledWith("solicitar_factura_traslado",{p_traslado_id:"trip"});
  });
  it("un fallo del servidor no genera éxito local",async()=>{await expect(solicitarFactura({rpc:async()=>({data:null,error:new Error("database_unavailable")})} as never,"trip")).rejects.toThrow("database_unavailable");});
});
