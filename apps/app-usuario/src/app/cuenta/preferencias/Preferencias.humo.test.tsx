/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Preferencias } from "../Preferencias";
vi.mock("@/lib/supabase-browser",()=>({tieneSupabaseConfigurado:()=>false,crearClienteNavegador:()=>({})}));
beforeEach(()=>localStorage.clear());
describe("Aplicación inmediata de preferencias",()=>{
it("aplica tema y unidades sin botón Aplicar",async()=>{const u=userEvent.setup();render(<Preferencias usuario={null}/>);await u.selectOptions(screen.getByRole("combobox",{name:"Tema de la aplicación"}),"Oscuro");expect(document.documentElement).toHaveClass("dark");await u.selectOptions(screen.getByRole("combobox",{name:"Unidades de medida"}),"Imperial");expect(document.documentElement).toHaveAttribute("data-units","imperial");});
it("conserva biometría al volver a montar la vista",async()=>{const u=userEvent.setup();const r=render(<Preferencias usuario={null}/>);const b=screen.getByRole("switch",{name:"Inicio biométrico"});const old=b.getAttribute("aria-checked");await u.click(b);r.unmount();render(<Preferencias usuario={null}/>);expect(screen.getByRole("switch",{name:"Inicio biométrico"}).getAttribute("aria-checked")).not.toBe(old);});
});
