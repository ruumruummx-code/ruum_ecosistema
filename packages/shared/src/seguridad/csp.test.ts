import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCsp,
  buildCspEstatico,
  CSP_ORIGINS,
  CSP_PRESETS,
  HSTS_HEADER,
  IMAGE_FORMATS,
  IMAGES_REMOTE_PATTERNS,
  PERMISSIONS_POLICY,
} from "./csp";

function directive(policy: string, name: string): string {
  return policy.split("; ").find((part) => part.startsWith(`${name} `)) ?? "";
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("CSP", () => {
  it("uses a request nonce and strict-dynamic for production scripts", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    const policy = buildCsp({
      nonce: "request-nonce",
      isProd: true,
      strictStyles: false,
      extras: CSP_PRESETS.conductor,
    });

    expect(directive(policy, "script-src")).toBe(
      `script-src 'self' 'nonce-request-nonce' 'strict-dynamic' ${CSP_ORIGINS.sentry.join(" ")}`,
    );
    expect(directive(policy, "script-src")).not.toContain("unsafe-");
    expect(directive(policy, "connect-src")).toContain("https://project.supabase.co");
    expect(directive(policy, "style-src")).toContain("'unsafe-inline'");
  });

  it("keeps development scripts and connections usable for HMR", () => {
    const policy = buildCsp({ nonce: "dev-nonce", isProd: false });

    expect(directive(policy, "script-src")).toContain("'unsafe-inline' 'unsafe-eval'");
    expect(directive(policy, "style-src")).toContain("'nonce-dev-nonce'");
    expect(directive(policy, "connect-src")).toContain("ws: wss:");
    expect(directive(policy, "connect-src")).toContain("http://localhost:*");
  });

  it("supports strict production styles in dynamic and static policies", () => {
    const dynamic = buildCsp({
      nonce: "request-nonce",
      isProd: true,
      strictStyles: true,
    });
    const staticPolicy = buildCspEstatico(true, {}, true);

    expect(directive(dynamic, "style-src")).toBe("style-src 'self' 'nonce-request-nonce'");
    expect(dynamic).not.toContain("style-src-attr");
    expect(directive(staticPolicy, "style-src")).toBe("style-src 'self'");
    expect(directive(staticPolicy, "script-src")).not.toContain("unsafe-");
  });

  it("includes the shared image, app preset, and security header configuration", () => {
    expect(CSP_PRESETS.conductor.script).toEqual(CSP_ORIGINS.sentry);
    expect(CSP_PRESETS.usuario.script).toContain("https://js.stripe.com");
    expect(CSP_PRESETS.usuario.frame).toContain("https://hooks.stripe.com");
    expect(IMAGES_REMOTE_PATTERNS).toContainEqual({
      protocol: "https",
      hostname: "**.supabase.co",
    });
    expect(IMAGE_FORMATS).toEqual(["image/avif", "image/webp"]);
    expect(HSTS_HEADER).toContain("max-age=63072000");
    expect(PERMISSIONS_POLICY).toContain("camera=(self");
    expect(PERMISSIONS_POLICY).toContain("geolocation=(self");
  });
});


it("permite Realtime solo en el origen Supabase configurado en producción", () => {
  const anterior = process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proyecto.supabase.co:8443/rest/v1";
  try {
    const csp = buildCsp({ nonce: "prueba", isProd: true });
    const connect = csp.split(";").find((directiva) => directiva.trim().startsWith("connect-src"));
    expect(connect?.trim().split(/\s+/)).toContain("wss://proyecto.supabase.co:8443");
    expect(connect?.trim().split(/\s+/)).not.toContain("wss:");
    expect(connect).not.toContain("wss://*");
  } finally {
    if (anterior === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = anterior;
  }
});
