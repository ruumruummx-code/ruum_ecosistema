"use client";

import { NativeSelect as BaseSelect, Input as BaseInput, Button as BaseButton } from "@ruum/ui/base";
import { labelGasto, type GastoData } from "./cierre-types";

interface CierreGastosSectionProps {
  writable: boolean;
  gastos: GastoData[];
  tipoGasto: GastoData["tipo"];
  setTipoGasto: (t: GastoData["tipo"]) => void;
  montoGasto: string;
  setMontoGasto: (m: string) => void;
  descGasto: string;
  setDescGasto: (d: string) => void;
  comprobanteArchivo: File | null;
  setComprobanteArchivo: (f: File | null) => void;
  procesando: boolean;
  onAgregarGasto: (e: React.FormEvent) => void;
  onEliminarGasto: (id: string) => void;
  onVerComprobante: (gastoId: string, ruta: string) => void;
  resolviendoGastoId: string | null;
}

export function CierreGastosSection({
  writable,
  gastos,
  tipoGasto,
  setTipoGasto,
  montoGasto,
  setMontoGasto,
  descGasto,
  setDescGasto,
  comprobanteArchivo,
  setComprobanteArchivo,
  procesando,
  onAgregarGasto,
  onEliminarGasto,
  onVerComprobante,
  resolviendoGastoId,
}: CierreGastosSectionProps) {
  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);

  return (
    <section className="mt-6 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-md bg-ui-brand/15 border border-ui-brand/30 text-ui-brand flex items-center justify-center font-display text-xs font-bold">
          2
        </span>
        <h2 className="font-display text-xs font-black text-ui-fg-muted tracking-widest uppercase">
          GASTOS DEL TRASLADO
        </h2>
      </div>

      {/* Formulario de Registro de Gastos */}
      {writable && (
        <form
          onSubmit={onAgregarGasto}
          className="bg-ui-muted border border-ui-line/25 shadow-md rounded-lg p-4.5 flex flex-col gap-3.5"
        >
          <div className="flex items-center gap-1.5 border-b border-ui-line/15 pb-2">
            <span className="text-sm">💵</span>
            <span className="font-display text-xs font-bold text-ui-fg">Registrar Nuevo Gasto</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="tipo_gasto"
                className="font-display text-xs font-black text-ui-fg-muted tracking-widest uppercase pl-0.5"
              >
                Tipo de Gasto
              </label>
              <BaseSelect
                id="tipo_gasto"
                value={tipoGasto}
                onChange={(e) => setTipoGasto(e.target.value as GastoData["tipo"])}
                className="w-full bg-ui-card border border-ui-line/40 rounded-xl px-3 py-2 text-xs font-body text-ui-fg outline-hidden focus:border-ui-brand transition-colors font-inherit h-11 select-none cursor-pointer"
              >
                <option value="caseta">Caseta</option>
                <option value="combustible">Gasolina</option>
                <option value="maniobra">Maniobra</option>
                <option value="estadia">Estadía</option>
                <option value="penalizacion">Penalización</option>
                <option value="otro">Otro</option>
              </BaseSelect>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="monto_gasto"
                className="font-display text-xs font-black text-ui-fg-muted tracking-widest uppercase pl-0.5"
              >
                Monto ($)
              </label>
              <BaseInput
                id="monto_gasto"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={montoGasto}
                onChange={(e) => setMontoGasto(e.target.value)}
                required
                className="w-full bg-ui-card border border-ui-line/40 rounded-xl px-3 py-2 text-xs font-body text-ui-fg outline-hidden focus:border-ui-brand transition-colors font-inherit h-11 font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="descripcion_gasto"
              className="font-display text-xs font-black text-ui-fg-muted tracking-widest uppercase pl-0.5"
            >
              Descripción / Concepto
            </label>
            <BaseInput
              id="descripcion_gasto"
              type="text"
              placeholder="Ej. Caseta México-Querétaro"
              value={descGasto}
              onChange={(e) => setDescGasto(e.target.value)}
              className="w-full bg-ui-card border border-ui-line/40 rounded-xl px-3 py-2 text-xs font-body text-ui-fg outline-hidden focus:border-ui-brand transition-colors font-inherit h-11"
            />
          </div>

          {/* Botón de Subida de Ticket */}
          <div className="flex flex-col gap-1.5">
            <span className="font-display text-xs font-black text-ui-fg-muted tracking-widest uppercase pl-0.5">
              Ticket / Comprobante (Obligatorio para Gasolina y Casetas)
            </span>
            <label
              htmlFor="comprobante_upload"
              className={`w-full min-h-[56px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-3 text-xs font-body cursor-pointer select-none transition-all touch-manipulation active:scale-[0.99] ${
                comprobanteArchivo
                  ? "border-ui-success/60 bg-ui-success/10 text-ui-success font-bold"
                  : "border-ui-brand/40 bg-ui-card hover:bg-ui-muted text-ui-fg-muted hover:border-ui-brand"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setComprobanteArchivo(e.target.files?.[0] || null)}
                className="hidden"
                id="comprobante_upload"
              />
              <div className="flex items-center gap-2">
                <span className="text-xl">📷</span>
                <span className="font-bold text-xs">
                  {comprobanteArchivo
                    ? `✓ ${comprobanteArchivo.name.slice(0, 26)}...`
                    : "Toca para adjuntar foto del ticket"}
                </span>
              </div>
              {!comprobanteArchivo && (
                <span className="text-xs text-ui-fg-muted mt-0.5">
                  Soporta JPG, PNG y fotos directas de cámara
                </span>
              )}
            </label>
            {comprobanteArchivo && (
              <BaseButton variant="ghost"
                type="button"
                onClick={() => setComprobanteArchivo(null)}
                className="text-ui-danger hover:text-ui-danger font-bold text-xs cursor-pointer bg-transparent border-none text-left pl-1"
              >
                ✕ Quitar ticket adjunto
              </BaseButton>
            )}
          </div>

          <BaseButton variant="ghost"
            type="submit"
            disabled={procesando}
            className="w-full min-h-[46px] rounded-xl bg-ui-brand/15 hover:bg-ui-brand hover:text-ui-on-brand border border-ui-brand/40 text-ui-brand font-display text-xs font-black tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none shadow-xs mt-1 active:scale-98"
          >
            + REGISTRAR GASTO
          </BaseButton>
        </form>
      )}

      {/* Tabla / Lista Separada de Gastos Guardados */}
      <div className="bg-ui-muted border border-ui-line/20 rounded-lg overflow-hidden text-xs font-body shadow-xs">
        <div className="grid grid-cols-12 bg-ui-card border-b border-ui-line/15 p-3 font-bold text-ui-fg-muted text-xs tracking-wider font-display uppercase">
          <span className="col-span-4">Concepto</span>
          <span className="col-span-3 text-center">Tipo</span>
          <span className="col-span-3 text-right">Monto</span>
          <span className="col-span-2" />
        </div>

        {gastos.length === 0 ? (
          <div className="p-6 text-center text-ui-fg-muted italic">
            No hay gastos registrados en este traslado.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-ui-line/10">
            {gastos.map((g) => (
              <div key={g.id} className="grid grid-cols-12 p-3 items-center">
                <div className="col-span-4 flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-ui-fg truncate">
                      {g.descripcion || "Sin descripción"}
                    </span>
                    {g.comprobante_ruta && (
                      <BaseButton variant="ghost"
                        type="button"
                        onClick={() => onVerComprobante(g.id, g.comprobante_ruta!)}
                        disabled={resolviendoGastoId === g.id}
                        className="inline-flex items-center gap-0.5 text-xs text-ui-brand font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0 shrink-0"
                        title="Ver ticket adjunto (enlace seguro temporal)"
                      >
                        <span>{resolviendoGastoId === g.id ? "⏳" : "📎 Ticket"}</span>
                      </BaseButton>
                    )}
                  </div>
                  <span className="text-xs text-ui-fg-muted font-mono">
                    {new Date(g.registrado_en).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <span className="col-span-3 text-center font-bold text-ui-fg-muted">
                  {labelGasto(g.tipo)}
                </span>
                <span className="col-span-3 text-right font-bold text-ui-fg font-mono">
                  ${g.monto.toFixed(2)}
                </span>
                <div className="col-span-2 text-right">
                  {writable && (
                    <BaseButton variant="ghost"
                      type="button"
                      onClick={() => onEliminarGasto(g.id)}
                      disabled={procesando}
                      className="text-ui-danger hover:text-ui-danger font-extrabold text-xs px-2.5 py-1 cursor-pointer bg-transparent border-none outline-hidden"
                      title="Eliminar gasto"
                    >
                      ✕
                    </BaseButton>
                  )}
                </div>
              </div>
            ))}

            <div className="grid grid-cols-12 p-3.5 bg-ui-card font-bold items-center border-t border-ui-line/15">
              <span className="col-span-7 font-display text-xs font-black text-ui-fg-muted tracking-widest uppercase">
                Total Gastos Registrados
              </span>
              <span className="col-span-3 text-right font-display text-sm font-black text-ui-fg font-mono">
                ${totalGastos.toFixed(2)}
              </span>
              <span className="col-span-2" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
