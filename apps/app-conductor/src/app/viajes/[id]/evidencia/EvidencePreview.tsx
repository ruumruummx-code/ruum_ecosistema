import { MapaEstatico } from "@ruum/ui";
import { ConductorButton as Button } from "@/components/v2/ConductorUI";
import type { FotoEvidencia } from "@ruum/shared/types";
import { fotoSrc } from "./evidence-requirements";

function IconoCheck() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="M6 10.2 8.6 13 14.2 7" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function IconoReloj() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden>
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M10 5.8v4.6l3 1.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export function BadgeSincronizacion({ sincronizada }: { sincronizada: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        "font-body text-xs font-semibold",
        sincronizada ? "border-ui-success bg-ui-success-soft text-ui-success" : "border-ui-warning bg-ui-warning-soft text-ui-warning"
      ].join(" ")}
    >
      {sincronizada ? <IconoCheck /> : <IconoReloj />}
      {sincronizada ? "Sincronizada" : "Pendiente de subir"}
    </span>
  );
}

export function EvidencePreview({
  foto,
  onRepeat,
  disabled
}: {
  foto?: FotoEvidencia;
  onRepeat: () => void;
  disabled?: boolean;
}) {
  const src = fotoSrc(foto);
  if (!foto || !src) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-ui-line/24 bg-ui-muted">
      <div className="relative h-52 w-full">
        <MapaEstatico src={src} alt="Vista previa de la evidencia capturada" className="object-cover" />
      </div>
      <div className="flex items-center justify-between gap-3 px-3 py-3">
        <BadgeSincronizacion sincronizada={Boolean(foto.sincronizada)} />
        <Button variant="secondary" onClick={onRepeat} disabled={disabled}>
          Repetir
        </Button>
      </div>
    </div>
  );
}
