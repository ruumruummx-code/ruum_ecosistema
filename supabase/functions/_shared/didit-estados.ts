export function normalizarEstadoDidit(valor: unknown) {
  switch (String(valor ?? "").trim().toLowerCase()) {
    case "approved":
    case "completed":
    case "verification.completed":
      return "aprobado";
    case "declined":
    case "rejected":
      return "rechazado";
    case "in review":
    case "in_review":
    case "review":
      return "en_revision";
    case "expired":
    case "kyc expired":
      return "expirado";
    case "abandoned":
    case "cancelled":
    case "canceled":
      return "cancelado";
    case "error":
    case "failed":
      return "error";
    default:
      return "pendiente";
  }
}
