import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { session } from "./qa-session";

for (const mode of ["light", "dark"]) for (const street of [false, true]) for (const width of [320, 390]) {
  test(`acciones de lista ${mode} calle-${street} ${width}`, async ({ page, context, request }, info) => {
    test.setTimeout(120_000);
    await request.get("http://127.0.0.1:54331/qa/reset");
    await session(page, context, mode);
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    async function check(name: string, count: number) {
      await expect(page.locator("html")).toHaveAttribute("data-theme", mode);
      await page.evaluate(value => { document.documentElement.dataset.street = String(value); }, street);
      const actions = page.locator(":is(a,button)[data-trip-primary]:visible");
      await expect(actions).toHaveCount(count);
      for (const action of await actions.all()) {
        const box = (await action.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(56);
        expect(box.width).toBeGreaterThanOrEqual(56);
        await page.keyboard.press("Tab");
        await action.focus();
        expect(await action.evaluate(n => getComputedStyle(n).outlineStyle)).toBe("solid");
      }
      expect(await page.evaluate(() => {
        scrollTo(0, document.documentElement.scrollHeight);
        return { y: scrollY, horizontal: document.documentElement.scrollWidth > innerWidth + 1 };
      })).toEqual({ y: 0, horizontal: false });
      const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(audit.violations.map(v => v.id)).toEqual([]);
      await info.attach(`${name}-axe.json`, { body: JSON.stringify({ violations: audit.violations.length }), contentType: "application/json" });
      await page.screenshot({ path: info.outputPath(`${name}.png`) });
    }
    await page.goto("/viajes");
    await expect(page.getByRole("button", { name: "Recargar ofertas", exact: true })).toHaveAttribute("data-trip-primary", "true");
    await check("lista", 1);
    await request.get("http://127.0.0.1:54331/qa/list?mode=populated");
    await page.reload();
    const offer = page.getByRole("link", { name: "Ver detalles de la oferta", exact: true });
    await expect(offer).toHaveAttribute("data-trip-primary", "true");
    await expect(offer).toHaveAttribute("href", /\/viajes\//);
    await check("oferta-lista", 1);
    await page.getByRole("button", { name: "Aceptados (3)", exact: true }).click();
    const options = page.getByRole("button", { name: "Opciones de traslado", exact: true });
    await expect(options).toHaveAttribute("aria-haspopup", "dialog");
    await check("aceptado-lista", 2);
    await options.click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
}
