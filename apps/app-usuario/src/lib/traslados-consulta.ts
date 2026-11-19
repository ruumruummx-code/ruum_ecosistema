import {
  consultarMontosPagosCompletados,
  consultarPaginaPasaportesFiltrada,
  consultarTrasladosPaginaUsuario,
  consultarTrasladosProgramadosEnRango,
  consultarUltimoPasaporteUsuario,
  contarPasaportesUsuario,
  type FiltroCategoriaPasaporte,
  type FiltrosPasaportesUsuario,
} from "@ruum/api/transfers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@ruum/shared/types";
import {
  type CategoriaPestana,
  clasificarEstadoTraslado,
  evaluarConsistenciaPasaporte,
  MAPEO_ESTADOS_CANONICOS,
} from "./estados-traslado-policy";
import {
  obtenerPartesFechaLocal,
  perteneceAHoy,
  perteneceAMes,
  perteneceASemanaCalendario,
  ZONA_HORARIA_CANONICA,
} from "./zona-horaria-traslados";
import { logStructuredWarn } from "@/lib/logger";

export type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];
export type Traslado = Pick<
  Database["public"]["Tables"]["traslados"]["Row"],
  "id" | "origen_direccion" | "origen_ciudad" | "destino_direccion" | "destino_ciudad" | "fecha_hora_programada"
>;

/**
 * RUUM-USR-F8-001 (CB-3 / T2 / CA-7): DTO mínimo de lista con minimización de PII.
 * Omite números detallados de calle interior, teléfonos de contacto,
 * notas operativas y fotos de inspección.
 */
export interface ViajeListaDTO {
  id: string;
  trasladoId: string | null;
  pasaporteId: string | null;
  folio: string;
  estado: string | null;
  estadoOperativo: string | null;
  categoria: CategoriaPestana;
  etiquetaEstado: string;
  esHuerfano: boolean;
  requiereSoporte: boolean;
  vehiculo: {
    nombre: string;
    tipo: string;
    placas: string | null;
  };
  origen: {
    ciudad: string;
    direccionCorta: string;
  };
  destino: {
    ciudad: string;
    direccionCorta: string;
  };
  origenCiudad: string;
  origenDireccion: string;
  destinoCiudad: string;
  destinoDireccion: string;
  fechaProgramada: {
    raw: string | null;
    fechaTexto: string;
    horaTexto: string;
    diaSemana: string;
    diaNumero: string;
    mesTexto: string;
    esHoy: boolean;
  };
  conductorNombre: string | null;
  montoPagado: number;
  precioFinal: number | null;
  precioCotizado: number | null;
  distanciaKm: number | null;
  tiempoEstimadoHoras: number | null;
  creadoEn: string | null;
  cerradoEn: string | null;
  /** Compatibilidad hacia atrás con componentes existentes que leen pasaporte/traslado */
  pasaporte: Pasaporte;
  traslado: Traslado | null;
}

export interface ConteosTraslados {
  todos: number;
  activos: number;
  programados: number;
  finalizados: number;
  cancelados: number;
  en_revision: number;
}

