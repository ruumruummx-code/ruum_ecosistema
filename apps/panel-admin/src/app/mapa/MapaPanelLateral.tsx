"use client";

import Link from "next/link";
import { EstadoBadge } from "@ruum/ui";
import type { TrasladoMapa } from "@ruum/api/services";
import { DatoMapa } from "./MapaComponentes";
import {
  ETIQUETA_ESTADO,
  ETIQUETA_PRIORIDAD_MAPA,
  calidadUbicacion,
  prioridadMapa,
  clasePrioridadMapa,
  claseCalidadUbicacion,
  trasladoSinCoordenadas,
  type VistaMapaMovil
} from "./MapaTipos";

interface MapaPanelLateralProps {
  sel: TrasladoMapa | undefined;
  trasladosVisibles: TrasladoMapa[];
  alertasMapa: TrasladoMapa[];
  cargando: boolean;
  seleccionado: string | null;
  detalleColapsado: boolean;
  panelActivosAbierto: boolean;
  vistaMovil: VistaMapaMovil;
  ahora: Date | null;
  onSeleccionarTraslado: (id: string) => void;
  onCerrarSeleccionado: () => void;
  onToggleDetalleColapsado: () => void;
  onCambiarVistaMovil: (vista: VistaMapaMovil) => void;
}

