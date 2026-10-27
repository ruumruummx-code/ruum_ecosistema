"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";
import { construirNotificaciones } from "../../lib/inicio";
import type { CuentaReal } from "./cuenta-ui";

/** Solo se monta una copia del editor; las vistas ocultas no escriben preferencias. */
export function PantallaCuentaResponsive({ cuenta, titulo, descripcion, movil, escritorio }: { cuenta: CuentaReal; titulo: string; descripcion: string; movil: ReactNode; escritorio: ReactNode }) {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia?.("(min-width: 1024px)");
    if (!media) return;
    setDesktop(media.matches);
    const cambiar = () => setDesktop(media.matches);
    media.addEventListener?.("change", cambiar);
    return () => media.removeEventListener?.("change", cambiar);
  }, []);
  return desktop ? <UserDashboardLayout usuario={cuenta.usuario} nombre={cuenta.usuario.nombre} correo={cuenta.correoRegistro} totalVehiculos={cuenta.vehiculos.length} notificaciones={construirNotificaciones(cuenta.usuario, cuenta.traslados ?? [])}>
    <div className="mx-auto max-w-4xl space-y-5"><header><Link href="/cuenta" className="text-sm underline">Volver a mi cuenta</Link><h1 className="mt-3 text-2xl font-bold">{titulo}</h1><p className="mt-2 text-sm text-[var(--ruum-text-secondary)]">{descripcion}</p></header>{escritorio}</div>
  </UserDashboardLayout> : <><NavegacionUsuario variante="claro" nombreUsuario={cuenta.usuario.nombre} /><MobileShell as="main" variant="compact" navInferiorVisible={false} className={`user-v2-scope ${titulo === "Mi perfil" ? "user-profile-shell" : "user-preferences-shell"}`} contentClassName={titulo === "Mi perfil" ? "user-profile-content" : "user-preferences-content"}>{movil}</MobileShell></>;
}
