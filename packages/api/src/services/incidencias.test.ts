import { describe, expect, it, vi } from "vitest";
import { reportarIncidencia } from "./incidencias";

describe("H07 — Operación transaccional e idempotente para reporte de incidencias", () => {
  it("valida longitud mínima de 10 caracteres en la descripción", async () => {
    const mockCliente: any = {};
    await expect(
      reportarIncidencia(mockCliente, "traslado-1", "colision_robo_asalto", "durante_traslado", "corto")
    ).rejects.toThrow("Describe el problema con al menos 10 caracteres.");
  });

  it("utiliza la RPC transaccional atómica con operacionId y escalarUrgente", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: { id: "inc-100", reintentado: false, escalado: true },
      error: null
    });

    const mockCliente: any = {
      rpc: mockRpc
    };

    const res = await reportarIncidencia(
      mockCliente,
      "traslado-1",
      "colision_robo_asalto",
      "durante_traslado",
      "Colisión en carretera federal con daños visibles",
      { operacionId: "op-uuid-1", escalarUrgente: true }
    );

    expect(mockRpc).toHaveBeenCalledWith("conductor_reportar_incidencia_transaccional", {
      p_traslado_id: "traslado-1",
      p_tipo: "colision_robo_asalto",
      p_momento: "durante_traslado",
      p_descripcion: "Colisión en carretera federal con daños visibles",
      p_incidencia_id: "op-uuid-1",
      p_escalar_urgente: true
    });

    expect(res).toEqual({ id: "inc-100", reintentado: false });
  });

  it("reintento idempotente: la RPC detecta incidencia ya existente y no duplica", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: { id: "op-uuid-1", reintentado: true, escalado: true },
      error: null
    });

    const mockCliente: any = {
      rpc: mockRpc
    };

    const res = await reportarIncidencia(
      mockCliente,
      "traslado-1",
      "colision_robo_asalto",
      "durante_traslado",
      "Colisión en carretera federal con daños visibles",
      { operacionId: "op-uuid-1", escalarUrgente: true }
    );

    expect(res).toEqual({ id: "op-uuid-1", reintentado: true });
  });

  it("fallback cliente: no duplica si la incidencia ya existe con operacionId", async () => {
    const mockRpc = vi.fn().mockRejectedValue(new Error("RPC not found"));
    const mockInsert = vi.fn();
    const mockSelect = vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "op-uuid-existente" } })
      }))
    }));

    const mockCliente: any = {
      rpc: mockRpc,
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn((tabla: string) => {
        if (tabla === "usuarios") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) })
          };
        }
        if (tabla === "conductores") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "c-1" } }) }) })
          };
        }
        if (tabla === "traslados") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "t-1", conductor_id: "c-1" } }) })
              })
            })
          };
        }
        if (tabla === "incidencias") {
          return {
            select: mockSelect,
            insert: mockInsert
          };
        }
        return {
          select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) })
        };
      })
    };

    const res = await reportarIncidencia(
      mockCliente,
      "t-1",
      "colision_robo_asalto",
      "durante_traslado",
      "Problema urgente con descripción mayor a diez caracteres",
      { operacionId: "op-uuid-existente", escalarUrgente: true }
    );

    expect(res).toEqual({ id: "op-uuid-existente", reintentado: true });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("fallback cliente: si falla el registro de auditoría tras inserción exitosa, no falla la operación", async () => {
    const mockRpc = vi.fn().mockRejectedValue(new Error("RPC not found"));
    const mockInsert = vi.fn(() => ({
      select: () => ({
        single: vi.fn().mockResolvedValue({ data: { id: "nueva-incidencia" }, error: null })
      })
    }));

    const mockCliente: any = {
      rpc: mockRpc,
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn((tabla: string) => {
        if (tabla === "usuarios") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) })
          };
        }
        if (tabla === "conductores") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "c-1" } }) }) })
          };
        }
        if (tabla === "traslados") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "t-1", conductor_id: "c-1" } }) })
              })
            })
          };
        }
        if (tabla === "incidencias") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) }),
            insert: mockInsert
          };
        }
        if (tabla === "registro_auditoria") {
          return {
            insert: vi.fn().mockRejectedValue(new Error("Auditoría timeout"))
          };
        }
        return {
          select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null }) }) })
        };
      })
    };

    const res = await reportarIncidencia(
      mockCliente,
      "t-1",
      "colision_robo_asalto",
      "durante_traslado",
      "Problema urgente con descripción mayor a diez caracteres",
      { operacionId: "nueva-op", escalarUrgente: true }
    );

    expect(res).toEqual({ id: "nueva-incidencia", reintentado: false });
  });
});
