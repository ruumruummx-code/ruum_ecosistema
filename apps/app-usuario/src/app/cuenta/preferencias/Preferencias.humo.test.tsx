/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Preferencias } from "../Preferencias";
import { CuentaCliente } from "../CuentaCliente";
import type { Database } from "@ruum/shared/types";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

vi.mock("@/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => false,
  crearClienteNavegador: () => ({}),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const mockUsuario = {
  id: "user-humo-1",
  nombre: "Humo QA",
  notificaciones_push: true,
  notificaciones_email: true,
  notificaciones_sms_whatsapp: true,
  notificaciones_promocionales: false,
  alertas_viaje: true,
  alertas_evidencia: true,
  alertas_pago: true,
} as unknown as Usuario;

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-a11y-font");
  document.documentElement.removeAttribute("data-a11y-contrast");
  document.documentElement.removeAttribute("data-units");
  document.documentElement.removeAttribute("lang");
  document.documentElement.style.fontSize = "";
});

describe("Humo ticket: Cuenta sin Notificaciones + Preferencias centralizado", () => {
  it("Cuenta no expone sección de Notificaciones pero enlaza a Preferencias", async () => {
    const user = userEvent.setup();
    render(
      <CuentaCliente usuario={mockUsuario} totalVehiculos={0} totalTraslados={0} />
    );
    expect(screen.queryByRole("button", { name: /^notificaciones$/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Perfil/ }));
    expect(screen.getByText("Preferencias").closest("a")).toHaveAttribute(
      "href",
      "/cuenta/preferencias"
    );
  });

  it("Alertas de traslado (viaje/evidencia/pago/incidentes) alternan y persisten", async () => {
    const user = userEvent.setup();
    render(<Preferencias usuario={mockUsuario} />);
    for (const nombre of ["Estado del traslado", "Evidencia disponible", "Alertas de pago", "Incidentes"]) {
      const sw = screen.getByRole("switch", { name: nombre });
      expect(sw).toHaveAttribute("aria-checked", "true");
      await user.click(sw);
      expect(sw).toHaveAttribute("aria-checked", "false");
    }
    expect(await screen.findByText("Alertas de incidentes desactivadas")).toBeInTheDocument();
  });

  it("Idioma aplica lang en documento y persiste", async () => {
    const user = userEvent.setup();
    render(<Preferencias usuario={mockUsuario} />);
    await user.click(screen.getByRole("radio", { name: /english \(us\)/i }));
    expect(document.documentElement.getAttribute("lang")).toBe("en");
    expect(window.localStorage.getItem("ruum:pref:idioma")).toBe('"en"');
    await user.click(screen.getByRole("radio", { name: /español \(méxico\)/i }));
    expect(document.documentElement.getAttribute("lang")).toBe("es");
  });

  it("Unidades persisten y emiten evento para rastreo", async () => {
    const user = userEvent.setup();
    const eventos: string[] = [];
    const handler = (e: Event) => eventos.push((e as CustomEvent).detail.unidades);
    window.addEventListener("ruum:unidades-actualizadas", handler);
    render(<Preferencias usuario={mockUsuario} />);
    await user.click(screen.getByRole("button", { name: /unidades de medida/i }));
    await user.click(screen.getByRole("radio", { name: /imperial/i }));
    await user.click(screen.getByRole("button", { name: /aplicar/i }));
    expect(document.documentElement.getAttribute("data-units")).toBe("imperial");
    expect(window.localStorage.getItem("ruum:pref:unidades")).toBe('"Imperial"');
    expect(eventos).toContain("Imperial");
    window.removeEventListener("ruum:unidades-actualizadas", handler);
  });

  it("Accesibilidad: Estándar / Texto grande / Alto contraste sin romper layout", async () => {
    const user = userEvent.setup();
    render(<Preferencias usuario={mockUsuario} />);
    const boton = screen.getByRole("button", { name: /^accesibilidad/i });
    await user.click(boton);
    await user.click(screen.getByRole("radio", { name: /texto grande/i }));
    await user.click(screen.getByRole("button", { name: /aplicar/i }));
    expect(document.documentElement.getAttribute("data-a11y-font")).toBe("large");
    expect(document.documentElement.style.fontSize).toBe("18px");

    await user.click(screen.getByRole("button", { name: /^accesibilidad/i }));
    await user.click(screen.getByRole("radio", { name: /alto contraste/i }));
    await user.click(screen.getByRole("button", { name: /aplicar/i }));
    expect(document.documentElement.getAttribute("data-a11y-contrast")).toBe("high");

    await user.click(screen.getByRole("button", { name: /^accesibilidad/i }));
    await user.click(screen.getByRole("radio", { name: /^estándar/i }));
    await user.click(screen.getByRole("button", { name: /aplicar/i }));
    expect(document.documentElement.hasAttribute("data-a11y-font")).toBe(false);
    expect(document.documentElement.hasAttribute("data-a11y-contrast")).toBe(false);
  });

  it("Privacidad: biométrico, ubicación y uso de datos persisten", async () => {
    const user = userEvent.setup();
    render(<Preferencias usuario={mockUsuario} />);
    const bio = screen.getByRole("switch", { name: /biométrico/i });
    await user.click(bio);
    expect(bio).toHaveAttribute("aria-checked", "false");
    expect(window.localStorage.getItem("ruum:pref:biometrico")).toBe("false");

    const ubi = screen.getByRole("switch", { name: /ubicación en tiempo real/i });
    await user.click(ubi);
    expect(ubi).toHaveAttribute("aria-checked", "false");
    expect(window.localStorage.getItem("ruum:pref:ubicacion")).toBe("false");

    await user.click(screen.getByRole("button", { name: /uso de datos/i }));
    await user.click(screen.getByRole("radio", { name: /desactivado/i }));
    await user.click(screen.getByRole("button", { name: /aplicar/i }));
    expect(window.localStorage.getItem("ruum:telemetria-desactivada")).toBe("true");
  });
});
