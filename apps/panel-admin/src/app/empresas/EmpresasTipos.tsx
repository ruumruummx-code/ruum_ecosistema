import type { ReactNode } from "react";
import type { Database } from "@ruum/shared/types";
import type { DatosEmpresasAdmin } from "@ruum/api/services";

export type Empresa = Database["public"]["Tables"]["empresas"]["Row"];
export type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
export type EstadoVerificacion = Database["public"]["Enums"]["estado_verificacion"];
export type CambioSensible = Database["public"]["Tables"]["empresas_cambios_sensibles"]["Row"];
export type TabEmpresa = "resumen" | "fiscal" | "usuarios" | "documentos" | "riesgo";
export type EstadoConexionVista = "datos_en_vivo" | "actualizando" | "sin_conexion" | "demo";

export const DATOS_DEMO: DatosEmpresasAdmin = {
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

export const FORM_INICIAL = {
  nombre: "",
  rfc: "",
  razon_social: "",
  regimen_fiscal: "",
  codigo_postal_fiscal: "",
  uso_cfdi: "",
  correo_facturacion: "",
  condiciones_pago: "",
  limite_credito_mxn: "0",
  credito_disponible_mxn: "0",
  dias_credito: "0",
  requiere_orden_compra: false,
  titular_nombre: "",
  titular_telefono: "",
  titular_correo: "",
  metodo_pago_registrado: false
};

export const DOCUMENTO_INICIAL = {
  tipo: "contrato",
  nombre: "",
  folio: "",
  url: "",
  vigente_desde: "",
  vigente_hasta: "",
  notas: ""
};

export type UsuarioEmpresaForm = {
  rol: "titular_empresa" | "usuario_autorizado";
  nombre: string;
  telefono: string;
  correo_facturacion: string;
  metodo_pago_registrado: boolean;
};

export const USUARIO_INICIAL: UsuarioEmpresaForm = {
  rol: "usuario_autorizado",
  nombre: "",
  telefono: "",
  correo_facturacion: "",
  metodo_pago_registrado: false
};

export const ETIQUETA_ESTADO: Record<EstadoVerificacion, string> = {
  pendiente: "Pendiente",
  en_revision: "En revisión",
  verificado: "Aprobado",
  rechazado: "Rechazado"
};

export const TABS_EMPRESA: Array<{ id: TabEmpresa; etiqueta: string }> = [
  { id: "resumen", etiqueta: "Resumen y KPIs" },
  { id: "fiscal", etiqueta: "Fiscal y facturación" },
  { id: "usuarios", etiqueta: "Usuarios y permisos" },
  { id: "documentos", etiqueta: "Contratos y documentos" },
  { id: "riesgo", etiqueta: "Configuración de riesgo" }
];

export const RFC_MEXICO = /^([A-Z&Ñ]{3}|[A-Z&Ñ]{4})\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z0-9]{3}$/;
export const CORREO_BASICO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const REGIMENES_FISCALES = [
  "601 - General de Ley Personas Morales",
  "603 - Personas Morales con Fines no Lucrativos",
  "605 - Sueldos y Salarios e Ingresos Asimilados",
  "606 - Arrendamiento",
  "612 - Personas Físicas con Actividades Empresariales",
  "616 - Sin obligaciones fiscales",
  "626 - Régimen Simplificado de Confianza"
];
export const USOS_CFDI = [
  "G01 - Adquisición de mercancías",
  "G03 - Gastos en general",
  "I03 - Equipo de transporte",
  "P01 - Por definir"
];
export const CONDICIONES_PAGO = [
  "Contado",
  "Crédito 7 días",
  "Crédito 15 días",
  "Crédito 30 días",
  "Orden de compra"
];

export function soloNumeros(valor: string, max?: number) {
  const limpio = valor.replace(/\D/g, "");
  return typeof max === "number" ? limpio.slice(0, max) : limpio;
}

export function normalizarRfc(valor: string) {
  return valor.toUpperCase().replace(/[^A-Z0-9&Ñ]/g, "").slice(0, 13);
}

export function formatearTelefono(valor: string) {
  const digitos = soloNumeros(valor, 10);
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 3)}) ${digitos.slice(3)}`;
  return `(${digitos.slice(0, 3)}) ${digitos.slice(3, 6)}-${digitos.slice(6)}`;
}

export function fecha(fechaIso: string | null | undefined) {
  if (!fechaIso) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(fechaIso));
}

export function moneda(valor: number | null | undefined) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(valor ?? 0);
}

export function badgeEstado(estado: EstadoVerificacion | string) {
  if (estado === "verificado" || estado === "activa" || estado === "aprobado") return "border-ui-success/30 bg-ui-success-soft text-ui-success";
  if (estado === "rechazado" || estado === "suspendida") return "border-ui-danger/25 bg-ui-danger-soft text-ui-danger";
  return "border-ui-warning/40 bg-ui-warning-soft text-ui-warning";
}

export function Badge({ estado, texto }: { estado: EstadoVerificacion | string; texto?: string }) {
  return <span className={`rounded-full border px-3 py-1.5 font-body text-xs font-semibold ${badgeEstado(estado)}`}>{texto ?? ETIQUETA_ESTADO[estado as EstadoVerificacion] ?? estado}</span>;
}

export function textoEstadoOperativo(estado: string | null | undefined) {
  return estado === "suspendida" ? "Suspendida" : "Activa";
}

export function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | number | null | undefined }) {
  return (
    <div className="rounded-lg border border-ui-line bg-ui-muted px-3 py-3">
      <dt className="font-body text-xs font-medium text-ui-fg-muted">{etiqueta}</dt>
      <dd className="mt-1 truncate font-body text-sm font-semibold text-ui-fg" title={typeof valor === "string" ? valor : undefined}>{valor || "No registrado"}</dd>
    </div>
  );
}

export function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "number" | "date";
  min?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-body text-xs font-semibold text-ui-fg-muted">{label}</span>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 font-body text-sm text-ui-fg focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring"
        placeholder={placeholder}
      />
    </label>
  );
}

export function KpiEmpresa({ icono, etiqueta, valor, detalle }: { icono: string; etiqueta: string; valor: string; detalle?: string }) {
  return (
    <div className="rounded-lg border border-ui-line bg-ui-muted px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-8 place-items-center rounded-full bg-ui-muted font-body text-sm font-bold text-ui-fg-muted" aria-hidden="true">{icono}</span>
        <span className="font-mono-ruum text-xl font-semibold text-ui-fg">{valor}</span>
      </div>
      <p className="mt-2 font-body text-xs font-semibold text-ui-fg-muted">{etiqueta}</p>
      {detalle && <p className="mt-1 truncate font-body text-xs text-ui-fg-muted">{detalle}</p>}
    </div>
  );
}

export function agruparPor<T extends { empresa_id: string | null }>(filas: T[]) {
  const mapa = new Map<string, T[]>();
  for (const fila of filas) {
    if (!fila.empresa_id) continue;
    mapa.set(fila.empresa_id, [...(mapa.get(fila.empresa_id) ?? []), fila]);
  }
  return mapa;
}
