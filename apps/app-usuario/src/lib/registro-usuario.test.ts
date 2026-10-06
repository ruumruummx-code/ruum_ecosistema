import { describe, expect, it } from "vitest";
import {
  crearRedirectConfirmacion,
  normalizarCorreoRegistro,
  telefonoLocalMx,
  telefonoMx
} from "./registro-usuario";

describe("helpers de registro de usuario", () => {
  it("normaliza correo para auth, confirmacion y reenvio", () => {
    expect(normalizarCorreoRegistro("  USUARIO@Ejemplo.COM ")).toBe("usuario@ejemplo.com");
  });

  it("convierte telefonos mexicanos a captura nacional de 10 digitos", () => {
    expect(telefonoLocalMx("+52 55 1234 5678")).toBe("5512345678");
    expect(telefonoLocalMx("+52 1 55 1234 5678")).toBe("5512345678");
    expect(telefonoMx("55 1234 5678")).toBe("+525512345678");
  });

  /* Regresión A-5: las copias locales de constants.ts y PerfilCuentaForm.tsx solo
     quitaban "52" y conservaban el "1" móvil, produciendo "1551234567" (que pasaba
     la validación de longitud y se guardaba como +521551234567). Estos casos
     fijan los tres formatos para que ninguna copia vuelva a divergir. */
  it("normaliza los tres formatos de prefijo sin dejar el 1 movil", () => {
    expect(telefonoLocalMx("5512345678")).toBe("5512345678");
    expect(telefonoLocalMx("525512345678")).toBe("5512345678");
    expect(telefonoLocalMx("5215512345678")).toBe("5512345678");
    // El caso que fallaba: NO debe conservar el 1 móvil
    expect(telefonoLocalMx("+52 1 55 1234 5678")).not.toBe("1551234567");
  });

  it("el ciclo completo local -> internacional no desplaza digitos", () => {
    expect(telefonoMx(telefonoLocalMx("+52 1 55 1234 5678"))).toBe("+525512345678");
    expect(telefonoMx(telefonoLocalMx("5215512345678"))).toBe("+525512345678");
  });

  it("codifica correctamente el next en el callback de confirmacion", () => {
    const redirect = crearRedirectConfirmacion("https://usuario.ruum.test");
    expect(redirect).toBe("https://usuario.ruum.test/auth/callback?next=%2F");
    expect(new URL(redirect).searchParams.get("next")).toBe("/");
  });
});
