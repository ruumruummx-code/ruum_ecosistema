import { describe, expect, it } from "vitest";
import {
  CONFIG_ROL_ADMIN,
  ROL_ADMIN_DEFAULT,
  RUTA_A_CAPACIDAD,
  normalizarRolAdmin,
  obtenerCapacidadParaRuta,
  puedeVerRuta,
  rutaBaseAdmin,
  type RolAdminOperativo,
} from "./roles-admin";

const ROLES: RolAdminOperativo[] = ["operador", "supervisor", "finanzas", "compliance", "direccion"];

describe("roles-admin — normalización", () => {
  it("acepta los 5 roles operativos", () => {
    for (const rol of ROLES) expect(normalizarRolAdmin(rol)).toBe(rol);
  });

  it("cualquier otro valor cae a operador", () => {
    expect(normalizarRolAdmin("admin")).toBe("operador");
    expect(normalizarRolAdmin("")).toBe("operador");
    expect(normalizarRolAdmin(null)).toBe("operador");
    expect(normalizarRolAdmin(undefined)).toBe("operador");
    expect(normalizarRolAdmin(42)).toBe("operador");
    expect(ROL_ADMIN_DEFAULT).toBe("operador");
  });
});

describe("roles-admin — rutas", () => {
  it("rutaBaseAdmin recorta query strings", () => {
    expect(rutaBaseAdmin("/viajes?estado=activo")).toBe("/viajes");
    expect(rutaBaseAdmin("/conductores/abc-123")).toBe("/conductores/abc-123");
  });

  it("direccion ve todo y /sin-permiso siempre pasa", () => {
    expect(puedeVerRuta("direccion", "/cualquier-cosa")).toBe(true);
    expect(puedeVerRuta("operador", "/sin-permiso")).toBe(true);
  });

  it("operador no ve finanzas ni auditoría, pero sí sus subrutas", () => {
    expect(puedeVerRuta("operador", "/pagos")).toBe(false);
    expect(puedeVerRuta("operador", "/auditoria")).toBe(false);
    expect(puedeVerRuta("operador", "/viajes")).toBe(true);
    expect(puedeVerRuta("operador", "/conductores/abc")).toBe(true);
    expect(puedeVerRuta("operador", "/viajero")).toBe(false);
  });

  it("obtenerCapacidadParaRuta resuelve especificidad y nulos", () => {
    expect(obtenerCapacidadParaRuta("/")).toBeNull();
    expect(obtenerCapacidadParaRuta("/sin-permiso")).toBeNull();
    expect(obtenerCapacidadParaRuta("/auditoria")).toBe("auditoria:leer");
    expect(obtenerCapacidadParaRuta("/conductores/abc?tab=docs")).toBe("conductores:leer");
    expect(obtenerCapacidadParaRuta("/ruta-inexistente")).toBeNull();
  });

  it("configuración íntegra: etiquetas, widgets y rutas con /", () => {
    for (const rol of ROLES) {
      const cfg = CONFIG_ROL_ADMIN[rol];
      expect(cfg.etiqueta.trim().length).toBeGreaterThan(0);
      expect(cfg.widgets.length).toBeGreaterThan(0);
      expect(cfg.indicadores.length).toBeGreaterThan(0);
      for (const ruta of cfg.rutasPermitidas) {
        expect(ruta.startsWith("/"), `${rol}: ${ruta}`).toBe(true);
      }
    }
    for (const [ruta, capacidad] of Object.entries(RUTA_A_CAPACIDAD)) {
      expect(ruta.startsWith("/")).toBe(true);
      expect(capacidad.includes(":")).toBe(true);
    }
  });
});
