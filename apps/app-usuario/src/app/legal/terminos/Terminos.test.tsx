/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PaginaTerminos from "./page";
describe("Visor de términos", () => {
it("conserva las seis secciones y ofrece el PDF desde el encabezado", () => {
render(<PaginaTerminos />);
expect(screen.getAllByRole("heading", {level:2})).toHaveLength(6);
expect(screen.getByRole("region", {name:"Texto de términos y condiciones"})).toHaveClass("user-legal-reader");
expect(screen.getByRole("link",{name:/Descargar términos/})).toHaveAttribute("href","/docs-legales/terminos-y-condiciones-ruum-ruum.pdf");
expect(screen.getByRole("link",{name:/Descargar términos/})).toHaveAttribute("download");
expect(screen.getByText(/24 horas siguientes/)).toBeInTheDocument();
});
});
