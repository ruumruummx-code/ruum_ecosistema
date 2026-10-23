import { createServer } from "node:http";

// Estados deterministas para auditar el navegador y el renderizado del servidor.
const userId = "00000000-0000-4000-8000-000000000001";
const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: userId, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
const states = ["pendiente_de_conductor", "conductor_asignado", "conductor_en_camino_al_origen", "evidencia_inicial_en_proceso", "traslado_en_curso", "evidencia_final_completada", "conductor_asignado", "conductor_asignado"];
let loadingReleased = false;
const loadingRequests = [];

createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,HEAD,OPTIONS");
  response.setHeader("Content-Type", "application/json");
  const url = new URL(request.url, "http://127.0.0.1");
  if (request.method === "OPTIONS") { response.writeHead(204).end(); return; }
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
    if (!id) { response.end("[]"); return; }
    const index = Number(id.slice(-3));
    if (index === 7 && !loadingReleased) await new Promise(resolve => loadingRequests.push(resolve));
    if (index === 8) { response.writeHead(500).end('{"message":"Fallo temporal de prueba"}'); return; }
    const trip = index === 9 ? null : {
      traslado_id: id, estado: states[index] ?? states[1], conductor_id: index === 0 ? null : "00000000-0000-4000-8000-000000000002",
      origen_ciudad: "Ciudad de México", origen_direccion: "Avenida Reforma 100, Centro, acceso principal", destino_ciudad: "Toluca", destino_direccion: "Avenida Universidad 200, Centro, acceso sur",
      origen_lat: null, origen_lng: null, destino_lat: null, destino_lng: null,
      vehiculo_marca: "Toyota", vehiculo_modelo: "Corolla", vehiculo_anio: 2024, vehiculo_color: "Blanco", vehiculo_placas: "QA-123", vehiculo_vin: "TEST0000000000001",
      contacto_entrega_nombre: "Contacto de origen", contacto_entrega_telefono: "+525512345678", contacto_recepcion_nombre: "Contacto de destino", contacto_recepcion_telefono: "+525587654321",
      ganancia_conductor: 1850, distancia_km: 62.5, tiempo_estimado_horas: 1.5, creado_en: "2026-10-23T12:00:00Z",
    };
    response.end(JSON.stringify(request.headers.accept?.includes("vnd.pgrst.object+json") ? trip : trip ? [trip] : [])); return;
  }
  if (url.pathname.includes("/rpc/")) {
    if (url.pathname.includes("avanzar_estado")) { response.writeHead(500).end('{"message":"No pudimos actualizar el traslado"}'); return; }
    response.end("null"); return;
  }
  response.setHeader("Content-Range", "*/0");
  response.end("[]");
}).listen(54329, "127.0.0.1");
