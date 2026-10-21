"use client";

import { enlaceTel, enlaceWhatsApp } from "./detalles-utils";

interface TabOperacionProps {
  folio: string;
  fecha: string;
  horaInicio: string;
  ventanaRecoleccion: string | null;
  ventanaEntrega: string | null;
  solicitanteNombre: string;
  solicitanteTelefono: string;
  entregaNombre: string;
  entregaTelefono: string;
  recepcionNombre: string;
  recepcionTelefono: string;
  notasRecogida: string;
  notasEntrega: string;
  copiar: (texto: string) => void;
  copiado: string | null;
  setCopiado: (val: string | null) => void;
}

export function TabOperacion({
  folio,
  fecha,
  horaInicio,
  ventanaRecoleccion,
  ventanaEntrega,
  solicitanteNombre,
  solicitanteTelefono,
  entregaNombre,
  entregaTelefono,
  recepcionNombre,
  recepcionTelefono,
  notasRecogida,
  notasEntrega,
  copiar,
  copiado,
  setCopiado,
}: TabOperacionProps) {
  return (
    <div className="bg-surface-elevated rounded-3xl border border-border/20 p-5 shadow-sm relative flex flex-col gap-4">
      {/* Cabecera de Operación */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-text-tertiary font-extrabold uppercase tracking-widest">
            Operación y Despacho
          </span>
          <span className="font-display text-lg font-black text-text-primary mt-0.5">
            #TR-{folio}
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-surface border border-border/30 text-[10px] font-black text-route-action uppercase tracking-wider">
          Certificado
        </span>
      </div>

      {/* Grid de tiempos y ventanas operativas */}
      <div className="grid grid-cols-2 gap-2.5 mt-1">
        <div className="flex flex-col bg-surface p-3 rounded-xl border border-border/15">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            # Traslado
          </span>
          <span className="font-mono text-xs font-black mt-0.5 text-text-primary">
            #TR-{folio}
          </span>
        </div>

        <div className="flex flex-col bg-surface p-3 rounded-xl border border-border/15">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Fecha de Traslado
          </span>
          <span className="font-semibold text-xs mt-0.5 text-text-primary capitalize">
            {fecha}
          </span>
        </div>

        <div className="flex flex-col bg-surface p-3 rounded-xl border border-border/15">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Hora de Inicio
          </span>
          <span className="font-semibold text-xs mt-0.5 text-text-primary tabular-nums">
            {horaInicio}
          </span>
        </div>

        <div className="flex flex-col bg-surface p-3 rounded-xl border border-border/15">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Ventana de Recolección
          </span>
          <span className="font-semibold text-xs mt-0.5 text-text-primary">
            {ventanaRecoleccion ?? "No especificada"}
          </span>
          <span className="font-body text-[10px] text-text-tertiary">
            Según formulario de solicitud
          </span>
        </div>

        <div className="flex flex-col col-span-2 bg-surface p-3 rounded-xl border border-border/15">
          <span className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">
            Ventana de Entrega
          </span>
          <span className="font-semibold text-xs mt-0.5 text-text-primary">
            {ventanaEntrega ?? "No especificada"}
          </span>
          <span className="font-body text-[10px] text-text-tertiary">
            Según formulario de solicitud
          </span>
        </div>
      </div>

      <div className="h-px w-full bg-border/20 my-1" />

      {/* Directorio de Contactos con Llamada y WhatsApp */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] text-text-tertiary font-extrabold uppercase tracking-widest">
          Contactos Operativos
        </span>

        {/* 1. Solicitante */}
        <div className="flex items-center justify-between bg-surface rounded-2xl p-3.5 border border-border/15">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-route-action/10 text-route-action flex items-center justify-center font-bold text-sm shrink-0">
              {solicitanteNombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-route-action font-bold uppercase tracking-wider">
                Solicitante del Servicio
              </span>
              <span className="font-bold text-xs text-text-primary truncate">
                {solicitanteNombre}
              </span>
              <span className="font-mono text-[11px] text-text-secondary flex items-center gap-1">
                {solicitanteTelefono || "Teléfono no disponible"}
                {solicitanteTelefono && (
                  <button
                    type="button"
                    onClick={() => {
                      copiar(solicitanteTelefono);
                      setCopiado("sol");
                      setTimeout(() => setCopiado(null), 1200);
                    }}
                    className="text-[10px] font-bold text-route-action hover:underline px-1"
                  >
                    {copiado === "sol" ? "Copiado" : "Copiar"}
                  </button>
                )}
              </span>
            </div>
          </div>
          {solicitanteTelefono && (
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <a
                href={enlaceWhatsApp(
                  solicitanteTelefono,
                  `Hola ${solicitanteNombre}, me comunico como tu conductor certificado de Ruum Ruum respecto al traslado #TR-${folio}.`
                )}
                target="_blank"
                rel="noreferrer"
                className="min-h-11 min-w-11 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 active:scale-95 transition-transform hover:bg-emerald-500/25 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                aria-label={`WhatsApp a ${solicitanteNombre}`}
                title="Enviar WhatsApp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </a>
              <a
                href={enlaceTel(solicitanteTelefono)}
                className="min-h-11 min-w-11 rounded-xl bg-route-action/15 text-route-action flex items-center justify-center border border-route-action/30 active:scale-95 transition-transform hover:bg-route-action/25 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                aria-label={`Llamar a ${solicitanteNombre}`}
                title="Llamar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* 2. Persona quien entrega */}
        <div className="flex items-center justify-between bg-surface rounded-2xl p-3.5 border border-border/15">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
              {entregaNombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                Persona quien Entrega (Origen)
              </span>
              <span className="font-bold text-xs text-text-primary truncate">
                {entregaNombre}
              </span>
              <span className="font-mono text-[11px] text-text-secondary flex items-center gap-1">
                {entregaTelefono || "Teléfono no disponible"}
                {entregaTelefono && (
                  <button
                    type="button"
                    onClick={() => {
                      copiar(entregaTelefono);
                      setCopiado("ent");
                      setTimeout(() => setCopiado(null), 1200);
                    }}
                    className="text-[10px] font-bold text-route-action hover:underline px-1"
                  >
                    {copiado === "ent" ? "Copiado" : "Copiar"}
                  </button>
                )}
              </span>
            </div>
          </div>
          {entregaTelefono && (
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <a
                href={enlaceWhatsApp(
                  entregaTelefono,
                  `Hola ${entregaNombre}, soy el conductor de Ruum Ruum asignado para recolectar el vehículo del traslado #TR-${folio}.`
                )}
                target="_blank"
                rel="noreferrer"
                className="min-h-11 min-w-11 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 active:scale-95 transition-transform hover:bg-emerald-500/25 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                aria-label={`WhatsApp a ${entregaNombre}`}
                title="Enviar WhatsApp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </a>
              <a
                href={enlaceTel(entregaTelefono)}
                className="min-h-11 min-w-11 rounded-xl bg-route-action/15 text-route-action flex items-center justify-center border border-route-action/30 active:scale-95 transition-transform hover:bg-route-action/25 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                aria-label={`Llamar a ${entregaNombre}`}
                title="Llamar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* 3. Persona quien recibe */}
        <div className="flex items-center justify-between bg-surface rounded-2xl p-3.5 border border-border/15">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-surface-elevated border border-border/60 text-text-primary flex items-center justify-center font-bold text-sm shrink-0">
              {recepcionNombre.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-text-secondary font-bold uppercase tracking-wider">
                Persona quien Recibe (Destino)
              </span>
              <span className="font-bold text-xs text-text-primary truncate">
                {recepcionNombre}
              </span>
              <span className="font-mono text-[11px] text-text-secondary flex items-center gap-1">
                {recepcionTelefono || "Teléfono no disponible"}
                {recepcionTelefono && (
                  <button
                    type="button"
                    onClick={() => {
                      copiar(recepcionTelefono);
                      setCopiado("rec");
                      setTimeout(() => setCopiado(null), 1200);
                    }}
                    className="text-[10px] font-bold text-route-action hover:underline px-1"
                  >
                    {copiado === "rec" ? "Copiado" : "Copiar"}
                  </button>
                )}
              </span>
            </div>
          </div>
          {recepcionTelefono && (
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <a
                href={enlaceWhatsApp(
                  recepcionTelefono,
                  `Hola ${recepcionNombre}, soy el conductor de Ruum Ruum en camino a tu ubicación con el traslado #TR-${folio}.`
                )}
                target="_blank"
                rel="noreferrer"
                className="min-h-11 min-w-11 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 active:scale-95 transition-transform hover:bg-emerald-500/25 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                aria-label={`WhatsApp a ${recepcionNombre}`}
                title="Enviar WhatsApp"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </a>
              <a
                href={enlaceTel(recepcionTelefono)}
                className="min-h-11 min-w-11 rounded-xl bg-route-action/15 text-route-action flex items-center justify-center border border-route-action/30 active:scale-95 transition-transform hover:bg-route-action/25 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
                aria-label={`Llamar a ${recepcionNombre}`}
                title="Llamar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="h-px w-full bg-border/20 my-1" />

      {/* Notas Operativas: Recogida y Entrega */}
      <div className="flex flex-col gap-3">
        <span className="text-[10px] text-text-tertiary font-extrabold uppercase tracking-widest">
          Notas y Referencias
        </span>

        {/* Notas de recogida */}
        <div className="flex flex-col bg-surface p-3.5 rounded-2xl border border-border/15">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">
              Notas de Recogida (Origen)
            </span>
          </div>
          <span className="font-body text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
            {notasRecogida}
          </span>
        </div>

        {/* Notas de entrega */}
        <div className="flex flex-col bg-surface p-3.5 rounded-2xl border border-border/15">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="h-2 w-2 rounded-full bg-route-action" />
            <span className="text-[9px] text-route-action font-bold uppercase tracking-widest">
              Notas de Entrega (Destino)
            </span>
          </div>
          <span className="font-body text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
            {notasEntrega}
          </span>
        </div>
      </div>
    </div>
  );
}
