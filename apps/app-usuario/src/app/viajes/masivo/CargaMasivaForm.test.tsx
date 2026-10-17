/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EJEMPLO_CSV_PLANTILLA } from "@ruum/shared/utils";

/* La carga masiva tiene 6 funciones sin cobertura (limpiar, numeroTexto,
   construirDireccionCompleta, calcularSha256, dormir y el componente). No son
   exportadas, así que se ejercitan a través del flujo con lo mínimo mockeado. */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => true,
  crearClienteNavegador: vi.fn(),
}));

vi.mock("@/lib/codigos-postales", () => ({
  consultarCodigoPostalMx: vi.fn(async () => ({
    codigo: "03100",
    ciudades: ["Ciudad de México"],
    colonias: ["Del Valle"],
  })),
}));

vi.mock("@/lib/mapbox", () => ({
  tieneMapboxConfigurado: () => false,
  geocodificarDireccion: vi.fn(async () => null),
  calcularRutaMapbox: vi.fn(async () => null),
  mensajeErrorMapbox: () => "No se pudo geocodificar.",
}));

vi.mock("@ruum/api/services", () => ({
  listarCargasMasivasUsuario: vi.fn(async () => []),
  previsualizarTarifaUsuario: vi.fn(async () => ({ disponible: true, tarifa: 1250, categoria_tarifa: "ligero_a", gama: "entrada" })),
  crearTrasladosMasivosUsuario: vi.fn(async () => ({ carga_id: "lote-1" })),
  procesarCargaTrasladosMasivosUsuario: vi.fn(async () => ({ estado: "procesada_con_errores", filas_creadas: 0, filas_error: 1, filas_procesadas: 1 })),
  obtenerEstadoCargaMasivaUsuario: vi.fn(async () => ({ reporte_errores_csv: 'numero_fila,referencia_externa,errores\n1,"FLOT-001","Rechazo del servidor"' })),
}));

import { CargaMasivaForm } from "./CargaMasivaForm";

import { consultarCodigoPostalMx } from "@/lib/codigos-postales";
import { crearTrasladosMasivosUsuario, obtenerEstadoCargaMasivaUsuario, listarCargasMasivasUsuario, procesarCargaTrasladosMasivosUsuario, previsualizarTarifaUsuario } from "@ruum/api/services";

const plantillaVigente = EJEMPLO_CSV_PLANTILLA.replace("programado", "lo_antes_posible")
  .split("\n").map((linea, indice) => linea + (indice === 0 ? ",distancia_km,tiempo_estimado_horas" : ",12,0.5")).join("\n");

function archivoCsv(texto = plantillaVigente): File {
  const archivo = new File([texto], "plantilla.csv", { type: "text/csv" });
  Object.defineProperty(archivo, "text", { value: async () => texto });
  return archivo;
}

