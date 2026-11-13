/** @vitest-environment jsdom */
import { beforeEach, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { PreferenciasAplicacion } from "./PreferenciasAplicacion";
const { obtener, auth, unsubscribe } = vi.hoisted(() => ({ obtener: vi.fn(), auth: vi.fn(), unsubscribe: vi.fn() }));
vi.mock("@ruum/api/services", () => ({ obtenerPreferenciasUsuarioActual: obtener }));
vi.mock("../lib/supabase-browser", () => ({ tieneSupabaseConfigurado: () => true, crearClienteNavegador: () => ({ auth: { onAuthStateChange: auth } }) }));
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  auth.mockImplementation(callback => { callback("INITIAL_SESSION", { user: { id: "auth-1" } }); return { data: { subscription: { unsubscribe } } }; });
});
it("restaura unidades y contraste fuera de la pantalla de preferencias", async () => {
  obtener.mockResolvedValue({ id: "perfil-1", preferencias: { unidades: "Imperial", accesibilidad: "Alto contraste" } });
  const { unmount } = render(<PreferenciasAplicacion />);
  await waitFor(() => expect(document.documentElement).toHaveAttribute("data-units", "imperial"));
  expect(document.documentElement).toHaveAttribute("data-a11y-contrast", "high");
  unmount();
  expect(unsubscribe).toHaveBeenCalledOnce();
});
it("da prioridad a los cambios pendientes de la cuenta", async () => {
  localStorage.setItem("ruum:preferencias-pendientes:perfil-1", JSON.stringify({ general: { unidades: "Imperial" }, notificacion: {} }));
  obtener.mockResolvedValue({ id: "perfil-1", preferencias: { unidades: "Métrico" } });
  render(<PreferenciasAplicacion />);
  await waitFor(() => expect(document.documentElement).toHaveAttribute("data-units", "imperial"));
});
it("descarta respuestas tardías cuando cambia la cuenta", async () => {
  let resolver!: (usuario: unknown) => void;
  obtener.mockReturnValueOnce(new Promise(resolve => { resolver = resolve; }));
  render(<PreferenciasAplicacion />);
  await waitFor(() => expect(obtener).toHaveBeenCalledOnce());
  auth.mock.calls[0]![0]("SIGNED_OUT", null);
  resolver({ id: "perfil-1", preferencias: { unidades: "Imperial", accesibilidad: "Alto contraste" } });
  await Promise.resolve();
  expect(document.documentElement).toHaveAttribute("data-units", "metric");
  expect(document.documentElement).not.toHaveAttribute("data-a11y-contrast");
});
