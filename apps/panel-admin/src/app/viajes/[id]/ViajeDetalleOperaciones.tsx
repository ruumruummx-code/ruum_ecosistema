"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, PassportCard } from "@ruum/ui";
import { ETIQUETA_NIVEL_CONCER } from "@ruum/shared/constants";
import { ETIQUETA_ESTADO_TRASLADO, TRANSICIONES } from "@ruum/shared/states";
import type { Database } from "@ruum/shared/types";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type ConductorRow = Database["public"]["Tables"]["conductores"]["Row"];
type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];
type CausaFallido = Database["public"]["Enums"]["causa_fallido"];

const CAUSAS_FALLIDO: { valor: CausaFallido; etiqueta: string }[] = [
  { valor: "imputable_cliente", etiqueta: "Imputable al cliente" },
  { valor: "operativo", etiqueta: "Operativo" },
  { valor: "fuerza_mayor", etiqueta: "Fuerza mayor" },
  { valor: "documentacion", etiqueta: "Documentación" },
  { valor: "vehiculo_no_circulable", etiqueta: "Vehículo no circulable" }
];

interface ViajeDetalleOperacionesProps {
  pasaporte: PasaporteRow;
  conductores: ConductorRow[];
  procesando: "conductor" | "estado" | "precio" | "nota" | "fallido" | "sugerencia" | null;
  precioFinalInput: string;
  onAsignarConductor: (conductorId: string) => Promise<void>;
  onCambiarEstatus: (nuevoEstado: EstadoTraslado) => Promise<void>;
  onGuardarClasificacion: (
    categoria: Database["public"]["Enums"]["categoria_tarifa_vehiculo"],
    gama: Database["public"]["Enums"]["gama_vehiculo"],
    condicion: Database["public"]["Enums"]["condicion_vehiculo"]
  ) => Promise<void>;
  onCalcularTarifa: () => Promise<number | null>;
  onAplicarTarifa: () => Promise<void>;
  onMarcarFallido: (causa: CausaFallido) => Promise<void>;
}

