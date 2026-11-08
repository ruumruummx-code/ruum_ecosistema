import { expect, test, type Locator, type Page } from "@playwright/test";

const sizes = [{ width: 320, height: 568 }, { width: 390, height: 844 }];
const trip = (i: number) => `10000000-0000-4000-8000-${String(i).padStart(12, "0")}`;

test.beforeEach(async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("CapacitorStorage.ruum_conductor_onboarding_visto", "1"));
  const id = "00000000-0000-4000-8000-000000000001";
  const token = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: id, role: "authenticated", aud: "authenticated", exp: 2100000000 })).toString("base64url")}.e2e-signature`;
  await context.addCookies([{ name: "sb-127-auth-token", value: `base64-${Buffer.from(JSON.stringify({ access_token: token, refresh_token: "e2e-refresh-only", expires_at: 2100000000, token_type: "bearer", user: { id, email: "conductor@example.test" } })).toString("base64url")}`, domain: "localhost", path: "/" }]);
});

async function hit(target: Locator, height?: number) {
  await expect(target).toBeVisible();
  await expect.poll(() => target.evaluate((node, limit) => {
    const rect = node.getBoundingClientRect();
    const element = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return rect.left >= 0 && rect.right <= innerWidth + 1 && rect.top >= 0 && rect.bottom <= (limit ?? innerHeight) + 1 && !!element && node.contains(element);
  }, height)).toBe(true);
}
async function still(page: Page) {
  expect(await page.evaluate(() => { scrollTo(0, document.documentElement.scrollHeight); return { y: scrollY, horizontal: document.documentElement.scrollWidth > innerWidth + 1 }; })).toEqual({ y: 0, horizontal: false });
}
async function keyboard(page: Page, height: number) {
  await page.evaluate(h => { Object.defineProperty(visualViewport, "height", { configurable: true, value: h }); visualViewport!.dispatchEvent(new Event("resize")); }, height);
}

for (const size of sizes) {
  test(`marcos y retorno persistente ${size.width}`, async ({ page, context }, info) => {
    await page.setViewportSize(size);
    for (const path of ["/cuenta/preferencias", "/cuenta/seguridad", "/cuenta/soporte", "/cuenta/legal", "/ganancias/historial", "/notificaciones", "/cuenta/perfil", "/cuenta/documentos", "/cuenta/datos-bancarios", "/legal/terminos"]) {
      await test.step(path, async () => {
        await page.goto(path);
        await expect(page.locator("h1").first()).toBeVisible();
        const frame = page.locator("[data-conductor-screen]");
        await expect(frame).toHaveCount(1);
        await expect.poll(() => frame.evaluate(n => n.getBoundingClientRect().width)).toBeLessThanOrEqual(440);
        const nav = page.getByRole("navigation", { name: "Navegación principal móvil", exact: true });
        await expect(nav).toBeVisible(); await expect(nav.getByRole("link")).toHaveText(["Inicio", "Traslados", "Cuenta"]);
        const returnLink = frame.locator(":scope > div:first-child").getByRole("link").first();
        await hit(returnLink);
        await frame.locator("[data-screen-body]").evaluate(n => { n.scrollTop = n.scrollHeight; });
        await hit(returnLink); await still(page);
        await page.screenshot({ path: info.outputPath(path.slice(1).replaceAll("/", "-") + ".png") });
      });
    }
    await context.clearCookies();
    await page.goto("/recuperar-password");
    await expect(page.getByRole("heading", { name: "Recuperar contraseña" })).toBeVisible();
    await hit(page.getByRole("button", { name: "Enviar enlace" }));
    await page.getByRole("textbox", { name: "Correo electrónico" }).focus();
    await keyboard(page, 320);
    await hit(page.getByRole("button", { name: "Enviar enlace" }), 320);
    await still(page);
  });

  test(`diálogos nativos y foco ${size.width}`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize(size); await page.goto("/panel");
    await expect(page.getByRole("heading", { name: /^¡Hola,/ })).toBeVisible();
    for (const [buttonName, title] of [["Abrir menú", "Menú"], ["GPS:", "Salud operacional"]]) {
      const trigger = buttonName === "GPS:" ? page.getByRole("button", { name: /^GPS:/ }) : page.getByRole("button", { name: buttonName, exact: true });
      await trigger.click(); const dialog = page.getByRole("dialog", { name: title, exact: true });
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate(n => n.matches(":modal") && n.contains(document.activeElement))).toBe(true);
      for (const key of ["Tab", "Shift+Tab"]) for (let i = 0; i < 12; i++) { await page.keyboard.press(key); expect(await dialog.evaluate(n => n.contains(document.activeElement))).toBe(true); }
      await hit(dialog.getByRole("button", { name: "Cerrar diálogo", exact: true }));
      await page.screenshot({ path: info.outputPath(title + ".png") });
      await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
    }
    expect(errors.filter(e => /418|hydration|hydrating/i.test(e))).toEqual([]);
  });

  test(`navegación única y emergencia completa ${size.width}`, async ({ page }) => {
    await page.setViewportSize(size);
    for (const index of [1, 2, 3, 4]) {
      await page.goto(`/viajes/${trip(index)}`);
      await expect(page.locator("h1").first()).toBeVisible();
      const nav = page.getByRole("navigation", { name: "Navegación principal móvil", exact: true });
      await expect(nav.filter({ visible: true })).toHaveCount(1);
      await expect(nav.filter({ visible: true }).getByRole("link")).toHaveText(["Inicio", "Traslados", "Cuenta"]);
      const emergency = page.getByRole("button", { name: "Abrir emergencia", exact: true });
      await hit(emergency);
      const rect = await emergency.boundingBox(); expect(rect!.height).toBeGreaterThanOrEqual(48); expect(rect!.width).toBeGreaterThanOrEqual(48);
      await hit(page.locator("[data-trip-primary]").getByRole("button").last());
      await still(page);
    }
  });
}

test("banco: acción y contraste del marco con teclado y tema oscuro", async ({ page }) => {
  await page.setViewportSize(sizes[0]); await page.goto("/cuenta/datos-bancarios");
  const save = page.getByRole("button", { name: "Guardar y continuar" });
  await page.locator("#bank-titularCuenta").focus(); await keyboard(page, 320);
  await hit(save, 320); expect((await save.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  expect(await page.locator("[data-screen-action]").evaluate(n => n.getBoundingClientRect().bottom)).toBeLessThanOrEqual(320);
  await still(page);
  await keyboard(page, 568);
  await page.evaluate(() => { localStorage.setItem("ruum-tema", "dark"); localStorage.setItem("ruum-theme", "dark"); });
  await page.goto("/viajes"); await expect(page.locator("h1")).toBeVisible();
  const colors = await page.locator("h1").evaluate(n => ({ text: getComputedStyle(n).color, surface: getComputedStyle(document.querySelector("[data-conductor-screen=list]")!).backgroundColor }));
  function luminance(color: string) {
    const rgb = color.match(/\d+/g)!.slice(0, 3).map(Number).map(n => n / 255).map(n => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  }
  const values = [luminance(colors.text), luminance(colors.surface)].sort((a, b) => b - a);
  expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
});

test("las rutas declaran una variante sin propietarios implícitos", async () => {
  const { CONDUCTOR_ROUTE_CONTRACT, conductorRouteContract } = await import("../../src/app/components/route-contract");
  const { readdir } = await import("node:fs/promises");
  const { resolve, relative } = await import("node:path");
  const root = resolve("src/app");
  async function walk(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(resolve(dir, entry.name)) : Promise.resolve(entry.name === "page.tsx" ? [resolve(dir, entry.name)] : [])))).flat();
  }
  const routes = (await walk(root)).map(file => ("/" + relative(root, file)).replace(/[\\/]page\.tsx$/, "").replace(/\\/g, "/") || "/");
  expect(routes.sort()).toEqual(Object.keys(CONDUCTOR_ROUTE_CONTRACT).sort());
  expect(conductorRouteContract(`/viajes/${trip(1)}/evidencia`).variant).toBe("form");
  expect(conductorRouteContract("/login").navigation).toBe(false);
});

for (const size of sizes) {
  test(`resistencia a texto ampliado, referencias largas y diálogo con teclado ${size.width}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/cuenta/preferencias");
    await expect(page.locator("[data-conductor-screen]")).toBeVisible();
    await page.locator("[data-screen-body]").evaluate(node => {
      const p = document.createElement("p");
      p.textContent = "Referencia completa de acceso a la ubicación del conductor. ".repeat(100);
      node.append(p);
    });
    await page.evaluate(() => {
      const nodes = [...document.querySelectorAll<HTMLElement>("h1,h2,p,label,a,button,span")].map(node => ({ node, font: parseFloat(getComputedStyle(node).fontSize), line: getComputedStyle(node).lineHeight }));
      for (const { node, font, line } of nodes) { node.style.fontSize = `${font * 2}px`; if (line !== "normal") node.style.lineHeight = `${parseFloat(line) * 2}px`; }
    });
    const back = page.getByRole("link", { name: "Volver a Cuenta", exact: true });
    await hit(back); await still(page);
    const body = page.locator("[data-screen-body]");
    expect(await body.evaluate(node => node.scrollHeight > node.clientHeight)).toBe(true);
    await body.focus(); await page.keyboard.press("End");
    await expect.poll(() => body.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    await hit(back);

    await page.goto("/cuenta/datos-bancarios");
    const trigger = page.getByRole("button", { name: "Confirma tu sesión", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Confirma tu sesión", exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Contraseña actual").focus();
    await keyboard(page, 320);
    await dialog.getByRole("region").evaluate(node => {
      const p = document.createElement("p"); p.textContent = "Ayuda para recuperar el acceso. ".repeat(100); node.append(p);
      node.scrollTop = node.scrollHeight;
    });
    await hit(dialog.getByRole("button", { name: "Cerrar diálogo", exact: true }), 320);
    await page.keyboard.press("Escape"); await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused(); await still(page);
  });
}
