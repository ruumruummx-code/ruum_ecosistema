import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import {
  esOrigenPermitido,
  resolverOrigenPermitido,
  construirCabecerasCors,
  manejarCors,
} from "./cors-documentos.ts";

Deno.test("CORS: orígenes autorizados reconocidos correctamente", () => {
  assertEquals(esOrigenPermitido("https://ruum.mx"), true);
  assertEquals(esOrigenPermitido("https://app.ruum.mx"), true);
  assertEquals(esOrigenPermitido("https://admin.ruum.mx"), true);
  assertEquals(esOrigenPermitido("https://conductor.ruum.mx"), true);
  assertEquals(esOrigenPermitido("http://localhost:3000"), true);
  assertEquals(esOrigenPermitido("http://127.0.0.1:3001"), true);
  assertEquals(esOrigenPermitido("https://ruum-preview-123.vercel.app"), true);
  assertEquals(esOrigenPermitido("https://usuario.ruumruum-moviliax.online"), true);
});

Deno.test("CORS: orígenes no autorizados o maliciosos rechazados", () => {
  assertEquals(esOrigenPermitido("https://evil.com"), false);
  assertEquals(esOrigenPermitido("https://ruum.mx.attacker.com"), false);
  assertEquals(esOrigenPermitido("http://localhost:8080"), false);
  assertEquals(esOrigenPermitido(""), false);
  assertEquals(esOrigenPermitido(null), false);
});

Deno.test("CORS: resolverOrigenPermitido nunca retorna comodín '*'", () => {
  const origenInvalido = resolverOrigenPermitido("https://attacker.site");
  assertNotEquals(origenInvalido, "*");
  assertEquals(origenInvalido, "https://ruum.mx");

  const origenValido = resolverOrigenPermitido("https://admin.ruum.mx");
  assertEquals(origenValido, "https://admin.ruum.mx");
});

Deno.test("CORS: manejarCors bloquea con HTTP 403 orígenes no permitidos", () => {
  const reqInvalido = new Request("https://api.ruum.mx/edge-func", {
    method: "POST",
    headers: { Origin: "https://malicious-site.com" },
  });
  const resBloqueo = manejarCors(reqInvalido);
  assertNotEquals(resBloqueo, null);
  assertEquals(resBloqueo!.status, 403);
});

Deno.test("CORS: manejarCors permite OPTIONS preflight para origen válido (HTTP 204)", () => {
  const reqValido = new Request("https://api.ruum.mx/edge-func", {
    method: "OPTIONS",
    headers: { Origin: "https://app.ruum.mx" },
  });
  const resOptions = manejarCors(reqValido);
  assertNotEquals(resOptions, null);
  assertEquals(resOptions!.status, 204);
  assertEquals(resOptions!.headers.get("Access-Control-Allow-Origin"), "https://app.ruum.mx");
});

Deno.test("CORS: manejarCors permite peticiones sin Origin (servidor a servidor)", () => {
  const reqServer = new Request("https://api.ruum.mx/edge-func", {
    method: "POST",
    headers: { Authorization: "Bearer test" },
  });
  const res = manejarCors(reqServer);
  assertEquals(res, null);
});
