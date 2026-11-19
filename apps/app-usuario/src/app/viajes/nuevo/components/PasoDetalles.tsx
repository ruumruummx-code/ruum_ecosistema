"use client";
import { useFormatoDistancia } from "@/lib/use-formato-distancia";
import React, { memo, useId, useState } from "react";
import { Badge, Button, Card, Input, Label } from "@ruum/ui/base";
import { CalendarDays, CarFront, ChevronDown, Clock, House, MapPin, ReceiptText, Route } from "lucide-react";
import { MobileBottomSheet as BottomSheet } from "@/components/MobileBottomSheet";
import styles from "./cotizador.module.css";
import type { PrevisualizacionTarifa } from "@ruum/api/services";
import {
  CONDICIONES_VEHICULO,
  VENTANAS_PREDEFINIDAS,
  formatearTiempo,
} from "../constants";
import type { DatosFormulario } from "../types";

export interface AccionesPasoDetalles {
  actualizar: <K extends keyof DatosFormulario>(
    campo: K,
    valor: DatosFormulario[K],
  ) => void;
  onEditarAgenda: () => void;
  setAceptaPoliticasPagoCancelacion: (valor: boolean) => void;
  enviarSolicitud: () => Promise<void>;
  onRevisarTarifa: () => void;
}

export interface PasoDetallesProps {
  datos: DatosFormulario;
  acciones: AccionesPasoDetalles;
  previsualizacion: PrevisualizacionTarifa | null;
  previsualizando: boolean;
  momentoPago: { momento: "anticipado" | "al_cierre"; razon: string };
  categoriaCatalogo: string;
  gamaCatalogo: string;
  rutaEstimacion: {
    distanciaKm?: number;
    tiempoEstimadoHoras?: number;
  } | null;
  politicaCancelacion: { mensaje: string };
  aceptaPoliticasPagoCancelacion: boolean;
  enviando: boolean;
  cargandoSesion: boolean;
  tarifaPreviaAceptada: boolean;
  soloLectura?: boolean;
}

const tiposTraslado = [
  { valor: "local", etiqueta: "Local", icono: House },
  { valor: "foraneo", etiqueta: "Foráneo", icono: Route },
] as const;

