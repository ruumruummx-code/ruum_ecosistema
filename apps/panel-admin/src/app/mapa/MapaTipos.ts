import type { TrasladoMapa } from "@ruum/api/services";

export const ETIQUETA_ESTADO: Partial<Record<string, string>> = {
  conductor_asignado: "Conductor asignado",
  conductor_en_camino_al_origen: "En camino al origen",
  conductor_en_punto_de_recoleccion: "En punto de recolección",
  verificacion_vehiculo_en_proceso: "Verificando vehículo",
  evidencia_inicial_en_proceso: "Capturando evidencia inicial",
  evidencia_inicial_completada: "Evidencia inicial completa",
  vehiculo_recibido: "Vehículo recibido",
  traslado_en_curso: "En ruta",
  incidencia_reportada: "Incidencia reportada",
  llegada_a_destino: "Llegó al destino",
  evidencia_final_en_proceso: "Capturando evidencia final",
  evidencia_final_completada: "Evidencia final completa",
  entrega_confirmada: "Entrega confirmada",
  pago_pendiente: "Pago pendiente",
  pago_completado: "Pago completado"
};

export type EstadoConexionMapa = "datos_en_vivo" | "actualizando" | "reconectando" | "sin_conexion" | "desactualizado";
export type VistaMapaMovil = "mapa" | "lista" | "alertas";
export type FiltroMapa = "todos" | "en_ruta" | "incidencias" | "sin_senal" | "ubicacion_antigua";
export type SimboloMapa = "origen" | "destino" | "vehiculo" | "incidencia" | "emergencia" | "sin_senal" | "ruta_real" | "ruta_aproximada";
export type EstadoSenalMapa = "confirmada" | "estimada" | "antigua" | "sin_senal" | "sin_ubicacion";
export type CategoriaPrioridadMapa = "emergencia" | "incidencia_critica" | "sla_vencido" | "sin_senal" | "desviacion" | "en_riesgo" | "normal";

