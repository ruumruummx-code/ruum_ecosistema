export type MensajeDidit = {
  tipo: "completado" | "cancelado";
  sessionId?: string;
  status?: string;
};

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null;
}

/** Valida los mensajes postMessage emitidos por el iframe hospedado de Didit.
 * V-1: si se recibe `origen`, se exige que sea un origen Didit válido;
 * en caso contrario se descarta el mensaje (retorna null). */
export function interpretarMensajeDidit(valor: unknown, origen?: string): MensajeDidit | null {
  if (typeof origen === "string" && origen.length > 0 && !esOrigenDiditValido(origen)) {
    return null;
  }
  let mensaje = valor;

  if (typeof mensaje === "string") {
    const texto = mensaje.trim();
    if (texto === "didit:complete" || texto === "didit:completed") {
      return { tipo: "completado" };
    }
    if (texto === "didit:cancel" || texto === "didit:cancelled") {
      return { tipo: "cancelado" };
    }
    try {
      mensaje = JSON.parse(texto) as unknown;
    } catch {
      return null;
    }
  }

  if (!esRegistro(mensaje)) return null;

  const tipo = typeof mensaje.type === "string" ? mensaje.type.toLowerCase() : "";
  const datos = esRegistro(mensaje.data) ? mensaje.data : mensaje;
  const sessionId =
    typeof datos.sessionId === "string"
      ? datos.sessionId
      : typeof datos.session_id === "string"
      ? datos.session_id
      : undefined;
  const status = typeof datos.status === "string" ? datos.status : undefined;

  if (
    [
      "didit:complete",
      "didit:completed",
      "didit:verification:complete",
      "didit:verification:completed",
    ].includes(tipo)
  ) {
    return { tipo: "completado", sessionId, status };
  }

  if (["didit:cancel", "didit:cancelled", "didit:verification:cancelled"].includes(tipo)) {
    return { tipo: "cancelado", sessionId, status };
  }

  return null;
}

export function esOrigenDiditValido(origen: string): boolean {
  try {
    const url = new URL(origen);
    return (
      url.protocol === "https:" &&
      (url.hostname === "verify.didit.me" || url.hostname.endsWith(".didit.me") || url.hostname === "didit.me")
    );
  } catch {
    return false;
  }
}
