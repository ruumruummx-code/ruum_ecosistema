"use client";

import { EstadoError } from "../EstadoError";

export default function ErrorCuenta({ reset }: { reset: () => void }) {
  return (
    <EstadoError
      titulo="No pudimos cargar tu cuenta"
      descripcion="Falla de conexión al consultar tu perfil y notificaciones. Revisa tu señal e inténtalo de nuevo."
      acciones={[
        { etiqueta: "Recargar", onClick: reset, variant: "primary" },
        { etiqueta: "Ir al panel", href: "/panel", variant: "quiet" }
      ]}
    />
  );
}
