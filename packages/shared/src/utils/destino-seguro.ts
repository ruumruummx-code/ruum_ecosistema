/**
 * Sanitización de destinos de redirección (open redirect).
 *
 * Un `Location` compuesto como `${origin}${next}` es vulnerable a open redirect si
 * `next` puede convertirse en una URL absoluta. El guard clásico
 * `startsWith("/") && !startsWith("//")` NO alcanza porque el parser WHATWG
 * normaliza la barra invertida a barra: `https://app/\evil.com` se resuelve
 * como `https://evil.com/` en Chrome, Firefox y Safari.
 *
 * Regla aplicada: solo rutas internas que empiezan por `/`, sin `//` inicial,
 * sin `\`, sin espacios y sin saltos de línea (header injection).
 */

/** Devuelve `next` si es una ruta interna segura; `"/"` en caso contrario. */
export function destinoSeguro(next: string | null | undefined, porDefecto = "/"): string {
  if (typeof next !== "string") return porDefecto;
  if (next.length === 0) return porDefecto;
  // Sin backslash: el parser WHATWG lo normaliza a "/"
  if (next.includes("\\")) return porDefecto;
  // Control chars / CR / LF rompen la cabecera Location
  if (/[\r\n\t]/.test(next)) return porDefecto;
  // Debe ser ruta absoluta interna: empieza por "/" pero no por "//"
  if (!next.startsWith("/") || next.startsWith("//")) return porDefecto;
  return next;
}