// @vitest-environment jsdom
import { useRef } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { useVisibleViewport } from "../src/app/components/useVisibleViewport";

function Frame() {
  const frame = useRef<HTMLDivElement>(null);
  useVisibleViewport(frame);
  return <div ref={frame} />;
}
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("actualiza el área útil con teclado simulado y libera sus listeners", () => {
  const viewport = Object.assign(new EventTarget(), { offsetTop: 0, height: 568 });
  vi.stubGlobal("visualViewport", viewport);
  vi.stubGlobal("innerHeight", 568);
  const view = render(<Frame />);
  const frame = view.container.firstElementChild as HTMLElement;
  expect(frame.style.getPropertyValue("--conductor-visible-height")).toBe("568px");
  viewport.height = 320;
  viewport.offsetTop = 12;
  viewport.dispatchEvent(new Event("resize"));
  expect(frame.style.getPropertyValue("--conductor-visible-top")).toBe("12px");
  expect(frame.style.getPropertyValue("--conductor-visible-height")).toBe("320px");
  expect(frame.style.getPropertyValue("--conductor-visible-bottom")).toBe("236px");
  view.unmount();
  viewport.height = 568;
  viewport.dispatchEvent(new Event("resize"));
  expect(frame.style.getPropertyValue("--conductor-visible-height")).toBe("320px");
});
