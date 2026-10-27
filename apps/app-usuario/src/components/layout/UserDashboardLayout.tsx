"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { UserHeader, type NotificacionHeader } from "./UserHeader";
import { UserSidebar } from "./UserSidebar";
import estilos from "./user-dashboard.module.css";

const CLAVE_COLAPSADA = "ruum-usuario-sidebar-colapsada";

function leerPreferenciaColapsada(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const valor = window.localStorage.getItem(CLAVE_COLAPSADA);
    if (valor !== null) {
      return valor === "1";
    }
    // Tablet (768px – 1279px): colapsado por defecto según especificación RR-UI-001 §5
    if (typeof window.matchMedia === "function") {
      return window.matchMedia("(min-width: 768px) and (max-width: 1279px)").matches;
    }
    return false;
  } catch {
    return false;
  }
}

export interface UserDashboardLayoutProps {
  children: ReactNode;
  user?: {
    name?: string | null;
    avatarUrl?: string | null;
    role?: string;
  };
  usuario?: { id?: string; nombre?: string | null; correo?: string | null; [key: string]: unknown } | null;
  nombre?: string | null;
  correo?: string | null;
  rol?: string;
  unreadNotifications?: number;
  notificaciones?: NotificacionHeader[];
  totalVehiculos?: number;
  onLogout?: () => void;
  onCerrarSesion?: () => void | Promise<void>;
  idContenido?: string;
  padding?: "amplio" | "compacto" | "ninguno";
  classNameContenido?: string;
  showPromo?: boolean;
}

const PADDING: Record<NonNullable<UserDashboardLayoutProps["padding"]>, string> = {
  amplio: "space-y-6 p-4 sm:p-6 lg:p-8",
  compacto: "space-y-6 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6",
  ninguno: "",
};

/**
 * Shell compartido del área de usuario (RR-UI-001).
 *
 * Arquitectura técnica:
 * - Desktop (>= 1280px): Sidebar expandido / contraíble (256px / 72px) con Header completo.
 * - Tablet (768–1279px): Sidebar compacto (72px) por defecto con Header adaptativo.
 * - Móvil (<= 767px): Drawer superpuesto con backdrop, botón hamburguesa y foco accesible.
 * - El scroll pertenece al contenedor del contenido; el sidebar cuenta con scroll independiente.
 */
export function UserDashboardLayout({
  children,
  user,
  usuario = null,
  nombre,
  correo,
  rol = "Usuario",
  unreadNotifications,
  notificaciones = [],
  totalVehiculos,
  onLogout,
  onCerrarSesion,
  idContenido,
  padding = "compacto",
  classNameContenido = "",
  showPromo = true,
}: UserDashboardLayoutProps) {
  const ruta = usePathname();
  const [colapsada, setColapsada] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    setColapsada(leerPreferenciaColapsada());
    setHidratado(true);
  }, []);

  // Al cambiar de ruta, cerrar automáticamente el drawer móvil si estaba abierto
  useEffect(() => {
    setMobileOpen(false);
  }, [ruta]);

  const cambiarColapso = (nuevoValor: boolean) => {
    setColapsada(nuevoValor);
    try {
      window.localStorage.setItem(CLAVE_COLAPSADA, nuevoValor ? "1" : "0");
    } catch {
      // Almacenamiento restringido: la preferencia persiste durante la sesión
    }
  };

  return (
    <div
      className={estilos.shell}
      data-layout="usuario-dashboard"
      data-hydrated={hidratado ? "true" : undefined}
    >
      <UserSidebar
        collapsed={colapsada}
        mobileOpen={mobileOpen}
        onCollapseChange={cambiarColapso}
        onMobileClose={() => setMobileOpen(false)}
        showPromo={showPromo}
        mainContentId="userDashboardMainContent"
      />

      <div
        id="userDashboardMainContent"
        aria-hidden={mobileOpen ? "true" : undefined}
        inert={mobileOpen ? true : undefined}
        className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden"
      >
        <UserHeader
          user={user}
          usuario={usuario}
          nombre={nombre ?? user?.name ?? usuario?.nombre}
          correo={correo ?? usuario?.correo}
          rol={rol ?? user?.role}
          unreadNotifications={unreadNotifications}
          notificaciones={notificaciones}
          totalVehiculos={totalVehiculos}
          onMenuOpen={() => setMobileOpen(true)}
          onLogout={onLogout}
          onCerrarSesion={onCerrarSesion}
        />

        <main
          id={idContenido}
          aria-label="Contenido principal"
          className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[var(--rr-page-bg,#f5f8fc)] text-[var(--ruum-text)] ${PADDING[padding]} ${classNameContenido}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
