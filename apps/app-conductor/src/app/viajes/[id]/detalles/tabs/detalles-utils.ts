export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  }).format(valor);
}

export function limpiarTelefono(tel?: string | null): string {
  if (!tel) return "";
  const digits = tel.replace(/\D/g, "");
  return digits.length === 10 ? `52${digits}` : digits;
}

export function enlaceTel(tel?: string | null): string {
  if (!tel) return "#";
  const digits = tel.replace(/\D/g, "");
  return `tel:${digits}`;
}

export function enlaceWhatsApp(tel?: string | null, mensaje?: string): string {
  const clean = limpiarTelefono(tel);
  if (!clean) return "#";
  const url = `https://wa.me/${clean}`;
  return mensaje ? `${url}?text=${encodeURIComponent(mensaje)}` : url;
}

export function copiarTexto(texto: string): void {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    void navigator.clipboard.writeText(texto);
  }
}
