import { createServer } from "node:http";

// Estados deterministas para auditar el navegador y el renderizado del servidor.
const userId = "00000000-0000-4000-8000-000000000001";
const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: userId, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
const states = ["pendiente_de_conductor", "conductor_asignado", "conductor_en_camino_al_origen", "evidencia_inicial_en_proceso", "traslado_en_curso", "evidencia_final_completada", "conductor_asignado", "conductor_asignado"];
Object.assign(states, { 11: "conductor_en_punto_de_recoleccion", 12: "verificacion_vehiculo_en_proceso", 13: "evidencia_inicial_completada", 14: "vehiculo_recibido", 15: "llegada_a_destino", 16: "evidencia_final_en_proceso", 17: "entrega_confirmada", 18: "servicio_cerrado", 19: "servicio_cancelado", 20: "traslado_fallido", 21: "disputa_abierta", 22: "incidencia_reportada", 23: "estado_desconocido", 24: "conductor_asignado", 25: "verificacion_vehiculo_en_proceso" });
const changes = new Map();
const calls = [];
let listMode = "empty";
let loadingReleased = false;
const loadingRequests = [];

createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,HEAD,OPTIONS");
  response.setHeader("Content-Type", "application/json");
  const url = new URL(request.url, "http://127.0.0.1");
  if (request.method === "OPTIONS") { response.writeHead(204).end(); return; }
  if (url.pathname === "/qa/reset") { changes.clear(); calls.length = 0; listMode = "empty"; response.end("{}"); return; }
  if (url.pathname === "/qa/list") { listMode = url.searchParams.get("mode") ?? "empty"; response.end("{}"); return; }
  if (url.pathname === "/qa/calls") { response.end(JSON.stringify(calls)); return; }
  if (url.pathname === "/health") { response.end("{}"); return; }
  if (url.pathname === "/qa/release-loading") {
    loadingReleased = true;
    loadingRequests.splice(0).forEach(release => release());
    response.end("{}"); return;
  }
  if (url.pathname === "/auth/v1/user") {
    if (request.headers.authorization !== `Bearer ${token}`) { response.writeHead(401).end('{"msg":"Test session required"}'); return; }
    response.end(JSON.stringify({ id: userId, email: "conductor@example.test", role: "authenticated", aud: "authenticated", app_metadata: {}, user_metadata: {} })); return;
  }
  if (url.pathname === "/rest/v1/conductores") {
    response.end(JSON.stringify({ id: "00000000-0000-4000-8000-000000000002", auth_user_id: userId, nombre: "Conductor de prueba", estado: "activo", estado_expediente: "aprobado", documentos_vigentes: true })); return;
  }
  if (url.pathname === "/rest/v1/pasaporte_digital") {
    const id = url.searchParams.get("traslado_id")?.replace(/^eq\./, "");
    if (!id) {
      const offer = url.searchParams.get("estado") === "eq.pendiente_de_conductor";
      const rows = listMode === "empty" ? [] : [0, 1, 2].map(i => ({ traslado_id: `10000000-0000-4000-8000-${String(offer ? i + 30 : i + 40).padStart(12, "0")}`, estado: offer ? "pendiente_de_conductor" : i === 0 ? "entrega_confirmada" : "conductor_asignado", conductor_id: offer ? null : "00000000-0000-4000-8000-000000000002", origen_ciudad: "Ciudad de México", origen_direccion: "Reforma 100, Centro", destino_ciudad: "Toluca", destino_direccion: "Universidad 200, Centro", vehiculo_marca: "Toyota", vehiculo_modelo: "Corolla", vehiculo_anio: 2024, ganancia_conductor: 1850 + i * 100, distancia_km: 62.5, tiempo_estimado_horas: 1.5, creado_en: "2026-11-07T12:00:00Z", origen_lat: null, origen_lng: null, destino_lat: null, destino_lng: null }));
      response.end(JSON.stringify(rows)); return;
    }
    const index = Number(id.slice(-3));
    if (index === 7 && !loadingReleased) await new Promise(resolve => loadingRequests.push(resolve));
    if (index === 8) { response.writeHead(500).end('{"message":"Fallo temporal de prueba"}'); return; }
    const trip = index === 9 ? null : {
      traslado_id: id, estado: changes.get(id) ?? (index === 10 ? "pendiente_de_conductor" : states[index] ?? states[1]), conductor_id: index === 0 || index === 10 ? null : "00000000-0000-4000-8000-000000000002",
      origen_ciudad: "Ciudad de México", origen_direccion: "Avenida Reforma 100, Centro, acceso principal", destino_ciudad: "Toluca", destino_direccion: "Avenida Universidad 200, Centro, acceso sur",
      origen_lat: null, origen_lng: null, destino_lat: null, destino_lng: null,
      vehiculo_marca: "Toyota", vehiculo_modelo: "Corolla", vehiculo_anio: 2024, vehiculo_color: "Blanco", vehiculo_placas: "QA-123", vehiculo_vin: "TEST0000000000001",
      contacto_entrega_nombre: "Contacto de origen", contacto_entrega_telefono: "+525512345678", contacto_recepcion_nombre: "Contacto de destino", contacto_recepcion_telefono: "+525587654321",
      ganancia_conductor: 1850, distancia_km: 62.5, tiempo_estimado_horas: 1.5, creado_en: "2026-10-23T12:00:00Z",
      ...(index === 24 ? { origen_direccion: "Dirección extensa con acceso por la puerta de proveedores. ".repeat(25) + "FIN DIRECCIÓN", origen_referencias: "Referencias completas. ".repeat(80) + "FIN REFERENCIAS" } : {}),
      ...(index === 25 ? { vehiculo_vin: null, vehiculo_placas: null, origen_direccion: null, origen_lat: null, origen_lng: null, vehiculo_marca: null, vehiculo_modelo: null, vehiculo_anio: null } : {}),
      ...(index === 10 ? {
        origen_direccion: "Londres 899, Juárez, 06600, Ciudad de México", destino_ciudad: "Metepec",
        destino_direccion: "Los Serranos 225, Uno Residencial, 52104, Metepec, Méx.",
        vehiculo_marca: "Chrysler", vehiculo_modelo: "Stratus", vehiculo_anio: 2015,
        ganancia_conductor: 531.45, distancia_km: 51, tiempo_estimado_horas: 70 / 60,
      } : {}),
    };
    response.end(JSON.stringify(request.headers.accept?.includes("vnd.pgrst.object+json") ? trip : trip ? [trip] : [])); return;
  }
  if (url.pathname === "/rest/v1/evidencia_inspecciones") {
    const id = url.searchParams.get("traslado_id")?.replace(/^eq\./, "");
    const rows = id?.endsWith("005")
      ? [
          { traslado_id: id, tipo: "inicial", llaves_recibidas: "2", kilometraje: 12000, combustible: "1/2", notas: null },
          { traslado_id: id, tipo: "final", llaves_recibidas: "2", kilometraje: 12062, combustible: "1/2", notas: null },
        ]
      : [];
    response.end(JSON.stringify(request.headers.accept?.includes("vnd.pgrst.object+json") ? (rows[0] ?? null) : rows)); return;
  }
  if (url.pathname === "/rest/v1/evidencia_fotos") {
    const id = url.searchParams.get("traslado_id")?.replace(/^eq\./, "");
    const rows = id?.endsWith("005")
      ? ["inicial", "final"].flatMap(tipo =>
          ["frente", "lado_piloto", "lado_copiloto", "trasera", "tablero"].map(angulo => ({
            traslado_id: id,
            tipo,
            angulo,
            sincronizada: true,
            conflicto: false,
            url: `evidencia/${id}/${tipo}/${angulo}.jpg`,
          }))
        )
      : [];
    response.end(JSON.stringify(rows)); return;
  }
  if (url.pathname === "/rest/v1/custodia_eventos") {
    const id = url.searchParams.get("traslado_id")?.replace(/^eq\./, "");
    const rows = id?.endsWith("005")
      ? [
          {
            id: "00000000-0000-4000-8000-000000000095",
            traslado_id: id,
            tipo: "vehicle_delivered",
            firma_metodo: "digital_canvas",
            firma_referencia: "evidencia/firma.png",
            metadata: { mecanismo: "firma", receptor_nombre: "Contacto de destino", firma_guardada: true },
            ocurrido_en: "2026-10-23T14:00:00Z",
          },
        ]
      : [];
    response.end(JSON.stringify(rows)); return;
  }
  if (url.pathname.includes("/rpc/")) {
    let raw = ""; for await (const chunk of request) raw += chunk;
    const params = raw ? JSON.parse(raw) : {};
    calls.push({ rpc: url.pathname.split("/").at(-1), params });
    if (url.pathname.endsWith("/conductor_avanza_traslado")) {
      const target = { conductor_en_camino: "conductor_en_camino_al_origen", llegada_origen: "conductor_en_punto_de_recoleccion", iniciar_verificacion: "verificacion_vehiculo_en_proceso", iniciar_evidencia_inicial: "evidencia_inicial_en_proceso", vehiculo_recibido: "vehiculo_recibido", iniciar_traslado: "traslado_en_curso", iniciar_evidencia_final: "evidencia_final_en_proceso" }[params.p_evento];
      if (target) changes.set(params.p_traslado_id, target);
      response.end(JSON.stringify(target ?? null)); return;
    }
    if (url.pathname.endsWith("/conductor_confirmar_llegada_destino")) {
      changes.set(params.p_traslado_id, "llegada_a_destino"); response.end('"llegada_a_destino"'); return;
    }
    if (url.pathname.includes("avanzar_estado")) { response.writeHead(500).end('{"message":"No pudimos actualizar el traslado"}'); return; }
    if (url.pathname.endsWith("/rpc/consultar_oportunidad_asignacion")) {
      response.end(JSON.stringify({
        modo: "competencia",
        asignacion_id: null,
        elegible: true,
        motivos: [],
        expira_en: null,
        solicitud_estado: null,
        cierra_en: null,
        asignada_a_mi: false,
        tomada: false,
      })); return;
    }
    response.end("null"); return;
  }
  response.setHeader("Content-Range", "*/0");
  response.end(request.headers.accept?.includes("vnd.pgrst.object+json") ? "null" : "[]");
}).listen(54331, "127.0.0.1");
