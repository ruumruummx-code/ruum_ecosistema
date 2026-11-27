"use client";

import { useEffect, useState } from "react";
import { MobileShell } from "@ruum/ui";
import { useMediaQuery } from "@ruum/ui/base";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { UserDashboardLayout } from "../../../components/layout/UserDashboardLayout";
import { CargaMasiva } from "./CargaMasiva";

/** Mismo corte que `lg:` (barra lateral de UserDashboardLayout). */
const QUERY_ESCRITORIO = "(min-width: 1024px)";

/**
 * Carga masiva: una sola pantalla (CargaMasiva) dentro del marco de navegación
 * de cada tamaño: barra inferior en móvil y barra lateral desde 1024 px.
 *
 * A diferencia de otras pantallas, el contenido se monta solo en el marco
 * visible y después de hidratar: la pantalla consulta cargas pendientes y
 * reanuda un checkout guardado al montarse, y montarla dos veces duplicaría
 * esas llamadas.
 */
export default function PaginaViajesMasivo() {
  const esEscritorio = useMediaQuery(QUERY_ESCRITORIO);
  const [hidratada, setHidratada] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState<string | null>(null);

  useEffect(() => {
    setHidratada(true);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const { crearClienteNavegador } = await import("../../../lib/supabase-browser");
        const {
          data: { user },
        } = await crearClienteNavegador().auth.getUser();
        if (user?.user_metadata?.nombre) setNombreUsuario(user.user_metadata.nombre);
      } catch {
        // Sin nombre, la barra lateral usa su saludo genérico.
      }
    })();
  }, []);

  const contenido = (marco: "movil" | "escritorio") =>
    hidratada && (marco === "escritorio") === esEscritorio ? <CargaMasiva /> : null;

  return (
    <>
      <div className="flex h-full w-full flex-col lg:hidden">
        <NavegacionUsuario variante="claro" />
        <MobileShell as="main" variant="wide" padding="none" conFondoCanvas={false} navInferiorVisible className="bg-ui-bg">
          {contenido("movil")}
        </MobileShell>
      </div>
      <div className="hidden h-full w-full lg:flex">
        <UserDashboardLayout
          idContenido="contenido-carga-masiva"
          nombre={nombreUsuario}
          padding="ninguno"
          classNameContenido="bg-ui-bg"
        >
          {contenido("escritorio")}
        </UserDashboardLayout>
      </div>
    </>
  );
}