export interface ResultadoListaTrasladosConsolidada {
  items: ViajeListaDTO[];
  conteos: ConteosTraslados;
  gastoConfirmadoTotal: number;
  snapshotVersion: string;
  snapshotDivergente: boolean;
  totalItems: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface OpcionesConsultaTraslados {
  pagina?: number;
  limite?: number;
  tab?: string;
  buscar?: string;
  /** Tipo de vehículo (valor de enum, p. ej. "sedan"). */
  tipo?: string;
  /** "hoy" | "semana" | "mes" (zona horaria canónica). */
  fecha?: string;
  snapshotVersionCliente?: string;
}

const CATEGORIAS: CategoriaPestana[] = ["activos", "programados", "finalizados", "cancelados", "en_revision"];
const TIPOS_VEHICULO = new Set(["sedan", "suv", "pick_up", "van", "luxury", "coleccion"]);

function estadosDe(categoria: CategoriaPestana) {
  return Object.entries(MAPEO_ESTADOS_CANONICOS).filter(([, c]) => c === categoria).map(([estado]) => estado);
}

/** Traduce una pestaña a filtro de servidor con las mismas reglas que clasificarEstadoTraslado. */
export function filtroCategoria(tab: string | undefined): FiltroCategoriaPasaporte {
  if (!tab || tab === "todos" || !CATEGORIAS.includes(tab as CategoriaPestana)) return { modo: "todos" };
  if (tab === "en_revision") return { modo: "revision", estadosConocidos: Object.keys(MAPEO_ESTADOS_CANONICOS) };
  if (tab === "finalizados") return { modo: "cerrados", estados: estadosDe("finalizados") };
  return { modo: "abiertos", estados: estadosDe(tab as CategoriaPestana) };
}

/** Resuelve el filtro de fecha a ids de traslado (null = sin filtro). */
async function trasladosEnFecha(cliente: SupabaseClient<Database>, fecha: string | undefined): Promise<string[] | null> {
  if (fecha !== "hoy" && fecha !== "semana" && fecha !== "mes") return null;
  const ahora = Date.now();
  const dias = fecha === "hoy" ? 2 : fecha === "semana" ? 8 : 32;
  // Ventana UTC holgada; la pertenencia exacta se decide en la zona canónica.
  const { data, error } = await consultarTrasladosProgramadosEnRango(
    cliente,
    new Date(ahora - dias * 86_400_000).toISOString(),
    new Date(ahora + dias * 86_400_000).toISOString()
  );
  if (error) throw error;
  const pertenece = fecha === "hoy" ? perteneceAHoy : fecha === "semana" ? perteneceASemanaCalendario : perteneceAMes;
  return (data ?? []).filter((t) => pertenece(t.fecha_hora_programada)).map((t) => t.id);
}

/**
 * Sanitiza direcciones para la lista reduciendo PII.
 * Si contiene números interiores o calles detalladas, conserva ciudad y vialidad principal.
 */
export function sanitizarDireccionCorta(dir: string | null | undefined, ciudad?: string | null): string {
  if (!dir && !ciudad) return "Ubicación pendiente";
  if (!dir) return ciudad ?? "Ubicación pendiente";
  // Si contiene comas (ej: "Av. Paseo de la Reforma 222, Juárez, Cuauhtémoc")
  const partes = dir.split(",").map((p) => p.trim()).filter(Boolean);
  if (partes.length > 1) {
    // Tomar vía principal y primera colonia/zona sin números de departamento/interior
    return partes.slice(0, 2).join(", ");
  }
  return dir;
}

/**
 * Minimiza nombre del conductor a primer nombre + inicial del apellido (ej: "Juan P.").
 */
export function sanitizarNombreConductor(nombre: string | null | undefined): string | null {
  if (!nombre?.trim()) return null;
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0];
  const primer = partes[0];
  const inicial = partes[1].charAt(0).toUpperCase();
  return `${primer} ${inicial}.`;
}

export function folioCorto(trasladoId: string | null | undefined): string {
  return trasladoId ? `#RR-${trasladoId.slice(0, 4).toUpperCase()}` : "#RR-—";
}

export function formatearFechaProgramada(fechaStr: string | null | undefined): {
  raw: string | null;
  fechaTexto: string;
  horaTexto: string;
  diaSemana: string;
  diaNumero: string;
  mesTexto: string;
  esHoy: boolean;
} {
  if (!fechaStr) {
    return {
      raw: null,
      fechaTexto: "Fecha pendiente",
      horaTexto: "Hora pendiente",
      diaSemana: "S/F",
      diaNumero: "—",
      mesTexto: "—",
      esHoy: false,
    };
  }

  const d = new Date(fechaStr);
  if (Number.isNaN(d.getTime())) {
    return {
      raw: fechaStr,
      fechaTexto: "Fecha pendiente",
      horaTexto: "Hora pendiente",
      diaSemana: "S/F",
      diaNumero: "—",
      mesTexto: "—",
      esHoy: false,
    };
  }

  const partes = obtenerPartesFechaLocal(d, ZONA_HORARIA_CANONICA);
  const esHoy = perteneceAHoy(d, new Date(), ZONA_HORARIA_CANONICA);

  const dtfFecha = new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA_HORARIA_CANONICA,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const dtfHora = new Intl.DateTimeFormat("es-MX", {
    timeZone: ZONA_HORARIA_CANONICA,
    hour: "numeric",
    minute: "2-digit",
  });

  const fechaFormat = dtfFecha.format(d);
  const horaTexto = dtfHora.format(d);

  return {
    raw: fechaStr,
    fechaTexto: esHoy ? `Hoy, ${fechaFormat}` : fechaFormat,
    horaTexto,
    diaSemana: partes.diaSemanaTexto,
    diaNumero: partes.dia,
    mesTexto: partes.mesTexto,
    esHoy,
  };
}

/**
 * Mapea un pasaporte y su traslado a un DTO mínimo de lista, ejecutando evaluación de consistencia.
 */
