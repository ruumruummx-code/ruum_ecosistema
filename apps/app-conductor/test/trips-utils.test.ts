import { describe, expect, it } from "vitest";
import {
  claveDia,
  crearCalendario,
  esTrasladoAceptado,
  listarViajesDeVista,
  diasSemanaActual,
  estaSemanaActual,
  formatearDistanciaAproximadaAlOrigen,
  type DetalleOperativo,
  type PasaporteRow
} from "../src/app/viajes/trips-utils";

function viaje(id: string, creadoEn: string): PasaporteRow {
  return {
    traslado_id: id,
    creado_en: creadoEn,
    estado: "pendiente_de_conductor",
    vehiculo_tipo: null,
    vehiculo_marca: null,
    vehiculo_modelo: null,
    vehiculo_anio: null,
    contacto_entrega_nombre: null,
    contacto_recepcion_nombre: null,
    distancia_km: null,
    tiempo_estimado_horas: null,
    origen_lat: null,
    origen_lng: null
  } as PasaporteRow;
}

function detalle(fechaHora: string): DetalleOperativo {
  return {
    origen: "Origen",
    destino: "Destino",
    fechaHora,
    tipoServicio: "Traslado estándar",
    requisitos: "Sin requisitos especiales.",
    distanciaKm: null,
    tiempoEstimadoHoras: null,
    gananciaConductorOficial: null,
    estadoEconomico: "sin_calcular"
  };
}

describe("calendario móvil de Traslados", () => {
  it("muestra ofertas de otras semanas al abrir sin filtro de fecha", () => {
    const ofertas = [viaje("anterior", "2026-10-18T12:00:00Z"), viaje("otra", "2026-10-27T12:00:00Z")];
    expect(listarViajesDeVista(ofertas, [], {}, "disponibles", null).map(({ viaje }) => viaje.traslado_id))
      .toEqual(["anterior", "otra"]);
    expect(listarViajesDeVista(ofertas, [], {}, "disponibles", "2026-11-01")).toEqual([]);
    expect(listarViajesDeVista(ofertas, [], {}, "disponibles", "2026-10-27")).toHaveLength(1);
  });

  it("filtra por fecha programada con la zona de México", () => {
    const oferta = viaje("programada", "2026-10-18T12:00:00Z");
    const detalles = { programada: detalle("2026-11-02T04:30:00Z") };
    expect(listarViajesDeVista([oferta], [], detalles, "disponibles", "2026-11-01")).toHaveLength(1);
    expect(listarViajesDeVista([oferta], [], detalles, "disponibles", "2026-11-02")).toHaveLength(0);
  });

  it.each(["disputa_abierta", "reclamo_abierto", "reclamo_resuelto", "disputa_resuelta", "servicio_cerrado", "servicio_cancelado", "traslado_fallido", "pendiente_de_conductor"] as const)("no cuenta %s como traslado aceptado", (estado) => {
    const expediente = { ...viaje("expediente", "2026-10-31T15:00:00Z"), estado };
    expect(esTrasladoAceptado(expediente)).toBe(false);
    expect(listarViajesDeVista([], [expediente], {}, "mis-Traslados", null)).toHaveLength(0);
  });

  it.each(["conductor_asignado", "traslado_en_curso", "entrega_confirmada", "pago_pendiente"] as const)("conserva %s entre los aceptados", (estado) => {
    const aceptado = { ...viaje("aceptado", "2026-10-31T15:00:00Z"), estado };
    expect(esTrasladoAceptado(aceptado)).toBe(true);
    expect(listarViajesDeVista([], [aceptado], {}, "mis-Traslados", null)).toHaveLength(1);
  });

  it("inicia la semana en domingo usando America/Mexico_City", () => {
    const dias = diasSemanaActual(new Date("2026-07-17T18:00:00.000Z")).map(claveDia);

    expect(dias).toEqual([
      "2026-07-12",
      "2026-07-13",
      "2026-07-14",
      "2026-07-15",
      "2026-07-16",
      "2026-07-17",
      "2026-07-18"
    ]);
  });

  it("clasifica fechas UTC cerca de medianoche según el día operativo de México", () => {
    expect(claveDia("2026-07-06T04:30:00.000Z")).toBe("2026-07-05");
    expect(claveDia("2026-07-06T06:30:00.000Z")).toBe("2026-07-06");
  });

  it("mantiene dentro de la semana un viaje UTC que aún cae en sábado en México", () => {
    const referencia = new Date("2026-07-17T18:00:00.000Z");

    expect(estaSemanaActual("2026-07-19T05:30:00.000Z", referencia)).toBe(true);
    expect(estaSemanaActual("2026-07-19T06:30:00.000Z", referencia)).toBe(false);
  });

  it("agrupa Traslados del servidor por fecha operativa de México, no por día UTC", () => {
    const traslado = viaje("viaje-utc", "2026-07-06T04:30:00.000Z");
    const calendario = crearCalendario([traslado], [], {
      "viaje-utc": detalle("2026-07-06T04:30:00.000Z")
    }, new Date("2026-07-05T18:00:00.000Z"));

    const domingo = calendario.find(({ dia }) => claveDia(dia) === "2026-07-05");
    const lunes = calendario.find(({ dia }) => claveDia(dia) === "2026-07-06");

    expect(domingo?.Traslados.map(({ viaje }) => viaje.traslado_id)).toEqual(["viaje-utc"]);
    expect(lunes?.Traslados).toHaveLength(0);
  });
});

describe("distancia a oportunidades", () => {
  it("etiqueta Haversine como distancia aproximada, no como ETA", () => {
    expect(formatearDistanciaAproximadaAlOrigen(8.2)).toBe("Aproximadamente a 8.2 km de ti");
    expect(formatearDistanciaAproximadaAlOrigen(18)).toBe("Aproximadamente a 18 km de ti");
    expect(formatearDistanciaAproximadaAlOrigen(null)).toBe("Activa ubicación");
  });
});
