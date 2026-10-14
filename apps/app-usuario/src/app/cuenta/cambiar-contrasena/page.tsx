import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { conCuenta } from "../cuenta-ui";
import { CambiarContrasena } from "./CambiarContrasena";

export const metadata: Metadata = {
  title: "Cambiar contraseña — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaCambiarContrasena() {
  return conCuenta(() => (
    <MobileShell variant="compact" navInferiorVisible={false} as="main">
      <CambiarContrasena />
    </MobileShell>
  ));
}
