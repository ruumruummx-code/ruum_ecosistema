"use client";

import { MapaEstatico } from "@ruum/ui";
import type { AnguloEvidencia, FotoEvidencia } from "@ruum/shared/types";

interface EvidenciaFotosSectionProps {
  fotos: FotoEvidencia[];
  capturar: (angulo: AnguloEvidencia) => void;
  obtenerFoto: (angulo: AnguloEvidencia) => FotoEvidencia | undefined;
  inputArchivoRef: React.RefObject<HTMLInputElement | null>;
  procesarArchivoSeleccionado: (archivo: File | undefined) => Promise<void>;
}

interface FotoEstado {
  angulo: AnguloEvidencia;
  capturada: boolean;
  src: string | null;
  sincronizada: boolean;
  label: string;
  esOpcional: boolean;
}

const ANGULOS: Array<{ angulo: AnguloEvidencia; label: string; esOpcional: boolean }> = [
  { angulo: "frente", label: "Frente", esOpcional: false },
  { angulo: "lado_piloto", label: "Lado piloto", esOpcional: false },
  { angulo: "lado_copiloto", label: "Lado copiloto", esOpcional: false },
  { angulo: "trasera", label: "Trasera", esOpcional: false },
  { angulo: "tablero", label: "Tablero", esOpcional: false },
  { angulo: "adicional", label: "Adicional", esOpcional: true }
];

export function EvidenciaFotosSection({
  fotos,
  capturar,
  obtenerFoto,
  inputArchivoRef,
  procesarArchivoSeleccionado
}: EvidenciaFotosSectionProps) {
  const fotosConEstado: FotoEstado[] = ANGULOS.map(({ angulo, label, esOpcional }) => {
    const foto = obtenerFoto(angulo);
    const capturada = Boolean(foto);
    const src = foto ? fotoSrc(foto) : null;
    const sincronizada = foto?.sincronizada ?? true;
    return { angulo, capturada, src, sincronizada, label, esOpcional };
  });

  return (
    <section id="evid-fotos" className="mt-8 flex flex-col gap-3 scroll-mt-20">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-md bg-route-action/15 border border-route-action/30 text-route-action flex items-center justify-center font-display text-[10px] font-bold">
          1
        </span>
        <h2 className="font-display text-xs font-black text-text-tertiary tracking-widest uppercase">
          FOTOGRAFÍAS DEL VEHÍCULO
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {fotosConEstado.map((f) => {
          const src = f.src;
          return (
            <button
              key={f.angulo}
              type="button"
              onClick={() => capturar(f.angulo)}
              aria-label={f.capturada ? `${f.label} — foto capturada, toca para reemplazar` : `${f.label} — toca para capturar fotografía`}
              className={`relative rounded-xl border overflow-hidden flex flex-col items-center justify-center gap-1 aspect-square cursor-pointer transition-all select-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action ${
                f.capturada
                  ? f.sincronizada
                    ? "bg-surface-elevated border-signal/60"
                    : "bg-surface-elevated border-amber-500/50"
                  : "bg-surface-elevated/20 border-border/40 border-dashed hover:border-route-action"
              }`}
            >
              {src ? (
                <>
                  <MapaEstatico src={src} alt={`Foto ${f.label.toLowerCase()}`} className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" aria-hidden />
                  <span className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shadow-md ${f.sincronizada ? "bg-signal text-slate-950" : "bg-amber-500 text-white"}`}>
                    {f.sincronizada ? "✓" : "↻"}
                  </span>
                  <span className="relative mt-auto mb-1 rounded-full bg-black/55 px-2 py-0.5 font-body text-[9px] font-bold text-white backdrop-blur-sm">
                    {f.label} {f.esOpcional && <span className="font-normal opacity-80">(opc.)</span>}
                  </span>
                  <span className={`relative mb-1 rounded-full px-1.5 py-0.5 font-body text-[7px] font-bold tracking-wide ${f.sincronizada ? "bg-signal text-slate-950" : "bg-amber-500 text-white"}`}>
                    {f.sincronizada ? "SINCRONIZADA" : "PENDIENTE"}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xl" aria-hidden>
                    {f.esOpcional ? "+" : "📷"}
                  </span>
                  <span className="font-body text-[10px] font-bold text-text-secondary">
                    {f.label} {f.esOpcional && <span className="font-normal text-[8px] text-text-tertiary">(opc.)</span>}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <p className="font-body text-[11px] text-text-tertiary text-center">Toca para capturar · La miniatura aparece al instante · “PENDIENTE” se sincroniza sola</p>
      <div className="rounded-xl border border-route-action/20 bg-route-soft/50 p-3 flex gap-2.5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 text-route-action mt-0.5">
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2a7 7 0 0 0-4 12.7V16a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1.3A7 7 0 0 0 12 2z" />
        </svg>
        <div className="flex flex-col gap-1">
          <span className="font-display text-[11px] font-black text-route-action">Guía rápida 90s — silueta</span>
          <ul className="font-body text-[11px] leading-4 text-text-secondary list-disc pl-4 space-y-0.5">
            <li>
              <strong>Frente:</strong> defensa + placas centradas, a 1.5 m
            </li>
            <li>
              <strong>Lados:</strong> de espejo a defensa, deja aire alrededor de llantas
            </li>
            <li>
              <strong>Trasera:</strong> cajuela + defensa, placa legible
            </li>
            <li>
              <strong>Tablero:</strong> odómetro sin reflejo, luz natural — sostén firme
            </li>
          </ul>
          <span className="font-body text-[10px] text-text-tertiary">Si la foto sale borrosa u oscura, te avisamos antes de guardar para que reintentes al instante.</span>
        </div>
      </div>

      <input
        ref={inputArchivoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void procesarArchivoSeleccionado(e.target.files?.[0])}
      />
    </section>
  );
}

function fotoSrc(foto: FotoEvidencia): string | null {
  return foto?.url || (foto as unknown as { dataUrl?: string })?.dataUrl || null;
}
