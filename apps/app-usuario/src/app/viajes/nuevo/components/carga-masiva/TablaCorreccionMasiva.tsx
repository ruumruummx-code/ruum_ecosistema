"use client";
import React, { useCallback, useRef, useState } from "react";
import type { FilaMasiva } from "../../hooks/useCargaMasiva";

// Campos editables de la plantilla con etiquetas legibles
const CAMPOS_EDITABLES: Array<{ key: string; etiqueta: string; tipo?: string }> = [
  { key: "origenCodigoPostal", etiqueta: "CP Origen" },
  { key: "destinoCodigoPostal", etiqueta: "CP Destino" },
  { key: "marca", etiqueta: "Marca" },
  { key: "modelo", etiqueta: "Modelo" },
  { key: "anio", etiqueta: "Año" },
  { key: "condicion", etiqueta: "Condición" },
  { key: "entregaNombre", etiqueta: "Nombre Entrega" },
  { key: "entregaTelefono", etiqueta: "Tel. Entrega", tipo: "tel" },
  { key: "recepcionNombre", etiqueta: "Nombre Recepción" },
  { key: "recepcionTelefono", etiqueta: "Tel. Recepción", tipo: "tel" },
  ...["vehiculo_placas", "vehiculo_vin", "origen_calle", "origen_numero", "origen_colonia", "destino_calle", "destino_numero", "destino_colonia", "tipo_traslado", "modalidad_programacion", "fecha_hora_programada", "ventana_recoleccion_horario", "ventana_entrega_horario"].map(key => ({ key, etiqueta: key.replaceAll("_", " ") })),
];

interface Props {
  filas: FilaMasiva[];
  onCorregir: (indice: number, campo: string, valor: string) => void;
  onEliminar: (indice: number) => void;
}

interface CeldaEditandoState {
  indice: number;
  campo: string;
  valor: string;
}

