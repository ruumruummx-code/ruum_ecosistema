import type { BrowserContext, Page } from "@playwright/test";

export const trip = (i: number) => `10000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
export async function session(page: Page, context: BrowserContext, mode: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(theme => {
    localStorage.setItem("CapacitorStorage.ruum_conductor_onboarding_visto", "1");
    localStorage.setItem("ruum-tema", theme);
    localStorage.setItem("ruum-theme", theme);
  }, mode);
  const id = "00000000-0000-4000-8000-000000000001";
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: id, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify({ access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, token_type: "bearer", user: { id, email: "conductor@example.test" } })).toString("base64url")}`, domain: "localhost", path: "/" }]);
}

export const screens: [string, string][] = [
  ["oferta", `/viajes/${trip(0)}`], ["prepara", `/viajes/${trip(1)}`],
  ["recogida", `/viajes/${trip(2)}`], ["verificacion", `/viajes/${trip(12)}`],
  ["recepcion", `/viajes/${trip(13)}`], ["inicio", `/viajes/${trip(14)}`],
  ["en-curso", `/viajes/${trip(4)}`], ["registra-entrega", `/viajes/${trip(15)}`],
  ["entrega", `/viajes/${trip(53)}?cierre=1`], ["cierre", `/viajes/${trip(60)}?cierre=1`],
  ["problema", `/viajes/${trip(1)}/soporte`], ["lista", "/viajes"],
];
