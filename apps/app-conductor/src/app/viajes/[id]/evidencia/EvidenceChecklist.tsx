"use client";
import { Button as BaseButton } from "@ruum/ui/base";
import { useEvidenceWizard } from "./EvidenceContext";

export function EvidenceChecklist() {
  const { requisitos: items, pasoActivo: activeIndex, statusFor, setPasoActivo: onSelect } = useEvidenceWizard();

  return (
    <nav aria-label="Checklist de evidencia" className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
      {items.map((item, index) => {
        const status = statusFor(item);
        const active = activeIndex === index;
        return (
          <BaseButton variant="ghost"
            key={item.angulo}
            type="button"
            onClick={() => onSelect(index)}
            className={[
              "min-h-14 rounded-xl border px-2 py-2 text-left transition",
              active ? "border-ui-brand bg-ui-muted shadow-ui-md" : "border-ui-line/22 bg-ui-card",
              status === "listo" ? "text-ui-success" : status === "omitido" ? "text-ui-fg-muted" : "text-ui-fg"
            ].join(" ")}
            aria-current={active ? "step" : undefined}
            aria-label={`${item.titulo}: ${status === "listo" ? "completado" : status === "omitido" ? "omitido" : "pendiente"}`}
          >
            <span className="block font-body text-xs font-semibold">{index + 1}</span>
            <span className="mt-1 block truncate font-body text-xs font-semibold">{item.titulo}</span>
            <span className="mt-1 block font-body text-xs text-ui-fg-muted">
              {status === "listo" ? "Listo" : status === "omitido" ? "Omitido" : "Pendiente"}
            </span>
          </BaseButton>
        );
      })}
    </nav>
  );
}
