/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { UserDashboardLayout } from "./UserDashboardLayout";

let mockPathname = "/";
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

describe("UserDashboardLayout — Layout Compartido Global (RR-UI-001)", () => {
  beforeEach(() => {
    mockPathname = "/";
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renderiza UserSidebar, UserHeader y el contenido principal (children)", () => {
    render(
      <UserDashboardLayout
        nombre="Hector Manuel"
        rol="Usuario"
        idContenido="mi-contenido-test"
      >
        <div data-testid="child-content">Contenido de la página</div>
      </UserDashboardLayout>
    );

    // Sidebar presente
    expect(screen.getByLabelText("Menú principal de escritorio")).toBeInTheDocument();

    // Header presente
    expect(screen.getByLabelText("Barra superior de usuario")).toBeInTheDocument();
    expect(screen.getByText("Hola, Hector")).toBeInTheDocument();

    // Main / Contenido
    const main = screen.getByRole("main", { name: "Contenido principal" });
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute("id", "mi-contenido-test");
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("coordina la apertura y cierre del drawer móvil entre Header y Sidebar", () => {
    render(
      <UserDashboardLayout nombre="Hector Manuel">
        <div>Contenido</div>
      </UserDashboardLayout>
    );

    // El drawer móvil se abre mediante el botón hamburguesa del Header
    const botonHamburguesa = screen.getByRole("button", { name: "Abrir menú de navegación" });
    fireEvent.click(botonHamburguesa);

    // Al abrirse, el drawer tiene aria-modal="true" y rol dialog
    const drawer = screen.getByRole("dialog");
    expect(drawer).toHaveAttribute("aria-modal", "true");

    // Botón de cierre en el sidebar
    const botonCerrar = screen.getByRole("button", { name: "Cerrar menú de navegación" });
    fireEvent.click(botonCerrar);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("permite colapsar el sidebar y persiste la preferencia en localStorage", () => {
    render(
      <UserDashboardLayout nombre="Hector Manuel">
        <div>Contenido</div>
      </UserDashboardLayout>
    );

    const botonColapsar = screen.getByRole("button", { name: "Colapsar menú lateral" });
    fireEvent.click(botonColapsar);

    expect(localStorage.getItem("ruum-usuario-sidebar-colapsada")).toBe("1");
    expect(screen.getByRole("button", { name: "Expandir menú lateral" })).toBeInTheDocument();

    // Al hacer click de nuevo se expande y se guarda "0"
    const botonExpandir = screen.getByRole("button", { name: "Expandir menú lateral" });
    fireEvent.click(botonExpandir);
    expect(localStorage.getItem("ruum-usuario-sidebar-colapsada")).toBe("0");
  });
});
