import { Button } from "@ruum/ui";
import type { CargaTrasladosMasivosAdmin, FilaCargaTrasladosMasivosAdmin } from "@ruum/api/services";
import { AdminPanel } from "../admin-ui";
import { descargarCsv } from "./MasivosCsvParser";

export function estadoCarga(estado: CargaTrasladosMasivosAdmin["estado"]) {
  if (estado === "procesada") return "border-ui-success/30 bg-ui-success-soft text-ui-success";
  if (estado === "rechazada" || estado === "cancelada") return "border-ui-danger/25 bg-ui-danger-soft text-ui-danger";
  return "border-ui-warning/40 bg-ui-warning-soft text-ui-warning";
}

export function fecha(fechaIso: string) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(fechaIso));
}

export function progresoCarga(carga: CargaTrasladosMasivosAdmin) {
  if (carga.total_filas === 0) return 0;
  return Math.min(100, Math.round((carga.filas_procesadas / carga.total_filas) * 100));
}

export function TablaHistorialMasivos({
  cargas,
  filasPorCarga,
  cargando,
  procesando,
  onProcesarCarga,
  onCancelarCarga
}: {
  cargas: CargaTrasladosMasivosAdmin[];
  filasPorCarga: Map<string, FilaCargaTrasladosMasivosAdmin[]>;
  cargando: boolean;
  procesando: boolean;
  onProcesarCarga: (id: string) => void;
  onCancelarCarga: (id: string) => void;
}) {
  return (
    <AdminPanel className="admin-table-card mt-6">
      <table>
        <caption className="sr-only">Historial de cargas masivas</caption>
        <thead>
          <tr>
            <th>Lote</th>
            <th>Archivo</th>
            <th>Progreso</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-ui-fg-muted">
                Cargando...
              </td>
            </tr>
          ) : cargas.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-ui-fg-muted">
                No hay cargas masivas registradas.
              </td>
            </tr>
          ) : (
            cargas.map((carga) => {
              const errores = (filasPorCarga.get(carga.id) ?? []).filter((fila) => fila.estado === "error");
              return (
                <tr key={carga.id}>
                  <td className="font-mono-ruum text-sm text-ui-brand-soft-fg">{carga.id.slice(0, 8).toUpperCase()}</td>
                  <td>
                    {carga.nombre_archivo}
                    {carga.hash_archivo && (
                      <p className="font-mono-ruum text-xs text-ui-fg-muted">{carga.hash_archivo.slice(0, 12)}...</p>
                    )}
                  </td>
                  <td>
                    <div className="min-w-36">
                      <div className="flex items-center justify-between font-body text-xs text-ui-fg-muted">
                        <span>
                          {carga.filas_procesadas}/{carga.total_filas}
                        </span>
                        <span>{progresoCarga(carga)}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-ui-muted">
                        <div className="h-full bg-ui-brand" style={{ width: `${progresoCarga(carga)}%` }} />
                      </div>
                      <p className="mt-1 text-xs">
                        {carga.filas_creadas} creadas · {carga.filas_error} error
                      </p>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`rounded-full border px-2.5 py-1 font-body text-xs font-semibold ${estadoCarga(carga.estado)}`}
                    >
                      {carga.estado.replaceAll("_", " ")}
                    </span>
                    {errores[0]?.errores[0] && <p className="mt-1 text-xs text-ui-danger">{errores[0].errores[0]}</p>}
                  </td>
                  <td className="font-body text-sm text-ui-fg-muted">{fecha(carga.creado_en)}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {(carga.estado === "pendiente" || carga.estado === "procesando") && (
                        <Button variant="quiet" disabled={procesando} onClick={() => onProcesarCarga(carga.id)}>
                          Reanudar
                        </Button>
                      )}
                      {carga.estado === "pendiente" && (
                        <Button variant="quiet" disabled={procesando} onClick={() => onCancelarCarga(carga.id)}>
                          Cancelar
                        </Button>
                      )}
                      {carga.reporte_errores_csv && (
                        <Button
                          variant="quiet"
                          onClick={() =>
                            descargarCsv(`errores-${carga.id.slice(0, 8)}.csv`, carga.reporte_errores_csv ?? "")
                          }
                        >
                          Errores CSV
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </AdminPanel>
  );
}
