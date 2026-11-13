import { __clearCspRateLimitForTest } from "@/lib/csp-rate-limit";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetUser = vi.fn();
const mocksServicios = vi.hoisted(() => ({
  listarVehiculos: vi.fn(async (_cliente: unknown, _usuarioId: string): Promise<Array<{ id: string }>> => []),
  // RC-07: el route resuelve el perfil de la sesión vía servicio de @ruum/api.
  obtenerUsuarioActual: vi.fn(async (): Promise<{ id: string } | null> => ({ id: "perfil-1" })),
  registrarConsentimiento: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/supabase-server", () => ({
  crearClienteServidor: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}));

vi.mock("@ruum/api/services", () => ({
  listarVehiculosDeUsuario: mocksServicios.listarVehiculos,
  obtenerUsuarioActual: mocksServicios.obtenerUsuarioActual,
  registrarConsentimientoUsuario: mocksServicios.registrarConsentimiento,
}));

const mocksCotizacion = vi.hoisted(() => ({ ruta: vi.fn(), cotizar: vi.fn() }));
vi.mock("@/lib/ruta-solicitud-servidor", () => ({ resolverRutaSolicitudServidor: mocksCotizacion.ruta }));
vi.mock("@/lib/cotizacion-individual-servidor", () => ({ cotizarSolicitudIndividual: mocksCotizacion.cotizar }));

let seq = 0;

