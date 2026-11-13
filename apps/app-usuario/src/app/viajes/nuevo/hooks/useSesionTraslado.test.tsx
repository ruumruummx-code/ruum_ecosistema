/** @vitest-environment jsdom */
import { afterEach, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSesionTraslado } from "./useSesionTraslado";

vi.mock("@/lib/supabase-browser", () => ({ tieneSupabaseConfigurado: () => true, crearClienteNavegador: () => ({}) }));
vi.mock("@ruum/api/services", () => ({ obtenerUsuarioActual: async () => null, listarVehiculosDeUsuario: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ registrarEventoUx: vi.fn() }));
afterEach(() => window.history.replaceState(null, "", "/"));
it("conserva vehículo y dirección cuando la sesión expira al cargar el cotizador", async () => {
  const ruta = "/viajes/nuevo?vehiculo=auto-1&buscar_destino=Toluca#ruta";
  window.history.replaceState(null, "", ruta);
  const replace = vi.fn();
  renderHook(() => useSesionTraslado({ router: { replace }, setBloqueoVerificacion: vi.fn(), setCargandoSesion: vi.fn(), setResultado: vi.fn(), setSesionReal: vi.fn(), setUsuario: vi.fn(), setVehiculosGuardados: vi.fn() }));
  await waitFor(() => expect(replace).toHaveBeenCalled());
  expect(new URL(replace.mock.calls[0]![0], window.location.origin).searchParams.get("next")).toBe(ruta);
});
