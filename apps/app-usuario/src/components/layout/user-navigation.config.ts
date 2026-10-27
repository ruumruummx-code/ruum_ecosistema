import type { ComponentType } from "react";
import {
  IconoAyuda,
  IconoCargaMasiva,
  IconoCuenta,
  IconoInicio,
  IconoPerfil,
  IconoPreferencias,
  IconoTraslados,
  IconoUbicaciones,
  IconoVehiculos,
} from "./user-navigation-icons";

export type IconoNavegacion = ComponentType<{ className?: string }>;

/** Parámetros de consulta usados para las opciones parametrizadas del menú. */
export type ParametrosBusqueda = {
  get(nombre: string): string | null;
};

export interface ItemNavegacionUsuario {
  id: string;
  label?: string;
  etiqueta: string;
  href: string;
  icono: IconoNavegacion;
  permission?: string;
  children?: ItemNavegacionUsuario[];
  /** Palabras adicionales para el buscador global. */
  palabrasClave?: string[];
  /** `false` = no existe una ruta real todavía; se muestra deshabilitado. */
  disponible?: boolean;
  /** Mayor prioridad gana cuando dos opciones coinciden con la misma ruta. */
  prioridad: number;
  coincide: (ruta: string, parametros: ParametrosBusqueda) => boolean;
}

export type NavItem = ItemNavegacionUsuario;

function enRuta(ruta: string, base: string): boolean {
  return ruta === base || ruta.startsWith(`${base}/`);
}

/**
 * Configuración central del menú de usuario (RR-UI-001).
 *
 * Mapea las 9 rutas autenticadas oficiales del alcance, incluyendo rutas canónicas
 * y rutas sugeridas / alias (/inicio, /traslados, /vehiculos, /ubicaciones, etc.).
 */
