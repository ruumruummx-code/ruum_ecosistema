/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Preferencias } from "../Preferencias";
vi.mock("@/lib/supabase-browser", () => ({tieneSupabaseConfigurado:()=>false, crearClienteNavegador:()=>({})}));
beforeEach(()=>localStorage.clear());
describe("Preferencias compactas",()=>{
it("muestra controles inline y regreso contextual",()=>{render(<Preferencias usuario={null}/>);expect(screen.getByRole("link",{name:/Volver a mi cuenta/})).toHaveAttribute("href","/cuenta?seccion=perfil");expect(screen.getAllByRole("combobox")).toHaveLength(4);expect(screen.queryByText("Personaliza tu experiencia")).not.toBeInTheDocument();});
it("guarda idioma sin confirmar",async()=>{const user=userEvent.setup();render(<Preferencias usuario={null}/>);await user.click(screen.getByRole("radio",{name:"English (US)"}));expect(document.documentElement.lang).toBe("es-MX");expect(localStorage.getItem("ruum:pref:idioma")).toContain("en");});
it("permite editar notificaciones en una hoja y volver",async()=>{const user=userEvent.setup();render(<Preferencias usuario={null}/>);await user.click(screen.getByRole("button",{name:/Notificaciones y alertas/}));const control=screen.getByRole("switch",{name:"WhatsApp / SMS"});const original=control.getAttribute("aria-checked");await user.click(control);expect(control.getAttribute("aria-checked")).not.toBe(original);await user.click(screen.getByRole("button",{name:/Cerrar/}));expect(screen.queryByRole("dialog")).not.toBeInTheDocument();});
});
