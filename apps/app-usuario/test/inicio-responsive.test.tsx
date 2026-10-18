/** @vitest-environment node */
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { InicioUsuarioProps } from "../src/app/InicioUsuario";
import { InicioUsuario } from "../src/app/InicioUsuario";
import { NavegacionUsuario } from "../src/app/NavegacionUsuario";
import { MobileShell } from "@ruum/ui";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@ruum/api/services", () => ({ crearLlamadaEnmascarada: vi.fn() }));
vi.mock("../src/lib/supabase-browser", () => ({ crearClienteNavegador: vi.fn(), tieneSupabaseConfigurado: () => true }));

// Opt-in: usa Chromium y el CSS real de un build previo, sin sesión ni datos privados.
// RUN_RESPONSIVE_UI=1 pnpm exec vitest run test/inicio-responsive.test.tsx
describe.skipIf(process.env.RUN_RESPONSIVE_UI !== "1")("Inicio sin scroll en navegador", () => {
  it("mantiene todos los módulos dentro del viewport, con y sin traslado", async () => {
    const { chromium } = await import("@playwright/test");
    const buildDir = process.env.RESPONSIVE_UI_BUILD_DIR ?? ".next";
    const manifest = readFileSync(path.resolve(buildDir, "server/app/page_client-reference-manifest.js"), "utf8");
    const archivosCss = [...new Set(manifest.match(/static\/css\/[\w.-]+\.css/g))];
    expect(archivosCss.length).toBeGreaterThan(0);
    const css = archivosCss.map((file) => readFileSync(path.resolve(buildDir, file), "utf8")).join("\n");
    const output = process.env.RESPONSIVE_UI_OUTPUT ?? path.join(os.tmpdir(), "ruum-inicio-responsive");
    mkdirSync(output, { recursive: true });
    const usuario = { nombre: "Verónica Martínez Fernández" } as InicioUsuarioProps["usuario"];
    const activo = {
      traslado_id: "demo", estado: "traslado_en_curso", creado_en: "2026-10-18",
      vehiculo_marca: "Mercedes-Benz", vehiculo_modelo: "Clase G Edición Especial", vehiculo_anio: 2026,
      vehiculo_placas: "ABC-123-D", origen_ciudad: "Ciudad de México", destino_ciudad: "Guadalajara",
      conductor_id: "demo-conductor", conductor_nombre: "José Luis Hernández Martínez", tiempo_estimado_horas: 35 + 13 / 60,
    } as InicioUsuarioProps["traslados"][number];
    const escenarios = [
      { nombre: "activo", traslados: [activo] },
      { nombre: "pendiente", traslados: [{ traslado_id: "pendiente", estado: "pago_pendiente" } as typeof activo] },
      { nombre: "vacio", traslados: [] },
    ];
    const tamanos = [[320, 568], [360, 640], [375, 667], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900], [667, 375], [844, 390], [393, 852]];
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.route("http://ruum.local/**", async (route) => {
        const name = new URL(route.request().url()).pathname;
        if (name === "/imagenes/ruum-logo.svg" || name === "/imagenes/ruum-logo-dark.svg") {
          await route.fulfill({ contentType: "image/svg+xml", body: readFileSync(path.join("public", name)) });
        } else await route.abort();
      });
      for (const escenario of escenarios) {
        const html = renderToStaticMarkup(<div id="contenido-principal">
          <NavegacionUsuario nombreUsuario={usuario?.nombre} notificacionesCount={1} />
          <MobileShell as="main" variant="compact" navInferiorVisible className="user-v2-scope user-dashboard-shell" contentClassName="user-dashboard-content">
            <div><InicioUsuario usuario={usuario} traslados={escenario.traslados} /></div>
          </MobileShell>
        </div>);
        for (const [width, height] of tamanos) {
          await page.setViewportSize({ width, height });
          await page.setContent(`<!doctype html><html lang="es"><head><base href="http://ruum.local/"><style>${css}</style></head><body>${html}</body></html>`);
          if (width === 393) {
            await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
            // Chromium de escritorio no expone notch: simular sus insets de 20/34px.
            await page.addStyleTag({ content: ".user-dashboard-header { padding-top: 20px; } .home-tab-navigation { padding-bottom: 34px; }" });
          }
          // Equivale a la medición de ResizeObserver que realiza la navegación al hidratar.
          await page.evaluate(() => document.documentElement.style.setProperty("--user-mobile-nav-height", `${document.querySelector("#bottomNavigation")!.getBoundingClientRect().height}px`));
          const errores = await page.evaluate(() => {
            const failures: string[] = [];
            const navTop = document.querySelector("#bottomNavigation")!.getBoundingClientRect().top;
            for (const selector of ["#homeHeader", "#greetingBlock", "#activeTransferCard", "#quickActions", ".home-support"]) {
              const el = document.querySelector(selector)!;
              const rect = el.getBoundingClientRect();
              if (rect.top < 0 || rect.bottom > navTop + 1 || rect.left < 0 || rect.right > innerWidth + 1) failures.push(`${selector} fuera de pantalla: ${JSON.stringify(rect.toJSON())}`);
            }
            const card = document.querySelector("#activeTransferCard")!.getBoundingClientRect();
            for (const el of document.querySelectorAll("#activeTransferCard > *, .home-stepper li, .home-module-copy")) {
              const rect = el.getBoundingClientRect();
              if (el.closest("#activeTransferCard") && (rect.bottom > card.bottom || rect.top < card.top)) failures.push(`${el.className} fuera de la tarjeta: ${rect.bottom} / ${card.bottom}`);
              if (el.scrollWidth > el.clientWidth + 1 && el.classList.contains("home-module-copy")) failures.push(`Texto de acceso rápido desbordado: ${el.textContent}, ${el.scrollWidth} / ${el.clientWidth}`);
            }
            if (document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth) failures.push("Scroll del documento");
            const content = document.querySelector(".user-dashboard-content")!;
            if (content.scrollHeight > content.clientHeight + 1) failures.push("Contenido recortado");
            return failures;
          });
          await page.screenshot({ path: path.join(output, `${escenario.nombre}-${width}x${height}.png`) });
          expect(errores, `${escenario.nombre} ${width}x${height}`).toEqual([]);
        }
      }
    } finally { await browser.close(); }
  }, 120_000);
});
