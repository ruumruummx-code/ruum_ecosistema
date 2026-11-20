"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RuumHeader } from "@ruum/ui";
import { contarNotificacionesNoLeidas } from "@ruum/api/drivers";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";

/** Cabecera de marca única para todas las rutas de la aplicación. */
export function ConductorHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let active = true;
    const update = async () => {
      if (!tieneSupabaseConfigurado()) return;
      try {
        const count = await contarNotificacionesNoLeidas(crearClienteNavegador());
        if (active) setUnread(count);
      } catch { /* La navegación sigue disponible sin conexión. */ }
    };
    void update();
    window.addEventListener("focus", update);
    return () => { active = false; window.removeEventListener("focus", update); };
  }, [pathname]);
  return <div data-conductor-header>
    <RuumHeader rol="conductor" hrefLogo="/panel" notificacionesCount={unread}
      onNotificaciones={() => router.push("/notificaciones")}
      onSoporte={() => router.push("/cuenta/soporte")} />
  </div>;
}
