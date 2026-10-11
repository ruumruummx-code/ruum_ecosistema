import { describe, expect, it } from "vitest";
import { buildCspEstaticoPanel, buildCspPanel } from "./csp";

describe("csp panel-admin — fachada con nonce", () => {
  it("en prod emite nonce + strict-dynamic y frame-ancestors none", () => {
    const csp = buildCspPanel("abc123", true);
    expect(csp).toContain("'nonce-abc123'");
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("https://verify.didit.me");
  });

  it("el fallback estático no lleva nonce pero mantiene el esqueleto", () => {
    const csp = buildCspEstaticoPanel(true);
    expect(csp).not.toContain("nonce-");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
  });

  it("en dev permite localhost y utilidades de debug", () => {
    const csp = buildCspPanel("n", false);
    expect(csp).toContain("http://localhost:*");
    expect(csp).toContain("'unsafe-eval'");
  });
});
