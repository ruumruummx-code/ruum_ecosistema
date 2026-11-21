"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import { useEffect, useRef, useState } from "react";
import { CONTACTOS_SOPORTE_CONDUCTOR } from "../../lib/contactos-soporte";

import { ConductorIcon } from "@/components/icons";
interface PanelSupportSheetProps {
  abierto: boolean;
  onCerrar: () => void;
}

export function PanelSupportSheet({ abierto, onCerrar }: PanelSupportSheetProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!abierto) return;

    const manejarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCerrar();
      }
    };

    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [abierto, onCerrar]);

  // MOB-003: Swipe down para cerrar
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null) return;
    
    const deltaY = e.touches[0].clientY - startY;
    
    // Solo activar si el movimiento es hacia abajo (deltaY > 0) y el sheet está abierto
    if (deltaY > 0 && abierto && !isDragging) {
      // Verificar que el touch inició en el sheet (no en el backdrop)
      const target = e.target as HTMLElement;
      if (modalRef.current?.contains(target)) {
        setIsDragging(true);
        
        // Si el movimiento es lo suficientemente grande, cerrar
        if (deltaY > 50) {
          onCerrar();
          setStartY(null);
          setIsDragging(false);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    setStartY(null);
    setIsDragging(false);
  };

  if (!abierto) return null;

  return (
    <dialog
      open
      className="fixed inset-0 z-50 m-0 flex h-[100dvh] w-[100vw] max-h-none max-w-none items-end justify-center border-0 bg-transparent p-0"
      aria-modal="true"
      aria-labelledby="titulo-soporte"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Backdrop */}
      <BaseButton variant="ghost"
        type="button"
        className="absolute inset-0 bg-ui-overlay/70 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn cursor-default w-full h-full border-none outline-hidden"
        onClick={onCerrar}
        aria-label="Cerrar soporte"
      />

      {/* Sheet Container - MOB-003: Swipe down para cerrar */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-ui-muted rounded-xl border-t border-ui-line/40 p-6 flex flex-col gap-4 animate-slideUp shadow-2xl z-10 touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Bar handle para swipe down - indicador visual */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full bg-ui-line/60" aria-hidden />
        <div className="flex justify-between items-center pb-2 border-b border-ui-line/20">
          <h2 id="titulo-soporte" className="font-display text-lg font-bold text-ui-fg flex items-center gap-2">
            <span><ConductorIcon name="support" /></span> Soporte Operativo Ruum
          </h2>
          <BaseButton variant="ghost"
            type="button"
            onClick={onCerrar}
            className="text-ui-fg-muted hover:text-ui-fg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer font-bold text-base rounded-full hover:bg-ui-card"
            aria-label="Cerrar ventana de soporte"
          >
            ✕
          </BaseButton>
        </div>

        <p className="font-body text-xs text-ui-fg-muted leading-relaxed">
          Selecciona un medio de contacto para comunicarte de inmediato con el equipo operativo de guardia.
        </p>

        <div className="flex flex-col gap-2.5 mt-1">
          <a
            href={CONTACTOS_SOPORTE_CONDUCTOR.soporte.whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 p-4 bg-ui-success/10 border border-ui-success/25 rounded-lg hover:bg-ui-success/20 transition-colors min-h-[60px]"
          >
            <span className="text-2xl"><ConductorIcon name="support" /></span>
            <div className="flex flex-col items-start text-left">
              <span className="font-display text-sm font-bold text-ui-success">WhatsApp de Soporte</span>
              <span className="font-body text-xs text-ui-fg-muted">Mensajería instantánea y respuesta inmediata</span>
            </div>
          </a>

          <a
            href={CONTACTOS_SOPORTE_CONDUCTOR.soporte.telefono.href}
            className="flex items-center gap-3.5 p-4 bg-ui-brand-soft border border-ui-brand/25 rounded-lg hover:bg-ui-brand-soft/70 transition-colors min-h-[60px]"
          >
            <span className="text-2xl"><ConductorIcon name="phone" /></span>
            <div className="flex flex-col items-start text-left">
              <span className="font-display text-sm font-bold text-ui-brand">Llamar a Soporte</span>
              <span className="font-body text-xs text-ui-fg-muted">Habla directamente con un operador en turno</span>
            </div>
          </a>

          <a
            href={CONTACTOS_SOPORTE_CONDUCTOR.soporte.correo.href}
            className="flex items-center gap-3.5 p-4 bg-ui-card rounded-lg border border-ui-line/40 hover:bg-ui-muted transition-colors min-h-[60px]"
          >
            <span className="text-2xl"><ConductorIcon name="mail" /></span>
            <div className="flex flex-col items-start text-left">
              <span className="font-display text-sm font-bold text-ui-fg">Correo Electrónico</span>
              <span className="font-body text-xs text-ui-fg-muted">Reportar incidencias técnicas no urgentes</span>
            </div>
          </a>
        </div>

        <BaseButton variant="ghost"
          type="button"
          onClick={onCerrar}
          className="w-full min-h-[48px] mt-2 rounded-xl bg-ui-card hover:bg-ui-muted border border-ui-line/30 font-display text-sm font-bold text-ui-fg transition-colors cursor-pointer"
        >
          Cerrar
        </BaseButton>
      </div>
    </dialog>
  );
}
