"use client";

import { useState } from "react";
import { Button, Field, PassportCard } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";

type NotaRow = Database["public"]["Tables"]["notas_internas_traslado"]["Row"];
type AuditoriaRow = Database["public"]["Tables"]["registro_auditoria"]["Row"];

function fechaAdministrativa(fechaIso: string | null | undefined) {
  return fechaIso ? new Date(fechaIso).toLocaleString("es-MX") : "Pendiente";
}

interface ViajeDetalleNotasAuditoriaProps {
  notas: NotaRow[];
  auditoria: AuditoriaRow[];
  procesando: "conductor" | "estado" | "precio" | "nota" | "fallido" | "sugerencia" | null;
  onAgregarNota: (contenido: string) => Promise<void>;
}

export function ViajeDetalleNotasAuditoria({
  notas,
  auditoria,
  procesando,
  onAgregarNota
}: ViajeDetalleNotasAuditoriaProps) {
  const [notaNueva, setNotaNueva] = useState("");

  const handleAgregar = async () => {
    if (!notaNueva.trim()) return;
    await onAgregarNota(notaNueva);
    setNotaNueva("");
  };

  return (
    <>
      {/* Bloque 7 — Notas internas */}
      <div className="mt-6">
        <PassportCard>
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Notas internas</p>
          <div className="mt-3 flex items-end gap-2">
            <div className="flex-1">
              <Field
                etiqueta="Nueva nota"
                placeholder="Visible solo para el equipo de operación"
                value={notaNueva}
                onChange={(e) => setNotaNueva(e.target.value)}
              />
            </div>
            <Button onClick={handleAgregar} disabled={!notaNueva.trim() || procesando === "nota"}>
              {procesando === "nota" ? "…" : "Agregar"}
            </Button>
          </div>
          <div className="mt-4 space-y-3 border-t border-ui-line pt-4">
            {notas.length === 0 ? (
              <p className="font-body text-sm text-ui-fg-muted">Sin notas todavía.</p>
            ) : (
              notas.map((n) => (
                <div key={n.id} className="font-body text-sm">
                  <p>{n.contenido}</p>
                  <p className="mt-0.5 font-mono-ruum text-xs uppercase tracking-wide text-ui-fg-muted">
                    {fechaAdministrativa(n.creada_en)}
                  </p>
                </div>
              ))
            )}
          </div>
        </PassportCard>
      </div>

      {/* Bloque 6 — Línea de tiempo */}
      <div className="mt-6">
        <PassportCard>
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Línea de tiempo</p>
          <h2 className="mt-1 font-display text-lg font-semibold">Registro de auditoría</h2>
          <div className="mt-4 space-y-0">
            {auditoria.length === 0 ? (
              <p className="font-body text-sm text-ui-fg-muted">Sin eventos registrados todavía.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-2 h-[calc(100%-16px)] w-0.5 bg-ui-muted" aria-hidden="true" />
                {auditoria.map((evento, indice) => {
                  const eventoLabel = evento.evento.replaceAll("_", " ");
                  const eventoData = JSON.stringify(evento.datos, null, 2);
                  return (
                    <div key={evento.id} className="relative flex gap-4 pb-5 last:pb-0">
                      <div className={`relative mt-1.5 size-[23px] shrink-0 rounded-full border-2 ${indice === 0 ? "border-ui-brand bg-ui-brand" : "border-ui-line-strong bg-ui-card"}`} aria-hidden="true">
                        {indice === 0 && <span className="absolute inset-0 flex items-center justify-center text-xs text-ui-fg">●</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                          <p className="font-body text-sm font-semibold capitalize">{eventoLabel}</p>
                          <p className="whitespace-nowrap font-mono-ruum text-xs uppercase tracking-wide text-ui-fg-muted">
                            {fechaAdministrativa(evento.timestamp)}
                          </p>
                        </div>
                        <p className="mt-0.5 font-body text-xs text-ui-fg-muted">
                          Actor: {evento.actor} · {evento.actor_id}
                        </p>
                        {eventoData !== "{}" && (
                          <details className="mt-2">
                            <summary className="cursor-pointer font-body text-xs font-semibold text-ui-brand-soft-fg hover:underline">Ver datos</summary>
                            <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-ui-brand/[0.04] p-3 font-mono-ruum text-xs text-ui-fg-muted">
                              {eventoData}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </PassportCard>
      </div>
    </>
  );
}
