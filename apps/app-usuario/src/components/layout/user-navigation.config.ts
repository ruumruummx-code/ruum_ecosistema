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
  etiqueta: string;
  href: string;
  icono: IconoNavegacion;
  /** Palabras adicionales para el buscador global. */
  palabrasClave?: string[];
  /** `false` = no existe una ruta real todavía; se muestra deshabilitado. */
  disponible?: boolean;
  /** Mayor prioridad gana cuando dos opciones coinciden con la misma ruta. */
  prioridad: number;
  coincide: (ruta: string, parametros: ParametrosBusqueda) => boolean;
}

function enRuta(ruta: string, base: string): boolean {
  return ruta === base || ruta.startsWith(`${base}/`);
}

/**
 * Configuración central del menú de escritorio del usuario.
 *
 * Reglas:
 * - Solo se incluyen rutas que existen hoy en `apps/app-usuario/src/app`.
 * - "Mis ubicaciones" se muestra deshabilitado: todavía no existe una ruta de
 *   usuario para ubicaciones (solo `packages/api/src/tracking/ubicaciones.ts`),
 *   así que no se inventa una URL.
 * - "Mi perfil" usa la opción parametrizada real `/cuenta?seccion=perfil`, que
 *   también resuelve el estado activo dentro de la ruta `/cuenta`.
 */
export const NAVEGACION_USUARIO: ItemNavegacionUsuario[] = [
  {
    id: "inicio",
    etiqueta: "Inicio",
    href: "/",
    icono: IconoInicio,
    palabrasClave: ["home", "panel", "dashboard"],
    prioridad: 30,
    coincide: (ruta) => ruta === "/",
  },
  {
    id: "traslados",
    etiqueta: "Mis traslados",
    href: "/mis-viajes",
    icono: IconoTraslados,
    palabrasClave: ["viajes", "traslado", "pasaporte", "historial", "seguimiento", "nuevo traslado"],
    prioridad: 40,
    coincide: (ruta) =>
      enRuta(ruta, "/mis-viajes") ||
      enRuta(ruta, "/pasaporte") ||
      (enRuta(ruta, "/viajes") && !enRuta(ruta, "/viajes/masivo")),
  },
  {
    id: "vehiculos",
    etiqueta: "Mis vehículos",
    href: "/cuenta/vehiculos",
    icono: IconoVehiculos,
    palabrasClave: ["vehiculo", "auto", "coche", "placas", "marca", "modelo"],
    prioridad: 50,
    coincide: (ruta) => enRuta(ruta, "/cuenta/vehiculos"),
  },
  {
    id: "ubicaciones",
    etiqueta: "Mis ubicaciones",
    href: "#",
    icono: IconoUbicaciones,
    palabrasClave: ["ubicacion", "direcciones", "domicilios", "mapa"],
    disponible: false,
    prioridad: 50,
    coincide: () => false,
  },
  {
    id: "carga-masiva",
    etiqueta: "Carga Masiva",
    href: "/viajes/masivo",
    icono: IconoCargaMasiva,
    palabrasClave: ["carga", "masiva", "excel", "xlsx", "archivo", "lote"],
    prioridad: 60,
    coincide: (ruta) => enRuta(ruta, "/viajes/masivo"),
  },
  {
    id: "cuenta",
    etiqueta: "Mi cuenta",
    href: "/cuenta",
    icono: IconoCuenta,
    palabrasClave: ["cuenta", "facturacion", "pagos", "documentos", "seguridad", "contrasena"],
    prioridad: 10,
    coincide: (ruta, parametros) =>
      ruta === "/cuenta" && !parametros.get("seccion") ||
      (enRuta(ruta, "/cuenta") &&
        !enRuta(ruta, "/cuenta/vehiculos") &&
        !enRuta(ruta, "/cuenta/preferencias") &&
        !enRuta(ruta, "/cuenta/datos-personales")),
  },
  {
    id: "perfil",
    etiqueta: "Mi perfil",
    href: "/cuenta?seccion=perfil",
    icono: IconoPerfil,
    palabrasClave: ["perfil", "datos personales", "correo", "telefono", "nombre"],
    prioridad: 70,
    coincide: (ruta, parametros) =>
      (ruta === "/cuenta" && parametros.get("seccion") === "perfil") ||
      enRuta(ruta, "/cuenta/datos-personales"),
  },
  {
    id: "preferencias",
    etiqueta: "Mis preferencias",
    href: "/cuenta/preferencias",
    icono: IconoPreferencias,
    palabrasClave: ["preferencias", "notificaciones", "apariencia", "tema", "idioma"],
    prioridad: 70,
    coincide: (ruta) => enRuta(ruta, "/cuenta/preferencias") || enRuta(ruta, "/preferencias"),
  },
  {
    id: "ayuda",
    etiqueta: "Ayuda",
    href: "/soporte",
    icono: IconoAyuda,
    palabrasClave: ["ayuda", "soporte", "contacto", "preguntas frecuentes", "faq"],
    prioridad: 40,
    coincide: (ruta) =>
      enRuta(ruta, "/soporte") ||
      enRuta(ruta, "/preguntas-frecuentes") ||
      enRuta(ruta, "/cuenta/preguntas-frecuentes"),
  },
];

export const ITEMS_NAVEGACION_VISIBLES = NAVEGACION_USUARIO.filter((item) => item.disponible !== false);

/** Devuelve el id del item activo (una sola opción activa, la más específica). */
export function obtenerItemActivo(
  ruta: string,
  parametros: ParametrosBusqueda
): string | null {
  let activo: ItemNavegacionUsuario | null = null;

  for (const item of NAVEGACION_USUARIO) {
    if (item.disponible === false || !item.coincide(ruta, parametros)) continue;
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
    const texto = normalizar([item.etiqueta, ...(item.palabrasClave ?? [])].join(" "));
    return texto.includes(q);
  }).slice(0, 5);
}

/** Ruta real del listado de traslados, con el término de búsqueda aplicado. */
export function hrefBusquedaTraslados(termino: string): string {
  return `/mis-viajes?buscar=${encodeURIComponent(termino.trim())}`;
}
