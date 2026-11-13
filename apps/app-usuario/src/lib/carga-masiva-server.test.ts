import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizarFilaPlantilla } from "./carga-masiva";

const mocks = vi.hoisted(() => ({
  servicio: { contexto: "servidor" },
  crearCliente: vi.fn(),
  clasificar: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.crearCliente }));
vi.mock("@ruum/api/services", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>().catch(() => ({}));
  return {
    ...actual,
    clasificarVehiculoMasivo: (...args: unknown[]) => mocks.clasificar(...args),
  };
});

import { validarFilasServidor } from "./carga-masiva-server";

function fila(modelo = "Urvan Panel Diesel") {
  return normalizarFilaPlantilla({
    vehiculo_marca: "Nissan", vehiculo_modelo: modelo, vehiculo_anio: "2024",
    vehiculo_placas: "ABC123", condicion: "seminueva",
    origen_codigo_postal: "06700", destino_codigo_postal: "04360",
    contacto_entrega_nombre: "Entrega", contacto_entrega_telefono: "5512345678",
    contacto_recepcion_nombre: "Recibe", contacto_recepcion_telefono: "5512345679",
    origen_calle: "Reforma", origen_numero: "100", origen_colonia: "Roma Norte",
    destino_calle: "Universidad", destino_numero: "300", destino_colonia: "Copilco",
  });
}

describe("validación del catálogo masivo con RLS administrativa", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://mock.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "clave-servidor-de-prueba");
    mocks.crearCliente.mockReset().mockReturnValue(mocks.servicio);
    mocks.clasificar.mockReset().mockImplementation(async (cliente, marca, modelo) => {
      if (cliente !== mocks.servicio) return null; // RLS oculta el catálogo al usuario.
      return marca === "Nissan" && modelo === "Urvan Panel Diesel"
        ? { categoria_tarifa: "ligero_b", gama: "media" } : null;
    });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("acepta Nissan / Urvan Panel Diesel usando el contexto del servidor", async () => {
    const [resultado] = await validarFilasServidor([fila()]);
    expect(resultado?.estado).toBe("correcto");
    expect(resultado?.errores).toEqual({});
    expect(mocks.clasificar).toHaveBeenCalledWith(mocks.servicio, "Nissan", "Urvan Panel Diesel");
  });

  it("sigue rechazando las combinaciones que no existen", async () => {
    const [resultado] = await validarFilasServidor([fila("Modelo inexistente")]);
    expect(resultado?.estado).toBe("error");
    expect(resultado?.errores.modelo).toBe("La combinación marca/modelo no está en catálogo");
  });

  it("reporta falta de configuración sin simular un modelo inexistente", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    await expect(validarFilasServidor([fila()])).rejects.toThrow("no está configurado");
    expect(mocks.clasificar).not.toHaveBeenCalled();
  });

  it("distingue entre CP no encontrado en catálogo vigente y catálogo no disponible en disco", async () => {
    // CP con prefijo inexistente en disco (prefijo 00 no tiene archivo 00.json)
    const filaCatalogoAusente = normalizarFilaPlantilla({
      ...fila(),
      origen_codigo_postal: "00123",
      destino_codigo_postal: "04360",
    });
    const [resAusente] = await validarFilasServidor([filaCatalogoAusente]);
    expect(resAusente?.errores.origenCodigoPostal).toBe("Catálogo de códigos postales no disponible temporalmente");

    // CP con prefijo existente (06) pero número inexistente en catálogo
    const filaCpFuera = normalizarFilaPlantilla({
      ...fila(),
      origen_codigo_postal: "06999",
      destino_codigo_postal: "04360",
    });
    const [resFuera] = await validarFilasServidor([filaCpFuera]);
    expect(resFuera?.errores.origenCodigoPostal).toBe("Código postal fuera del catálogo vigente");
  });
});
