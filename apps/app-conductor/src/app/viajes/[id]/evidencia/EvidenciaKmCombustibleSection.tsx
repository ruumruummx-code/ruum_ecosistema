"use client";

interface EvidenciaKmCombustibleSectionProps {
  kilometraje: string;
  setKilometraje: (v: string) => void;
  gasolinaSegments: number;
  setGasolinaSegments: (v: number) => void;
  getFuelText: (segments: number) => string;
}

export function EvidenciaKmCombustibleSection({
  kilometraje,
  setKilometraje,
  gasolinaSegments,
  setGasolinaSegments,
  getFuelText
}: EvidenciaKmCombustibleSectionProps) {
  return (
    <section id="evid-km" className="mt-8 flex flex-col gap-3 scroll-mt-20">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-md bg-surface-elevated text-text-secondary flex items-center justify-center font-display text-[10px] font-bold">
          2
        </span>
        <h2 className="font-display text-xs font-black text-text-tertiary tracking-widest uppercase">
          KILOMETRAJE Y COMBUSTIBLE
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Kilometraje Actual */}
        <div className={`rounded-2xl border p-4.5 flex flex-col gap-2 transition-all ${
          kilometraje.trim().length > 0
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-border/30 bg-surface-elevated/20"
        }`}>
          <div className="flex justify-between items-center">
            <span className="font-display text-[9px] font-black text-text-tertiary tracking-wider uppercase">
              KILOMETRAJE ACTUAL
            </span>
            {kilometraje.trim().length > 0 && (
              <span className="font-display text-[8px] font-extrabold text-emerald-400 uppercase tracking-wider">
                ✓ REGISTRADO
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              placeholder="0"
              aria-label="Kilometraje actual"
              value={kilometraje}
              onChange={(e) => setKilometraje(e.target.value.replace(/[^0-9,.\s]/g, ""))}
              className="font-display text-2xl font-black text-text-primary bg-transparent border-none outline-hidden p-0 w-24 max-w-full focus:outline-hidden placeholder:text-text-tertiary/60"
            />
            <span className="font-body text-[10px] font-bold text-text-secondary">km</span>
          </div>
        </div>

        {/* Nivel de Gasolina */}
        <div className={`rounded-2xl border p-4.5 flex flex-col gap-2 transition-all ${
          gasolinaSegments > 0
            ? "border-emerald-500/40 bg-emerald-500/5"
            : "border-border/30 bg-surface-elevated/20"
        }`}>
          <div className="flex justify-between items-center w-full">
            <span className="font-display text-[9px] font-black text-text-tertiary tracking-wider uppercase">
              NIVEL DE GASOLINA
            </span>
            <div className="flex items-center gap-1.5">
              {gasolinaSegments > 0 && (
                <span className="font-display text-[8px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  ✓ REGISTRADO
                </span>
              )}
              <span className="font-body text-[8px] font-bold text-text-secondary">{getFuelText(gasolinaSegments)}</span>
            </div>
          </div>

          {/* Gasolina segments indicator (clickable) */}
          <div className="flex gap-0.5 mt-2.5 items-center">
            {Array.from({ length: 8 }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setGasolinaSegments(idx + 1)}
                aria-label={`Nivel ${idx + 1} de 8`}
                className={`flex-1 h-3 rounded-xs border-none cursor-pointer transition-all focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-offset-1 focus-visible:outline-signal ${
                  idx < gasolinaSegments ? "bg-signal" : "bg-border/30"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between items-center text-[7px] text-text-tertiary font-bold mt-1 px-0.5 select-none">
            <span>E</span>
            <span>¼</span>
            <span>½</span>
            <span>¾</span>
            <span>F</span>
          </div>
        </div>
      </div>
    </section>
  );
}
