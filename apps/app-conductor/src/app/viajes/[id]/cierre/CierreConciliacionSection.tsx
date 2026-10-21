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
        <span className="w-5 h-5 rounded-md bg-success/10 border border-success/30 text-success flex items-center justify-center font-display text-[10px] font-bold">
          1
        </span>
        <h2 className="font-display text-xs font-black text-text-tertiary tracking-widest uppercase">
          CONCILIACIÓN DE EVIDENCIAS
        </h2>
      </div>

      <div className="bg-surface-elevated border border-border/20 rounded-2xl overflow-hidden text-xs font-body shadow-xs">
        <div className="grid grid-cols-3 gap-2 bg-surface border-b border-border/15 p-3 font-bold text-text-tertiary text-[10px] tracking-wider font-display uppercase">
          <span>Elemento</span>
          <span className="text-center">Origen (Inicial)</span>
          <span className="text-center">Entrega (Final)</span>
        </div>

        <div className="flex flex-col divide-y divide-border/10">
          <div className="grid grid-cols-3 gap-2 p-3 items-center">
            <span className="font-bold text-text-secondary">Kilometraje</span>
            <span className="text-center text-text-primary font-bold font-mono">
              {inspeccionInicial?.kilometraje ? `${inspeccionInicial.kilometraje.toLocaleString("es-MX")} km` : "—"}
            </span>
            <span className="text-center text-text-primary font-bold font-mono">
              {inspeccionFinal?.kilometraje ? `${inspeccionFinal.kilometraje.toLocaleString("es-MX")} km` : "—"}
            </span>
          </div>

          {getKmDiff() !== null && (
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-surface-elevated items-center border-t border-b border-border/30">
              <span className="font-bold text-text-primary pl-1 text-[11px]">Distancia recorrida</span>
              <span />
              <span className="text-center text-text-primary font-black font-display text-[13px] font-mono">
                +{getKmDiff()?.toLocaleString("es-MX")} km
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 p-3 items-center">
            <span className="font-bold text-text-secondary">Gasolina (Nivel)</span>
            <span className="text-center text-text-primary font-bold">
              {renderCombustible(inspeccionInicial?.combustible || null)}
            </span>
            <span className="text-center text-text-primary font-bold">
              {renderCombustible(inspeccionFinal?.combustible || null)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 items-center">
            <span className="font-bold text-text-secondary">Llaves</span>
            <span className="text-center text-text-primary">
              {inspeccionInicial?.llaves_recibidas ? `${inspeccionInicial.llaves_recibidas} pz` : "—"}
            </span>
            <span className="text-center text-text-primary">
              {inspeccionFinal?.llaves_recibidas ? `${inspeccionFinal.llaves_recibidas} pz` : "—"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 items-center">
            <span className="font-bold text-text-secondary">Tarjeta Circulación</span>
            <span className="text-center text-text-primary">
              {inspeccionInicial?.tarjeta_circulacion === "si" ? "Sí" : "No"}
            </span>
            <span className="text-center text-text-primary">
              {inspeccionFinal?.tarjeta_circulacion === "si" ? "Sí" : "No"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 items-center">
            <span className="font-bold text-text-secondary">Placa Delantera</span>
            <span className="text-center text-text-primary">
              {inspeccionInicial?.placa_delantera === "si" ? "Sí" : "No"}
            </span>
            <span className="text-center text-text-primary">
              {inspeccionFinal?.placa_delantera === "si" ? "Sí" : "No"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 items-center">
            <span className="font-bold text-text-secondary">Placa Trasera</span>
            <span className="text-center text-text-primary">
              {inspeccionInicial?.placa_trasera === "si" ? "Sí" : "No"}
            </span>
            <span className="text-center text-text-primary">
              {inspeccionFinal?.placa_trasera === "si" ? "Sí" : "No"}
            </span>
          </div>
        </div>
      </div>

      {/* Observaciones Comparison */}
      <div className="bg-surface-elevated border border-border/20 rounded-2xl p-4 flex flex-col gap-3 text-xs font-body mt-1">
        {inspeccionInicial?.notas ? (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-text-tertiary text-[10px] tracking-wider font-display uppercase">
              Notas de Recolección (Origen)
            </span>
            <p className="text-text-secondary leading-relaxed italic bg-surface p-3 rounded-xl border border-border/10">
              {inspeccionInicial.notas}
            </p>
          </div>
        ) : null}
        {inspeccionFinal?.notas ? (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-text-tertiary text-[10px] tracking-wider font-display uppercase">
              Notas de Entrega (Destino)
            </span>
            <p className="text-text-secondary leading-relaxed italic bg-surface p-3 rounded-xl border border-border/10">
              {inspeccionFinal.notas}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-text-tertiary text-[10px] tracking-wider font-display uppercase">
              Notas de Entrega (Destino)
            </span>
            <p className="text-text-tertiary italic">Sin comentarios registrados al entregar.</p>
          </div>
        )}
      </div>
    </section>
  );
}
