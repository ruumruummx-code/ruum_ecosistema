"use client";

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
        <span className="w-5 h-5 rounded-md bg-route-action/15 border border-route-action/30 text-route-action flex items-center justify-center font-display text-[10px] font-bold">
          2
        </span>
        <h2 className="font-display text-xs font-black text-text-tertiary tracking-widest uppercase">
          GASTOS DEL TRASLADO
        </h2>
      </div>

      {/* Formulario de Registro de Gastos */}
      {writable && (
        <form
          onSubmit={onAgregarGasto}
          className="bg-surface-elevated border border-border/25 shadow-md rounded-2xl p-4.5 flex flex-col gap-3.5"
        >
          <div className="flex items-center gap-1.5 border-b border-border/15 pb-2">
            <span className="text-sm">💵</span>
            <span className="font-display text-xs font-bold text-text-primary">Registrar Nuevo Gasto</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="tipo_gasto"
                className="font-display text-[9px] font-black text-text-tertiary tracking-widest uppercase pl-0.5"
              >
                Tipo de Gasto
              </label>
              <select
                id="tipo_gasto"
                value={tipoGasto}
                onChange={(e) => setTipoGasto(e.target.value as GastoData["tipo"])}
                className="w-full bg-surface border border-border/40 rounded-xl px-3 py-2 text-xs font-body text-text-primary outline-hidden focus:border-route-action transition-colors font-inherit h-11 select-none cursor-pointer"
              >
                <option value="caseta">Caseta</option>
                <option value="combustible">Gasolina</option>
                <option value="maniobra">Maniobra</option>
                <option value="estadia">Estadía</option>
                <option value="penalizacion">Penalización</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="monto_gasto"
                className="font-display text-[9px] font-black text-text-tertiary tracking-widest uppercase pl-0.5"
              >
                Monto ($)
              </label>
              <input
                id="monto_gasto"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={montoGasto}
                onChange={(e) => setMontoGasto(e.target.value)}
                required
                className="w-full bg-surface border border-border/40 rounded-xl px-3 py-2 text-xs font-body text-text-primary outline-hidden focus:border-route-action transition-colors font-inherit h-11 font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="descripcion_gasto"
              className="font-display text-[9px] font-black text-text-tertiary tracking-widest uppercase pl-0.5"
            >
              Descripción / Concepto
            </label>
            <input
              id="descripcion_gasto"
              type="text"
              placeholder="Ej. Caseta México-Querétaro"
              value={descGasto}
              onChange={(e) => setDescGasto(e.target.value)}
              className="w-full bg-surface border border-border/40 rounded-xl px-3 py-2 text-xs font-body text-text-primary outline-hidden focus:border-route-action transition-colors font-inherit h-11"
            />
          </div>

          {/* Botón de Subida de Ticket */}
          <div className="flex flex-col gap-1.5">
            <span className="font-display text-[9px] font-black text-text-tertiary tracking-widest uppercase pl-0.5">
              Ticket / Comprobante (Obligatorio para Gasolina y Casetas)
            </span>
            <label
              htmlFor="comprobante_upload"
              className={`w-full min-h-[56px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-xs font-body cursor-pointer select-none transition-all touch-manipulation active:scale-[0.99] ${
                comprobanteArchivo
                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 font-bold"
                  : "border-route-action/40 bg-surface hover:bg-surface-elevated text-text-secondary hover:border-route-action"
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
                <span className="text-[10px] text-text-tertiary mt-0.5">
                  Soporta JPG, PNG y fotos directas de cámara
                </span>
              )}
            </label>
            {comprobanteArchivo && (
              <button
                type="button"
                onClick={() => setComprobanteArchivo(null)}
                className="text-red-400 hover:text-red-300 font-bold text-xs cursor-pointer bg-transparent border-none text-left pl-1"
              >
                ✕ Quitar ticket adjunto
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={procesando}
            className="w-full min-h-[46px] rounded-xl bg-route-action/15 hover:bg-route-action hover:text-white border border-route-action/40 text-route-action font-display text-xs font-black tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none shadow-xs mt-1 active:scale-98"
          >
            + REGISTRAR GASTO
          </button>
        </form>
      )}

      {/* Tabla / Lista Separada de Gastos Guardados */}
      <div className="bg-surface-elevated border border-border/20 rounded-2xl overflow-hidden text-xs font-body shadow-xs">
        <div className="grid grid-cols-12 bg-surface border-b border-border/15 p-3 font-bold text-text-tertiary text-[10px] tracking-wider font-display uppercase">
          <span className="col-span-4">Concepto</span>
          <span className="col-span-3 text-center">Tipo</span>
          <span className="col-span-3 text-right">Monto</span>
          <span className="col-span-2" />
        </div>

        {gastos.length === 0 ? (
          <div className="p-6 text-center text-text-tertiary italic">
            No hay gastos registrados en este traslado.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/10">
            {gastos.map((g) => (
              <div key={g.id} className="grid grid-cols-12 p-3 items-center">
                <div className="col-span-4 flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-text-primary truncate">
                      {g.descripcion || "Sin descripción"}
                    </span>
                    {g.comprobante_ruta && (
                      <button
                        type="button"
                        onClick={() => onVerComprobante(g.id, g.comprobante_ruta!)}
                        disabled={resolviendoGastoId === g.id}
                        className="inline-flex items-center gap-0.5 text-[9px] text-route-action font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0 shrink-0"
                        title="Ver ticket adjunto (enlace seguro temporal)"
                      >
                        <span>{resolviendoGastoId === g.id ? "⏳" : "📎 Ticket"}</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] text-text-tertiary font-mono">
                    {new Date(g.registrado_en).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <span className="col-span-3 text-center font-bold text-text-secondary">
                  {labelGasto(g.tipo)}
                </span>
                <span className="col-span-3 text-right font-bold text-text-primary font-mono">
                  ${g.monto.toFixed(2)}
                </span>
                <div className="col-span-2 text-right">
                  {writable && (
                    <button
                      type="button"
                      onClick={() => onEliminarGasto(g.id)}
                      disabled={procesando}
                      className="text-red-400 hover:text-red-500 font-extrabold text-[13px] px-2.5 py-1 cursor-pointer bg-transparent border-none outline-hidden"
                      title="Eliminar gasto"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="grid grid-cols-12 p-3.5 bg-surface font-bold items-center border-t border-border/15">
              <span className="col-span-7 font-display text-[10px] font-black text-text-tertiary tracking-widest uppercase">
                Total Gastos Registrados
              </span>
              <span className="col-span-3 text-right font-display text-sm font-black text-text-primary font-mono">
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
