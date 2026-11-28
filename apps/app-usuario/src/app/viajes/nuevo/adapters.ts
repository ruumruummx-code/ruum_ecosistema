import type { DatosNuevoTraslado, DatosVehiculoParaTraslado, DatosParadaParaTraslado } from "@ruum/api/services";
import type { DatosFormulario } from "./types";

export interface CoordenadasTraslado {
  origenLat?: number;
  origenLng?: number;
  destinoLat?: number;
  destinoLng?: number;
  distanciaKm?: number;
  tiempoEstimadoHoras?: number;
  snapshotTarifa?: unknown;
}
const nombre = (n: string, a: string) => [n.trim(), a.trim()].filter(Boolean).join(" ");
const telefono = (v: string) => `+52${v.replace(/\D/g, "").slice(0, 10)}`;
const direccion = (calle: string, numero: string, colonia: string, cp: string, estado: string) => [calle, numero, colonia, cp, estado].map((v) => v.trim()).filter(Boolean).join(", ");

export interface CoordenadasParada {
  lat?: number; lng?: number;
}

/** F-3: rangos válidos WGS84. Fuera de rango → null (no se persiste basura). */
function normalizarLatitud(valor: unknown): number | null {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return null;
  return valor >= -90 && valor <= 90 ? valor : null;
}

function normalizarLongitud(valor: unknown): number | null {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return null;
  return valor >= -180 && valor <= 180 ? valor : null;
}

function normalizarNoNegativo(valor: unknown): number | null {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return null;
  return valor >= 0 ? valor : null;
}

const ZONA_HORARIA_PREDETERMINADA = "America/Mexico_City";

function zonaValida(zona: string | undefined): string {
  if (!zona) return ZONA_HORARIA_PREDETERMINADA;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zona });
    return zona;
  } catch {
    return ZONA_HORARIA_PREDETERMINADA;
  }
}

/** Diferencia (ms) entre la hora de pared en `zona` y UTC para el instante dado. */
function desfaseZonaMs(instanteMs: number, zona: string): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: zona, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(instanteMs));
  const v = (t: string) => Number(partes.find((p) => p.type === t)?.value ?? 0);
  const comoUtc = Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute"), v("second"));
  return comoUtc - Math.floor(instanteMs / 1000) * 1000;
}

/**
 * Convierte la fecha/hora capturada en el formulario ("YYYY-MM-DDTHH:mm", hora
 * local del usuario, sin zona) a ISO UTC usando la zona horaria del usuario.
 * Antes se usaba `new Date(valor)`, que en el servidor (UTC) desplazaba la hora
 * 6 h en CDMX y hacía fallar la anticipación mínima de 2 h en la cotización.
 */
export function fechaLocalAIsoUtc(valor: string, zonaHoraria?: string): string | null {
  const texto = valor.trim();
  if (!texto) return null;
  // Si ya trae zona explícita (Z u offset), se respeta tal cual.
  if (/(Z|[+-]\d{2}:?\d{2})$/i.test(texto)) {
    const fecha = new Date(texto);
    return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
  }
  const m = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) return null;
  const zona = zonaValida(zonaHoraria);
  const [, a, mes, d, h = "0", min = "0", s = "0"] = m;
  const paredComoUtc = Date.UTC(Number(a), Number(mes) - 1, Number(d), Number(h), Number(min), Number(s));
  let instante = paredComoUtc - desfaseZonaMs(paredComoUtc, zona);
  // Segundo ajuste por si el desfase cambia en ese instante (horario de verano).
  instante = paredComoUtc - desfaseZonaMs(instante, zona);
  return new Date(instante).toISOString();
}

export function construirPayloadCreacion(datos: DatosFormulario, vehiculoSeleccionadoId: string, coords: CoordenadasTraslado & { paradasCoords?: CoordenadasParada[] }, zonaHoraria?: string): {
  vehiculo: DatosVehiculoParaTraslado; traslado: DatosNuevoTraslado; paradas: DatosParadaParaTraslado[];
} {
  const vehiculo: DatosVehiculoParaTraslado = vehiculoSeleccionadoId ? { vehiculoId: vehiculoSeleccionadoId } : { vehiculo: {
    tipo: datos.tipo, transmision: datos.transmision, marca: datos.marca, modelo: datos.modelo, anio: Number(datos.anio), color: datos.color,
    placas: datos.placas, vin: datos.vin, condicion: datos.condicion || "seminueva", estado_general_declarado: datos.estadoGeneral, tiene_tarjeta_circulacion: datos.tieneTarjeta,
    tiene_verificacion: datos.tieneVerificacion, tiene_placas: datos.tienePlacas, puede_circular_rodando: datos.puedeCircular
  }};
  const paradas: DatosParadaParaTraslado[] = (datos.paradas ?? []).slice(0, 8).map((p, idx) => ({
    tipo: p.tipo,
    calle: p.calle, numero: p.numero, colonia: p.colonia, codigo_postal: p.codigoPostal, estado: p.estado, ciudad: p.ciudad,
    direccion: direccion(p.calle, p.numero, p.colonia, p.codigoPostal, p.estado),
    referencias: p.referencias || null,
    lat: normalizarLatitud(coords.paradasCoords?.[idx]?.lat ?? p.lat ?? null) ?? normalizarLatitud(p.lat) ?? null,
    lng: normalizarLongitud(coords.paradasCoords?.[idx]?.lng ?? p.lng ?? null) ?? normalizarLongitud(p.lng) ?? null,
    tipo_tarea: p.tipo === "tarea" ? (p.tipoTarea ?? "otro") : null
  }));
  return { vehiculo, traslado: {
    contacto_entrega_nombre: nombre(datos.entregaNombre, datos.entregaApellido), contacto_entrega_telefono: telefono(datos.entregaTelefono),
    contacto_recepcion_nombre: nombre(datos.recepcionNombre, datos.recepcionApellido), contacto_recepcion_telefono: telefono(datos.recepcionTelefono),
    origen_lat: normalizarLatitud(coords.origenLat), origen_lng: normalizarLongitud(coords.origenLng),
    origen_direccion: direccion(datos.origenCalle, datos.origenNumero, datos.origenColonia, datos.origenCodigoPostal, datos.origenEstado), origen_ciudad: datos.origenCiudad,
    origen_referencias: datos.origenReferencias || null, destino_lat: normalizarLatitud(coords.destinoLat), destino_lng: normalizarLongitud(coords.destinoLng),
    destino_direccion: direccion(datos.destinoCalle, datos.destinoNumero, datos.destinoColonia, datos.destinoCodigoPostal, datos.destinoEstado), destino_ciudad: datos.destinoCiudad,
    destino_referencias: datos.destinoReferencias || null, instrucciones_especiales: datos.instruccionesEspeciales,
    modalidad_programacion: datos.modalidadProgramacion, fecha_hora_programada: datos.fechaHoraProgramada ? fechaLocalAIsoUtc(datos.fechaHoraProgramada, zonaHoraria) : null,
    tipo_ruta: datos.tipoRuta, ventana_recoleccion: datos.ventanaRecoleccion, ventana_entrega: datos.ventanaEntrega,
    distancia_km: normalizarNoNegativo(coords.distanciaKm), tiempo_estimado_horas: normalizarNoNegativo(coords.tiempoEstimadoHoras),
    snapshot_tarifa: coords.snapshotTarifa ?? null
  }, paradas };
}
