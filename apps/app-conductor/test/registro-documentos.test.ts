// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useRegistrationDocuments } from "../src/app/registro/useRegistrationDocuments";

const { subir } = vi.hoisted(() => ({ subir: vi.fn() }));
vi.mock("@ruum/api/services", () => ({ subirDocumentoSolicitudConductor: subir }));
vi.mock("@ruum/shared/utils", () => ({ createLogger: () => ({ warn: vi.fn() }), errorCode: () => "test" }));
vi.mock("../src/lib/supabase-browser", () => ({ crearClienteNavegador: vi.fn() }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

test("una subida parcial detiene el envío y el reintento solo sube el archivo fallido", async () => {
  const setCampoError = vi.fn(() => false);
  const registrarTelemetria = vi.fn();
  const { result } = renderHook(() => useRegistrationDocuments({
    setCampoError, limpiarErrorCampo: vi.fn(), registrarTelemetria, paso: 4
  }));
  act(() => {
    for (const campo of ["licenciaFrente", "licenciaReverso", "identificacionOficial"] as const) {
      result.current.cambiarDocumento(campo, new File(["foto"], `${campo}.jpg`, { type: "image/jpeg" }));
    }
  });
  subir.mockImplementation(async (_cliente, _id, tipo) => {
    if (tipo === "licencia_frente") throw new Error("La imagen debe medir al menos 800 x 600 px.");
    return { documento_id: tipo };
  });
  const enviarSolicitud = vi.fn();
  await act(async () => {
    await expect((async () => {
      await result.current.cargarDocumentos({} as never, "solicitud");
      enviarSolicitud();
    })()).rejects.toThrow("800 x 600");
  });
  expect(enviarSolicitud).not.toHaveBeenCalled();
  expect(result.current.estadoDocumentos).toEqual({ licenciaFrente: "error", licenciaReverso: "subido", identificacionOficial: "subido" });
  expect(setCampoError).toHaveBeenCalledWith("licenciaFrente", expect.stringContaining("800 x 600"));
  expect(registrarTelemetria).toHaveBeenCalledTimes(1);

  subir.mockClear().mockResolvedValue({ documento_id: "frente" });
  await act(async () => { await result.current.cargarDocumentos({} as never, "solicitud"); });
  expect(subir).toHaveBeenCalledTimes(1);
  expect(subir.mock.calls[0][2]).toBe("licencia_frente");
  expect(Object.values(result.current.estadoDocumentos)).toEqual(["subido", "subido", "subido"]);
  subir.mockClear();
  await act(async () => { await result.current.cargarDocumentos({} as never, "solicitud"); });
  expect(subir).not.toHaveBeenCalled();
});
