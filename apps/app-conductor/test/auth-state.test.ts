import { describe, expect, it } from "vitest";
import { tieneSesionSupabase, type PlaywrightStorageState } from "../tests/auth-state";

function sessionValue(expiresAt = Math.floor(Date.now() / 1000) + 3600) {
  const session = JSON.stringify({
    access_token: "access-token",
    refresh_token: "refresh-token",
    expires_at: expiresAt,
  });
  return `base64-${Buffer.from(session, "utf8").toString("base64url")}`;
}

describe("auth setup storageState", () => {
  it("reconoce una sesión de @supabase/ssr guardada en cookie", () => {
    const state: PlaywrightStorageState = {
      cookies: [{ name: "sb-proyecto-auth-token", value: sessionValue() }],
    };

    expect(tieneSesionSupabase(state)).toBe(true);
  });

  it("reconstruye cookies de sesión divididas en chunks", () => {
    const value = sessionValue();
    const middle = Math.floor(value.length / 2);
    const state: PlaywrightStorageState = {
      cookies: [
        { name: "sb-proyecto-auth-token.1", value: value.slice(middle) },
        { name: "sb-proyecto-auth-token.0", value: value.slice(0, middle) },
      ],
    };

    expect(tieneSesionSupabase(state)).toBe(true);
  });

  it("rechaza sesiones expiradas", () => {
    const state: PlaywrightStorageState = {
      cookies: [{ name: "sb-proyecto-auth-token", value: sessionValue(1) }],
    };

    expect(tieneSesionSupabase(state)).toBe(false);
  });

  it("mantiene compatibilidad con sesiones legacy en localStorage", () => {
    const value = JSON.stringify({
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
    const state: PlaywrightStorageState = {
      origins: [{ localStorage: [{ name: "sb-proyecto-auth-token", value }] }],
    };

    expect(tieneSesionSupabase(state)).toBe(true);
  });
});
