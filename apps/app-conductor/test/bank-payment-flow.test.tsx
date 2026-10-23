// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getUser: vi.fn(),
  signInWithPassword: vi.fn(),
  obtenerGananciasConductor: vi.fn(),
  guardarDatosBancariosConductor: vi.fn(),
  cargarConductorCuenta: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@ruum/api/services", () => ({
  guardarDatosBancariosConductor: mocks.guardarDatosBancariosConductor,
  obtenerGananciasConductor: mocks.obtenerGananciasConductor,
}));
vi.mock("@/lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({ auth: { getUser: mocks.getUser, signInWithPassword: mocks.signInWithPassword } }),
}));
vi.mock("../src/app/cuenta/cuenta-utils", () => ({ cargarConductorCuenta: mocks.cargarConductorCuenta }));
vi.mock("../src/app/cuenta/datos-bancarios/DriverBankDetailsView", () => ({
  DriverBankDetailsView: (props: {
    formulario: { titularCuenta: string; banco: string; clabe: string };
    onChange: (field: "titularCuenta" | "banco" | "clabe", value: string) => void;
    authorized: boolean; loading: boolean; message: string | null; password: string;
    onPassword: (value: string) => void; onAuthorize: () => Promise<void>; onSave: () => Promise<void>;
  }) => <section>
    <output data-testid="authorized">{String(props.authorized)}</output>
    <output data-testid="bank-loading">{String(props.loading)}</output>
    <label>Titular<input aria-label="Titular" value={props.formulario.titularCuenta} onChange={event => props.onChange("titularCuenta", event.target.value)} /></label>
    <label>Banco<input aria-label="Banco" value={props.formulario.banco} onChange={event => props.onChange("banco", event.target.value)} /></label>
    <label>CLABE<input aria-label="CLABE" value={props.formulario.clabe} onChange={event => props.onChange("clabe", event.target.value)} /></label>
    <label>Contraseña<input aria-label="Contraseña" value={props.password} onChange={event => props.onPassword(event.target.value)} /></label>
    <button type="button" onClick={() => void props.onAuthorize()}>Confirmar sesión</button>
    <button type="button" onClick={() => void props.onSave()}>Guardar cuenta</button>
    {props.message && <p role="status">{props.message}</p>}
  </section>,
}));
vi.mock("@/components/ConfirmDialog", () => ({
  ConfirmDialog: ({ open, title, confirmLabel, onConfirm, onCancel }: {
    open: boolean; title: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
    consequence: string; maskedData: string[]; busy: boolean;
  }) => open ? <div role="dialog" aria-label={title}>
    <button type="button" onClick={onCancel}>Cancelar</button>
    <button type="button" onClick={onConfirm}>{confirmLabel}</button>
  </div> : null,
}));

import PaginaDatosBancarios from "../src/app/cuenta/datos-bancarios/page";

describe("flujo de autorización y captura de cuenta para pagos", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cargarConductorCuenta.mockResolvedValue({ id: "driver-1", nombre: "Ana Conductora" });
    mocks.obtenerGananciasConductor.mockResolvedValue({ datosBancarios: null });
    mocks.getUser.mockResolvedValue({ data: { user: { email: "ana@ruum.mx" } } });
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    mocks.guardarDatosBancariosConductor.mockResolvedValue({ estado: "en_revision" });
  });

  it("exige reautenticación, detecta el banco por CLABE y confirma antes de enviar", async () => {
    render(<PaginaDatosBancarios />);
    await waitFor(() => expect(screen.getByTestId("bank-loading").textContent).toBe("false"));
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "password-seguro" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar sesión" }));
    await waitFor(() => expect(screen.getByTestId("authorized").textContent).toBe("true"));
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: "ana@ruum.mx", password: "password-seguro" });

    fireEvent.change(screen.getByLabelText("CLABE"), { target: { value: "002010000000000001" } });
    expect((screen.getByLabelText("Banco") as HTMLInputElement).value).toBe("Citibanamex");
    fireEvent.click(screen.getByRole("button", { name: "Guardar cuenta" }));
    expect(screen.getByRole("dialog", { name: "Actualizar cuenta para depósitos" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Guardar y enviar a revisión" }));

    await waitFor(() => expect(mocks.guardarDatosBancariosConductor).toHaveBeenCalledWith(expect.anything(), {
      titularCuenta: "Ana Conductora",
      banco: "Citibanamex",
      clabe: "002010000000000001",
      numeroTarjeta: null,
    }));
    expect(mocks.push).toHaveBeenCalledWith("/cuenta/certificacion");
  });

  it("rechaza autorización sin sesión y no persiste información bancaria", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    render(<PaginaDatosBancarios />);
    await waitFor(() => expect(screen.getByTestId("bank-loading").textContent).toBe("false"));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar sesión" }));

    expect(await screen.findByText("No pudimos confirmar tu sesión. Verifica tu contraseña.")).toBeTruthy();
    expect(screen.getByTestId("authorized").textContent).toBe("false");
    expect(mocks.guardarDatosBancariosConductor).not.toHaveBeenCalled();
  });
});
