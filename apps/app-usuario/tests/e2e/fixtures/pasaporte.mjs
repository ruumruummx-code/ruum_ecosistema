export const PASAPORTE_ID = "c2000000-0000-4000-8000-000000000001";

export const ETAPAS_PASAPORTE = {
  conductor_asignado: 1,
  conductor_en_camino_al_origen: 2,
  vehiculo_recibido: 7,
  traslado_en_curso: 8,
  llegada_a_destino: 10,
  evidencia_final_completada: 12,
  entrega_confirmada: 13,
};

export function datosPasaporte(ruta, perfil, etapa) {
  const fecha = "2026-10-01T18:00:00Z";
  switch (ruta) {
    case "/rest/v1/pasaporte_digital":
      return [{
        traslado_id: PASAPORTE_ID, usuario_id: perfil.id, estado: etapa,
        actualizado_en: fecha, origen_ciudad: "CDMX", destino_ciudad: "Toluca",
        vehiculo_marca: "Nissan", vehiculo_modelo: "Versa", vehiculo_anio: 2024,
        conductor_id: "c2000000-0000-4000-8000-000000000002",
        conductor_nombre: "Andrea Operadora", conductor_calificacion: 4.8,
        precio_cotizado: 500, tipo_pago: "anticipado"
      }];
    case "/rest/v1/evidencia_fotos":
      return [{ id: "foto-c2", traslado_id: PASAPORTE_ID, tipo: "inicial", angulo: "frontal",
                url: "c2/frontal.png", capturada_en: fecha, sincronizada: true }];
    case "/rest/v1/pagos":
      return [{ id: "pago-c2", traslado_id: PASAPORTE_ID, monto: 500, momento: "anticipado",
                estado: "completado", metodo: "stripe", registrado_en: fecha }];
    default:
      return null;
  }
}
