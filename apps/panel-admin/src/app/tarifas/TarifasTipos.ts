import type { ConfiguracionTarifas } from "@ruum/api/services";

export const ETIQUETA_CATEGORIA: Record<string, string> = {
  ligero_a: "Ligero A",
  ligero_b: "Ligero B",
  mediano: "Mediano",
  camion: "Camión"
};

export const ETIQUETA_RANGO: Record<string, string> = {
  rango_1: "Rango 1 · hasta 15 km",
  rango_2: "Rango 2 · 16-45 km",
  rango_3: "Rango 3 · 46-75 km",
  rango_4: "Rango 4 · más de 75 km"
};

export const ETIQUETA_ESTADO: Record<string, string> = {
  borrador: "Borrador",
  vigente: "Vigente",
  archivada: "Archivada"
};

export const SECCIONES_TARIFAS = [
  { id: "resumen", etiqueta: "Resumen" },
  { id: "base", etiqueta: "Tarifas base" },
  { id: "factores", etiqueta: "Factores" },
  { id: "simulador", etiqueta: "Simulador" },
  { id: "versiones", etiqueta: "Versiones" },
  { id: "auditoria", etiqueta: "Auditoría" }
] as const;

export type SeccionTarifas = (typeof SECCIONES_TARIFAS)[number]["id"];
export type SeccionParametrosTarifa = Extract<SeccionTarifas, "base" | "factores">;

export const VACIO: ConfiguracionTarifas = {
  vehiculo: [],
  gama: [],
  condicion: [],
  horario: [],
  dia: [],
  config: null,
  certificacionPago: [],
  adminActualizacion: null
};

export type CategoriaTarifa = ConfiguracionTarifas["vehiculo"][number]["categoria"];
export type GamaTarifa = ConfiguracionTarifas["gama"][number]["gama"];
export type CondicionTarifa = ConfiguracionTarifas["condicion"][number]["condicion"];
export type HorarioTarifa = ConfiguracionTarifas["horario"][number]["horario"];
export type DiaTarifa = ConfiguracionTarifas["dia"][number]["dia"];
export type TarifaVehiculoRow = ConfiguracionTarifas["vehiculo"][number];
export type TarifaConfigRow = NonNullable<ConfiguracionTarifas["config"]>;

export type BorradorTarifas = {
  vehiculo: Record<string, { base: string; porKm: string }>;
  gama: Record<string, string>;
  condicion: Record<string, string>;
  horario: Record<string, string>;
  dia: Record<string, string>;
  certificacion: Record<string, string>;
  config: { tarifaHora: string; topeFactorVariable: string };
};

export function formatoFecha(valor?: string | null) {
  if (!valor) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(valor));
}

export function fechaParaInput(valor?: string | null) {
  if (!valor) return "";
  const fecha = new Date(valor);
  const offset = fecha.getTimezoneOffset() * 60000;
  return new Date(fecha.getTime() - offset).toISOString().slice(0, 16);
}

export function fechaInputAIso(valor: string) {
  return new Date(valor).toISOString();
}

export function claseEstado(estado: string) {
  if (estado === "vigente") return "border-ui-success/30 bg-ui-success-soft text-ui-success";
  if (estado === "borrador") return "border-ui-focus/30 bg-ui-brand-soft text-ui-brand-soft-fg";
  return "border-ui-line bg-ui-muted text-ui-fg-muted";
}

export function crearBorradorTarifas(datos: ConfiguracionTarifas): BorradorTarifas {
  return {
    vehiculo: Object.fromEntries(datos.vehiculo.map((fila) => [fila.id, { base: String(fila.base), porKm: String(fila.por_km) }])),
    gama: Object.fromEntries(datos.gama.map((fila) => [fila.gama, String(fila.factor)])),
    condicion: Object.fromEntries(datos.condicion.map((fila) => [fila.condicion, String(fila.factor)])),
    horario: Object.fromEntries(datos.horario.map((fila) => [fila.horario, String(fila.factor)])),
    dia: Object.fromEntries(datos.dia.map((fila) => [fila.dia, String(fila.factor)])),
    certificacion: Object.fromEntries(datos.certificacionPago.map((fila) => [fila.certificacion, String(fila.porcentaje)])),
    config: {
      tarifaHora: String(datos.config?.tarifa_hora ?? ""),
      topeFactorVariable: String(datos.config?.tope_factor_variable ?? "")
    }
  };
}

