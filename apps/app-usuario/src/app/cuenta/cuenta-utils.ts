/**
 * Iniciales para avatares (máx. 2 letras en mayúsculas).
 * Fuente única: antes vivía copiada en `viajes/[id]/page.tsx` (idéntica) y
 * en `ConductorAsignado.tsx` (idéntica salvo el respaldo). `respaldo`
 * conserva esos comportamientos sin duplicar la implementación.
 */
export function iniciales(nombre: string | null | undefined, respaldo = "RR") {
  if (!nombre) return respaldo;
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("") || respaldo;
}
