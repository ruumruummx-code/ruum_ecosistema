/** @vitest-environment jsdom */
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VALORES_INICIALES } from "../constants";
import type { useNuevoTraslado } from "../hooks/useNuevoTraslado";
import { CotizadorPortal } from "./CotizadorPortal";

vi.mock("./PasoTarifa", () => ({ PasoTarifa: () => <div>Formulario</div> }));
vi.mock("./PasoDetalles", () => ({ PasoDetalles: () => <div>Confirmación</div> }));

type Estado = ReturnType<typeof useNuevoTraslado>;
function estado(): Estado {
  return {
    paso: 0,
    datos: { ...VALORES_INICIALES },
    estadoGuardado: "guardado",
    accionesTarifa: { onContinuar: vi.fn() },
    previsualizacion: null,
    previsualizando: false,
  } as unknown as Estado;
}

describe("cotizador en una vista fija", () => {
  it("al volver del pago muestra el monto del servidor y conserva la aceptación implícita", async () => {
    const enviarSolicitud = vi.fn();
    const t = { ...estado(), paso: 3, tarifaPreviaAceptada: true, aceptaPoliticasPagoCancelacion: false,
      previsualizacion: { disponible: true, tarifa: 881.21 },
      trasladoCreado: { id: "traslado-1", precioCotizado: 892.5, tipoPago: "anticipado" },
      accionesDetalles: { enviarSolicitud },
    } as unknown as Estado;
    render(<CotizadorPortal t={t} headingRef={createRef<HTMLHeadingElement>()}/>);
    const continuar = screen.getByRole("button", { name: "Continuar al pago · $892.50 MXN" });
    expect(continuar).toBeEnabled();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Carga masiva Excel / CSV" })).not.toBeInTheDocument();
    await userEvent.setup().click(continuar);
    expect(enviarSolicitud).toHaveBeenCalledOnce();
  });
  it("une el precio con el avance y bloquea datos incompletos y recálculos", async () => {
    const user = userEvent.setup();
    const t = estado();
    const headingRef = createRef<HTMLHeadingElement>();
    const view = render(<CotizadorPortal t={t} headingRef={headingRef} />);
    expect(
      screen.getByRole("button", { name: "Llena los datos para cotizar" }),
    ).toBeDisabled();
    expect(screen.getByText("Paso 1 de 5")).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Cambios guardados" }),
    ).toBeInTheDocument();
    const completo = {
      ...t,
      datos: {
        ...t.datos,
        origenCodigoPostal: "03100",
        destinoCodigoPostal: "06600",
        marca: "Nissan",
        modelo: "Versa",
        condicion: "seminueva",
      },
      previsualizacion: { disponible: true, tarifa: 1500 },
    } as Estado;
    view.rerender(<CotizadorPortal t={completo} headingRef={headingRef} />);
    const continuar = screen.getByRole("button", {
      name: "Continuar · Tarifa est. $1,500 MXN",
    });
    expect(continuar).toBeEnabled();
    await user.click(continuar);
    expect(t.accionesTarifa.onContinuar).toHaveBeenCalledOnce();
    view.rerender(
      <CotizadorPortal
        t={{ ...completo, previsualizando: true }}
        headingRef={headingRef}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Calculando tarifa…" }),
    ).toBeDisabled();
    view.rerender(
      <CotizadorPortal
        t={{
          ...completo,
          datos: { ...completo.datos, destinoCodigoPostal: "066" },
        }}
        headingRef={headingRef}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Llena los datos para cotizar" }),
    ).toBeDisabled();
  });

  it("no permite avanzar sin tarifa automática ni fecha programada", () => {
    const t = estado();
    const completo = {
      ...t,
      datos: {
        ...t.datos,
        origenCodigoPostal: "03100",
        destinoCodigoPostal: "06600",
        marca: "Nissan",
        modelo: "Versa",
        condicion: "seminueva",
      },
      previsualizacion: { disponible: false },
    } as Estado;
    const headingRef = createRef<HTMLHeadingElement>();
    const view = render(
      <CotizadorPortal t={completo} headingRef={headingRef} />,
    );
    expect(
      screen.getByRole("button", { name: "Cotización especial requerida" }),
    ).toBeDisabled();
    view.rerender(
      <CotizadorPortal
        t={{
          ...completo,
          datos: {
            ...completo.datos,
            modalidadProgramacion: "programado",
            fechaHoraProgramada: "",
          },
        }}
        headingRef={headingRef}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Llena los datos para cotizar" }),
    ).toBeDisabled();
  });
});
