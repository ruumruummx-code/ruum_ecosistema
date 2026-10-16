import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { conCuenta } from "../cuenta-ui";
import { Preferencias } from "../Preferencias";

export const metadata: Metadata = {
  title: "Preferencias — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaPreferencias() {
  return conCuenta((cuenta) => (
    <>
      <MobileShell variant="compact" navInferiorVisible={false} as="main" className="user-v2-scope user-preferences-shell" contentClassName="user-preferences-content">
        <Preferencias usuario={cuenta.usuario} />
      </MobileShell>
    </>
  ));
}
