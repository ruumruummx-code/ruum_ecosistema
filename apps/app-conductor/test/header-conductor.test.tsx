// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NavegacionConductor } from "../src/app/NavegacionConductor";
import { DriverAccountView } from "../src/app/cuenta/DriverAccountView";

const route = vi.hoisted(() => ({ pathname: "/viajes" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("../src/app/ViajeActivoContext", () => ({
  useViajeActivo: () => ({ viajeActivo: null, viajeActivoSinActualizar: false }),
}));

afterEach(cleanup);

describe("navegación del conductor sin header global", () => {
  it("omite también el aviso de acción requerida dentro de Cuenta", () => {
    HTMLDialogElement.prototype.close = vi.fn();
    render(<DriverAccountView initials="AL" unread={0} loading={false}
      sync={{ status: "accion_requerida", message: "Acción requerida para continuar sincronización.", pendingEvidence: 1, pendingTelemetry: 0, updatedAt: new Date().toISOString() }}
      loggingOut={false} logoutError={null} onLogout={() => {}} onOpenLogout={() => {}} />);
    expect(screen.queryByText("Acción requerida para continuar sincronización.")).toBeNull();
    expect(screen.queryByRole("link", { name: "Entrar" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Cuenta" })).toBeTruthy();
  });

  it.each(["/viajes", "/cuenta", "/cuenta/perfil", "/ganancias", "/notificaciones"])(
    "presenta solo tres destinos y ningún banner en %s", (pathname) => {
      route.pathname = pathname;
      render(<NavegacionConductor />);
      const nav = screen.getByRole("navigation", { name: "Navegación principal móvil" });
      const links = within(nav).getAllByRole("link");
      expect(links.map(link => link.textContent)).toEqual(["Inicio", "Traslados", "Cuenta"]);
      expect(links.map(link => link.getAttribute("href"))).toEqual(["/panel", "/viajes", "/cuenta"]);
      expect(screen.queryByRole("banner")).toBeNull();
      expect(document.documentElement.style.getPropertyValue("--conductor-shell-header-height")).toBe("0px");
      const current = links.filter(link => link.getAttribute("aria-current") === "page");
      expect(current.map(link => link.textContent)).toEqual(
        pathname.startsWith("/cuenta") ? ["Cuenta"] : pathname === "/viajes" ? ["Traslados"] : [],
      );
    },
  );

  it.each(["/panel", "/login", "/registro", "/onboarding"])(
    "no duplica la navegación del panel ni la muestra en acceso: %s", (pathname) => {
      route.pathname = pathname;
      render(<NavegacionConductor />);
      expect(screen.queryByRole("navigation")).toBeNull();
      expect(screen.queryByRole("banner")).toBeNull();
    },
  );
});
