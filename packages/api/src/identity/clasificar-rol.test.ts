import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import { clasificarRolApp } from "./usuarios";

function mockCliente(tablas: Record<string, { data: unknown; error?: unknown }>) {
  return {
    from: vi.fn((tabla: string) => {
      const resultado = tablas[tabla] ?? { data: null, error: null };
      const cadena = {
        select: vi.fn(() => cadena),
        eq: vi.fn(() => cadena),
        limit: vi.fn(() => cadena),
        maybeSingle: vi.fn(async () => ({ data: resultado.data, error: resultado.error ?? null })),
      };
      return cadena;
    }),
  } as unknown as SupabaseClient<Database>;
}

describe("clasificarRolApp — aislamiento de roles y remediación P0-1", () => {
  it("clasifica como usuario cuando existe fila operativa en usuarios", async () => {
    const cliente = mockCliente({
      usuarios: { data: { id: "u-1", rol: "personal" } },
    });
    expect(await clasificarRolApp(cliente, "auth-u-1")).toBe("usuario");
  });

  it("clasifica como conductor a un aspirante con solicitud_conductor activa aunque no tenga fila en conductores", async () => {
    const cliente = mockCliente({
      usuarios: { data: null },
      conductores: { data: null },
      solicitudes_conductor: { data: { id: "sol-1" } },
    });
    expect(await clasificarRolApp(cliente, "auth-c-1")).toBe("conductor");
  });

  it("NO bloquea como usuario a un conductor contaminado con fila sin_rol en usuarios", async () => {
    const cliente = mockCliente({
      usuarios: { data: { id: "u-ghost", rol: "sin_rol" } },
      conductores: { data: null },
      solicitudes_conductor: { data: { id: "sol-2" } },
    });
    expect(await clasificarRolApp(cliente, "auth-c-2")).toBe("conductor");
  });

  it("clasifica como usuario a una cuenta sin_rol que no tiene expediente de conductor ni admin", async () => {
    const cliente = mockCliente({
      usuarios: { data: { id: "u-sin-rol", rol: "sin_rol" } },
      conductores: { data: null },
      solicitudes_conductor: { data: null },
      admins: { data: null },
    });
    expect(await clasificarRolApp(cliente, "auth-u-2")).toBe("usuario");
  });

  it("clasifica como admin cuando existe fila en admins", async () => {
    const cliente = mockCliente({
      usuarios: { data: null },
      conductores: { data: null },
      solicitudes_conductor: { data: null },
      admins: { data: { id: "a-1" } },
    });
    expect(await clasificarRolApp(cliente, "auth-a-1")).toBe("admin");
  });
});
