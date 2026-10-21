"use client";

interface TabVehiculoProps {
  vehiculo: string;
  placas: string;
  vin: string;
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  categoria: string;
  gama: string;
  condicion: string;
  tipoOperativo: string;
  estadoRecepcionTono: "warning" | "success";
  estadoRecepcionTexto: string;
  copiar: (texto: string) => void;
  copiado: string | null;
  setCopiado: (val: string | null) => void;
}

export function TabVehiculo({
  vehiculo,
  placas,
  vin,
  marca,
  modelo,
  anio,
  color,
  categoria,
  gama,
  condicion,
  tipoOperativo,
  estadoRecepcionTono,
  estadoRecepcionTexto,
  copiar,
  copiado,
  setCopiado,
}: TabVehiculoProps) {
  return (
    <div className="bg-surface-elevated rounded-3xl border border-border/20 p-5 shadow-sm relative flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-text-tertiary font-extrabold uppercase tracking-widest">
            Unidad a trasladar
          </span>
          <span className="font-display text-lg font-black text-text-primary mt-0.5">
            {vehiculo}
          </span>
        </div>
        <div className="border border-border/60 bg-surface px-3 py-1.5 rounded-xl shadow-xs">
          <span className="font-mono text-xs font-black tracking-widest text-text-primary">
            {placas}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-1">
        {/* 1. Placas */}
        <div className="flex flex-col bg-surface p-3 rounded-xl border border-border/15">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
              Placas
            </span>
            <button
              type="button"
              onClick={() => {
                copiar(placas);
                setCopiado("placas");
                setTimeout(() => setCopiado(null), 1200);
              }}
              className="text-[10px] font-bold text-route-action hover:underline focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-offset-1 focus-visible:outline-route-action rounded px-1 -mx-1 min-h-6"
            >
              {copiado === "placas" ? "Copiado ✓" : "Copiar"}
            </button>
          </div>
          <span className="font-mono text-xs font-black mt-0.5 text-text-primary">
            {placas}
          </span>
        </div>

        {/* 2. Número VIN */}
        <div className="flex flex-col bg-surface p-3 rounded-xl border border-border/15">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
              Número VIN
            </span>
            <button
              type="button"
              onClick={() => {
                copiar(vin);
                setCopiado("vin");
                setTimeout(() => setCopiado(null), 1200);
              }}
              className="text-[10px] font-bold text-route-action hover:underline focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-offset-1 focus-visible:outline-route-action rounded px-1 -mx-1 min-h-6"
            >
              {copiado === "vin" ? "Copiado ✓" : "Copiar"}
            </button>
          </div>
          <span className="font-mono text-xs font-black mt-0.5 text-text-primary truncate" title={vin}>
            {vin}
          </span>
        </div>

        {/* 3. Marca */}
        <div className="flex flex-col bg-surface p-3 rounded-xl border border-border/15">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Marca
          </span>
          <span className="font-semibold text-xs mt-0.5 text-text-primary">
            {marca}
          </span>
        </div>

        {/* 4. Modelo */}
        <div className="flex flex-col bg-surface p-3 rounded-xl border border-border/15">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Modelo
          </span>
          <span className="font-semibold text-xs mt-0.5 text-text-primary truncate" title={modelo}>
            {modelo}
          </span>
        </div>

        {/* 5. Año */}
        <div className="flex flex-col bg-surface p-3 rounded-xl border border-border/15">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Año
          </span>
          <span className="font-semibold text-xs mt-0.5 text-text-primary tabular-nums">
            {anio}
          </span>
        </div>

        {/* 6. Color */}
        <div className="flex flex-col bg-surface p-3 rounded-xl border border-border/15">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Color
          </span>
          <span className="font-semibold text-xs mt-0.5 text-text-primary capitalize">
            {color}
          </span>
        </div>

        {/* 7. Categoría */}
        <div className="flex flex-col bg-surface p-3 rounded-xl border border-border/15">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Categoría
          </span>
          <span className="font-semibold text-xs mt-0.5 text-text-primary capitalize">
            {categoria}
          </span>
        </div>

        {/* 8. Gama */}
        <div className="flex flex-col bg-surface p-3 rounded-xl border border-border/15">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Gama
          </span>
          <span className="font-semibold text-xs mt-0.5 text-text-primary capitalize">
            {gama}
          </span>
        </div>

        {/* 9. Condición */}
        <div className="flex flex-col col-span-2 bg-surface p-3 rounded-xl border border-border/15">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Condición
          </span>
          <span className="font-semibold text-xs mt-0.5 text-text-primary">
            {condicion}
          </span>
        </div>

        {/* 10. Tipo Operativo */}
        <div className="flex flex-col col-span-2 bg-surface p-3 rounded-xl border border-border/15">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Tipo Operativo
          </span>
          <span className="font-semibold text-xs mt-0.5 text-text-primary">
            {tipoOperativo}
          </span>
        </div>

        {/* 11. Estado General de Recepción */}
        <div className="flex flex-col col-span-2 bg-surface p-3.5 rounded-xl border border-border/15 gap-1">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Estado General de Recepción
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                estadoRecepcionTono === "success"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-warning/15 text-warning border border-warning/30"
              }`}
            >
              <span>{estadoRecepcionTono === "success" ? "✓" : "⏳"}</span>
              <span>{estadoRecepcionTexto}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-border/20 my-1" />

      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">
          Garantía de Evidencia Ruum Ruum
        </span>
        <div className="p-3 bg-surface rounded-xl border border-border/15 flex items-center gap-2.5">
          <span className="text-base">🛡️</span>
          <span className="text-[11px] text-text-secondary leading-snug">
            Inspección 360° fotográfica obligatoria antes de iniciar y al concluir la entrega documentada.
          </span>
        </div>
      </div>
    </div>
  );
}
