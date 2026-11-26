import { consultarCodigoPostalMx } from "@ruum/shared/utils";
import {
  categoriaTarifaSugeridaParaVehiculo,
  gamaSugeridaParaVehiculo,
  tipoSugeridoParaVehiculo
} from "@ruum/shared/catalogos";
import type { FilaTrasladoMasivoNormalizada } from "@ruum/api/services";
import {
  calcularRutaMasiva,
  geocodificarDireccionMasiva,
  tieneMapboxMasivosConfigurado
} from "../../lib/mapbox-masivos";

export type FilaCsv = Record<string, string>;
export type FilaPrevalidada = {
  numero: number;
  datos: FilaTrasladoMasivoNormalizada;
  errores: string[];
  advertencias: string[];
};
export type RevisionArchivo = {
  filas: FilaCsv[];
  errores: string[];
};

export const COLUMNAS_REQUERIDAS = [
  "vehiculo_marca",
  "vehiculo_modelo",
  "vehiculo_anio",
  "condicion",
  "origen_codigo_postal",
  "origen_colonia",
  "origen_calle",
  "origen_numero",
  "destino_codigo_postal",
  "destino_colonia",
  "destino_calle",
  "destino_numero"
] as const;

export const COLUMNAS_PLANTILLA = [
  "referencia_externa",
  "centro_costo",
  "orden_compra",
  "prioridad",
  "vehiculo_placas",
  "vehiculo_vin",
  "vehiculo_marca",
  "vehiculo_modelo",
  "vehiculo_anio",
  "vehiculo_color",
  "condicion",
  "contacto_entrega_nombre",
  "contacto_entrega_telefono",
  "contacto_recepcion_nombre",
  "contacto_recepcion_telefono",
  "origen_codigo_postal",
  "origen_colonia",
  "origen_calle",
  "origen_numero",
  "origen_referencias",
  "destino_codigo_postal",
  "destino_colonia",
  "destino_calle",
  "destino_numero",
  "destino_referencias",
  "modalidad_programacion",
  "fecha_hora_programada",
  "ventana_recoleccion",
  "ventana_entrega",
  "instrucciones_especiales"
] as const;

export const COLUMNAS_TECNICAS_OPCIONALES = [
  "origen_lat",
  "origen_lng",
  "destino_lat",
  "destino_lng",
  "distancia_km",
  "tiempo_estimado_horas"
] as const;

export const EJEMPLO_CSV = [
  COLUMNAS_PLANTILLA.join(","),
  [
    "FLOT-001",
    "CC-NORTE",
    "OC-45881",
    "normal",
    "ABC123",
    "",
    "Nissan",
    "Versa",
    "2024",
    "Blanco",
    "seminueva",
    "Operaciones",
    "+525500000000",
    "Recepcion",
    "+525500000001",
    "06700",
    "Roma Norte",
    "Av. Reforma",
    "100",
    "Acceso por estacionamiento",
    "04360",
    "Copilco Universidad",
    "Av. Universidad",
    "300",
    "Entregar en recepción",
    "programado",
    "2026-07-20T12:00:00-06:00",
    "2026-07-20T11:00:00-06:00",
    "2026-07-20T14:00:00-06:00",
    "Unidad prioritaria"
  ].join(",")
].join("\n");

export const CAMPOS_PERMITIDOS = new Set<string>([...COLUMNAS_PLANTILLA, ...COLUMNAS_TECNICAS_OPCIONALES]);

export function normalizarEncabezado(valor: string) {
  return valor.trim().toLowerCase().replace(/\s+/g, "_");
}

export function separarCsv(linea: string, delimitador: string) {
  const celdas: string[] = [];
  let actual = "";
  let entreComillas = false;

  for (let indice = 0; indice < linea.length; indice += 1) {
    const caracter = linea[indice];
    const siguiente = linea[indice + 1];
    if (caracter === '"' && siguiente === '"') {
      actual += '"';
      indice += 1;
      continue;
    }
    if (caracter === '"') {
      entreComillas = !entreComillas;
      continue;
    }
    if (caracter === delimitador && !entreComillas) {
      celdas.push(actual.trim());
      actual = "";
      continue;
    }
    actual += caracter;
  }

  celdas.push(actual.trim());
  return celdas;
}

