export type PeriodoReporte = "hoy" | "semana" | "mes" | "personalizado";
export type ModoReporte = "operacion" | "finanzas";
export type EstadoMetrica = "neutral" | "ok" | "atencion" | "critico" | "desconectado";

export type ExportacionRealizada = {
  recurso: string;
  fecha: string;
  rango: string;
  hash: string;
  traceId: string;
};

export const FILTROS_PERIODO: Array<{ id: PeriodoReporte; etiqueta: string }> = [
  { id: "hoy", etiqueta: "Hoy" },
  { id: "semana", etiqueta: "Semana" },
  { id: "mes", etiqueta: "Mes" },
  { id: "personalizado", etiqueta: "Personalizado" }
];

export const FILTROS_ZONA = ["Todas", "Centro", "Norte", "Poniente", "Foránea"];
export const FILTROS_SERVICIO = ["Todos", "Ligero A", "Ligero B", "Plataforma", "Empresarial"];

export const RESUMEN_EJECUTIVO = [
  {
    titulo: "Traslados esta semana",
    valor: "Sin datos aún",
    definicion: "Total de traslados creados en el periodo global seleccionado.",
    detalle: "Cuando el motor esté activo podrás filtrar por zona, tipo de servicio y periodo.",
    estado: "desconectado" as EstadoMetrica,
    href: "/viajes"
  },
  {
    titulo: "Incidencias abiertas",
    valor: "Sin datos aún",
    definicion: "Incidencias sin resolución operativa al corte del reporte.",
    detalle: "Abrirá el detalle de incidencias filtradas por estado abierto.",
    estado: "desconectado" as EstadoMetrica,
    href: "/incidencias"
  },
  {
    titulo: "Pendiente de cobro",
    valor: "Sin datos aún",
    definicion: "Monto estimado de pagos de usuarios pendientes por liquidar.",
    detalle: "Se mostrará en MXN con separadores de miles cuando exista información financiera real.",
    estado: "desconectado" as EstadoMetrica,
    href: "/pagos?filtro=pendientes"
  }
];

export const GRUPOS_REPORTE = [
  {
    categoria: "Operación",
    pregunta: "¿Qué está pasando en la operación hoy?",
    columnas: [
      { titulo: "Traslados por día / semana / zona", valor: "En conexión...", estado: "desconectado" as EstadoMetrica, formato: "Serie temporal" },
      { titulo: "Tiempo promedio de asignación", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "min:s" },
      { titulo: "Tiempo promedio de traslado", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "h min" },
      { titulo: "Cancelaciones", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "Eventos" },
      { titulo: "Incidencias", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "Abiertas / cerradas" }
    ]
  },
  {
    categoria: "Finanzas",
    pregunta: "¿Qué falta cobrar, pagar o revisar?",
    columnas: [
      { titulo: "Ingresos por periodo", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "MXN" },
      { titulo: "Pagos a conductores", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "MXN" },
      { titulo: "Gastos autorizados", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "MXN" },
      { titulo: "Margen estimado", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "%" },
      { titulo: "Traslados pendientes de cobro", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "MXN" },
      { titulo: "Pagos pendientes", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "Conteo / monto" }
    ]
  },
  {
    categoria: "Conductores",
    pregunta: "¿Cómo está respondiendo la red de conductores?",
    columnas: [
      { titulo: "Traslados realizados", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "Conteo" },
      { titulo: "Calificación", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "Promedio" },
      { titulo: "Incidencias por conductor", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "Eventos" },
      { titulo: "Disponibilidad", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "%" },
      { titulo: "Ganancias", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "MXN" },
      { titulo: "Documentos vencidos", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "Conteo" }
    ]
  },
  {
    categoria: "Cuentas empresariales",
    pregunta: "¿Qué clientes corporativos requieren seguimiento?",
    columnas: [
      { titulo: "Traslados solicitados", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "Conteo" },
      { titulo: "Frecuencia de uso", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "Semanal / mensual" },
      { titulo: "Tipo de servicio", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "Distribución" },
      { titulo: "Facturación", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "MXN" },
      { titulo: "Incidencias", valor: "Sin datos aún", estado: "desconectado" as EstadoMetrica, formato: "Eventos" }
    ]
  }
];

export const EXPORTACIONES = [
  {
    recurso: "Pagos",
    descripcion: "Cobros de usuarios, estado de liquidación y folios relacionados.",
    href: "/api/exportaciones/pagos",
    disponible: true
  },
  {
    recurso: "Traslados",
    descripcion: "Folio, estado operativo, ruta, tiempos y responsable.",
    href: "/viajes",
    disponible: false
  },
  {
    recurso: "Conductores",
    descripcion: "Disponibilidad, documentación y desempeño operativo.",
    href: "/conductores",
    disponible: false
  },
  {
    recurso: "Empresas",
    descripcion: "Cuentas corporativas, facturación y uso del servicio.",
    href: "/empresas",
    disponible: false
  }
];
