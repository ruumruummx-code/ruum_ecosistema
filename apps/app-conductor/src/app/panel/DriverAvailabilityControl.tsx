"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import { useEffect, useRef, useState } from "react";

export type DriverAvailability = "disponible" | "no_disponible" | "en_viaje";

type AvailabilityOption = Exclude<DriverAvailability, "en_viaje">;

interface DriverAvailabilityControlProps {
  value: DriverAvailability;
  saving: boolean;
  onChange: (value: AvailabilityOption) => void;
}

const ESTADOS: Record<DriverAvailability, { label: string; icono: string }> = {
  disponible: {
    label: "Disponible",
    icono: "🟢"
  },
  no_disponible: {
    label: "No disponible",
    icono: "⚪"
  },
  en_viaje: {
    label: "En viaje activo",
    icono: "🚘"
  }
};

const OPCIONES: AvailabilityOption[] = ["disponible", "no_disponible"];

export function DriverAvailabilityControl({ value, saving, onChange }: DriverAvailabilityControlProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const wasSaving = useRef(false);
  const disabled = value === "en_viaje" || saving;
  const estado = ESTADOS[value];
  const disponible = value === "disponible";

  useEffect(() => {
    const acabaDeGuardar = wasSaving.current && !saving;
    wasSaving.current = saving;

    if (acabaDeGuardar && value === "disponible") {
      wasSaving.current = false;
      setFeedback("Disponibilidad activada. Estás listo para recibir Traslados.");
      const id = window.setTimeout(() => setFeedback(null), 3200);
      return () => window.clearTimeout(id);
    }
  }, [saving, value]);

  return (
    <section
      aria-labelledby="driver-availability-title"
      className={[
        "relative rounded-lg border px-5 py-4 transition-all duration-200 shadow-xs",
        disponible
          ? "border-ui-success/40 bg-ui-success/10 shadow-ui-sm"
          : "border-ui-line/60 bg-ui-muted/40"
      ].join(" ")}
    >
      {feedback && (
        <output
          aria-live="polite"
          className="conductor-toast-bottom fixed right-4 z-50 max-w-[calc(100vw-2rem)] rounded-xl border border-ui-success/40 bg-ui-success/20 px-4 py-3 font-body text-sm font-bold text-ui-success shadow-2xl sm:right-6 sm:max-w-sm"
        >
          ✨ {feedback}
        </output>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span
              className={[
                "size-3.5 rounded-full transition-all duration-200",
                disponible ? "bg-ui-success shadow-md shadow-ui-sm0" : "bg-ui-fg-muted"
              ].join(" ")}
              aria-hidden
            />
            {disponible && (
              <span className="absolute size-5 animate-ping rounded-full bg-ui-success/40" aria-hidden />
            )}
          </div>
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-wider text-ui-fg-muted">
              Disponibilidad Operativa
            </p>
            <h2 id="driver-availability-title" className="font-display text-base font-bold text-ui-fg flex items-center gap-1.5 mt-0.5">
              <span>{estado.icono}</span>
              <span>{saving ? "Actualizando estado..." : estado.label}</span>
            </h2>
          </div>
        </div>

        {/* Toggle con Contraste Radical entre Activo (Verde brillante) e Inactivo (Neutro sin fondo) */}
        <div className="grid grid-cols-2 rounded-xl border border-ui-line bg-ui-card p-1 sm:w-80" aria-label="Cambiar disponibilidad">
          {OPCIONES.map((option) => {
            const active = value === option;
            const isDisponibleOption = option === "disponible";

            return (
              <BaseButton variant="ghost"
                key={option}
                type="button"
                aria-pressed={active}
                disabled={disabled || active}
                onClick={() => onChange(option)}
                className={[
                  "min-h-10 rounded-lg px-3 py-2 text-center font-display text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-brand",
                  active
                    ? isDisponibleOption
                      ? "bg-ui-success text-ui-on-brand font-extrabold shadow-sm scale-[1.02]"
                      : "bg-ui-muted text-ui-fg border border-ui-line shadow-xs"
                    : "text-ui-fg-muted hover:bg-ui-muted hover:text-ui-fg opacity-70",
                  disabled || active ? "disabled:cursor-not-allowed" : ""
                ].join(" ")}
              >
                <span>{ESTADOS[option].icono}</span>
                <span>{ESTADOS[option].label}</span>
              </BaseButton>
            );
          })}
        </div>
      </div>

      {value === "en_viaje" && (
        <p className="mt-3 rounded-xl border border-ui-brand/40 bg-ui-brand-soft px-4 py-2.5 font-body text-xs font-bold text-ui-brand flex items-center gap-2">
          <span>🔒</span>
          <span>Cambio bloqueado: te encuentras realizando un traslado activo.</span>
        </p>
      )}
    </section>
  );
}
