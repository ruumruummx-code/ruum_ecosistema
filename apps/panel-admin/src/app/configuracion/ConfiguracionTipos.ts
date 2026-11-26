import type { RolAdminOperativo } from "../../lib/roles-admin";
import type { ConfiguracionAdmin } from "@ruum/api/services";

export type Resultado = { tipo: "success" | "error"; mensaje: string } | null;
export type AccionCapacidad = "conceder" | "revocar";
export type PestañaConfiguracion = "roles" | "normativa";
export type JsonObject = Record<string, unknown>;

export type NuevoAdminPanel = {
  nombre: string;
  correo: string;
  rol: RolAdminOperativo;
  motivo: string;
};

export const CATEGORIAS: Record<string, string> = {
  operacion: "Operación",
  comunicacion: "Comunicación",
  finanzas: "Finanzas",
  seguridad: "Seguridad"
};

export const ORDEN_CATEGORIAS = ["operacion", "finanzas", "comunicacion", "seguridad"] as const;
export const CATEGORIAS_CAPACIDAD = ["Operación", "Conductores", "Empresas", "Finanzas", "Seguridad", "Configuración"] as const;

export function formatearFecha(valor: string) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(valor));
}

export function resumenValor(valor: unknown) {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return "Sin parámetros";
  const cantidad = Object.keys(valor as Record<string, unknown>).length;
  return `${cantidad} ${cantidad === 1 ? "parámetro principal" : "parámetros principales"}`;
}

export function categoriaCapacidad(capacidad: string) {
  if (/conductores|documentos/i.test(capacidad)) return "Conductores";
  if (/empresas|usuarios/i.test(capacidad)) return "Empresas";
  if (/pagos|tarifas|finanzas|reclamos|disputas/i.test(capacidad)) return "Finanzas";
  if (/auditoria|aprobaciones|seguridad/i.test(capacidad)) return "Seguridad";
  if (/configuracion|capacidades/i.test(capacidad)) return "Configuración";
  return "Operación";
}

export function claseTipoCapacidad(capacidad: string) {
  if (/capacidades:administrar|configuracion:editar|auditoria|aprobaciones/i.test(capacidad)) return "border-ui-danger/35 text-ui-danger";
  if (/pagos|tarifas|reclamos|disputas/i.test(capacidad)) return "border-ui-warning/40 text-ui-warning";
  return "border-ui-brand/35 text-ui-brand-soft-fg";
}

export function estadoNorma(registro: ConfiguracionAdmin): { label: string; tone: "success" | "warning" | "danger" | "neutral" } {
  const dias = Math.floor((Date.now() - new Date(registro.actualizada_en).getTime()) / 86_400_000);
  if (dias > 180) return { label: "Desactualizada", tone: "danger" };
  if (dias > 90) return { label: "Pendiente de revisión", tone: "warning" };
  return { label: "Vigente", tone: "success" };
}

export function parsearConfig(json: string): JsonObject | null {
  try {
    const valor = JSON.parse(json) as unknown;
    return objeto(valor);
  } catch {
    return null;
  }
}

export function objeto(valor: unknown): JsonObject {
  return valor && typeof valor === "object" && !Array.isArray(valor) ? (valor as JsonObject) : {};
}

export function texto(valor: unknown, fallback = "") {
  return typeof valor === "string" ? valor : fallback;
}

export function numero(valor: unknown, fallback: number) {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : fallback;
}

export function booleano(valor: unknown, fallback = false) {
  return typeof valor === "boolean" ? valor : fallback;
}

export function lista(valor: unknown) {
  return Array.isArray(valor) ? valor.filter((item): item is string => typeof item === "string") : [];
}

export function lineas(valor: string) {
  return valor.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
}

export function zonas(config: JsonObject) {
  const valor = config.zonas;
  if (!Array.isArray(valor)) return [];
  return valor.map((item) => {
    const zona = objeto(item);
    return {
      codigo: texto(zona.codigo),
      nombre: texto(zona.nombre),
      activa: booleano(zona.activa, true)
    };
  }).filter((zona) => zona.codigo && zona.nombre);
}

export function parsearZonas(valor: string) {
  return valor.split(/\r?\n/).map((linea) => {
    const [codigo = "", nombre = "", estado = "activa"] = linea.split("|").map((parte) => parte.trim());
    return { codigo, nombre, activa: !/^inactiva|false|0$/i.test(estado) };
  }).filter((zona) => zona.codigo && zona.nombre);
}

export function setObjetoAnidado(base: JsonObject, cambiar: (siguiente: JsonObject) => void, ruta: string[], valor: unknown) {
  const [primero, segundo, tercero] = ruta;
  if (!primero || !segundo || !tercero) return;
  const nivel1 = objeto(base[primero]);
  const nivel2 = objeto(nivel1[segundo]);
  cambiar({ ...base, [primero]: { ...nivel1, [segundo]: { ...nivel2, [tercero]: valor } } });
}
