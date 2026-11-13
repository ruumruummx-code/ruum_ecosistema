/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingUsuario from "./page";

describe("OnboardingUsuario", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("muestra el primer paso con progreso accesible", () => {
    render(<OnboardingUsuario />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/no viaja a ciegas/i);
    const progreso = screen.getByRole("progressbar", { name: /progreso del recorrido/i });
    expect(progreso).toHaveAttribute("aria-valuenow", "1");
    expect(progreso).toHaveAttribute("aria-valuemax", "3");
  });

  it("avanza pasos y marca visto al terminar u omitir", async () => {
    const user = userEvent.setup();
    render(<OnboardingUsuario />);

    await user.click(screen.getByRole("button", { name: /continuar/i }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "2");

    await user.click(screen.getByRole("button", { name: /continuar/i }));
    expect(screen.getByRole("link", { name: /crear cuenta y cotizar/i })).toHaveAttribute(
      "href",
      "/registro"
    );

    await user.click(screen.getByRole("link", { name: /crear cuenta y cotizar/i }));
    expect(window.localStorage.getItem("ruum-onboarding-visto")).toBe("1");
  });

  it("omitir marca visto sin completar", async () => {
    const user = userEvent.setup();
    render(<OnboardingUsuario />);
    await user.click(screen.getByRole("link", { name: /omitir/i }));
    expect(window.localStorage.getItem("ruum-onboarding-visto")).toBe("1");
  });
});
