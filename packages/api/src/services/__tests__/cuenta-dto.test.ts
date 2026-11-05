import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  enmascararRfc,
  enmascararVin,
  enmascararTelefono,
  enmascararCreditoEmpresarial,
  enmascararDireccionResumen,
  obtenerRolEfectivoUsuario,
  obtenerCuentaUsuarioDTO,
  obtenerUrlDocumentoBajoDemanda,
  registrarAuditoriaAccesoPii,
} from "../cuenta-dto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";

describe("Flujo 11 — DTO por sección y Enmascaramiento de PII (CB-1 / CA-1, CA-2)", () => {
  it("enmascara RFC mostrando solo primeros 4 y últimos 2 caracteres", () => {
    expect(enmascararRfc("XAXX010101000")).toBe("XAXX•••••••00");
    expect(enmascararRfc("GODE561231GR8")).toBe("GODE•••••••R8");
    expect(enmascararRfc(null)).toBe("No registrado");
    expect(enmascararRfc("")).toBe("No registrado");
    expect(enmascararRfc("corta")).toBe("••••••••••");
  });

  it("enmascara VIN mostrando primeros 3 (WMI) y últimos 4 caracteres", () => {
    expect(enmascararVin("3VW2K7AJ0HM123456")).toBe("3VW••••••••••3456");
    expect(enmascararVin("1HGCR2F83HA001234")).toBe("1HG••••••••••1234");
    expect(enmascararVin(null)).toBe("No registrado");
  });

  it("enmascara teléfono mostrando código de país y últimos 4 dígitos", () => {
    expect(enmascararTelefono("+525512345678")).toBe("+52 •••••• 5678");
    expect(enmascararTelefono("5512345678")).toBe("+52 •••••• 5678");
    expect(enmascararTelefono(null)).toBe("Sin teléfono registrado");
  });

  it("enmascara crédito empresarial sin exponer límites ni saldos", () => {
    expect(enmascararCreditoEmpresarial({ credito_activo: true, linea_credito: 500000 })).toBe(
      "Línea corporativa activa (Facturación mensual)"
    );
    expect(enmascararCreditoEmpresarial({ credito_activo: false, linea_credito: null })).toBe(
      "Crédito corporativo no asignado"
    );
    expect(enmascararCreditoEmpresarial(null)).toBe("Sin crédito corporativo");
  });

  it("resume dirección sin exponer calle ni número interior en general", () => {
    expect(
      enmascararDireccionResumen({
        colonia: "Juárez",
        ciudad: "Cuauhtémoc",
        estado: "CDMX",
        codigo_postal: "06600",
      })
    ).toBe("Juárez, Cuauhtémoc, CP 06600");
    expect(enmascararDireccionResumen(null)).toBe("Dirección no registrada");
  });
});

describe("Flujo 11 — Rol Efectivo y Solicitud de Conductor Pendiente (CB-2 / CA-5, CA-6)", () => {
  it("determina rol base de usuario cuando no hay actividad de conductor", async () => {
    const cliente = {
      from: vi.fn((tabla: string) => {
        if (tabla === "usuarios") {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "u-1", rol: "personal" }, error: null }) }),
            }),
          };
        }
        if (tabla === "conductores") {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }),
          };
        }
        if (tabla === "solicitudes_conductor") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    const res = await obtenerRolEfectivoUsuario(cliente as unknown as SupabaseClient<Database>, "auth-1");
    expect(res.rolEfectivo).toBe("personal");
    expect(res.esConductorAprobado).toBe(false);
    expect(res.estadoConductor).toBe("sin_solicitud");
    expect(res.solicitudConductor).toBeNull();
  });

  it("detecta 'solicitud_conductor_pendiente' como estado visible explícito (CA-6)", async () => {
    const cliente = {
      from: vi.fn((tabla: string) => {
        if (tabla === "usuarios") {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "u-1", rol: "sin_rol" }, error: null }) }),
            }),
          };
        }
        if (tabla === "conductores") {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }),
          };
        }
        if (tabla === "solicitudes_conductor") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: "sol-99",
                        estado: "en_revision",
                        paso_actual: 4,
                        enviado_en: "2026-11-04T12:00:00Z",
                        actualizado_en: "2026-11-04T12:30:00Z",
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    const res = await obtenerRolEfectivoUsuario(cliente as unknown as SupabaseClient<Database>, "auth-sol");
    expect(res.rolEfectivo).toBe("sin_rol");
    expect(res.esConductorAprobado).toBe(false);
    expect(res.estadoConductor).toBe("solicitud_pendiente");
    expect(res.solicitudConductor?.id).toBe("sol-99");
    expect(res.solicitudConductor?.esPendiente).toBe(true);
  });

  it("impide rol conductor si no está aprobado en F13 aunque usuarios.rol indique conductor (CB-2)", async () => {
    const cliente = {
      from: vi.fn((tabla: string) => {
        if (tabla === "usuarios") {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "u-1", rol: "conductor" }, error: null }) }),
            }),
          };
        }
        if (tabla === "conductores") {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }),
            }),
          };
        }
        if (tabla === "solicitudes_conductor") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    const res = await obtenerRolEfectivoUsuario(cliente as unknown as SupabaseClient<Database>, "auth-fake-driver");
    expect(res.rolEfectivo).not.toBe("conductor");
    expect(res.rolEfectivo).toBe("sin_rol");
    expect(res.esConductorAprobado).toBe(false);
  });

  it("reconoce conductor aprobado vía Flujo 13", async () => {
    const cliente = {
      from: vi.fn((tabla: string) => {
        if (tabla === "usuarios") {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "u-1", rol: "personal" }, error: null }) }),
            }),
          };
        }
        if (tabla === "conductores") {
          return {
            select: () => ({
              eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { id: "c-1", estado: "activo" }, error: null }) }),
            }),
          };
        }
        if (tabla === "solicitudes_conductor") {
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    const res = await obtenerRolEfectivoUsuario(cliente as unknown as SupabaseClient<Database>, "auth-driver");
    expect(res.rolEfectivo).toBe("conductor");
    expect(res.esConductorAprobado).toBe(true);
    expect(res.estadoConductor).toBe("conductor_activo");
  });
});

