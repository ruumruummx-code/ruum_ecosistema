/** @vitest-environment jsdom */
import { describe, expect, it, vi, afterEach } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import type { Vehiculo } from "../cuenta-ui";
import type { TrasladoVehiculo } from "./vehiculos-model";
import { VehiculosDesktop } from "./VehiculosDesktop";
import { nombreVehiculo } from "./VehicleListItem";
const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
function vehiculo(id: string, marca = "Toyota", disponible = true): Vehiculo {
  return {
    id,
    marca,
    modelo: "RAV4",
    anio: 2025,
    placas: `ABC-${id}`,
    tipo: "suv",
    alias: `Familiar ${id}`,
    color: "Blanco",
    vin: `VIN-${id}`,
    creado_en: `2026-10-${id === "a" ? "28" : "27"}T12:00:00Z`,
    actualizado_en: "2026-10-28T12:00:00Z",
    fotos_urls: [],
    puede_circular_rodando: disponible,
    tiene_placas: true,
    tiene_tarjeta_circulacion: true,
    tiene_verificacion: false,
    transmision: "automatica",
    categoria_tarifa: null,
    condicion: null,
    empresa_id: null,
    estado_general_declarado: null,
    gama: null,
    usuario_id: "usuario-test",
    version: 0,
    permiso_especial_vigente: null,
  } as Vehiculo;
}
const vehiculos = [
  vehiculo("a"),
  {
    ...vehiculo("b", "Nissan", false),
    tipo: "sedan",
    alias: "Ejecutivo",
    color: "Azul",
    transmision: "manual",
  } as Vehiculo,
];
afterEach(cleanup);
describe("Mis vehículos desktop", () => {
  it("busca placas normalizadas, conserva el resultado vacío y limpia filtros", () => {
    render(<VehiculosDesktop vehiculos={vehiculos} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "abca" },
    });
    expect(
      within(
        screen.getByRole("list", { name: "Vehículos guardados" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(1);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "inexistente" },
    });
    expect(
      screen.queryByRole("list", { name: "Vehículos guardados" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Mostrando 0 de 2 vehículos",
    );
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
  it("combina alias, tipo y estado sin recuperar resultados excluidos", () => {
    render(<VehiculosDesktop vehiculos={vehiculos} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "familiar" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Tipo de vehículo" }),
      { target: { value: "sedan" } },
    );
    expect(
      screen.getByRole("heading", { name: "No se encontraron vehículos" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Estado" }), {
      target: { value: "revision" },
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(
      screen.getByRole("complementary", {
        name: "Detalle de Nissan RAV4 2025",
      }),
    ).toBeInTheDocument();
  });
  it("ordena por fecha o nombre sin modificar los datos originales", () => {
    const ids = vehiculos.map((v) => v.id);
    render(<VehiculosDesktop vehiculos={vehiculos} />);
    const lista = within(
      screen.getByRole("list", { name: "Vehículos guardados" }),
    );
    expect(lista.getAllByRole("listitem")[0]).toHaveTextContent("Toyota");
    fireEvent.change(screen.getByRole("combobox", { name: "Ordenar por" }), {
      target: { value: "nombre" },
    });
    expect(lista.getAllByRole("listitem")[0]).toHaveTextContent("Nissan");
    expect(vehiculos.map((v) => v.id)).toEqual(ids);
  });
  it("sincroniza identificación, documentos, historial y navegación por vehículo", () => {
    const traslados = [
      {
        traslado_id: "viaje-b",
        vehiculo_id: "b",
        origen_ciudad: "Toluca",
        destino_ciudad: "Lerma",
        estado: "servicio_cerrado",
        creado_en: "2026-10-25T12:00:00Z",
      },
    ] as TrasladoVehiculo[];
    render(<VehiculosDesktop vehiculos={vehiculos} traslados={traslados} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Ver Nissan RAV4 2025" }),
    );
    const panel = within(
      screen.getByRole("complementary", {
        name: "Detalle de Nissan RAV4 2025",
      }),
    );
    expect(panel.getByText("VIN-b")).toBeInTheDocument();
    expect(panel.queryByText("VIN-a")).not.toBeInTheDocument();
    expect(
      panel.getByRole("link", { name: "Seleccionar para traslado" }),
    ).toHaveAttribute("href", "/viajes/nuevo?vehiculo=b");
    fireEvent.click(panel.getByRole("button", { name: "Ver documentos" }));
    expect(panel.getByRole("tab", { name: "Documentos" })).toHaveFocus();
    expect(panel.getByText("Tarjeta de circulación")).toBeInTheDocument();
    fireEvent.click(panel.getByRole("tab", { name: "Historial" }));
    expect(panel.getByRole("link", { name: /Toluca/ })).toHaveAttribute(
      "href",
      "/viajes/viaje-b",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Ver Toyota RAV4 2025" }),
    );
    expect(
      screen.queryByRole("link", { name: /Toluca/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Información" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
  it("permite recorrer las pestañas con teclado", () => {
    render(<VehiculosDesktop vehiculos={vehiculos} />);
    fireEvent.keyDown(screen.getByRole("tab", { name: "Información" }), {
      key: "ArrowRight",
    });
    expect(screen.getByRole("tab", { name: "Documentos" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Documentos" })).toHaveFocus();
  });
  it("filtra por transmisión y color desde Más filtros", () => {
    render(<VehiculosDesktop vehiculos={vehiculos} />);
    fireEvent.click(screen.getByRole("button", { name: "Más filtros" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Transmisión" }), {
      target: { value: "Manual" },
    });
    fireEvent.change(screen.getByLabelText("Color", { selector: "input" }), {
      target: { value: "azul" },
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Ver Nissan RAV4 2025" }),
    ).toBeInTheDocument();
  });
  it("pagina cinco tarjetas y actualiza el detalle al cambiar de página", () => {
    render(
      <VehiculosDesktop
        vehiculos={Array.from({ length: 7 }, (_, i) => ({
          ...vehiculo(String(i)),
          creado_en: `2026-10-${String(27 - i).padStart(2, "0")}T12:00:00Z`,
        }))}
      />,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(
      screen.getByText("Mostrando 1–5 de 7 vehículos"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.getByText("Mostrando 6–7 de 7 vehículos"),
    ).toBeInTheDocument();
    expect(screen.getByText("VIN-5")).toBeInTheDocument();
  });
  it("ofrece el flujo autorizado de corrección, sin fingir que se guardaron cambios", () => {
    render(<VehiculosDesktop vehiculos={vehiculos} />);
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    const dialogo = within(
      screen.getByRole("dialog", { name: "Editar información del vehículo" }),
    );
    expect(
      dialogo.getByRole("link", { name: /Solicitar corrección de datos/ }),
    ).toHaveAttribute("href", "/soporte?vehiculo=a&motivo=correccion_datos");
    fireEvent.click(dialogo.getByRole("button", { name: "Cerrar edición" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("no inventa cantidades, combustible o vigencias; actualiza desde el servidor", () => {
    render(<VehiculosDesktop vehiculos={[]} />);
    expect(
      screen.getByRole("heading", { name: "Sin vehículos registrados" }),
    ).toBeInTheDocument();
    expect(
      screen.getByTitle(
        "No hay fechas de vencimiento disponibles en el registro actual.",
      ),
    ).toHaveTextContent("—");
    expect(
      screen.getByRole("link", { name: /Crear primer traslado/ }),
    ).toHaveAttribute("href", "/viajes/nuevo");
    fireEvent.click(
      screen.getByRole("button", { name: "Actualizar vehículos" }),
    );
    expect(refresh).toHaveBeenCalled();
  });
  it("evita nombres vacíos en registros incompletos", () => {
    expect(
      nombreVehiculo({
        marca: "  ",
        modelo: " ",
        anio: null,
      } as unknown as Vehiculo),
    ).toBe("Vehículo sin información");
  });
});
