"use client";

import { Button } from "@ruum/ui/base";

export function BotonReintentarSesion() {
  return <Button onClick={() => window.location.reload()}>Reintentar</Button>;
}
