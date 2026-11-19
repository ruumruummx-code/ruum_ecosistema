import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

/**
 * Recuperación de contraseña con el ENLACE REAL del correo (sin mocks).
 *
 * Cubre el defecto de la auditoría 2026-11-19: /api/recovery/request usaba un
 * cliente PKCE sin cookies y el code_verifier nunca llegaba al navegador, así
 * que /auth/callback fallaba al canjear el `code` («otro_dispositivo»). Las
 * pruebas con Supabase simulado no lo detectaban.
 *
 * Requisitos (por eso se activa explícitamente):
 *   RUN_RECOVERY_REAL_E2E=1
 *   NEXT_PUBLIC_SUPABASE_URL      → Supabase local (`supabase start`) o staging
 *   SUPABASE_SERVICE_ROLE_KEY     → para crear el usuario de prueba
 *   MAILPIT_URL                   → API del buzón de pruebas (local: http://127.0.0.1:54324)
 * La app debe correr contra ese mismo Supabase.
 */
const activo = process.env.RUN_RECOVERY_REAL_E2E === "1";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const mailpit = (process.env.MAILPIT_URL ?? "http://127.0.0.1:54324").replace(/\/$/, "");

test.describe("recuperación con enlace real de correo", () => {
  test.skip(!activo, "Define RUN_RECOVERY_REAL_E2E=1 con Supabase y Mailpit reales.");

  test("el enlace del correo abre /nueva-password en el mismo navegador", async ({ page }) => {
    const correo = `recovery-${randomUUID().slice(0, 8)}@example.test`;
    const crear = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: correo, password: `Ruum-${randomUUID()}`, email_confirm: true }),
    });
    expect(crear.ok).toBeTruthy();

    await page.goto("/recuperar-password");
    await page.getByLabel(/correo/i).fill(correo);
    await page.getByRole("button", { name: /enviar enlace/i }).click();
    await expect(page.getByText(/correo enviado/i)).toBeVisible({ timeout: 15_000 });

    // El verificador PKCE debe haber quedado como cookie en este navegador.
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name.endsWith("-auth-token-code-verifier"))).toBeTruthy();

    let enlace: string | null = null;
    for (let intento = 0; intento < 20 && !enlace; intento++) {
      const lista = await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:${correo}`)}`).then((r) => r.json());
      const id = lista?.messages?.[0]?.ID;
      if (id) {
        const mensaje = await fetch(`${mailpit}/api/v1/message/${id}`).then((r) => r.json());
        const html = String(mensaje?.HTML ?? mensaje?.Text ?? "");
        enlace = html.match(/https?:\/\/[^"'\s<>]+(?:verify|callback)[^"'\s<>]*/)?.[0]?.replaceAll("&amp;", "&") ?? null;
      }
      if (!enlace) await page.waitForTimeout(500);
    }
    expect(enlace, "No llegó el correo de recuperación a Mailpit").toBeTruthy();

    await page.goto(enlace!);
    await expect(page).toHaveURL(/\/nueva-password/, { timeout: 15_000 });
    await expect(page).not.toHaveURL(/otro_dispositivo|enlace_invalido/);
  });
});
