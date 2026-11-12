import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { session, screens, trip } from "../interface/qa-session";

for (const mode of ["light", "dark"]) for (const width of [320, 390]) {
  test(`operación accesible ${mode} ${width}`, async ({ page, context, request }, info) => {
    test.setTimeout(300_000);
    await request.get("http://127.0.0.1:54331/qa/reset");
    await session(page, context, mode);
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    async function audit(name: string) {
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      await info.attach(`${name}.json`, { body: JSON.stringify(result, null, 2), contentType: "application/json" });
      expect.soft(result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
    }
    for (const [name, path] of [...screens, ["evidencia-inicial", `/viajes/${trip(50)}/evidencia`], ["evidencia-final", `/viajes/${trip(51)}/evidencia`]]) {
      await test.step(name, async () => {
        await page.goto(path);
        await expect(page.locator("h1").first()).toBeVisible();
        if (name === "problema") {
          await page.getByRole("button", { name: "Abrir reporte", exact: true }).click();
          await expect(page.getByRole("dialog", { name: "¿Qué está ocurriendo?" })).toBeVisible();
        }
        await audit(name);
        if (name === "oferta") {
          await page.getByRole("button", { name: "Rechazar oferta" }).click();
          await expect(page.getByRole("dialog", { name: "Motivo de rechazo" })).toBeVisible();
          await audit("rechazo");
        }
        if (name === "verificacion") {
          await page.getByRole("button", { name: "Abrir verificación", exact: true }).click();
          await expect(page.getByRole("dialog")).toBeVisible();
          await audit("vin-placas");
        }
      });
    }
    for (const index of [50, 51]) {
      await page.goto(`/viajes/${trip(index)}/evidencia`);
      for (const label of ["6. Llaves", "7. Mediciones", "8. Documentos", "9. Observaciones", "10. Revisión"]) {
        await page.getByRole("button", { name: "Ver pasos", exact: true }).click();
        await page.getByRole("dialog", { name: "Pasos del registro" }).getByRole("button", { name: label, exact: true }).click();
        await audit(`${index}-${label}`);
      }
    }
  });
}