export const NAVEGACION_USUARIO: ItemNavegacionUsuario[] = [
  {
    id: "inicio",
    label: "Inicio",
    etiqueta: "Inicio",
    href: "/",
    icono: IconoInicio,
    palabrasClave: ["home", "panel", "dashboard", "inicio"],
    prioridad: 30,
    coincide: (ruta) => ruta === "/" || ruta === "/inicio",
  },
  {
    id: "traslados",
    label: "Mis traslados",
    etiqueta: "Mis traslados",
    href: "/mis-viajes",
    icono: IconoTraslados,
    palabrasClave: ["viajes", "traslados", "traslado", "pasaporte", "historial", "seguimiento", "nuevo traslado"],
    prioridad: 40,
    coincide: (ruta) =>
      enRuta(ruta, "/mis-viajes") ||
      enRuta(ruta, "/traslados") ||
      enRuta(ruta, "/pasaporte") ||
      (enRuta(ruta, "/viajes") && !enRuta(ruta, "/viajes/masivo")),
  },
  {
    id: "vehiculos",
    label: "Mis vehículos",
    etiqueta: "Mis vehículos",
    href: "/cuenta/vehiculos",
    icono: IconoVehiculos,
    palabrasClave: ["vehiculo", "vehiculos", "auto", "coche", "placas", "marca", "modelo"],
    prioridad: 50,
    coincide: (ruta) => enRuta(ruta, "/cuenta/vehiculos") || enRuta(ruta, "/vehiculos"),
  },
  {
    id: "ubicaciones",
    label: "Mis ubicaciones",
    etiqueta: "Mis ubicaciones",
    href: "/ubicaciones",
    icono: IconoUbicaciones,
    palabrasClave: ["ubicacion", "ubicaciones", "direcciones", "domicilios", "mapa", "origen", "destino"],
    disponible: true,
    prioridad: 50,
    coincide: (ruta) => enRuta(ruta, "/ubicaciones"),
  },
  {
    id: "carga-masiva",
    label: "Carga Masiva",
    etiqueta: "Carga Masiva",
    href: "/viajes/masivo",
    icono: IconoCargaMasiva,
    palabrasClave: ["carga", "masiva", "carga-masiva", "excel", "xlsx", "archivo", "lote"],
    prioridad: 60,
    coincide: (ruta) => enRuta(ruta, "/viajes/masivo") || enRuta(ruta, "/carga-masiva"),
  },
  {
    id: "cuenta",
    label: "Mi cuenta",
    etiqueta: "Mi cuenta",
    href: "/cuenta",
    icono: IconoCuenta,
    palabrasClave: ["cuenta", "facturacion", "pagos", "documentos", "seguridad", "contrasena"],
    prioridad: 10,
    coincide: (ruta, parametros) =>
      (ruta === "/cuenta" && !parametros.get("seccion")) ||
      (enRuta(ruta, "/cuenta") &&
        !enRuta(ruta, "/cuenta/vehiculos") &&
        !enRuta(ruta, "/cuenta/preferencias") &&
        !enRuta(ruta, "/cuenta/datos-personales")),
  },
  {
    id: "perfil",
    label: "Mi perfil",
    etiqueta: "Mi perfil",
    href: "/cuenta?seccion=perfil",
    icono: IconoPerfil,
    palabrasClave: ["perfil", "datos personales", "correo", "telefono", "nombre"],
    prioridad: 70,
    coincide: (ruta, parametros) =>
      enRuta(ruta, "/perfil") ||
      (ruta === "/cuenta" && parametros.get("seccion") === "perfil") ||
      enRuta(ruta, "/cuenta/datos-personales"),
  },
  {
    id: "preferencias",
    label: "Mis preferencias",
    etiqueta: "Mis preferencias",
    href: "/cuenta/preferencias",
    icono: IconoPreferencias,
    palabrasClave: ["preferencias", "notificaciones", "apariencia", "tema", "idioma"],
    prioridad: 70,
    coincide: (ruta) => enRuta(ruta, "/cuenta/preferencias") || enRuta(ruta, "/preferencias"),
  },
  {
    id: "ayuda",
    label: "Ayuda",
    etiqueta: "Ayuda",
    href: "/soporte",
    icono: IconoAyuda,
    palabrasClave: ["ayuda", "soporte", "contacto", "preguntas frecuentes", "faq"],
    prioridad: 40,
    coincide: (ruta) =>
      enRuta(ruta, "/ayuda") ||
      enRuta(ruta, "/soporte") ||
      enRuta(ruta, "/preguntas-frecuentes") ||
      enRuta(ruta, "/cuenta/preguntas-frecuentes"),
  },
];

export const ITEMS_NAVEGACION_VISIBLES = NAVEGACION_USUARIO.filter((item) => item.disponible !== false);

/** Devuelve el id del item activo (una sola opción activa, la más específica). */
export function obtenerItemActivo(
  ruta: string,
  parametros?: ParametrosBusqueda | null
): string | null {
  const params: ParametrosBusqueda = parametros ?? { get: () => null };
  let activo: ItemNavegacionUsuario | null = null;

  for (const item of NAVEGACION_USUARIO) {
    if (item.disponible === false || !item.coincide(ruta, params)) continue;
    if (!activo || item.prioridad > activo.prioridad) activo = item;
  }

  return activo?.id ?? null;
}

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Búsqueda real sobre los destinos navegables (no devuelve URLs inventadas). */
export function buscarDestinos(termino: string): ItemNavegacionUsuario[] {
  const q = normalizar(termino);
  if (!q) return [];

  return ITEMS_NAVEGACION_VISIBLES.filter((item) => {
    const texto = normalizar([item.etiqueta, item.label ?? "", ...(item.palabrasClave ?? [])].join(" "));
    return texto.includes(q);
  }).slice(0, 5);
}

/** Ruta real del listado de traslados, con el término de búsqueda aplicado. */
export function hrefBusquedaTraslados(termino: string): string {
  return `/mis-viajes?buscar=${encodeURIComponent(termino.trim())}`;
}
