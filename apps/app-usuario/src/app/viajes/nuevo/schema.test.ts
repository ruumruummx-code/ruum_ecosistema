import { describe, expect, it } from "vitest";
import { esquemaSolicitudTraslado } from "./schema";

const valido = {
  vehiculoSeleccionadoId: "", vehiculosUsuarioIds: [], marca: "Nissan", modelo: "Versa", color: "gris", placas: "ABC123", vin: "VIN123", anio: "2022", transmision: "automatica", condicion: "seminueva",
  estadoGeneral: "Buen estado, desgaste normal", tieneTarjeta: true, tieneVerificacion: true, tienePlacas: true, puedeCircular: true,
  origenCodigoPostal: "03100", origenEstado: "CDMX", origenCiudad: "CDMX", origenColonia: "Del Valle", origenCalle: "A", origenNumero: "1",
  destinoCodigoPostal: "06600", destinoEstado: "CDMX", destinoCiudad: "CDMX", destinoColonia: "Juárez", destinoCalle: "B", destinoNumero: "2",
  entregaNombre: "Ana", entregaApellido: "López", entregaTelefono: "5512345678", recepcionNombre: "Luis", recepcionApellido: "Pérez", recepcionTelefono: "5587654321",
  modalidadProgramacion: "lo_antes_posible", fechaHoraProgramada: "", zonaHoraria: "America/Mexico_City", tipoRuta: "local", aceptaPoliticas: true
};

describe("esquemaSolicitudTraslado", () => {
  it("acepta una solicitud completa", () => expect(esquemaSolicitudTraslado.safeParse(valido).success).toBe(true));
  /* tipoServicio y motivoServicio quedaron deprecados: el wizard ya no los
     envía, pero bundles nativos antiguos sí. El esquema los acepta opcionales
     en vez de borrarlos. */
  it("acepta la solicitud sin los campos deprecados tipoServicio/motivoServicio", () =>
    expect(esquemaSolicitudTraslado.safeParse(valido).success).toBe(true));
  it("sigue aceptando los campos deprecados si un cliente antiguo los manda", () =>
    expect(
      esquemaSolicitudTraslado.safeParse({
        ...valido,
        tipoServicio: "personal",
        motivoServicio: "entrega_cliente",
      }).success,
    ).toBe(true));
  it("rechaza origen y destino iguales", () => expect(esquemaSolicitudTraslado.safeParse({ ...valido, destinoCodigoPostal: "03100", destinoColonia: "Del Valle", destinoCalle: "A", destinoNumero: "1" }).success).toBe(false));
  it("rechaza vehículos no conducibles", () => expect(esquemaSolicitudTraslado.safeParse({ ...valido, puedeCircular: false }).success).toBe(false));
  it("permite rescate_mecanico sin circular rodando (R10)", () => expect(esquemaSolicitudTraslado.safeParse({ ...valido, condicion: "rescate_mecanico", puedeCircular: false }).success).toBe(true));
  it("rechaza rescate_mecanico si falta documentación aun sin rodar", () => expect(esquemaSolicitudTraslado.safeParse({ ...valido, condicion: "rescate_mecanico", puedeCircular: false, tieneTarjeta: false } as unknown as typeof valido).success).toBe(false));
  it("exige dos horas de anticipación", () => expect(esquemaSolicitudTraslado.safeParse({ ...valido, modalidadProgramacion: "programado", fechaHoraProgramada: new Date(Date.now() + 3600000).toISOString() }).success).toBe(false));
});
