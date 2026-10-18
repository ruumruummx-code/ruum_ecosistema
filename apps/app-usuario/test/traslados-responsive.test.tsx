/** @vitest-environment node */
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../src/app/NavegacionUsuario";
import { MisTrasladosCliente, type ViajeLista } from "../src/app/mis-viajes/MisViajesCliente";

vi.mock("next/navigation", () => ({ usePathname: () => "/mis-viajes" }));

// RUN_RESPONSIVE_UI=1 pnpm exec vitest run test/traslados-responsive.test.tsx
// Requiere un build previo: comprueba el CSS de producción sin datos privados.
describe.skipIf(process.env.RUN_RESPONSIVE_UI !== "1")("Traslados sin scroll de página", () => {
  it("conserva header, tabs, KPI, buscador, tarjeta y navegación en 11 tamaños", async () => {
    const { chromium } = await import("@playwright/test");
    const buildDir = process.env.RESPONSIVE_UI_BUILD_DIR ?? ".next";
    const manifest = readFileSync(path.resolve(buildDir, "server/app/mis-viajes/page_client-reference-manifest.js"), "utf8");
    const archivos = [...new Set(manifest.match(/static\/css\/[\w.-]+\.css/g))];
    expect(archivos.length).toBeGreaterThan(0);
    const css = archivos.map((file) => readFileSync(path.resolve(buildDir, file), "utf8")).join("\n");
    const output = process.env.RESPONSIVE_UI_OUTPUT ?? path.join(os.tmpdir(), "ruum-traslados-responsive");
    mkdirSync(output, { recursive: true });
    const viaje = (id: string, estado: string, monto = 0) => ({
      pasaporte: { traslado_id: id, estado, monto_pagado: monto, vehiculo_marca: "Mercedes-Benz", vehiculo_modelo: "Clase G Edición Especial", vehiculo_anio: 2026, vehiculo_tipo: "suv", origen_ciudad: "Ciudad de México", destino_ciudad: "Guadalajara" }, traslado: null,
    } as unknown as ViajeLista);
    const prototipo = [...Array.from({ length: 221 }, (_, i) => viaje(`programado-${i}`, "solicitud_creada")), viaje("finalizado", "servicio_cerrado", 229000)];
    const escenarios = [
      { nombre: "prototipo", viajes: prototipo },
      { nombre: "vacio", viajes: [] },
      { nombre: "con-resultados", viajes: Array.from({ length: 12 }, (_, i) => viaje(`activo-${i}`, "traslado_en_curso")) },
    ];
    const tamanos = [[320, 568], [360, 640], [375, 667], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900], [667, 375], [844, 390], [393, 852]];
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      for (const escenario of escenarios) {
        const html = renderToStaticMarkup(<div id="contenido-principal">
          <NavegacionUsuario notificaciones={[{ id: "demo", tono: "info", mensaje: "Tu cuenta está en proceso de verificación." }]} />
          <MobileShell as="main" variant="compact" navInferiorVisible className="user-v2-scope user-transfers-shell" contentClassName="user-transfers-content">
            <MisTrasladosCliente Traslados={escenario.viajes} pestanaInicial="activos" />
          </MobileShell>
        </div>);
        for (const [width, height] of tamanos) {
          await page.setViewportSize({ width, height });
          await page.setContent(`<!doctype html><html lang="es"><head><style>${css}</style></head><body>${html}</body></html>`);
          if (width === 393) {
            await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
            await page.addStyleTag({ content: ".user-transfers-page-header { padding-top: 20px; } .user-transfers-nav { padding-bottom: 34px; }" });
          }
          await page.evaluate(() => document.documentElement.style.setProperty("--user-mobile-nav-height", `${document.querySelector("#bottomNavigation")!.getBoundingClientRect().height}px`));
          const errores = await page.evaluate(() => {
            const failures: string[] = [];
            const navTop = document.querySelector("#bottomNavigation")!.getBoundingClientRect().top;
            for (const selector of ["#homeHeader", ".user-transfers-tabs", ".user-transfers-stats", ".user-transfers-search", "#lista-traslados"]) {
              const rect = document.querySelector(selector)!.getBoundingClientRect();
              if (rect.top < 0 || rect.bottom > navTop + 1 || rect.left < 0 || rect.right > innerWidth + 1) failures.push(`${selector} fuera del viewport: ${JSON.stringify(rect.toJSON())}`);
            }
            for (const el of document.querySelectorAll(".user-transfers-tabs > button")) {
              if (el.scrollWidth > el.clientWidth + 1) failures.push(`Pestaña recortada: ${el.textContent}, ${el.scrollWidth}/${el.clientWidth}`);
            }
            const empty = document.querySelector(".user-transfers-empty");
            if (empty) {
              const rect = empty.getBoundingClientRect();
              for (const el of empty.children) {
                const child = el.getBoundingClientRect();
                if (child.top < rect.top || child.bottom > rect.bottom || child.right > rect.right || child.left < rect.left) failures.push(`Estado vacío recortado: ${el.className}`);
              }
              if (empty.scrollHeight > empty.clientHeight + 1) failures.push("Scroll del estado vacío");
            }
            const content = document.querySelector(".user-transfers-content")!;
            if (content.scrollHeight > content.clientHeight + 1) failures.push("Contenido del shell recortado");
            if (document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth) failures.push("Scroll de página");
            return failures;
          });
          await page.screenshot({ path: path.join(output, `${escenario.nombre}-${width}x${height}.png`) });
          expect(errores, `${escenario.nombre} ${width}x${height}`).toEqual([]);
        }
      }
    } finally { await browser.close(); }
  }, 120_000);
});