export function TablaCorreccionMasiva({ filas, onCorregir, onEliminar }: Props) {
  const [editando, setEditando] = useState<CeldaEditandoState | null>(null);
  const [filaActiva, setFilaActiva] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const iniciarEdicion = useCallback((indice: number, campo: string, valorActual: string) => {
    setEditando({ indice, campo, valor: valorActual });
    setFilaActiva(indice);
    // Enfocar input en el siguiente frame
    setTimeout(() => inputRef.current?.select(), 50);
  }, []);

  const confirmarEdicion = useCallback(() => {
    if (!editando) return;
    onCorregir(editando.indice, editando.campo, editando.valor);
    setEditando(null);
  }, [editando, onCorregir]);

  const cancelarEdicion = useCallback(() => {
    setEditando(null);
  }, []);

  const filasConError = filas.filter((f) => f.estado === "error");
  const filasCorrectas = filas.filter((f) => f.estado === "correcto");

  if (filas.length === 0) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* ─── Resumen ─────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 rounded-xl bg-[var(--user-color-surface)] px-4 py-3">
        <div className="flex-1 text-center">
          <p className="text-2xl font-black text-[var(--user-color-primary)]">{filas.length}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--user-color-muted)]">Total</p>
        </div>
        <div className="h-8 w-px bg-[var(--user-color-border)]" />
        <div className="flex-1 text-center">
          <p className="text-2xl font-black text-green-600">{filasCorrectas.length}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--user-color-muted)]">Correctas</p>
        </div>
        <div className="h-8 w-px bg-[var(--user-color-border)]" />
        <div className="flex-1 text-center">
          <p className="text-2xl font-black text-red-600">{filasConError.length}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--user-color-muted)]">Con Error</p>
        </div>
      </div>

      {/* ─── Lista de filas ───────────────────────────────────── */}
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        role="list"
        aria-label="Filas de la carga masiva"
      >
        {filas.map((fila) => (
          <FilaItem
            key={fila.indice}
            fila={fila}
            activa={filaActiva === fila.indice}
            editando={editando?.indice === fila.indice ? editando : null}
            inputRef={inputRef}
            onActivar={() => setFilaActiva((p) => (p === fila.indice ? null : fila.indice))}
            onIniciarEdicion={iniciarEdicion}
            onConfirmar={confirmarEdicion}
            onCancelar={cancelarEdicion}
            onCambio={(valor) => setEditando((prev) => prev ? { ...prev, valor } : null)}
            onEliminar={() => onEliminar(fila.indice)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Sub-componente FilaItem ────────────────────────────────────────────────

interface FilaItemProps {
  fila: FilaMasiva;
  activa: boolean;
  editando: { campo: string; valor: string } | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onActivar: () => void;
  onIniciarEdicion: (indice: number, campo: string, valor: string) => void;
  onConfirmar: () => void;
  onCancelar: () => void;
  onCambio: (valor: string) => void;
  onEliminar: () => void;
}

function FilaItem({
  fila,
  activa,
  editando,
  inputRef,
  onActivar,
  onIniciarEdicion,
  onConfirmar,
  onCancelar,
  onCambio,
  onEliminar,
}: FilaItemProps) {
  const tieneError = fila.estado === "error";
  const camposConError = Object.keys(fila.errores ?? {});

  return (
    <div
      role="listitem"
      className={[
        "mb-2 rounded-2xl border transition-all",
        tieneError
          ? "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/30"
          : "border-[var(--user-color-border)] bg-[var(--user-color-surface)]",
      ].join(" ")}
    >
      {/* ── Cabecera de la fila ── */}
      <button
        type="button"
        onClick={onActivar}
        aria-expanded={activa}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={[
            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            tieneError
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white",
          ].join(" ")}
          aria-hidden="true"
        >
          {tieneError ? "!" : "✓"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">
            #{fila.indice + 1} · {fila.datos.marca || "Sin marca"} {fila.datos.modelo || ""}
          </p>
          <p className="truncate text-xs text-[var(--user-color-muted)]">
            {fila.datos.origenCodigoPostal || "–"} → {fila.datos.destinoCodigoPostal || "–"}
            {tieneError && ` · ${camposConError.length} campo${camposConError.length !== 1 ? "s" : ""} con error`}
            {fila.validando && " · Validando…"}
          </p>
        </div>
        {fila.tarifa != null && (
          <span className="shrink-0 text-sm font-bold text-green-600">
            ${fila.tarifa.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
        <span aria-hidden="true" className="shrink-0 text-[var(--user-color-muted)]">
          {activa ? "▲" : "▼"}
        </span>
      </button>

      {/* ── Panel expandido de edición ── */}
      {activa && (
        <div className="border-t border-[var(--user-color-border)] px-4 pb-4 pt-3">
          {/* Campos editables */}
          <div className="grid grid-cols-2 gap-2">
            {CAMPOS_EDITABLES.map(({ key, etiqueta, tipo }) => {
              const valorActual = String(fila.datos[key] ?? "");
              const hayError = Boolean(fila.errores?.[key]);
              const estaEditando = editando?.campo === key;

              return (
                <div
                  key={key}
                  className={[
                    "relative rounded-xl border p-2",
                    hayError
                      ? "border-red-400 bg-red-50/50 dark:border-red-700"
                      : "border-[var(--user-color-border)] bg-[var(--user-color-background)]",
                  ].join(" ")}
                >
                  <p className="text-[10px] font-semibold text-[var(--user-color-muted)]">{etiqueta}</p>
                  {estaEditando ? (
                    <div className="flex items-center gap-1">
                      <input
                        ref={inputRef}
                        type={tipo ?? "text"}
                        value={editando?.valor ?? ""}
                        onChange={(e) => onCambio(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onConfirmar();
                          if (e.key === "Escape") onCancelar();
                        }}
                        onBlur={onConfirmar}
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                        aria-label={`Editar ${etiqueta}`}
                        inputMode={tipo === "tel" ? "numeric" : undefined}
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); onConfirmar(); }}
                        className="size-6 shrink-0 rounded-lg bg-green-500 text-xs text-white"
                        aria-label="Confirmar"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onIniciarEdicion(fila.indice, key, valorActual)}
                      className={[
                        "w-full text-left text-sm",
                        hayError ? "font-bold text-red-600" : "font-semibold",
                      ].join(" ")}
                      aria-label={`Editar ${etiqueta}: ${valorActual || "vacío"}`}
                    >
                      {valorActual || <span className="italic text-[var(--user-color-muted)]">Vacío</span>}
                    </button>
                  )}
                  {hayError && !estaEditando && (
                    <p className="mt-1 text-[10px] text-red-600" role="alert">
                      {fila.errores?.[key]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botón eliminar fila */}
          <button
            type="button"
            onClick={onEliminar}
            className="mt-3 min-h-10 w-full rounded-xl bg-red-50 text-sm font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400"
          >
            Omitir esta fila
          </button>
        </div>
      )}
    </div>
  );
}
