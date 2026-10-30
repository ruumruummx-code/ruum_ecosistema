import {describe,it,expect} from "vitest";
import {estadoLiquidacion} from "../src/lib/estado-liquidacion";
describe("RR-REAL-008 transferencia y devengo",()=>{
  it("procesado no acredita transferencia",()=>expect(estadoLiquidacion({estado:"procesado"})).toBe("en_validacion"));
  it("sin fecha financiera no promete programación",()=>expect(estadoLiquidacion({estado:"pendiente"})).toBe("confirmado"));
  it("exige fecha y referencia externa para mostrar pagado",()=>{
    expect(estadoLiquidacion({estado:"procesado",pagado_en:"2026-10-30T12:00:00Z",referencia_externa_validada:"SPEI-validado"})).toBe("pagado");
    expect(estadoLiquidacion({estado:"procesado",pagado_en:"invalida",referencia_externa_validada:"SPEI"})).toBe("en_validacion");
    expect(estadoLiquidacion({estado:"fallido",pagado_en:"2026-10-30T12:00:00Z",referencia_externa_validada:"SPEI"})).toBe("rechazado");
  });
});
