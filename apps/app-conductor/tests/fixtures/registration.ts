import { expect, type Page } from "@playwright/test";

const HOST = process.env.PLAYWRIGHT_SUPABASE_URL ?? "http://127.0.0.1:54329";
const USER_ID = "00000000-0000-4000-8000-00000000c002";
const SOLICITUD_ID = "00000000-0000-4000-8000-00000000c003";
const user = { id: USER_ID, aud: "authenticated", role: "authenticated", email: "conductor@example.com", app_metadata: {}, user_metadata: {}, created_at: "2026-10-01T00:00:00Z" };
function session() {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return { access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: USER_ID, aud: "authenticated", role: "authenticated", exp })}.test-signature`, refresh_token: "test-refresh-token", token_type: "bearer", expires_at: exp, expires_in: 3600, user };
}
export async function openRegistration(page: Page, step: number | null, complete = false) {
  const calls: Array<{ rpc: string; body: Record<string, unknown> }> = [];
  const solicitud = {
    id: SOLICITUD_ID, auth_user_id: USER_ID, estado: "datos_incompletos", paso_actual: step ?? 1,
    datos_personales: { nombres: "Juan", apellidos: "Gómez Cruz", curp: "GOMC900101HDFRRL09", telefono: "+525512345678" },
    domicilio: complete ? { codigo_postal: "52104", estado: "México", ciudad_municipio: "San Mateo Atenco", colonia: "Centro", calle: "Juárez", numero: "12", referencias: "Portón azul" } : {},
    contacto_emergencia: complete ? { nombre: "María Gómez", telefono: "5512345678" } : {},
    licencia: {},
  };
  await page.addInitScript(() => {
    localStorage.setItem("CapacitorStorage.ruum_conductor_onboarding_visto", "1");
  });
  if (step !== null) await page.context().addCookies([{
    name: `sb-${new URL(HOST).hostname.split(".")[0]}-auth-token`,
    value: `base64-${Buffer.from(JSON.stringify(session())).toString("base64url")}`,
    url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001",
  }]);
  let authenticated = step !== null;
  await page.route("**/auth/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const signup = pathname.endsWith("/signup");
    if (signup) {
      expect(route.request().postDataJSON()).toMatchObject({ email: "conductor@example.com", password: "Conductor2026" });
      authenticated = true;
    }
    await route.fulfill({ status: authenticated ? 200 : 401, headers: { "access-control-allow-origin": "*" },
      json: authenticated ? signup || pathname.endsWith("/token") ? session() : user : { msg: "Test session required" } });
  });
  await page.route("**/rest/v1/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (pathname.endsWith("/solicitudes_conductor")) {
      body = route.request().headers().accept?.includes("vnd.pgrst.object+json") ? solicitud : [solicitud];
    }
    if (pathname.includes("/rpc/")) {
      const rpc = pathname.split("/").pop()!;
      const payload = route.request().postDataJSON() ?? {};
      calls.push({ rpc, body: payload });
      if (rpc === "guardar_borrador_conductor") {
        expect(payload.p_paso_actual).toBeGreaterThanOrEqual(1);
        expect(payload.p_paso_actual).toBeLessThanOrEqual(5);
        Object.assign(solicitud, { paso_actual: payload.p_paso_actual, datos_personales: payload.p_datos_personales, domicilio: payload.p_domicilio, contacto_emergencia: payload.p_contacto_emergencia, licencia: payload.p_licencia });
      }
      if (["iniciar_solicitud_conductor", "guardar_borrador_conductor"].includes(rpc)) body = [{ solicitud_id: SOLICITUD_ID, conductor_id: null, estado: "datos_incompletos", paso_actual: solicitud.paso_actual }];
    }
    await route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*" }, json: body });
  });
  await page.goto("/registro", { timeout: 360_000, waitUntil: "domcontentloaded" });
  await expect(page.locator('form[data-registration-ready="true"]')).toBeVisible({ timeout: 120_000 });
  await expect(page.getByRole("heading", { name: step === 2 ? "Identidad" : step === 3 ? "Licencia (3/5)" : "Crea tu cuenta", exact: true })).toBeVisible();
  await page.locator("nextjs-portal").evaluateAll(nodes => nodes.forEach(node => (node as HTMLElement).style.setProperty("display", "none", "important")));
  return calls;
}
