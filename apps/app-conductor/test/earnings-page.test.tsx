// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
const m=vi.hoisted(()=>({driver:vi.fn(),earnings:vi.fn(),configured:vi.fn(()=>true)}));
vi.mock("@ruum/api/services",()=>({obtenerConductorActual:m.driver,obtenerGananciasConductor:m.earnings}));
vi.mock("../src/lib/supabase-browser",()=>({crearClienteNavegador:()=>({}),tieneSupabaseConfigurado:m.configured}));
vi.mock("../src/app/ganancias/DriverEarningsView",()=>({DriverEarningsView:({summary,error}: {summary: {count:number,totalCompleted:number}|null,error:string|null})=><div><p>{error}</p><span data-testid="period">{summary?.count}</span><span data-testid="total">{summary?.totalCompleted}</span></div>}));
import Page from "../src/app/ganancias/page";
const closed={estado:"disputa_abierta",estado_operativo:"closed",cerrado_en:"2026-10-31T20:12:00Z",actualizado_en:"2026-11-01T07:38:00Z",ganancia_conductor_congelada:100};
beforeEach(()=>{
 vi.clearAllMocks(); vi.useFakeTimers({toFake:["Date"]}); vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
 m.configured.mockReturnValue(true); m.driver.mockResolvedValue({id:"driver"}); m.earnings.mockResolvedValue({traslados:[closed],payouts:[],datosBancarios:null});
});
afterEach(()=>{cleanup();vi.useRealTimers();});
it("distingue el periodo vacío del acumulado y vuelve a consultar al recuperar el foco",async()=>{
 render(<Page/>);
 await waitFor(()=>expect(screen.getByTestId("total").textContent).toBe("1"));
 expect(screen.getByTestId("period").textContent).toBe("0");
 m.earnings.mockResolvedValue({traslados:[closed,{...closed,cerrado_en:"2026-11-01T10:00:00Z"}],payouts:[],datosBancarios:null});
 fireEvent(window,new Event("focus"));
 await waitFor(()=>expect(screen.getByTestId("total").textContent).toBe("2"));
 expect(screen.getByTestId("period").textContent).toBe("1");
});
it("no consulta datos si Supabase no está configurado",async()=>{
 m.configured.mockReturnValue(false);render(<Page/>);
 await screen.findByText("No pudimos cargar tus ganancias. Intenta de nuevo más tarde.");
 expect(m.driver).not.toHaveBeenCalled();
});
