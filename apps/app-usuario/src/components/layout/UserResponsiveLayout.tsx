"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../../app/NavegacionUsuario";
import { ContenidoResponsivePersistente } from "../ContenidoResponsivePersistente";
import { UserDashboardLayout } from "./UserDashboardLayout";

/** Añade el shell desktop a pantallas secundarias conservando su contenido y estado. */
export function UserResponsiveLayout({
  children,
  nombre,
  mobileNavigation = false,
  mobileShell = false,
  mobileClassName,
  mobileContentClassName,
  mobileBottomNavigation = false,
}: {
  children: ReactNode;
  nombre?: string | null;
  mobileNavigation?: boolean;
  mobileShell?: boolean;
  mobileClassName?: string;
  mobileContentClassName?: string;
  mobileBottomNavigation?: boolean;
}) {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia?.("(min-width: 1024px)");
    if (!media) return;
    const actualizar = () => setDesktop(media.matches);
    actualizar();
    media.addEventListener("change", actualizar);
    return () => media.removeEventListener("change", actualizar);
  }, []);

  return (
    <ContenidoResponsivePersistente
      desktop={desktop}
      escritorio={contenido => <UserDashboardLayout nombre={nombre}><div className="user-v2-scope">{contenido}</div></UserDashboardLayout>}
      movil={contenido => (
        <>
          {mobileNavigation && <NavegacionUsuario variante="claro" nombreUsuario={nombre} />}
          {mobileShell ? (
            <MobileShell as="main" variant="compact" navInferiorVisible={mobileBottomNavigation} className={mobileClassName} contentClassName={mobileContentClassName}>
              {contenido}
            </MobileShell>
          ) : <main>{contenido}</main>}
        </>
      )}
    >
      {children}
    </ContenidoResponsivePersistente>
  );
}
