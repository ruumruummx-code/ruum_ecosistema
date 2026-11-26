import { describe, expect, it } from "vitest";
import {
  actualizarConfigTarifas,
  actualizarFactorCondicion,
  actualizarFactorDia,
  actualizarFactorGama,
  actualizarFactorHorario,
  actualizarPagoConductorPorCertificacion,
  actualizarPoliticaTarifariaNormativa,
  actualizarTarifaVehiculo,
  aplicarTarifaNormativaAdmin,
  clasificarVehiculoParaTarifa,
  guardarDistanciaYTiempoTraslado,
} from "@ruum/api/services";
import { adminId, clienteFinanzas, rechazoBd } from "../../test-utils/supabase-finanzas";

type Cliente = ReturnType<typeof clienteFinanzas>["cliente"];
type Actualizacion = {
  tabla: string;
  filtro: [columna: string, valor: string];
  cambios: Record<string, unknown>;
  ejecutar: (cliente: Cliente) => Promise<void>;
};

const actualizaciones: Actualizacion[] = [
  {
    tabla: "tarifas_vehiculo", filtro: ["id", "tarifa-1"], cambios: { base: 530.25, por_km: 10.5 },
    ejecutar: (cliente) => actualizarTarifaVehiculo(cliente, "tarifa-1", { base: 530.25, por_km: 10.5 }),
  },
  {
    tabla: "tarifas_gama", filtro: ["gama", "alta"], cambios: { factor: 1.25 },
    ejecutar: (cliente) => actualizarFactorGama(cliente, "alta", 1.25),
  },
  {
    tabla: "tarifas_condicion", filtro: ["condicion", "nueva"], cambios: { factor: 1.15 },
    ejecutar: (cliente) => actualizarFactorCondicion(cliente, "nueva", 1.15),
  },
  {
    tabla: "tarifas_horario", filtro: ["horario", "nocturno"], cambios: { factor: 1.2 },
    ejecutar: (cliente) => actualizarFactorHorario(cliente, "nocturno", 1.2),
  },
  {
    tabla: "tarifas_dia", filtro: ["dia", "fin_semana"], cambios: { factor: 1.3 },
    ejecutar: (cliente) => actualizarFactorDia(cliente, "fin_semana", 1.3),
  },
  {
    tabla: "tarifas_config", filtro: ["id", "true"], cambios: { tarifa_hora: 235.5, tope_factor_variable: 1.8 },
    ejecutar: (cliente) => actualizarConfigTarifas(cliente, { tarifa_hora: 235.5, tope_factor_variable: 1.8 }),
  },
  {
    tabla: "certificacion_pago_conductor", filtro: ["certificacion", "federal"], cambios: { porcentaje: 65.5 },
    ejecutar: (cliente) => actualizarPagoConductorPorCertificacion(cliente, "federal", 65.5),
  },
];

