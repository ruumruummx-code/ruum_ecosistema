import { ConductorButton as Button } from "@/components/v2/ConductorUI";
import type { FotoEvidencia } from "@ruum/shared/types";
import type { EvidenceRequirement } from "./evidence-requirements";
import { EvidencePreview } from "./EvidencePreview";

function VehicleSilhouette({ label }: { label: string }) {
  return (
    <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-lg border border-dashed border-ui-brand/55 bg-ui-muted">
      <div className="absolute inset-x-8 top-1/2 h-16 -translate-y-1/2 rounded-xl border-2 border-ui-brand/70" />
      <div className="absolute left-[25%] top-[calc(50%+22px)] size-8 rounded-full border-2 border-ui-brand/70 bg-ui-card" />
      <div className="absolute right-[25%] top-[calc(50%+22px)] size-8 rounded-full border-2 border-ui-brand/70 bg-ui-card" />
      <p className="relative max-w-[220px] text-center font-body text-sm font-semibold text-ui-brand">{label}</p>
    </div>
  );
}

export function EvidenceCaptureStep({
  item,
  step,
  total,
  foto,
  noAplica,
  busy,
  onCapture,
  onGallery,
  onNoAplica
}: {
  item: EvidenceRequirement;
  step: number;
  total: number;
  foto?: FotoEvidencia;
  noAplica: boolean;
  busy: boolean;
  onCapture: () => void;
  onGallery: () => void;
  onNoAplica: (checked: boolean) => void;
}) {
  return (
    <section className="border border-ui-line rounded-lg bg-ui-card p-6 shadow-ui-md mt-5 text-ui-fg">
      <p className="font-body text-sm font-semibold text-ui-brand">
        {step} de {total}
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold text-ui-fg">{item.titulo}</h2>
      <p className="mt-2 font-body text-base leading-7 text-ui-fg-muted">{item.instruccion}</p>
      <div className="mt-4">
        <VehicleSilhouette label={item.guia} />
      </div>
      <EvidencePreview foto={foto} onRepeat={onCapture} disabled={busy} />
      {item.permiteNoAplica && (
        <label className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-ui-line/24 bg-ui-muted px-3 py-2 font-body text-sm font-semibold text-ui-fg-muted">
          <input type="checkbox" checked={noAplica} onChange={(event) => onNoAplica(event.target.checked)} className="size-4 accent-ui-brand" />
          No aplica
        </label>
      )}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <Button onClick={onCapture} loading={busy}>
        {foto ? "Repetir foto" : "Tomar foto"}
      </Button>
      <Button variant="secondary" onClick={onGallery} loading={busy}>
          Elegir de galería
      </Button>
      </div>
    </section>
  );
}