describe("Flujo 11 — Carga Resiliente con Promise.allSettled y URLs bajo demanda (CB-3 / CA-3, CA-8, CA-9)", () => {
  it("obtiene URL firmada bajo demanda con registro de auditoría PII (CA-3, CA-4)", async () => {
    const createSignedUrlMock = vi.fn().mockResolvedValue({
      data: { signedUrl: "https://storage.ruum.mx/doc-firmado.pdf?token=exp15m" },
      error: null,
    });
    const cliente = {
      rpc: vi.fn().mockResolvedValue({ error: null }),
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: createSignedUrlMock,
        }),
      },
    };

    const url = await obtenerUrlDocumentoBajoDemanda(cliente as unknown as SupabaseClient<Database>, {
      usuarioId: "u-1",
      storagePath: "docs/ine_anverso.jpg",
      tipoDocumento: "ine_anverso",
    });

    expect(url).toContain("token=exp15m");
    expect(createSignedUrlMock).toHaveBeenCalledWith("docs/ine_anverso.jpg", 900);
  });

  it("carga DTO de cuenta resistiendo la caída de un servicio auxiliar (CA-8)", async () => {
    const cliente = {
      from: vi.fn((tabla: string) => {
        if (tabla === "usuarios") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: "u-1",
                    nombre: "Carlos Slim",
                    telefono: "+525555555555",
                    foto_url: null,
                    estado_verificacion: "verificado",
                    empresa_id: "emp-1",
                    creado_en: "2026-01-01T00:00:00Z",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (tabla === "conductores" || tabla === "solicitudes_conductor") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                order: () => ({ limit: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) }),
              }),
            }),
          };
        }
        if (tabla === "vehiculos") {
          // Vehículos responde OK
          return {
            select: () => ({
              eq: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "v-1",
                    marca: "BMW",
                    modelo: "M3",
                    anio: 2024,
                    color: "Azul",
                    placas: "XYZ-123",
                    vin: "3VW2K7AJ0HM123456",
                    tipo: "sedan",
                    tipo_vehiculo: "sedan",
                    activo: true,
                  },
                ],
                error: null,
              }),
            }),
          };
        }
        if (tabla === "empresas") {
          // Empresa FALLA intencionalmente para probar resiliencia de Promise.allSettled
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: vi.fn().mockRejectedValue(new Error("Timeout en servicio empresas")),
              }),
            }),
          };
        }
        if (tabla === "traslados" || tabla === "pasaporte_digital") {
          // Traslados responde OK
          return {
            select: () => ({
              eq: () => ({
                order: () => ({
                  limit: vi.fn().mockResolvedValue({
                    data: [
                      {
                        traslado_id: "t-1",
                        id: "t-1",
                        estado: "servicio_cerrado",
                        creado_en: "2026-11-04T10:00:00Z",
                        vehiculo_marca: "BMW",
                        vehiculo_modelo: "M3",
                        incidencias_abiertas: 0,
                      },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      }),
    };

    const cuenta = await obtenerCuentaUsuarioDTO(cliente as unknown as SupabaseClient<Database>, "auth-carlos", "carlos@empresa.com");

    expect(cuenta).not.toBeNull();
    // La pantalla no colapsó
    expect(cuenta?.identidad.nombre).toBe("Carlos Slim");
    expect(cuenta?.identidad.primerNombre).toBe("Carlos");
    expect(cuenta?.identidad.telefonoEnmascarado).toBe("+52 •••••• 5555");
    // Vehículos se cargaron correctamente con VIN enmascarado
    expect(cuenta?.vehiculos).toHaveLength(1);
    expect(cuenta?.vehiculos[0].vinEnmascarado).toBe("3VW••••••••••3456");
    // Empresa falló pero no tiró el sistema; está en auxiliaresConFallo
    expect(cuenta?.empresa).toBeNull();
    expect(cuenta?.auxiliaresConFallo).toContain("empresa");
    expect(cuenta?.datosAuxiliaresCargados).toBe(false);
    // Traslados se procesaron en su resumen
    expect(cuenta?.trasladosResumen.totalTraslados).toBe(1);
  });
});
