// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { PWABootstrap } from "../src/app/PWABootstrap";

const UN_DIA_MS = 24 * 60 * 60 * 1000;

describe("PWABootstrap", () => {
  let register: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal("location", { ...window.location, hostname: "conductor.ruum.mx" });
    update = vi.fn();
    register = vi.fn().mockResolvedValue({ scope: "/", update, installing: null });
    Object.defineProperty(window.navigator, "serviceWorker", {
      configurable: true,
      value: { register }
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    delete (window.navigator as { serviceWorker?: unknown }).serviceWorker;
  });

  test("revisa actualizaciones cada 24 horas mientras está montado", async () => {
    render(<PWABootstrap />);
    await vi.advanceTimersByTimeAsync(0);
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" });

    await vi.advanceTimersByTimeAsync(UN_DIA_MS);
    expect(update).toHaveBeenCalledTimes(1);
  });

  test("detiene el intervalo al desmontar", async () => {
    const { unmount } = render(<PWABootstrap />);
    await vi.advanceTimersByTimeAsync(0);
    unmount();

    await vi.advanceTimersByTimeAsync(UN_DIA_MS * 3);
    expect(update).not.toHaveBeenCalled();
  });

  test("no crea el intervalo si se desmonta antes de terminar el registro", async () => {
    const { unmount } = render(<PWABootstrap />);
    unmount();
    await vi.advanceTimersByTimeAsync(UN_DIA_MS * 3);
    expect(update).not.toHaveBeenCalled();
  });
});
