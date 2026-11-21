"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import { useState } from "react";
import { TripDockPortal } from "./TripOperationalFrame";
import { TripDialog } from "./TripDialog";
import { createNavigationOptions, type NavigationTarget, type NavigationOption } from "@/lib/navigation-launcher";

import { ConductorIcon } from "@/components/icons";
function abrirNavegacion(option: NavigationOption) {
  if (!option.nativeHref || typeof window === "undefined") return;
  window.location.href = option.nativeHref;
  window.setTimeout(() => {
    if (document.visibilityState === "visible") window.open(option.webHref, "_blank", "noopener,noreferrer");
  }, 900);
}

export function StickyTripActions({
  trasladoId,
  navigationTarget,
  phone,
  onQuickMessage
}: {
  trasladoId: string;
  navigationTarget: NavigationTarget;
  phone?: string | null;
  onQuickMessage?: (msg: string) => void;
}) {
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const navOptions = createNavigationOptions(navigationTarget);
  const primaryNav = navOptions[0];

  const mensajesRapidos = ["Estoy en camino", "Llegué al punto", "Hay tráfico, llego en 10 min"];

  return (
    <>
      <TripDockPortal quick><div className="border-t border-ui-line/20 bg-ui-card" role="toolbar" aria-label="Acciones rápidas del traslado">
        <div className="mx-auto max-w-md px-3 py-1 flex items-center gap-2">
          {/* Navegar — primario signal */}
          {primaryNav && (
            <a
              href={primaryNav.href}
              target={primaryNav.nativeHref ? undefined : "_blank"}
              rel="noreferrer"
              onClick={(e) => {
                if (!primaryNav.nativeHref) return;
                e.preventDefault();
                abrirNavegacion(primaryNav);
                if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(12);
              }}
              className="flex-1 min-h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-ui-brand px-3 py-2.5 font-display text-xs font-black tracking-wide text-ui-fg-muted shadow-md hover:bg-ui-brand/90 active:scale-[0.98] transition-all"
            >
              <span aria-hidden><ConductorIcon name="pin" /></span> Navegar
            </a>
          )}
          {/* Llamar — secundario */}
          {phone && <a
            href={`tel:${phone}`}
            onClick={() => {
              if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(12);
            }}
            className={`flex-1 min-h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 font-display text-xs font-bold transition-all active:scale-[0.98] ${phone ? "border-ui-brand bg-ui-brand-soft text-ui-brand hover:bg-ui-brand-soft/80" : "border-ui-line bg-ui-muted text-ui-fg-muted"}`}
          >
            <span aria-hidden><ConductorIcon name="phone" /></span> Llamar
          </a>}
          {/* Chat rápido — abre sheet */}
          <BaseButton variant="ghost"
            type="button"
            onClick={() => setSheetAbierto(true)}
            aria-label="Mensaje rápido"
            className="min-h-11 min-w-11 flex items-center justify-center rounded-xl border border-ui-line bg-ui-muted text-ui-fg hover:bg-ui-card active:scale-[0.98] transition-all px-3"
          >
            <span aria-hidden><ConductorIcon name="support" /></span>
            <span className="ml-1 font-display text-xs font-bold hidden sm:inline">Chat</span>
          </BaseButton>
        </div>
      </div></TripDockPortal>

      {/* Bottom sheet mensajes rápidos */}
      {sheetAbierto && (
        <TripDialog title="Mensajes rápidos" onClose={() => setSheetAbierto(false)}>
          <div className="flex flex-col gap-3">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-ui-line/40" aria-hidden />
            <h3 className="font-display text-sm font-black text-ui-fg">Mensaje rápido</h3>
            <p className="font-body text-xs text-ui-fg-muted">Envía sin escribir, se registra en el traslado {trasladoId.slice(0, 8).toUpperCase()}.</p>
            <div className="grid gap-2">
              {mensajesRapidos.map((m) => (
                <BaseButton variant="ghost"
                  key={m}
                  type="button"
                  onClick={() => {
                    onQuickMessage?.(m);
                    setSheetAbierto(false);
                    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(12);
                  }}
                  className="min-h-11 rounded-xl border border-ui-brand/30 bg-ui-brand-soft px-4 py-3 text-left font-body text-sm font-bold text-ui-brand hover:bg-ui-brand-soft/70"
                >
                  {m}
                </BaseButton>
              ))}
            </div>
            <BaseButton variant="ghost" type="button" onClick={() => setSheetAbierto(false)} className="w-full min-h-11 rounded-xl bg-ui-card border border-ui-line font-display text-sm font-bold text-ui-fg">
              Cancelar
            </BaseButton>
          </div>
        </TripDialog>
      )}
    </>
  );
}
