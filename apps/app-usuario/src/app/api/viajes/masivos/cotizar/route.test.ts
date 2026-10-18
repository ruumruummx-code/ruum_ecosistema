import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { normalizarFilaPlantilla, validarFila } from "@/lib/carga-masiva";
const mocks = vi.hoisted(() => ({ cotizar: vi.fn(), guardar: vi.fn(), stripe: vi.fn(), ruta: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase-server", () => ({ crearClienteServidor: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "usuario" } } }) } }) }));
vi.mock("@/lib/csp-rate-limit", () => ({ rateLimitConVentana: async () => ({ allowed: true }) }));
vi.mock("@/lib/carga-masiva-server", () => ({
  clienteMasivoServicio: () => ({}), stripeMasivo: mocks.stripe,
  validarFilasServidor: async (filas: Record<string,string>[]) => filas.map(validarFila),
}));
vi.mock("@ruum/api/services", () => ({
  previsualizarTarifasMasivasUsuario: mocks.cotizar, verificarUsuarioMasivo: async () => true,
  guardarCheckoutMasivoServidor: mocks.guardar, vincularPagoMasivoServidor: async () => undefined,
}));
vi.mock("@ruum/shared/utils", () => ({ obtenerRutaDirectionsMapboxConParadas: mocks.ruta }));
vi.mock("@ruum/shared/catalogos", () => ({ tipoSugeridoParaVehiculo: () => "van" }));
import { POST } from "./route";

function peticion() {
  const datos = normalizarFilaPlantilla({ vehiculo_marca: "Nissan", vehiculo_modelo: "Urvan Panel Diesel", vehiculo_anio: "2024", vehiculo_placas: "ABC123", condicion: "seminueva", origen_codigo_postal: "06700", destino_codigo_postal: "04360", contacto_entrega_nombre: "Entrega", contacto_entrega_telefono: "5512345678", contacto_recepcion_nombre: "Recibe", contacto_recepcion_telefono: "5512345679", origen_calle: "Reforma", origen_numero: "1", origen_colonia: "Roma", destino_calle: "Universidad", destino_numero: "2", destino_colonia: "Copilco" });
  return new NextRequest("http://localhost/api/viajes/masivos/cotizar", { method: "POST", body: JSON.stringify({ clave: "92200000-0000-4000-8000-000000000099", filas: Array.from({ length: 100 }, () => datos) }) });
}
describe("cotización de 100 traslados", () => {
  beforeEach(() => {
    vi.stubEnv("MAPBOX_SECRET_TOKEN", "sk.token-prueba");
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => Response.json({ features: [{ geometry: { coordinates: [-99.1,19.4] } }] })));
    mocks.ruta.mockReset().mockResolvedValue({ distanciaKm: 50, tiempoHoras: 1 });
    mocks.cotizar.mockReset().mockImplementation(async (_cliente, entradas: Array<{ indice: number }>) => entradas.map(f => ({ indice: f.indice, disponible: true, tarifa: 1234.56, categoria_tarifa: "ligero_b", gama: "media" })));
    mocks.guardar.mockReset().mockImplementation(async (_cliente, carga) => carga);
    mocks.stripe.mockReset().mockResolvedValue({ id: "pi_prueba", client_secret: "cs_prueba" });
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  it("falla con 500 si falta MAPBOX_SECRET_TOKEN", async () => {
    vi.stubEnv("MAPBOX_SECRET_TOKEN", "");
    const respuesta = await POST(peticion());
    const data = await respuesta.json();
    expect(respuesta.status).toBe(500);
    expect(data.error).toContain("MAPBOX_SECRET_TOKEN");
  });
  it("consolida las 100 filas en una llamada y conserva la suma exacta", async () => {
    const respuesta = await POST(peticion());
    const data = await respuesta.json();
    expect(respuesta.status).toBe(200);
    expect(mocks.cotizar).toHaveBeenCalledTimes(1);
    expect(mocks.cotizar.mock.calls[0]![1]).toHaveLength(100);
    expect(data.cotizaciones).toHaveLength(100);
    expect(data.totalMXN).toBe(123456);
  });
  it("muestra el límite como fallo de la solicitud y conserva los modelos", async () => {
    mocks.cotizar.mockRejectedValue({ message: "RATE_LIMITED", code: "P0001" });
    const respuesta = await POST(peticion());
    const data = await respuesta.json();
    expect(respuesta.status).toBe(429);
    expect(data.error).toContain("cotizaciones masivas");
    expect(data.filas).toBeUndefined();
    expect(mocks.guardar).not.toHaveBeenCalled();
  });
  it("ubica los fallos de ruta fuera de la columna Modelo", async () => {
    mocks.ruta.mockResolvedValue(null);
    const respuesta = await POST(peticion());
    const data = await respuesta.json();
    expect(data.filas).toHaveLength(100);
    expect(data.filas[0].errorCotizacion).toContain("ruta");
    expect(data.filas[0].errores.modelo).toBeUndefined();
    expect(mocks.cotizar).not.toHaveBeenCalled();
    expect(mocks.stripe).not.toHaveBeenCalled();
  });
  it("un fallo en una fila no aborta el lote completo y reporta errorCotizacion", async () => {
    let llamadas = 0;
    mocks.ruta.mockImplementation(async () => {
      llamadas++;
      if (llamadas <= 3) return null; // Falla intentos de la primera fila
      return { distanciaKm: 50, tiempoHoras: 1 };
    });
    const respuesta = await POST(peticion());
    const data = await respuesta.json();
    expect(respuesta.status).toBe(200);
    expect(data.filas).toHaveLength(100);
    expect(data.filas[0].errorCotizacion).toBeDefined();
    expect(mocks.guardar).not.toHaveBeenCalled();
  });
});
