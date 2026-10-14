import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(__dirname, "../src/app/globals.css"), "utf8");
function color(token: string) {
  const valor = css.match(new RegExp(`--user-color-${token}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
  if (!valor) throw new Error(`Falta el token ${token}`);
  return valor;
}
function luminancia(hex: string) {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contraste(a: string, b: string) {
  const valores = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (valores[0] + 0.05) / (valores[1] + 0.05);
}

describe("contraste de texto móvil", () => {
  it.each(["primary", "muted", "brand-dark", "success-ink", "pending-ink", "action"])("%s cumple AA sobre las superficies claras", (token) => {
    for (const fondo of ["surface", "background", "surface-soft"]) {
      expect(contraste(color(token), color(fondo)), `${token} sobre ${fondo}`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("el CTA conserva contraste AA", () => {
    expect(contraste(color("action"), color("on-action"))).toBeGreaterThanOrEqual(4.5);
  });
});
