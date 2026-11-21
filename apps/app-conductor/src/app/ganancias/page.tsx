"use client";

import { useEffect, useMemo, useState } from "react";
import { obtenerConductorActual, obtenerGananciasConductor, type DatosGananciasConductor } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { DriverEarningsView } from "./DriverEarningsView";
import { summarizeEarnings, type EarningsPeriod } from "./earnings-summary";

export default function GananciasConductorPage() {
  const [data, setData] = useState<DatosGananciasConductor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<EarningsPeriod>("semana");
  const [now, setNow] = useState<Date | null>(null);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    let active = true;
    let inFlight = false;
    async function load() {
      if (inFlight || !active) return;
      inFlight = true;
      try {
        // Cada causa conserva su propio mensaje; solo los fallos inesperados usan el genérico.
        if (!tieneSupabaseConfigurado()) { if (active) setError("Las ganancias no están disponibles en este momento. Intenta más tarde."); return; }
        const client = crearClienteNavegador();
        const driver = await obtenerConductorActual(client);
        if (!driver) { if (active) setError("No encontramos tu perfil de conductor. Cierra sesión y vuelve a entrar."); return; }
        const result = await obtenerGananciasConductor(client, driver.id);
        if (active) { setData(result); setNow(new Date()); setError(null); }
      } catch {
        if (active) setError(navigator.onLine ? "No pudimos cargar tus ganancias. Inténtalo de nuevo." : "Sin conexión. Conéctate a internet para ver tus ganancias.");
      } finally { inFlight = false; if (active) setLoading(false); }
    }
    void load();
    const refresh = () => { if (document.visibilityState === "visible" && navigator.onLine) void load(); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [intento]);
  const summary = useMemo(() => data && now ? summarizeEarnings(data.traslados, now, period) : null, [data, now, period]);
  return <DriverEarningsView data={data} summary={summary} period={period} onPeriod={setPeriod} loading={loading} error={error} onRetry={() => { setLoading(true); setIntento(valor => valor + 1); }} />;
}
