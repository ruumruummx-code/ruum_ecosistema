// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AcceptedTripCard } from "../src/app/viajes/AcceptedTripCard";
import { OfferPreviewCard } from "../src/app/viajes/OfferPreviewCard";
import { detalleFallback, type PasaporteRow } from "../src/app/viajes/trips-utils";

vi.mock("../src/app/viajes/OfferRoutePreview", () => ({ OfferRoutePreview: () => <div role="img" aria-label="Mapa de ruta" /> }));
afterEach(cleanup);
const trip = {
  traslado_id: "cdbb6c27-0000-4000-8000-000000000011", estado: "conductor_asignado",
  origen_direccion: "Londres 899, Ciudad de México", destino_direccion: "Los Serranos 225, Metepec",
  vehiculo_marca: "Chrysler", vehiculo_modelo: "Stratus", vehiculo_anio: 2015,
  ganancia_conductor: 531.45, distancia_km: 51, tiempo_estimado_horas: 70 / 60,
} as PasaporteRow;

describe("tarjeta compartida de aceptados", () => {
  it.each([
    ["conductor_asignado", "PENDIENTE DE INICIO", "INICIAR TRASLADO"],
    ["traslado_en_curso", "TRASLADO EN CURSO", "CONTINUAR TRASLADO"],
    ["servicio_cerrado", "TRASLADO FINALIZADO", "VER TRASLADO"],
  ] as const)("conserva el estado %s y la acción correspondiente", (estado, status, action) => {
    const viaje = { ...trip, estado };
    const onReject = vi.fn();
    const { container } = render(<AcceptedTripCard compact viaje={viaje} detalle={detalleFallback(viaje)} hrefDetalle="/viajes/traslado?volver=%2Fviajes" onReject={onReject} />);
    expect(screen.getByText(status)).toBeTruthy();
    expect(screen.getByText("$531.45")).toBeTruthy();
    expect(screen.getByText("Chrysler Stratus 2015")).toBeTruthy();
    expect(screen.getByText("Aprox. 1 h 10 min")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Mapa de ruta" })).toBeTruthy();
    expect(screen.getByRole("link", { name: action }).getAttribute("href")).toBe("/viajes/traslado?volver=%2Fviajes");
    expect(container.querySelector("[data-accepted-card]")).not.toBeNull();
    expect(container.querySelector("[data-offer-card]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Opciones de traslado" }));
    expect(onReject).toHaveBeenCalledWith(viaje);
  });

  it("conserva la variante y la acción original de ofertas", () => {
    render(<OfferPreviewCard viaje={trip} detalle={detalleFallback(trip)} hrefDetalle="/viajes/oferta" />);
    expect(screen.getByText("Oferta disponible")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Ver detalles de la oferta" }).getAttribute("href")).toBe("/viajes/oferta");
    expect(screen.queryByRole("button", { name: "Opciones de traslado" })).toBeNull();
  });
});
