import { ACCOUNT_PROFILE, datosCuenta } from "./account.mjs";
export const LOCATIONS_TOKEN = "mock_access_token_locations";
export const LOCATIONS_PROFILE = {
  ...ACCOUNT_PROFILE,
  referencias: "Casa principal",
  preferencias: {
    tema: "claro",
    ubicaciones_v1: {
      version: 1,
      entradas: Array.from({ length: 12 }, (_, i) => ({
        id: `guardada:80000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
        version: 1,
        alias:
          [
            "Oficina corporativa",
            "Avenida 3a. Norte Poniente",
            "Calle de los Serrano",
            "Bodega Toluca",
          ][i] ?? `Sucursal ${i + 1}`,
        direccion:
          [
            "Av. Paseo de la Reforma 296",
            "Av. 3a. Norte Poniente 357c",
            "Calle de los Serrano 239",
            "Vía Alfredo del Mazo 5000",
          ][i] ?? `Avenida Central ${i + 1}`,
        ciudad:
          ["Cuauhtémoc", "Tuxtla Gutiérrez", "San Mateo Atenco", "Toluca"][i] ??
          "Toluca",
        estado: i === 0 ? "CDMX" : i === 1 ? "Chiapas" : "Estado de México",
        codigoPostal: i === 0 ? "06600" : "52104",
        referencia: i === 0 ? "Recepción" : "Acceso principal",
        tipo: i === 0 ? "trabajo" : "otro",
        lat: i === 0 ? 19.427 : 19.2845,
        lng: i === 0 ? -99.167 : -99.5228,
        creadoEn: `2026-10-${String(26 - i).padStart(2, "0")}T12:00:00Z`,
        actualizadoEn: "2026-10-27T12:00:00Z",
      })),
      favoritos: {
        "los serranos 225, la magdalena, 52104 san mateo atenco": true,
        "guardada:80000000-0000-4000-8000-000000000003": true,
      },
      ocultas: [],
    },
  },
};
export function datosUbicaciones(ruta) {
  const data = datosCuenta(ruta);
  if (ruta === "/rest/v1/pasaporte_digital")
    return data.map((t, i) =>
      i === 0
        ? {
            ...t,
            origen_direccion: "Los Serranos 225, La Magdalena, 52104",
            origen_lat: 19.2845,
            origen_lng: -99.5228,
          }
        : t,
    );
  return data;
}
