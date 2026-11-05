import { consultarPermisoTarifaTraslado } from "@ruum/api/transfers";
import { NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase-server";
import { obtenerUsuarioIdPorAuth } from "@ruum/api/identity";
import { listarInspeccionesTraslado } from "@ruum/api/drivers";
import { listarHistorialTraslado } from "@ruum/api/services";
import { listarEventosCustodia } from "@ruum/api/custody";
import { obtenerDatos } from "@/app/viajes/[id]/obtenerDatosTraslado";
import { generarPasaportePdf } from "@/lib/pasaporte-pdf";
import {
  ejecutarConSemaforoPdf,
  SemaforoPdfOcupadoError,
} from "@/lib/pdf-concurrency-semaphore";
import { logStructuredWarn } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Constantes contractuales de resiliencia y anti-OOM (CB-2 / T6, T7)
const MAX_BYTES_POR_IMAGEN = 5 * 1024 * 1024; // 5 MB
const MAX_BYTES_TOTAL_IMAGENES = 30 * 1024 * 1024; // 30 MB
const TIMEOUT_DESCARGA_MS = 3500; // 3.5 segundos

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Validación UUID sintáctica (anti-IDOR: rechaza formatos ajenos sin filtrar existencia)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Traslado no encontrado." }, { status: 404 });
  }

  const cliente = await crearClienteServidor();
  const { data: { user } } = await cliente.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para exportar." }, { status: 401 });
  }

  try {
    // CB-3 / T9 / CA-7: Ownership/RLS estricto verificado contra sesión
    const perfil = await obtenerUsuarioIdPorAuth(cliente, user.id);
    const datos = await obtenerDatos(id);

    if (!perfil || !datos.pasaporte || datos.pasaporte.usuario_id !== perfil) {
      // Anti-IDOR: responde 404 unificado (no filtra si el registro existe para otro usuario)
      return NextResponse.json({ error: "Traslado no encontrado." }, { status: 404 });
    }

    // CB-3 / T10 / CA-8: Verificación fail-closed de permisos de tarifa
    let puedeVerTarifa = false;
    try {
      const { data: tienePermiso, error: rpcError } = await consultarPermisoTarifaTraslado(cliente, datos.pasaporte.usuario_id);
      puedeVerTarifa = !rpcError && tienePermiso === true;
    } catch (err) {
      logStructuredWarn("pasaporte/route", "verificar_tarifa_fallido_fail_closed", err, {
        trasladoId: id,
      });
      puedeVerTarifa = false;
    }

    // CB-2 / T8 / CA-4 / CA-11: Adquisición de semáforo global inter-petición
    return await ejecutarConSemaforoPdf(async () => {
      const [inspecciones, historial, custodia] = await Promise.all([
        listarInspeccionesTraslado(cliente, id),
        listarHistorialTraslado(cliente, id),
        listarEventosCustodia(cliente, id),
      ]);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const origenPermitido = supabaseUrl ? new URL(supabaseUrl).origin : "";
      let totalDescargado = 0;

      // Generación segura del documento: errores en fotos se degradan a placeholder sin abortar
      const bytes = await generarPasaportePdf(
        datos,
        { inspecciones, historial, custodia },
        async (url: string): Promise<Uint8Array | null> => {
          let destino: URL;
          try {
            destino = new URL(url);
          } catch {
            logStructuredWarn("pasaporte/route", "url_evidencia_malformada", null, {
              trasladoId: id,
            });
            return null;
          }

          // CA-6 / SSRF: solo se admiten peticiones al bucket firmado de Supabase Storage configurado
          if (
            !origenPermitido ||
            destino.origin !== origenPermitido ||
            !destino.pathname.startsWith("/storage/v1/object/sign/")
          ) {
            logStructuredWarn("pasaporte/route", "ssrf_evidencia_bloqueada", null, {
              trasladoId: id,
              destino: destino.origin,
            });
            return null; // Degrada a placeholder seguro sin tumbar el expediente
          }

          // CA-5: Descarga con timeout y límites estrictos de memoria por imagen y total
          try {
            const respuesta = await fetch(destino, {
              cache: "no-store",
              redirect: "error",
              signal: AbortSignal.timeout(TIMEOUT_DESCARGA_MS),
            });

            if (!respuesta.ok || !respuesta.body) {
              return null;
            }

            const reader = respuesta.body.getReader();
            const partes: Uint8Array[] = [];
            let tamanoImagen = 0;

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                tamanoImagen += value.byteLength;
                totalDescargado += value.byteLength;

                if (
                  tamanoImagen > MAX_BYTES_POR_IMAGEN ||
                  totalDescargado > MAX_BYTES_TOTAL_IMAGENES
                ) {
                  logStructuredWarn("pasaporte/route", "evidencia_excede_tamano_maximo", null, {
                    trasladoId: id,
                    tamanoImagen,
                    totalDescargado,
                  });
                  return null;
                }
                partes.push(value);
              }
            } finally {
              await reader.cancel();
            }

            const resultado = new Uint8Array(tamanoImagen);
            let offset = 0;
            for (const parte of partes) {
              resultado.set(parte, offset);
              offset += parte.byteLength;
            }
            return resultado;
          } catch (err) {
            logStructuredWarn("pasaporte/route", "descarga_evidencia_fallida", err, {
              trasladoId: id,
            });
            return null; // Degrada a placeholder visual en el PDF
          }
        },
        { puedeVerTarifa }
      );

      // CB-3 / T11 / CA-9: Si la generación concluye íntegramente, se transmite por streaming
      // en bloques de 64 KB. Si hubiera fallado durante la construcción, se captura en el catch
      // superior y devuelve JSON 503 sin emitir artefactos parciales corruptos ni PII.
      let offsetStream = 0;
      const cuerpo = new ReadableStream<Uint8Array>({
        pull(controller) {
          if (offsetStream >= bytes.length) {
            controller.close();
            return;
          }
          const fin = Math.min(offsetStream + 64 * 1024, bytes.length);
          controller.enqueue(bytes.subarray(offsetStream, fin));
          offsetStream = fin;
        },
      });

      return new Response(cuerpo, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="pasaporte-${id}.pdf"`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    });
  } catch (error) {
    if (error instanceof SemaforoPdfOcupadoError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: 503,
          headers: {
            "Retry-After": String(error.retryAfterSegundos),
            "Cache-Control": "private, no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No pudimos generar el pasaporte completo.",
      },
      {
        status: 503,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  }
}
