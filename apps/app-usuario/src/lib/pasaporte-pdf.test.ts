import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { generarPasaportePdf, type AnexosPasaporte } from "./pasaporte-pdf";
import type { DatosTraslado } from "@/app/viajes/[id]/obtenerDatosTraslado";
const fotoPng = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=","base64"));
const base = {
 pasaporte:{traslado_id:"12345678-1234-4234-8234-123456789abc",estado:"disputa_abierta",estado_operativo:"closed",cerrado_en:"2026-10-30T17:00:00Z",vehiculo_marca:"Unidad de prueba",vehiculo_modelo:"Sedán",vehiculo_anio:2026,vehiculo_placas:"DEMO123",vehiculo_vin:"VIN-SINTETICO",conductor_nombre:"Conductor de prueba",origen_direccion:"Origen de demostración",destino_direccion:"Destino de demostración",precio_cotizado:1000,precio_final:1000,monto_pagado:1000},
 traslado:{fecha_hora_programada:"2026-10-30T14:00:00Z"},vehiculo:null,conductor:null,
 evidencia:["inicial","final"].map((tipo,i)=>({id:`foto-${i}`,tipo,angulo:"frente",url_visual:`https://signed.example/${i}`,capturada_en:"2026-10-30T16:00:00Z",sincronizada:true,conflicto:false})),
 incidencias:[],disputas:[{tipo:"dano_no_reconocido",estado:"abierta",abierta_en:"2026-10-30T18:00:00Z",descripcion:"Reporte sintético para verificar la exportación. "+"Descripción larga ".repeat(80)}],reclamosSeguro:[],calificacion:null,pagos:[],ultimaUbicacion:null,
} as unknown as DatosTraslado;
const anexos = {inspecciones:[{tipo:"inicial",kilometraje:1000,combustible:"1/2",llaves_recibidas:"1"},{tipo:"final",kilometraje:1010,combustible:"1/2",llaves_recibidas:"1"}],historial:[{creado_en:"2026-10-30T17:00:00Z",estado_anterior:"entrega_confirmada",estado_nuevo:"servicio_cerrado",actor_tipo:"conductor"}],custodia:[]} as unknown as AnexosPasaporte;
it("incorpora todas las fotografías y pagina el expediente completo",async()=>{
 const urls:string[]=[];
 const bytes=await generarPasaportePdf(base,anexos,async url=>{urls.push(url);return fotoPng;});
 expect(urls).toHaveLength(2);
 const pdf=await PDFDocument.load(bytes); expect(pdf.getPageCount()).toBeGreaterThanOrEqual(5);
 expect(pdf.getTitle()).toContain(base.pasaporte!.traslado_id);
 if (process.env.RUUM_PDF_QA === "1") { const {writeFile}=await import("node:fs/promises"); await writeFile("/tmp/ruum-pasaporte-qa.pdf",bytes); }
});
it("no produce una exportación completa cuando una foto no es accesible",async()=>{
 await expect(generarPasaportePdf({...base,evidencia:base.evidencia.map(f=>({...f,url_visual:null}))},anexos,async()=>fotoPng)).rejects.toThrow("evidencias sin acceso");
});
it("no omite silenciosamente formatos de evidencia no compatibles",async()=>{
 await expect(generarPasaportePdf(base,anexos,async()=>new Uint8Array([1,2,3]))).rejects.toThrow("no es JPG o PNG");
});
