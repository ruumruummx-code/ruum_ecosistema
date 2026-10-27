"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";
import { construirNotificaciones } from "../../lib/inicio";
import { ContenidoResponsivePersistente } from "../../components/ContenidoResponsivePersistente";
import { SoporteCliente, type SoporteClienteProps } from "./SoporteCliente";

export function SoporteResponsive({ errorCarga = false, ...props }: SoporteClienteProps & { errorCarga?: boolean }) {
  const [desktop, setDesktop] = useState<boolean | null>(null);
  const router = useRouter();
  useEffect(() => {
    const media = window.matchMedia?.("(min-width: 1024px)");
    setDesktop(media?.matches ?? false);
    const cambiar = () => setDesktop(media?.matches ?? false);
    media?.addEventListener("change", cambiar);
    return () => media?.removeEventListener("change", cambiar);
  }, []);
  if (desktop === null) return <p role="status">Cargando ayuda…</p>;
  const contenido = <>
    {errorCarga && <div role="alert" className="m-3 rounded-xl border border-amber-300 p-4 text-sm">No pudimos cargar tu información. Puedes usar los canales de contacto o reintentar para vincular un traslado. <button type="button" onClick={() => router.refresh()} className="underline">Reintentar</button></div>}
    <SoporteCliente {...props} escritorio={desktop} />
  </>;
  return <ContenidoResponsivePersistente desktop={desktop} escritorio={sitio => <UserDashboardLayout usuario={props.usuario} nombre={props.usuario?.nombre} notificaciones={props.usuario ? construirNotificaciones(props.usuario, props.traslados) : []}>
    <div className="mx-auto max-w-5xl space-y-6"><header><h1 className="text-2xl font-bold">Ayuda y soporte</h1><p className="mt-2 text-sm text-[var(--ruum-text-secondary)]">Consulta las preguntas frecuentes, contacta a soporte o crea un reporte.</p></header><div className="user-v2-scope rounded-2xl border border-[var(--ruum-border)] p-6">{sitio}</div></div>
  </UserDashboardLayout>} movil={sitio => <><NavegacionUsuario variante="claro" nombreUsuario={props.usuario?.nombre} /><MobileShell variant="compact" navInferiorVisible={false} className="user-v2-scope user-support-shell" contentClassName="user-support-content">{sitio}</MobileShell></>}>{contenido}</ContenidoResponsivePersistente>;
}
