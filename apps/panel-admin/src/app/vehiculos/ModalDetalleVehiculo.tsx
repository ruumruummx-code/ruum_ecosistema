import Image from "next/image";
import { Aviso } from "@ruum/ui";
import type { EvidenciaVehiculoTraslado } from "@ruum/api/services";
import { AdminLoadingState } from "../admin-components";
import {
  ETIQUETA_ANGULO,
  ETIQUETA_TIPO_EVIDENCIA,
  fechaHora,
  type Vehiculo
} from "./VehiculosTipos";

export function ModalDetalleVehiculo({
  vehiculo,
  evidencia,
  cargandoEvidencia,
  errorEvidencia,
  urlsFirmadas,
  onCerrar
}: {
  vehiculo: Vehiculo;
  evidencia: EvidenciaVehiculoTraslado[];
  cargandoEvidencia: boolean;
  errorEvidencia: string | null;
  urlsFirmadas: Map<string, string>;
  onCerrar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ui-overlay pt-10">
      <div className="mx-4 mb-10 w-full max-w-3xl rounded-lg border border-ui-line bg-ui-card shadow-xl">
        <div className="flex items-center justify-between border-b border-ui-line px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ui-fg">
              {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}
            </h2>
            <p className="font-body text-sm text-ui-fg-muted">
              {vehiculo.placas ?? "Sin placas"} · VIN: {vehiculo.vin ?? "Pendiente"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-2 text-ui-fg-muted hover:bg-ui-muted hover:text-ui-fg"
            aria-label="Cerrar detalle"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 p-6">
          {errorEvidencia && <Aviso tono="atencion">{errorEvidencia}</Aviso>}

          {cargandoEvidencia ? (
            <AdminLoadingState label="Cargando evidencia del vehículo" />
          ) : evidencia.length === 0 ? (
            <div className="rounded-lg border border-ui-line bg-ui-muted p-6 text-center">
              <p className="font-body text-sm text-ui-fg-muted">
                Este vehículo no tiene traslados con evidencia registrada.
              </p>
            </div>
          ) : (
            evidencia.map((traslado) => (
              <div key={traslado.traslado_id} className="rounded-lg border border-ui-line bg-ui-muted p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-body text-sm font-semibold text-ui-fg">
                    Traslado: {traslado.traslado_id.slice(0, 8).toUpperCase()}
                  </p>
                  <span className="rounded-full border border-ui-line-strong px-2.5 py-0.5 font-body text-xs font-semibold text-ui-fg-muted">
                    {traslado.traslado_estado}
                  </span>
                </div>
                {traslado.fotos.length === 0 ? (
                  <p className="font-body text-xs text-ui-fg-muted">Sin fotos en este traslado.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {traslado.fotos.map((foto) => {
                      const url = urlsFirmadas.get(foto.id);
                      return (
                        <div key={foto.id} className="group relative rounded-lg border border-ui-line bg-ui-card p-2">
                          {url ? (
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <Image
                                src={url}
                                alt={`${ETIQUETA_TIPO_EVIDENCIA[foto.tipo] ?? foto.tipo} - ${ETIQUETA_ANGULO[foto.angulo] ?? foto.angulo}`}
                                width={320}
                                height={180}
                                unoptimized
                                className="h-24 w-full rounded object-cover"
                              />
                            </a>
                          ) : (
                            <div className="flex h-24 items-center justify-center rounded bg-ui-muted text-xs text-ui-fg-muted">
                              {foto.sincronizada ? "Sin URL" : "No sincronizada"}
                            </div>
                          )}
                          <div className="mt-1 text-center">
                            <p className="truncate font-body text-xs font-semibold text-ui-fg">
                              {ETIQUETA_ANGULO[foto.angulo] ?? foto.angulo}
                            </p>
                            <p className="font-body text-xs text-ui-fg-muted">
                              {ETIQUETA_TIPO_EVIDENCIA[foto.tipo] ?? foto.tipo}
                            </p>
                            <p className="font-body text-xs text-ui-fg-muted">{fechaHora(foto.capturada_en)}</p>
                          </div>
                          <span
                            className={`absolute right-3 top-3 h-2 w-2 rounded-full ${foto.sincronizada ? "bg-ui-success" : "bg-ui-warning"}`}
                            title={foto.sincronizada ? "Sincronizada" : "Pendiente"}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
