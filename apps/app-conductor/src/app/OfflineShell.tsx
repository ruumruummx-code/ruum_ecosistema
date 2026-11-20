"use client";

import { useCallback, useEffect, useState } from "react";
import { ConductorButton as Button } from "@/components/v2/ConductorUI";
import { leerCacheViajeActivo, type OfflineActiveTripCache } from "../lib/offline-active-trip-cache";
import { publicarSyncSnapshot } from "../lib/offline-sync-status";

function formatearFecha(iso: string | null | undefined) {
  if (!iso) return "Sin registro";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City"
  }).format(new Date(iso));
}

export function OfflineShell() {
  const [offline, setOffline] = useState(false);
  const [cache, setCache] = useState<OfflineActiveTripCache | null>(null);
  const [reintentando, setReintentando] = useState(false);

  const cargar = useCallback(async () => {
    setOffline(typeof navigator !== "undefined" && !navigator.onLine);
    setCache(await leerCacheViajeActivo());
  }, []);

  useEffect(() => {
    void cargar();
    window.addEventListener("online", cargar);
    window.addEventListener("offline", cargar);
    window.addEventListener("ruum:offline-cache-updated", cargar);
    return () => {
      window.removeEventListener("online", cargar);
      window.removeEventListener("offline", cargar);
      window.removeEventListener("ruum:offline-cache-updated", cargar);
    };
  }, [cargar]);

  if (!offline || !cache) return null;

  async function reintentar() {
    setReintentando(true);
    await publicarSyncSnapshot(typeof navigator !== "undefined" && navigator.onLine ? undefined : "sin_conexion");
    window.setTimeout(() => {
      setReintentando(false);
      if (typeof navigator !== "undefined" && navigator.onLine) window.location.reload();
    }, 600);
  }

  return (
    <section className="fixed inset-0 z-50 overflow-y-auto bg-canvas px-4 py-6 text-ui-fg">
      <div className="mx-auto grid min-h-full max-w-xl content-start gap-4">
        <div className="rounded-lg border border-ui-warning/45 bg-ui-warning/10 p-4">
          <p className="font-body text-sm font-bold text-ui-warning">Sin conexión</p>
          <h1 className="mt-2 font-display text-2xl font-semibold">Modo offline del traslado</h1>
          <p className="mt-2 font-body text-sm text-ui-fg-muted">
            Última sincronización: {formatearFecha(cache.ultimaSincronizacion)}
          </p>
        </div>

        <article className="rounded-lg border border-ui-brand/35 bg-ui-card p-4 shadow-2">
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Traslado activo</p>
          <div className="mt-3 flex flex-col gap-2">
            <p className="font-display text-xl font-semibold">Folio {cache.folio}</p>
            <p className="font-body text-sm font-semibold text-ui-fg">{cache.vehiculo.descripcion}</p>
            <p className="font-body text-sm text-ui-fg-muted">Placas: {cache.vehiculo.placas ?? "Por confirmar"}</p>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border border-ui-line bg-ui-muted p-3">
              <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Origen</p>
              <p className="mt-1 font-body text-sm font-semibold">{cache.origen.direccion ?? "Por confirmar"}</p>
              {cache.origen.ciudad && <p className="font-body text-sm text-ui-fg-muted">{cache.origen.ciudad}</p>}
            </div>
            <div className="rounded-xl border border-ui-line bg-ui-muted p-3">
              <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Destino</p>
              <p className="mt-1 font-body text-sm font-semibold">{cache.destino.direccion ?? "Por confirmar"}</p>
              {cache.destino.ciudad && <p className="font-body text-sm text-ui-fg-muted">{cache.destino.ciudad}</p>}
            </div>
          </div>
        </article>

        <section className="rounded-lg border border-ui-line bg-ui-card p-4">
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Próxima instrucción disponible</p>
          <p className="mt-2 font-body text-base font-semibold">{cache.siguienteAccion.label}</p>
          <p className="mt-1 font-body text-sm leading-6 text-ui-fg-muted">{cache.siguienteAccion.instruction}</p>
        </section>

        <section className="rounded-lg border border-ui-line bg-ui-card p-4">
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Evidencias pendientes</p>
          {cache.requisitosEvidencia.pendientes.length > 0 ? (
            <ul className="mt-2 list-disc pl-5 font-body text-sm text-ui-fg-muted">
              {cache.requisitosEvidencia.pendientes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 font-body text-sm text-ui-fg-muted">Sin requisitos pendientes conocidos.</p>
          )}
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <a href={cache.telefonosSoporteEmergencia.soporteHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-ui-line bg-ui-card px-4 font-body text-sm font-bold text-ui-fg">
            Llamar soporte
          </a>
          <a href={cache.telefonosSoporteEmergencia.emergenciaHref} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-ui-danger bg-ui-danger px-4 font-body text-sm font-bold text-ui-on-brand">
            Emergencia
          </a>
          <Button variant="primary" loading={reintentando} onClick={reintentar} className="w-full">
            Reintentar conexión
          </Button>
        </div>
      </div>
    </section>
  );
}

