"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@ruum/ui";
import { obtenerReporteCustodia, type EventoCustodia, type ReporteCustodia } from "@ruum/api/custody";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import { AdminPageHeader } from "@/app/admin-ui";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "@/app/admin-components";

function fechaCorta(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" }).format(d);
}

function EventoItem({ evento }: { evento: EventoCustodia }) {
  return (
    <li className="rounded-lg border border-border-default bg-surface-primary p-4">
      <p className="font-body text-sm font-semibold text-ink">
        {evento.tipo} — <time dateTime={evento.ocurrido_en}>{fechaCorta(evento.ocurrido_en)}</time>
      </p>
      <p className="mt-1 font-body text-xs text-text-secondary">
        Quién: {evento.actor_tipo}
        {evento.actor_id ? ` (${evento.actor_id.slice(0, 8)}…)` : ""} · Cuándo: {fechaCorta(evento.ocurrido_en)} · Dónde:{" "}
        {evento.lat != null && evento.lng != null ? `${evento.lat}, ${evento.lng}` : "sin GPS"}
        {evento.odometro != null ? ` · Odómetro: ${evento.odometro}` : ""}
        {evento.combustible ? ` · Combustible: ${evento.combustible}` : ""}
        {evento.pin_verificado ? " · PIN verificado" : ""}
        {evento.firma_metodo ? ` · Firma: ${evento.firma_metodo}` : ""}
      </p>
      {evento.notas ? <p className="mt-2 font-body text-sm text-text-primary">{evento.notas}</p> : null}
      {evento.fotos.length > 0 ? (
        <ul className="mt-2 grid gap-1">
          {evento.fotos.map((foto) => (
            <li key={foto.id} className="font-body text-xs text-text-secondary">
              {foto.angulo} ({foto.tipo}){foto.url ? (
                <>
                  {" — "}
                  <a href={foto.url} target="_blank" rel="noreferrer" className="font-semibold text-status-info underline underline-offset-2">ver foto</a>
                </>
              ) : (
                " — sin URL"
              )}{" "}
              <time dateTime={foto.capturada_en}>{fechaCorta(foto.capturada_en)}</time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 font-body text-xs text-text-tertiary">Sin evidencia fotográfica enlazada.</p>
      )}
      <p className="mt-2 font-mono-ruum text-xs text-text-tertiary">hash {evento.hash_cadena.slice(0, 12)}…</p>
    </li>
  );
}

export default function PaginaCustodiaTraslado() {
  const { id } = useParams<{ id: string }>();
  const [reporte, setReporte] = useState<ReporteCustodia | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    if (!tieneSupabaseConfigurado()) {
      setError("Supabase no está configurado en este entorno.");
      setCargando(false);
      return;
    }
    try {
      setReporte(await obtenerReporteCustodia(crearClienteNavegador(), id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la custodia.");
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => void cargar(), 0);
    return () => clearTimeout(timer);
  }, [cargar]);

  function descargarReporte() {
    if (!reporte) return;
    const blob = new Blob([JSON.stringify(reporte, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `custodia-${reporte.traslado_id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMensaje("Reporte descargado (JSON listo para futuro PDF).");
  }

  if (cargando) return <AdminLoadingState label="Cargando cadena de custodia…" />;
  if (error && !reporte) {
    return <AdminErrorState description={error} action={<Button onClick={() => void cargar()}>Reintentar</Button>} />;
  }
  if (!reporte) return <AdminEmptyState title="Sin reporte" description="No hay datos de custodia." />;

  return (
    <div className="admin-page-shell">
      <AdminPageHeader
        titulo="Cadena de custodia"
        descripcion={`Traslado ${reporte.traslado_id.slice(0, 8)}… · ${reporte.total_eventos} eventos · Cadena ${
          reporte.cadena_integra ? "íntegra" : "rota"
        }`}
        accion={<Button variant="secondary" onClick={() => window.history.back()}>Volver al traslado</Button>}
      />

      {mensaje ? <p role="status">{mensaje}</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      {!reporte.cadena_integra ? (
        <p role="alert">
          <strong>Alerta de integridad:</strong> la cadena no verifica. Escalar a investigación antes de cerrar.
        </p>
      ) : null}

      <section aria-labelledby="custodia-vehiculo" className="admin-panel mt-4 p-5">
        <h2 id="custodia-vehiculo" className="font-display text-lg font-semibold text-ink">Vehículo</h2>
        {reporte.vehiculo ? (
          <p>
            {reporte.vehiculo.marca ?? "—"} {reporte.vehiculo.modelo ?? ""} · Placas {reporte.vehiculo.placas ?? "—"} ·
            VIN {reporte.vehiculo.vin ?? "—"}
          </p>
        ) : (
          <p>Sin vehículo asociado.</p>
        )}
      </section>

      <section aria-labelledby="custodia-timeline" className="admin-panel mt-4 p-5">
        <h2 id="custodia-timeline" className="font-display text-lg font-semibold text-ink">Movimientos ({reporte.eventos.length})</h2>
        {reporte.eventos.length === 0 ? (
          <AdminEmptyState title="Sin eventos" description="Aún no hay movimientos de custodia registrados." />
        ) : (
          <ul>
            {reporte.eventos.map((evento) => (
              <EventoItem key={evento.id} evento={evento} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="custodia-reporte" className="admin-panel mt-4 p-5">
        <h2 id="custodia-reporte" className="font-display text-lg font-semibold text-ink">Reporte</h2>
        <p>Generado {fechaCorta(reporte.generado_en)} · Estructura lista para futuro PDF.</p>
        <Button onClick={descargarReporte}>Descargar JSON</Button>
      </section>
    </div>
  );
}
