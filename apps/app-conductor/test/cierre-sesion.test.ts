// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useCerrarSesion } from "../src/lib/use-cerrar-sesion";

const { signOut, getSession, limpiarCache, replace, refresh } = vi.hoisted(() => ({
  signOut: vi.fn(), getSession: vi.fn(), limpiarCache: vi.fn(), replace: vi.fn(), refresh: vi.fn()
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock("../src/lib/background-tracking", () => ({ soportaTrackingNativo: () => false }));
vi.mock("../src/lib/push-notifications", () => ({ desactivarPushDelDispositivo: vi.fn() }));
vi.mock("../src/lib/offline-active-trip-cache", () => ({ limpiarCacheViajeActivo: limpiarCache }));
vi.mock("../src/lib/supabase-browser", () => ({
  tieneSupabaseConfigurado: () => true,
  crearClienteNavegador: () => ({
    auth: { signOut, getSession, getUser: async () => ({ data: { user: { id: "conductor" } } }) }
  })
}));
vi.mock("../src/lib/cola-offline", () => ({ contarColaEvidencia: () => 0, limpiarColaEvidencia: vi.fn() }));
vi.mock("../src/lib/cola-telemetria-offline", () => ({ contarColaTelemetria: () => 0, limpiarColaTelemetria: vi.fn() }));
vi.mock("../src/lib/observability", () => ({ recordOperationalEvent: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test("si signOut devuelve un error y la sesión sigue activa, no limpia ni navega", async () => {
  signOut.mockResolvedValue({ error: new Error("red interrumpida") });
  getSession.mockResolvedValue({ data: { session: {} }, error: null });
  const { result } = renderHook(useCerrarSesion);

  await act(async () => {
    await expect(result.current.cerrarSesion()).resolves.toMatchObject({ ok: false, authSignedOut: false });
  });
  expect(result.current.errorCerrarSesion).toContain("Intenta nuevamente");
  expect(limpiarCache).not.toHaveBeenCalled();
  expect(replace).not.toHaveBeenCalled();
});

test("un cierre confirmado completa la limpieza y vuelve a onboarding", async () => {
  signOut.mockResolvedValue({ error: null });
  const { result } = renderHook(useCerrarSesion);
  await act(async () => {
    await expect(result.current.cerrarSesion()).resolves.toMatchObject({ ok: true, authSignedOut: true });
  });
  expect(limpiarCache).toHaveBeenCalledOnce();
  expect(replace).toHaveBeenCalledWith("/onboarding");
});

test("un error devuelto sigue siendo visible aunque la sesión local ya se haya cerrado", async () => {
  signOut.mockResolvedValue({ error: new Error("no se pudo completar el cierre remoto") });
  getSession.mockResolvedValue({ data: { session: null }, error: null });
  const { result } = renderHook(useCerrarSesion);

  await act(async () => {
    await expect(result.current.cerrarSesion()).resolves.toMatchObject({ ok: false, authSignedOut: true });
  });
  expect(result.current.errorCerrarSesion).toContain("parcialmente");
  expect(limpiarCache).toHaveBeenCalledOnce();
  expect(replace).not.toHaveBeenCalled();
});
