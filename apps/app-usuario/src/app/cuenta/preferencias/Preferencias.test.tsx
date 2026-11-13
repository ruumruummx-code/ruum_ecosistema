/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Preferencias } from "../Preferencias";
vi.mock("@/lib/supabase-browser", () => ({tieneSupabaseConfigurado:()=>false, crearClienteNavegador:()=>({})}));
beforeEach(()=>localStorage.clear());
describe("Preferencias compactas",()=>{
it("muestra controles inline y regreso contextual",()=>{render(<Preferencias usuario={null}/>);expect(screen.getByRole("link",{name:/Volver a mi cuenta/})).toHaveAttribute("href","/cuenta?seccion=perfil");expect(screen.getAllByRole("combobox")).toHaveLength(4);expect(screen.queryByText("Personaliza tu experiencia")).not.toBeInTheDocument();});
it("explica la disponibilidad antes de elegir y no permite seleccionar English",async()=>{const user=userEvent.setup();render(<Preferencias usuario={null}/>);const english=screen.getByRole("radio",{name:"English (US)"});expect(english).toBeDisabled();expect(english).toHaveAccessibleDescription(/únicamente en español/);await user.click(english);expect(document.documentElement.lang).toBe("es-MX");expect(english).toHaveAttribute('aria-checked','false');expect(localStorage.getItem("ruum:pref:idioma")).toBeNull();expect(screen.queryByText(/Preferencia de idioma guardada/)).not.toBeInTheDocument();});
it("permite editar notificaciones en una hoja y volver",async()=>{const user=userEvent.setup();render(<Preferencias usuario={null}/>);await user.click(screen.getByRole("button",{name:/Notificaciones y alertas/}));const control=screen.getByRole("switch",{name:"WhatsApp / SMS"});const original=control.getAttribute("aria-checked");await user.click(control);expect(control.getAttribute("aria-checked")).not.toBe(original);await user.click(screen.getByRole("button",{name:/Cerrar/}));expect(screen.queryByRole("dialog")).not.toBeInTheDocument();});
});
