/** @vitest-environment jsdom */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Preferencias } from "../Preferencias";
vi.mock("@/lib/supabase-browser",()=>({tieneSupabaseConfigurado:()=>false,crearClienteNavegador:()=>({})}));
beforeEach(()=>localStorage.clear());
describe("Aplicación inmediata de preferencias",()=>{
it("aplica tema y unidades sin botón Aplicar",async()=>{const u=userEvent.setup();render(<Preferencias usuario={null}/>);await u.selectOptions(screen.getByRole("combobox",{name:"Tema de la aplicación"}),"Oscuro");expect(document.documentElement).toHaveClass("dark");await u.selectOptions(screen.getByRole("combobox",{name:"Unidades de medida"}),"Imperial");expect(document.documentElement).toHaveAttribute("data-units","imperial");});
it("no afirma activar biometría sin una integración real",()=>{render(<Preferencias usuario={null}/>);expect(screen.getByText("No disponible en esta aplicación")).toBeInTheDocument();expect(screen.queryByRole("switch",{name:"Inicio biométrico"})).not.toBeInTheDocument();});
});
