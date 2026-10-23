const allowed = new Set(["/cuenta", "/cuenta/legal", "/cuenta/documentos", "/cuenta/certificacion", "/cuenta/perfil", "/cuenta/datos-bancarios", "/login", "/registro"]);

export function accountReturnTarget(value: string | null, fallback: string, currentPath?: string) {
  if (!value?.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, "https://conductor.invalid");
    if (url.origin !== "https://conductor.invalid" || !allowed.has(url.pathname) || url.pathname === currentPath) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return fallback; }
}

export function accountReturnLabel(href: string) {
  const path = href.split(/[?#]/)[0];
  if (path === "/cuenta/legal") return "Volver a documentos legales";
  if (path === "/cuenta/certificacion") return "Volver a Certificación";
  if (path === "/cuenta/documentos") return "Volver a Documentos";
  if (path === "/cuenta/perfil") return "Volver a Perfil";
  if (path === "/cuenta/datos-bancarios") return "Volver a datos bancarios";
  if (path === "/login") return "Volver a inicio de sesión";
  if (path === "/registro") return "Volver al registro";
  return "Volver a Cuenta";
}