export function revisarCsv(contenido: string): RevisionArchivo {
  const lineas = contenido.replace(/^\uFEFF/, "").split(/\r?\n/).filter((linea) => linea.trim());
  if (lineas.length < 2) return { filas: [], errores: ["El archivo debe incluir encabezados y al menos una fila."] };
  const delimitador = lineas[0]!.split(";").length > lineas[0]!.split(",").length ? ";" : ",";
  const encabezados = separarCsv(lineas[0]!, delimitador).map(normalizarEncabezado);
  const desconocidas = encabezados.filter((encabezado) => !CAMPOS_PERMITIDOS.has(encabezado));
  const faltantes = COLUMNAS_REQUERIDAS.filter((columna) => !encabezados.includes(columna));
  const errores = [
    ...desconocidas.map((columna) => `Columna no permitida: ${columna}`),
    ...faltantes.map((columna) => `Columna requerida faltante: ${columna}`)
  ];

  const filas = lineas.slice(1).map((linea) => {
    const celdas = separarCsv(linea, delimitador);
    return encabezados.reduce<FilaCsv>((fila, encabezado, indice) => {
      if (CAMPOS_PERMITIDOS.has(encabezado)) fila[encabezado] = celdas[indice]?.trim() ?? "";
      return fila;
    }, {});
  });

  return { filas, errores };
}

export function limpiar(valor: string | undefined) {
  return valor?.trim() ?? "";
}

export function numeroTexto(valor: string | undefined) {
  const limpio = limpiar(valor);
  return limpio && !Number.isNaN(Number(limpio)) ? limpio : "";
}

export function telefonoMx(valor: string | undefined) {
  const limpio = limpiar(valor);
  if (!limpio) return "";
  const digitos = limpio.replace(/\D/g, "");
  if (digitos.length === 10) return `+52${digitos}`;
  if (digitos.length === 12 && digitos.startsWith("52")) return `+${digitos}`;
  return limpio.startsWith("+") ? limpio : `+${digitos}`;
}

export function construirDireccion(
  calle: string,
  numero: string,
  colonia: string,
  cp: string,
  ciudad: string,
  estado: string
) {
  return [calle, numero, colonia, cp, ciudad, estado, "México"].map((valor) => valor.trim()).filter(Boolean).join(", ");
}

export function normalizarCategoria(categoria: string | null) {
  return categoria ?? "ligero_a";
}

export function normalizarGama(gama: string | null) {
  return gama ?? "entrada";
}