export function mapearAViajeListaDTO(
  pasaporte: Pasaporte,
  traslado: Traslado | null
): ViajeListaDTO {
  const trasladoId = pasaporte.traslado_id;
  const tieneTraslado = Boolean(trasladoId && traslado);
  const idUnico = trasladoId ?? (pasaporte.creado_en ? `p-${pasaporte.creado_en}` : `p-unknown-${Math.random()}`);

  const consistencia = evaluarConsistenciaPasaporte(
    trasladoId,
    tieneTraslado,
    pasaporte.estado,
    pasaporte.estado_operativo,
    pasaporte.cerrado_en
  );

  const vehiculoPartes = [pasaporte.vehiculo_marca, pasaporte.vehiculo_modelo, pasaporte.vehiculo_anio].filter(Boolean);
  const vehiculoNombre = vehiculoPartes.length > 0 ? vehiculoPartes.join(" ") : "Vehículo";
  const vehiculoTipo = pasaporte.vehiculo_tipo ?? "Tipo no disponible";

  const origenCiudad = pasaporte.origen_ciudad ?? traslado?.origen_ciudad ?? "Origen pendiente";
  const origenDir = pasaporte.origen_direccion ?? traslado?.origen_direccion ?? "";
  const destinoCiudad = pasaporte.destino_ciudad ?? traslado?.destino_ciudad ?? "Destino pendiente";
  const destinoDir = pasaporte.destino_direccion ?? traslado?.destino_direccion ?? "";

  const fecha = formatearFechaProgramada(traslado?.fecha_hora_programada ?? null);

  return {
    id: idUnico,
    trasladoId: trasladoId ?? null,
    pasaporteId: trasladoId ?? null,
    folio: folioCorto(trasladoId),
    estado: pasaporte.estado ?? null,
    estadoOperativo: pasaporte.estado_operativo ?? null,
    categoria: consistencia.categoria,
    etiquetaEstado: consistencia.etiquetaEstado,
    esHuerfano: consistencia.esHuerfano,
    requiereSoporte: consistencia.requiereAtencionSoporte,
    vehiculo: {
      nombre: vehiculoNombre,
      tipo: vehiculoTipo,
      placas: pasaporte.vehiculo_placas ?? null,
    },
    origen: {
      ciudad: origenCiudad,
      direccionCorta: sanitizarDireccionCorta(origenDir, origenCiudad),
    },
    destino: {
      ciudad: destinoCiudad,
      direccionCorta: sanitizarDireccionCorta(destinoDir, destinoCiudad),
    },
    origenCiudad,
    origenDireccion: origenDir,
    destinoCiudad,
    destinoDireccion: destinoDir,
    fechaProgramada: fecha,
    conductorNombre: sanitizarNombreConductor(pasaporte.conductor_nombre),
    montoPagado: Number(pasaporte.monto_pagado) || 0,
    precioFinal: pasaporte.precio_final != null ? Number(pasaporte.precio_final) : null,
    precioCotizado: pasaporte.precio_cotizado != null ? Number(pasaporte.precio_cotizado) : null,
    distanciaKm: pasaporte.distancia_km != null ? Number(pasaporte.distancia_km) : null,
    tiempoEstimadoHoras: pasaporte.tiempo_estimado_horas != null ? Number(pasaporte.tiempo_estimado_horas) : null,
    creadoEn: pasaporte.creado_en ?? null,
    cerradoEn: pasaporte.cerrado_en ?? null,
    pasaporte,
    traslado,
  };
}

/**
 * RUUM-USR-F8-001 (CB-1 / T1 / CA-1, CA-2, CA-3):
 * Servicio consolidado server-side que retorna la lista de traslados con paginación real,
 * conteos consistentes, control de versiones (snapshotVersion) y gasto confirmado total.
 */
