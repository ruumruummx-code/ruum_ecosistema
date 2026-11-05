import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  validarLimitesDatosPersonalesServer,
  actualizarPerfilTransaccionalRpc,
  ejecutarSagaActualizacionPerfil,
  ErrorConflictoVersionPerfil,
  ErrorValidacionPerfilServer,
} from "../perfil-transaccional";

describe("Flujo 12 — Validación Server-side de Límites de Datos Personales (CB-3 / CA-8)", () => {
  it("valida nombre con longitud mínima (2) y máxima (100)", () => {
    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "A" })
    ).toThrow(ErrorValidacionPerfilServer);

    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "A".repeat(101) })
    ).toThrow(ErrorValidacionPerfilServer);

    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "Carlos Mendoza" })
    ).not.toThrow();
  });

  it("valida teléfono de entre 10 y 20 caracteres", () => {
    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "Carlos", telefono: "12345" })
    ).toThrow(ErrorValidacionPerfilServer);

    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "Carlos", telefono: "+52 55 1234 5678" })
    ).not.toThrow();
  });

  it("valida código postal en México de 5 dígitos numéricos estrictos", () => {
    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "Carlos", pais: "México", codigoPostal: "0670" })
    ).toThrow(ErrorValidacionPerfilServer);

    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "Carlos", pais: "México", codigoPostal: "0670A" })
    ).toThrow(ErrorValidacionPerfilServer);

    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "Carlos", pais: "México", codigoPostal: "06700" })
    ).not.toThrow();
  });

  it("valida límites de longitud de dirección: calle (150), número (20), colonia (100)", () => {
    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "Carlos", calle: "X".repeat(151) })
    ).toThrow(ErrorValidacionPerfilServer);

    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "Carlos", numero: "X".repeat(21) })
    ).toThrow(ErrorValidacionPerfilServer);

    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "Carlos", colonia: "X".repeat(101) })
    ).toThrow(ErrorValidacionPerfilServer);
  });

  it("valida que la fecha de nacimiento no sea futura ni de menores de edad", () => {
    const manana = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "Carlos", fechaNacimiento: manana })
    ).toThrow(/futura/);

    // Usuario de 15 años
    const menor = new Date(Date.now() - 15 * 365.25 * 86400000).toISOString().split("T")[0];
    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "Carlos", fechaNacimiento: menor })
    ).toThrow(/18 años/);

    // Usuario de 25 años
    const adulto = new Date(Date.now() - 25 * 365.25 * 86400000).toISOString().split("T")[0];
    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "Carlos", fechaNacimiento: adulto })
    ).not.toThrow();
  });

  it("rechaza fechas de nacimiento imposibles anteriores a 1900 o con edad mayor a 125 años (CB-3)", () => {
    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "Carlos", fechaNacimiento: "1850-01-01" })
    ).toThrow(/posterior a 1900/);

    expect(() =>
      validarLimitesDatosPersonalesServer({ nombre: "Carlos", fechaNacimiento: "1899-12-31" })
    ).toThrow(/posterior a 1900/);
  });
});

