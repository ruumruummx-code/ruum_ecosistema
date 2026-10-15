import { describe, expect, it, vi } from "vitest";
import { clasificarRolApp } from "./usuarios";

function clienteConFilas(filas: Record<string, unknown[]>) {
  return {
    from: vi.fn((tabla: string) => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: filas[tabla]?.[0] ?? null, error: null })
        })
      })
    }))
  };
}

describe("clasificarRolApp (FIX C1 Fase 2, gate del middleware)", () => {
  it("usuario con perfil entra", async () => {
    await expect(
      clasificarRolApp(clienteConFilas({ usuarios: [{ id: "u1" }] }) as never, "auth-1")
    ).resolves.toBe("usuario");
  });

  it("conductor sin perfil de usuario se detecta", async () => {
    const cliente = clienteConFilas({ conductores: [{ id: "c1" }] });
    await expect(clasificarRolApp(cliente as never, "auth-2")).resolves.toBe("conductor");
    expect(cliente.from).toHaveBeenCalledWith("conductores");
  });

  it("alta en curso (sin filas) no bloquea el onboarding", async () => {
    await expect(clasificarRolApp(clienteConFilas({}) as never, "auth-3")).resolves.toBe("ninguno");
  });

  it("propaga errores de red en vez de clasificar en falso", async () => {
    const cliente = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error("db caída") })
          })
        })
      })
    };
    await expect(clasificarRolApp(cliente as never, "auth-4")).rejects.toThrow("db caída");
  });
});
