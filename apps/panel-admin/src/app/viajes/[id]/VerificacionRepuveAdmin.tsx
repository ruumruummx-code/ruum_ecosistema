"use client";

import { useCallback, useEffect, useState } from "react";
import {
  autorizarOverrideRepuveAdmin,
  dictaminarAuditoriaRepuveAdmin,
  obtenerVerificacionesRepuveTraslado,
} from "@ruum/api/services";
import type { VerificacionRepuve } from "@ruum/shared/types";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";

const ETIQUETA_RESULTADO: Record<string, string> = {
  limpio: "Sin reporte de robo (Limpio)",
  con_reporte_robo: "Con reporte de robo",
  con_aviso_recuperado: "Con aviso / recuperado",
  no_encontrado: "No encontrado en REPUVE",
  error_portal: "Error / caída de portal REPUVE",
  override_admin: "Excepción autorizada por soporte (Override)",
};

export function VerificacionRepuveAdmin({ trasladoId }: { trasladoId: string }) {
  const [verificaciones, setVerificaciones] = useState<VerificacionRepuve[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [motivoOverride, setMotivoOverride] = useState("");
  const [notasAuditoria, setNotasAuditoria] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!tieneSupabaseConfigurado()) {
      setCargando(false);
      return;
    }
    setError("");
    try {
      const cliente = crearClienteNavegador();
      const lista = await obtenerVerificacionesRepuveTraslado(cliente, trasladoId);
      setVerificaciones(lista);
    } catch {
      setError("No se pudo consultar el historial de verificaciones REPUVE.");
    } finally {
      setCargando(false);
    }
  }, [trasladoId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const ultima = verificaciones[0] ?? null;
  const tieneOverrideActivo = Boolean(ultima?.es_override_admin);
  const verificacionValida =
    tieneOverrideActivo ||
    Boolean(ultima && ultima.resultado === "limpio" && ultima.coincide && ultima.captura_path);
  const requiereAtencionExcepcion = Boolean(ultima && !verificacionValida);

  async function manejarOverride(e: React.FormEvent) {
    e.preventDefault();
    if (motivoOverride.trim().length < 10) return;
    setGuardando(true);
    setError("");
    try {
      const cliente = crearClienteNavegador();
      await autorizarOverrideRepuveAdmin(cliente, {
        trasladoId,
        motivo: motivoOverride.trim(),
        verificacionOrigenId: ultima?.id ?? null,
      });
      setMotivoOverride("");
      await cargar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la autorización excepcional de REPUVE."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function manejarDictamen(
    verificacionId: string,
    dictamen: "aprobada" | "observada"
  ) {
    setGuardando(true);
    setError("");
    try {
      const cliente = crearClienteNavegador();
      await dictaminarAuditoriaRepuveAdmin(cliente, {
        verificacionId,
        dictamen,
        notas: notasAuditoria[verificacionId] ?? null,
      });
      await cargar();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el dictamen de auditoría REPUVE."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return null;

  return (
    <section
      aria-label="Verificación REPUVE del traslado"
      className={`mt-6 rounded-xl border p-5 ${
        requiereAtencionExcepcion
          ? "border-amber-500 bg-amber-50/40"
          : "border-border-default bg-surface-primary"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-body text-xs uppercase tracking-wide text-text-tertiary">
            Control de legalidad e identidad en origen
          </p>
          <h2 className="mt-0.5 font-display text-lg font-semibold text-ink">
            Verificación REPUVE y cotejo de VIN / Placas
          </h2>
        </div>

        <span
          className={`rounded-full px-3 py-1 font-body text-xs font-semibold ${
            verificacionValida
              ? "bg-emerald-100 text-emerald-900"
              : ultima
              ? "bg-amber-200 text-amber-950"
              : "bg-slate-200 text-slate-800"
          }`}
        >
          {tieneOverrideActivo
            ? "Excepción autorizada por soporte"
            : verificacionValida
            ? "REPUVE limpio y coincidente"
            : ultima
            ? "Bloqueado por excepción REPUVE / VIN"
            : "Pendiente de captura por conductor"}
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-2 font-body text-sm text-status-error">
          {error}
        </p>
      )}

      {verificaciones.length === 0 ? (
        <p className="mt-3 font-body text-sm text-text-secondary">
          Aún no se han registrado consultas REPUVE para este traslado.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {verificaciones.map((v) => (
            <li
              key={v.id}
              className="rounded-lg border border-border-default bg-surface-primary p-3.5 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">
                  {ETIQUETA_RESULTADO[v.resultado] ?? v.resultado}
                </span>
                <span className="font-mono-ruum text-xs text-text-tertiary">
                  {new Date(v.creado_en).toLocaleString("es-MX")} · Actor: {v.actor_rol}
                </span>
              </div>

              <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <span className="text-text-tertiary">VIN esperado vs físico: </span>
                  <span className="font-mono-ruum font-semibold">
                    {v.vin_esperado} / {v.vin_fisico}
                  </span>{" "}
                  <span>({v.coincide_vin ? "Coincide" : "Discrepancia"})</span>
                </div>
                <div>
                  <span className="text-text-tertiary">Placas esperadas vs físicas: </span>
                  <span className="font-mono-ruum font-semibold">
                    {v.placas_esperadas ?? "S/P"} / {v.placas_fisicas ?? "S/P"}
                  </span>{" "}
                  <span>({v.coincide_placas ? "Coincide" : "Discrepancia"})</span>
                </div>
              </div>

              {v.es_override_admin && v.motivo_override && (
                <p className="mt-2 rounded bg-emerald-50 p-2 text-xs text-emerald-950">
                  <strong>Motivo de override autorizado:</strong> {v.motivo_override}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                {v.url_captura_firmada ? (
                  <a
                    href={v.url_captura_firmada}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-status-info underline"
                  >
                    Ver captura de pantalla REPUVE
                  </a>
                ) : v.captura_path ? (
                  <span className="font-mono-ruum text-text-tertiary">
                    Ruta: {v.captura_path}
                  </span>
                ) : null}

                {v.requiere_auditoria && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-900">
                    Muestreo de auditoría: {v.auditoria_dictamen ?? "pendiente"}
                  </span>
                )}
              </div>

              {v.requiere_auditoria &&
                (!v.auditoria_dictamen || v.auditoria_dictamen === "pendiente") && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-default pt-2.5">
                    <input
                      type="text"
                      placeholder="Notas de auditoría (obligatorio si se observa)"
                      value={notasAuditoria[v.id] ?? ""}
                      onChange={(e) =>
                        setNotasAuditoria((prev) => ({ ...prev, [v.id]: e.target.value }))
                      }
                      className="flex-1 rounded border border-border-default px-2.5 py-1 text-xs"
                    />
                    <button
                      type="button"
                      disabled={guardando}
                      onClick={() => void manejarDictamen(v.id, "aprobada")}
                      className="rounded border border-emerald-600 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                    >
                      Aprobar muestreo
                    </button>
                    <button
                      type="button"
                      disabled={guardando}
                      onClick={() => void manejarDictamen(v.id, "observada")}
                      className="rounded border border-red-600 px-2.5 py-1 text-xs font-semibold text-red-800"
                    >
                      Marcar observada
                    </button>
                  </div>
                )}
            </li>
          ))}
        </ul>
      )}

      {!verificacionValida && (
        <form onSubmit={manejarOverride} className="mt-4 border-t border-border-default pt-4">
          <label htmlFor="motivo-override-repuve" className="block text-xs font-semibold">
            Autorizar excepción REPUVE (Override con motivo y auditoría)
          </label>
          <textarea
            id="motivo-override-repuve"
            rows={2}
            minLength={10}
            required
            placeholder="Documenta la validación documental o jurídica realizada por soporte (mínimo 10 caracteres)..."
            value={motivoOverride}
            onChange={(e) => setMotivoOverride(e.target.value)}
            className="mt-1.5 block w-full rounded-lg border border-border-default bg-surface-primary p-2 text-sm"
          />
          <button
            type="submit"
            disabled={guardando || motivoOverride.trim().length < 10}
            className="mt-2 rounded-lg border border-ink bg-signal px-4 py-1.5 font-body text-xs font-semibold text-ink disabled:opacity-50"
          >
            {guardando ? "Autorizando…" : "Autorizar avance por excepción REPUVE"}
          </button>
        </form>
      )}
    </section>
  );
}