export async function enriquecerFila(fila: FilaCsv, numero: number): Promise<FilaPrevalidada> {
  const errores: string[] = [];
  const advertencias: string[] = [];
  for (const columna of COLUMNAS_REQUERIDAS) {
    if (!fila[columna]?.trim()) errores.push(`${columna} requerido`);
  }
  if (!fila.vehiculo_placas?.trim() && !fila.vehiculo_vin?.trim()) {
    errores.push("vehiculo_placas o vehiculo_vin requerido");
  }
  for (const campo of ["origen_lat", "origen_lng", "destino_lat", "destino_lng", "distancia_km", "tiempo_estimado_horas"]) {
    if (fila[campo]?.trim() && Number.isNaN(Number(fila[campo]))) errores.push(`${campo} debe ser numérico`);
  }
  if (fila.vehiculo_anio?.trim() && Number.isNaN(Number(fila.vehiculo_anio))) errores.push("vehiculo_anio debe ser numérico");

  const modalidad = fila.modalidad_programacion?.trim() || "lo_antes_posible";
  if (modalidad === "programado" && !fila.fecha_hora_programada?.trim()) {
    errores.push("fecha_hora_programada requerida para programado");
  }
  if (modalidad === "lo_antes_posible" && fila.fecha_hora_programada?.trim()) {
    errores.push("fecha_hora_programada no aplica para lo_antes_posible");
  }

  const origenCp = limpiar(fila.origen_codigo_postal);
  const destinoCp = limpiar(fila.destino_codigo_postal);
  const [origenCpDatos, destinoCpDatos] = await Promise.all([
    consultarCodigoPostalMx(origenCp, { rutaBase: "/api/codigos-postales" }),
    consultarCodigoPostalMx(destinoCp, { rutaBase: "/api/codigos-postales" })
  ]);
  if (origenCp && !origenCpDatos) advertencias.push("CP origen no encontrado en catálogo SEPOMEX");
  if (destinoCp && !destinoCpDatos) advertencias.push("CP destino no encontrado en catálogo SEPOMEX");

  const origenEstado = origenCpDatos?.estado ?? "";
  const destinoEstado = destinoCpDatos?.estado ?? "";
  const origenCiudad = origenCpDatos?.ciudades[0] ?? "";
  const destinoCiudad = destinoCpDatos?.ciudades[0] ?? "";
  const origenColonia = limpiar(fila.origen_colonia);
  const destinoColonia = limpiar(fila.destino_colonia);
  if (
    origenCpDatos &&
    origenColonia &&
    !origenCpDatos.colonias.some((colonia) => colonia.toLowerCase() === origenColonia.toLowerCase())
  ) {
    advertencias.push("Colonia origen no coincide exactamente con el CP");
  }
  if (
    destinoCpDatos &&
    destinoColonia &&
    !destinoCpDatos.colonias.some((colonia) => colonia.toLowerCase() === destinoColonia.toLowerCase())
  ) {
    advertencias.push("Colonia destino no coincide exactamente con el CP");
  }

  const origenDireccion = construirDireccion(
    limpiar(fila.origen_calle),
    limpiar(fila.origen_numero),
    origenColonia,
    origenCp,
    origenCiudad,
    origenEstado
  );
  const destinoDireccion = construirDireccion(
    limpiar(fila.destino_calle),
    limpiar(fila.destino_numero),
    destinoColonia,
    destinoCp,
    destinoCiudad,
    destinoEstado
  );
  let origenLat = numeroTexto(fila.origen_lat);
  let origenLng = numeroTexto(fila.origen_lng);
  let destinoLat = numeroTexto(fila.destino_lat);
  let destinoLng = numeroTexto(fila.destino_lng);
  let distanciaKm = numeroTexto(fila.distancia_km);
  let tiempoEstimadoHoras = numeroTexto(fila.tiempo_estimado_horas);

  const origenManual = origenLat && origenLng ? { lat: Number(origenLat), lng: Number(origenLng) } : null;
  const destinoManual = destinoLat && destinoLng ? { lat: Number(destinoLat), lng: Number(destinoLng) } : null;
  const [origenGeocodificado, destinoGeocodificado] = await Promise.all([
    origenManual ? Promise.resolve(origenManual) : geocodificarDireccionMasiva(origenDireccion),
    destinoManual ? Promise.resolve(destinoManual) : geocodificarDireccionMasiva(destinoDireccion)
  ]);

  if (!origenManual && origenGeocodificado) {
    origenLat = String(origenGeocodificado.lat);
    origenLng = String(origenGeocodificado.lng);
  }
  if (!destinoManual && destinoGeocodificado) {
    destinoLat = String(destinoGeocodificado.lat);
    destinoLng = String(destinoGeocodificado.lng);
  }
  if ((!origenLat || !origenLng || !destinoLat || !destinoLng) && tieneMapboxMasivosConfigurado()) {
    advertencias.push("Mapbox no resolvió coordenadas completas; operaciones deberá revisar la ruta");
  }
  if (!tieneMapboxMasivosConfigurado()) {
    advertencias.push("Mapbox no está configurado; se encolará sin coordenadas calculadas");
  }

  if (!distanciaKm || !tiempoEstimadoHoras) {
    const ruta = await calcularRutaMasiva(origenGeocodificado, destinoGeocodificado);
    if (ruta?.distanciaKm != null) distanciaKm = String(ruta.distanciaKm);
    if (ruta?.tiempoEstimadoHoras != null) tiempoEstimadoHoras = String(ruta.tiempoEstimadoHoras);
  }

  const marca = limpiar(fila.vehiculo_marca);
  const modelo = limpiar(fila.vehiculo_modelo);
  const tipoVehiculo = tipoSugeridoParaVehiculo(marca, modelo) ?? "sedan";
  const categoriaTarifa = normalizarCategoria(categoriaTarifaSugeridaParaVehiculo(marca, modelo));
  const gama = normalizarGama(gamaSugeridaParaVehiculo(marca, modelo));
  if (!tipoSugeridoParaVehiculo(marca, modelo)) {
    advertencias.push("Clasificación vehicular sugerida por defecto; validar modelo si impacta tarifa");
  }

  const etiquetas = [
    limpiar(fila.centro_costo) ? `Centro de costo: ${limpiar(fila.centro_costo)}` : "",
    limpiar(fila.orden_compra) ? `Orden de compra: ${limpiar(fila.orden_compra)}` : "",
    limpiar(fila.prioridad) && limpiar(fila.prioridad) !== "normal" ? `Prioridad: ${limpiar(fila.prioridad)}` : "",
    limpiar(fila.instrucciones_especiales)
  ].filter(Boolean).join(" | ");

  return {
    numero,
    errores,
    advertencias,
    datos: {
      referencia_externa: limpiar(fila.referencia_externa),
      vehiculo_placas: limpiar(fila.vehiculo_placas).toUpperCase(),
      vehiculo_vin: limpiar(fila.vehiculo_vin).toUpperCase(),
      vehiculo_marca: marca,
      vehiculo_modelo: modelo,
      vehiculo_anio: limpiar(fila.vehiculo_anio),
      vehiculo_tipo: tipoVehiculo,
      vehiculo_color: limpiar(fila.vehiculo_color),
      categoria_tarifa: categoriaTarifa,
      gama,
      condicion: limpiar(fila.condicion) || "seminueva",
      contacto_entrega_nombre: limpiar(fila.contacto_entrega_nombre),
      contacto_entrega_telefono: telefonoMx(fila.contacto_entrega_telefono),
      contacto_recepcion_nombre: limpiar(fila.contacto_recepcion_nombre),
      contacto_recepcion_telefono: telefonoMx(fila.contacto_recepcion_telefono),
      origen_direccion: origenDireccion,
      origen_ciudad: [origenCiudad, origenEstado].filter(Boolean).join(", "),
      origen_lat: origenLat,
      origen_lng: origenLng,
      origen_referencias: limpiar(fila.origen_referencias),
      destino_direccion: destinoDireccion,
      destino_ciudad: [destinoCiudad, destinoEstado].filter(Boolean).join(", "),
      destino_lat: destinoLat,
      destino_lng: destinoLng,
      destino_referencias: limpiar(fila.destino_referencias),
      instrucciones_especiales: etiquetas,
      modalidad_programacion: modalidad,
      fecha_hora_programada: limpiar(fila.fecha_hora_programada),
      tipo_pago: "al_cierre",
      tipo_ruta: origenEstado && destinoEstado && origenEstado !== destinoEstado ? "foraneo" : "local",
      ventana_recoleccion: limpiar(fila.ventana_recoleccion),
      ventana_entrega: limpiar(fila.ventana_entrega),
      tipo_servicio: fila.tipo_servicio?.trim() || "flotilla",
      motivo_servicio: "traslado_especial",
      distancia_km: distanciaKm,
      tiempo_estimado_horas: tiempoEstimadoHoras
    } as FilaTrasladoMasivoNormalizada
  };
}

export function descargarCsv(nombre: string, contenido: string) {
  const enlace = document.createElement("a");
  enlace.href = `data:text/csv;charset=utf-8,${encodeURIComponent(contenido)}`;
  enlace.download = nombre;
  enlace.click();
}

export async function sha256Archivo(archivo: File) {
  const buffer = await archivo.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
