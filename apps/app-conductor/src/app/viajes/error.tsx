"use client";

import { EstadoError } from "../EstadoError";

export default function ErrorTraslados({ reset }: { reset: () => void }) {
  return (
    <EstadoError
      titulo="No pudimos cargar tus traslados"
      descripcion="Falla de conexión. Revisa tu señal, recarga la vista o vuelve a tu lista de traslados."
      acciones={[
        { etiqueta: "Ver mis traslados", href: "/viajes", variant: "primary" },
        { etiqueta: "Volver al inicio", href: "/panel", variant: "quiet" },
        { etiqueta: "Recargar", onClick: reset, variant: "secondary" }
      ]}
    />
  );
}
