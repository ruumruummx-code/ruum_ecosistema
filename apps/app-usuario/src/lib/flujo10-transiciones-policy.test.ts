import { describe, it, expect } from "vitest";
import {
  validarTransicionFlujo10,
  exigirTransicionFlujo10,
  validarVentana72Horas,
  calcularPenalizacionCancelacionF10,
  TransicionInvalidaFlujo10Error,
  HORAS_VENTANA_POST_CIERRE,
} from "./flujo10-transiciones-policy";

describe("flujo10-transiciones-policy", () => {
  describe("Máquina de transiciones y alineación con F8 (CB-2 / CA-4)", () => {
    it("permite acciones en estados válidos", () => {
      expect(validarTransicionFlujo10("aceptar_cotizacion", "cotizacion_generada").permitida).toBe(true);
      expect(validarTransicionFlujo10("pagar_traslado", "cotizacion_aceptada").permitida).toBe(true);
      expect(validarTransicionFlujo10("cancelar_traslado", "conductor_asignado").permitida).toBe(true);
      expect(validarTransicionFlujo10("reportar_incidencia", "traslado_en_curso").permitida).toBe(true);
    });

    it("permite idempotencia en aceptación de cotización", () => {
      expect(validarTransicionFlujo10("aceptar_cotizacion", "cotizacion_aceptada").permitida).toBe(true);
      expect(validarTransicionFlujo10("aceptar_cotizacion", "servicio_confirmado").permitida).toBe(true);
    });

    it("bloquea acciones en estados inválidos", () => {
      const res = validarTransicionFlujo10("cancelar_traslado", "vehiculo_recibido");
      expect(res.permitida).toBe(false);
      expect(res.motivoBloqueo).toContain("no está permitida");

      expect(() =>
        exigirTransicionFlujo10("aceptar_cotizacion", "servicio_cerrado")
      ).toThrow(TransicionInvalidaFlujo10Error);
    });

    it("bloquea categóricamente acciones si el estado es 'en_revision' o desconocido (F8 fail-closed)", () => {
      const res = validarTransicionFlujo10("cancelar_traslado", "estado_anomalo_inexistente");
      expect(res.permitida).toBe(false);
      expect(res.motivoBloqueo).toContain("verificación técnica");

      expect(() =>
        exigirTransicionFlujo10("pagar_traslado", "estado_inventado")
      ).toThrow(TransicionInvalidaFlujo10Error);
    });
  });

  describe("Ventana de 72 horas y margen de gracia técnico (CB-3 / T8 / CA-6)", () => {
    const ahoraMs = 1730764800000; // Fecha base fija

    it("permite calificación/disputa dentro de las 72 horas", () => {
      // 10 horas después del cierre
      const fechaCierre10h = new Date(ahoraMs - 10 * 60 * 60 * 1000).toISOString();
      const res = validarVentana72Horas(fechaCierre10h, ahoraMs);
      expect(res.permitido).toBe(true);
      expect(res.dentroDeGracia).toBe(false);
      expect(res.horasDesdeCierre).toBeCloseTo(10, 1);
    });

    it("permite calificación/disputa dentro del margen de gracia de 15 minutos (72h a 72h15m)", () => {
      // 72 horas y 10 minutos (72.16 h)
      const fechaCierreGracia = new Date(ahoraMs - (72 * 60 + 10) * 60 * 1000).toISOString();
      const res = validarVentana72Horas(fechaCierreGracia, ahoraMs);
      expect(res.permitido).toBe(true);
      expect(res.dentroDeGracia).toBe(true);
    });

    it("rechaza estrictamente una vez excedido el margen de gracia (> 72h15m)", () => {
      // 72 horas y 20 minutos (72.33 h)
      const fechaCierreExpirada = new Date(ahoraMs - (72 * 60 + 20) * 60 * 1000).toISOString();
      const res = validarVentana72Horas(fechaCierreExpirada, ahoraMs);
      expect(res.permitido).toBe(false);
      expect(res.dentroDeGracia).toBe(false);
      expect(res.motivoRechazo).toContain("ha expirado");
    });

    it("rechaza si la fecha de cierre es nula o inválida", () => {
      expect(validarVentana72Horas(null).permitido).toBe(false);
      expect(validarVentana72Horas("fecha-invalida").permitido).toBe(false);
    });
  });

  describe("Tramos de penalización de cancelación y excepciones (CB-3 / T6, T7 / CA-5)", () => {
    const precio = 1250.5;

    it("calcula 0% de cargo sin conductor asignado", () => {
      const res = calcularPenalizacionCancelacionF10(precio, 10, false, false);
      expect(res.porcentaje_cargo).toBe(0);
      expect(res.monto_cargo).toBe(0);
    });

    it("calcula tramos correspondientes con conductor asignado", () => {
      // >= 6h -> 20%
      expect(calcularPenalizacionCancelacionF10(precio, 6.5, true, false).porcentaje_cargo).toBe(20);
      // 4h a <6h -> 35%
      expect(calcularPenalizacionCancelacionF10(precio, 5.0, true, false).porcentaje_cargo).toBe(35);
      // 2h a <4h -> 50%
      expect(calcularPenalizacionCancelacionF10(precio, 3.0, true, false).porcentaje_cargo).toBe(50);
      // < 2h -> 75%
      expect(calcularPenalizacionCancelacionF10(precio, 1.5, true, false).porcentaje_cargo).toBe(75);
      // Conductor ya llegó -> 100%
      expect(calcularPenalizacionCancelacionF10(precio, 0.5, true, true).porcentaje_cargo).toBe(100);
    });

    it("aplica redondeo aritmético a 2 decimales en el importe", () => {
      const res = calcularPenalizacionCancelacionF10(1234.56, 5.0, true, false); // 35% de 1234.56 = 432.096 -> 432.1
      expect(res.monto_cargo).toBe(432.1);
    });

    it("exonera cargo al 0% ante excepción formal acreditada", () => {
      const res = calcularPenalizacionCancelacionF10(precio, 1.0, true, false, {
        tipo: "retraso_conductor",
        justificacion: "El conductor superó 45 minutos de demora en ventana de recolección",
      });
      expect(res.porcentaje_cargo).toBe(0);
      expect(res.monto_cargo).toBe(0);
      expect(res.esExcepcion).toBe(true);
      expect(res.mensaje).toContain("exonerada");
    });

    it("valida acreditación suficiente de falla mecánica para exonerar", () => {
      // Sin fotos ni descripción suficiente -> no se exonera automáticamente
      const rechazada = calcularPenalizacionCancelacionF10(precio, 1.0, true, false, {
        tipo: "incidencia_mecanica",
        justificacion: "Auto descompuesto",
        evidenciaMecanica: {
          descripcion: "se rompio",
          fotosUrls: [],
        },
      });
      expect(rechazada.esExcepcion).toBe(false);
      expect(rechazada.porcentaje_cargo).toBe(75);
      expect(rechazada.motivoRechazoExcepcion).toContain("al menos 20 caracteres");

      // Con descripción detallada y fotografía -> exoneración exitosa al 0%
      const aprobada = calcularPenalizacionCancelacionF10(precio, 1.0, true, false, {
        tipo: "incidencia_mecanica",
        justificacion: "Falla severa de frenos constatada",
        evidenciaMecanica: {
          descripcion: "Fuga evidente de líquido de frenos con pedal hasta el fondo en punto de inicio.",
          fotosUrls: ["https://storage.ruum.mx/evidencias/fuga_frenos.jpg"],
        },
      });
      expect(aprobada.esExcepcion).toBe(true);
      expect(aprobada.porcentaje_cargo).toBe(0);
      expect(aprobada.monto_cargo).toBe(0);

      // Con incidencia previa registrada en torre de control -> exoneración inmediata
      const previa = calcularPenalizacionCancelacionF10(precio, 1.0, true, false, {
        tipo: "incidencia_mecanica",
        justificacion: "Reportada por operador",
        evidenciaMecanica: {
          descripcion: "",
          fotosUrls: [],
          incidenciaPreviaId: "inc-torre-9981",
        },
      });
      expect(previa.esExcepcion).toBe(true);
      expect(previa.porcentaje_cargo).toBe(0);
    });

    it("cubre matriz completa: rechaza acciones inválidas originadas en estados válidos del ciclo", () => {
      // Intentar calificar conductor cuando el traslado aún está en curso
      expect(validarTransicionFlujo10("calificar_conductor", "traslado_en_curso").permitida).toBe(false);

      // Intentar pagar traslado desde estado borrador / solicitud_creada
      expect(validarTransicionFlujo10("pagar_traslado", "solicitud_creada").permitida).toBe(false);

      // Intentar abrir disputa en fase previa de cotización
      expect(validarTransicionFlujo10("abrir_disputa", "cotizacion_generada").permitida).toBe(false);

      // Intentar cancelar unilateralmente en pleno traslado en curso
      expect(validarTransicionFlujo10("cancelar_traslado", "traslado_en_curso").permitida).toBe(false);

      // Intentar reportar incidencia en servicio ya cerrado
      expect(validarTransicionFlujo10("reportar_incidencia", "servicio_cerrado").permitida).toBe(false);
    });
  });
});
