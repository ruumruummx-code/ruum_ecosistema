/** @vitest-environment jsdom */
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PreguntasFrecuentes } from "./PreguntasFrecuentes";
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function(this: HTMLDialogElement) { this.setAttribute("open", ""); });
  HTMLDialogElement.prototype.close = vi.fn(function(this: HTMLDialogElement) { this.removeAttribute("open"); });
});
afterEach(cleanup);
it("limita cada página a cuatro preguntas y reinicia al filtrar", () => {
  render(<PreguntasFrecuentes />);
  expect(document.querySelectorAll('[aria-haspopup="dialog"]')).toHaveLength(4);
  fireEvent.click(screen.getByRole("button", { name: "Preguntas siguientes" }));
  fireEvent.click(screen.getByRole("button", { name: "Pagos" }));
  expect(document.querySelectorAll('[aria-haspopup="dialog"]').length).toBeLessThanOrEqual(4);
  expect(screen.getByRole("button", { name: "Preguntas anteriores" })).toBeDisabled();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzzzzz" } });
  expect(screen.getByText(/Sin resultados/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Crear reporte de soporte/ })).toHaveAttribute("href", "/soporte?canal=chat");
});
it("abre la respuesta completa en un diálogo y la cierra", () => {
  render(<PreguntasFrecuentes />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /¿Cómo solicito un traslado/ }));
  expect(screen.getByRole("dialog")).toHaveTextContent("Pago seguro");
  fireEvent.click(screen.getByRole("button", { name: "Cerrar hoja inferior" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.querySelectorAll('[aria-haspopup="dialog"]')).toHaveLength(4);
});
