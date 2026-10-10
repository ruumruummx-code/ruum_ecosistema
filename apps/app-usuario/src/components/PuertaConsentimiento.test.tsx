/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  pathname: "/cuenta",
  sesion: true as boolean,
  versionTerminos: null as number | null,
  registrar: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("@ruum/api/services", () => ({
  obtenerUsuarioActual: vi.fn(async () => ({ version_terminos_aceptada: mocks.versionTerminos })),
  registrarConsentimientoUsuario: mocks.registrar,
}));

vi.mock("../lib/supabase-browser", () => ({
  crearClienteNavegador: vi.fn(() => ({
    auth: { getSession: vi.fn(async () => ({ data: { session: mocks.sesion ? { user: { id: "u1" } } : null } })) },
  })),
}));

import { PuertaConsentimiento } from "./PuertaConsentimiento";

/** M3: el muro PR-07 debe activarse globalmente, no solo existir en su test. */
describe("PuertaConsentimiento", () => {
  beforeEach(() => {
    mocks.pathname = "/cuenta";
    mocks.sesion = true;
    mocks.versionTerminos = null;
    mocks.registrar.mockReset().mockResolvedValue({ version: 1, aceptado_en: "2026-01-01" });
  });

  it("muestra el muro con sesion y sin consentimiento", async () => {
    render(<PuertaConsentimiento />);
    // Timeout amplio: el muro monta tras 2 saltos async y showModal corre en
    // efecto pasivo; bajo carga de la suite completa 1s no alcanza.
    expect(await screen.findByRole("dialog", undefined, { timeout: 5000 })).toBeInTheDocument();
  });

  it("no muestra nada sin sesion", async () => {
    mocks.sesion = false;
    render(<PuertaConsentimiento />);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("no muestra nada si ya hay version aceptada", async () => {
    mocks.versionTerminos = 1;
    render(<PuertaConsentimiento />);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("no se interpone en flujos de autenticacion", async () => {
    mocks.pathname = "/login";
    render(<PuertaConsentimiento />);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("cierra el muro al aceptar", async () => {
    const user = userEvent.setup();
    render(<PuertaConsentimiento />);
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /aceptar y continuar/i }));
    await waitFor(() => expect(mocks.registrar).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
