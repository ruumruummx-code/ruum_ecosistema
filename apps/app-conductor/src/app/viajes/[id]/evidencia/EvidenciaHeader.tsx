"use client";

import Link from "next/link";
import type { TipoEvidencia } from "@ruum/shared/types";

interface EvidenciaHeaderProps {
  tipo: TipoEvidencia | null;
  folio: string;
  origen: string;
  onSupport: () => void;
}

export function EvidenciaHeader({ tipo, folio, origen, onSupport }: EvidenciaHeaderProps) {
  return (
    <div className="w-full text-text-primary">
      <div className="w-full flex flex-col animate-fade-in">
        {/* Top Navbar Header */}
        <header className="hidden md:flex justify-between items-center pb-4 border-b border-border/20">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-black tracking-tight text-text-primary">
              ruum<span className="text-route-action">ruum</span>
            </span>
            <div className="bg-surface-elevated border border-border/30 px-2 py-0.5 rounded-md">
              <span className="font-display text-[9px] font-black text-route-action tracking-wider">CONDUCTOR CERTIFICADO</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              aria-label="Soporte rápido"
              aria-haspopup="dialog"
              onClick={onSupport}
              className="p-1.5 text-text-primary hover:text-signal transition-colors cursor-pointer bg-transparent border-none outline-hidden"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary hover:text-text-primary transition-colors">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <Link
              href="/cuenta"
              className="p-1.5 text-text-secondary hover:text-text-primary transition-colors shrink-0"
              aria-label="Ajustes de cuenta"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </Link>
          </div>
        </header>

        {/* Step Breadcrumbs */}
        <div className="mt-6 flex flex-col gap-1">
          <span className="font-body text-[10px] text-text-tertiary font-bold tracking-wide">
            Traslados › {tipo === "inicial" ? origen : "Destino"} › <span className="text-text-primary">Paso 2 de 2</span>
          </span>
          <span className="font-display text-[9px] font-black text-route-action tracking-widest uppercase mt-0.5">
            {tipo === "inicial" ? "RECOLECCIÓN DE UNIDAD" : "ENTREGA DE UNIDAD"} · Evidencia documentada
          </span>
          <h1 className="font-display text-2xl font-black tracking-tight text-text-primary leading-tight mt-1">
            {tipo === "inicial" ? "Checklist de Origen" : "Checklist de Destino"}
          </h1>
          <p className="font-body text-xs text-text-secondary leading-relaxed mt-1">
            <span className="font-bold text-route-action block mb-0.5">
              {tipo === "inicial" ? "Verificación y evidencia de salida" : "Verificación y evidencia de entrega"}
            </span>
            {tipo === "inicial"
              ? "Captura las fotografías y datos del vehículo antes de iniciar el traslado. Cada traslado inicia con evidencia."
              : "Captura las fotografías y datos del vehículo en el punto de entrega de destino. Cada traslado termina con confirmación."}
          </p>
          <div className="conductor-ruta-divider mt-2 max-w-[260px]" aria-hidden />
        </div>
      </div>
    </div>
  );
}
