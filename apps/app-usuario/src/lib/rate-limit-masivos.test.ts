import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRateLimit = vi.fn();
vi.mock("./csp-rate-limit", () => ({
  obtenerIp: (req: { headers: Headers }) => req.headers.get("x-forwarded-for") ?? "127.0.0.1",
  rateLimitConVentana: (...args: unknown[]) => mockRateLimit(...args),
}));

import { rateLimitMasivo } from "./rate-limit-masivos";

describe("rateLimitMasivo (Extensión autorizada de F3)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("evalúa tres dimensiones (usuario, IP, dispositivo) consumiendo rateLimitConVentana de F2", async () => {
    mockRateLimit.mockResolvedValue({ allowed: true });

    const req = {
      headers: new Headers({
        "x-forwarded-for": "189.200.45.10",
        "x-device-id": "device-uuid-masivo-123",
      }),
    };

    const res = await rateLimitMasivo(req, "usr_masivo_001", "cotizar-masivo", 10, 60_000);
    expect(res.allowed).toBe(true);

    // Verificamos que se invocó para usuario, IP y dispositivo con el hash correspondiente
    expect(mockRateLimit).toHaveBeenCalledTimes(3);
    expect(mockRateLimit).toHaveBeenCalledWith("uid:usr_masivo_001", "cotizar-masivo-usuario", 10, 60_000);
    expect(mockRateLimit).toHaveBeenCalledWith("189.200.45.10", "cotizar-masivo-ip", 20, 60_000);
    expect(mockRateLimit).toHaveBeenCalledWith(expect.any(String), "cotizar-masivo-dispositivo", 10, 60_000);
  });

  it("falla cerrado devolviendo 429 con Retry-After si alguna dimensión está bloqueada", async () => {
    mockRateLimit
      .mockResolvedValueOnce({ allowed: true })
      .mockResolvedValueOnce({ allowed: false, retryAfterSec: 45 }) // IP bloqueada
      .mockResolvedValueOnce({ allowed: true });

    const req = {
      headers: new Headers({
        "x-forwarded-for": "189.200.45.10",
      }),
    };

    const res = await rateLimitMasivo(req, "usr_masivo_001", "cotizar-masivo", 10, 60_000);
    expect(res.allowed).toBe(false);
    expect(res.retryAfterSec).toBe(45);
  });
});
