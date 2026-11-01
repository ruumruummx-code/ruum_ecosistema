import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase-server";
import { obtenerUsuarioIdPorAuth } from "@ruum/api/identity";
import { listarInspeccionesTraslado } from "@ruum/api/drivers";
import { listarHistorialTraslado } from "@ruum/api/services";
import { listarEventosCustodia } from "@ruum/api/custody";
import { obtenerDatos } from "@/app/viajes/[id]/obtenerDatosTraslado";
import { generarPasaportePdf } from "@/lib/pasaporte-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({error:"Traslado no encontrado."},{status:404});
  const cliente = await crearClienteServidor();
  const { data: { user } } = await cliente.auth.getUser();
  if (!user) return NextResponse.json({error:"Inicia sesión para exportar."},{status:401});
  try {
    const perfil = await obtenerUsuarioIdPorAuth(cliente,user.id);
    const datos = await obtenerDatos(id);
    if (!perfil || !datos.pasaporte || datos.pasaporte.usuario_id !== perfil) return NextResponse.json({error:"Traslado no encontrado."},{status:404});
    const [inspecciones,historial,custodia] = await Promise.all([listarInspeccionesTraslado(cliente,id),listarHistorialTraslado(cliente,id),listarEventosCustodia(cliente,id)]);
    const origen = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
    let total = 0;
    const bytes = await generarPasaportePdf(datos,{inspecciones,historial,custodia},async url => {
      const destino = new URL(url);
      if (destino.origin !== origen || !destino.pathname.startsWith("/storage/v1/object/sign/")) throw new Error("No se pudo acceder a una evidencia del expediente.");
      const respuesta = await fetch(destino,{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)});
      if (!respuesta.ok || !respuesta.body) throw new Error("No se pudo descargar una evidencia. Reintenta la exportación.");
      const reader = respuesta.body.getReader();
      const partes: Uint8Array[] = []; let tamano = 0;
      try {
        while (true) {
          const {done,value} = await reader.read(); if (done) break;
          tamano += value.byteLength; total += value.byteLength;
          if (tamano > 15*1024*1024 || total > 100*1024*1024) throw new Error("El expediente excede el tamaño de exportación permitido.");
          partes.push(value);
        }
      } finally { await reader.cancel(); }
      const resultado = new Uint8Array(tamano); let offset = 0;
      for (const parte of partes) { resultado.set(parte,offset); offset += parte.byteLength; }
      return resultado;
    });
    // Stream the attachment so large photo packets are not buffered as one
    // platform response payload. Generate fully first: errors never yield a partial PDF.
    let offset = 0;
    const cuerpo = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (offset >= bytes.length) { controller.close(); return; }
        const fin = Math.min(offset + 64 * 1024, bytes.length);
        controller.enqueue(bytes.subarray(offset, fin));
        offset = fin;
      },
    });
    return new Response(cuerpo,{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="pasaporte-${id}.pdf"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  } catch (error) {
    return NextResponse.json({error:error instanceof Error ? error.message : "No pudimos generar el pasaporte completo."},{status:503,headers:{"Cache-Control":"private, no-store"}});
  }
}
