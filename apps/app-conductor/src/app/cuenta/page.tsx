"use client";

import { useEffect, useState } from "react";
import { obtenerConductorActual } from "@ruum/api/services";
import { contarNotificacionesNoLeidas } from "@ruum/api/drivers";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { calcularSyncSnapshot, SYNC_STATUS_EVENT, type GlobalSyncSnapshot } from "../../lib/offline-sync-status";
import { useCerrarSesion } from "../../lib/use-cerrar-sesion";
import { DriverAccountView } from "./DriverAccountView";

export default function PaginaCuenta() {
  const [name, setName] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sync, setSync] = useState<GlobalSyncSnapshot | null>(null);
  const logout = useCerrarSesion();
  useEffect(() => {
    let active = true;
    let syncVersion = 0;
    const updateSync = (event: Event) => { syncVersion++; setSync((event as CustomEvent<GlobalSyncSnapshot>).detail); };
    window.addEventListener(SYNC_STATUS_EVENT, updateSync);
    void calcularSyncSnapshot().then(value => { if (active && syncVersion === 0) setSync(value); }).catch(() => undefined);
    async function loadProfile() {
      try {
        if (!tieneSupabaseConfigurado()) return;
        const client = crearClienteNavegador();
        const [profile, notifications] = await Promise.allSettled([obtenerConductorActual(client), contarNotificacionesNoLeidas(client)]);
        if (!active) return;
        if (profile.status === "fulfilled") setName(profile.value?.nombre ?? null);
        if (notifications.status === "fulfilled") setUnread(notifications.value);
      } finally { if (active) setLoading(false); }
    }
    void loadProfile().catch(() => undefined);
    return () => { active = false; window.removeEventListener(SYNC_STATUS_EVENT, updateSync); };
  }, []);
  const names = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials = names.length ? `${names[0][0]}${names.length > 1 ? names[names.length - 1][0] : ""}`.toLocaleUpperCase("es-MX") : null;
  return <DriverAccountView initials={initials} unread={unread} loading={loading} sync={sync} loggingOut={logout.cerrandoSesion} logoutError={logout.errorCerrarSesion} onLogout={() => { void logout.cerrarSesion(); }} onOpenLogout={logout.limpiarErrorCerrarSesion} />;
}
