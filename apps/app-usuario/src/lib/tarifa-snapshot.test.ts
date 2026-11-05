import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  calcularTarifaServidor,
  generarHashInputsTarifa,
  generarSnapshotFirmado,
  verificarSnapshotFirmado,
  registrarDivergenciaTarifa,
  type InputsTarifaSnapshot,
} from "./tarifa-snapshot";

const mockRedisSet = vi.fn();
vi.mock("@/lib/csp-rate-limit", () => ({
  getRedis: () => ({
    set: mockRedisSet,
  }),
}));

const mockWarn = vi.fn();
vi.mock("@/lib/logger", () => ({
  logStructuredWarn: (...args: unknown[]) => mockWarn(...args),
}));

describe("tarifa-snapshot — RUUM-USR-F6-001 (CB-1)", () => {
  const inputsEjemplo: InputsTarifaSnapshot = {
    origenCodigoPostal: "03100",
    destinoCodigoPostal: "06600",
    origenCoords: { lat: 19.385, lng: -99.165 },
    destinoCoords: { lat: 19.428, lng: -99.167 },
    paradasCount: 0,
    categoria: "ligero_a",
    gama: "media",
    condicion: "seminueva",
    modalidad: "lo_antes_posible",
    distanciaKm: 12.5,
    tiempoEstimadoHoras: 0.6,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisSet.mockResolvedValue("OK");
  });

  it("calcula la tarifa del servidor reproduciendo la fórmula oficial v2", () => {
    const tarifa = calcularTarifaServidor({
      categoria: "ligero_a",
      gama: "media",
      condicion: "seminueva",
      distanciaKm: 12.5,
      tiempoEstimadoHoras: 0.6,
      modalidad: "lo_antes_posible",
    });
    expect(tarifa).toBeGreaterThan(0);
    expect(Number.isFinite(tarifa)).toBe(true);
  });

  it("aplica recargo de 1.25 a rescate_mecanico en el cálculo de servidor (CB-3 / T8)", () => {
    const tarifaSeminueva = calcularTarifaServidor({
      categoria: "ligero_b",
      gama: "media",
      condicion: "seminueva",
      distanciaKm: 50,
      tiempoEstimadoHoras: 1.5,
      modalidad: "lo_antes_posible",
    });

    const tarifaRescate = calcularTarifaServidor({
      categoria: "ligero_b",
      gama: "media",
      condicion: "rescate_mecanico",
      distanciaKm: 50,
      tiempoEstimadoHoras: 1.5,
      modalidad: "lo_antes_posible",
    });

    // rescate_mecanico factor 1.25 vs seminueva 1.0 -> exactamente 1.25x
    expect(tarifaRescate).toBe(Number((tarifaSeminueva * 1.25).toFixed(2)));
  });

  it("genera un snapshot firmado reproducible con hash, versión, monto, timestamp y nonce (CA-2)", () => {
    const monto = 850.5;
    const snapshot = generarSnapshotFirmado(inputsEjemplo, monto);

    expect(snapshot.version).toBe("2.0");
    expect(snapshot.hash).toBe(generarHashInputsTarifa(inputsEjemplo));
    expect(snapshot.monto).toBe(850.5);
    expect(snapshot.nonce).toBeDefined();
    expect(snapshot.firma).toMatch(/^[a-f0-9]{64}$/);
    expect(new Date(snapshot.expiraEn).getTime()).toBeGreaterThan(Date.now());
  });

  it("valida exitosamente un snapshot firmado auténtico y registra nonce en Redis (CA-3)", async () => {
    const snapshot = generarSnapshotFirmado(inputsEjemplo, 850.5);
    const resultado = await verificarSnapshotFirmado(snapshot);

    expect(resultado.valido).toBe(true);
    expect(resultado.snapshot).toBeDefined();
    expect(mockRedisSet).toHaveBeenCalledWith(
      `snapshot-nonce:${snapshot.nonce}`,
      "1",
      expect.objectContaining({ nx: true })
    );
  });

  it("rechaza snapshot alterado o con firma falsa (CA-3)", async () => {
    const snapshot = generarSnapshotFirmado(inputsEjemplo, 850.5);
    const alterado = { ...snapshot, monto: 100.0 }; // intento de pagar menos con misma firma

    const resultado = await verificarSnapshotFirmado(alterado);
    expect(resultado.valido).toBe(false);
    expect(resultado.error).toMatch(/firma criptográfica.*inválida/i);
  });

  it("rechaza snapshot expirado tras superar TTL de 15 min (CA-3)", async () => {
    const snapshot = generarSnapshotFirmado(inputsEjemplo, 850.5, -1000); // ya expirado
    const resultado = await verificarSnapshotFirmado(snapshot);

    expect(resultado.valido).toBe(false);
    expect(resultado.error).toMatch(/expirado/i);
  });

  it("rechaza intento de replay si el nonce ya fue consumido en Redis (CA-3)", async () => {
    mockRedisSet.mockResolvedValueOnce(null); // Redis SET NX devolvió null porque ya existe
    const snapshot = generarSnapshotFirmado(inputsEjemplo, 850.5);

    const resultado = await verificarSnapshotFirmado(snapshot);
    expect(resultado.valido).toBe(false);
    expect(resultado.error).toMatch(/replay/i);
  });

  it("detecta y registra advertencia de divergencia si el cliente envió distancia o monto manipulado (CA-1 / T4)", () => {
    const evalRes = registrarDivergenciaTarifa(
      { distanciaKm: 40.0, monto: 800.0 }, // cliente reportó 800 (divergencia moderada de ~15%)
      { distanciaKm: 45.0, tiempoHoras: 1.2, monto: 950.0 }, // servidor recalculó
      "usr_123"
    );

    expect(evalRes.esDivergente).toBe(true);
    expect(evalRes.accionOperativa).toBe("telemetria");
    expect(mockWarn).toHaveBeenCalledWith(
      "tarifa-snapshot",
      "divergencia_tarifa_detectada",
      undefined,
      expect.objectContaining({
        cliente: { distanciaKm: 40.0, monto: 800.0 },
        servidor: { distanciaKm: 45.0, monto: 950.0 },
      })
    );
  });

  describe("RUUM-USR-F6-001-C — Bloque D: Pruebas de casos de borde y negativos", () => {
    it("D2: timingSafeEqual maneja buffers de longitud distinta de forma segura sin lanzar RangeError (C3 / CA-C5)", async () => {
      const snapshot = generarSnapshotFirmado(inputsEjemplo, 850.5);

      // Casos de firmas con longitudes arbitrarias provistas por un atacante:
      const firmasInvalidas = [
        "00", // longitud 2
        "abcd", // longitud 4
        "0123456789abcdef", // longitud 16
        snapshot.firma.slice(0, 32), // longitud 32 (la mitad de 64 hex)
        snapshot.firma + "ab", // longitud 66 (mayor a 64 hex)
        "z".repeat(128), // caracteres no hex / 128
      ];

      for (const firmaInvalida of firmasInvalidas) {
        const alterado = { ...snapshot, firma: firmaInvalida };
        const res = await verificarSnapshotFirmado(alterado);
        expect(res.valido).toBe(false);
        expect(res.error).toMatch(/firma criptográfica.*inválida/i);
      }
    });

    it("D3: clasifica divergencia >10% y <=50% como 'telemetria' y >50% o monto<=0 como 'rechazo_bloqueo' (C2 / CA-C4)", () => {
      // 1. Nominal (<= 10%)
      const evalNominal = registrarDivergenciaTarifa(
        { distanciaKm: 44.0, monto: 940.0 },
        { distanciaKm: 45.0, tiempoHoras: 1.2, monto: 950.0 },
        "usr_1"
      );
      expect(evalNominal.esDivergente).toBe(false);
      expect(evalNominal.accionOperativa).toBe("nominal");

      // 2. Moderada (> 10% y <= 50%) -> Telemetría con recálculo soberano
      const evalModerada = registrarDivergenciaTarifa(
        { distanciaKm: 45.0, monto: 800.0 }, // ~15.7% de diferencia
        { distanciaKm: 45.0, tiempoHoras: 1.2, monto: 950.0 },
        "usr_2"
      );
      expect(evalModerada.esDivergente).toBe(true);
      expect(evalModerada.accionOperativa).toBe("telemetria");

      // 3. Crítica (> 50%) -> Rechazo y bloqueo
      const evalCritica = registrarDivergenciaTarifa(
        { distanciaKm: 1.0, monto: 100.0 }, // ~89% de diferencia
        { distanciaKm: 45.0, tiempoHoras: 1.2, monto: 950.0 },
        "usr_3"
      );
      expect(evalCritica.esDivergente).toBe(true);
      expect(evalCritica.accionOperativa).toBe("rechazo_bloqueo");
      expect(evalCritica.motivo).toBe("divergencia_critica_excede_50_porciento");

      // 4. Monto negativo o cero -> Rechazo y bloqueo
      const evalMontoInvalido = registrarDivergenciaTarifa(
        { distanciaKm: 45.0, monto: 0 },
        { distanciaKm: 45.0, tiempoHoras: 1.2, monto: 950.0 },
        "usr_4"
      );
      expect(evalMontoInvalido.esDivergente).toBe(true);
      expect(evalMontoInvalido.accionOperativa).toBe("rechazo_bloqueo");
      expect(evalMontoInvalido.motivo).toBe("monto_cliente_negativo_o_cero");
    });
  });
});
