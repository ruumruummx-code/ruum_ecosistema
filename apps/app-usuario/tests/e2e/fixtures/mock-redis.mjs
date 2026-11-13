// Doble REST de Upstash para ejecutar el limitador real en E2E de producción.
import { createServer } from "node:http";
const keys = new Map();
function ejecutar([nombre, clave, valor, ...opciones]) {
  const comando = String(nombre).toLowerCase();
  const now = Date.now();
  if (keys.get(clave)?.expira <= now) keys.delete(clave);
  if (comando === "set") {
    if (opciones.some(v => String(v).toLowerCase() === "nx") && keys.has(clave)) return { result: null };
    const ex = opciones.findIndex(v => String(v).toLowerCase() === "ex");
    keys.set(clave, { valor: Number(valor), expira: ex < 0 ? Infinity : now + Number(opciones[ex + 1]) * 1000 });
    return { result: null };
  }
  if (comando === "incr") {
    const entrada = keys.get(clave) ?? { valor: 0, expira: Infinity };
    entrada.valor++;
    keys.set(clave, entrada);
    return { result: entrada.valor };
  }
  if (comando === "ttl") return { result: keys.has(clave) ? Math.ceil((keys.get(clave).expira - now) / 1000) : -2 };
  return { error: "Comando no implementado: " + nombre };
}
createServer(async (req, res) => {
  if (req.method === "GET") { res.end("ok"); return; }
  if (req.headers.authorization !== "Bearer e2e-redis-token") { res.writeHead(401); res.end(); return; }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString());
    const resultado = req.url === "/pipeline" ? body.map(ejecutar) : ejecutar(body);
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(resultado));
  } catch { res.writeHead(400); res.end(); }
}).listen(Number(process.env.PLAYWRIGHT_MOCK_REDIS_PORT ?? 54400), "127.0.0.1");
