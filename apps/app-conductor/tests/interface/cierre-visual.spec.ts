import { test, expect } from "@playwright/test";
import { session, screens, trip } from "./qa-session";

for (const mode of ["light", "dark"]) for (const street of [false, true]) for (const width of [320, 390]) {
  test(`capturas de cierre ${mode} calle-${street} ${width}`, async ({ page, context, request }, info) => {
    test.setTimeout(300_000);
    await request.get("http://127.0.0.1:54331/qa/reset");
    await session(page, context, mode);
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    const findings: unknown[] = [];
    async function capture(name: string) {
      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", mode);
      // La matriz fuerza ambos estados sobre las fixtures, sin cambiar la lógica del producto.
      await page.evaluate(value => { document.documentElement.dataset.street = String(value); }, street);
      const actions = page.locator(":is(button,a)[data-trip-primary]:visible, [data-trip-primary] > :is(button,a):last-child:visible");
      if (name === "lista") await expect(actions).toHaveCount(1);
      for (const primary of await actions.all()) {
        if (await page.getByRole("dialog").count()) continue;
        const disabled = await primary.isDisabled();
        if (!disabled) {
          await page.keyboard.press("Tab");
          await primary.focus();
        }
        const dimensions = await primary.boundingBox();
        const focus = await primary.evaluate(n => { const s = getComputedStyle(n); return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) }; });
        if (!dimensions || dimensions.height < 56 || (!disabled && (focus.style === "none" || focus.width === 0))) findings.push({ name, dimensions, focus });
      }
      const overflow = await page.evaluate(() => {
        scrollTo(0, document.documentElement.scrollHeight);
        return { y: scrollY, horizontal: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      if (overflow.y || overflow.horizontal) findings.push({ name, overflow });
      await page.screenshot({ path: info.outputPath(`${name}.png`) });
    }
    for (const [name, path] of screens) {
      await page.goto(path);
      if (name === "problema") {
        await page.getByRole("button", { name: "Abrir reporte", exact: true }).click();
        await expect(page.getByRole("dialog", { name: "¿Qué está ocurriendo?" })).toBeVisible();
      }
      await capture(name);
      if (name === "oferta") {
        await page.getByRole("button", { name: "Rechazar oferta" }).click();
        const dialog = page.getByRole("dialog", { name: "Motivo de rechazo" });
        await expect(dialog.locator('[class*="rejectOption"]')).toHaveCount(6);
        await capture("rechazo-seis-motivos");
      }
      if (name === "verificacion") {
        await page.getByRole("button", { name: "Abrir verificación", exact: true }).click();
        await expect(page.getByRole("dialog")).toBeVisible();
        const confirm = page.getByRole("dialog").getByRole("button", { name: "Confirmar verificación", exact: true });
        const colors = await confirm.evaluate(button => {
          const probe = document.createElement("span");
          probe.style.color = "var(--conductor-on-action)";
          probe.style.backgroundColor = "var(--conductor-action)";
          document.body.append(probe);
          const expected = getComputedStyle(probe).color;
          const background = getComputedStyle(probe).backgroundColor;
          const actual = getComputedStyle(button).color;
          const gradient = getComputedStyle(button).backgroundImage.match(/rgba?\([^)]+\)/g);
          const luminance = (value: string) => {
            const [r, g, b] = value.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
            return r * .2126 + g * .7152 + b * .0722;
          };
          const light = [luminance(actual), luminance(background)].sort((a, b) => b - a);
          probe.remove();
          return { expected, background, actual, gradient, contrast: (light[0] + .05) / (light[1] + .05) };
        });
        expect(colors.actual).toBe(colors.expected);
        expect(colors.gradient).toEqual([colors.background, colors.background]);
        expect(colors.contrast).toBeGreaterThanOrEqual(4.5);
        await capture("vin-placas");
      }
    }
    for (const [type, index] of [["inicial", 50], ["final", 51]] as const) {
      await page.goto(`/viajes/${trip(index)}/evidencia`);
      for (const [name, label] of [["foto", "1. Frente"], ["llaves", "6. Llaves"], ["mediciones", "7. Mediciones"], ["documentos", "8. Documentos"], ["observaciones", "9. Observaciones"], ["revision", "10. Revisión"]]) {
        await page.getByRole("button", { name: "Ver pasos", exact: true }).click();
        await page.getByRole("dialog", { name: "Pasos del registro" }).getByRole("button", { name: label, exact: true }).click();
        await capture(`${type}-${name}`);
      }
    }
    await info.attach("hallazgos.json", { body: JSON.stringify(findings, null, 2), contentType: "application/json" });
    expect(findings).toEqual([]);
  });
}
