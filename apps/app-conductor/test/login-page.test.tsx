// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  signInWithPassword: vi.fn(),
  tieneSupabaseConfigurado: vi.fn(() => true),
  onboardingVisto: vi.fn(() => Promise.resolve(true)),
  next: "/viajes",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => ({ get: (key: string) => key === "next" ? mocks.next : null }),
}));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a> }));
vi.mock("next/image", () => ({ default: (props: { alt: string; src: string }) => <img alt={props.alt} src={props.src} /> }));
vi.mock("@ruum/ui", () => ({
  Button: ({ children, loading, type = "button", disabled, ...props }: {
    children: ReactNode; loading?: boolean; type?: "button" | "submit"; disabled?: boolean; className?: string;
  }) => <button type={type} disabled={disabled} {...props}>{loading ? "Cargando" : children}</button>,
}));
vi.mock("@ruum/shared/utils", () => ({
  traducirErrorAuth: () => "No pudimos iniciar sesión.",
  validarDestinoSeguro: (value: string | null, fallback: string) => value?.startsWith("/") && !value.startsWith("//") ? value : fallback,
}));
vi.mock("../src/lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({ auth: { signInWithPassword: mocks.signInWithPassword } }),
  tieneSupabaseConfigurado: mocks.tieneSupabaseConfigurado,
}));
vi.mock("../src/lib/onboarding-visto", () => ({ onboardingVisto: mocks.onboardingVisto }));

import PaginaLogin from "../src/app/login/page";

describe("flujo unitario de login", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.next = "/viajes";
    mocks.tieneSupabaseConfigurado.mockReturnValue(true);
    mocks.onboardingVisto.mockResolvedValue(true);
    mocks.signInWithPassword.mockResolvedValue({ error: null });
  });

  it("valida credenciales antes de llamar Auth", async () => {
    render(<PaginaLogin />);
    await screen.findByRole("heading", { name: "Iniciar sesión" });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "correo-invalido" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Formato de correo inválido")).toBeTruthy();
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("autentica y respeta el destino interno después del login", async () => {
    render(<PaginaLogin />);
    await screen.findByRole("heading", { name: "Iniciar sesión" });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "chofer@ruum.mx" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "secreto" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email: "chofer@ruum.mx", password: "secreto" }));
    expect(mocks.replace).toHaveBeenCalledWith("/viajes");
  });

  it("usa /panel si el parámetro next intenta salir del sitio y muestra error Auth", async () => {
    mocks.next = "//attacker.example";
    mocks.signInWithPassword.mockResolvedValue({ error: new Error("invalid credentials") });
    render(<PaginaLogin />);
    await screen.findByRole("heading", { name: "Iniciar sesión" });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "chofer@ruum.mx" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "incorrecta" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("No pudimos iniciar sesión.")).toBeTruthy();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
