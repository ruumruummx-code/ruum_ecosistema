import { normalizarIdiomaPreferencias } from "./idioma-aplicacion";
type Cambios = Record<string, unknown>;
export type Pendientes = { general: Cambios; notificacion: Cambios };
export function leerPendientes(id: string): Pendientes {
  try {
    const dato = JSON.parse(localStorage.getItem(`ruum:preferencias-pendientes:${id}`) ?? "{}");
    const general = dato.general && typeof dato.general === "object" && !Array.isArray(dato.general) ? dato.general : {};
    const normalizadas = normalizarIdiomaPreferencias(general);
    const notificacion = dato.notificacion && typeof dato.notificacion === "object" && !Array.isArray(dato.notificacion) ? dato.notificacion : {};
    if (normalizadas !== general && general.idioma !== normalizadas.idioma) guardarPendientes(id, { general: normalizadas, notificacion });
    return { general: normalizadas, notificacion };
  } catch { return { general: {}, notificacion: {} }; }
}
export function guardarPendientes(id: string, pendientes: Pendientes) {
  try {
    const clave = `ruum:preferencias-pendientes:${id}`;
    if (Object.keys(pendientes.general).length || Object.keys(pendientes.notificacion).length) localStorage.setItem(clave, JSON.stringify({ ...pendientes, general: normalizarIdiomaPreferencias(pendientes.general) }));
    else localStorage.removeItem(clave);
  } catch { /* El editor conserva el reintento en memoria si el almacenamiento está restringido. */ }
}
const colas = new Map<string, Promise<void>>();
/** Serializa también las instancias que siguen guardando después de navegar. */
export function serializarPreferencias(id: string, trabajo: () => Promise<void>) {
  const tarea = (colas.get(id) ?? Promise.resolve()).then(trabajo);
  colas.set(id, tarea.catch(() => {}));
  return tarea;
}
