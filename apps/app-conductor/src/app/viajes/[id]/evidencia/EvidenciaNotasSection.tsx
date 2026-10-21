"use client";

interface EvidenciaNotasSectionProps {
  tipo: string | null;
  notas: string;
  setNotas: (v: string) => void;
  presentaDanosNuevos: boolean;
  setPresentaDanosNuevos: (v: boolean) => void;
}

export function EvidenciaNotasSection({
  tipo,
  notas,
  setNotas,
  presentaDanosNuevos,
  setPresentaDanosNuevos
}: EvidenciaNotasSectionProps) {
  const tipoLabel = tipo === "inicial" ? "NOTAS DE RECOGIDA" : "NOTAS DE ENTREGA";
  const tipoDesc =
    tipo === "inicial"
      ? "Documenta cualquier detalle observado durante la recolección..."
      : "Detalla rayones, golpes nuevos o cualquier novedad respecto al punto de origen...";

  const quickTags = [
    "Rayón",
    "Golpe",
    "Mancha",
    "Sin llanta de refacción",
    "Parabrisas estrellado",
    "Asiento sucio",
    "Sin tapetes",
    "Rayón en fascia"
  ];

  return (
    <section id="evid-notas" className="mt-6 flex flex-col rounded-2xl border border-border/30 bg-surface-elevated/20 overflow-hidden shadow-xs scroll-mt-20">
      <div className="w-full flex items-center justify-between p-4 bg-surface-elevated/40 text-left select-none">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-lg bg-route-action/15 border border-route-action/30 text-route-action flex items-center justify-center font-display text-xs font-black">
            5
          </span>
          <div className="flex flex-col">
            <h2 className="font-display text-xs font-black text-text-primary tracking-widest uppercase">
              {tipoLabel}
            </h2>
            <span className="font-body text-[11px] text-text-tertiary">
              {notas.trim().length > 0 ? "Comentarios capturados" : "Observaciones y atajos rápidos"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {notas.trim().length > 5 ? (
            <span className="font-display text-[10px] font-black px-2.5 py-1 rounded-md tracking-wide bg-signal/15 text-route-action border border-signal/25">
              ✓ REGISTRADO
            </span>
          ) : (
            <span className="font-display text-[10px] font-bold text-text-tertiary px-2 py-0.5 rounded-md bg-surface border border-border/30">
              OPCIONAL
            </span>
          )}
          <span className="flex size-6 items-center justify-center rounded-full bg-surface border border-border/30 text-[11px] font-black text-text-tertiary" aria-hidden>
            {notas.trim().length > 5 ? "✓" : "•"}
          </span>
        </div>
      </div>

      <div className="p-4 border-t border-border/20 flex flex-col gap-3">
        {tipo === "final" && (
          <div className="bg-surface-elevated/25 border border-border/20 rounded-2xl p-4 flex flex-col gap-3 mb-2">
            <div className="flex justify-between items-center">
              <span className="font-body text-xs font-bold text-text-primary">
                ¿Presenta daños nuevos respecto al Origen?
              </span>
              <button
                type="button"
                onClick={() => setPresentaDanosNuevos(!presentaDanosNuevos)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  presentaDanosNuevos ? "bg-signal" : "bg-border/40"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    presentaDanosNuevos ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {presentaDanosNuevos && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex flex-col gap-1.5 text-[11px] font-body text-amber-800 dark:text-amber-300 leading-relaxed">
                <span className="font-bold flex items-center gap-1">
                  ⚠️ SUGERENCIA DE REGISTRO FOTOGRÁFICO:
                </span>
                <p>
                  Se recomienda capturar fotos a detalle de la incidencia usando las opciones de subida de arriba (sección 1) y documentar claramente en las notas de abajo:
                </p>
                <ul className="list-disc pl-4 flex flex-col gap-1 font-medium mt-1 text-text-secondary">
                  <li>Fotografía en primer plano del rayón, abolladura o daño nuevo.</li>
                  <li>Fotografía de contexto que muestre la zona del vehículo afectada.</li>
                  <li>Detalla en el cuadro de texto los hallazgos y especifica el daño.</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Quick Tags Pills */}
        <div className="flex flex-col gap-1.5 my-1">
          <span className="font-display text-[9px] font-extrabold text-text-tertiary uppercase tracking-wider">
            Atajos de observaciones (toca para insertar):
          </span>
          <div className="flex flex-wrap gap-1.5 select-none">
            {quickTags.map((etiqueta) => (
              <button
                key={etiqueta}
                type="button"
                onClick={() => {
                  const trimmed = notas.trim();
                  setNotas(!trimmed ? `[${etiqueta}]` : `${trimmed}, [${etiqueta}]`);
                }}
                className="px-2.5 py-1 rounded-lg bg-surface-elevated/60 border border-border/30 hover:border-route-action text-text-secondary hover:text-text-primary hover:bg-surface-elevated font-body text-[11px] font-bold transition-all cursor-pointer active:scale-95"
              >
                + {etiqueta}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={4}
          placeholder={tipoDesc}
          className={`w-full border rounded-2xl p-4.5 text-xs font-body text-text-secondary leading-relaxed outline-hidden transition-all font-inherit ${
            notas.trim().length > 5
              ? "border-signal/40 bg-signal/5 focus:border-signal/60"
              : "border-border/30 bg-surface-elevated/20 focus:border-route-action/50"
          }`}
        />
      </div>
    </section>
  );
}
