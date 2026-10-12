import type { Metadata } from "next";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { conCuenta } from "../cuenta-ui";
import { DatosPersonales } from "../DatosPersonales";

export const metadata: Metadata = {
  title: "Datos personales — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaDatosPersonales() {
  return conCuenta((cuenta) => (
    <>
      <NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario?.nombre} />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen">
        <div className="user-v2-content mx-auto max-w-xl px-4 py-4 sm:py-6">
          <DatosPersonales usuario={cuenta.usuario} fotoUrlInicial={cuenta.fotoPerfilUrl} />
        </div>
      </main>
    </>
  ));
}
