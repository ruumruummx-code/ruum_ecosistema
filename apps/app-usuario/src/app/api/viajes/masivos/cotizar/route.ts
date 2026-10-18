import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase-server";
import { rateLimitConVentana } from "@/lib/csp-rate-limit";
import { clienteMasivoServicio, stripeMasivo, validarFilasServidor } from "@/lib/carga-masiva-server";
import { previsualizarTarifasMasivasUsuario, verificarUsuarioMasivo, guardarCheckoutMasivoServidor, vincularPagoMasivoServidor } from "@ruum/api/services";
import { coordenadaPostalMasiva, ErrorServicioCotizacion } from "@/lib/mapbox-masivo";
import { tipoSugeridoParaVehiculo } from "@ruum/shared/catalogos";
import { obtenerRutaDirectionsMapboxConParadas } from "@ruum/shared/utils";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
const esquema = z.object({ filas: z.array(z.record(z.string().max(2000))).min(1).max(100), clave: z.string().uuid() });
export async function POST(request: NextRequest) {
  const cliente = await crearClienteServidor();
  const { data: { user } } = await cliente.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const limite = await rateLimitConVentana(`uid:${user.id}`, "masivos-cotizar", 5, 60000);
  if (!limite.allowed) return NextResponse.json({ error: "Espera antes de cotizar otra carga." }, { status: 429 });
  const body = esquema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "La carga no es válida." }, { status: 400 });
  try {
    if (!await verificarUsuarioMasivo(cliente, user.id)) return NextResponse.json({ error: "Verifica tu cuenta antes de pagar." }, { status: 403 });
    const filas = await validarFilasServidor(body.data.filas);
    if (filas.some(f => f.estado === "error")) return NextResponse.json({ filas });
    const token = process.env.MAPBOX_SECRET_TOKEN;
    if (!token) return NextResponse.json({ error: "Servicio de mapas no configurado (falta MAPBOX_SECRET_TOKEN)." }, { status: 500 });
    const normalizadas: Record<string, string>[] = [];
    const cotizaciones = [];
    let centavos = 0;
    const momento = new Date().toISOString();
    type Ruta = { origen: [number, number]; destino: [number, number]; distanciaKm: number; tiempoHoras: number };
    const rutas = new Map<number, Ruta>();

    // Cotización incremental por lotes de N filas con reintento solo de fallidas.
    // Un 429 o timeout en una fila no aborta el lote completo y conserva cotizaciones parciales.
    const TAMANIO_LOTE = 10;
    for (let i = 0; i < filas.length; i += TAMANIO_LOTE) {
      const lote = filas.slice(i, i + TAMANIO_LOTE);
      await Promise.all(
        lote.map(async (fila) => {
          const d = fila.datos;
          const MAX_INTENTOS = 2;
          let ultimoError: unknown = null;
          for (let intento = 0; intento <= MAX_INTENTOS; intento++) {
            try {
              if (intento > 0) {
                await new Promise((resolve) => setTimeout(resolve, 300 * intento));
              }
              const [origen, destino] = await Promise.all([
                coordenadaPostalMasiva(d.origenCodigoPostal, token),
                coordenadaPostalMasiva(d.destinoCodigoPostal, token),
              ]);
              if (!origen || !destino) {
                if (!origen) fila.errores.origenCodigoPostal = "El servicio de mapas no encontró el CP de origen.";
                if (!destino) fila.errores.destinoCodigoPostal = "El servicio de mapas no encontró el CP de destino.";
                fila.estado = "error";
                return;
              }
              const ruta = await obtenerRutaDirectionsMapboxConParadas(
                origen,
                destino,
                [],
                token,
                { lanzarErrores: true, maxIntentos: 2, timeoutMs: 8000, demoraReintentoMs: 300 }
              );
              if (!ruta || ruta.distanciaKm == null || ruta.tiempoHoras == null) {
                fila.errorCotizacion = "No existe una ruta compatible para este traslado.";
                return;
              }
              rutas.set(fila.indice, { origen, destino, distanciaKm: ruta.distanciaKm, tiempoHoras: ruta.tiempoHoras });
              return;
            } catch (err) {
              ultimoError = err;
              if (err instanceof ErrorServicioCotizacion && (err.status === 401 || err.status === 403)) {
                throw err;
              }
            }
          }
          if (ultimoError instanceof ErrorServicioCotizacion && ultimoError.status === 429) {
            fila.errorCotizacion = "El servicio de mapas alcanzó su límite de consultas para esta fila. Reintenta esta fila.";
          } else {
            fila.errorCotizacion = "No se pudo calcular la ruta de este traslado (tiempo de espera o error de red). Reintenta o revisa sus ubicaciones.";
          }
        })
      );
    }
    if (filas.some(f => f.estado === "error" || f.errorCotizacion)) return NextResponse.json({ filas });
    const tarifas = await previsualizarTarifasMasivasUsuario(cliente, filas.map(f => {
      const r = rutas.get(f.indice)!;
      return { indice: f.indice, marca: f.datos.marca, modelo: f.datos.modelo, condicion: f.datos.condicion, distanciaKm: r.distanciaKm, tiempoEstimadoHoras: r.tiempoHoras, fechaHora: f.datos.modalidad_programacion === "programado" ? f.datos.fecha_hora_programada! : momento };
    }));
    const tarifasPorIndice = new Map(tarifas.map(t => [t.indice, t]));
    for (const fila of filas) {
      const d = fila.datos;
      const ruta = rutas.get(fila.indice)!;
      const { origen, destino } = ruta;
      const tarifa = tarifasPorIndice.get(fila.indice)!;
      if (!tarifa.disponible || !tarifa.tarifa || tarifa.tarifa <= 0 || !tarifa.categoria_tarifa || !tarifa.gama) {
        fila.errorCotizacion = tarifa.motivo ?? "No hay tarifa disponible para este vehículo y ruta.";
        continue;
      }
        const precio = Math.round(tarifa.tarifa * 100);
        centavos += precio;
        const n: Record<string, string> = {
          vehiculo_marca: d.marca, vehiculo_modelo: d.modelo, vehiculo_anio: d.anio,
          vehiculo_tipo: tipoSugeridoParaVehiculo(d.marca, d.modelo) ?? "sedan",
          categoria_tarifa: tarifa.categoria_tarifa, gama: tarifa.gama, condicion: d.condicion,
          contacto_entrega_nombre: d.entregaNombre, contacto_entrega_telefono: `+52${d.entregaTelefono}`,
          contacto_recepcion_nombre: d.recepcionNombre, contacto_recepcion_telefono: `+52${d.recepcionTelefono}`,
          origen_direccion: [d.origen_calle, d.origen_numero, d.origen_colonia, d.origenCodigoPostal].filter(Boolean).join(", "),
          destino_direccion: [d.destino_calle, d.destino_numero, d.destino_colonia, d.destinoCodigoPostal].filter(Boolean).join(", "),
          origen_ciudad: d.origen_municipio || d.origenCodigoPostal, destino_ciudad: d.destino_municipio || d.destinoCodigoPostal,
          origen_lng: String(origen[0]), origen_lat: String(origen[1]), destino_lng: String(destino[0]), destino_lat: String(destino[1]),
          distancia_km: String(ruta.distanciaKm), tiempo_estimado_horas: String(ruta.tiempoHoras),
          modalidad_programacion: d.modalidad_programacion || "lo_antes_posible",
        };
        for (const key of ["referencia_externa", "vehiculo_placas", "vehiculo_vin", "vehiculo_color", "vehiculo_transmision", "estado_general_declarado", "origen_referencias", "destino_referencias", "fecha_hora_programada", "instrucciones_especiales"]) if (d[key]) n[key] = d[key]!;
        n.tipo_ruta = d.tipo_traslado || "local";
        n.instrucciones_especiales = [n.instrucciones_especiales, ...["centro_costo", "orden_compra", "prioridad", "ventana_recoleccion", "ventana_recoleccion_horario", "ventana_entrega", "ventana_entrega_horario"].filter(k => d[k]).map(k => `${k}: ${d[k]}`)].filter(Boolean).join(" | ");
        normalizadas.push(n);
        cotizaciones.push({ ...fila, tarifa: precio / 100, distanciaKm: ruta.distanciaKm });
    }
    if (filas.some(f => f.errorCotizacion)) return NextResponse.json({ filas });
    const servicio = clienteMasivoServicio();
    const id = body.data.clave;
    const guardado = await guardarCheckoutMasivoServidor(servicio, { id, auth_user_id: user.id, filas: normalizadas, cotizaciones, monto_centavos: centavos });
    const intent = await stripeMasivo("payment_intents", new URLSearchParams({ amount: String(guardado.monto_centavos), currency: "mxn", "automatic_payment_methods[enabled]": "true", "metadata[carga_masiva_id]": id }), `carga-masiva-${id}`);
    await vincularPagoMasivoServidor(servicio, id, user.id, intent.id);
    return NextResponse.json({ id, clientSecret: intent.client_secret, totalMXN: guardado.monto_centavos / 100, cotizaciones: guardado.cotizaciones });
  } catch (err) {
    if (err instanceof ErrorServicioCotizacion) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err && typeof err === "object" && "message" in err && String(err.message).includes("RATE_LIMITED")) return NextResponse.json({ error: "Alcanzaste el límite de cotizaciones masivas. Espera un minuto y reintenta." }, { status: 429, headers: { "Retry-After": "60" } });
    return NextResponse.json({ error: err instanceof Error ? err.message : "No se pudo cotizar la carga." }, { status: 503 });
  }
}
