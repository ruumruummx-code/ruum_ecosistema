import { describe, expect, it } from "vitest";
import { ajustarPrecioFinalAdmin, listarPagosAdmin } from "@ruum/api/services";
import { clienteFinanzas, rechazoBd } from "../../test-utils/supabase-finanzas";

describe("panel-admin / pagos", () => {
  it("lista los importes pagados y los payouts con el mismo rango", async () => {
    const tablas = ["pagos", "pasaporte_digital", "payouts_conductor", "datos_bancarios_conductor", "conductores"];
    const pago = { id: "pago-1", monto: 1400.75, estado: "completado" };
    const { cliente, solicitudes } = clienteFinanzas(({ metodo, recurso }) => {
      expect(metodo).toBe("GET");
      expect(tablas).toContain(recurso);
      return Response.json(recurso === "pagos" ? [pago] : []);
    });
    await expect(listarPagosAdmin(cliente, { limite: 20, offset: 40 })).resolves.toMatchObject({ pagosUsuarios: [pago] });
    const consultas = solicitudes.filter(({ recurso }) => tablas.includes(recurso));
    expect(consultas.map(({ filtros }) => [filtros.get("offset"), filtros.get("limit")])).toEqual(
      tablas.map(() => ["40", "20"]),
    );
    expect(solicitudes).toContainEqual(expect.objectContaining({ recurso: "rpc/admin_tiene_permiso", datos: { p_permiso: "pagos:leer" } }));
  });

  it("rechaza la lectura de datos financieros cuando falta el permiso", async () => {
    const { cliente, solicitudes } = clienteFinanzas(undefined, false);
    await expect(listarPagosAdmin(cliente)).rejects.toMatchObject({ code: "ADMIN_PERMISSION_DENIED", permiso: "pagos:leer" });
    expect(solicitudes.some(({ recurso }) => recurso === "pagos")).toBe(false);
  });

  it("ajusta el precio final con el importe y la aprobación dual", async () => {
    const { cliente, solicitudes } = clienteFinanzas(() => Response.json({ ejecutado: true }));
    await expect(ajustarPrecioFinalAdmin(cliente, "traslado-1", 1400.75, "aprobacion-1")).resolves.toBeUndefined();
    expect(solicitudes.at(-1)).toMatchObject({
      metodo: "POST", recurso: "rpc/admin_ajustar_precio_final",
      datos: { p_aprobacion_id: "aprobacion-1", p_traslado_id: "traslado-1", p_precio_final: 1400.75 },
    });
  });

  it("bloquea un ajuste sin aprobación dual antes de escribir", async () => {
    const { cliente, solicitudes } = clienteFinanzas();
    await expect(ajustarPrecioFinalAdmin(cliente, "traslado-1", 1400.75)).rejects.toThrow("aprobación dual");
    expect(solicitudes.some(({ recurso }) => recurso === "rpc/admin_ajustar_precio_final")).toBe(false);
  });

  it("propaga el rechazo de una aprobación desde la base de datos", async () => {
    const { cliente } = clienteFinanzas(() => rechazoBd("APROBACION_NO_APROBADA"));
    await expect(ajustarPrecioFinalAdmin(cliente, "traslado-1", 1400.75, "aprobacion-1"))
      .rejects.toMatchObject({ code: "42501", message: "APROBACION_NO_APROBADA" });
  });
});