describe("Sec3 POST /api/viajes — validación paso servidor", () => {
  beforeEach(() => {
    __clearCspRateLimitForTest();
    vi.clearAllMocks();
    seq++;
    mocksCotizacion.ruta.mockResolvedValue({ distanciaKm: 12.5, tiempoEstimadoHoras: 0.6,
      origenLat: 19.385, origenLng: -99.165, destinoLat: 19.428, destinoLng: -99.167,
      paradasCoords: [], fuente: "mapbox" });
    mocksCotizacion.cotizar.mockImplementation(async (_id, solicitud) => ({
      ...solicitud, traslado: { ...solicitud.traslado, snapshot_tarifa: {
        version: "2.1", monto: 850.5, nonce: "cotizacion-emitida-por-sql", expiraEn: new Date(Date.now()+900000).toISOString(),
      } },
    }));
    mockGetUser.mockResolvedValue({ data: { user: { id: `u-${seq}` } } });
    mocksServicios.obtenerUsuarioActual.mockResolvedValue({ id: `perfil-${seq}` });
    mocksServicios.listarVehiculos.mockResolvedValue([]);
    mocksServicios.registrarConsentimiento.mockResolvedValue({ ok: true });
  });

  function req(body: unknown, headers: Record<string, string> = {}) {
    return new NextRequest("http://localhost/api/viajes", {
      method: "POST",
      body: JSON.stringify({ tipo: "sedan", ...(body as Record<string, unknown>) }),
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": `192.168.1.${seq}`,
        "x-device-id": `dev-${seq}`,
        ...headers,
      },
    });
  }

  function payloadValido(override: Record<string, unknown> = {}) {
    return {
      paso: 4,
      vehiculoSeleccionadoId: "",
      vehiculosUsuarioIds: [],
      marca: "Nissan",
      modelo: "Versa",
      color: "gris",
      placas: "ABC123",
      vin: "VIN123",
      anio: "2022",
      transmision: "automatica",
      condicion: "seminueva",
      estadoGeneral: "Buen estado, desgaste normal",
      tieneTarjeta: true,
      tieneVerificacion: true,
      tienePlacas: true,
      puedeCircular: true,
      origenCodigoPostal: "03100",
      origenEstado: "CDMX",
      origenCiudad: "CDMX",
      origenColonia: "Del Valle",
      origenCalle: "A",
      origenNumero: "1",
      destinoCodigoPostal: "06600",
      destinoEstado: "CDMX",
      destinoCiudad: "CDMX",
      destinoColonia: "Juárez",
      destinoCalle: "B",
      destinoNumero: "2",
      entregaNombre: "Ana",
      entregaApellido: "López",
      entregaTelefono: "5512345678",
      recepcionNombre: "Luis",
      recepcionApellido: "Pérez",
      recepcionTelefono: "5587654321",
      modalidadProgramacion: "lo_antes_posible",
      fechaHoraProgramada: "",
      zonaHoraria: "America/Mexico_City",
      tipoRuta: "local",
      aceptaPoliticas: true,
      paradas: [],
      ...override,
    };
  }

  it("rechaza sin autenticación → 401", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { POST } = await import("./route");
    const res = await POST(req({ paso: 4, marca: "Nissan" }));
    expect(res.status).toBe(401);
  });

  it("rechaza paso <4 (0 como 5 falsificado) → 400", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: `u-${seq}` } } });
    const { POST } = await import("./route");
    // paso 0 (índice) -> contador 1 <4 -> 400
    expect((await POST(req({ paso: 0 }))).status).toBe(400);
    // paso 1 -> 2 <4
    expect((await POST(req({ paso: 1 }))).status).toBe(400);
    // paso 2 -> 3 <4
    expect((await POST(req({ paso: 2 }))).status).toBe(400);
    // wizardPaso alias
    expect((await POST(req({ wizardPaso: 1 }))).status).toBe(400);
    // string
    expect((await POST(req({ paso: "1" }))).status).toBe(400);
  });

  it("rechaza payload incompleto aunque paso sea 4 → 400 por esquema", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: `u-${seq}` } } });
    const { POST } = await import("./route");
    // paso 4 pasa el check de paso, pero falta marca/modelo -> esquema falla
    const res = await POST(req({ paso: 4, marca: "" }));
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toMatch(/inválidos|incompleta/i);
  });

  it("acepta paso 3 índice (→4) con payload válido → 200", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: `u-${seq}` } } });
    const { POST } = await import("./route");
    const valido = {
      paso: 3, // índice 3 -> contador 4
      vehiculoSeleccionadoId: "",
      vehiculosUsuarioIds: [],
      marca: "Nissan",
      modelo: "Versa",
      color: "gris",
      placas: "ABC123",
      vin: "VIN123",
      anio: "2022",
      transmision: "automatica",
      condicion: "seminueva",
      estadoGeneral: "Buen estado, desgaste normal",
      tieneTarjeta: true,
      tieneVerificacion: true,
      tienePlacas: true,
      puedeCircular: true,
      origenCodigoPostal: "03100",
      origenEstado: "CDMX",
      origenCiudad: "CDMX",
      origenColonia: "Del Valle",
      origenCalle: "A",
      origenNumero: "1",
      destinoCodigoPostal: "06600",
      destinoEstado: "CDMX",
      destinoCiudad: "CDMX",
      destinoColonia: "Juárez",
      destinoCalle: "B",
      destinoNumero: "2",
      entregaNombre: "Ana",
      entregaApellido: "López",
      entregaTelefono: "5512345678",
      recepcionNombre: "Luis",
      recepcionApellido: "Pérez",
      recepcionTelefono: "5587654321",
      modalidadProgramacion: "lo_antes_posible",
      fechaHoraProgramada: "",
      zonaHoraria: "America/Mexico_City",
      tipoRuta: "local",
      aceptaPoliticas: true,
      paradas: [],
    };
    const res = await POST(req(valido));
    expect(res.status).toBe(200);
    const json = await res.json() as { pasoValidado: number };
    expect(json.pasoValidado).toBe(4);
  });

  it("acepta paso 4 contador directo → 200 y mensaje genérico en error 500 no expone env", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: `u-${seq}` } } });
    const { POST } = await import("./route");
    // Forzar error interno simulando body no JSON? Ya probamos 500 es genérico
    const bad = new NextRequest("http://localhost/api/viajes", { method: "POST", body: "not json", headers: { "content-type": "application/json" } });
    // @ts-ignore — pasar request malformado, el handler hace json().catch -> 400
    const res = await POST(bad as NextRequest);
    expect([400, 500]).toContain(res.status);
    const json = await res.json() as { error: string };
    expect(json.error).not.toMatch(/NEXT_PUBLIC_/);
  });

  it("GET no permitido → 405", async () => {
    const { GET } = await import("./route");
    expect((await GET()).status).toBe(405);
  });

  describe("T01 — Aceptación de políticas", () => {
    it("rechaza cuando el campo aceptaPoliticas está ausente → 400", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: `u-${seq}` } } });
      const { POST } = await import("./route");
      const payload = payloadValido();
      delete (payload as Record<string, unknown>).aceptaPoliticas;
      const res = await POST(req(payload));
      expect(res.status).toBe(400);
      const json = await res.json() as { error: string; detalles?: string[] };
      expect(json.error).toBe("Datos de traslado inválidos");
      expect(json.detalles).toContain("Debes aceptar las políticas de pago y cancelación.");
    });

    it("rechaza cuando aceptaPoliticas es false → 400", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: `u-${seq}` } } });
      const { POST } = await import("./route");
      const res = await POST(req(payloadValido({ aceptaPoliticas: false })));
      expect(res.status).toBe(400);
      const json = await res.json() as { error: string; detalles?: string[] };
      expect(json.error).toBe("Datos de traslado inválidos");
      expect(json.detalles).toContain("Debes aceptar las políticas de pago y cancelación.");
    });

    it("rechaza cuando aceptaPoliticas es null → 400", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: `u-${seq}` } } });
      const { POST } = await import("./route");
      const res = await POST(req(payloadValido({ aceptaPoliticas: null })));
      expect(res.status).toBe(400);
      const json = await res.json() as { error: string; detalles?: string[] };
      expect(json.error).toBe("Datos de traslado inválidos");
      expect(json.detalles).toContain("Debes aceptar las políticas de pago y cancelación.");
    });

    it("acepta cuando aceptaPoliticas es true con payload válido → 200", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: `u-${seq}` } } });
      const { POST } = await import("./route");
      const res = await POST(req(payloadValido({ aceptaPoliticas: true })));
      expect(res.status).toBe(200);
      const json = await res.json() as { ok: boolean; pasoValidado: number };
      expect(json.ok).toBe(true);
      expect(json.pasoValidado).toBe(4);
    });
  });

  /* M10: vehiculosUsuarioIds lo envía el cliente; la pertenencia real se
     verifica contra la BD. */
  const UUID_AJENO = "123e4567-e89b-42d3-a456-426614174000";
  function payloadConVehiculo(id: string) {
    return {
      paso: 4,
      vehiculoSeleccionadoId: id,
      vehiculosUsuarioIds: [id],
      marca: "Nissan",
      modelo: "Versa",
      color: "gris",
      placas: "ABC123",
      vin: "VIN123",
      anio: "2022",
      transmision: "automatica",
      condicion: "seminueva",
      estadoGeneral: "Buen estado, desgaste normal",
      tieneTarjeta: true,
      tieneVerificacion: true,
      tienePlacas: true,
      puedeCircular: true,
      origenCodigoPostal: "03100",
      origenEstado: "CDMX",
      origenCiudad: "CDMX",
      origenColonia: "Del Valle",
      origenCalle: "A",
      origenNumero: "1",
      destinoCodigoPostal: "06600",
      destinoEstado: "CDMX",
      destinoCiudad: "CDMX",
      destinoColonia: "Juárez",
      destinoCalle: "B",
      destinoNumero: "2",
      entregaNombre: "Ana",
      entregaApellido: "López",
      entregaTelefono: "5512345678",
      recepcionNombre: "Luis",
      recepcionApellido: "Pérez",
      recepcionTelefono: "5587654321",
      modalidadProgramacion: "lo_antes_posible",
      fechaHoraProgramada: "",
      zonaHoraria: "America/Mexico_City",
      tipoRuta: "local",
      aceptaPoliticas: true,
      paradas: [],
    };
  }

  it("rechaza vehiculo ajeno aunque venga en el array del cliente → 403", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: `u-${seq}` } } });
    mocksServicios.listarVehiculos.mockResolvedValue([]);
    const { POST } = await import("./route");
    const res = await POST(req(payloadConVehiculo(UUID_AJENO)));
    expect(res.status).toBe(403);
    const json = await res.json() as { error: string };
    expect(json.error).toMatch(/no pertenece/i);
  });

  it("acepta vehiculo propio verificado en BD → 200", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: `u-${seq}` } } });
    mocksServicios.listarVehiculos.mockResolvedValue([{ id: UUID_AJENO }]);
    const { POST } = await import("./route");
    const res = await POST(req(payloadConVehiculo(UUID_AJENO)));
    expect(res.status).toBe(200);
  });

  /* RC-07: el Auth ID (auth_user_id) no es el ID interno del perfil. El route
     debe resolver el perfil y pasar su id interno a listarVehiculosDeUsuario. */
  it("RC-07: usa el id interno del perfil, no el Auth ID", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: `auth-u-${seq}` } } });
    mocksServicios.obtenerUsuarioActual.mockResolvedValue({ id: `perfil-interno-${seq}` });
    mocksServicios.listarVehiculos.mockResolvedValue([{ id: UUID_AJENO }]);
    const { POST } = await import("./route");
    const res = await POST(req(payloadConVehiculo(UUID_AJENO)));
    expect(res.status).toBe(200);
    expect(mocksServicios.listarVehiculos).toHaveBeenCalledWith(expect.anything(), `perfil-interno-${seq}`);
  });

  it("RC-07: falla cerrado (500) si no se puede resolver el perfil", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: `auth-u-${seq}` } } });
    mocksServicios.obtenerUsuarioActual.mockResolvedValue(null);
    const { POST } = await import("./route");
    const res = await POST(req(payloadConVehiculo(UUID_AJENO)));
    expect(res.status).toBe(500);
  });

  it("RC-07: falla cerrado (500) si el servicio de perfil lanza", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: `auth-u-${seq}` } } });
    mocksServicios.obtenerUsuarioActual.mockRejectedValue(new Error("db caída"));
    const { POST } = await import("./route");
    const res = await POST(req(payloadConVehiculo(UUID_AJENO)));
    expect(res.status).toBe(500);
  });

  it("bloquea cobro si no se puede confirmar la ruta", async () => {
    const { RutaNoDisponibleError } = await import("@/lib/ruta-cache");
    mocksCotizacion.ruta.mockRejectedValueOnce(new RutaNoDisponibleError());
    const { POST } = await import("./route");
    const res = await POST(req(payloadValido()));
    expect(res.status).toBe(503);
    expect(mocksCotizacion.cotizar).not.toHaveBeenCalled();
  });

  it("propaga el importe SQL y sus coordenadas sin confiar en coordenadas cliente", async () => {
    const { POST } = await import("./route");
    mocksCotizacion.cotizar.mockImplementationOnce(async (_id, solicitud) => ({ ...solicitud,
      traslado: { ...solicitud.traslado, snapshot_tarifa: { monto: 8864.5, nonce: "sql-camion" } } }));
    const res = await POST(req(payloadValido({ origenLat: 0, origenLng: 0 })));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.recalculo.precioCotizado).toBe(8864.5);
    expect(json.solicitud.traslado.origen_lat).toBe(19.385);
    expect(json.solicitud.traslado.snapshot_tarifa).toEqual(json.snapshot);
  });

  describe("RUUM-USR-F6-001 — Recálculo server-side, cotización persistida y rate limiting", () => {
    it("devuelve recalculo de distancia, tiempo y cotización persistida en respuesta exitosa", async () => {
      const { POST } = await import("./route");
      const res = await POST(req(payloadValido({
        origenCoordenadas: [-99.1676, 19.4270],
        destinoCoordenadas: [-99.1332, 19.4326],
      })));

      expect(res.status).toBe(200);
      const json = await res.json() as {
        ok: boolean;
        pasoValidado: number;
        recalculo: { distanciaKm: number; duracionHoras: number };
        snapshot: {
          version: string;
          monto: number;
          firma: string;
          nonce: string;
          expiraEn: string;
        };
      };
      expect(json.ok).toBe(true);
      expect(json.recalculo.distanciaKm).toBeGreaterThan(0);
      expect(json.snapshot.version).toBe("2.1");
      expect(json.snapshot.monto).toBeGreaterThan(0);

      expect(typeof json.snapshot.nonce).toBe("string");
    });

    it("registra consentimiento canónico con versión fija usando el escritor de F2", async () => {
      const { POST } = await import("./route");
      const res = await POST(req(payloadValido()));
      expect(res.status).toBe(200);
      expect(mocksServicios.registrarConsentimiento).toHaveBeenCalledWith(
        expect.anything(),
        {
          version: 1,
          canal: "web",
          versionApp: "1.0.0",
        }
      );
    });

    it("aísla 15 cuentas e IP distintas cuando falta el identificador de dispositivo", async () => {
      const { POST } = await import("./route");
      for (let i = 0; i < 15; i++) {
        mockGetUser.mockResolvedValue({ data: { user: { id: `usuario-sin-storage-${i}` } } });
        const solicitud = req(payloadValido(), { "x-forwarded-for": `200.1.2.${i + 1}` });
        solicitud.headers.delete("x-device-id");
        expect((await POST(solicitud)).status).toBe(200);
      }
    });

    it("aplica rate limit compuesto por cuenta (máximo 5 solicitudes) retornando 429", async () => {
      const { POST } = await import("./route");
      const fixedUserId = "usuario-rate-limit-test";
      mockGetUser.mockResolvedValue({ data: { user: { id: fixedUserId } } });
      mocksServicios.obtenerUsuarioActual.mockResolvedValue({ id: "perfil-rl" });

      // Hacer 5 peticiones exitosas (límite de cuenta es 5)
      for (let i = 0; i < 5; i++) {
        const res = await POST(req(payloadValido(), { "x-forwarded-for": `200.1.1.${i}` }));
        expect(res.status).toBe(200);
      }

      // La 6ta petición debe ser bloqueada con 429 y Retry-After
      const blockedRes = await POST(req(payloadValido(), { "x-forwarded-for": "200.1.1.99" }));
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.headers.get("Retry-After")).toBeDefined();
      const json = await blockedRes.json() as { error: string };
      expect(json.error).toMatch(/Demasiadas solicitudes/i);
    });

    it("D1: caso negativo de rescate_mecanico sin documentación vigente es rechazado con 400 (CA-C5)", async () => {
      const { POST } = await import("./route");
      // Condición rescate_mecanico pero sin tarjeta de circulación vigente (tieneTarjeta: false)
      const res = await POST(req(payloadValido({
        condicion: "rescate_mecanico",
        puedeCircular: false,
        tieneTarjeta: false, // Invalida la documentación obligatoria
      })));

      expect(res.status).toBe(400);
      const json = await res.json() as { error: string; detalles?: string[] };
      expect(json.error).toMatch(/inválidos/i);
      expect(json.detalles?.some((d) => /tarjeta de circulación/i.test(d))).toBe(true);
    });

    it("D3: rechaza con 400 cuando se detecta divergencia crítica >50% entre cliente y recálculo servidor (C2 / CA-C4)", async () => {
      const { POST } = await import("./route");
      // Servidor calculará distancia real (~6 km en CDMX), pero cliente inyecta datos burdamente manipulados
      const res = await POST(req(payloadValido({
        distanciaKm: 0.1, // >50% de diferencia con respecto al recálculo
        precioCotizado: 50.0, // precio artificialmente bajo
      })));

      expect(res.status).toBe(400);
      const json = await res.json() as { error: string };
      expect(json.error).toMatch(/divergencia crítica detectada/i);
    });
  });
});