function PasoDetallesComponent({
  datos,
  acciones,
  previsualizacion,
  previsualizando,
  categoriaCatalogo,
  gamaCatalogo,
  rutaEstimacion,
  politicaCancelacion,
  tarifaPreviaAceptada,
  soloLectura,
}: PasoDetallesProps) {
  const formatearDistancia = useFormatoDistancia();
  const [desglose, setDesglose] = useState(false);
  const desgloseId = useId();
  const desgloseBotonId = desgloseId + "-boton";
  const [ventana, setVentana] = useState<
    "ventanaRecoleccion" | "ventanaEntrega" | null
  >(null);
  const [personalizada, setPersonalizada] = useState("");
  const { actualizar, onRevisarTarifa } = acciones;
  const abrirVentana = (campo: "ventanaRecoleccion" | "ventanaEntrega") => {
    setPersonalizada(datos[campo].replace(/^Otra:\s*/, ""));
    setVentana(campo);
  };
  const nombreVehiculo = [datos.marca, datos.modelo, datos.anio].filter(Boolean).join(" ") || "Vehículo";
  const rutaTexto = `${datos.origenCiudad || "Origen"} → ${datos.destinoCiudad || "Destino"}`;
  const distanciaTexto = rutaEstimacion?.distanciaKm !== undefined && rutaEstimacion?.tiempoEstimadoHoras !== undefined
    ? `${formatearDistancia(rutaEstimacion.distanciaKm)} · ${formatearTiempo(rutaEstimacion.tiempoEstimadoHoras)}`
    : null;

  return (
    <div className="grid gap-4">
      <Card className={styles.fichaServicio}>
        <span className={styles.iconoUnidad}><CarFront strokeWidth={1.5} aria-hidden="true" /></span>
        <div className="min-w-0">
          <h2 className="break-words text-base font-bold text-ui-fg">{nombreVehiculo}</h2>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-ui-fg-muted">
            <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>{rutaTexto}</span>
          </p>
        </div>
        {distanciaTexto && (
          <Badge tone="info" className={styles.distanciaServicio}>
            <Clock className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            {distanciaTexto}
          </Badge>
        )}
      </Card>

      <fieldset className="grid min-w-0 gap-2" disabled={soloLectura}>
        <legend className="mb-2 text-sm font-semibold text-ui-fg">Tipo de traslado</legend>
        <div className="grid grid-cols-2 gap-3">
          {tiposTraslado.map(({ valor, etiqueta, icono: Icono }) => (
            <Label key={valor} className={styles.tipoTraslado}>
              <Input
                className="sr-only"
                type="radio"
                name="tipoRuta"
                value={valor}
                checked={datos.tipoRuta === valor}
                onChange={() => actualizar("tipoRuta", valor)}
              />
              <Icono className="size-5" strokeWidth={1.5} aria-hidden="true" />
              {etiqueta}
            </Label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        {(["ventanaRecoleccion", "ventanaEntrega"] as const).map((campo) => {
          const etiqueta = campo === "ventanaRecoleccion" ? "Recolección" : "Entrega";
          const valor = datos[campo] || "Flexible";
          const valorVisible = valor === "Flexible (sin preferencia)" ? "Flexible" : valor;
          return (
            <Button
              key={campo}
              type="button"
              variant="outline"
              disabled={soloLectura}
              className={styles.selectorVentana}
              aria-haspopup="dialog"
              aria-label={`${etiqueta} ${valor}`}
              onClick={() => abrirVentana(campo)}
            >
              <CalendarDays strokeWidth={1.5} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-ui-fg-muted">
                  {etiqueta}
                </span>
                <span className="block truncate text-sm font-semibold">{valorVisible}</span>
              </span>
              <ChevronDown strokeWidth={1.5} aria-hidden="true" />
            </Button>
          );
        })}
      </div>

      <Card className={styles.avisoAsignacion}>
        <Clock className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <div className="text-sm leading-relaxed">
          <strong className="block font-semibold text-ui-fg">
            {datos.modalidadProgramacion === "lo_antes_posible"
              ? "Lo antes posible"
              : `Programado para ${datos.fechaHoraProgramada.replace("T", " ")}`}
          </strong>
          <span className="text-ui-fg-muted">Te asignaremos un conductor cercano en cuanto confirmes tu traslado.</span>
        </div>
      </Card>

      <div>
        <Button
          type="button"
          variant="outline"
          className={styles.abrirDesglose}
          id={desgloseBotonId}
          aria-expanded={desglose}
          aria-controls={desgloseId}
          onClick={() => setDesglose((abierto) => !abierto)}
        >
          <ReceiptText strokeWidth={1.5} aria-hidden="true" />
          <span className="flex-1">Ver desglose completo de la tarifa</span>
          <ChevronDown className={desglose ? "rotate-180" : undefined} strokeWidth={1.5} aria-hidden="true" />
        </Button>
        <div id={desgloseId} aria-labelledby={desgloseBotonId} role="region" hidden={!desglose} className={styles.desgloseServicio}>
          {desglose && (
            <>
              <p className="text-xl font-bold">
                {previsualizando
                  ? "Calculando tarifa…"
                  : previsualizacion?.disponible
                    ? `$${Number(previsualizacion.tarifa).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
                    : "Tarifa pendiente"}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <dt>Clasificación</dt>
                <dd>
                  {categoriaCatalogo} · {gamaCatalogo}
                </dd>
                <dt>Condición</dt>
                <dd>
                  {CONDICIONES_VEHICULO.find((c) => c.valor === datos.condicion)
                    ?.etiqueta || "Pendiente"}
                </dd>
                <dt>Distancia</dt>
                <dd>
                  {rutaEstimacion?.distanciaKm !== undefined
                    ? formatearDistancia(rutaEstimacion.distanciaKm)
                    : "Pendiente"}
                </dd>
                <dt>Tiempo estimado</dt>
                <dd>
                  {rutaEstimacion?.tiempoEstimadoHoras !== undefined
                    ? formatearTiempo(rutaEstimacion.tiempoEstimadoHoras)
                    : "Pendiente"}
                </dd>
                <dt>Horario tarifario</dt>
                <dd>
                  {previsualizacion?.horario?.replaceAll("_", " ") || "Estándar"}
                </dd>
                <dt>Día tarifario</dt>
                <dd>{previsualizacion?.dia?.replaceAll("_", " ") || "Estándar"}</dd>
              </dl>
              <p className="mt-4 text-sm">Pago electrónico anticipado obligatorio.</p>
              <p className="mt-2 text-sm">{politicaCancelacion.mensaje}</p>
            </>
          )}
        </div>
      </div>

      {!tarifaPreviaAceptada && (
        <Button type="button" variant="secondary" className="justify-start bg-ui-warning-soft text-ui-warning" onClick={onRevisarTarifa}>
          Revisar nueva tarifa
        </Button>
      )}
      <BottomSheet
        open={Boolean(ventana)}
        onClose={() => setVentana(null)}
        title={
          ventana === "ventanaEntrega"
            ? "Ventana de entrega"
            : "Ventana de recolección"
        }
      >
        <div className="grid gap-2">
          {VENTANAS_PREDEFINIDAS.filter((v) => v !== "Otra (especificar)").map(
            (v) => (
              <Button
                type="button"
                key={v}
                variant="outline"
                className="justify-start"
                onClick={() => {
                  if (ventana) actualizar(ventana, v);
                  setVentana(null);
                }}
              >
                {v}
              </Button>
            ),
          )}
        </div>
        <Label
          className="mt-4 block text-xs font-semibold"
          htmlFor={ventana ? `${ventana}Custom` : "ventanaCustom"}
        >
          Especifica ventana de{" "}
          {ventana === "ventanaEntrega" ? "entrega" : "recolección"}
        </Label>
        <Input
          id={ventana ? `${ventana}Custom` : "ventanaCustom"}
          className={styles.controlCotizacion + " mt-2"}
          value={personalizada}
          maxLength={200}
          onChange={(e) => setPersonalizada(e.target.value)}
          placeholder="Ej. 09:00 a 12:00"
        />
        <Button
          type="button"
          disabled={!personalizada.trim()}
          size="lg"
          className="mt-3 w-full"
          onClick={() => {
            if (ventana) actualizar(ventana, `Otra: ${personalizada.trim()}`);
            setVentana(null);
          }}
        >
          Guardar ventana
        </Button>
      </BottomSheet>
    </div>
  );
}

function areEqualPasoDetalles(
  prev: PasoDetallesProps,
  next: PasoDetallesProps,
) {
  // Sin `prev.datos === next.datos` (cortaba todo cambio; resto muerto). El
  // resumen renderiza agenda, vehículo y ruta: se comparan esos campos.
  return (
    prev.datos.modalidadProgramacion === next.datos.modalidadProgramacion &&
    prev.datos.fechaHoraProgramada === next.datos.fechaHoraProgramada &&
    prev.datos.marca === next.datos.marca &&
    prev.datos.modelo === next.datos.modelo &&
    prev.datos.anio === next.datos.anio &&
    prev.datos.condicion === next.datos.condicion &&
    prev.datos.origenCiudad === next.datos.origenCiudad &&
    prev.datos.destinoCiudad === next.datos.destinoCiudad &&
    prev.acciones === next.acciones &&
    prev.datos.tipoRuta === next.datos.tipoRuta &&
    prev.datos.ventanaRecoleccion === next.datos.ventanaRecoleccion &&
    prev.datos.ventanaEntrega === next.datos.ventanaEntrega &&
    prev.previsualizacion === next.previsualizacion &&
    prev.previsualizando === next.previsualizando &&
    prev.momentoPago === next.momentoPago &&
    prev.categoriaCatalogo === next.categoriaCatalogo &&
    prev.gamaCatalogo === next.gamaCatalogo &&
    prev.rutaEstimacion === next.rutaEstimacion &&
    prev.politicaCancelacion === next.politicaCancelacion &&
    prev.aceptaPoliticasPagoCancelacion ===
      next.aceptaPoliticasPagoCancelacion &&
    prev.enviando === next.enviando &&
    prev.cargandoSesion === next.cargandoSesion &&
    prev.soloLectura === next.soloLectura &&
    prev.tarifaPreviaAceptada === next.tarifaPreviaAceptada
  );
}
export const PasoDetalles = memo(PasoDetallesComponent, areEqualPasoDetalles);
