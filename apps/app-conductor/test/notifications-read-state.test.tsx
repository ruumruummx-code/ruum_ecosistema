// @vitest-environment jsdom
import React, { type ComponentProps } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ list: vi.fn(), mark: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/link", () => ({ default: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a> }));
vi.mock("@ruum/api/drivers", () => ({ listarNotificacionesConductor: mocks.list, marcarNotificacionLeida: mocks.mark }));
vi.mock("@/lib/supabase-browser", () => ({ crearClienteNavegador: () => ({}) }));
import Notifications from "../src/app/notificaciones/page";

const notice = { id: "notice-1", titulo: "Pago programado", cuerpo: "Consulta el detalle", destino: "/ganancias", leida_en: null, tipo: "pago", entidad_tipo: null, entidad_id: null, estado: "activa", creado_en: "2026-10-23T12:00:00Z" };
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function card() {
  return (await screen.findByRole("button", { name: /Pago programado/ })).closest("article")!;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.list.mockResolvedValue([{ ...notice }]);
  mocks.mark.mockResolvedValue(undefined);
});
afterEach(cleanup);

it("mantiene la lectura optimista visible en Sin leer y navega solo al confirmar", async () => {
  const save = deferred<void>();
  mocks.mark.mockReturnValue(save.promise);
  render(<Notifications />);
  const row = await card();
  fireEvent.click(screen.getByRole("button", { name: /Sin leer/ }));
  fireEvent.click(within(row).getByRole("button"));
  expect(within(row).getByRole("status").textContent).toBe("Leída · sincronizando…");
  expect(row.getAttribute("data-read")).toBe("true");
  expect(mocks.push).not.toHaveBeenCalled();
  await act(async () => { save.resolve(); await save.promise; });
  expect(mocks.push).toHaveBeenCalledWith("/ganancias");
  expect(mocks.mark).toHaveBeenCalledTimes(1);
});

it("revierte un fallo, anuncia el error y permite reintentar sin perder el destino", async () => {
  mocks.mark.mockRejectedValueOnce(new Error("sin conexión"));
  render(<Notifications />);
  const row = await card();
  fireEvent.click(within(row).getByRole("button"));
  expect(await within(row).findByRole("alert")).toBeTruthy();
  expect(row.getAttribute("data-read")).toBe("false");
  expect(within(row).getByRole("status").textContent).toBe("Sin leer");
  expect(mocks.push).not.toHaveBeenCalled();
  expect(within(row).getByRole("link", { name: "Abrir aviso sin actualizar lectura" }).getAttribute("href")).toBe("/ganancias");
  fireEvent.click(within(row).getByRole("button", { name: "Reintentar guardar lectura" }));
  await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/ganancias"));
  expect(mocks.mark).toHaveBeenCalledTimes(2);
});

it("una recarga iniciada antes del clic no deshace la lectura optimista", async () => {
  const refresh = deferred<typeof notice[]>();
  const save = deferred<void>();
  mocks.mark.mockReturnValue(save.promise);
  render(<Notifications />);
  const row = await card();
  mocks.list.mockReturnValueOnce(refresh.promise);
  act(() => window.dispatchEvent(new Event("ruum:notificaciones-actualizar")));
  fireEvent.click(within(row).getByRole("button"));
  await act(async () => { refresh.resolve([{ ...notice }]); await refresh.promise; });
  expect(row.getAttribute("data-read")).toBe("true");
  expect(within(row).getByRole("status").textContent).toBe("Leída · sincronizando…");
  await act(async () => { save.resolve(); await save.promise; });
  expect(mocks.push).toHaveBeenCalledTimes(1);
});

it("la respuesta pendiente no cambia la ruta si el usuario ya salió del centro", async () => {
  const save = deferred<void>();
  mocks.mark.mockReturnValue(save.promise);
  const view = render(<Notifications />);
  fireEvent.click(within(await card()).getByRole("button"));
  view.unmount();
  await act(async () => { save.resolve(); await save.promise; });
  expect(mocks.push).not.toHaveBeenCalled();
});

it("abrir una notificación ya leída no intenta guardar de nuevo", async () => {
  mocks.list.mockResolvedValue([{ ...notice, leida_en: "2026-10-23T12:01:00Z" }]);
  render(<Notifications />);
  const row = await card();
  expect(within(row).getByRole("status").textContent).toBe("Leída");
  fireEvent.click(within(row).getByRole("button"));
  expect(mocks.mark).not.toHaveBeenCalled();
  expect(mocks.push).toHaveBeenCalledWith("/ganancias");
});