export function numeroBorrador(valor: string, etiqueta: string) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) throw new Error(`${etiqueta} tiene un valor inválido.`);
  return numero;
}

export function configuracionDesdeBorrador(datos: ConfiguracionTarifas, borrador: BorradorTarifas): ConfiguracionTarifas {
  return {
    ...datos,
    vehiculo: datos.vehiculo.map((fila) => ({
      ...fila,
      base: Number(borrador.vehiculo[fila.id]?.base ?? fila.base),
      por_km: Number(borrador.vehiculo[fila.id]?.porKm ?? fila.por_km)
    })),
    gama: datos.gama.map((fila) => ({ ...fila, factor: Number(borrador.gama[fila.gama] ?? fila.factor) })),
    condicion: datos.condicion.map((fila) => ({ ...fila, factor: Number(borrador.condicion[fila.condicion] ?? fila.factor) })),
    horario: datos.horario.map((fila) => ({ ...fila, factor: Number(borrador.horario[fila.horario] ?? fila.factor) })),
    dia: datos.dia.map((fila) => ({ ...fila, factor: Number(borrador.dia[fila.dia] ?? fila.factor) })),
    certificacionPago: datos.certificacionPago.map((fila) => ({ ...fila, porcentaje: Number(borrador.certificacion[fila.certificacion] ?? fila.porcentaje) })),
    config: datos.config ? {
      ...datos.config,
      tarifa_hora: Number(borrador.config.tarifaHora),
      tope_factor_variable: Number(borrador.config.topeFactorVariable)
    } : datos.config
  };
}

export function cambiosVersion(datos: ConfiguracionTarifas, borrador: BorradorTarifas) {
  const cambios: Array<{ entidad: string; campo: string; vigente: number; propuesto: number; delta: number; porcentaje: number }> = [];
  const agregar = (entidad: string, campo: string, vigente: number, propuesto: number) => {
    if (!Number.isFinite(propuesto) || vigente === propuesto) return;
    cambios.push({
      entidad,
      campo,
      vigente,
      propuesto,
      delta: propuesto - vigente,
      porcentaje: vigente === 0 ? 0 : ((propuesto - vigente) / vigente) * 100
    });
  };

  for (const fila of datos.vehiculo) {
    agregar(`${ETIQUETA_CATEGORIA[fila.categoria] ?? fila.categoria} / ${ETIQUETA_RANGO[fila.rango] ?? fila.rango}`, "Base", fila.base, Number(borrador.vehiculo[fila.id]?.base));
    agregar(`${ETIQUETA_CATEGORIA[fila.categoria] ?? fila.categoria} / ${ETIQUETA_RANGO[fila.rango] ?? fila.rango}`, "$/km", fila.por_km, Number(borrador.vehiculo[fila.id]?.porKm));
  }
  for (const fila of datos.gama) agregar(`Gama ${fila.gama}`, "Factor", fila.factor, Number(borrador.gama[fila.gama]));
  for (const fila of datos.condicion) agregar(`Condición ${fila.condicion.replaceAll("_", " ")}`, "Factor", fila.factor, Number(borrador.condicion[fila.condicion]));
  for (const fila of datos.horario) agregar(`Horario ${fila.horario}`, "Factor", fila.factor, Number(borrador.horario[fila.horario]));
  for (const fila of datos.dia) agregar(`Día ${fila.dia.replaceAll("_", " ")}`, "Factor", fila.factor, Number(borrador.dia[fila.dia]));
  for (const fila of datos.certificacionPago) agregar(`Certificación ${fila.certificacion.replaceAll("_", " ")}`, "Pago conductor", fila.porcentaje, Number(borrador.certificacion[fila.certificacion]));
  if (datos.config) {
    agregar("Configuración general", "Tarifa por hora", datos.config.tarifa_hora, Number(borrador.config.tarifaHora));
    agregar("Configuración general", "Tope factor variable", datos.config.tope_factor_variable, Number(borrador.config.topeFactorVariable));
  }
  return cambios;
}
