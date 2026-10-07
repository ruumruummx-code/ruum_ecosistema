import type { Metadata } from "next";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { CuentaCliente } from "./CuentaCliente";
import { conCuenta } from "./cuenta-ui";

export const metadata: Metadata = {
  title: "Mi cuenta — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaCuenta() {
  /* A-4 (auditoría): antes `cuenta?.usuario ?? null` collapsaba "sin sesión" y
     "Supabase caído" en el mismo caso, y CuentaCliente pintaba "Sin correo
     registrado" como si la cuenta estuviera vacía. Ahora los tres estados se
     distinguen. */
  return conCuenta((cuenta) => (
    <main className="user-v2-scope user-v2-page user-v2-secondary-screen">
      <NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario?.nombre} />
      <div className="user-v2-content">
        <CuentaCliente usuario={cuenta.usuario} />
      </div>
    </main>
  ));
}