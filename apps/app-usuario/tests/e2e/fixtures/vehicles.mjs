/** Synthetic vehicle fixtures, isolated by token from the other E2E scenarios. */
export const VEHICLES_TOKEN = "mock_access_token_vehicles";
export const VEHICLE_ID = "50000000-0000-4000-8000-000000000001";
const usuario = "00000000-0000-4000-8000-0000000000f1";
const modelos = [
  ["Chrysler", "Cirrus", 2024, "PEM789", "Mi Cirrus", "sedan", "Blanco"],
  ["Toyota", "RAV4", 2023, "PZM456", "RAV4", "suv", "Negro"],
  ["RAM", "1500", 2024, "RTM321", "RAM Trabajo", "pick_up", "Blanco"],
  ["Nissan", "Sentra", 2022, "NST456", "Sentra", "sedan", "Azul"],
  ["Honda", "CR-V", 2023, "HND123", "CR-V", "suv", "Gris"],
];
export const VEHICLES = modelos.map(
  ([marca, modelo, anio, placas, alias, tipo, color], i) => ({
    id: `50000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    usuario_id: usuario,
    marca,
    modelo,
    anio,
    placas,
    alias,
    tipo,
    color,
    transmision: "automatica",
    vin: "1C3CCBBB4RN123456",
    puede_circular_rodando: i !== 2,
    tiene_placas: true,
    tiene_tarjeta_circulacion: true,
    tiene_verificacion: true,
    permiso_especial_vigente: null,
    fotos_urls: [],
    creado_en: `2026-10-${27 - i}T12:00:00Z`,
    actualizado_en: "2026-10-27T12:00:00Z",
    version: 0,
  }),
);
export function datosVehiculos(ruta) {
  if (ruta === "/rest/v1/vehiculos") return VEHICLES;
  if (ruta === "/rest/v1/pasaporte_digital")
    return [
      {
        traslado_id: "60000000-0000-4000-8000-000000000001",
        usuario_id: usuario,
        vehiculo_id: VEHICLES[1].id,
        estado: "servicio_cerrado",
        origen_ciudad: "Toluca",
        destino_ciudad: "Lerma",
        creado_en: "2026-10-26T12:00:00Z",
        vehiculo_marca: "Toyota",
        vehiculo_modelo: "RAV4",
        vehiculo_placas: "PZM456",
      },
    ];
  return null;
}
