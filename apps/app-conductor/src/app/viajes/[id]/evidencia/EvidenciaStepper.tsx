"use client";

interface EvidenciaStepperProps {
  fotosObligCapturadas: number;
  fotosObligatorias: number;
  kilometraje: string;
  llavesCount: number;
  docsCapturados: number;
  notas: string;
  onIrAFotos: () => void;
}

export function EvidenciaStepper({
  fotosObligCapturadas,
  fotosObligatorias,
  kilometraje,
  llavesCount,
  docsCapturados,
  notas,
  onIrAFotos
}: EvidenciaStepperProps) {
  const pasos = [
    { id: "evid-fotos", label: "Fotos", sub: `${fotosObligCapturadas}/${fotosObligatorias}`, done: fotosObligCapturadas === fotosObligatorias },
    { id: "evid-km", label: "KM", sub: kilometraje.trim() ? "OK" : "Falta", done: Boolean(kilometraje.trim()) },
    { id: "evid-llaves", label: "Llaves", sub: `${llavesCount}`, done: true },
    { id: "evid-docs", label: "Docs", sub: `${docsCapturados}/5`, done: docsCapturados === 5 },
    { id: "evid-notas", label: "Notas", sub: notas.trim().length > 5 ? "OK" : "Opc.", done: true },
  ] as const;
  const pendientes = fotosObligatorias - fotosObligCapturadas;

  return (
    <>
      <nav aria-label="Pasos de evidencia" className="sticky top-[var(--conductor-sticky-action-top)] z-20 -mx-4 px-4 sm:-mx-6 sm:px-6 bg-ui-card/95 backdrop-blur supports-[backdrop-filter]:bg-ui-card/80 border-y border-ui-line/20 mt-6 -mb-2 py-2 overflow-x-auto scrollbar-none">
        <ol className="flex items-center gap-2 min-w-max">
          {pasos.map((p, idx) => (
            <li key={p.id} className="flex items-center gap-2">
              <a
                href={`#${p.id}`}
                aria-label={`${p.label}: ${p.sub}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(p.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 min-h-9 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-ui-brand ${p.done ? "bg-ui-brand/15 border-ui-brand/30 text-ui-brand" : "bg-ui-muted border-ui-line/30 text-ui-fg-muted hover:text-ui-fg"}`}
              >
                <span className={`flex size-5 items-center justify-center rounded-full text-xs font-black ${p.done ? "bg-ui-brand text-ui-fg-muted" : "bg-ui-card border border-ui-line/30 text-ui-fg-muted"}`}>
                  {p.done ? "✓" : idx + 1}
                </span>
                <span>{p.label}</span>
                <span className="text-xs tabular-nums">{p.sub}</span>
              </a>
              {idx < pasos.length - 1 && <span className="h-px w-4 bg-ui-line/30 hidden sm:block" aria-hidden />}
            </li>
          ))}
        </ol>
      </nav>
      {pendientes > 0 && (
        <div className="mt-3 rounded-xl border border-ui-warning/20 bg-ui-warning/10 px-3 py-2 flex items-center justify-between">
          <span className="font-body text-xs font-semibold text-ui-warning ">Faltan {pendientes} fotos obligatorias</span>
          <a href="#evid-fotos" onClick={(e) => { e.preventDefault(); document.getElementById("evid-fotos")?.scrollIntoView({ behavior: "smooth" }); }} className="font-body text-xs font-bold text-ui-warning  hover:underline">
            Ir a fotos →
          </a>
        </div>
      )}
    </>
  );
}
