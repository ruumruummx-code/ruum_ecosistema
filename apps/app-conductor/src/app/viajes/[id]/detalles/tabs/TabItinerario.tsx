"use client";

interface TabItinerarioProps {
  origenCiudad: string;
  origenDir: string;
  destinoCiudad: string;
  destinoDir: string;
  distancia: string;
  tiempoEstimado: string;
}

export function TabItinerario({
  origenCiudad,
  origenDir,
  destinoCiudad,
  destinoDir,
  distancia,
  tiempoEstimado,
}: TabItinerarioProps) {
  return (
    <div className="bg-surface-elevated rounded-3xl border border-border/20 p-5 shadow-sm relative flex flex-col gap-5">
      <div className="flex gap-4">
        <div className="flex flex-col items-center mt-1">
          <span className="h-3 w-3 rounded-full border-2 border-emerald-500 bg-transparent shrink-0" />
          <div className="w-[1px] h-10 bg-border/40 my-1" />
          <span className="h-3 w-3 rounded-full bg-route-action shrink-0 block" />
        </div>
        <div className="flex flex-col justify-between py-0.5 min-w-0">
          <div className="flex flex-col mb-3">
            <span className="font-display text-[9px] font-bold text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">
              PUNTO DE RECOLECCIÓN
            </span>
            <span className="font-display text-base font-black text-text-primary leading-tight mt-0.5">
              {origenCiudad}
            </span>
            <span className="font-body text-xs text-text-secondary mt-0.5 leading-snug">
              {origenDir}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-[9px] font-bold text-route-action tracking-widest uppercase">
              PUNTO DE ENTREGA
            </span>
            <span className="font-display text-base font-black text-text-primary leading-tight mt-0.5">
              {destinoCiudad}
            </span>
            <span className="font-body text-xs text-text-secondary mt-0.5 leading-snug">
              {destinoDir}
            </span>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-border/20 my-1" />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">
            Distancia estimada
          </span>
          <span className="font-display text-base font-black text-text-primary mt-0.5 tabular-nums">
            {distancia}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">
            Tiempo estimado
          </span>
          <span className="font-display text-base font-black text-text-primary mt-0.5 tabular-nums">
            {tiempoEstimado}
          </span>
        </div>
      </div>
    </div>
  );
}
