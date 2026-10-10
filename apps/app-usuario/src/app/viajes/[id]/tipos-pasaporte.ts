import type { FotoEvidenciaConUrlVisual } from "@ruum/api/services";
import type { Database } from "@ruum/shared/types";

/** Tipos del Pasaporte Digital (detalle de traslado). Extraídos de
 * `viajes/[id]/page.tsx` (god-component) para reutilizarlos en los módulos
 * de carga de datos y piezas de presentación. */

export type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];

export type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];

export type Traslado = Pick<
  Database["public"]["Tables"]["traslados"]["Row"],
  | "origen_direccion"
  | "origen_ciudad"
  | "destino_direccion"
  | "destino_ciudad"
  | "contacto_entrega_nombre"
  | "contacto_entrega_telefono"
  | "contacto_recepcion_nombre"
  | "contacto_recepcion_telefono"
  | "fecha_hora_programada"
  | "cotizacion_expira_en"
  | "tipo_servicio"
  | "motivo_servicio"
  | "ventana_recoleccion"
  | "ventana_entrega"
>;

export type Vehiculo = Pick<
  Database["public"]["Tables"]["vehiculos"]["Row"],
  | "tipo"
  | "marca"
  | "modelo"
  | "anio"
  | "vin"
  | "condicion"
  | "color"
  | "transmision"
  | "placas"
  | "tiene_tarjeta_circulacion"
  | "tiene_verificacion"
  | "tiene_placas"
  | "puede_circular_rodando"
>;

export type Conductor = Pick<
  Database["public"]["Tables"]["conductores"]["Row"],
  "id" | "nombre" | "estado" | "nivel_operativo_vigente" | "calificacion_promedio" | "traslados_completados" | "foto_perfil_url"
>;

export type FotoEvidencia = Database["public"]["Tables"]["evidencia_fotos"]["Row"];
export type FotoEvidenciaVisual = FotoEvidenciaConUrlVisual<FotoEvidencia>;
export type Incidencia = Database["public"]["Tables"]["incidencias"]["Row"];
export type Pago = Database["public"]["Tables"]["pagos"]["Row"];
export type Calificacion = Database["public"]["Tables"]["calificaciones_traslado"]["Row"];
export type Disputa = Database["public"]["Tables"]["disputas"]["Row"];
export type ReclamoSeguroUsuario = Pick<
  Database["public"]["Tables"]["reclamos_seguro"]["Row"],
  "id" | "traslado_id" | "estado" | "abierto_en" | "resuelto_en"
>;
