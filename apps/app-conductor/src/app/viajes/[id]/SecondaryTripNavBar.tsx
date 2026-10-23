"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import type { Database } from "@ruum/shared/types";
import { extraerRutaComprobante } from "@ruum/api/services";
import { listarGastosTraslado } from "@ruum/api/drivers";
import { subirArchivoEvidenciaStorage } from "@ruum/api/custody";
import { GastosModal } from "./gastos/GastosModal";
import { IncidenciaModal } from "./incidencia/IncidenciaModal";
import type { GastoRegistro, GastoTipoDb } from "./gastos/gastos-types";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
export type { GastoTipoDb } from "./gastos/gastos-types";

const BUCKET_EVIDENCIA = "evidencia";
const MAX_COMPROBANTE_BYTES = 10 * 1024 * 1024; // 10 MB

async function subirComprobanteGasto(
  cliente: ReturnType<typeof crearClienteNavegador>,
  trasladoId: string,
  archivo: File
): Promise<{ ruta: string }> {
  if (archivo.size > MAX_COMPROBANTE_BYTES) {
    throw new Error("El comprobante debe pesar máximo 10 MB.");
  }

  const { data: sesion } = await cliente.auth.getUser();
  const authUserId = sesion?.user?.id || "conductor";

  const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
  const nombreLimpio = archivo.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
  const ruta = `${authUserId}/${trasladoId}/gastos/${id}-${nombreLimpio}.${extension}`;

  const { error: uploadError } = await subirArchivoEvidenciaStorage(cliente, ruta, archivo, {
    upsert: false,
    contentType: archivo.type || "image/jpeg",
  });

  if (uploadError) {
    console.warn("Aviso al subir comprobante a storage:", uploadError);
    throw uploadError;
  }

  return { ruta };
}

export function SecondaryTripNavBar({
  trasladoId,
  pasaporte: _pasaporte,
}: {
  trasladoId: string;
  pasaporte: PasaporteRow;
}) {
  const [tabActiva, setTabActiva] = useState<"detalles" | "gastos" | "incidencia">("detalles");
  const [gastosList, setGastosList] = useState<GastoRegistro[]>([]);

  // Fetch registered expenses on load
  useEffect(() => {
    async function cargarGastos() {
      try {
        const data = await listarGastosTraslado(crearClienteNavegador(), trasladoId);
        if (data) {
          setGastosList(
            data.map((g) => {
              const { ruta, texto } = extraerRutaComprobante(g.descripcion, g.comprobante_ruta);
              return {
                id: String(g.id),
                tipo: (g.tipo as GastoTipoDb) || "otro",
                monto: Number(g.monto || 0),
                descripcion: texto || g.descripcion || null,
                comprobante_ruta: ruta,
                registrado_en: g.registrado_en || new Date().toISOString(),
              };
            })
          );
        }
      } catch (err) {
        console.warn("Error al obtener gastos:", err);
      }
    }
    if (trasladoId) {
      cargarGastos();
    }
  }, [trasladoId]);

  return (
    <>
      {/* Modal: GASTOS DEL TRASLADO */}
      {tabActiva === "gastos" && (
        <GastosModal
          trasladoId={trasladoId}
          onCerrar={() => setTabActiva("detalles")}
          gastosList={gastosList}
          setGastosList={setGastosList}
          onSubirComprobante={subirComprobanteGasto}
        />
      )}

      {/* Modal: REPORTAR INCIDENCIA */}
      {tabActiva === "incidencia" && (
        <IncidenciaModal
          trasladoId={trasladoId}
          onCerrar={() => setTabActiva("detalles")}
        />
      )}

      {/* PESTAÑAS CONTEXTUALES EN EL FLUJO DEL CONTENIDO */}
      <nav
        aria-label="Navegación secundaria del traslado"
        className="my-3 w-full rounded-xl border border-border/20 bg-surface-elevated/60 p-1 select-none"
      >
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
          {/* Pestaña 1: Detalles del traslado */}
          <Link
            href={`/viajes/${trasladoId}/detalles`}
            className="flex flex-wrap items-center justify-center gap-1 py-2 px-2 rounded-xl transition-all duration-200 cursor-pointer text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action min-h-11"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-display text-[10px] uppercase tracking-wider truncate max-w-full">
              Detalles
            </span>
          </Link>

          {/* Pestaña 2: Gastos */}
          <button
            type="button"
            onClick={() => setTabActiva("gastos")}
            aria-haspopup="dialog"
            aria-expanded={tabActiva === "gastos"}
            className={`flex flex-wrap items-center justify-center gap-1 py-2 px-2 rounded-xl transition-all duration-200 cursor-pointer min-h-11 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action ${
              tabActiva === "gastos"
                ? "bg-signal/15 text-signal border border-signal/30 font-extrabold shadow-xs"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60"
            }`}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-display text-[10px] uppercase tracking-wider truncate max-w-full">
              Gastos {gastosList.length > 0 && `(${gastosList.length})`}
            </span>
          </button>

          {/* Pestaña 3: Incidencia */}
          <button
            type="button"
            onClick={() => setTabActiva("incidencia")}
            aria-haspopup="dialog"
            aria-expanded={tabActiva === "incidencia"}
            className={`flex flex-wrap items-center justify-center gap-1 py-2 px-2 rounded-xl transition-all duration-200 cursor-pointer min-h-11 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action ${
              tabActiva === "incidencia"
                ? "bg-warning/15 text-warning border border-warning/30 font-extrabold shadow-xs"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated/60"
            }`}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-display text-[10px] uppercase tracking-wider truncate max-w-full">
              Incidencia
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
