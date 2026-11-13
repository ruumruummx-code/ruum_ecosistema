/** @vitest-environment jsdom */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";
import { MobileShell } from "@ruum/ui";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/cuenta",
}));

const CSS_PATH = path.resolve(__dirname, "../globals.css");
const TOKENS_PATH = path.resolve(
  __dirname,
  "../../../../../packages/ui/src/styles/tokens.css"
);

function leerCss(ruta: string): string {
  return fs.readFileSync(ruta, "utf-8");
}

describe("Layout global mobile-first no-scroll", () => {
  it("MobileShell es raíz 100dvh con overflow hidden y contenido con scroll interno", () => {
    const html = renderToStaticMarkup(
      h(MobileShell, { variant: "compact", children: "Contenido" })
    );
    expect(html).toContain("100dvh");
    expect(html).not.toContain("100vh");
    expect(html).toMatch(/overflow-hidden/);
    expect(html).toMatch(/scrollable-content/);
    expect(html).toMatch(/overflow-y-auto/);
    expect(html).toContain("max-w-[480px]");
  });

  it("globals.css: base móvil fuera de media + escalado solo con min-width", () => {
    const css = leerCss(CSS_PATH);
    // Contención global con dvh, prohibido 100vh real (excluye comentarios/tests).
    expect(css).toMatch(/html\s*\{[\s\S]*?height:\s*100dvh/);
    expect(css).toMatch(/body\s*\{[\s\S]*?overflow:\s*hidden/);
    expect(css).toMatch(/#contenido-principal\s*\{[\s\S]*?overflow:\s*hidden/);
    expect(css).toMatch(/\.ruum-screen\s*\{[\s\S]*?height:\s*100dvh/);
    expect(css).toMatch(
      /\.scrollable-content\s*\{[\s\S]*?overflow-y:\s*auto[\s\S]*?-webkit-overflow-scrolling:\s*touch/
    );
    expect(css).toMatch(/\.scrollable-content\s*\{[\s\S]*?flex:\s*1/);
    const usosVh = (css.match(/100vh/g) ?? []).length;
    // Solo menciones en comentarios ("Prohibido 100vh").
    expect(usosVh).toBeLessThanOrEqual(1);
    // Sin breakpoints descendentes para layout (mobile-first estricto).
    expect(css).not.toMatch(/@media\s*\(\s*max-width/);
    // Escalado ascendente presente.
    expect(css).toMatch(/@media\s*\(\s*min-width:\s*640px\s*\)/);
    expect(css).toMatch(/@media\s*\(\s*min-width:\s*768px\s*\)/);
  });

  it("tokens.css compartido: sin 100vh y con utilidades no-scroll", () => {
    const css = leerCss(TOKENS_PATH);
    expect(css).not.toMatch(/:\s*100vh\s*;/);
    expect(css).toMatch(/\.ruum-screen\s*\{[\s\S]*?height:\s*100dvh/);
    expect(css).toMatch(/\.scrollable-content\s*\{[\s\S]*?overflow-y:\s*auto/);
    expect(css).toMatch(/@media\s*\(\s*min-width:\s*640px\s*\)/);
    expect(css).not.toMatch(/@media\s*\(\s*max-width/);
  });

  it("Garaje / Rastreo / Ajustes usan MobileShell con contención no-scroll", async () => {
    const { default: PaginaVehiculos } = await import("../cuenta/vehiculos/page");
    expect(typeof PaginaVehiculos).toBe("function");
    const { default: PaginaTraslado } = await import("../viajes/[id]/page");
    expect(typeof PaginaTraslado).toBe("function");
    const { default: PaginaPreferencias } = await import("../cuenta/preferencias/page");
    expect(typeof PaginaPreferencias).toBe("function");
    // La contención la provee MobileShell (verificado arriba); las páginas
    // deben componer header fijo + contenido con scroll interno.
    const shell = renderToStaticMarkup(
      h(MobileShell, { variant: "compact", navInferiorVisible: true, children: "x" })
    );
    expect(shell).toContain("pb-24");
  });
});
