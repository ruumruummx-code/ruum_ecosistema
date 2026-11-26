"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Aviso } from "@ruum/ui";
import {
  FILTROS_PERIODO,
  FILTROS_SERVICIO,
  FILTROS_ZONA,
  GRUPOS_REPORTE,
  RESUMEN_EJECUTIVO,
  EXPORTACIONES,
  type ExportacionRealizada,
  type ModoReporte,
  type PeriodoReporte
} from "./ReportesTipos";
import {
  FiltroSegmentado,
  FiltroSelect,
  GrupoReportes,
  KpiEjecutivo,
  ModalExportacion,
  PanelGraficaPlaceholder,
  PanelTablaPlaceholder
} from "./ReportesComponentes";

function etiquetaRango(periodo: PeriodoReporte) {
  if (periodo === "hoy") return "Hoy";
  if (periodo === "semana") return "Semana actual";
  if (periodo === "mes") return "Mes actual";
  return "Rango personalizado";
}

function nombreArchivoPagos() {
  return `pagos-${new Date().toISOString().slice(0, 10)}.csv`;
}

function descargarArchivo(contenido: string, nombre: string, tipo: string) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ReportesCliente() {
  const [periodo, setPeriodo] = useState<PeriodoReporte>("semana");
  const [modo, setModo] = useState<ModoReporte>("operacion");
  const [zona, setZona] = useState("Todas");
  const [servicio, setServicio] = useState("Todos");
  const [exportando, setExportando] = useState<string | null>(null);
  const [exportacion, setExportacion] = useState<ExportacionRealizada | null>(null);
  const [errorExportacion, setErrorExportacion] = useState<string | null>(null);

  const gruposVisibles = useMemo(() => {
    if (modo === "finanzas") {
      return GRUPOS_REPORTE.filter((grupo) => grupo.categoria === "Finanzas" || grupo.categoria === "Cuentas empresariales");
    }
    return GRUPOS_REPORTE.filter((grupo) => grupo.categoria !== "Finanzas");
  }, [modo]);

  const rango = etiquetaRango(periodo);

  async function exportarPagos() {
    setExportando("Pagos");
    setErrorExportacion(null);
    try {
      const respuesta = await fetch("/api/exportaciones/pagos", { cache: "no-store" });
      if (!respuesta.ok) throw new Error("La exportación no pudo completarse.");
      const csv = await respuesta.text();
      const hash = respuesta.headers.get("x-content-sha256") ?? "No informado";
      const traceId = respuesta.headers.get("x-request-id") ?? "Sin trace";
      descargarArchivo(csv, nombreArchivoPagos(), "text/csv;charset=utf-8");
      setExportacion({
        recurso: "Pagos",
        fecha: new Date().toISOString(),
        rango,
        hash,
        traceId
      });
    } catch (error) {
      setErrorExportacion(error instanceof Error ? error.message : "No pudimos exportar el reporte.");
    } finally {
      setExportando(null);
    }
  }

  return (
    <main className="admin-page-shell">
      <header className="rounded-lg border border-ui-line bg-ui-card p-5 shadow-ui-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono-ruum text-xs uppercase tracking-[0.16em] text-ui-brand">Torre de Control</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ui-fg">Reportes</h1>
            <p className="mt-2 max-w-3xl font-body text-sm leading-6 text-ui-fg-muted">
              Indicadores ejecutivos para operación, finanzas, conductores y cuentas empresariales.
            </p>
          </div>
          <div className="rounded-lg border border-ui-brand/30 bg-ui-brand-soft px-4 py-3">
            <p className="font-body text-sm font-semibold text-ui-brand-soft-fg">Versión MVP</p>
            <p className="mt-1 max-w-md font-body text-xs leading-5 text-ui-fg-muted">
              Esta vista está en versión MVP. Las tarjetas atenuadas indican reportes aún no conectados al motor de datos real.
            </p>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-20 mt-4 rounded-lg border border-ui-line bg-ui-card p-3 shadow-ui-sm backdrop-blur" aria-label="Filtros globales de reportes">
        <div className="flex flex-wrap items-center gap-3">
          <FiltroSegmentado label="Periodo" items={FILTROS_PERIODO} value={periodo} onChange={setPeriodo} />
          <FiltroSegmentado
            label="Modo"
            items={[{ id: "operacion", etiqueta: "Modo operación" }, { id: "finanzas", etiqueta: "Modo finanzas" }]}
            value={modo}
            onChange={setModo}
          />
          <FiltroSelect label="Zona" value={zona} options={FILTROS_ZONA} onChange={setZona} />
          <FiltroSelect label="Tipo de servicio" value={servicio} options={FILTROS_SERVICIO} onChange={setServicio} />
        </div>
      </nav>

      <section className="mt-4 grid gap-3 lg:grid-cols-3" aria-label="Resumen ejecutivo de reportes">
        {RESUMEN_EJECUTIVO.map((metrica) => (
          <KpiEjecutivo key={metrica.titulo} metrica={metrica} />
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(24rem,0.8fr)]">
        <PanelGraficaPlaceholder periodo={rango} zona={zona} servicio={servicio} />
        <PanelTablaPlaceholder />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2" aria-label="Bloques de indicadores por categoría">
        {gruposVisibles.map((grupo) => (
          <GrupoReportes key={grupo.categoria} grupo={grupo} />
        ))}
      </section>

      <section className="mt-5 rounded-lg border border-ui-line bg-ui-card p-5 shadow-ui-sm" aria-label="Exportaciones seguras">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Exportación y seguridad</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-ui-fg">Reportes descargables</h2>
            <p className="mt-1 max-w-3xl font-body text-sm leading-6 text-ui-fg-muted">
              Exportación segura: limita filas, neutraliza fórmulas CSV y registra una huella SHA-256 para trazabilidad.
            </p>
          </div>
          {errorExportacion && <Aviso tono="danger">{errorExportacion}</Aviso>}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {EXPORTACIONES.map((item) => (
            <article key={item.recurso} className={`rounded-lg border p-4 ${item.disponible ? "border-ui-line bg-ui-muted" : "border-ui-line bg-ui-muted opacity-70"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-semibold text-ui-fg">{item.recurso}</h3>
                  <p className="mt-1 font-body text-xs leading-5 text-ui-fg-muted">{item.descripcion}</p>
                </div>
                <span className="rounded-full border border-ui-line bg-ui-card px-2 py-1 font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">
                  CSV
                </span>
              </div>
              {item.disponible ? (
                <button
                  type="button"
                  onClick={exportarPagos}
                  disabled={exportando === item.recurso}
                  title="Exportación segura: limita filas, neutraliza fórmulas y registra SHA-256."
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-ui-brand bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-fg shadow-sm hover:bg-ui-brand-hover disabled:cursor-wait disabled:opacity-70"
                >
                  {exportando === item.recurso ? "Exportando..." : "Exportar pagos CSV"}
                </button>
              ) : (
                <Link href={item.href} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-ui-line px-4 py-2 font-body text-sm font-semibold text-ui-fg-muted hover:border-ui-brand/40 hover:text-ui-fg">
                  Preparar fuente
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      {exportacion && <ModalExportacion exportacion={exportacion} onClose={() => setExportacion(null)} />}
    </main>
  );
}