describe("panel-admin / tarifas", () => {
  it.each(actualizaciones)("actualiza $tabla con el importe, el filtro y el administrador correctos", async ({ tabla, filtro, cambios, ejecutar }) => {
    const [columna, valor] = filtro;
    const { cliente, solicitudes } = clienteFinanzas(() => Response.json([{ [columna]: valor }]));
    await expect(ejecutar(cliente)).resolves.toBeUndefined();
    expect(solicitudes.at(-1)).toMatchObject({
      metodo: "PATCH", recurso: tabla, datos: { ...cambios, actualizado_por_admin_id: adminId },
    });
    expect(solicitudes.at(-1)?.filtros.get(columna)).toBe(`eq.${valor}`);
  });

  it.each(actualizaciones)("propaga el rechazo de RLS si no se actualiza una fila de $tabla", async ({ tabla, ejecutar }) => {
    const { cliente, solicitudes } = clienteFinanzas(() => Response.json([]));
    await expect(ejecutar(cliente)).rejects.toThrow("No se guardó ningún cambio");
    expect(solicitudes.at(-1)).toMatchObject({ metodo: "PATCH", recurso: tabla });
  });

  it("publica una política tarifaria completa con la aprobación correspondiente", async () => {
    const payload = { vehiculo: [{ id: "tarifa-1", base: 530.25, por_km: 10.5 }], config: { tarifa_hora: 235.5, tope_factor_variable: 1.8 } };
    const { cliente, solicitudes } = clienteFinanzas(() => Response.json({ actualizadas: 2 }));
    await expect(actualizarPoliticaTarifariaNormativa(cliente, "aprobacion-1", payload)).resolves.toBe(2);
    expect(solicitudes.at(-1)).toMatchObject({
      metodo: "POST", recurso: "rpc/admin_actualizar_politica_tarifaria_normativa",
      datos: { p_aprobacion_id: "aprobacion-1", p_payload: payload },
    });
  });

  it("rechaza una publicación cuando la aprobación corresponde a otro cambio", async () => {
    const { cliente } = clienteFinanzas(() => rechazoBd("APROBACION_PAYLOAD_NO_COINCIDE"));
    await expect(actualizarPoliticaTarifariaNormativa(cliente, "aprobacion-2", { config: { tarifa_hora: 240, tope_factor_variable: 1.8 } }))
      .rejects.toMatchObject({ code: "42501", message: "APROBACION_PAYLOAD_NO_COINCIDE" });
  });

  it("bloquea una publicación sin permiso tarifario", async () => {
    const { cliente, solicitudes } = clienteFinanzas(undefined, false);
    await expect(actualizarPoliticaTarifariaNormativa(cliente, "aprobacion-1", {}))
      .rejects.toMatchObject({ code: "ADMIN_PERMISSION_DENIED", permiso: "tarifas:editar" });
    expect(solicitudes.some(({ recurso }) => recurso === "rpc/admin_actualizar_politica_tarifaria_normativa")).toBe(false);
  });

  it("confirma el precio aplicado a un traslado usando la fórmula del servidor", async () => {
    const { cliente, solicitudes } = clienteFinanzas(() => Response.json(1250.75));
    await expect(aplicarTarifaNormativaAdmin(cliente, "traslado-1")).resolves.toBe(1250.75);
    expect(solicitudes.at(-1)).toMatchObject({
      metodo: "POST", recurso: "rpc/admin_aplica_tarifa_normativa", datos: { p_traslado_id: "traslado-1" },
    });
  });

  it("propaga el rechazo al aplicar la tarifa normativa a un traslado", async () => {
    const { cliente } = clienteFinanzas(() => rechazoBd("El traslado no admite cambios de precio"));
    await expect(aplicarTarifaNormativaAdmin(cliente, "traslado-1")).rejects.toMatchObject({ code: "42501" });
  });

  const clasificacion = { categoria_tarifa: "ligero_a", gama: "entrada", condicion: "seminueva" } as const;
  const ruta = { distancia_km: 16.5, tiempo_estimado_horas: 0.75 };
  const cambiosCotizacion: Actualizacion[] = [
    {
      tabla: "vehiculos", filtro: ["id", "vehiculo-1"], cambios: clasificacion,
      ejecutar: (cliente) => clasificarVehiculoParaTarifa(cliente, "vehiculo-1", clasificacion),
    },
    {
      tabla: "traslados", filtro: ["id", "traslado-1"], cambios: ruta,
      ejecutar: (cliente) => guardarDistanciaYTiempoTraslado(cliente, "traslado-1", ruta),
    },
  ];

  it.each(cambiosCotizacion)("guarda los datos para calcular la tarifa en $tabla", async ({ tabla, filtro, cambios, ejecutar }) => {
    const { cliente, solicitudes } = clienteFinanzas(() => new Response(null, { status: 204 }));
    await expect(ejecutar(cliente)).resolves.toBeUndefined();
    expect(solicitudes.at(-1)).toMatchObject({ metodo: "PATCH", recurso: tabla, datos: cambios });
    expect(solicitudes.at(-1)?.filtros.get(filtro[0])).toBe(`eq.${filtro[1]}`);
  });

  it.each(cambiosCotizacion)("bloquea el cambio de $tabla sin permiso tarifario", async ({ tabla, ejecutar }) => {
    const { cliente, solicitudes } = clienteFinanzas(undefined, false);
    await expect(ejecutar(cliente)).rejects.toMatchObject({ code: "ADMIN_PERMISSION_DENIED", permiso: "tarifas:editar" });
    expect(solicitudes.some(({ recurso }) => recurso === tabla)).toBe(false);
  });
});
