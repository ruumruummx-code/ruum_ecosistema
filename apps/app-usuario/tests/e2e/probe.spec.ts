import { expect, test } from "@playwright/test";
import { seedMockAuthSession } from "./fixtures/sesion";

test("probe: timeline de dialog y sesion en /viajes/nuevo", async ({ page }) => {
  const eventos: string[] = [];
  page.on("response", (res) => {
    if (res.url().includes("54399")) eventos.push(`RESP ${res.status()} ${res.request().method()} ${res.url().slice(0, 120)}`);
  });
  page.on("requestfailed", (req) => {
    if (req.url().includes("54399")) eventos.push(`FAIL ${req.method()} ${req.url().slice(0, 120)} :: ${req.failure()?.errorText}`);
  });
  const consola: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consola.push(msg.text().slice(0, 200));
  });

  await seedMockAuthSession(page, { variante: "verificada" });
  const inicio = Date.now();
  await page.goto("/viajes/nuevo", { waitUntil: "domcontentloaded" });

  const muestras: unknown[] = [];
  for (const msDeEspera of [2000, 2000, 3000, 5000, 10000]) {
    await page.waitForTimeout(msDeEspera);
    const estado = await page.evaluate(() => {
      const dlg = document.querySelector<HTMLDialogElement>('dialog[aria-label="Carga masiva de traslados"]');
      const centro = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      return {
        display: dlg ? getComputedStyle(dlg).display : "SIN-DIALOG",
        styleAttr: dlg?.getAttribute("style") ?? "SIN-DIALOG",
        open: dlg?.open ?? "SIN-DIALOG",
        centro: centro ? `${centro.tagName}.${String(centro.className).slice(0, 50)}` : "NINGUNO",
        errorSesion: document.body.innerText.includes("No pudimos validar tu sesi"),
        formulario: Boolean(document.querySelector("#gate-origenCodigoPostal")),
      };
    });
    muestras.push(`+${Date.now() - inicio}ms ${JSON.stringify(estado)}`);
  }

  for (const m of muestras) console.log("PROBE-T:", m);
  console.log("PROBE-EVENTOS:", JSON.stringify([...new Set(eventos)], null, 1));
  console.log("PROBE-CONSOLA:", JSON.stringify([...new Set(consola)], null, 1));
  expect(true).toBe(true);
});
