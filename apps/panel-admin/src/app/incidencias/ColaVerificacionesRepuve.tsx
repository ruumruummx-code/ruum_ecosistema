"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  autorizarOverrideRepuveAdmin,
  dictaminarAuditoriaRepuveAdmin,
  listarColaVerificacionesRepuveAdmin,
  type FiltroColaRepuveAdmin,
} from "@ruum/api/services";
import type { VerificacionRepuve } from "@ruum/shared/types";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";

export function ColaVerificacionesRepuve() {
  const [filtro, setFiltro] = useState<FiltroColaRepuveAdmin>("excepciones");
  const [items, setItems] = useState<VerificacionRepuve[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [motivosOverride, setMotivosOverride] = useState<Record<string, string>>({});
  const [notasAuditoria, setNotasAuditoria] = useState<Record<string, string>>({});

  const cargar = useCallback(async () => {
    setError("");
    setCargando(true);
    try {
      if (!tieneSupabaseConfigurado()) {
        setItems([]);
        return;
      }
      const data = await listarColaVerificacionesRepuveAdmin(
        crearClienteNavegador(),
        filtro
      );
      setItems(data);
    } catch {
      setError("No pudimos consultar la cola de verificaciones REPUVE.");
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function autorizarOverride(item: VerificacionRepuve) {
    const motivo = (motivosOverride[item.id] ?? "").trim();
    if (motivo.length < 10 || ocupadoId) return;
    setOcupadoId(item.id);
    setError("");
    try {
      await autorizarOverrideRepuveAdmin(crearClienteNavegador(), {
        trasladoId: item.traslado_id,
        motivo,
        verificacionOrigenId: item.id,
      });
      setMotivosOverride((prev) => ({ ...prev, [item.id]: "" }));
      await cargar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo autorizar el override de verificación REPUVE."
      );
    } finally {
      setOcupadoId(null);
    }
  }

  async function dictaminarMuestreo(
    item: VerificacionRepuve,
    dictamen: "aprobada" | "observada"
  ) {
    if (ocupadoId) return;
    setOcupadoId(item.id);
    setError("");
    try {
      await dictaminarAuditoriaRepuveAdmin(crearClienteNavegador(), {
        verificacionId: item.id,
        dictamen,
        notas: notasAuditoria[item.id] ?? null,
      });
      await cargar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar el dictamen de auditoría REPUVE."
      );
    } finally {
      setOcupadoId(null);
    }
  }

  return (
    <section
      aria-label="Cola de verificaciones REPUVE"
      className="mt-5 rounded-xl border border-border-default bg-surface-primary p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Verificaciones REPUVE · Excepciones y Auditoría por Muestreo
          </h2>
          <p className="text-sm text-text-secondary">
            Atiende discrepancias de VIN/placas, reportes en REPUVE y revisiones aleatorias de soporte.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtro de cola REPUVE">
          <button
            type="button"
            onClick={() => setFiltro("excepciones")}
            aria-pressed={filtro === "excepciones"}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              filtro === "excepciones"
                ? "border-ink bg-signal text-ink"
                : "border-border-default bg-surface-primary text-text-secondary"
            }`}
          >
            Cola de excepciones
          </button>
          <button
            type="button"
            onClick={() => setFiltro("auditoria")}
            aria-pressed={filtro === "auditoria"}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              filtro === "auditoria"
                ? "border-ink bg-signal text-ink"
                : "border-border-default bg-surface-primary text-text-secondary"
            }`}
          >
            Auditoría por muestreo
          </button>
          <button
            type="button"
            onClick={() => setFiltro("todas")}
            aria-pressed={filtro === "todas"}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              filtro === "todas"
                ? "border-ink bg-signal text-ink"
                : "border-border-default bg-surface-primary text-text-secondary"
            }`}
          >
            Historial reciente
          </button>
          <button
            type="button"
            disabled={cargando || Boolean(ocupadoId)}
            onClick={() => void cargar()}
            className="text-xs underline"
          >
            Actualizar REPUVE
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-status-error">
          {error}
        </p>
      )}

      {cargando ? (
        <p role="status" className="mt-3 text-sm">
          Cargando verificaciones REPUVE…
        </p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-text-secondary">
          No hay verificaciones REPUVE pendientes en esta vista.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border-default p-3.5 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold uppercase">
                    Resultado: {item.resultado.replaceAll("_", " ")}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      item.coincide
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-red-100 text-red-900"
                    }`}
                  >
                    {item.coincide ? "VIN y placas coinciden" : "Discrepancia VIN/placas"}
                  </span>
                  {item.requiere_auditoria && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                      Muestreo: {item.auditoria_dictamen ?? "pendiente"}
                    </span>
                  )}
                </div>

                <Link
                  href={`/viajes/${item.traslado_id}`}
                  className="text-xs font-semibold underline"
                >
                  Abrir traslado {item.traslado_id.slice(0, 8).toUpperCase()}
                </Link>
              </div>

              <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                <p>
                  <span className="text-text-tertiary">VIN esperado / físico: </span>
                  <strong className="font-mono-ruum">
                    {item.vin_esperado} / {item.vin_fisico}
                  </strong>
                </p>
                <p>
                  <span className="text-text-tertiary">Placas esperadas / físicas: </span>
                  <strong className="font-mono-ruum">
                    {item.placas_esperadas ?? "S/P"} / {item.placas_fisicas ?? "S/P"}
                  </strong>
                </p>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
                <span className="text-text-tertiary">
                  Registrado: {new Date(item.creado_en).toLocaleString("es-MX")}
                </span>
                {item.url_captura_firmada && (
                  <a
                    href={item.url_captura_firmada}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline"
                  >
                    Ver captura REPUVE
                  </a>
                )}
              </div>

              {!item.es_override_admin &&
                (!item.coincide || item.resultado !== "limpio") && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-default pt-2.5">
                    <input
                      type="text"
                      aria-label={`Motivo de override para ${item.id}`}
                      placeholder="Motivo de override autorizado (mín. 10 caracteres)"
                      value={motivosOverride[item.id] ?? ""}
                      onChange={(e) =>
                        setMotivosOverride((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      className="flex-1 rounded border border-border-default px-2.5 py-1 text-xs"
                    />
                    <button
                      type="button"
                      disabled={
                        Boolean(ocupadoId) ||
                        (motivosOverride[item.id] ?? "").trim().length < 10
                      }
                      onClick={() => void autorizarOverride(item)}
                      className="rounded border border-ink bg-signal px-3 py-1 text-xs font-semibold text-ink disabled:opacity-50"
                    >
                      {ocupadoId === item.id ? "Autorizando…" : "Autorizar override"}
                    </button>
                  </div>
                )}

              {item.requiere_auditoria &&
                (!item.auditoria_dictamen ||
                  item.auditoria_dictamen === "pendiente") && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-default pt-2.5">
                    <input
                      type="text"
                      aria-label={`Notas de auditoría para ${item.id}`}
                      placeholder="Notas de auditoría por muestreo..."
                      value={notasAuditoria[item.id] ?? ""}
                      onChange={(e) =>
                        setNotasAuditoria((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      className="flex-1 rounded border border-border-default px-2.5 py-1 text-xs"
                    />
                    <button
                      type="button"
                      disabled={Boolean(ocupadoId)}
                      onClick={() => void dictaminarMuestreo(item, "aprobada")}
                      className="rounded border border-emerald-700 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                    >
                      Aprobar muestreo
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(ocupadoId)}
                      onClick={() => void dictaminarMuestreo(item, "observada")}
                      className="rounded border border-red-700 px-2.5 py-1 text-xs font-semibold text-red-800"
                    >
                      Observar muestreo
                    </button>
                  </div>
                )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
