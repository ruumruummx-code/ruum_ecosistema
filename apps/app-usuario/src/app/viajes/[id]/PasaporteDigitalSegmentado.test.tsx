/** @vitest-environment jsdom */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasaporteDigitalSegmentado, type PasaporteDigitalSegmentadoProps } from "./PasaporteDigitalSegmentado";
const { vivo, refresh } = vi.hoisted(() => ({ vivo: { estadoRealtime: null as string | null, estadoActualizadoEn: null as string | null }, refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("../../../state/AppStateProvider", () => ({ useTrasladoRealtime: () => vivo }));
vi.mock("./ChatTraslado", () => ({ ChatTraslado: ({ estado }: { estado: string }) => <div role="log" data-estado={estado}>Mensajes del chat</div> }));
vi.mock("./SeguimientoTrasladoTiempoReal", () => ({ SeguimientoTrasladoTiempoReal: ({ activo }: {
        activo: boolean;
    }) => <div data-testid="map" data-active={activo}>Mapa en vivo</div> }));
vi.mock("./CompartirPasaporte", () => ({ CompartirPasaporte: () => <button>Compartir</button> }));
vi.mock("next/dynamic", () => ({ default: () => ({ seccion, pasaporte }: {
        seccion: string;
        pasaporte: { estado: string };
    }) => <div data-testid="detalle" data-estado={pasaporte.estado}>Detalle {seccion}</div> }));
beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
const props: PasaporteDigitalSegmentadoProps = {
    pasaporte: { traslado_id: "c784-test", estado: "traslado_en_curso", vehiculo_marca: "Ford", vehiculo_modelo: "Courier", vehiculo_anio: 2004, vehiculo_placas: "PEM345", origen_ciudad: "San Mateo Atenco", destino_ciudad: "Lerma" } as PasaporteDigitalSegmentadoProps["pasaporte"],
    traslado: null, vehiculo: null, conductor: null, evidencia: [], incidencias: [], disputas: [], reclamosSeguro: [], calificacion: null, pagos: [], ultimaUbicacion: null,
};
afterEach(() => window.history.replaceState(null, "", "/"));
beforeEach(() => { vivo.estadoRealtime = null; vivo.estadoActualizadoEn = null; refresh.mockClear(); });
describe("Pasaporte dashboard", () => {
    it("comparte el estado en vivo con chat y detalles y actualiza los datos relacionados", async () => {
        const { rerender } = render(<PasaporteDigitalSegmentado {...props}/>);
        vivo.estadoRealtime = "servicio_cerrado";
        vivo.estadoActualizadoEn = "2026-10-27T12:00:00Z";
        rerender(<PasaporteDigitalSegmentado {...props}/>);
        await userEvent.click(screen.getByRole("tab", { name: "Chat" }));
        expect(screen.getByRole("log")).toHaveAttribute("data-estado", "servicio_cerrado");
        await userEvent.click(screen.getByRole("tab", { name: "En Ruta" }));
        await userEvent.click(screen.getByRole("button", { name: "Datos y recibo" }));
        expect(screen.getByTestId("detalle")).toHaveAttribute("data-estado", "servicio_cerrado");
        await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    });
    it("refresca al recuperar conectividad y elimina listeners al salir", () => {
        const { unmount } = render(<PasaporteDigitalSegmentado {...props}/>);
        window.dispatchEvent(new Event("online"));
        expect(refresh).toHaveBeenCalledOnce();
        unmount();
        window.dispatchEvent(new Event("online"));
        expect(refresh).toHaveBeenCalledOnce();
    });
    it("abre Chat al llegar desde el enlace de soporte", () => {
        window.history.replaceState(null, "", "/viajes/c784-test#chat-conductor");
        render(<PasaporteDigitalSegmentado {...props}/>);
        expect(screen.getByRole("tab", { name: "Chat" })).toHaveAttribute("aria-selected", "true");
        expect(screen.getByRole("log")).toBeVisible();
        expect(screen.getByTestId("map")).toHaveAttribute("data-active", "false");
    });
    it("responde a enlaces y navegación del fragmento con la pantalla ya abierta", () => {
        const { unmount } = render(<PasaporteDigitalSegmentado {...props}/>);
        act(() => {
            window.history.replaceState(null, "", "/viajes/c784-test#chat-conductor");
            window.dispatchEvent(new HashChangeEvent("hashchange"));
        });
        expect(screen.getByRole("log")).toBeVisible();
        act(() => {
            window.history.replaceState(null, "", "/viajes/c784-test#en-ruta");
            window.dispatchEvent(new HashChangeEvent("hashchange"));
        });
        expect(screen.getByRole("tabpanel")).toHaveAccessibleName("En Ruta");
        unmount();
    });
    it("ajusta el lienzo al teclado y restaura el bloqueo de fondo al salir", () => {
        const viewport = Object.assign(new EventTarget(), { height: window.innerHeight, offsetTop: 0 });
        vi.stubGlobal("visualViewport", viewport);
        const previousOverflow = document.body.style.overflow;
        const { unmount } = render(<PasaporteDigitalSegmentado {...props}/>);
        const root = screen.getByRole("heading").parentElement!.parentElement!;
        act(() => { viewport.height = 320; viewport.dispatchEvent(new Event("resize")); });
        expect(root.style.height).toBe("320px");
        expect(root.dataset.keyboard).toBe("true");
        unmount();
        expect(document.body.style.overflow).toBe(previousOverflow);
        vi.unstubAllGlobals();
    });
    it("muestra tres pestañas exclusivas y el resumen persistente", () => {
        render(<PasaporteDigitalSegmentado {...props}/>);
        expect(screen.getAllByRole("tab")).toHaveLength(3);
        expect(screen.getByRole("heading", { name: "Pasaporte #RR-C784" })).toBeInTheDocument();
        expect(screen.getByText("Ford Courier 2004 · PEM345")).toBeInTheDocument();
        expect(screen.queryByRole("log")).not.toBeInTheDocument();
        expect(screen.getByRole("tabpanel")).toHaveAccessibleName("En Ruta");
    });
    it("conserva el mapa montado y el footer al alternar fotos y chat", async () => {
        const user = userEvent.setup();
        render(<PasaporteDigitalSegmentado {...props}/>);
        const map = screen.getByTestId("map"), footer = screen.getByRole("contentinfo");
        await user.click(screen.getByRole("tab", { name: "Fotos" }));
        expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Fotos");
        expect(map).toHaveAttribute("data-active", "false");
        expect(map).not.toBeVisible();
        await user.click(screen.getByRole("tab", { name: "Chat" }));
        expect(screen.getByRole("log")).toBeVisible();
        expect(screen.getByRole("contentinfo")).toBe(footer);
        await user.click(screen.getByRole("tab", { name: "En Ruta" }));
        expect(screen.getByTestId("map")).toBe(map);
        expect(map).toBeVisible();
    });
    it("abre los datos en una capa modal y restaura el lienzo al cerrar", async () => {
        const user = userEvent.setup();
        render(<PasaporteDigitalSegmentado {...props}/>);
        await user.click(screen.getByRole("button", { name: "Datos y recibo" }));
        expect(screen.getByRole("dialog", { name: "Detalles del traslado" })).toBeVisible();
        expect(document.body.style.overflow).toBe("hidden");
        await user.click(screen.getByRole("button", { name: "Recibo" }));
        expect(screen.getByText("Detalle recibo")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /Cerrar/ }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByRole("tabpanel")).toHaveAccessibleName("En Ruta");
    });
    it("permite navegación de pestañas con teclado", async () => {
        const user = userEvent.setup();
        render(<PasaporteDigitalSegmentado {...props}/>);
        screen.getByRole("tab", { name: "En Ruta" }).focus();
        await user.keyboard("{ArrowRight}");
        expect(screen.getByRole("tab", { name: "Fotos" })).toHaveFocus();
        expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Fotos");
    });
});
