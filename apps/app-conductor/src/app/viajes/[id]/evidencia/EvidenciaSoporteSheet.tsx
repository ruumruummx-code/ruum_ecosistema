"use client";

interface EvidenciaSoporteSheetProps {
  soporteAbierto: boolean;
  setSoporteAbierto: (v: boolean) => void;
}

export function EvidenciaSoporteSheet({
  soporteAbierto,
  setSoporteAbierto
}: EvidenciaSoporteSheetProps) {
  if (!soporteAbierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop de cierre */}
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn cursor-default w-full h-full border-none outline-hidden"
        onClick={() => setSoporteAbierto(false)}
        aria-label="Cerrar soporte"
      />
      {/* Tarjeta de contenido */}
      <div className="relative w-full max-w-md bg-surface-elevated rounded-t-[2rem] border-t border-border/40 p-6 flex flex-col gap-4 animate-slideUp shadow-2xl">
        <div className="flex justify-between items-center pb-2 border-b border-border/20">
          <h2 className="font-display text-lg font-bold text-text-primary flex items-center gap-2">
            <span>💬</span> Soporte Rápido Ruum
          </h2>
          <button
            type="button"
            onClick={() => setSoporteAbierto(false)}
            className="text-text-tertiary hover:text-text-primary p-1 cursor-pointer font-bold text-sm"
          >
            ✕
          </button>
        </div>
        <p className="font-body text-xs text-text-secondary">
          Selecciona un medio de contacto para comunicarte con el equipo operativo de guardia.
        </p>
        <div className="flex flex-col gap-2.5 mt-2">
          <a
            href="https://wa.me/525500000000"
            className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors"
          >
            <span className="text-xl">💬</span>
            <div className="flex flex-col items-start">
              <span className="font-display text-sm font-bold text-emerald-400">WhatsApp de Soporte</span>
              <span className="font-body text-[11px] text-text-secondary">Mensajería instantánea y respuesta inmediata</span>
            </div>
          </a>
          <a
            href="tel:+525500000000"
            className="flex items-center gap-3 p-4 bg-route-soft border border-route-action/20 rounded-xl hover:bg-route-action/10 transition-colors"
          >
            <span className="text-xl">📞</span>
            <div className="flex flex-col items-start">
              <span className="font-display text-sm font-bold text-route-action">Llamar a Soporte</span>
              <span className="font-body text-[11px] text-text-secondary">Habla por teléfono directamente con un operador</span>
            </div>
          </a>
          <a
            href="mailto:soporte-conductores-pruebas@example.test"
            className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border/40 hover:bg-surface-elevated transition-colors"
          >
            <span className="text-xl">✉️</span>
            <div className="flex flex-col items-start">
              <span className="font-display text-sm font-bold text-text-primary">Correo Electrónico</span>
              <span className="font-body text-[11px] text-text-secondary">Reportar incidencias técnicas no urgentes</span>
            </div>
          </a>
        </div>
        <button
          type="button"
          onClick={() => setSoporteAbierto(false)}
          className="w-full min-h-11 mt-2 rounded-xl bg-control-soft font-display text-sm font-bold text-text-primary hover:bg-border/60 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