export function MapaPanelLateral({
  sel,
  trasladosVisibles,
  alertasMapa,
  cargando,
  seleccionado,
  detalleColapsado,
  panelActivosAbierto,
  vistaMovil,
  ahora,
  onSeleccionarTraslado,
  onCerrarSeleccionado,
  onToggleDetalleColapsado,
  onCambiarVistaMovil
}: MapaPanelLateralProps) {
  const calidadSeleccionada = sel ? calidadUbicacion(sel, ahora) : null;

  return (
    <>
      <div className={`${vistaMovil === "lista" ? "flex" : "hidden"} min-w-0 flex-col overflow-y-auto border-l border-ui-line ${panelActivosAbierto ? "lg:flex" : "lg:hidden"} lg:w-auto lg:min-w-80 lg:max-w-[24rem]`}>
        {sel && (
          <div className="border-b border-ui-line bg-ui-muted p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono-ruum text-xs uppercase tracking-widest text-ui-fg-muted">Seleccionado</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleDetalleColapsado}
                  className="rounded-lg border border-ui-line-strong px-2.5 py-1.5 font-body text-xs font-semibold text-ui-fg-muted hover:border-ui-brand/40"
                >
                  {detalleColapsado ? "Expandir" : "Colapsar"}
                </button>
                <button
                  type="button"
                  onClick={onCerrarSeleccionado}
                  className="rounded-lg border border-ui-line-strong px-2.5 py-1.5 font-body text-xs font-semibold text-ui-fg-muted hover:border-ui-danger/40"
                  aria-label="Cerrar detalle del traslado seleccionado"
                >
                  Cerrar
                </button>
              </div>
            </div>
            <p className="font-display text-sm font-semibold">{sel.vehiculo_marca} {sel.vehiculo_modelo}</p>
            <p className="font-mono-ruum text-xs text-ui-fg-muted">{sel.origen_ciudad} → {sel.destino_ciudad}</p>
            {!detalleColapsado && (
              <>
                <div className="mt-2"><EstadoBadge estado={sel.estado} /></div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <DatoMapa etiqueta="Conductor" valor={sel.conductor_nombre ?? "Sin conductor"} />
                  <DatoMapa etiqueta="Tiempo desde actualización" valor={calidadSeleccionada?.tiempoTexto ?? "Sin dato"} />
                  <DatoMapa etiqueta="Origen" valor={sel.origen_ciudad ?? "Sin origen"} />
                  <DatoMapa etiqueta="Destino" valor={sel.destino_ciudad ?? "Sin destino"} />
                  <DatoMapa etiqueta="Última posición" valor={calidadSeleccionada?.ultimaPosicion ?? "Sin posición"} />
                  <DatoMapa etiqueta="Fuente" valor={calidadSeleccionada?.fuente ?? "No reportada"} />
                  <DatoMapa etiqueta="Precisión" valor={calidadSeleccionada?.precision ?? "No reportada"} />
                  <DatoMapa etiqueta="Estado de señal" valor={calidadSeleccionada?.estadoTexto ?? "Sin dato"} />
                  <DatoMapa etiqueta="Punto" valor={calidadSeleccionada?.tipoPunto ?? "No confirmado"} />
                  <DatoMapa etiqueta="Último punto válido" valor={calidadSeleccionada?.ultimoPuntoValido ?? "Sin punto válido"} />
                  <DatoMapa etiqueta="Prioridad" valor={ETIQUETA_PRIORIDAD_MAPA[prioridadMapa(sel, ahora)]} />
                </div>
                {sel.tiene_incidencia_abierta && (
                  <div className="mt-2 rounded-lg bg-ui-danger-soft px-3 py-2">
                    <p className="font-body text-xs text-ui-danger">Incidencia abierta</p>
                  </div>
                )}
                {trasladoSinCoordenadas(sel) && (
                  <div className="mt-2 rounded-lg bg-ui-warning-soft px-3 py-2">
                    <p className="font-body text-xs text-ui-warning">Coordenadas incompletas</p>
                  </div>
                )}
              </>
            )}
            <Link
              href={`/viajes/${sel.traslado_id}`}
              className="mt-3 block w-full rounded-lg border border-ui-brand/30 bg-ui-brand-soft py-2 text-center font-body text-sm text-ui-brand-soft-fg transition-colors hover:bg-ui-brand hover:text-ui-on-brand"
            >
              Ver pasaporte
            </Link>
          </div>
        )}

        <div className="p-4">
          <p className="mb-3 font-mono-ruum text-xs uppercase tracking-widest text-ui-fg-muted">Todos los activos</p>
          <div className="flex flex-col gap-2">
            {trasladosVisibles.map((t) => {
              const calidad = calidadUbicacion(t, ahora);
              const prioridad = prioridadMapa(t, ahora);
              return (
                <div
                  id={`mapa-lista-${t.traslado_id}`}
                  key={t.traslado_id}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition-colors hover:-translate-y-0.5 ${
                    seleccionado === t.traslado_id
                      ? "border-ui-brand bg-ui-brand-soft"
                      : t.tiene_incidencia_abierta
                      ? "border-ui-danger/30 bg-ui-danger-soft hover:border-ui-danger/60"
                      : calidad.estadoSenal === "antigua" || calidad.estadoSenal === "sin_senal" || calidad.estadoSenal === "sin_ubicacion"
                      ? "border-ui-warning/30 bg-ui-warning-soft hover:border-ui-warning/60"
                      : "border-ui-line bg-ui-card hover:border-ui-brand/30"
                  }`}
                >
                  <button type="button" onClick={() => onSeleccionarTraslado(t.traslado_id)} className="w-full text-left">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display text-sm font-semibold leading-tight">
                          {t.vehiculo_marca} {t.vehiculo_modelo}
                        </p>
                        <p className="font-mono-ruum text-xs text-ui-fg-muted">{t.origen_ciudad} → {t.destino_ciudad}</p>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        <span className={`rounded-full px-2 py-0.5 font-mono-ruum text-xs ${clasePrioridadMapa(prioridad)}`}>{ETIQUETA_PRIORIDAD_MAPA[prioridad]} · {calidad.tiempoTexto.replace("Actualizada hace ", "")}</span>
                        {t.tiene_incidencia_abierta && (
                          <span className="rounded-full bg-ui-danger-soft px-2 py-0.5 font-mono-ruum text-xs text-ui-danger">INC</span>
                        )}
                        <span className={`rounded-full px-2 py-0.5 font-mono-ruum text-xs ${claseCalidadUbicacion(calidad.estadoSenal)}`}>{calidad.estadoCorto}</span>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-1.5">
                      <p className="font-body text-xs text-ui-fg-muted">{ETIQUETA_ESTADO[t.estado] ?? t.estado}</p>
                      <p className="font-body text-xs text-ui-fg-muted">Conductor: {t.conductor_nombre ?? "Sin conductor"}</p>
                      <p className="font-mono-ruum text-xs text-ui-fg-muted">Última actualización: {calidad.tiempoTexto}</p>
                    </div>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-ui-line pt-3">
                    <Link href={`/viajes/${t.traslado_id}`} className="rounded-lg border border-ui-brand/30 px-3 py-1.5 font-body text-xs font-semibold text-ui-brand-soft-fg hover:bg-ui-brand-soft">
                      Ver traslado
                    </Link>
                    <button type="button" disabled className="rounded-lg border border-ui-line px-3 py-1.5 font-body text-xs font-semibold text-ui-fg-muted opacity-70">
                      Llamar conductor
                    </button>
                    <button type="button" onClick={() => onSeleccionarTraslado(t.traslado_id)} className="rounded-lg border border-ui-warning/35 px-3 py-1.5 font-body text-xs font-semibold text-ui-warning hover:bg-ui-warning-soft">
                      Escalar
                    </button>
                  </div>
                </div>
              );
            })}
            {trasladosVisibles.length === 0 && !cargando && (
              <p className="py-8 text-center font-body text-sm text-ui-fg-muted">Sin traslados activos</p>
            )}
          </div>
        </div>
      </div>

      <div className={`${vistaMovil === "alertas" ? "block" : "hidden"} min-w-0 overflow-y-auto p-4 lg:hidden`}>
        <div className="mb-3">
          <p className="font-mono-ruum text-xs uppercase tracking-widest text-ui-fg-muted">Alertas</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-ui-fg">Prioridad y confiabilidad GPS</h2>
        </div>
        <div className="grid gap-3">
          {alertasMapa.map((t) => {
            const calidad = calidadUbicacion(t, ahora);
            const alertaGps = trasladoSinCoordenadas(t) || calidad.estadoSenal === "sin_senal" || calidad.estadoSenal === "antigua";
            return (
              <button
                key={t.traslado_id}
                type="button"
                onClick={() => {
                  onSeleccionarTraslado(t.traslado_id);
                  onCambiarVistaMovil("lista");
                }}
                className={`rounded-lg border p-3 text-left ${t.tiene_incidencia_abierta ? "border-ui-danger/30 bg-ui-danger-soft" : "border-ui-warning/30 bg-ui-warning-soft"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-body text-sm font-semibold text-ui-fg">{t.vehiculo_marca} {t.vehiculo_modelo}</p>
                  <span className={`rounded-full px-2 py-0.5 font-mono-ruum text-xs ${t.tiene_incidencia_abierta ? "text-ui-danger" : "text-ui-warning"}`}>
                    {t.tiene_incidencia_abierta ? "INC" : "GPS"}
                  </span>
                </div>
                <p className="mt-1 font-body text-xs text-ui-fg-muted">{t.origen_ciudad} → {t.destino_ciudad}</p>
                <p className="mt-1 font-body text-xs text-ui-fg-muted">
                  {t.tiene_incidencia_abierta ? "Incidencia abierta" : alertaGps ? `${calidad.estadoTexto}. ${calidad.tiempoTexto}` : "Sin alerta GPS"}
                </p>
              </button>
            );
          })}
          {alertasMapa.length === 0 && (
            <div className="rounded-lg border border-ui-line bg-ui-muted p-6 text-center">
              <p className="font-body text-sm text-ui-fg-muted">Sin alertas activas del mapa.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
