import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { conCuenta } from "../cuenta-ui";
import { DatosPersonales } from "../DatosPersonales";

export const metadata: Metadata = {
  title: "Editar Perfil — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaDatosPersonales() {
  return conCuenta((cuenta) => (
    <>
      <MobileShell variant="compact" as="main" className="user-v2-scope user-profile-shell" contentClassName="user-profile-content">
        <DatosPersonales correoRegistro={cuenta.correoRegistro} usuario={cuenta.usuario} fotoUrlInicial={cuenta.fotoPerfilUrl} />
      </MobileShell>
    </>
  ));
}
