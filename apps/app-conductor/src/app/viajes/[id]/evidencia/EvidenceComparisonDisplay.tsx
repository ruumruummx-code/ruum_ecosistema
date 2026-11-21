import { Aviso } from "@ruum/ui";
import { ConductorButton as Button } from "@/components/v2/ConductorUI";
import type { ResultadosComparacion } from "./useEvidenceComparison";

import { ConductorIcon } from "@/components/icons";
export interface EvidenceComparisonDisplayProps {
  resultados: ResultadosComparacion | null;
  estaCargando: boolean;
  error: string | null;
  onRefresh?: () => void;
}

const ICONO_ALERTA = {
  critico: "warning",
  advertencia: "warning",
  info: "alert"
} as const;

const COLOR_ALERTA = {
  critico: "danger",
  advertencia: "atencion",
  info: "info"
} as const;

export function EvidenceComparisonDisplay({
  resultados,
  estaCargando,
  error,
  onRefresh
}: EvidenceComparisonDisplayProps) {
  if (estaCargando) {
    return (
      <div className="rounded-xl border border-ui-line bg-ui-card p-4" aria-busy="true">
        <p className="font-body text-sm text-ui-fg-muted">Cargando comparación de evidencia...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-ui-warning bg-ui-warning-soft p-4">
        <Aviso tono="atencion">{error}</Aviso>
        {onRefresh && (
          <Button variant="quiet" onClick={onRefresh} className="mt-3">
            Reintentar
          </Button>
        )}
      </div>
    );
  }

  if (!resultados) {
    return (
      <div className="rounded-xl border border-ui-line bg-ui-card p-4">
        <p className="font-body text-sm text-ui-fg-muted">No hay datos de comparación disponibles.</p>
      </div>
    );
  }

  const { kilometraje, llaves, combustible, documentos, alertas } = resultados;

  // Si no hay evidencia final, mostrar solo los valores iniciales como referencia
  const soloInicial = kilometraje.final === null && kilometraje.inicial !== null;

  return (
    <section className="rounded-xl border border-ui-line bg-ui-card p-4" aria-labelledby="comparacion-evidencia-titulo">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="comparacion-evidencia-titulo" className="font-body text-sm font-semibold text-ui-fg">
            {soloInicial ? "Datos de referencia (inicial)" : "Comparación: Inicial vs Final"}
          </h2>
          <p className="mt-1 font-body text-xs text-ui-fg-muted">
            {soloInicial 
              ? "Estos son los valores capturados al inicio del traslado"
              : "Valores capturados al inicio y final del traslado"
            }
          </p>
        </div>
      </div>

      {/* Alertas de discrepancias */}
      {alertas.length > 0 && (
        <div className="mt-4 grid gap-2">
          {alertas.map((alerta, index) => (
            <div key={index} className="flex items-start gap-2">
              <Aviso tono={COLOR_ALERTA[alerta.tipo]}>
                <span className="flex items-start gap-2">
                  <span aria-hidden="true"><ConductorIcon name={ICONO_ALERTA[alerta.tipo]} /></span>
                  <span>{alerta.mensaje}</span>
                </span>
              </Aviso>
            </div>
          ))}
        </div>
      )}

      {/* Comparación responsive: cards en móvil, tabla en desktop */}
      {/* Vista móvil - cards */}
      <div className="mt-4 grid gap-3 md:hidden">
        {/* Kilometraje */}
        <div className="rounded-xl border border-ui-line/20 bg-ui-muted p-3">
          <p className="font-body text-xs font-bold uppercase tracking-wide text-ui-fg-muted">Kilometraje</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-ui-card p-2.5 text-center">
              <p className="text-xs font-semibold uppercase text-ui-fg-muted">Inicial</p>
              <p className="mt-1 font-body text-sm font-semibold text-ui-fg">{kilometraje.inicial !== null ? `${kilometraje.inicial.toLocaleString()} km` : "-"}</p>
            </div>
            <div className={`rounded-lg p-2.5 text-center ${kilometraje.valido ? "bg-ui-card" : "bg-ui-danger-soft border border-ui-danger/20"}`}>
              <p className="text-xs font-semibold uppercase text-ui-fg-muted">Final</p>
              <p className={`mt-1 font-body text-sm font-semibold ${kilometraje.valido ? "text-ui-fg" : "text-ui-danger"}`}>{kilometraje.final !== null ? `${kilometraje.final.toLocaleString()} km` : "-"}</p>
            </div>
          </div>
          {kilometraje.diferencia !== null && (
            <p className="mt-2 text-center font-body text-xs font-semibold text-ui-fg-muted">
              Diferencia: {kilometraje.diferencia >= 0 ? `+${kilometraje.diferencia.toLocaleString()}` : `${kilometraje.diferencia.toLocaleString()}`} km
            </p>
          )}
        </div>
        {/* Llaves */}
        <div className="rounded-xl border border-ui-line/20 bg-ui-muted p-3">
          <p className="font-body text-xs font-bold uppercase tracking-wide text-ui-fg-muted">Llaves</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-ui-card p-2.5 text-center">
              <p className="text-xs font-semibold uppercase text-ui-fg-muted">Inicial</p>
              <p className="mt-1 font-body text-sm font-semibold text-ui-fg">{llaves.inicial ?? "-"}</p>
            </div>
            <div className={`rounded-lg p-2.5 text-center ${llaves.coincide ? "bg-ui-card" : "bg-ui-danger-soft border border-ui-danger/20"}`}>
              <p className="text-xs font-semibold uppercase text-ui-fg-muted">Final</p>
              <p className={`mt-1 font-body text-sm font-semibold ${llaves.coincide ? "text-ui-fg" : "text-ui-danger"}`}>{llaves.final ?? "-"}</p>
            </div>
          </div>
        </div>
        {/* Combustible */}
        <div className="rounded-xl border border-ui-line/20 bg-ui-muted p-3">
          <p className="font-body text-xs font-bold uppercase tracking-wide text-ui-fg-muted">Combustible</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-ui-card p-2.5 text-center">
              <p className="text-xs font-semibold uppercase text-ui-fg-muted">Inicial</p>
              <p className="mt-1 font-body text-sm font-semibold text-ui-fg">{combustible.inicial ?? "-"}</p>
            </div>
            <div className={`rounded-lg p-2.5 text-center ${combustible.coincide ? "bg-ui-card" : "bg-ui-warning-soft border border-ui-warning/20"}`}>
              <p className="text-xs font-semibold uppercase text-ui-fg-muted">Final</p>
              <p className={`mt-1 font-body text-sm font-semibold ${combustible.coincide ? "text-ui-fg" : "text-ui-warning"}`}>{combustible.final ?? "-"}</p>
            </div>
          </div>
        </div>
        {/* Documentos - móvil */}
        <div className="rounded-xl border border-ui-line/20 bg-ui-muted p-3">
          <p className="font-body text-xs font-bold uppercase tracking-wide text-ui-fg-muted">Documentos</p>
          <div className="mt-2 grid gap-2">
            {documentosClave.map((doc) => {
              const tieneInicial = documentos.inicial[doc];
              const tieneFinal = documentos.final[doc];
              const hayCambio = tieneInicial !== tieneFinal;
              return (
                <div key={doc} className="flex items-center justify-between gap-2 rounded-lg bg-ui-card px-3 py-2.5">
                  <span className="font-body text-xs font-medium text-ui-fg min-w-0 flex-1">{doc}</span>
                  <span className="flex items-center gap-3 shrink-0">
                    <span className="text-center min-w-[32px]">
                      <span className="block text-xs font-bold uppercase text-ui-fg-muted">Ini</span>
                      <span className="block text-sm">{tieneInicial ? "✓" : "✗"}</span>
                    </span>
                    <span className={`text-center min-w-[32px] ${hayCambio ? "text-ui-danger font-bold" : ""}`}>
                      <span className="block text-xs font-bold uppercase text-ui-fg-muted">Fin</span>
                      <span className="block text-sm">{tieneFinal ? "✓" : "✗"}</span>
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vista desktop - tabla */}
      <div className="mt-4 hidden md:block overflow-x-auto -mx-1">
        <table className="w-full min-w-[420px] table-fixed border-collapse font-body text-sm">
          <thead>
            <tr className="border-b border-ui-line/22">
              <th className="w-1/3 px-2 py-2 text-left font-semibold text-ui-fg-muted"></th>
              <th className="w-1/3 px-2 py-2 text-center font-semibold text-ui-fg-muted">Inicial</th>
              <th className="w-1/3 px-2 py-2 text-center font-semibold text-ui-fg-muted">Final</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-ui-line/22">
              <td className="px-2 py-2 font-body text-ui-fg">Kilometraje</td>
              <td className="px-2 py-2 text-center text-ui-fg">
                {kilometraje.inicial !== null ? `${kilometraje.inicial.toLocaleString()} km` : "-"}
              </td>
              <td className={`px-2 py-2 text-center ${kilometraje.valido ? "text-ui-fg" : "text-ui-danger font-semibold"}`}>
                {kilometraje.final !== null ? `${kilometraje.final.toLocaleString()} km` : "-"}
              </td>
            </tr>
            {kilometraje.diferencia !== null && (
              <tr className="border-b border-ui-line/22">
                <td className="px-2 py-2 font-body text-ui-fg-muted" colSpan={1}>Diferencia</td>
                <td className="px-2 py-2 text-center text-ui-fg-muted" colSpan={2}>
                  {kilometraje.diferencia >= 0 ? `+${kilometraje.diferencia.toLocaleString()}` : `${kilometraje.diferencia.toLocaleString()}`} km
                </td>
              </tr>
            )}
            <tr className="border-b border-ui-line/22">
              <td className="px-2 py-2 font-body text-ui-fg">Llaves</td>
              <td className="px-2 py-2 text-center text-ui-fg">{llaves.inicial ?? "-"}</td>
              <td className={`px-2 py-2 text-center ${llaves.coincide ? "text-ui-fg" : "text-ui-danger font-semibold"}`}>{llaves.final ?? "-"}</td>
            </tr>
            <tr className="border-b border-ui-line/22">
              <td className="px-2 py-2 font-body text-ui-fg">Combustible</td>
              <td className="px-2 py-2 text-center text-ui-fg">{combustible.inicial ?? "-"}</td>
              <td className={`px-2 py-2 text-center ${combustible.coincide ? "text-ui-fg" : "text-ui-warning font-semibold"}`}>{combustible.final ?? "-"}</td>
            </tr>
            {documentosClave.map((doc) => {
              const tieneInicial = documentos.inicial[doc];
              const tieneFinal = documentos.final[doc];
              const hayCambio = tieneInicial !== tieneFinal;
              return (
                <tr key={doc} className="border-b border-ui-line/22">
                  <td className="px-2 py-2 font-body text-ui-fg">{doc}</td>
                  <td className="px-2 py-2 text-center text-ui-fg">{tieneInicial ? "✓" : "✗"}</td>
                  <td className={`px-2 py-2 text-center ${hayCambio ? "text-ui-danger font-semibold" : "text-ui-fg"}`}>{tieneFinal ? "✓" : "✗"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Nota sobre la evidencia */}
      <p className="mt-4 text-xs text-ui-fg-muted">
        {soloInicial 
          ? "* Los valores finales se mostrarán una vez capturados"
          : "* Comparación generada automáticamente al completar ambos registros"
        }
      </p>
    </section>
  );
}

const documentosClave = [
  "Holograma de verificación",
  "Talón de verificación",
  "Tarjeta de circulación",
  "Placa delantera",
  "Placa trasera"
];
