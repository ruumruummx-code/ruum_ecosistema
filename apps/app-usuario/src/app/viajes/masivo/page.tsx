"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavegacionUsuario } from "../../NavegacionUsuario";
import { BottomSheetCargaMasiva } from "../nuevo/components/carga-masiva/BottomSheetCargaMasiva";
import { useCargaMasiva, STORAGE_KEY_CARGA_ACTIVA } from "../nuevo/hooks/useCargaMasiva";

interface CargaResumen {
  id: string;
  totalMXN: number;
  cantidad_traslados: number;
  creado_en?: string;
}

export default function PaginaViajesMasivo() {
  const router = useRouter();
  const [cargasPendientes, setCargasPendientes] = useState<CargaResumen[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [cargaSeleccionadaParaRetome, setCargaSeleccionadaParaRetome] = useState<string | null>(null);

  const {
    consultarCargasPendientes,
    descartarCargaPendiente,
  } = useCargaMasiva();

  useEffect(() => {
    let activo = true;
    void (async () => {
      setCargandoLista(true);
      try {
        const pendientes = await consultarCargasPendientes();
        if (activo) {
          setCargasPendientes(pendientes);
          // Si hay una en storage y está en la lista de pendientes, sugerirla
          const guardada = localStorage.getItem(STORAGE_KEY_CARGA_ACTIVA);
          if (guardada && pendientes.some((p) => p.id === guardada)) {
            setCargaSeleccionadaParaRetome(guardada);
          } else if (pendientes.length > 0) {
            setCargaSeleccionadaParaRetome(pendientes[0]!.id);
          }
        }
      } finally {
        if (activo) setCargandoLista(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [consultarCargasPendientes]);

  const refrescarLista = async () => {
    setCargandoLista(true);
    const lista = await consultarCargasPendientes();
    setCargasPendientes(lista);
    setCargandoLista(false);
  };

  const manejarDescartar = async (id: string) => {
    await descartarCargaPendiente(id);
    if (cargaSeleccionadaParaRetome === id) {
      setCargaSeleccionadaParaRetome(null);
    }
    await refrescarLista();
  };

  return (
    <>
      <NavegacionUsuario variante="claro" />
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col bg-[var(--user-color-bg)] px-4 pb-28 pt-6 text-[var(--user-color-fg)]">
        {/* Encabezado con navegación */}
        <header className="mb-6 flex items-center justify-between border-b border-[var(--user-color-border)] pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex size-10 items-center justify-center rounded-xl border border-[var(--user-color-border)] text-lg hover:bg-[var(--user-color-brand-soft)]"
              aria-label="Volver al inicio"
            >
              ‹
            </Link>
            <div>
              <h1 className="text-xl font-black">Carga Masiva de Traslados</h1>
              <p className="text-xs text-[var(--user-color-muted)]">
                Cotiza y procesa múltiples traslados desde un archivo .xlsx
              </p>
            </div>
          </div>
          <Link
            href="/mis-viajes"
            className="text-xs font-semibold text-[var(--user-color-action)] underline underline-offset-2"
          >
            Mis viajes
          </Link>
        </header>

        {/* Sección: Cargas pendientes encontradas */}
        {!cargandoLista && cargasPendientes.length > 0 && (
          <section
            aria-labelledby="titulo-cargas-pendientes"
            className="mb-6 rounded-2xl border-2 border-[var(--user-color-action)] bg-[var(--user-color-brand-soft)] p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-xl">⏱️</span>
              <h2 id="titulo-cargas-pendientes" className="text-sm font-extrabold uppercase tracking-wider text-[var(--user-color-action)]">
                Cargas pendientes de pago ({cargasPendientes.length})
              </h2>
            </div>
            <p className="mt-1 text-xs text-[var(--user-color-muted)]">
              Tienes cotizaciones previas iniciadas. Puedes reanudarlas antes de subir una nueva carga.
            </p>

            <ul className="mt-3 divide-y divide-[var(--user-color-border)]/60">
              {cargasPendientes.map((c) => (
                <li key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold">
                      ${c.totalMXN.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                    </p>
                    <p className="text-xs text-[var(--user-color-muted)]">
                      {c.cantidad_traslados} traslado{c.cantidad_traslados !== 1 ? "s" : ""}
                      {c.creado_en ? ` · Creado el ${new Date(c.creado_en).toLocaleString("es-MX")}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem(STORAGE_KEY_CARGA_ACTIVA, c.id);
                        } catch {}
                        setCargaSeleccionadaParaRetome(c.id);
                        window.location.reload();
                      }}
                      className="rounded-xl bg-[var(--user-color-action)] px-4 py-2 text-xs font-bold text-[var(--user-color-on-action)]"
                    >
                      Reanudar carga
                    </button>
                    <button
                      type="button"
                      onClick={() => void manejarDescartar(c.id)}
                      className="rounded-xl border border-[var(--user-color-border)] px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      Descartar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Módulo principal interactivo */}
        <main className="flex min-h-[520px] flex-1 flex-col rounded-3xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] shadow-md overflow-hidden">
          <BottomSheetCargaMasiva onCerrar={() => router.push("/mis-viajes")} />
        </main>
      </div>
    </>
  );
}
