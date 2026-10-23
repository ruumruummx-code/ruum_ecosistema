import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const script = resolve(dirname(fileURLToPath(import.meta.url)), "../../../scripts/validate-env.mjs");

function validarEntorno(overrides: Record<string, string>) {
  return spawnSync(process.execPath, [script, "app-conductor"], {
    encoding: "utf8",
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      NEXT_PUBLIC_APP_URL: "https://conductor.ruum.mx",
      NEXT_PUBLIC_APP_VERSION: "1.0.0",
      NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: "pk.test-token",
      CI: "",
      VERCEL: "",
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
      KV_REST_API_URL: "",
      KV_REST_API_TOKEN: "",
      ...overrides,
    },
  });
}

describe("validate-env para rate-limit de app-conductor", () => {
  it("falla en producción si no hay Redis distribuido configurado", () => {
    const resultado = validarEntorno({});
    expect(resultado.status).toBe(1);
    expect(resultado.stderr).toContain("se requiere Redis para rate-limit distribuido");
  });

  it("acepta el par de credenciales de Upstash en producción", () => {
    const resultado = validarEntorno({
      UPSTASH_REDIS_REST_URL: "https://redis.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "upstash-token",
    });
    expect(resultado.status).toBe(0);
  });

  it("acepta Vercel KV como alternativa compatible en producción", () => {
    const resultado = validarEntorno({
      KV_REST_API_URL: "https://redis.vercel-storage.com",
      KV_REST_API_TOKEN: "kv-token",
    });
    expect(resultado.status).toBe(0);
  });

  it("rechaza una configuración parcial de Redis", () => {
    const resultado = validarEntorno({
      UPSTASH_REDIS_REST_URL: "https://redis.upstash.io",
    });
    expect(resultado.status).toBe(1);
    expect(resultado.stderr).toContain("se requiere Redis para rate-limit distribuido");
  });

  it("no exige Redis en entornos no productivos", () => {
    const resultado = spawnSync(process.execPath, [script, "app-conductor"], {
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "development",
        VERCEL: "",
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: "",
        KV_REST_API_URL: "",
        KV_REST_API_TOKEN: "",
      },
    });
    expect(resultado.status).toBe(0);
  });
});
