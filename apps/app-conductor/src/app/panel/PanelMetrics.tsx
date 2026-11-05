"use client";

import Link from "next/link";

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

  return (
    <section className="driver-metrics grid grid-cols-2 gap-2" aria-label="Resumen del día">
      <Link href="/ganancias" className="driver-metric-link" aria-label={`Ver balance: ${gananciasTexto}. ${subtextoGanancias}${gananciasEstimadas ? ". Importe estimado" : ""}`}>
        <span>Ganancias de hoy</span>
        <strong>{gananciasTexto}</strong>
        <small>{gananciasEstimadas ? "Estimado · " : ""}{subtextoGanancias}</small>
      </Link>
      <Link href="/viajes" className="driver-metric-link" aria-label={`Ver detalle: ${trasladosTexto} traslados. ${subtextoTraslados}`}>
        <span>Traslados hoy</span>
        <strong>{trasladosTexto}</strong>
        <small>{subtextoTraslados}</small>
      </Link>
    </section>
  );
}
