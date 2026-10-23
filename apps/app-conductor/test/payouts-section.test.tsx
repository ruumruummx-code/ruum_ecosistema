// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@ruum/ui", () => ({ Card: ({ children }: { children: React.ReactNode }) => <article>{children}</article> }));
vi.mock("../src/app/ganancias/useEarningsLedger", () => ({
  formatearFecha: (value: string) => value || "—",
}));

import { EarningsPayoutsSection } from "../src/app/ganancias/EarningsPayoutsSection";

describe("flujo de consulta de depósitos SPEI", () => {
  afterEach(cleanup);
  it("presenta pago procesado, montos y referencia SPEI del periodo", () => {
    const estatusPayout = vi.fn(() => "pagado");
    render(<EarningsPayoutsSection
      estatusPayout={estatusPayout}
      payoutsFiltrados={[{
        id: "payout-1",
        periodo_inicio: "2026-10-01",
        periodo_fin: "2026-10-07",
        monto_bruto: 2500,
        ajustes: -100,
        monto_neto: 2400,
        estado: "procesado",
        referencia_pago: "SPEI-REF-123",
      }]}
    />);

    expect(screen.getByRole("heading", { name: "Depósitos del periodo" })).toBeTruthy();
    const article = screen.getByRole("article");
    expect(within(article).getByText("2026-10-01 ➔ 2026-10-07")).toBeTruthy();
    expect(within(article).getByText("pagado")).toBeTruthy();
    expect(within(article).getByText(/SPEI: SPEI-REF-123/)).toBeTruthy();
    expect(within(article).getByText("$2,400.00")).toBeTruthy();
    expect(estatusPayout).toHaveBeenCalled();
  });

  it("muestra una lista vacía sin inventar depósitos", () => {
    render(<EarningsPayoutsSection payoutsFiltrados={[]} estatusPayout={() => "—"} />);
    expect(screen.getByRole("heading", { name: "Depósitos del periodo" })).toBeTruthy();
    expect(screen.queryByRole("article")).toBeNull();
  });
});
