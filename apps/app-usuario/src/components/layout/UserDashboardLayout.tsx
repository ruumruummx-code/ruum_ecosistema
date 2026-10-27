"use client";

import type { ReactNode } from "react";
import { UserHeader, type NotificacionHeader } from "./UserHeader";
import { UserSidebar } from "./UserSidebar";
import estilos from "./user-dashboard.module.css";

export interface UserDashboardLayoutProps {
  children: ReactNode;
  usuario?: { nombre?: string | null; correo?: string | null } | null;
  nombre?: string | null;
  correo?: string | null;
  rol?: string;
  notificaciones?: NotificacionHeader[];
  totalVehiculos?: number;
  onCerrarSesion?: () => void | Promise<void>;
  idContenido?: string;
  padding?: "amplio" | "compacto" | "ninguno";
  classNameContenido?: string;
}

const PADDING: Record<NonNullable<UserDashboardLayoutProps["padding"]>, string> = {
  amplio: "space-y-6 p-8",
  compacto: "space-y-6 px-8 py-6",
  ninguno: "",
};

/**
 * Shell compartido de las pantallas de escritorio del área de usuario.
 * - Vive solo dentro de las ramas `hidden lg:flex` de cada página.
 * - El scroll pertenece al contenido; el sidebar tiene su propio scroll interno.
 * - En móvil el CSS del shell lo oculta, por lo que jamás aparece junto a la
 *   navegación inferior.
 */
export function UserDashboardLayout({
  children,
  usuario = null,
  nombre,
  correo,
  rol = "Usuario",
  notificaciones = [],
  totalVehiculos,
  onCerrarSesion,
  idContenido,
  padding = "compacto",
  classNameContenido = "",
}: UserDashboardLayoutProps) {
  return (
    <div className={estilos.shell} data-layout="usuario-desktop">
      <UserSidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <UserHeader
          usuario={usuario}
          nombre={nombre ?? usuario?.nombre}
          correo={correo ?? usuario?.correo}
          rol={rol}
          notificaciones={notificaciones}
          totalVehiculos={totalVehiculos}
          onCerrarSesion={onCerrarSesion}
        />

        <main
          id={idContenido}
          aria-label="Contenido principal"
          className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[var(--user-color-background,var(--ruum-canvas))] text-[var(--ruum-text)] ${PADDING[padding]} ${classNameContenido}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
