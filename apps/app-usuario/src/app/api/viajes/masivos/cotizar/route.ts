import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { crearClienteServidor } from "@/lib/supabase-server";
import { rateLimitConVentana } from "@/lib/csp-rate-limit";
import { clienteMasivoServicio, stripeMasivo, validarFilasServidor } from "@/lib/carga-masiva-server";
import { previsualizarTarifaUsuario, verificarUsuarioMasivo, guardarCheckoutMasivoServidor, vincularPagoMasivoServidor } from "@ruum/api/services";
import { tipoSugeridoParaVehiculo } from "@ruum/shared/catalogos";
import { obtenerRutaDirectionsMapboxConParadas } from "@ruum/shared/utils";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
const esquema = z.object({ filas: z.array(z.record(z.string().max(2000))).min(1).max(100), clave: z.string().uuid() });
async function coordenada(cp: string, token: string) {
  const params = new URLSearchParams({ postcode: cp, country: "mx", types: "postcode", access_token: token, limit: "1" });
  const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, { signal: AbortSignal.timeout(8000) });
  const data = await res.json();
  const punto = data.features?.[0]?.geometry?.coordinates;
  if (!res.ok || !punto || punto.length !== 2) throw new Error("Mapbox no encontró el código postal.");
  return punto as [number, number];
}
export async function POST(request: NextRequest) {
  const cliente = await crearClienteServidor();
  const { data: { user } } = await cliente.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const limite = await rateLimitConVentana(`uid:${user.id}`, "masivos-cotizar", 10, 60000);
  if (!limite.allowed) return NextResponse.json({ error: "Espera antes de cotizar otra carga." }, { status: 429 });
  const body = esquema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "La carga no es válida." }, { status: 400 });
  try {
    if (!await verificarUsuarioMasivo(cliente, user.id)) return NextResponse.json({ error: "Verifica tu cuenta antes de pagar." }, { status: 403 });
    const filas = await validarFilasServidor(body.data.filas);
    if (filas.some(f => f.estado === "error")) return NextResponse.json({ filas });
    const token = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) throw new Error("Servicio de mapas no disponible.");
    const normalizadas: Record<string, string>[] = [];
    const cotizaciones = [];
    let centavos = 0;
    const momento = new Date();
    for (const fila of filas) {
      const d = fila.datos;
      try {
        const [origen, destino] = await Promise.all([coordenada(d.origenCodigoPostal, token), coordenada(d.destinoCodigoPostal, token)]);
        const ruta = await obtenerRutaDirectionsMapboxConParadas(origen, destino, [], token, { lanzarErrores: true, maxIntentos: 2, timeoutMs: 8000, demoraReintentoMs: 300 });
        if (!ruta || ruta.distanciaKm == null || ruta.tiempoHoras == null) throw new Error("No existe una ruta compatible para este traslado.");
        const tarifa = await previsualizarTarifaUsuario(cliente, { marca: d.marca, modelo: d.modelo, condicion: d.condicion, distanciaKm: ruta.distanciaKm, tiempoEstimadoHoras: ruta.tiempoHoras, fechaHora: d.modalidad_programacion === "programado" ? new Date(d.fecha_hora_programada!) : momento });
        if (!tarifa.disponible || !tarifa.tarifa || tarifa.tarifa <= 0) throw new Error("No hay tarifa disponible para este vehículo y ruta.");
        const precio = Math.round(tarifa.tarifa * 100);
        centavos += precio;
        // La clasificación ya fue resuelta por el cotizador en su contexto de
        // confianza. Repetir el RPC con el usuario la ocultaría por RLS.
        if (!tarifa.categoria_tarifa || !tarifa.gama) throw new Error("No se pudo clasificar el vehículo.");
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
      } catch (err) {
        fila.estado = "error"; fila.errores.modelo = err instanceof Error ? err.message : "No se pudo cotizar esta fila.";
      }
    }
    if (filas.some(f => f.estado === "error")) return NextResponse.json({ filas });
    const servicio = clienteMasivoServicio();
    const id = body.data.clave;
    const guardado = await guardarCheckoutMasivoServidor(servicio, { id, auth_user_id: user.id, filas: normalizadas, cotizaciones, monto_centavos: centavos });
    const intent = await stripeMasivo("payment_intents", new URLSearchParams({ amount: String(guardado.monto_centavos), currency: "mxn", "automatic_payment_methods[enabled]": "true", "metadata[carga_masiva_id]": id }), `carga-masiva-${id}`);
    await vincularPagoMasivoServidor(servicio, id, user.id, intent.id);
    return NextResponse.json({ id, clientSecret: intent.client_secret, totalMXN: guardado.monto_centavos / 100, cotizaciones: guardado.cotizaciones });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "No se pudo cotizar la carga." }, { status: 503 });
  }
}
