"use client";

import { Button as BaseButton } from "@ruum/ui/base";
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
    <div className="bg-ui-muted rounded-xl border border-ui-line/20 p-5 shadow-sm relative flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm text-ui-fg-muted font-extrabold uppercase tracking-normal">
            Unidad a trasladar
          </span>
          <span className="font-display text-lg font-black text-ui-fg mt-0.5">
            {vehiculo}
          </span>
        </div>
        <div className="border border-ui-line/60 bg-ui-card px-3 py-1.5 rounded-xl shadow-xs">
          <span className="font-mono text-sm font-black tracking-normal text-ui-fg">
            {placas}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mt-1">
        {/* 1. Placas */}
        <div className="flex flex-col bg-ui-card p-3 rounded-xl border border-ui-line/15">
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm text-ui-fg-muted font-bold uppercase tracking-normal">
              Placas
            </span>
            <BaseButton variant="ghost"
              type="button"
              onClick={() => {
                copiar(placas);
                setCopiado("placas");
                setTimeout(() => setCopiado(null), 1200);
              }}
              className="text-sm font-bold text-ui-brand hover:underline focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-offset-1 focus-visible:outline-ui-brand rounded px-1 -mx-1 min-h-12"
            >
              {copiado === "placas" ? "Copiado ✓" : "Copiar"}
            </BaseButton>
          </div>
          <span className="font-mono text-sm font-black mt-0.5 text-ui-fg">
            {placas}
          </span>
        </div>

        {/* 2. Número VIN */}
        <div className="flex flex-col bg-ui-card p-3 rounded-xl border border-ui-line/15">
          <div className="flex items-center justify-between gap-1">
            <span className="text-sm text-ui-fg-muted font-bold uppercase tracking-normal">
              Número VIN
            </span>
            <BaseButton variant="ghost"
              type="button"
              onClick={() => {
                copiar(vin);
                setCopiado("vin");
                setTimeout(() => setCopiado(null), 1200);
              }}
              className="text-sm font-bold text-ui-brand hover:underline focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-offset-1 focus-visible:outline-ui-brand rounded px-1 -mx-1 min-h-12"
            >
              {copiado === "vin" ? "Copiado ✓" : "Copiar"}
            </BaseButton>
          </div>
          <span className="font-mono text-sm font-black mt-0.5 text-ui-fg break-words" title={vin}>
            {vin}
          </span>
        </div>

        {/* 3. Marca */}
        <div className="flex flex-col bg-ui-card p-3 rounded-xl border border-ui-line/15">
          <span className="text-sm text-ui-fg-muted font-bold uppercase tracking-normal">
            Marca
          </span>
          <span className="font-semibold text-sm mt-0.5 text-ui-fg">
            {marca}
          </span>
        </div>

        {/* 4. Modelo */}
        <div className="flex flex-col bg-ui-card p-3 rounded-xl border border-ui-line/15">
          <span className="text-sm text-ui-fg-muted font-bold uppercase tracking-normal">
            Modelo
          </span>
          <span className="font-semibold text-sm mt-0.5 text-ui-fg break-words" title={modelo}>
            {modelo}
          </span>
        </div>

        {/* 5. Año */}
        <div className="flex flex-col bg-ui-card p-3 rounded-xl border border-ui-line/15">
          <span className="text-sm text-ui-fg-muted font-bold uppercase tracking-normal">
            Año
          </span>
          <span className="font-semibold text-sm mt-0.5 text-ui-fg tabular-nums">
            {anio}
          </span>
        </div>

        {/* 6. Color */}
        <div className="flex flex-col bg-ui-card p-3 rounded-xl border border-ui-line/15">
          <span className="text-sm text-ui-fg-muted font-bold uppercase tracking-normal">
            Color
          </span>
          <span className="font-semibold text-sm mt-0.5 text-ui-fg capitalize">
            {color}
          </span>
        </div>

        {/* 7. Categoría */}
        <div className="flex flex-col bg-ui-card p-3 rounded-xl border border-ui-line/15">
          <span className="text-sm text-ui-fg-muted font-bold uppercase tracking-normal">
            Categoría
          </span>
          <span className="font-semibold text-sm mt-0.5 text-ui-fg capitalize">
            {categoria}
          </span>
        </div>

        {/* 8. Gama */}
        <div className="flex flex-col bg-ui-card p-3 rounded-xl border border-ui-line/15">
          <span className="text-sm text-ui-fg-muted font-bold uppercase tracking-normal">
            Gama
          </span>
          <span className="font-semibold text-sm mt-0.5 text-ui-fg capitalize">
            {gama}
          </span>
        </div>

        {/* 9. Condición */}
        <div className="flex flex-col col-span-2 bg-ui-card p-3 rounded-xl border border-ui-line/15">
          <span className="text-sm text-ui-fg-muted font-bold uppercase tracking-normal">
            Condición
          </span>
          <span className="font-semibold text-sm mt-0.5 text-ui-fg">
            {condicion}
          </span>
        </div>

        {/* 10. Tipo Operativo */}
        <div className="flex flex-col col-span-2 bg-ui-card p-3 rounded-xl border border-ui-line/15">
          <span className="text-sm text-ui-fg-muted font-bold uppercase tracking-normal">
            Tipo Operativo
          </span>
          <span className="font-semibold text-sm mt-0.5 text-ui-fg">
            {tipoOperativo}
          </span>
        </div>

        {/* 11. Estado General de Recepción */}
        <div className="flex flex-col col-span-2 bg-ui-card p-3.5 rounded-xl border border-ui-line/15 gap-1">
          <span className="text-sm text-ui-fg-muted font-bold uppercase tracking-normal">
            Estado General de Recepción
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold ${
                estadoRecepcionTono === "success"
                  ? "bg-ui-success/15 text-ui-success  border border-ui-success/30"
                  : "bg-ui-warning/15 text-ui-warning border border-ui-warning/30"
              }`}
            >
              <span>{estadoRecepcionTono === "success" ? "✓" : "⏳"}</span>
              <span>{estadoRecepcionTexto}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-ui-line/20 my-1" />

      <div className="flex flex-col gap-2">
        <span className="text-sm text-ui-fg-muted font-bold uppercase tracking-normal">
          Garantía de Evidencia Ruum Ruum
        </span>
        <div className="p-3 bg-ui-card rounded-xl border border-ui-line/15 flex items-center gap-2.5">
          <span className="text-base">🛡️</span>
          <span className="text-sm text-ui-fg-muted leading-snug">
            Inspección 360° fotográfica obligatoria antes de iniciar y al concluir la entrega documentada.
          </span>
        </div>
      </div>
    </div>
  );
}
