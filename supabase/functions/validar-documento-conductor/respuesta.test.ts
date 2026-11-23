import { test } from "node:test";
import assert from "node:assert/strict";
import { crearRespuestaJson } from "./respuesta.ts";
import { manejarCors } from "../_shared/cors-documentos.ts";

for (const origin of ["https://www.concer.ruumruum-moviliax.online", "https://conductor.ruum.mx"]) {
  for (const status of [201, 401, 409, 422, 429, 500, 503]) {
    test(`${origin}: respuesta ${status} conserva CORS y el cuerpo`, async () => {
      const req = new Request("https://example.test/upload", { method: "POST", headers: { Origin: origin } });
      const respuesta = crearRespuestaJson(req)({ detalle: "documento" }, status, { "Retry-After": "600" });
      assert.equal(respuesta.status, status);
      assert.equal(respuesta.headers.get("Access-Control-Allow-Origin"), origin);
      assert.equal(respuesta.headers.get("Vary"), "Origin");
      assert.equal(respuesta.headers.get("Retry-After"), "600");
      assert.deepEqual(await respuesta.json(), { detalle: "documento" });
    });
  }
}

test("el endpoint sigue rechazando un origen no autorizado", () => {
  const req = new Request("https://example.test/upload", { headers: { Origin: "https://attacker.example" } });
  assert.equal(manejarCors(req)?.status, 403);
});
