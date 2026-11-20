"use client";

import Link from "next/link";
import { Stat, StatGroup } from "@ruum/ui/base";

export interface PanelMetricsProps {
  gananciasHoy: number | null;
  trasladosHoy: number | null;
  gananciasEstimadas?: boolean;
  gananciasIncompletas?: boolean;
  gananciasDesconocidas?: boolean;
}

export function PanelMetrics({
  gananciasHoy,
  trasladosHoy,
  gananciasEstimadas = false,
  gananciasIncompletas = false,
  gananciasDesconocidas = false,
}: PanelMetricsProps) {
  const tieneDatosGanancias = !gananciasDesconocidas && gananciasHoy !== null;
  const tieneDatosTraslados = trasladosHoy !== null;

  const restantes = tieneDatosTraslados ? Math.max(0, 3 - (trasladosHoy ?? 0)) : null;

  const gananciasFormateadas = tieneDatosGanancias
    ? new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
      }).format(gananciasHoy ?? 0)
    : "—";

  const gananciasTexto = tieneDatosGanancias
    ? `${gananciasFormateadas}${gananciasIncompletas ? "*" : ""}`
    : (gananciasIncompletas ? "En conciliación" : "—");

  const subtextoGanancias = !tieneDatosGanancias
    ? (gananciasIncompletas ? "En conciliación final" : "No disponible")
    : trasladosHoy === 0
      ? "Sin cierres aún"
      : `${trasladosHoy ?? 0} cierre${trasladosHoy === 1 ? "" : "s"} hoy${gananciasIncompletas ? " (conciliación pendiente)" : ""}`;

  const trasladosTexto = tieneDatosTraslados ? `${trasladosHoy} / 3` : "—";
  const subtextoTraslados = !tieneDatosTraslados
    ? "No disponible"
    : restantes === 0
      ? "Bono disponible"
      : `Faltan ${restantes} para bono`;

  return <section aria-labelledby="actividad-hoy" className="space-y-3">
    <h2 id="actividad-hoy" className="text-base font-semibold text-ui-fg">Tu actividad de hoy</h2>
    <StatGroup className="grid-cols-2">
      <Stat etiqueta="Ganancias" valor={<Link href="/ganancias" className="block min-h-12 rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring" aria-label={`Ver balance: ${gananciasTexto}. ${subtextoGanancias}${gananciasEstimadas ? ". Importe estimado" : ""}`}>
        <span className="block">{gananciasTexto}</span>
        <span className="mt-1 block whitespace-normal text-xs font-normal leading-5 text-ui-fg-muted">{gananciasEstimadas ? "Estimado · " : ""}{subtextoGanancias}</span>
      </Link>} />
      <Stat etiqueta="Traslados" valor={<Link href="/viajes" className="block min-h-12 rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring" aria-label={`Ver detalle: ${trasladosTexto} traslados. ${subtextoTraslados}`}>
        <span className="block">{trasladosTexto}</span>
        <span className="mt-1 block whitespace-normal text-xs font-normal leading-5 text-ui-fg-muted">{subtextoTraslados}</span>
      </Link>} />
    </StatGroup>
  </section>;
}
