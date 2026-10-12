import type { Metadata } from "next";
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
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen">
        <div className="user-v2-content mx-auto max-w-xl px-4 py-4 sm:py-6">
          <PreguntasFrecuentes />
        </div>
      </main>
    </>
  );
}