describe("CargaMasivaForm", () => {
  it("arranca en el paso de subida con la plantilla disponible", async () => {
    render(<CargaMasivaForm />);
    // El paso 1 cubre el render del componente y el efecto de cleanup.
    expect(await screen.findByRole("button", { name: /descargar plantilla/i })).toBeInTheDocument();
  });

  it("analiza un archivo y lista las filas prevalidadas", async () => {
    const user = userEvent.setup();
    render(<CargaMasivaForm />);

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, archivoCsv());

    // calcularSha256 + limpiar + numeroTexto + construirDireccionCompleta
    // corren durante el análisis.
    expect(await screen.findByText("Total filas", {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it("permite corregir una fila inválida sin consultar rutas hasta guardar", async () => {
    vi.mocked(consultarCodigoPostalMx).mockClear();
    const user = userEvent.setup();
    render(<CargaMasivaForm />);
    const lineas = plantillaVigente.split("\n");
    const campos = lineas[1].split(",");
    const indice = lineas[0].split(",").indexOf("vehiculo_marca");
    campos[indice] = "";
    await user.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, archivoCsv(lineas[0] + "\n" + campos.join(",")));
    await screen.findByText("vehiculo_marca es requerido");
    expect(consultarCodigoPostalMx).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Corregir fila 1" }));
    await user.type(screen.getByLabelText("vehiculo marca"), "Toyota");
    await user.click(screen.getByRole("button", { name: "Guardar y volver a validar" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Continuar al resumen/ })).toBeEnabled());
    expect(consultarCodigoPostalMx).toHaveBeenCalledTimes(2);
  });

  it("envía solo filas seleccionadas y descarga el reporte del servidor", async () => {
    const user = userEvent.setup();
    vi.spyOn(crypto.subtle, "digest").mockResolvedValue(new Uint8Array(32).buffer);
    render(<CargaMasivaForm />);
    const lineas = plantillaVigente.split("\n");
    await user.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, archivoCsv(lineas[0] + "\n" + lineas[1] + "\n" + lineas[1]));
    await screen.findByRole("checkbox", { name: "Incluir fila 1" });
    await user.click(screen.getByRole("checkbox", { name: "Incluir fila 1" }));
    await user.click(screen.getByRole("button", { name: /Continuar al resumen/ }));
    expect(screen.getByText("Se enviarán 1 de 2 filas. 1 quedarán pendientes o excluidas.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Crear 1 traslados" })).toBeEnabled());
    expect(screen.getByText(/Total estimado/)).toHaveTextContent("1,250.00");
    await user.click(screen.getByRole("button", { name: "Crear 1 traslados" }));
    await waitFor(() => expect(crearTrasladosMasivosUsuario).toHaveBeenCalledWith(undefined, expect.objectContaining({ filas: [expect.any(Object)] })));
    await waitFor(() => expect(obtenerEstadoCargaMasivaUsuario).toHaveBeenCalledWith(undefined, "lote-1"));
    const descargar = await screen.findByRole("button", { name: /Descargar reporte de errores/ });
    await waitFor(() => expect(descargar).toBeEnabled());
    const crearUrl = vi.fn((_blob: Blob) => "blob:reporte");
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: crearUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await user.click(descargar);
    const contenido = await new Promise<string>((resolve) => {
      const lector = new FileReader();
      lector.onload = () => resolve(String(lector.result));
      lector.readAsText(crearUrl.mock.calls[0][0]);
    });
    expect(contenido).toContain('2,"FLOT-001","Rechazo del servidor"');
    click.mockRestore();
  });

  it("bloquea crear si la tarifa no está disponible y permite reintentar", async () => {
    vi.mocked(previsualizarTarifaUsuario).mockResolvedValueOnce({ disponible: false, motivo: "Vehículo sin tarifa" });
    const user = userEvent.setup();
    render(<CargaMasivaForm />);
    await user.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, archivoCsv());
    await user.click(await screen.findByRole("button", { name: /Continuar al resumen/ }));
    await screen.findByText(/Vehículo sin tarifa/);
    expect(screen.getByRole("button", { name: "Crear 1 traslados" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Reintentar cotización" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Crear 1 traslados" })).toBeEnabled());
  });

  it("recupera y reanuda un lote pendiente sin crear otro", async () => {
    vi.mocked(crearTrasladosMasivosUsuario).mockClear();
    vi.mocked(procesarCargaTrasladosMasivosUsuario).mockClear();
    vi.mocked(listarCargasMasivasUsuario).mockResolvedValueOnce([{
      id: "lote-pendiente", nombre_archivo: "pendiente.csv", total_filas: 2,
      filas_creadas: 1, filas_error: 0, filas_procesadas: 1, estado: "procesando",
      creado_en: "2026-10-17T00:00:00Z", reporte_errores_csv: null, mensaje_estado: null
    }]);
    const user = userEvent.setup();
    render(<CargaMasivaForm />);
    await user.click(await screen.findByRole("button", { name: "Reanudar lote" }));
    await screen.findByText("Carga masiva procesada");
    expect(procesarCargaTrasladosMasivosUsuario).toHaveBeenCalledWith(undefined, "lote-pendiente", 50);
    expect(crearTrasladosMasivosUsuario).not.toHaveBeenCalled();
  });

  it("detiene el procesamiento recuperado sin enviar más bloques", async () => {
    vi.mocked(procesarCargaTrasladosMasivosUsuario).mockClear();
    vi.mocked(procesarCargaTrasladosMasivosUsuario).mockResolvedValueOnce({
      carga_id: "interrumpido", estado: "procesando", total_filas: 100,
      filas_creadas: 50, filas_error: 0, filas_procesadas: 50
    });
    vi.mocked(listarCargasMasivasUsuario).mockResolvedValueOnce([{
      id: "interrumpido", nombre_archivo: "interrumpido.csv", total_filas: 100,
      filas_creadas: 50, filas_error: 0, filas_procesadas: 50, estado: "procesando",
      creado_en: "2026-10-17T00:00:00Z", reporte_errores_csv: null, mensaje_estado: null
    }]);
    const user = userEvent.setup();
    render(<CargaMasivaForm />);
    await user.click(await screen.findByRole("button", { name: "Reanudar lote" }));
    await screen.findByText(/Procesadas 50 de 100/);
    await user.click(screen.getByRole("button", { name: "Detener seguimiento" }));
    await screen.findByText(/Seguimiento detenido/);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Detener seguimiento" })).not.toBeInTheDocument());
    expect(procesarCargaTrasladosMasivosUsuario).toHaveBeenCalledTimes(1);
  });

  it("rechaza un archivo vacío sin avanzar de paso", async () => {
    const user = userEvent.setup();
    render(<CargaMasivaForm />);

    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    await user.upload(input, new File([""], "vacio.csv", { type: "text/csv" }));

    // dormir() se usa en el reintento de polling: si nada que reintentar, no avanza.
    expect(screen.queryByText(/filas válidas/i)).toBeNull();
  });
});
