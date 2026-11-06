// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ConductorDialog } from "../src/app/components/ConductorDialog";

const originalShow = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); }) });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.removeAttribute("open"); }) });
});
afterEach(() => {
  cleanup();
  for (const [key, descriptor] of [["showModal", originalShow], ["close", originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, key, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, key);
  }
});

it("abre con foco interior y devuelve el foco al disparador al cerrar", () => {
  const trigger = document.createElement("button");
  document.body.append(trigger);
  trigger.focus();
  const props = { open: true, onClose: vi.fn(), labelledBy: "title", children: <h2 id="title">Menú</h2> };
  const view = render(<ConductorDialog {...props} />);
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Cerrar diálogo" }));
  view.rerender(<ConductorDialog {...props} open={false} />);
  expect(document.activeElement).toBe(trigger);
  expect(HTMLDialogElement.prototype.close).toHaveBeenCalledOnce();
  trigger.remove();
});

it("Escape solicita cierre sin desincronizar el estado controlado", () => {
  const onClose = vi.fn();
  render(<ConductorDialog open onClose={onClose} labelledBy="title"><h2 id="title">Salud</h2></ConductorDialog>);
  const event = new Event("cancel", { cancelable: true });
  fireEvent(screen.getByRole("dialog"), event);
  expect(event.defaultPrevented).toBe(true);
  expect(onClose).toHaveBeenCalledOnce();
});

it("cambiar el callback con el diálogo abierto conserva el foco del formulario", () => {
  const view = render(<ConductorDialog open onClose={() => {}} labelledBy="title"><h2 id="title">Datos</h2><input aria-label="Nombre" /></ConductorDialog>);
  screen.getByRole("textbox").focus();
  view.rerender(<ConductorDialog open onClose={() => {}} labelledBy="title"><h2 id="title">Datos</h2><input aria-label="Nombre" /></ConductorDialog>);
  expect(document.activeElement).toBe(screen.getByRole("textbox"));
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce();
});
