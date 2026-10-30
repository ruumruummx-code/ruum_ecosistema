"use client";

import { useEffect, useState } from "react";
import { obtenerEstadoTrackingNativo, soportaTrackingNativo, type BackgroundTrackingStatus } from "../lib/background-tracking";
import { getBatteryState } from "../lib/battery";

function etiqueta(status: BackgroundTrackingStatus) {
  if (status.lastError === "location_permission_missing") return "Permiso de ubicación revocado";
  if (!status.active) return "Seguimiento detenido";
  if (status.lastSentAt && Date.now() - status.lastSentAt > 120_000) return "Sin envío confirmado por más de 120 segundos. Revisa conexión y permisos.";
  if (status.pendingCount > 0) return `${status.pendingCount} ubicaciones pendientes de sincronizar`;
  if (status.lastLocationAt && Date.now() - status.lastLocationAt > 120_000) return "GPS limitado o ubicación retrasada";
  if (status.lastSentAt) return `Ubicación compartida · último envío ${new Date(status.lastSentAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
  return "Iniciando seguimiento de ubicación";
}

export function EstadoTrackingGlobal() {
  const [status, setStatus] = useState<BackgroundTrackingStatus | null>(null);
  const [web, setWeb] = useState<{ active: boolean; lastSentAt?: number; startedAt: number } | null>(null);
  const [ahora, setAhora] = useState(Date.now());
  useEffect(() => {
    const recibir = (event: Event) => {
      const detail = (event as CustomEvent<{ active: boolean; lastSentAt?: number }>).detail;
      setWeb((prev) => ({ ...detail, lastSentAt: detail.lastSentAt ?? prev?.lastSentAt, startedAt: prev?.active ? prev.startedAt : Date.now() }));
    };
    window.addEventListener("ruum:tracking-web", recibir);
    const timer = window.setInterval(() => setAhora(Date.now()), 15_000);
    return () => { window.removeEventListener("ruum:tracking-web", recibir); window.clearInterval(timer); };
  }, []);
  useEffect(() => {
    if (!soportaTrackingNativo()) return;
    let mounted = true;
    let id: number | undefined;
    const refresh = () => void obtenerEstadoTrackingNativo().then((next) => { if (mounted) setStatus(next); }).catch(() => undefined);
    const iniciar = async () => {
      refresh();
      const battery = await getBatteryState().catch(() => ({ level: 1, charging: true, lowPower: false } as const));
      const intervalo = battery.lowPower || battery.level < 0.2 ? 60_000 : 15_000;
      id = window.setInterval(refresh, intervalo);
    };
    void iniciar();
    return () => { mounted = false; if (id !== undefined) window.clearInterval(id); };
  }, []);
  if (web?.active) return <output className="mx-auto mt-3 block rounded-xl border border-amber-500 p-3 text-sm">{ahora - (web.lastSentAt ?? web.startedAt) > 120_000 ? "Sin señal confirmada por más de 120 segundos. Revisa permisos y conexión. " : "Seguimiento web en primer plano. "}La web puede suspender el GPS al bloquear la pantalla o cambiar de pestaña. El seguimiento continuo requiere validar un cliente Android en el teléfono real.</output>;
  if (!status?.active && !status?.lastError) return null;
  const warning = Boolean(status?.lastError || (status?.lastSentAt && ahora - status.lastSentAt > 120_000) || (status?.lastLocationAt && ahora - status.lastLocationAt > 120_000));
  return <output className={`mx-auto mt-3 block w-[min(100%-24px,1120px)] rounded-xl border px-4 py-2 font-body text-sm font-semibold ${warning ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300" : "border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>{status ? etiqueta(status) : "Consultando seguimiento"}</output>;
}
