// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useConductorShellInsets } from "../src/app/components/useConductorShellInsets";

let sizes = { header: 81.2, nav: 75 };
let resize: () => void;
const disconnect = vi.fn();
function Shell({ enabled = true, desktop = false }: { enabled?: boolean; desktop?: boolean }) {
  const { headerRef, mobileNavRef } = useConductorShellInsets(enabled, enabled && !desktop);
  return enabled ? <><header ref={headerRef} /><div ref={mobileNavRef} /></> : null;
}
const value = (name: string) => document.documentElement.style.getPropertyValue(name);

beforeEach(() => {
  sizes = { header: 81.2, nav: 75 };
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resize = callback; }
    observe() {}
    disconnect = disconnect;
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    return { height: this.tagName === "HEADER" ? sizes.header : sizes.nav } as DOMRect;
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); disconnect.mockClear(); });

describe("safe areas del shell", () => {
  it("reserva toda la altura de barras que crecen por safe areas, texto o viaje activo", () => {
    render(<Shell />);
    expect(value("--conductor-shell-header-height")).toBe("82px");
    expect(value("--conductor-shell-bottom-height")).toBe("75px");
    sizes = { header: 176.5, nav: 194.3 };
    act(() => resize());
    expect(value("--conductor-shell-header-height")).toBe("177px");
    expect(value("--conductor-shell-bottom-height")).toBe("195px");
  });
  it("libera la reserva inferior al pasar a escritorio y limpia al entrar al login", () => {
    const view = render(<Shell />);
    sizes = { header: 150, nav: 0 };
    view.rerender(<Shell desktop />);
    expect(value("--conductor-shell-header-height")).toBe("150px");
    expect(value("--conductor-shell-bottom-height")).toBe("0px");
    view.rerender(<Shell enabled={false} />);
    expect(value("--conductor-shell-header-height")).toBe("");
    expect(value("--conductor-shell-bottom-height")).toBe("");
    expect(disconnect).toHaveBeenCalledTimes(2);
  });
  it("sigue las dimensiones al redimensionar si ResizeObserver no está disponible", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const view = render(<Shell />);
    sizes.nav = 108;
    act(() => window.dispatchEvent(new Event("resize")));
    expect(value("--conductor-shell-bottom-height")).toBe("108px");
    view.unmount();
    act(() => window.dispatchEvent(new Event("resize")));
    expect(value("--conductor-shell-bottom-height")).toBe("");
  });
});
