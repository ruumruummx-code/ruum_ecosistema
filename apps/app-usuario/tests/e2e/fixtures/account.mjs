/** Account UI fixtures are synthetic and only visible to ACCOUNT_TOKEN. */
import { VEHICLES } from "./vehicles.mjs";
export const ACCOUNT_TOKEN = "mock_access_token_account";
export const ACCOUNT_PROFILE = {
  nombre: "Carlos Mendoza",
  foto_url: null,
  creado_en: "2024-01-01T12:00:00Z",
  actualizado_en: "2026-10-27T12:00:00Z",
  telefono: "+52 55 1234 5678",
  pais: "México",
  calle: "Los Serranos",
  numero: "225",
  colonia: "La Magdalena",
  codigo_postal: "52104",
  ciudad: "San Mateo Atenco",
  estado: "Estado de México",
  razon_social: "Carlos Mendoza",
  rfc: "XAXX010101000",
  regimen_fiscal: "Persona Física",
  codigo_postal_fiscal: "52104",
  metodo_pago_registrado: false,
};
const trips = [
  {
    traslado_id: "70000000-0000-4000-8000-000000000001",
    vehiculo_id: VEHICLES[0].id,
    vehiculo_marca: "Chrysler",
    vehiculo_modelo: "Cirrus",
    vehiculo_anio: 2024,
    estado: "traslado_en_curso",
    creado_en: "2026-10-27T16:42:00Z",
    origen_direccion: "Los Serranos 225",
    origen_ciudad: "San Mateo Atenco",
    destino_direccion: "Blvd. Aeropuerto 45",
    destino_ciudad: "Lerma de Villada",
  },
  {
    traslado_id: "70000000-0000-4000-8000-000000000002",
    vehiculo_id: VEHICLES[1].id,
    vehiculo_marca: "Toyota",
    vehiculo_modelo: "RAV4",
    vehiculo_anio: 2023,
    estado: "servicio_cerrado",
    creado_en: "2026-10-26T16:42:00Z",
    origen_direccion: "Calle Juárez 20",
    origen_ciudad: "Toluca",
    destino_direccion: "Paseo Reforma 100",
    destino_ciudad: "CDMX",
  },
];
export function datosCuenta(ruta) {
  if (ruta === "/rest/v1/vehiculos") return VEHICLES;
  if (ruta === "/rest/v1/pasaporte_digital")
    return trips.map((t) => ({
      ...t,
      usuario_id: "00000000-0000-4000-8000-0000000000f1",
    }));
  return null;
}
