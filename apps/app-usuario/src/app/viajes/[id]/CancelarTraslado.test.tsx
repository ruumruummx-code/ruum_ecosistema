/** @vitest-environment jsdom */
import { expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, cleanup, waitFor } from "@testing-library/react";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
const mocks = vi.hoisted(() => ({ cancelar: vi.fn(), configurado: vi.fn(() => true) }));
vi.mock("@ruum/api/services", async (importOriginal) => ({ ...await importOriginal<typeof import("@ruum/api/services")>(), cancelarTraslado: mocks.cancelar }));
vi.mock("@/lib/supabase-browser", () => ({ crearClienteNavegador: () => ({}), tieneSupabaseConfigurado: mocks.configurado }));
beforeEach(() => { cleanup(); vi.clearAllMocks(); mocks.configurado.mockReturnValue(true); });
import { CancelarTraslado } from "./CancelarTraslado";
const props={trasladoId:"prueba",precio:1000,fechaProgramada:null,conductorAsignado:true};
it("oculta cancelación tras el cierre aunque se abra una disputa",()=>{
 const {container}=render(<CancelarTraslado {...props} estado="disputa_abierta" cerrado />);
 expect(container).toBeEmptyDOMElement();
});
it("no afirma que el vehículo está en operación por una etapa administrativa",()=>{
 render(<CancelarTraslado {...props} estado="documentacion_validada" />);
 expect(screen.getByText("Cancelación no disponible")).toBeInTheDocument();
 expect(screen.queryByText(/El vehículo ya se encuentra en proceso operativo/)).not.toBeInTheDocument();
});
it("ofrece soporte con el traslado y activa la apertura de chat del contenedor",()=>{
 const abrir = vi.fn();
 render(<CancelarTraslado {...props} estado="traslado_en_curso" onAbrirChat={abrir} />);
 fireEvent.click(screen.getByRole("link", { name: "comunícate con el conductor" }));
 expect(abrir).toHaveBeenCalledOnce();
 expect(screen.getByRole("link", { name: "contacta a Soporte" })).toHaveAttribute("href", "/soporte?viaje=prueba&motivo=cancelacion");
});

it("mueve el foco al contexto anunciado y lo devuelve al mantener el viaje", () => {
 render(<CancelarTraslado {...props} estado="pendiente_de_conductor" />);
 const abrir = screen.getByRole("button", { name: "Cancelar viaje" });
 abrir.focus(); fireEvent.click(abrir);
 expect(screen.getByRole("group", { name: "¿Confirmar cancelación?" })).toHaveFocus();
 expect(screen.getByRole("status")).toHaveTextContent("Esta acción no se puede deshacer");
 fireEvent.click(screen.getByRole("button", { name: "No, mantener" }));
 expect(screen.getByRole("button", { name: "Cancelar viaje" })).toHaveFocus();
 expect(mocks.cancelar).not.toHaveBeenCalled();
});
it("bloquea duplicados durante el envío y después del éxito", async () => {
 let resolver!: (value: { monto_cargo: number; porcentaje_cargo: number }) => void;
 mocks.cancelar.mockImplementationOnce(() => new Promise(resolve => { resolver = resolve; }));
 render(<CancelarTraslado {...props} estado="pendiente_de_conductor" />);
 fireEvent.click(screen.getByRole("button", { name: "Cancelar viaje" }));
 const confirmar = screen.getByRole("button", { name: "Sí, cancelar el viaje" });
 fireEvent.click(confirmar); fireEvent.click(confirmar);
 expect(mocks.cancelar).toHaveBeenCalledTimes(1);
 expect(screen.getByRole("button", { name: "Cancelando…" })).toBeDisabled();
 expect(screen.getByRole("button", { name: "No, mantener" })).toBeDisabled();
 resolver({ monto_cargo: 0, porcentaje_cargo: 0 });
 await waitFor(() => expect(screen.getByRole("button", { name: "Cancelar viaje" })).toBeDisabled());
 await waitFor(() => expect(screen.getByText(/Traslado cancelado. Cargo registrado/).closest("[data-resultado]")).toHaveFocus());
});
it("anuncia errores, conserva la confirmación y permite reintentar", async () => {
 mocks.cancelar.mockRejectedValueOnce(new Error("No se pudo cancelar"));
 render(<CancelarTraslado {...props} estado="pendiente_de_conductor" />);
 fireEvent.click(screen.getByRole("button", { name: "Cancelar viaje" }));
 fireEvent.click(screen.getByRole("button", { name: "Sí, cancelar el viaje" }));
 await waitFor(() => expect(screen.getByText("No se pudo cancelar").closest("[data-resultado]")).toHaveFocus());
 expect(screen.getByRole("button", { name: "Sí, cancelar el viaje" })).toBeEnabled();
 fireEvent.click(screen.getByRole("button", { name: "No, mantener" }));
 expect(screen.getByRole("button", { name: "Cancelar viaje" })).toHaveFocus();
});
