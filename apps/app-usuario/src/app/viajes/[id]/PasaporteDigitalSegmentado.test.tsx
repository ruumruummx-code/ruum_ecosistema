/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasaporteDigitalSegmentado } from "./PasaporteDigitalSegmentado";
import type { Pasaporte } from "./tipos-pasaporte";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock("@ruum/api/services", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    crearLlamadaEnmascarada: vi.fn(),
    firmarUrlsEvidencia: vi.fn(),
    obtenerPasaporteDigital: vi.fn(),
    obtenerUltimaUbicacionTraslado: vi.fn(),
  };
});

vi.mock("./ChatTraslado", () => ({
  ChatTraslado: () => <div data-testid="chat-traslado">Chat Mock</div>,
}));

vi.mock("./SeguimientoTrasladoTiempoReal", () => ({
  SeguimientoTrasladoTiempoReal: () => <div data-testid="mapa-tiempo-real">Mapa Mock</div>,
}));

vi.mock("./EvidenciaComparativa", () => ({
  EvidenciaComparativa: () => <div data-testid="evidencia-comparativa">Comparativa Mock</div>,
}));

vi.mock("./ExportarPasaportePdf", () => ({
  ExportarPasaportePdf: () => <button type="button">Exportar PDF Mock</button>,
}));

vi.mock("./CompartirPasaporte", () => ({
  CompartirPasaporte: () => <button type="button">Compartir Mock</button>,
}));

function crearPasaporteBase(estado: Pasaporte["estado"] = "traslado_en_curso"): Pasaporte {
  return {
    traslado_id: "traslado-1234",
    estado,
    creado_en: "2026-10-10T10:00:00Z",
    actualizado_en: "2026-10-10T11:00:00Z",
    vehiculo_marca: "BMW",
    vehiculo_modelo: "Serie 3",
    vehiculo_anio: 2023,
    vehiculo_placas: "NVX4921",
    vehiculo_color: "Azul",
    conductor_id: "cond-1",
    conductor_nombre: "Roberto Castillo",
    conductor_calificacion: 4.9,
    conductor_nivel: "Nivel 2",
    origen_ciudad: "Santa Fe",
    destino_ciudad: "Metepec",
    distancia_km: 64,
    precio_final: 2146,
    monto_pagado: 2146,
  } as unknown as Pasaporte;
}