describe("Flujo 12 — RPC Transaccional y Control de Concurrencia Optimista (CB-1 / CA-1, CA-2)", () => {
  it("arroja ErrorConflictoVersionPerfil cuando el servidor reporta conflicto de versión", async () => {
    const clienteMock: any = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "conflicto_version: El perfil fue modificado por otra sesión", code: "40001" },
      }),
    };

    await expect(
      actualizarPerfilTransaccionalRpc(
        clienteMock,
        { nombre: "Carlos Mendoza" },
        1 // versión esperada
      )
    ).rejects.toThrow(ErrorConflictoVersionPerfil);
  });

  it("retorna el usuario y la nueva versión cuando la RPC tiene éxito", async () => {
    const usuarioActualizado = {
      id: "u-1",
      nombre: "Carlos Mendoza",
      version: 2,
      fecha_nacimiento: "1990-05-15",
    };

    const clienteMock: any = {
      rpc: vi.fn().mockResolvedValue({
        data: { ok: true, version: 2, usuario: usuarioActualizado },
        error: null,
      }),
    };

    const res = await actualizarPerfilTransaccionalRpc(
      clienteMock,
      { nombre: "Carlos Mendoza", fechaNacimiento: "1990-05-15" },
      1
    );

    expect(res.ok).toBe(true);
    expect(res.version).toBe(2);
    expect(res.usuario.nombre).toBe("Carlos Mendoza");
    expect(clienteMock.rpc).toHaveBeenCalledWith(
      "usuario_actualiza_perfil_transaccional",
      expect.objectContaining({
        p_version_esperada: 1,
        p_datos: expect.objectContaining({
          nombre: "Carlos Mendoza",
          fecha_nacimiento: "1990-05-15",
        }),
      })
    );
  });
});

describe("Flujo 12 — Saga de Fotografía con Compensación Inmediata y Limpieza (CB-2 / CA-3, CA-4)", () => {
  const uploadMock = vi.fn();
  const removeMock = vi.fn();
  const createSignedUrlMock = vi.fn();
  const rpcMock = vi.fn();

  const clienteMock: any = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "auth-123" } } }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: uploadMock,
        remove: removeMock,
        createSignedUrl: createSignedUrlMock,
      }),
    },
    rpc: rpcMock,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("compensa y elimina la foto subida si la actualización en base de datos falla (CA-3)", async () => {
    // Simula archivo JPEG válido (magic bytes FF D8 FF)
    const bytesJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const archivo = new File([bytesJpeg], "avatar.jpg", { type: "image/jpeg" });

    uploadMock.mockResolvedValue({ data: { path: "auth-123/perfil_1.jpg" }, error: null });
    removeMock.mockResolvedValue({ data: [], error: null });

    // La RPC falla por conflicto de versión
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "conflicto_version", code: "40001" },
    });

    await expect(
      ejecutarSagaActualizacionPerfil(clienteMock, {
        datos: { nombre: "Carlos Mendoza" },
        versionEsperada: 1,
        archivoNuevaFoto: archivo,
      })
    ).rejects.toThrow(ErrorConflictoVersionPerfil);

    // Verificación de compensación: se removió la nueva foto recién subida
    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(removeMock).toHaveBeenCalledWith([expect.stringContaining("auth-123/perfil_")]);
  });

  it("ejecuta la saga exitosamente y dispara la limpieza de la foto previa (CA-3, CA-4)", async () => {
    const bytesPng = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const archivo = new File([bytesPng], "avatar.png", { type: "image/png" });

    uploadMock.mockResolvedValue({ data: { path: "auth-123/perfil_2.png" }, error: null });
    removeMock.mockResolvedValue({ data: [], error: null });
    createSignedUrlMock.mockResolvedValue({ data: { signedUrl: "https://storage.signed/url?ttl=900" }, error: null });

    rpcMock.mockResolvedValue({
      data: {
        ok: true,
        version: 3,
        usuario: { id: "u-1", nombre: "Carlos Mendoza", foto_url: "auth-123/perfil_2.png", version: 3 },
      },
      error: null,
    });

    const resultado = await ejecutarSagaActualizacionPerfil(clienteMock, {
      datos: { nombre: "Carlos Mendoza" },
      versionEsperada: 2,
      archivoNuevaFoto: archivo,
      fotoUrlPrevia: "auth-123/perfil_1.jpg",
    });

    expect(resultado.ok).toBe(true);
    expect(resultado.version).toBe(3);
    expect(resultado.fotoUrlFirmada).toBe("https://storage.signed/url?ttl=900");

    // Verificación de limpieza asíncrona de la foto anterior
    expect(removeMock).toHaveBeenCalledWith(["auth-123/perfil_1.jpg"]);
  });
});
