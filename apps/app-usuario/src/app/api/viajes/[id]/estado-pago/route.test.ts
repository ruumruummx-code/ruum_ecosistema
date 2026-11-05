import { beforeEach, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  user: vi.fn(),
  perfil: vi.fn(),
  trasladoSelect: vi.fn(),
  pagosSelect: vi.fn(),
  reconciliarF6: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/csp-rate-limit", () => ({
  rateLimitConVentana: (...args: unknown[]) => m.rateLimit(...args),
}));

vi.mock("@/lib/supabase-server", () => ({
  crearClienteServidor: async () => ({
    auth: { getUser: m.user },
    from: (tabla: string) => {
      if (tabla === "traslados") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: m.trasladoSelect,
            }),
          }),
        };
      }
      if (tabla === "pagos") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: m.pagosSelect,
              }),
            }),
          }),
        };
      }
      return {};
    },
  }),
}));

vi.mock("@ruum/api/identity", () => ({ obtenerUsuarioIdPorAuth: m.perfil }));
vi.mock("@ruum/api/services", () => ({
  reconciliarSagaTrasladosIndividualesServidor: m.reconciliarF6,
}));

import { GET } from "./route";

const idValido = "12345678-1234-4234-8234-123456789abc";
const llamar = (id = idValido) =>
  GET(new Request("http://localhost"), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.resetAllMocks();
  m.rateLimit.mockResolvedValue({ allowed: true, restantes: 29 });
  m.user.mockResolvedValue({ data: { user: { id: "auth-123" } } });
  m.perfil.mockResolvedValue("usuario-titular");
  m.trasladoSelect.mockResolvedValue({
    data: {
      id: idValido,
      usuario_id: "usuario-titular",
      estado: "cotizacion_aceptada",
      monto_pagado: 0,
      tipo_pago: "anticipado",
    },
    error: null,
  });
  m.pagosSelect.mockResolvedValue({ data: [], error: null });
  m.reconciliarF6.mockResolvedValue({ confirmados: 0, compensados: 0, errores: 0 });
});

it("rechaza formato de UUID inválido con 404 (anti-IDOR)", async () => {
  const res = await llamar("no-es-uuid");
  expect(res.status).toBe(404);
});

it("exige sesión autenticada con 401", async () => {
  m.user.mockResolvedValue({ data: { user: null } });
  const res = await llamar();
  expect(res.status).toBe(401);
});

it("rechaza peticiones sobre traslados ajenos con 404 (anti-IDOR / ownership estricto)", async () => {
  m.perfil.mockResolvedValue("otro-usuario");
  const res = await llamar();
  expect(res.status).toBe(404);
  const data = await res.json();
  expect(data.error).toBe("Traslado no encontrado.");
});

it("devuelve pagado: true cuando la tabla pagos tiene registro completado", async () => {
  m.pagosSelect.mockResolvedValue({
    data: [{ id: "pago-1", monto: 1200, estado: "completado" }],
    error: null,
  });

  const res = await llamar();
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.pagado).toBe(true);
  expect(data.fuente).toBe("base_datos");
  expect(data.monto).toBe(1200);
});

it("devuelve pagado: true si el traslado ya transicionó a servicio_confirmado", async () => {
  m.trasladoSelect.mockResolvedValue({
    data: {
      id: idValido,
      usuario_id: "usuario-titular",
      estado: "servicio_confirmado",
    },
    error: null,
  });

  const res = await llamar();
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.pagado).toBe(true);
  expect(data.fuente).toBe("traslado_confirmado");
});

it("CA-3: ejecuta reconciliador durable F6 cuando el webhook aún no impacta", async () => {
  m.reconciliarF6.mockResolvedValue({ confirmados: 1, compensados: 0, errores: 0 });
  m.trasladoSelect
    .mockResolvedValueOnce({
      data: {
        id: idValido,
        usuario_id: "usuario-titular",
        estado: "cotizacion_aceptada",
      },
      error: null,
    })
    .mockResolvedValueOnce({
      data: {
        id: idValido,
        usuario_id: "usuario-titular",
        estado: "servicio_confirmado",
      },
      error: null,
    });

  const res = await llamar();
  expect(res.status).toBe(200);
  expect(m.reconciliarF6).toHaveBeenCalled();
  const data = await res.json();
  expect(data.pagado).toBe(true);
  expect(data.fuente).toBe("reconciliador_durable");
});

it("devuelve enProceso: true cuando el webhook aún no ha llegado", async () => {
  const res = await llamar();
  expect(res.status).toBe(200);
  const data = await res.json();
  expect(data.pagado).toBe(false);
  expect(data.enProceso).toBe(true);
});

it("responde 429 cuando excede el rate limit de consultas por minuto", async () => {
  m.rateLimit.mockResolvedValueOnce({ allowed: false, retryAfterSec: 45, restantes: 0 });
  const res = await llamar();
  expect(res.status).toBe(429);
  const data = await res.json();
  expect(data.error).toContain("Demasiadas consultas");
  expect(res.headers.get("Retry-After")).toBe("45");
});
