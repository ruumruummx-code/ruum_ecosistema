// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { leerBorradorRegistroLocal, guardarBorradorRegistroLocal } from "../src/lib/borrador-registro";
import { combinarExpedienteConRemoto } from "../src/app/registro/registration-validation";

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

test("recupera el borrador vigente y descarta el vencido", () => {
  vi.useFakeTimers();
  const borrador = {
    paso: 2, nombre: "Prueba", apellidos: "", telefono: "", email: "",
    codigoPostal: "", estado: "", ciudad: "", colonia: "", tipoLicencia: "", vigenciaLicencia: ""
  };
  guardarBorradorRegistroLocal(borrador);
  expect(leerBorradorRegistroLocal()).toMatchObject(borrador);

  vi.setSystemTime(Date.now() + 24 * 60 * 60 * 1000);
  expect(leerBorradorRegistroLocal()).toBeNull();
  expect(localStorage.length).toBe(0);
});

test("la fusión conserva cambios locales y recupera campos vacíos y datos remotos", () => {
  const expediente = {
    datosPersonales: { nombre: "Nuevo", telefono: "" },
    domicilio: { ciudad: "" },
    licencia: { vigente: false },
    contactoEmergencia: null
  };
  expect(combinarExpedienteConRemoto(expediente, null)).toBe(expediente);
  expect(combinarExpedienteConRemoto(expediente, {
    datos_personales: { nombre: "Anterior", telefono: "5550000000" },
    domicilio: { ciudad: "México" },
    licencia: { vigente: true },
    contacto_emergencia: { nombre: "Contacto" }
  })).toEqual({
    datosPersonales: { nombre: "Nuevo", telefono: "5550000000" },
    domicilio: { ciudad: "México" },
    licencia: { vigente: true },
    contactoEmergencia: { nombre: "Contacto" }
  });
});