describe("PasaporteDigitalSegmentado", () => {
  it("renderiza las 4 pestañas y la credencial hero card con botones de conductor", () => {
    const pasaporte = crearPasaporteBase("traslado_en_curso");

    render(
      <PasaporteDigitalSegmentado
        pasaporte={pasaporte}
        traslado={null}
        vehiculo={null}
        conductor={{ id: "cond-1", nombre: "Roberto Castillo" } as never}
        evidencia={[]}
        incidencias={[]}
        disputas={[]}
        reclamosSeguro={[]}
        calificacion={null}
        pagos={[]}
        ultimaUbicacion={null}
      />
    );

    // 4 pestañas
    expect(screen.getByRole("tab", { name: /En Ruta/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Fotos/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Unidad/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Recibo/i })).toBeInTheDocument();

    // Pestaña inicial para viaje activo: En Ruta
    expect(screen.getByRole("tab", { name: /En Ruta/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Roberto Castillo")).toBeInTheDocument();
    expect(screen.getByLabelText(/Abrir o cerrar chat con el conductor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Llamar al conductor vía soporte enmascarado/i)).toBeInTheDocument();
  });

  it("permite cambiar entre pestañas y muestra el contenido correspondiente", async () => {
    const user = userEvent.setup();
    const pasaporte = crearPasaporteBase("traslado_en_curso");

    render(
      <PasaporteDigitalSegmentado
        pasaporte={pasaporte}
        traslado={null}
        vehiculo={null}
        conductor={null}
        evidencia={[]}
        incidencias={[]}
        disputas={[]}
        reclamosSeguro={[]}
        calificacion={null}
        pagos={[]}
        ultimaUbicacion={null}
      />
    );

    // Cambiar a pestaña Fotos
    await user.click(screen.getByRole("tab", { name: /Fotos/i }));
    expect(screen.getByRole("tab", { name: /Fotos/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Evidencia del vehículo/i)).toBeInTheDocument();

    // Cambiar a pestaña Unidad
    await user.click(screen.getByRole("tab", { name: /Unidad/i }));
    expect(screen.getByRole("tab", { name: /Unidad/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Datos del vehículo/i)).toBeInTheDocument();

    // Cambiar a pestaña Recibo
    await user.click(screen.getByRole("tab", { name: /Recibo/i }));
    expect(screen.getByRole("tab", { name: /Recibo/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Información de pago/i)).toBeInTheDocument();
  });

  it("abre por defecto en la pestaña Fotos si el traslado está concluido", () => {
    const pasaporte = crearPasaporteBase("servicio_cerrado");

    render(
      <PasaporteDigitalSegmentado
        pasaporte={pasaporte}
        traslado={null}
        vehiculo={null}
        conductor={null}
        evidencia={[]}
        incidencias={[]}
        disputas={[]}
        reclamosSeguro={[]}
        calificacion={null}
        pagos={[]}
        ultimaUbicacion={null}
      />
    );

    expect(screen.getByRole("tab", { name: /Fotos/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Evidencia del vehículo/i)).toBeInTheDocument();
  });

  it("muestra 'Tarifa asignada' y 'Pago realizado' como completados cuando el pago ya se realizó", async () => {
    const user = userEvent.setup();
    // Caso reportado: estado cotizacion_generada pero con pago completado
    const pasaporte = {
      ...crearPasaporteBase("cotizacion_generada"),
      conductor_id: null,
      conductor_nombre: null,
      precio_cotizado: 1800,
      precio_final: null,
      monto_pagado: 1800,
    } as unknown as Pasaporte;

    const pagosMock = [
      {
        id: "pago-1",
        traslado_id: "traslado-1234",
        monto: 1800,
        metodo: "tarjeta",
        estado: "completado",
        registrado_en: "2026-10-10T10:30:00Z",
      },
    ];

    render(
      <PasaporteDigitalSegmentado
        pasaporte={pasaporte}
        traslado={null}
        vehiculo={null}
        conductor={null}
        evidencia={[]}
        incidencias={[]}
        disputas={[]}
        reclamosSeguro={[]}
        calificacion={null}
        pagos={pagosMock as never}
        ultimaUbicacion={null}
      />
    );

    // En la pestaña En Ruta: revisar progreso del servicio
    const timeline = screen.getByRole("list");

    // Paso Tarifa asignada: debe ser Completado (no Estado actual)
    const itemTarifa = within(timeline).getByText("Tarifa asignada").closest("li");
    expect(itemTarifa).toHaveTextContent("Completado");
    expect(itemTarifa).not.toHaveTextContent("Estado actual");

    // Paso Pago realizado: debe ser Completado (no Pendiente)
    const itemPago = within(timeline).getByText("Pago realizado").closest("li");
    expect(itemPago).toHaveTextContent("Completado");
    expect(itemPago).not.toHaveTextContent("Pendiente");

    // Paso Conductor asignado: debe ser el activo (Asignando conductor...)
    const itemConductor = within(timeline).getByText("Conductor asignado").closest("li");
    expect(itemConductor).toHaveTextContent("Asignando conductor...");

    // En la pestaña Recibo: estado de pago debe ser 'Pagado' y no pedir aceptar cotización
    await user.click(screen.getByRole("tab", { name: /Recibo/i }));
    expect(screen.getByText("Pagado")).toBeInTheDocument();
    expect(screen.queryByText(/Cotización lista para confirmación/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Pago registrado con éxito/i)).toBeInTheDocument();
  });
});