export function ViajeDetalleOperaciones({
  pasaporte,
  conductores,
  procesando,
  precioFinalInput,
  onAsignarConductor,
  onCambiarEstatus,
  onGuardarClasificacion,
  onCalcularTarifa,
  onAplicarTarifa,
  onMarcarFallido
}: ViajeDetalleOperacionesProps) {
  const [conductorSeleccionado, setConductorSeleccionado] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoTraslado | "">("");
  const [causaFallido, setCausaFallido] = useState<CausaFallido>("operativo");
  const [categoriaTarifaInput, setCategoriaTarifaInput] = useState<Database["public"]["Enums"]["categoria_tarifa_vehiculo"] | "">("");
  const [gamaInput, setGamaInput] = useState<Database["public"]["Enums"]["gama_vehiculo"] | "">("");
  const [condicionInput, setCondicionInput] = useState<Database["public"]["Enums"]["condicion_vehiculo"] | "">("");

  const siguientesEstados = (pasaporte.estado && TRANSICIONES[pasaporte.estado]
    ? TRANSICIONES[pasaporte.estado]
    : []
  ).filter((est: EstadoTraslado) => est !== "disputa_resuelta");

  return (
    <>
      {/* Acciones administrativas */}
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PassportCard>
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Asignar / cambiar conductor</p>
          <div className="mt-3 flex gap-2">
            <select
              value={conductorSeleccionado}
              onChange={(e) => setConductorSeleccionado(e.target.value)}
              className="flex-1 rounded-lg border border-ui-field bg-ui-card px-3 py-2 font-body text-sm"
            >
              <option value="">Selecciona un conductor</option>
              {conductores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} · {c.nivel_operativo_vigente ? ETIQUETA_NIVEL_CONCER[c.nivel_operativo_vigente] : "Nivel pendiente"}
                </option>
              ))}
            </select>
            <Button
              onClick={() => onAsignarConductor(conductorSeleccionado)}
              disabled={!conductorSeleccionado || procesando === "conductor"}
            >
              {procesando === "conductor" ? "…" : "Asignar"}
            </Button>
          </div>
        </PassportCard>

        <PassportCard>
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Cambiar estatus</p>
          {pasaporte.estado === "disputa_abierta" && (
            <p className="mt-2 text-sm">
              Para registrar una resolución, abre <Link href="/disputas" className="underline">Disputas</Link>. El resumen se actualizará al resolver todos los casos pendientes.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <select
              value={estadoSeleccionado}
              onChange={(e) => setEstadoSeleccionado(e.target.value as EstadoTraslado)}
              className="flex-1 rounded-lg border border-ui-field bg-ui-card px-3 py-2 font-body text-sm"
              disabled={siguientesEstados.length === 0}
            >
              <option value="">
                {siguientesEstados.length === 0 ? "Sin transiciones disponibles" : "Selecciona el nuevo estatus"}
              </option>
              {siguientesEstados.map((e: EstadoTraslado) => (
                <option key={e} value={e}>
                  {ETIQUETA_ESTADO_TRASLADO[e]}
                </option>
              ))}
            </select>
            <Button
              onClick={() => {
                if (estadoSeleccionado) {
                  void onCambiarEstatus(estadoSeleccionado).then(() => setEstadoSeleccionado(""));
                }
              }}
              disabled={!estadoSeleccionado || procesando === "estado"}
            >
              {procesando === "estado" ? "…" : "Cambiar"}
            </Button>
          </div>
        </PassportCard>
      </div>

      {/* Clasificación del vehículo para tarifa (RT-12) */}
      <div className="mt-6">
        <PassportCard>
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Clasificación de tarifa del vehículo</p>
          <p className="mt-1 font-body text-xs text-ui-fg-muted">
            Actual: {pasaporte.vehiculo_categoria_tarifa ?? "sin asignar"} · {pasaporte.vehiculo_gama ?? "sin asignar"} ·{" "}
            {pasaporte.vehiculo_condicion ?? "sin asignar"}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <select
              value={categoriaTarifaInput}
              onChange={(e) => setCategoriaTarifaInput(e.target.value as typeof categoriaTarifaInput)}
              className="min-h-12 rounded-md border border-ui-field bg-ui-card px-3 font-body text-sm text-ui-fg"
            >
              <option value="">Categoría…</option>
              <option value="ligero_a">Ligero A</option>
              <option value="ligero_b">Ligero B</option>
              <option value="mediano">Mediano</option>
              <option value="camion">Camión</option>
            </select>
            <select
              value={gamaInput}
              onChange={(e) => setGamaInput(e.target.value as typeof gamaInput)}
              className="min-h-12 rounded-md border border-ui-field bg-ui-card px-3 font-body text-sm text-ui-fg"
            >
              <option value="">Gama…</option>
              <option value="entrada">Entrada</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="premium">Premium</option>
            </select>
            <select
              value={condicionInput}
              onChange={(e) => setCondicionInput(e.target.value as typeof condicionInput)}
              className="min-h-12 rounded-md border border-ui-field bg-ui-card px-3 font-body text-sm text-ui-fg"
            >
              <option value="">Condición…</option>
              <option value="nueva">Nueva</option>
              <option value="seminueva">Seminueva</option>
              <option value="rescate_mecanico">Rescate mecánico</option>
            </select>
            <Button
              variant="quiet"
              onClick={() => {
                if (categoriaTarifaInput && gamaInput && condicionInput) {
                  void onGuardarClasificacion(categoriaTarifaInput, gamaInput, condicionInput);
                }
              }}
              disabled={procesando === "sugerencia" || !categoriaTarifaInput || !gamaInput || !condicionInput}
            >
              Guardar clasificación
            </Button>
          </div>
        </PassportCard>
      </div>

      {/* Aplicación de política tarifaria autorizada */}
      <div className="mt-6">
        <PassportCard>
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Tarifa normativa</p>
          <p className="mt-1 font-body text-xs text-ui-fg-muted">
            El precio sale de la política vigente en Tarifas. Operación no captura montos libres; sólo aplica el cálculo autorizado y auditable.
          </p>
          <div className="mt-3">
            <Button variant="quiet" onClick={() => void onCalcularTarifa()} disabled={procesando === "sugerencia"}>
              {procesando === "sugerencia" ? "Calculando tarifa…" : "Calcular tarifa normativa"}
            </Button>
            {pasaporte.distancia_km != null && pasaporte.tiempo_estimado_horas != null && (
              <span className="ml-3 font-body text-xs text-ui-fg-muted">
                Última ruta calculada: {pasaporte.distancia_km} km, {pasaporte.tiempo_estimado_horas} h
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-ui-line bg-ui-brand/[0.03] px-4 py-3">
            <div>
              <p className="font-body text-xs text-ui-fg-muted">Tarifa calculada</p>
              <p className="font-mono-ruum text-lg font-semibold text-ui-fg">
                {precioFinalInput ? `$${Number(precioFinalInput).toLocaleString("es-MX")}` : "Pendiente"}
              </p>
            </div>
            <Button onClick={() => void onAplicarTarifa()} disabled={procesando === "precio"}>
              {procesando === "precio" ? "…" : "Aplicar tarifa normativa"}
            </Button>
          </div>
        </PassportCard>
      </div>

      {/* Traslado fallido */}
      <div className="mt-6">
        <PassportCard>
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Traslado fallido</p>
          <p className="mt-1 font-body text-xs text-ui-fg-muted">
            Usa esta acción cuando el traslado no puede continuar. Se calcula cargo, reagendamiento y descuento con la regla PRD §4.11.
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <select
              value={causaFallido}
              onChange={(e) => setCausaFallido(e.target.value as CausaFallido)}
              className="rounded-lg border border-ui-field bg-ui-card px-3 py-2 font-body text-sm"
            >
              {CAUSAS_FALLIDO.map((causa) => (
                <option key={causa.valor} value={causa.valor}>
                  {causa.etiqueta}
                </option>
              ))}
            </select>
            <Button
              onClick={() => void onMarcarFallido(causaFallido)}
              disabled={procesando === "fallido" || pasaporte.estado === "traslado_fallido"}
            >
              {procesando === "fallido" ? "…" : "Marcar fallido"}
            </Button>
          </div>
        </PassportCard>
      </div>
    </>
  );
}
