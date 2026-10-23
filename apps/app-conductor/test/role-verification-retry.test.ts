import { describe, expect, it, vi } from "vitest";
import { verificarRolConReintentos } from "../src/lib/role-verification-retry";

describe("verificación de rol con reintentos", () => {
  it("recupera una falla transitoria antes de permitir la ruta", async () => {
    const verificar = vi.fn()
      .mockRejectedValueOnce(new Error("red intermitente"))
      .mockResolvedValue("conductor");
    const dormir = vi.fn().mockResolvedValue(undefined);

    await expect(verificarRolConReintentos(verificar, dormir)).resolves.toBe("conductor");
    expect(verificar).toHaveBeenCalledTimes(2);
    expect(dormir).toHaveBeenCalledWith(50);
  });

  it("agota dos reintentos y propaga el error para que el middleware deniegue", async () => {
    const error = new Error("base de datos no disponible");
    const verificar = vi.fn().mockRejectedValue(error);
    const dormir = vi.fn().mockResolvedValue(undefined);

    await expect(verificarRolConReintentos(verificar, dormir)).rejects.toBe(error);
    expect(verificar).toHaveBeenCalledTimes(3);
    expect(dormir.mock.calls.map(([ms]) => ms)).toEqual([50, 100]);
  });
});
