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
    setNow(new Date());
    async function load() {
      try {
        if (!tieneSupabaseConfigurado) throw new Error("Las ganancias no están disponibles en este momento. Intenta más tarde.");
        const client = crearClienteNavegador();
        const driver = await obtenerConductorActual(client);
        if (!driver) throw new Error("Inicia sesión como conductor para consultar tus ganancias.");
        const result = await obtenerGananciasConductor(client, driver.id);
        if (active) setData(result);
      } catch {
        if (active) setError("No pudimos cargar tus ganancias. Intenta de nuevo más tarde.");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);
  const summary = useMemo(() => data && now ? summarizeEarnings(data.traslados, now, period) : null, [data, now, period]);
  return <DriverEarningsView data={data} summary={summary} period={period} onPeriod={setPeriod} loading={loading} error={error} />;
}
