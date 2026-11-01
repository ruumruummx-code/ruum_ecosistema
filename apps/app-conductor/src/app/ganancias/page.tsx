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
  useEffect(() => {
    let active = true;
    let inFlight = false;
    async function load() {
      if (inFlight || !active) return;
      inFlight = true;
      try {
        if (!tieneSupabaseConfigurado()) throw new Error("Las ganancias no están disponibles en este momento. Intenta más tarde.");
        const client = crearClienteNavegador();
        const driver = await obtenerConductorActual(client);
        if (!driver) throw new Error("Inicia sesión como conductor para consultar tus ganancias.");
        const result = await obtenerGananciasConductor(client, driver.id);
        if (active) { setData(result); setNow(new Date()); setError(null); }
      } catch {
        if (active) setError("No pudimos cargar tus ganancias. Intenta de nuevo más tarde.");
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
  }, []);
  const summary = useMemo(() => data && now ? summarizeEarnings(data.traslados, now, period) : null, [data, now, period]);
  return <DriverEarningsView data={data} summary={summary} period={period} onPeriod={setPeriod} loading={loading} error={error} />;
}
