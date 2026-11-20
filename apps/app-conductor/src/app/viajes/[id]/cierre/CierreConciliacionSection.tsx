"use client";

import type { InspeccionData } from "./cierre-types";

interface CierreConciliacionSectionProps {
  inspeccionInicial: InspeccionData | null;
  inspeccionFinal: InspeccionData | null;
}

export function CierreConciliacionSection({
  inspeccionInicial,
  inspeccionFinal,
}: CierreConciliacionSectionProps) {
  const getKmDiff = () => {
    if (!inspeccionInicial?.kilometraje || !inspeccionFinal?.kilometraje) return null;
    return inspeccionFinal.kilometraje - inspeccionInicial.kilometraje;
  };

  const renderCombustible = (fuelText: string | null) => {
    if (!fuelText) return "No registrado";
    return fuelText;
  };

  return (
    <section className="mt-6 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-md bg-ui-success/10 border border-ui-success/30 text-ui-success flex items-center justify-center font-display text-xs font-bold">
          1
        </span>
        <h2 className="font-display text-xs font-black text-ui-fg-muted tracking-widest uppercase">
          CONCILIACIÓN DE EVIDENCIAS
        </h2>
      </div>

      <div className="bg-ui-muted border border-ui-line/20 rounded-lg overflow-hidden text-xs font-body shadow-xs">
        <div className="grid grid-cols-3 gap-2 bg-ui-card border-b border-ui-line/15 p-3 font-bold text-ui-fg-muted text-xs tracking-wider font-display uppercase">
          <span>Elemento</span>
          <span className="text-center">Origen (Inicial)</span>
          <span className="text-center">Entrega (Final)</span>
        </div>

        <div className="flex flex-col divide-y divide-ui-line/10">
          <div className="grid grid-cols-3 gap-2 p-3 items-center">
            <span className="font-bold text-ui-fg-muted">Kilometraje</span>
            <span className="text-center text-ui-fg font-bold font-mono">
              {inspeccionInicial?.kilometraje ? `${inspeccionInicial.kilometraje.toLocaleString("es-MX")} km` : "—"}
            </span>
            <span className="text-center text-ui-fg font-bold font-mono">
              {inspeccionFinal?.kilometraje ? `${inspeccionFinal.kilometraje.toLocaleString("es-MX")} km` : "—"}
            </span>
          </div>

          {getKmDiff() !== null && (
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-ui-muted items-center border-t border-b border-ui-line/30">
              <span className="font-bold text-ui-fg pl-1 text-xs">Distancia recorrida</span>
              <span />
              <span className="text-center text-ui-fg font-black font-display text-xs font-mono">
                +{getKmDiff()?.toLocaleString("es-MX")} km
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 p-3 items-center">
            <span className="font-bold text-ui-fg-muted">Gasolina (Nivel)</span>
            <span className="text-center text-ui-fg font-bold">
              {renderCombustible(inspeccionInicial?.combustible || null)}
            </span>
            <span className="text-center text-ui-fg font-bold">
              {renderCombustible(inspeccionFinal?.combustible || null)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 items-center">
            <span className="font-bold text-ui-fg-muted">Llaves</span>
            <span className="text-center text-ui-fg">
              {inspeccionInicial?.llaves_recibidas ? `${inspeccionInicial.llaves_recibidas} pz` : "—"}
            </span>
            <span className="text-center text-ui-fg">
              {inspeccionFinal?.llaves_recibidas ? `${inspeccionFinal.llaves_recibidas} pz` : "—"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 items-center">
            <span className="font-bold text-ui-fg-muted">Tarjeta Circulación</span>
            <span className="text-center text-ui-fg">
              {inspeccionInicial?.tarjeta_circulacion === "si" ? "Sí" : "No"}
            </span>
            <span className="text-center text-ui-fg">
              {inspeccionFinal?.tarjeta_circulacion === "si" ? "Sí" : "No"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 items-center">
            <span className="font-bold text-ui-fg-muted">Placa Delantera</span>
            <span className="text-center text-ui-fg">
              {inspeccionInicial?.placa_delantera === "si" ? "Sí" : "No"}
            </span>
            <span className="text-center text-ui-fg">
              {inspeccionFinal?.placa_delantera === "si" ? "Sí" : "No"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 items-center">
            <span className="font-bold text-ui-fg-muted">Placa Trasera</span>
            <span className="text-center text-ui-fg">
              {inspeccionInicial?.placa_trasera === "si" ? "Sí" : "No"}
            </span>
            <span className="text-center text-ui-fg">
              {inspeccionFinal?.placa_trasera === "si" ? "Sí" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Observaciones Comparison */}
      <div className="bg-ui-muted border border-ui-line/20 rounded-lg p-4 flex flex-col gap-3 text-xs font-body mt-1">
        {inspeccionInicial?.notas ? (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-ui-fg-muted text-xs tracking-wider font-display uppercase">
              Notas de Recolección (Origen)
            </span>
            <p className="text-ui-fg-muted leading-relaxed italic bg-ui-card p-3 rounded-xl border border-ui-line/10">
              {inspeccionInicial.notas}
            </p>
          </div>
        ) : null}
        {inspeccionFinal?.notas ? (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-ui-fg-muted text-xs tracking-wider font-display uppercase">
              Notas de Entrega (Destino)
            </span>
            <p className="text-ui-fg-muted leading-relaxed italic bg-ui-card p-3 rounded-xl border border-ui-line/10">
              {inspeccionFinal.notas}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-ui-fg-muted text-xs tracking-wider font-display uppercase">
              Notas de Entrega (Destino)
            </span>
            <p className="text-ui-fg-muted italic">Sin comentarios registrados al entregar.</p>
          </div>
        )}
      </div>
    </section>
  );
}
