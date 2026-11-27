// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { DocumentsStep } from "../src/app/registro/DocumentsStep";

const { capturarFoto } = vi.hoisted(() => ({ capturarFoto: vi.fn() }));
vi.mock("../src/lib/capacitor", () => ({ esNativo: () => true }));
vi.mock("../src/lib/camara", () => ({ capturarFoto }));

afterEach(() => {
  cleanup();
  capturarFoto.mockReset();
});

function montarDocumentos(frente: File | null = null) {
  const cambiarDocumento = vi.fn();
  render(<DocumentsStep
    sesionAutenticada
    documentos={{ licenciaFrente: frente, licenciaReverso: null, identificacionOficial: null }}
    estadoDocumentos={{ licenciaFrente: frente ? "listo" : "pendiente", licenciaReverso: "pendiente", identificacionOficial: "pendiente" }}
    erroresCampos={{}}
    cambiarDocumento={cambiarDocumento}
  />);
  return cambiarDocumento;
}

test("la cámara nativa entrega un JPEG al campo de documento elegido", async () => {
  capturarFoto.mockResolvedValue({ dataUrl: "data:image/jpeg;base64,/9j/AA==" });
  const cambiarDocumento = montarDocumentos();

  fireEvent.click(screen.getByRole("button", { name: "Tomar foto de licencia (reverso)" }));

  await waitFor(() => expect(cambiarDocumento).toHaveBeenCalledTimes(1));
  const [campo, archivo] = cambiarDocumento.mock.calls[0];
  expect(campo).toBe("licenciaReverso");
  expect(archivo).toBeInstanceOf(File);
  expect(archivo).toMatchObject({ name: "licencia_reverso.jpg", type: "image/jpeg", size: 4 });
});

test("cancelar la cámara nativa conserva el documento seleccionado", async () => {
  capturarFoto.mockRejectedValue(new Error("User cancelled photos app"));
  const cambiarDocumento = montarDocumentos(new File(["foto"], "frente.jpg", { type: "image/jpeg" }));
  const boton = screen.getByRole("button", { name: "Tomar foto de licencia (frente)" });

  fireEvent.click(boton);

  await waitFor(() => expect((boton as HTMLButtonElement).disabled).toBe(false));
  expect(capturarFoto).toHaveBeenCalledOnce();
  expect(cambiarDocumento).not.toHaveBeenCalled();
  expect(screen.getByText("frente.jpg")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});
