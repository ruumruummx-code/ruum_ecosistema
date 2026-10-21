"use client";

import { EstadoError } from "../EstadoError";

export default function ErrorGanancias({ reset }: { reset: () => void }) {
  return (
    <EstadoError
      titulo="No pudimos cargar tus ganancias"
      descripcion="Falla de conexión al consultar el resumen de pagos. Revisa tu señal e inténtalo de nuevo."
      acciones={[
        { etiqueta: "Recargar", onClick: reset, variant: "primary" },
        { etiqueta: "Ir al panel", href: "/panel", variant: "quiet" }
      ]}
    />
  );
}
