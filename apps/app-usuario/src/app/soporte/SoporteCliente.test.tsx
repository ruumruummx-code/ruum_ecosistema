/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SoporteCliente } from "./SoporteCliente";
describe("Soporte compacto",()=>{
it("ofrece cuatro canales y cinco temas sin inventar un traslado",()=>{render(<SoporteCliente usuario={null} traslados={[]}/>);expect(screen.getByRole("heading",{name:"Soporte"})).toBeInTheDocument();expect(screen.getByText(/Sin traslado activo/)).toBeInTheDocument();expect(screen.getByRole("link",{name:"WhatsApp"})).toHaveAttribute("href",expect.stringContaining("wa.me"));expect(screen.getByRole("link",{name:"Correo"})).toHaveAttribute("href",expect.stringContaining("mailto:"));expect(screen.getByRole("link",{name:/Preguntas frecuentes/})).toBeInTheDocument();});
it("permite enviar un mensaje demo y cerrar la hoja",async()=>{const u=userEvent.setup();render(<SoporteCliente usuario={null} traslados={[]}/>);await u.click(screen.getByRole("button",{name:/Chat en vivo/}));await u.type(screen.getByRole("textbox",{name:"Mensaje"}),"Ayuda con mi viaje");await u.click(screen.getByRole("button",{name:"Enviar mensaje"}));expect(screen.getByText("Ayuda con mi viaje")).toBeInTheDocument();await u.click(screen.getByRole("button",{name:"Cerrar chat"}));expect(screen.queryByRole("dialog")).not.toBeInTheDocument();});
it("muestra llamada sin realizarla automáticamente",async()=>{const u=userEvent.setup();render(<SoporteCliente usuario={null} traslados={[]}/>);await u.click(screen.getByRole("button",{name:"Llamada"}));expect(screen.getByRole("link",{name:"Llamar ahora"})).toHaveAttribute("href",expect.stringMatching(/^tel:\+\d+$/));await u.click(screen.getByRole("button",{name:"Cancelar"}));expect(screen.queryByRole("dialog")).not.toBeInTheDocument();});
});