export async function obtenerListaTrasladosConsolidadaUsuario(
  cliente: SupabaseClient<Database>,
  usuarioId: string,
  opciones?: OpcionesConsultaTraslados
): Promise<ResultadoListaTrasladosConsolidada> {
  const pagina = Math.max(1, Number(opciones?.pagina) || 1);
  const limite = Math.min(Math.max(1, Number(opciones?.limite) || 10), 50);
  const desplazamiento = (pagina - 1) * limite;

  // Pestaña, búsqueda y filtros se aplican EN LA CONSULTA (antes se filtraban
  // en cliente solo los 10 elementos de la página mientras los conteos eran
  // globales: «Cancelados (5)» podía mostrar 0).
  const trasladoIds = await trasladosEnFecha(cliente, opciones?.fecha);
  const filtrosBase: Omit<FiltrosPasaportesUsuario, "categoria"> = {
    buscar: opciones?.buscar ?? null,
    vehiculoTipo: opciones?.tipo && TIPOS_VEHICULO.has(opciones.tipo) ? opciones.tipo : null,
    trasladoIds,
  };

  // 1. Conteos exactos por pestaña (count: "exact", head: true), con los
  //    mismos filtros de búsqueda: sin descargar filas ni el corte de 1,000.
  const [ultimo, ...conteosRaw] = await Promise.all([
    consultarUltimoPasaporteUsuario(cliente, usuarioId),
    contarPasaportesUsuario(cliente, usuarioId, { ...filtrosBase, categoria: { modo: "todos" } }),
    ...CATEGORIAS.map((categoria) => contarPasaportesUsuario(cliente, usuarioId, { ...filtrosBase, categoria: filtroCategoria(categoria) })),
  ]);
  const errorConteo = conteosRaw.find((r) => r.error)?.error;
  if (errorConteo) throw errorConteo;
  if (ultimo.error) throw ultimo.error;

  const conteos: ConteosTraslados = {
    todos: conteosRaw[0].count ?? 0,
    activos: 0,
    programados: 0,
    finalizados: 0,
    cancelados: 0,
    en_revision: 0,
  };
  CATEGORIAS.forEach((categoria, i) => { conteos[categoria] = conteosRaw[i + 1].count ?? 0; });

  // Snapshot versioning (CB-1)
  const snapshotVersion = ultimo.data?.creado_en ?? new Date(0).toISOString();
  const snapshotDivergente = Boolean(
    opciones?.snapshotVersionCliente &&
    opciones.snapshotVersionCliente !== snapshotVersion
  );

  // 2. Página filtrada en servidor con el total exacto de coincidencias (CA-1)
  const { data: pasaportesPaginadosRaw, error: errPaginados, count } = await consultarPaginaPasaportesFiltrada(
    cliente,
    usuarioId,
    { ...filtrosBase, categoria: filtroCategoria(opciones?.tab) },
    desplazamiento,
    limite
  );

  if (errPaginados) {
    throw errPaginados;
  }
  const totalItems = count ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(totalItems / limite));

  const pasaportesPaginados = (pasaportesPaginadosRaw ?? []) as Pasaporte[];
  const idsPagina = pasaportesPaginados
    .map((p) => p.traslado_id)
    .filter((id): id is string => Boolean(id));

  // 3. Consultar traslados asociados ÚNICAMENTE para los ítems de esta página
  let trasladosPorId = new Map<string, Traslado>();
  if (idsPagina.length > 0) {
    const { data: trasladosRaw, error: errTraslados } = await consultarTrasladosPaginaUsuario(cliente, idsPagina);

    if (errTraslados) {
      logStructuredWarn("traslados-consulta", "error_cargar_traslados_asociados", errTraslados, {
        usuarioId,
        trasladosCount: idsPagina.length,
      });
    } else if (trasladosRaw) {
      trasladosPorId = new Map(trasladosRaw.map((t) => [t.id, t]));
    }
  }

  // 4. Mapear DTOs mínimos solo para los registros de la página solicitada
  const items: ViajeListaDTO[] = pasaportesPaginados.map((pasaporte) => {
    const traslado = pasaporte.traslado_id ? trasladosPorId.get(pasaporte.traslado_id) ?? null : null;
    return mapearAViajeListaDTO(pasaporte, traslado);
  });

  // 5. Total de gasto confirmado en servidor (CB-1)
  let gastoConfirmadoTotal = 0;
  try {
    const { data: pagos, error: errPagos } = await consultarMontosPagosCompletados(cliente);

    if (!errPagos && pagos && pagos.length > 0) {
      gastoConfirmadoTotal = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
    } else {
      // Fallback consistente: solo contar pagos confirmados
      gastoConfirmadoTotal = pasaportesPaginados.reduce((acc, p) => {
        const cat = clasificarEstadoTraslado(p.estado, p.estado_operativo, p.cerrado_en, p.traslado_id);
        if (cat !== "cancelados" && cat !== "en_revision" && p.monto_pagado) {
          return acc + Number(p.monto_pagado);
        }
        return acc;
      }, 0);
    }
  } catch {
    gastoConfirmadoTotal = 0;
  }

  return {
    items,
    conteos,
    gastoConfirmadoTotal,
    snapshotVersion,
    snapshotDivergente,
    totalItems,
    pagina,
    limite,
    totalPaginas,
  };
}
