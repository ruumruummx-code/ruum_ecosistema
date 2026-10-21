"use client";

interface EvidenciaDocumentosSectionProps {
  tarjetaCirculacion: string;
  setTarjetaCirculacion: (v: string) => void;
  talonVerificacion: string;
  setTalonVerificacion: (v: string) => void;
  hologramaVerificacion: string;
  setHologramaVerificacion: (v: string) => void;
  placaDelantera: string;
  setPlacaDelantera: (v: string) => void;
  placaTrasera: string;
  setPlacaTrasera: (v: string) => void;
  docsCapturados: number;
}

export function EvidenciaDocumentosSection({
  tarjetaCirculacion,
  setTarjetaCirculacion,
  talonVerificacion,
  setTalonVerificacion,
  hologramaVerificacion,
  setHologramaVerificacion,
  placaDelantera,
  setPlacaDelantera,
  placaTrasera,
  setPlacaTrasera,
  docsCapturados
}: EvidenciaDocumentosSectionProps) {
  const items = [
    {
      label: "Tarjeta de circulación",
      icon: "💳",
      value: tarjetaCirculacion,
      onChange: setTarjetaCirculacion
    },
    {
      label: "Talón de verificación",
      icon: "📄",
      value: talonVerificacion,
      onChange: setTalonVerificacion
    },
    {
      label: "Holograma de verificación",
      icon: "🔖",
      value: hologramaVerificacion,
      onChange: setHologramaVerificacion
    },
    {
      label: "Placa delantera",
      icon: "◽",
      value: placaDelantera,
      onChange: setPlacaDelantera
    },
    {
      label: "Placa trasera",
      icon: "◽",
      value: placaTrasera,
      onChange: setPlacaTrasera
    }
  ];

  const badgeClass = (val: string) =>
    val === "si"
      ? "bg-signal/15 text-route-action border border-signal/25"
      : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25";

  return (
    <section id="evid-docs" className="mt-8 flex flex-col rounded-2xl border border-border/30 bg-surface-elevated/20 overflow-hidden shadow-xs scroll-mt-20">
      <div className="w-full flex items-center justify-between p-4 bg-surface-elevated/40 text-left select-none">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-lg bg-surface-elevated border border-border/40 text-text-secondary flex items-center justify-center font-display text-xs font-black">
            4
          </span>
          <div className="flex flex-col">
            <h2 className="font-display text-xs font-black text-text-primary tracking-widest uppercase">
              DOCUMENTOS Y PLACAS
            </h2>
            <span className="font-body text-[11px] text-text-tertiary">
              {docsCapturados} de 5 elementos verificados
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`font-display text-[10px] font-black px-2.5 py-1 rounded-md tracking-wide ${
            docsCapturados === 5 ? "bg-signal/15 text-route-action border border-signal/25" : "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/25"
          }`}>
            {docsCapturados === 5 ? "✓ COMPLETADO" : `${docsCapturados}/5 VERIFICADOS`}
          </span>
          <span className="flex size-6 items-center justify-center rounded-full bg-surface border border-border/30 text-[11px] font-black text-text-tertiary" aria-hidden>
            {docsCapturados === 5 ? "✓" : "!"}
          </span>
        </div>
      </div>

      <div className="p-4 border-t border-border/20 flex flex-col gap-2.5 text-xs font-body text-text-secondary">
        {items.map((item) => (
          <label
            key={item.label}
            className="bg-surface-elevated/20 border border-border/20 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:border-route-action/40 transition-all select-none"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.value === "si"}
                onChange={(e) => item.onChange(e.target.checked ? "si" : "no")}
                className="w-5 h-5 rounded border-border/60 text-signal focus:ring-signal focus:ring-offset-2 cursor-pointer"
              />
              <span className="font-body text-sm font-semibold text-text-primary">{item.icon} {item.label}</span>
            </div>
            <span className={`font-display text-[10px] font-black px-2.5 py-1 rounded-md tracking-wide ${badgeClass(item.value)}`}>
              {item.value === "si" ? "✓ VERIFICADO" : "📋 PENDIENTE"}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
