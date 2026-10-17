import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { PreguntasFrecuentes } from "./PreguntasFrecuentes";

export const metadata: Metadata = {
  title: "Preguntas frecuentes — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default function PaginaPreguntasFrecuentes() {
  return (
    <>
      <NavegacionUsuario variante="claro" />
      <MobileShell variant="compact" navInferiorVisible={true} contentClassName="faq-shell-content">
        <PreguntasFrecuentes />
      </MobileShell>
    </>
  );
}
