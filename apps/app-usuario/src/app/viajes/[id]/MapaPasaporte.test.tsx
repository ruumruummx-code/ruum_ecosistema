/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MapaPasaporte } from "./MapaPasaporte";
const mocks = vi.hoisted(() => ({ setData: vi.fn(), remove: vi.fn(), resize: vi.fn(), marker: vi.fn() }));
vi.mock("mapbox-gl", () => ({ default: {
        Map: class {
            on(event: string, callback: () => void) { if (event === "load")
                queueMicrotask(callback); return this; }
            addSource() { }
            addLayer() { }
            fitBounds() { }
            getSource() { return { setData: mocks.setData }; }
            resize = mocks.resize;
            remove = mocks.remove;
        },
        Marker: class {
            setLngLat(point: number[]) { mocks.marker(point); return this; }
            addTo() { return this; }
        },
    } }));
const origin = { lat: 19.27, lng: -99.54 }, destination = { lat: 19.30, lng: -99.50 };
const geometry = { type: "LineString", coordinates: [[-99.54, 19.27], [-99.50, 19.30]] };
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", "pk.test"); vi.stubGlobal("ResizeObserver", class {
    observe() { }
    disconnect() { }
}); vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ routes: [{ geometry, duration: 1200, distance: 8400 }] }) })); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("Mapa del pasaporte", () => {
    it("mantiene un estado legible sin token", () => { vi.stubEnv("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", ""); render(<MapaPasaporte origen={origin} destino={destination} ubicacion={null} activo onEta={vi.fn()}/>); expect(screen.getByText(/El mapa no está disponible/)).toBeVisible(); expect(fetch).not.toHaveBeenCalled(); });
    it("dibuja el trazado asíncrono sin inventar una ETA antes de la salida", async () => { const eta = vi.fn(); render(<MapaPasaporte origen={origin} destino={destination} ubicacion={null} activo onEta={eta}/>); await waitFor(() => expect(mocks.setData).toHaveBeenCalledWith({ type: "Feature", properties: {}, geometry })); expect(eta).not.toHaveBeenCalledWith(20); });
    it("calcula ETA desde la ubicación actual y distingue el trayecto al origen", async () => {
        const eta = vi.fn();
        const distance = vi.fn();
        render(<MapaPasaporte origen={origin} destino={destination} ubicacion={{ lat: 19.28, lng: -99.53 } as never} activo haciaOrigen seguirUbicacion onEta={eta} onDistance={distance} compact/>);
        await waitFor(() => expect(eta).toHaveBeenCalledWith(20));
        expect(distance).toHaveBeenCalledWith(8.4);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining("-99.53,19.28;-99.54,19.27"), expect.anything());
        expect(mocks.marker).toHaveBeenCalledWith([-99.53, 19.28]);
    });
    it("cancela consultas pendientes y libera el mapa al salir", async () => {
        vi.mocked(fetch).mockImplementation(() => new Promise(() => { }));
        const { unmount } = render(<MapaPasaporte origen={origin} destino={destination} ubicacion={null} activo onEta={vi.fn()}/>);
        await waitFor(() => expect(fetch).toHaveBeenCalled());
        const signal = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).signal;
        unmount();
        expect(signal?.aborted).toBe(true);
        expect(mocks.remove).toHaveBeenCalled();
    });
    it("cumple con semántica accesible: role='region', tabIndex=0, nombre contextual y estado complementario", () => {
        const { unmount } = render(
            <MapaPasaporte
                origen={origin}
                destino={destination}
                ubicacion={{ lat: 19.28, lng: -99.53, registrado_en: new Date(Date.now() - 120000).toISOString() } as never}
                activo
                origenCiudad="Toluca"
                destinoCiudad="Santa Fe"
                estadoTexto="En camino al destino"
                actualizadoEn={new Date(Date.now() - 120000).toISOString()}
                onEta={vi.fn()}
            />
        );
        const region = screen.getByRole("region", { name: "Mapa de seguimiento en vivo del traslado de Toluca a Santa Fe" });
        expect(region).toBeInTheDocument();
        expect(region).toHaveAttribute("tabindex", "0");

        // Región de estado para lectores de pantalla
        const status = screen.getByRole("status");
        expect(status).toHaveAttribute("aria-live", "polite");
        expect(status.textContent).toContain("Estado: En camino al destino");
        expect(status.textContent).toContain("Última posición registrada del conductor: latitud 19.2800, longitud -99.5300");
        expect(status.textContent).toContain("Destino: latitud 19.3000, longitud -99.5000");
        expect(status.textContent).toContain("Actualizado hace 2 minutos");
        unmount();
    });
    it("permite sobreescribir la etiqueta accesible mediante etiquetaAccesible", () => {
        render(
            <MapaPasaporte
                origen={origin}
                destino={destination}
                ubicacion={null}
                activo
                etiquetaAccesible="Mapa del traslado de prueba personalizado"
                onEta={vi.fn()}
            />
        );
        expect(screen.getByRole("region", { name: "Mapa del traslado de prueba personalizado" })).toBeInTheDocument();
    });
});
