import type { Metadata } from "next";
import { VerificarTelefono } from "./VerificarTelefono";

export const metadata: Metadata = { title: "Verificar teléfono · Ruum Ruum" };

export default function PaginaVerificarTelefono() {
  return <VerificarTelefono />;
}
