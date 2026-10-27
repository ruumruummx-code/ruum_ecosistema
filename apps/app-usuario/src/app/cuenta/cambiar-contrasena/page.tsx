import type { Metadata } from "next";
import { UserResponsiveLayout } from "../../../components/layout/UserResponsiveLayout";
import { conCuenta } from "../cuenta-ui";
import { CambiarContrasena } from "./CambiarContrasena";

export const metadata: Metadata = {
  title: "Cambiar contraseña — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaCambiarContrasena() {
  return conCuenta((cuenta) => (
    <UserResponsiveLayout nombre={cuenta.usuario.nombre} mobileShell mobileClassName="user-v2-scope user-password-shell" mobileContentClassName="user-password-content">
      <CambiarContrasena />
    </UserResponsiveLayout>
  ));
}
