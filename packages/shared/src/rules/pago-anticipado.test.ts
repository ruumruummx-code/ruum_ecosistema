import { describe, it, expect } from "vitest";
import { determinarMomentoPago } from "./pago-anticipado";
import type { Usuario } from "../types/usuario";

function usuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: "u1",
    tipo_cuenta: "personal",
    rol: "personal",
    estado_verificacion: "verificado",
    traslados_completados_sin_incidencia: 0,
    metodo_pago_registrado: false,
    creado_en: new Date().toISOString(),
    ...overrides
  };
}

describe("determinarMomentoPago — política estricta (solo electrónico anticipado)", () => {
  it("usuario nuevo sin historial -> anticipado", () => {
    expect(determinarMomentoPago(usuario()).momento).toBe("anticipado");
  });

  it("historial positivo con método registrado -> anticipado (sin excepción)", () => {
    const r = determinarMomentoPago(
      usuario({ traslados_completados_sin_incidencia: 2, metodo_pago_registrado: true })
    );
    expect(r.momento).toBe("anticipado");
  });

  it("titular de cuenta empresa -> anticipado (sin excepción)", () => {
    const r = determinarMomentoPago(usuario({ tipo_cuenta: "empresa", rol: "titular_empresa" }));
    expect(r.momento).toBe("anticipado");
  });

  it("usuario_autorizado de empresa -> anticipado", () => {
    const r = determinarMomentoPago(usuario({ tipo_cuenta: "empresa", rol: "usuario_autorizado" }));
    expect(r.momento).toBe("anticipado");
  });

  it("sin parámetros extra: la firma solo recibe el usuario", () => {
    const r = determinarMomentoPago(
      usuario({ traslados_completados_sin_incidencia: 5, metodo_pago_registrado: true })
    );
    expect(r.momento).toBe("anticipado");
  });

  it("la razón comunica cobro electrónico anticipado", () => {
    expect(determinarMomentoPago(usuario()).razon).toMatch(/anticipada/i);
  });
});
