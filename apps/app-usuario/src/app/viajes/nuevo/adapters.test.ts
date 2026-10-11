import { describe, expect, it } from "vitest";
import { construirPayloadCreacion } from "./adapters";
import type { DatosFormulario } from "./types";

describe("construirPayloadCreacion", () => {
  it("ya no manda presupuesto_usuario (RT-13: la tarifa la calcula el sistema) y deja coordenadas desconocidas en null", () => {
    const datos = { tipo: "sedan", transmision: "automatica", anio: "2022", entregaNombre: "Ana", entregaApellido: "L", entregaTelefono: "5512345678", recepcionNombre: "Luis", recepcionApellido: "P", recepcionTelefono: "5587654321", origenCalle: "A", origenNumero: "1", origenColonia: "Centro", origenCodigoPostal: "06000", origenEstado: "CDMX", origenCiudad: "CDMX", origenReferencias: "", destinoCalle: "B", destinoNumero: "2", destinoColonia: "Centro", destinoCodigoPostal: "06100", destinoEstado: "CDMX", destinoCiudad: "CDMX", destinoReferencias: "", modalidadProgramacion: "lo_antes_posible", fechaHoraProgramada: "", instruccionesEspeciales: "", tipoRuta: "local", ventanaRecoleccion: "", ventanaEntrega: "" } as DatosFormulario;
    const { traslado } = construirPayloadCreacion(datos, "vehiculo-id", { distanciaKm: 18.42, tiempoEstimadoHoras: 0.73 });
    expect("presupuesto_usuario" in traslado).toBe(false);
    /* tipo_servicio y motivo_servicio salieron del wizard: el payload ya no
       los manda y la RPC guarda NULL en columnas nilables. */
    expect("tipo_servicio" in traslado).toBe(false);
    expect("motivo_servicio" in traslado).toBe(false);
    expect("tipo_ruta" in traslado).toBe(true);
    expect(traslado.origen_lat).toBeNull();
    expect(traslado.distancia_km).toBe(18.42);
    expect(traslado.tiempo_estimado_horas).toBe(0.73);
    expect("precio_cotizado" in traslado).toBe(false);
  });
});
