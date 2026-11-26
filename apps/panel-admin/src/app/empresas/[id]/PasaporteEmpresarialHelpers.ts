import type { Database } from "@ruum/shared/types";
import type { DatosEmpresasAdmin } from "@ruum/api/services";

export type Empresa = Database["public"]["Tables"]["empresas"]["Row"];
export type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
export type Vehiculo = Database["public"]["Tables"]["vehiculos"]["Row"];
export type Conductor = Database["public"]["Tables"]["conductores"]["Row"];
export type Traslado = Database["public"]["Tables"]["traslados"]["Row"];
export type Documento = Database["public"]["Tables"]["empresas_documentos"]["Row"];
export type VersionFiscal = Database["public"]["Tables"]["empresas_datos_fiscales_versiones"]["Row"];
export type VersionCondiciones = Database["public"]["Tables"]["empresas_condiciones_comerciales_versiones"]["Row"];
export type CambioSensible = Database["public"]["Tables"]["empresas_cambios_sensibles"]["Row"];
export type TabPasaporte = "control" | "flota" | "rutas" | "traslados" | "expediente";
export type TonoBadge = "neutral" | "info" | "success" | "warning" | "danger";

export const DATOS_VACIOS: DatosEmpresasAdmin = {
  empresas: [],
  usuarios: [],
  traslados: [],
  vehiculos: [],
  conductores: [],
  documentos: [],
  versionesFiscales: [],
  versionesCondiciones: [],
  cambiosSensibles: []
};

export const TABS: Array<{ value: TabPasaporte; label: string }> = [
  { value: "control", label: "Control" },
  { value: "flota", label: "Flota y conductores" },
  { value: "rutas", label: "Origen y destino" },
  { value: "traslados", label: "Traslados" },
  { value: "expediente", label: "Expediente" }
];

export const ESTADOS_TERMINALES = new Set<string>(["servicio_cerrado", "servicio_cancelado", "traslado_fallido"]);

export function normalizar(valor: string) {
  return valor.trim().toUpperCase().replace(/\s+/g, " ");
}

export function etiqueta(valor?: string | null) {
  if (!valor) return "Pendiente";
  return valor.replace(/_/g, " ").replace(/\b\w/g, (letra) => letra.toUpperCase());
}

export function moneda(valor?: number | null) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(
    Number(valor ?? 0)
  );
}

export function fecha(valor?: string | null) {
  if (!valor) return "Sin fecha";
  const fechaDato = new Date(valor);
  if (Number.isNaN(fechaDato.getTime())) return "Sin fecha valida";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(fechaDato);
}

export function periodo(inicio?: string | null, fin?: string | null) {
  if (!inicio && !fin) return "Sin vigencia";
  return `${inicio ? fecha(inicio) : "Sin inicio"} - ${fin ? fecha(fin) : "Sin fin"}`;
}

export function tonoVerificacion(estado?: string | null): TonoBadge {
  if (estado === "verificado" || estado === "aprobado") return "success";
  if (estado === "rechazado" || estado === "suspendido") return "danger";
  if (estado === "en_revision" || estado === "pendiente") return "warning";
  return "neutral";
}

export function tonoEstadoEmpresa(estado?: string | null): TonoBadge {
  if (estado === "activa") return "success";
  if (estado === "suspendida") return "danger";
  if (estado === "en_revision" || estado === "pendiente") return "warning";
  return "neutral";
}

export function tonoDocumento(estado?: string | null): TonoBadge {
  if (estado === "validado" || estado === "aprobado" || estado === "vigente") return "success";
  if (estado === "rechazado" || estado === "vencido") return "danger";
  if (estado === "pendiente" || estado === "en_revision") return "warning";
  return "neutral";
}

export function construirAlertas(
  empresa: Empresa,
  usuarios: Usuario[],
  vehiculos: Vehiculo[],
  conductores: Conductor[],
  traslados: Traslado[],
  documentos: Documento[],
  cambios: CambioSensible[]
) {
  const alertas: string[] = [];
  if (empresa.estado_operativo === "suspendida") {
    alertas.push("Empresa suspendida: revisar motivo y autorizacion antes de operar nuevos traslados.");
  }
  if (!empresa.rfc) alertas.push("RFC pendiente: el expediente fiscal no esta completo.");
  if (usuarios.length === 0) alertas.push("No hay usuarios corporativos vinculados.");
  if (vehiculos.length === 0) alertas.push("No hay vehiculos corporativos vinculados.");
  if (conductores.length === 0) alertas.push("No hay conductores corporativos vinculados.");
  if (documentos.length === 0) alertas.push("No hay documentos empresariales cargados.");
  if (Number(empresa.credito_disponible_mxn ?? 0) <= 0 && Number(empresa.limite_credito_mxn ?? 0) > 0) {
    alertas.push("Credito disponible agotado.");
  }
  if (traslados.some((traslado) => traslado.tiene_incidencia_abierta)) {
    alertas.push("Existen traslados con incidencia abierta.");
  }
  if (cambios.some((cambio) => cambio.estado === "pendiente")) {
    alertas.push("Hay cambios sensibles pendientes de autorizacion.");
  }
  return alertas;
}

