// API local para las pruebas de UI. No utiliza credenciales ni cuentas reales.
import { createServer } from "node:http";

const userId = "00000000-0000-4000-8000-000000000001";
const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: userId, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
const user = { id: userId, email: "conductor@example.test", aud: "authenticated", role: "authenticated", app_metadata: { provider: "email" }, user_metadata: {}, created_at: "2026-10-17T12:00:00Z" };
const conductor = { id: "00000000-0000-4000-8000-000000000002", auth_user_id: userId, nombre: "Conductor de prueba", estado: "activo", documentos_vigentes: true, calificacion_promedio: 4.8, traslados_completados: 0, suspensiones_activas: 0 };

createServer((request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS");
  response.setHeader("Access-Control-Expose-Headers", "Content-Range");
  response.setHeader("Content-Type", "application/json");
  if (request.method === "OPTIONS") { response.writeHead(204).end(); return; }
  const pathname = new URL(request.url, "http://127.0.0.1").pathname;
  if (pathname === "/health") { response.end("{}"); return; }
  if (pathname === "/auth/v1/user") {
    if (request.headers.authorization !== `Bearer ${token}`) { response.writeHead(401).end(JSON.stringify({ msg: "Test session required" })); return; }
    response.end(JSON.stringify(user)); return;
  }
  if (pathname === "/rest/v1/conductores") { response.end(JSON.stringify(conductor)); return; }
  response.setHeader("Content-Range", "*/0");
  response.end("[]");
}).listen(54329, "127.0.0.1");
