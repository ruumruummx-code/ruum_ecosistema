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

const PARTICULAS_NOMBRE = new Set(["de", "del", "la", "las", "los", "y"]);

/** Formatea el nombre para la cuenta y conserva la grafía mixta ya ingresada. */
export function nombreVisibleCuenta(nombre?: string | null): string {
  return (nombre ?? "").trim().replace(/\s+/g, " ").split(" ").map((palabra, indice) => {
    const minusculas = palabra.toLocaleLowerCase("es-MX");
    if (indice > 0 && PARTICULAS_NOMBRE.has(minusculas)) return minusculas;
    if (palabra !== minusculas && palabra !== palabra.toLocaleUpperCase("es-MX")) return palabra;
    return minusculas.replace(/(^|[-’'])(\p{L})/gu, (_, separador: string, letra: string) =>
      separador + letra.toLocaleUpperCase("es-MX"),
    );
  }).join(" ");
}