export function agruparLugares(traslados: Traslado[], tipo: "origen" | "destino") {
  const mapa = new Map<
    string,
    {
      ciudad: string;
      direccion: string;
      referencias: string | null;
      contacto: string;
      telefono: string;
      lat: number | null;
      lng: number | null;
      total: number;
      ultimo: string;
    }
  >();
  for (const traslado of traslados) {
    const ciudad = tipo === "origen" ? traslado.origen_ciudad : traslado.destino_ciudad;
    const direccion = tipo === "origen" ? traslado.origen_direccion : traslado.destino_direccion;
    const referencias = tipo === "origen" ? traslado.origen_referencias : traslado.destino_referencias;
    const contacto = tipo === "origen" ? traslado.contacto_entrega_nombre : traslado.contacto_recepcion_nombre;
    const telefono = tipo === "origen" ? traslado.contacto_entrega_telefono : traslado.contacto_recepcion_telefono;
    const lat = tipo === "origen" ? traslado.origen_lat : traslado.destino_lat;
    const lng = tipo === "origen" ? traslado.origen_lng : traslado.destino_lng;
    const key = `${normalizar(ciudad)}|${normalizar(direccion)}|${normalizar(referencias ?? "")}`;
    const previo = mapa.get(key);
    if (previo) {
      previo.total += 1;
      if (Date.parse(traslado.creado_en) > Date.parse(previo.ultimo)) previo.ultimo = traslado.creado_en;
    } else {
      mapa.set(key, { ciudad, direccion, referencias, contacto, telefono, lat, lng, total: 1, ultimo: traslado.creado_en });
    }
  }
  return Array.from(mapa.values()).sort((a, b) => b.total - a.total || Date.parse(b.ultimo) - Date.parse(a.ultimo));
}

export function prepararPasaporte(datos: DatosEmpresasAdmin, empresaId: string) {
  const empresa = datos.empresas.find((item) => item.id === empresaId);
  if (!empresa) return null;
  const usuarios = datos.usuarios.filter((usuario) => usuario.empresa_id === empresa.id);
  const vehiculos = datos.vehiculos.filter((vehiculo) => vehiculo.empresa_id === empresa.id);
  const conductores = datos.conductores.filter((conductor) => conductor.empresa_id === empresa.id);
  const documentos = datos.documentos.filter((documento) => documento.empresa_id === empresa.id);
  const versionesFiscales = datos.versionesFiscales.filter((version) => version.empresa_id === empresa.id);
  const versionesCondiciones = datos.versionesCondiciones.filter((version) => version.empresa_id === empresa.id);
  const cambiosSensibles = datos.cambiosSensibles.filter((cambio) => cambio.empresa_id === empresa.id);
  const usuarioIds = new Set(usuarios.map((usuario) => usuario.id));
  const vehiculoIds = new Set(vehiculos.map((vehiculo) => vehiculo.id));
  const conductorIds = new Set(conductores.map((conductor) => conductor.id));
  const traslados = datos.traslados
    .filter(
      (traslado) =>
        usuarioIds.has(traslado.usuario_id) ||
        vehiculoIds.has(traslado.vehiculo_id) ||
        Boolean(traslado.conductor_id && conductorIds.has(traslado.conductor_id))
    )
    .sort((a, b) => Date.parse(b.creado_en) - Date.parse(a.creado_en));
  const trasladosActivos = traslados.filter((traslado) => !ESTADOS_TERMINALES.has(traslado.estado));
  const alertas = construirAlertas(empresa, usuarios, vehiculos, conductores, traslados, documentos, cambiosSensibles);
  return {
    empresa,
    usuarios,
    vehiculos,
    conductores,
    documentos,
    versionesFiscales,
    versionesCondiciones,
    cambiosSensibles,
    traslados,
    trasladosActivos,
    origenes: agruparLugares(traslados, "origen"),
    destinos: agruparLugares(traslados, "destino"),
    alertas
  };
}

export function resumenControl(pasaporte: NonNullable<ReturnType<typeof prepararPasaporte>>) {
  return [
    {
      etiqueta: "Usuarios autorizados",
      valor: `${pasaporte.usuarios.length}`,
      tono: pasaporte.usuarios.length > 0 ? "success" : "warning"
    },
    {
      etiqueta: "Documentos empresariales",
      valor: `${pasaporte.documentos.length}`,
      tono: pasaporte.documentos.length > 0 ? "success" : "warning"
    },
    {
      etiqueta: "Cambios pendientes",
      valor: `${pasaporte.cambiosSensibles.filter((cambio) => cambio.estado === "pendiente").length}`,
      tono: pasaporte.cambiosSensibles.some((cambio) => cambio.estado === "pendiente") ? "warning" : "success"
    },
    {
      etiqueta: "Incidencias abiertas",
      valor: `${pasaporte.traslados.filter((traslado) => traslado.tiene_incidencia_abierta).length}`,
      tono: pasaporte.traslados.some((traslado) => traslado.tiene_incidencia_abierta) ? "danger" : "success"
    }
  ] satisfies Array<{ etiqueta: string; valor: string; tono: TonoBadge }>;
}
