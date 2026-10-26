import type { Metadata } from "next";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { CuentaCliente } from "./CuentaCliente";
import { CuentaDesktop } from "./CuentaDesktop";
import { conCuenta } from "./cuenta-ui";

export const metadata: Metadata = {
  title: "Mi cuenta — Ruum Ruum",
  robots: { index: false, follow: false },
};

export default async function PaginaCuenta({ searchParams }: { searchParams?: Promise<{ seccion?: string }> }) {
  const seccion = (await searchParams)?.seccion;
  /* A-4 (auditoría): antes `cuenta?.usuario ?? null` collapsaba "sin sesión" y
     "Supabase caído" en el mismo caso, y CuentaCliente pintaba "Sin correo
     registrado" como si la cuenta estuviera vacía. Ahora los tres estados se
     distinguen. */
  return conCuenta((cuenta) => (
    <>
      {/* VISTA MÓVIL (< 1024px): Preservada idéntica bajo enfoque mobile-first */}
      <div className="lg:hidden flex flex-col h-full w-full">
        <NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario?.nombre} />
        <MobileShell variant="compact" navInferiorVisible={true} as="main" className="user-v2-scope user-account-shell" contentClassName="user-account-content">
          <CuentaCliente
            seccionInicial={seccion === "perfil" || seccion === "soporte" || seccion === "legal" ? seccion : null}
            correoRegistro={cuenta.correoRegistro}
            usuario={cuenta.usuario}
            fotoUrl={cuenta.fotoPerfilUrl}
            totalVehiculos={cuenta.vehiculos.length}
            incidenciasAbiertas={cuenta.incidenciasAbiertas}
            totalTraslados={cuenta.totalTraslados}
          />
        </MobileShell>
      </div>

      {/* VISTA ESCRITORIO (>= 1024px): Gestión de cuenta de alta fidelidad */}
      <div className="hidden lg:flex h-full w-full overflow-hidden">
        <CuentaDesktop
          cuenta={cuenta}
        />
      </div>
    </>
  ));
}