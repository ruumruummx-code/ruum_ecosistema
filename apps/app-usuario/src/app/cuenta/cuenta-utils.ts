export function iniciales(nombre: string | null | undefined) {
  if (!nombre) return "RR";
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}