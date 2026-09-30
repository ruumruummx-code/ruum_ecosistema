import { describe, expect, it } from "vitest";
import tokens from "../../../../design-system/tokens/tokens.json";
import { estadoVisualDesdeTecnico } from "./status-mapping";

// Contraste relativo WCAG
function luminancia(hex: string) {
  const c = hex.replace("#", "");
  const rgb = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
}
function contraste(a: string, b: string) {
  const l1 = luminancia(a);
  const l2 = luminancia(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe("design-system v1.0 — tokens", () => {
  const t = tokens.color.light;

  it("expone todos los tokens obligatorios", () => {
    expect(t.navy).toBe("#0A2342");
    expect(t["teal-deep"]).toBe("#008B8B");
    expect(t.action).toBe("#0066FF");
    expect(tokens.size.touch).toBe(44);
    expect(tokens.size["touch-street"]).toBe(56);
    expect(tokens.motion.micro).toBe("150ms");
  });

  it("contraste texto ≥4.5:1 en combinaciones de chip", () => {
    expect(contraste(t.navy, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(contraste(t["success-text"], t["success-bg"])).toBeGreaterThanOrEqual(4.5);
    expect(contraste(t["warning-text"], t["warning-bg"])).toBeGreaterThanOrEqual(4.5);
    expect(contraste(t.error, t["error-bg"])).toBeGreaterThanOrEqual(4.5);
    expect(contraste(t["text-secondary"], "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    // Discrepancia verificada: el Libro (cap. 13) declara teal-deep 4.87:1 sobre blanco,
    // pero el cálculo WCAG da ~4.15:1. Se usa teal-deep solo para texto grande (≥24px o
    // 18.66 bold, umbral 3:1) y elementos UI; el texto corrido usa navy/muted/action.
    expect(contraste(t["teal-deep"], "#FFFFFF")).toBeGreaterThanOrEqual(3.0);
    expect(contraste(t.action, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
  });

  it("teal brillante nunca con blanco (solo gráfico)", () => {
    // 2.23:1 aprox — debe fallar con blanco, pasar con navy
    expect(contraste(t.teal, "#FFFFFF")).toBeLessThan(4.5);
    expect(contraste(t.teal, t.navy)).toBeGreaterThanOrEqual(4.5);
  });

  it("botón de seguridad cumple AA en ambos temas", () => {
    expect(contraste(tokens.streetMode.safetyButtonColor.light, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    expect(contraste(tokens.streetMode.safetyButtonColor.dark, tokens.color.dark.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("mapea los 12 estados visuales sin huecos", () => {
    const tecnicos = [
      "solicitud_creada", "cotizacion_aceptada", "pendiente_de_conductor", "conductor_asignado",
      "evidencia_inicial_completada", "traslado_en_curso", "entrega_confirmada", "servicio_cerrado",
      "evidencia_final_en_proceso", "incidencia_reportada", "servicio_cancelado", "pago_pendiente",
    ];
    const visuales = new Set(tecnicos.map(estadoVisualDesdeTecnico));
    expect(visuales.size).toBeGreaterThanOrEqual(9);
  });
});

describe("dark mode v1.0 — tokens", () => {
  const d = tokens.color.dark;

  it("expone todos los tokens oscuros obligatorios", () => {
    expect(d.bg).toBe("#061529");
    expect(d.surface).toBe("#0A2342");
    expect(d["surface-elevated"]).toBe("#0F2D52");
    expect(d["text-primary"]).toBe("#F6F8FB");
    expect(d["teal-deep"]).toBe("#00B3B3");
    expect(d.action).toBe("#4D94FF");
    expect(d.emergency).toBe("#FF4D3D");
    expect(tokens.gradient.dark.cta).toBe("linear-gradient(90deg, #00B3B3 0%, #4D94FF 100%)");
  });

  it("sin negro puro en la paleta oscura", () => {
    const valores: string[] = [];
    JSON.stringify({ color: d, gradient: tokens.gradient.dark }, (_k, v) => {
      if (typeof v === "string" && /^#[0-9A-Fa-f]{6}$/.test(v)) valores.push(v.slice(1).toUpperCase());
      return v;
    });
    expect(valores.length).toBeGreaterThan(0);
    for (const v of valores) expect(v).not.toBe("000000");
  });

  it("contraste texto ≥4.5:1 sobre fondo oscuro", () => {
    const bg = d.bg;
    expect(contraste(d["text-primary"], bg)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(d["text-secondary"], bg)).toBeGreaterThanOrEqual(4.5);
    // Desviación documentada: la spec fija text-muted #6B7A99 (4.24:1); se usa
    // #8293B0 (≥5:1 en fondo y superficie) para cumplir el criterio crítico #1.
    expect(contraste(d["text-muted"], bg)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(d.teal, bg)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(d["teal-deep"], bg)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(d.action, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("chips de estado oscuros ≥4.5:1", () => {
    expect(contraste(d["neutral-text"], d["neutral-bg"])).toBeGreaterThanOrEqual(4.5);
    expect(contraste(d["action-text-state"], d["action-bg-state"])).toBeGreaterThanOrEqual(4.5);
    expect(contraste(d["warning-text"], d["warning-bg"])).toBeGreaterThanOrEqual(4.5);
    expect(contraste(d["success-text"], d["success-bg"])).toBeGreaterThanOrEqual(4.5);
    expect(contraste(d["error-text"], d["error-bg"])).toBeGreaterThanOrEqual(4.5);
    expect(contraste(d["incident-text"], d["incident-bg"])).toBeGreaterThanOrEqual(4.5);
    expect(contraste(d.emergency, d["emergency-bg"])).toBeGreaterThanOrEqual(4.5);
  });

  it("CTA oscuro usa texto navy (el blanco no alcanza 4.5 en #00B3B3)", () => {
    // Discrepancia verificada con la spec §2.4: blanco sobre #00B3B3 ≈ 2.6:1.
    // Se usa texto #061529 (≈7:1) en ambos extremos del degradado.
    expect(contraste("#FFFFFF", "#00B3B3")).toBeLessThan(4.5);
    expect(contraste("#061529", "#00B3B3")).toBeGreaterThanOrEqual(4.5);
    expect(contraste("#061529", "#4D94FF")).toBeGreaterThanOrEqual(4.5);
  });
});