function tiempoRelativo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "Ahora";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h`;
}

export const tokenMapbox = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
export const estiloMapbox = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL || "mapbox://styles/mapbox/streets-v12";
const UMBRAL_UBICACION_ANTIGUA_MIN = 30;
export const UMBRAL_SIN_SENAL_MIN = 60;
export const FRECUENCIA_GPS_ESPERADA_SEG = 30;
export const ORDEN_PRIORIDAD_MAPA: CategoriaPrioridadMapa[] = ["emergencia", "incidencia_critica", "sla_vencido", "sin_senal", "desviacion", "en_riesgo", "normal"];
export const ETIQUETA_PRIORIDAD_MAPA: Record<CategoriaPrioridadMapa, string> = {
  emergencia: "Emergencia",
  incidencia_critica: "Incidencia crítica",
  sla_vencido: "SLA vencido",
  sin_senal: "Sin señal",
  desviacion: "Desviación",
  en_riesgo: "En riesgo",
  normal: "Operación normal"
};
export const DESCRIPCION_PRIORIDAD_MAPA: Record<CategoriaPrioridadMapa, string> = {
  emergencia: "Incidencia abierta en estado de emergencia operativa.",
  incidencia_critica: "Traslado con incidencia abierta.",
  sla_vencido: "Reservado para el SLA operativo cuando el backend lo exponga.",
  sin_senal: "Última ubicación supera el umbral de señal.",
  desviacion: "Reservado para detección de desvío de ruta.",
  en_riesgo: "Ubicación antigua o punto estimado desactualizado.",
  normal: "Traslados sin alerta prioritaria."
};
const COLOR_MAPA = {
  origen: "var(--ui-success)",
  destino: "var(--ui-brand)",
  incidencia: "var(--ui-danger)",
  emergencia: "var(--ui-danger)",
  vehiculo: "var(--ui-success)",
  sinSenal: "var(--ui-fg-muted)",
  pinBordeClaro: "var(--ui-fg)",
  pinBordeOscuro: "var(--ui-card)",
  pinSombra: "var(--ui-shadow-md)"
} as const;

export function obtenerColoresMapa() {
  const estilos = window.getComputedStyle(document.documentElement);
  const leer = (token: string) => estilos.getPropertyValue(token).trim();
  return {
    origen: leer("--ui-success"),
    destino: leer("--ui-brand"),
    incidencia: leer("--ui-danger"),
    emergencia: leer("--ui-danger"),
    vehiculo: leer("--ui-success"),
    sinSenal: leer("--ui-fg-muted"),
    pinBordeClaro: leer("--ui-fg"),
    pinBordeOscuro: leer("--ui-card")
  };
}

export function crearPin(simbolo: SimboloMapa, color: string, borde: string, etiqueta: string): HTMLButtonElement {
  const pin = document.createElement("button");
  const figura = document.createElement("span");
  pin.type = "button";
  pin.setAttribute("aria-label", etiqueta);
  pin.setAttribute("title", etiqueta);
  Object.assign(pin.style, {
    width: "44px",
    height: "44px",
    border: "0",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0"
  });
  Object.assign(figura.style, {
    width: "24px",
    height: "24px",
    color,
    background: "var(--ui-card)",
    border: `3px solid ${simbolo === "sin_senal" ? color : borde}`,
    boxShadow: COLOR_MAPA.pinSombra,
    pointerEvents: "none",
    display: "grid",
    placeItems: "center",
    fontSize: "13px",
    fontWeight: "800",
    lineHeight: "1"
  });
  aplicarSimboloMapa(figura, simbolo, color);
  pin.appendChild(figura);
  return pin;
}

function aplicarSimboloMapa(figura: HTMLSpanElement, simbolo: SimboloMapa, color: string) {
  if (simbolo === "origen") {
    Object.assign(figura.style, { borderRadius: "9999px", background: color });
    figura.textContent = "";
    return;
  }
  if (simbolo === "destino") {
    Object.assign(figura.style, { borderRadius: "4px", borderColor: color });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("width", "18"); svg.setAttribute("height", "18");
    const path = document.createElementNS(svg.namespaceURI, "path"); path.setAttribute("d", "M7 21V4h9l-1.4 3L16 10H7"); path.setAttribute("fill", "none"); path.setAttribute("stroke", "currentColor"); path.setAttribute("stroke-width", "2.2"); path.setAttribute("stroke-linejoin", "round"); svg.appendChild(path); figura.replaceChildren(svg);
    return;
  }
  if (simbolo === "vehiculo") {
    Object.assign(figura.style, { borderRadius: "9999px", borderColor: color });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("width", "18"); svg.setAttribute("height", "18");
    const path = document.createElementNS(svg.namespaceURI, "path"); path.setAttribute("d", "M5 12l7-7 7 7h-4v7H9v-7H5z"); path.setAttribute("fill", "currentColor"); svg.appendChild(path); figura.replaceChildren(svg);
    return;
  }
  if (simbolo === "incidencia") {
    Object.assign(figura.style, {
      width: "0",
      height: "0",
      background: "transparent",
      borderLeft: "14px solid transparent",
      borderRight: "14px solid transparent",
      borderBottom: `25px solid ${color}`,
      borderTop: "0",
      boxShadow: COLOR_MAPA.pinSombra
    });
    figura.textContent = "";
    return;
  }
  if (simbolo === "emergencia") {
    Object.assign(figura.style, { borderRadius: "9999px", borderColor: color, color });
    figura.textContent = "!";
    return;
  }
  Object.assign(figura.style, { borderRadius: "9999px", borderStyle: "dashed", borderColor: color, color });
  figura.textContent = "";
}

export function textoEstadoConexionMapa(estado: EstadoConexionMapa) {
  if (estado === "datos_en_vivo") return "Datos en vivo";
  if (estado === "actualizando") return "Actualizando";
  if (estado === "reconectando") return "Reconectando";
  if (estado === "desactualizado") return "Datos posiblemente desactualizados";
  return "Sin conexión";
}

export function estadoGpsMapa(estadoConexion: EstadoConexionMapa, sinSenal: number, ubicacionAntigua: number) {
  if (estadoConexion === "sin_conexion" || sinSenal > 0) {
    return { etiqueta: "GPS sin señal", clase: "border-ui-danger/30 bg-ui-danger-soft text-ui-danger" };
  }
  if (estadoConexion === "desactualizado" || ubicacionAntigua > 0) {
    return { etiqueta: "GPS por expirar", clase: "border-ui-warning/35 bg-ui-warning-soft text-ui-warning" };
  }
  return { etiqueta: "GPS activo", clase: "border-ui-success/30 bg-ui-success-soft text-ui-success" };
}

export function claseEstadoConexion(estado: EstadoConexionMapa) {
  if (estado === "datos_en_vivo") return "border-ui-success/30 bg-ui-success-soft text-ui-success";
  if (estado === "actualizando" || estado === "reconectando") return "border-ui-brand/30 bg-ui-brand-soft text-ui-brand-soft-fg";
  if (estado === "desactualizado") return "border-ui-warning/35 bg-ui-warning-soft text-ui-warning";
  return "border-ui-danger/30 bg-ui-danger-soft text-ui-danger";
}

export function claseTarjetaPrioridadMapa(prioridad: CategoriaPrioridadMapa) {
  if (prioridad === "emergencia" || prioridad === "incidencia_critica") return "border-ui-danger/25 bg-ui-danger-soft";
  if (prioridad === "sla_vencido" || prioridad === "sin_senal" || prioridad === "desviacion" || prioridad === "en_riesgo") return "border-ui-warning/30 bg-ui-warning-soft";
  return "border-ui-success/25 bg-ui-success-soft";
}

function escaparHtml(valor: string) {
  return valor
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function progresoEstimado(traslado: TrasladoMapa) {
  if (traslado.estado === "traslado_en_curso") return "50% estimado por etapa";
  if (traslado.estado === "llegada_a_destino" || traslado.estado === "evidencia_final_en_proceso" || traslado.estado === "evidencia_final_completada") return "85% estimado por etapa";
  if (traslado.estado === "entrega_confirmada" || traslado.estado === "pago_completado") return "100%";
  return "Pendiente de avance GPS";
}

export function htmlPopoverVehiculo(traslado: TrasladoMapa, calidad: ReturnType<typeof calidadUbicacion>) {
  const vehiculo = escaparHtml(`${traslado.vehiculo_marca ?? "Vehículo"} ${traslado.vehiculo_modelo ?? ""}`.trim());
  const conductor = escaparHtml(traslado.conductor_nombre ?? "Sin conductor asignado");
  const ruta = escaparHtml(`${traslado.origen_ciudad} → ${traslado.destino_ciudad}`);
  const gps = escaparHtml(`${calidad.estadoTexto}. ${calidad.tiempoTexto}`);
  const progreso = escaparHtml(progresoEstimado(traslado));
  return `
    <div style="min-width:240px;font-family:Inter,system-ui,sans-serif;color:var(--ui-fg);background:var(--ui-card)">
      <p style="margin:0 0 4px;font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--ui-fg-muted)">Vehículo</p>
      <p style="margin:0;font-weight:700;font-size:.875rem">${vehiculo}</p>
      <p style="margin:8px 0 0;font-size:.875rem">${conductor}</p>
      <p style="margin:6px 0 0;font-size:.75rem;color:var(--ui-fg-muted)">${ruta}</p>
      <p style="margin:6px 0 0;font-size:.75rem;color:var(--ui-fg-muted)">Progreso: ${progreso}</p>
      <p style="margin:6px 0 0;font-size:.75rem;color:var(--ui-fg-muted)">GPS: ${gps}</p>
      <p style="margin:6px 0 0;font-size:.75rem;color:var(--ui-fg-muted)">La línea sólida indica ruta Mapbox; la punteada indica aproximación.</p>
      <div style="display:flex;gap:8px;margin-top:12px">
        <a href="/viajes/${encodeURIComponent(traslado.traslado_id)}" style="border:1px solid var(--ui-brand);border-radius:.375rem;padding:10px 12px;min-height:44px;font-size:.75rem;font-weight:700;text-decoration:none;color:var(--ui-brand)">Ver traslado</a>
        <span title="El mapa aún no recibe teléfono del conductor" style="border:1px solid var(--ui-line);border-radius:.375rem;padding:10px 12px;min-height:44px;font-size:.75rem;font-weight:700;color:var(--ui-fg-muted)">Contactar conductor</span>
      </div>
    </div>
  `;
}

export function trasladoSinCoordenadas(traslado: TrasladoMapa) {
  return traslado.origen_lat === null || traslado.origen_lng === null || traslado.destino_lat === null || traslado.destino_lng === null;
}

function trasladoSinSenal(traslado: TrasladoMapa) {
  return calidadUbicacion(traslado, new Date()).estadoSenal === "sin_senal";
}

export function calidadUbicacion(traslado: TrasladoMapa, ahora: Date | null) {
  const gpsDisponible = traslado.conductor_lat !== null && traslado.conductor_lng !== null && traslado.gps_actualizado_en !== null;
  const minutos = minutosDesdeActualizacion(traslado.gps_actualizado_en ?? traslado.actualizado_en, ahora);
  const estadoSenal: EstadoSenalMapa = traslado.coordenadas_sensibles_protegidas
    ? "sin_ubicacion"
    : !gpsDisponible
    ? "sin_ubicacion"
    : minutos >= UMBRAL_SIN_SENAL_MIN
    ? "sin_senal"
    : minutos >= UMBRAL_UBICACION_ANTIGUA_MIN
    ? "antigua"
    : "confirmada";
  const ultimaPosicion = traslado.coordenadas_sensibles_protegidas
    ? "Coordenadas protegidas por rol"
    : gpsDisponible
      ? `${traslado.conductor_lat?.toFixed(5)}, ${traslado.conductor_lng?.toFixed(5)}`
      : "Sin GPS real reportado";
  return {
    minutos,
    estadoSenal,
    estadoTexto: etiquetaEstadoSenal(estadoSenal),
    estadoCorto: etiquetaEstadoSenalCorta(estadoSenal),
    tiempoTexto: textoTiempoUbicacion(minutos),
    fuente: traslado.gps_fuente ?? "No reportada",
    precision: traslado.gps_precision_m === null ? "No reportada" : `${Math.round(traslado.gps_precision_m)} m`,
    tipoPunto: gpsDisponible ? "GPS conductor" : traslado.coordenadas_sensibles_protegidas ? "Protegido por rol" : "No confirmado",
    ultimaPosicion,
    ultimoPuntoValido: traslado.gps_actualizado_en ? textoTiempoUbicacion(minutos) : "Sin punto válido"
  };
}

function minutosDesdeActualizacion(iso: string, ahora: Date | null) {
  const referencia = ahora ?? new Date();
  return Math.max(0, Math.floor((referencia.getTime() - new Date(iso).getTime()) / 60000));
}

function textoTiempoUbicacion(minutos: number) {
  if (minutos < 1) return "Actualizada ahora";
  if (minutos < 60) return `Actualizada hace ${minutos} min`;
  return `Actualizada hace ${Math.floor(minutos / 60)} h`;
}

function etiquetaEstadoSenal(estado: EstadoSenalMapa) {
  if (estado === "estimada") return "Ubicación estimada";
  if (estado === "antigua") return "Ubicación antigua";
  if (estado === "sin_senal") return "Sin señal";
  if (estado === "sin_ubicacion") return "Sin ubicación";
  return "Ubicación confirmada";
}

function etiquetaEstadoSenalCorta(estado: EstadoSenalMapa) {
  if (estado === "estimada") return "EST";
  if (estado === "antigua") return "ANT";
  if (estado === "sin_senal") return "SIN";
  if (estado === "sin_ubicacion") return "S/U";
  return "OK";
}

export function claseCalidadUbicacion(estado: EstadoSenalMapa) {
  if (estado === "confirmada") return "bg-ui-success-soft text-ui-success";
  if (estado === "estimada") return "bg-ui-warning-soft text-ui-warning";
  if (estado === "antigua" || estado === "sin_senal") return "bg-ui-warning-soft text-ui-warning";
  return "bg-ui-danger-soft text-ui-danger";
}

export function prioridadMapa(traslado: TrasladoMapa, ahora: Date | null): CategoriaPrioridadMapa {
  const calidad = calidadUbicacion(traslado, ahora);
  if (esEmergenciaMapa(traslado)) return "emergencia";
  if (traslado.tiene_incidencia_abierta) return "incidencia_critica";
  if (calidad.estadoSenal === "sin_senal" || calidad.estadoSenal === "sin_ubicacion") return "sin_senal";
  if (calidad.estadoSenal === "antigua") return "en_riesgo";
  return "normal";
}

export function compararPrioridadMapa(a: TrasladoMapa, b: TrasladoMapa, orden: CategoriaPrioridadMapa[], ahora: Date | null) {
  const prioridadA = prioridadMapa(a, ahora);
  const prioridadB = prioridadMapa(b, ahora);
  const indiceA = orden.indexOf(prioridadA);
  const indiceB = orden.indexOf(prioridadB);
  if (indiceA !== indiceB) return indiceA - indiceB;
  return new Date(a.actualizado_en).getTime() - new Date(b.actualizado_en).getTime();
}

export function clasePrioridadMapa(prioridad: CategoriaPrioridadMapa) {
  if (prioridad === "emergencia" || prioridad === "incidencia_critica") return "bg-ui-danger-soft text-ui-danger";
  if (prioridad === "sla_vencido" || prioridad === "sin_senal" || prioridad === "desviacion" || prioridad === "en_riesgo") return "bg-ui-warning-soft text-ui-warning";
  return "bg-ui-success-soft text-ui-success";
}

export function esEmergenciaMapa(traslado: TrasladoMapa) {
  return traslado.estado === "incidencia_reportada" && traslado.tiene_incidencia_abierta;
}

export function puntoMedio(origen: [number, number], destino: [number, number]): [number, number] {
  return [(origen[0] + destino[0]) / 2, (origen[1] + destino[1]) / 2];
}

export function puntoConductor(traslado: TrasladoMapa): [number, number] | null {
  if (traslado.conductor_lat === null || traslado.conductor_lng === null) return null;
  return [traslado.conductor_lng, traslado.conductor_lat];
}

export function puntoConOffset(punto: [number, number], offset: number): [number, number] {
  return [punto[0] + offset, punto[1] + offset];
}

export function textoActualizadoHace(fecha: Date, ahora: Date | null) {
  const referencia = ahora ?? new Date();
  const segundos = Math.max(0, Math.floor((referencia.getTime() - fecha.getTime()) / 1000));
  if (segundos < 60) return `Actualizado hace ${segundos} segundos`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `Actualizado hace ${minutos} minutos`;
  const horas = Math.floor(minutos / 60);
  return `Actualizado hace ${horas} horas`;
}
