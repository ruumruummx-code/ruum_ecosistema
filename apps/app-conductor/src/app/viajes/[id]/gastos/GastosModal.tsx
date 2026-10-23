"use client";

import { useState, useEffect, useRef } from "react";
import { TripDialog } from "../TripDialog";
import Image from "next/image";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { Aviso } from "@ruum/ui";
import { extraerRutaComprobante, resolverUrlEvidencia } from "@ruum/api/services";
import {
  eliminarGastoTraslado,
  registrarGastoTraslado,
} from "@ruum/api/drivers";
import { GastoRegistro, GastoTipoDb, obtenerEtiquetaGasto } from "./gastos-types";

const MAX_COMPROBANTE_BYTES = 10 * 1024 * 1024; // 10 MB

interface GastosModalProps {
  trasladoId: string;
  onCerrar: () => void;
  gastosList: GastoRegistro[];
  setGastosList: React.Dispatch<React.SetStateAction<GastoRegistro[]>>;
  onSubirComprobante: (
    cliente: ReturnType<typeof crearClienteNavegador>,
    trasladoId: string,
    archivo: File
  ) => Promise<{ ruta: string }>;
}

export function GastosModal({
  trasladoId,
  onCerrar,
  gastosList,
  setGastosList,
  onSubirComprobante,
}: GastosModalProps) {
  const [tipoGasto, setTipoGasto] = useState<GastoTipoDb>("combustible");
  const [monto, setMonto] = useState<string>("");
  const [notas, setNotas] = useState<string>("");
  const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [guardandoGasto, setGuardandoGasto] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [errorGasto, setErrorGasto] = useState<string | null>(null);
  const [exitoGasto, setExitoGasto] = useState<string | null>(null);

  const camaraInputRef = useRef<HTMLInputElement>(null);
  const archivoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!archivoComprobante) {
      setPreviewUrl(null);
      return;
    }
    if (archivoComprobante.type.startsWith("image/")) {
      const url = URL.createObjectURL(archivoComprobante);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [archivoComprobante]);

  const [resolviendoGastoId, setResolviendoGastoId] = useState<string | null>(null);

  function handleSeleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_COMPROBANTE_BYTES) {
      setErrorGasto("El comprobante seleccionado supera el límite de 10 MB.");
      return;
    }

    setErrorGasto(null);
    setArchivoComprobante(file);
  }

  function handleQuitarComprobante() {
    setArchivoComprobante(null);
    setPreviewUrl(null);
    if (camaraInputRef.current) camaraInputRef.current.value = "";
    if (archivoInputRef.current) archivoInputRef.current.value = "";
  }

  async function handleVerComprobante(gastoId: string, ruta: string) {
    setResolviendoGastoId(gastoId);
    try {
      const cliente = crearClienteNavegador();
      const urlTemporal = await resolverUrlEvidencia(cliente, ruta, 60 * 30);
      if (urlTemporal) {
        window.open(urlTemporal, "_blank", "noopener,noreferrer");
      } else {
        setErrorGasto("No se pudo generar el enlace seguro para ver el comprobante.");
      }
    } catch {
      setErrorGasto("No se pudo abrir el comprobante.");
    } finally {
      setResolviendoGastoId(null);
    }
  }

  async function handleAgregarGasto(e: React.FormEvent) {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setErrorGasto("Ingresa un monto válido mayor a $0.00 MXN.");
      return;
    }

    setGuardandoGasto(true);
    setErrorGasto(null);
    setExitoGasto(null);

    try {
      const cliente = crearClienteNavegador();
      let comprobanteRutaSubida: string | null = null;

      if (archivoComprobante) {
        try {
          const resultado = await onSubirComprobante(cliente, trasladoId, archivoComprobante);
          comprobanteRutaSubida = resultado.ruta;
        } catch (subidaErr: unknown) {
          console.warn("Error al subir archivo:", subidaErr);
          throw new Error("No se pudo subir el archivo de comprobante.");
        }
      }

      const descripcionFinal = notas.trim() || null;

      const data = await registrarGastoTraslado(cliente, {
        trasladoId,
        tipo: tipoGasto,
        monto: montoNum,
        descripcion: descripcionFinal || null,
        comprobanteRuta: comprobanteRutaSubida || null,
      });

      if (data) {
        const { ruta, texto } = extraerRutaComprobante(data.descripcion, data.comprobante_ruta);
        const nuevoGasto: GastoRegistro = {
          id: String(data.id),
          tipo: data.tipo as GastoTipoDb,
          monto: Number(data.monto || montoNum),
          descripcion: texto || (notas.trim() || null),
          comprobante_ruta: ruta || comprobanteRutaSubida || null,
          registrado_en: data.registrado_en || new Date().toISOString(),
        };
        setGastosList((prev) => [nuevoGasto, ...prev]);
        setMonto("");
        setNotas("");
        handleQuitarComprobante();
        setExitoGasto("Gasto registrado y comprobante guardado con éxito.");
      }
    } catch (err: unknown) {
      console.error("Error al registrar gasto:", err);
      setErrorGasto(err instanceof Error ? err.message : "No se pudo registrar el gasto. Verifica la conexión e intenta nuevamente.");
    } finally {
      setGuardandoGasto(false);
    }
  }

  async function handleEliminarGasto(id: string) {
    if (eliminandoId) return;
    setEliminandoId(id);
    setErrorGasto(null);
    try {
      const cliente = crearClienteNavegador();
      await eliminarGastoTraslado(cliente, id);
      setGastosList((prev) => prev.filter((g) => g.id !== id));
      setExitoGasto("Gasto eliminado correctamente.");
    } catch (err) {
      console.error("Error al eliminar gasto:", err);
      setErrorGasto("No se pudo eliminar el gasto.");
    } finally {
      setEliminandoId(null);
    }
  }

  const totalGastos = gastosList.reduce((sum, g) => sum + (g.monto || 0), 0);

  return (
    <TripDialog title="Gastos del traslado" onClose={onCerrar} footer={<button type="submit" form="trip-expense-form" disabled={guardandoGasto} className="w-full min-h-11 rounded-xl bg-signal p-2 text-sm font-bold text-slate-950 disabled:opacity-50">{guardandoGasto ? "Guardando y subiendo…" : "+ Registrar gasto"}</button>}>
      <div className="flex flex-col gap-4 text-left">

        {/* Formulario para agregar gasto */}
        <form id="trip-expense-form" onSubmit={handleAgregarGasto} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="tipo-gasto" className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                Tipo de gasto
              </label>
              <select
                id="tipo-gasto"
                value={tipoGasto}
                onChange={(e) => setTipoGasto(e.target.value as GastoTipoDb)}
                className="bg-surface border border-border/30 rounded-xl px-3 py-2.5 text-xs text-text-primary focus:outline-none focus:border-route-action"
              >
                <option value="combustible">⛽ Combustible</option>
                <option value="caseta">🛣️ Casetas / Peaje</option>
                <option value="maniobra">🔄 Maniobra / Carga</option>
                <option value="estadia">⏱️ Estadía / Espera</option>
                <option value="penalizacion">⚠️ Penalización</option>
                <option value="otro">📝 Estacionamiento / Otro</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="monto-gasto" className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                Monto (MXN) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-text-tertiary">$</span>
                <input
                  id="monto-gasto"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full bg-surface border border-border/30 rounded-xl pl-7 pr-3 py-2.5 text-xs font-mono font-bold text-text-primary focus:outline-none focus:border-route-action"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="notas-gasto" className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
              Notas / Especificaciones (opcional)
            </label>
            <input
              id="notas-gasto"
              type="text"
              placeholder="Ej. Ticket Gasolinera Pemex #4820"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="bg-surface border border-border/30 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-route-action"
            />
          </div>

          {/* Sección de Comprobante / Fotografía */}
          <div className="flex flex-col gap-2 bg-surface/60 border border-border/20 rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                Comprobante o Ticket
              </span>
              {archivoComprobante && (
                <span className="text-[10px] text-signal font-semibold">
                  Listo para adjuntar
                </span>
              )}
            </div>

            {/* Hidden File Inputs */}
            <input
              ref={camaraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleSeleccionarArchivo}
            />
            <input
              ref={archivoInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleSeleccionarArchivo}
            />

            {!archivoComprobante ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => camaraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface border border-border/30 hover:border-route-action/50 text-text-primary text-xs font-bold transition-all cursor-pointer hover:bg-surface-elevated active:scale-95"
                >
                  <svg className="w-4 h-4 text-route-action shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Tomar foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => archivoInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-surface border border-border/30 hover:border-route-action/50 text-text-primary text-xs font-bold transition-all cursor-pointer hover:bg-surface-elevated active:scale-95"
                >
                  <svg className="w-4 h-4 text-route-action shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Subir archivo</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-surface-elevated rounded-xl p-2.5 border border-border/30">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Vista previa comprobante"
                      width={40}
                      height={40}
                      unoptimized
                      className="w-10 h-10 object-cover rounded-lg border border-border/30 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-text-tertiary shrink-0 border border-border/20">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </div>
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold text-text-primary truncate">
                      {archivoComprobante.name}
                    </span>
                    <span className="text-[10px] text-text-tertiary">
                      {(archivoComprobante.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuitarComprobante}
                  className="p-1.5 text-danger hover:text-danger/80 rounded-lg hover:bg-danger/10 transition-colors cursor-pointer shrink-0"
                  title="Quitar comprobante"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {errorGasto && <Aviso tono="danger">{errorGasto}</Aviso>}
          {exitoGasto && <Aviso tono="info">{exitoGasto}</Aviso>}

        </form>

        {/* Listado de Gastos Registrados */}
        <div className="flex flex-col gap-2 border-t border-border/15 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-display font-bold text-text-tertiary uppercase tracking-wider text-[10px]">
              Gastos Registrados ({gastosList.length})
            </span>
            <span className="font-display font-black text-text-primary text-sm tabular-nums">
              Total: ${totalGastos.toFixed(2)} MXN
            </span>
          </div>

          {gastosList.length === 0 ? (
            <p className="text-xs text-text-tertiary italic text-center py-4">
              No has registrado gastos en este traslado aún.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
              {gastosList.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between bg-surface border border-border/20 rounded-xl p-2.5 text-xs gap-2"
                >
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-text-primary">
                        {obtenerEtiquetaGasto(g.tipo)}
                      </span>
                      {g.comprobante_ruta && (
                        <button
                          type="button"
                          onClick={() => handleVerComprobante(g.id, g.comprobante_ruta!)}
                          disabled={resolviendoGastoId === g.id}
                          className="inline-flex items-center gap-1 text-[10px] text-route-action font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0 disabled:opacity-50"
                          title="Ver comprobante adjunto (genera enlace seguro temporal)"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                          </svg>
                          <span>{resolviendoGastoId === g.id ? "Cargando…" : "Ticket"}</span>
                        </button>
                      )}
                    </div>
                    {g.descripcion && (
                      <span className="text-[10px] text-text-tertiary mt-0.5 truncate">{g.descripcion}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-text-primary tabular-nums">
                      ${g.monto.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEliminarGasto(g.id)}
                      disabled={eliminandoId === g.id}
                      className="min-h-11 min-w-11 p-2 flex items-center justify-center text-text-tertiary hover:text-danger rounded-md hover:bg-surface-elevated transition-colors cursor-pointer disabled:opacity-40"
                      title="Eliminar gasto"
                      aria-label="Eliminar gasto"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onCerrar}
          className="w-full py-2.5 rounded-xl bg-surface hover:bg-surface-elevated text-text-secondary font-display text-xs font-bold uppercase tracking-wider transition-all cursor-pointer mt-2 border border-border/20"
        >
          Volver a Detalles del Traslado
        </button>
      </div>
    </TripDialog>
  );
}
