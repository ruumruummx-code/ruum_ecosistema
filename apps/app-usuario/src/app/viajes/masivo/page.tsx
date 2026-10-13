import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { CargaMasivaForm } from "./CargaMasivaForm";

export const metadata: Metadata = {
  title: "Carga Masiva de Traslados | Ruum Ruum Usuario",
  description: "Solicita múltiples traslados de vehículos mediante archivo CSV de forma rápida y segura."
};

export default function PaginaCargaMasiva() {
  return (
    <>
      <NavegacionUsuario variante="claro" />
      <MobileShell variant="wide" navInferiorVisible={true}>
        <CargaMasivaForm />
      </MobileShell>
    </>
  );
}
