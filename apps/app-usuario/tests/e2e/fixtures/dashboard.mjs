/** Datos sintéticos, exclusivos del token de pruebas del dashboard. */
export const DASHBOARD_TOKEN = 'mock_access_token_dashboard';
export const DASHBOARD_TRIP_ID = '10000000-0000-4000-8000-000000000001';
export const DASHBOARD_DRIVER_ID = '20000000-0000-4000-8000-000000000001';
const usuario = '00000000-0000-4000-8000-0000000000f1';
const base = {
  traslado_id: DASHBOARD_TRIP_ID, usuario_id: usuario, vehiculo_id: '30000000-0000-4000-8000-000000000001',
  vehiculo_marca: 'Chrysler', vehiculo_modelo: 'Cirrus', vehiculo_anio: 2024, vehiculo_placas: 'PEM789', vehiculo_tipo: 'sedan',
  origen_ciudad: 'San Mateo Atenco', destino_ciudad: 'Lerma de Villada', origen_direccion: 'Estado de México', destino_direccion: 'Estado de México',
  origen_lat: 19.266, origen_lng: -99.531, destino_lat: 19.286, destino_lng: -99.510,
  estado: 'traslado_en_curso', conductor_id: DASHBOARD_DRIVER_ID, conductor_nombre: 'Jorge Ramírez', conductor_calificacion: 4.9, conductor_estado: 'activo',
  creado_en: '2026-10-27T16:42:00Z', actualizado_en: '2026-10-27T16:42:00Z', distancia_km: 12.5, tiempo_estimado_horas: .4,
  tiene_incidencia_abierta: false, tipo_pago: 'por_adelantado', precio_cotizado: 500, precio_final: 500,
};
export const DASHBOARD_TRIPS = [base,
  { ...base, traslado_id: '10000000-0000-4000-8000-000000000002', vehiculo_id: '30000000-0000-4000-8000-000000000002', vehiculo_marca: 'Toyota', vehiculo_modelo: 'RAV4', vehiculo_anio: 2023, vehiculo_placas: 'PZM456', vehiculo_tipo: 'suv', origen_ciudad: 'Toluca', destino_ciudad: 'Naucalpan', estado: 'servicio_cerrado', creado_en: '2026-10-26T22:18:00Z' },
  { ...base, traslado_id: '10000000-0000-4000-8000-000000000003', vehiculo_id: '30000000-0000-4000-8000-000000000003', vehiculo_marca: 'RAM', vehiculo_modelo: '1500', vehiculo_placas: 'RTM321', vehiculo_tipo: 'pick_up', origen_ciudad: 'Metepec', destino_ciudad: 'CDMX', estado: 'documentacion_pendiente', conductor_id: null, conductor_nombre: null, creado_en: '2026-10-25T17:05:00Z' },
  ...Array.from({ length: 7 }, (_, index) => ({ ...base, traslado_id: `10000000-0000-4000-8000-${String(index + 4).padStart(12, '0')}`, estado: 'servicio_cerrado', creado_en: `2026-10-${String(24 - index).padStart(2, '0')}T16:00:00Z` })),
];
export const DASHBOARD_VEHICLES = DASHBOARD_TRIPS.slice(0, 3).map(t => ({ id: t.vehiculo_id, usuario_id: usuario, marca: t.vehiculo_marca, modelo: t.vehiculo_modelo, anio: t.vehiculo_anio, placas: t.vehiculo_placas, tipo: t.vehiculo_tipo, fotos_urls: [], creado_en: t.creado_en, tiene_placas: true }));
export function datosDashboard(ruta) {
  if (ruta === '/rest/v1/pasaporte_digital') return DASHBOARD_TRIPS;
  if (ruta === '/rest/v1/vehiculos') return DASHBOARD_VEHICLES;
  if (ruta === '/rest/v1/traslados') return DASHBOARD_TRIPS.map(t => ({ ...t, id: t.traslado_id, estado_operativo: 'en_curso', actualizado_en: new Date().toISOString() }));
  if (ruta === '/rest/v1/ubicaciones_traslado') return [{ id: '40000000-0000-4000-8000-000000000001', traslado_id: DASHBOARD_TRIP_ID, conductor_id: DASHBOARD_DRIVER_ID, lat: 19.274, lng: -99.524, registrado_en: new Date().toISOString() }];
  if (ruta === '/rest/v1/conductores') return [{ id: DASHBOARD_DRIVER_ID, usuario_id: '00000000-0000-4000-8000-0000000000f2', nombre: 'Jorge Ramírez', estado: 'activo', calificacion_promedio: 4.9, foto_perfil_url: null }];
  return null;
}
