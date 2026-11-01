/** @vitest-environment jsdom */
import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
import { CancelarTraslado } from "./CancelarTraslado";
const props={trasladoId:"prueba",precio:1000,fechaProgramada:null,conductorAsignado:true};
it("oculta cancelación tras el cierre aunque se abra una disputa",()=>{
 const {container}=render(<CancelarTraslado {...props} estado="disputa_abierta" cerrado />);
 expect(container).toBeEmptyDOMElement();
});
it("no afirma que el vehículo está en operación por una etapa administrativa",()=>{
 render(<CancelarTraslado {...props} estado="documentacion_validada" />);
 expect(screen.getByText("Cancelación no disponible")).toBeInTheDocument();
 expect(screen.queryByText(/El vehículo ya se encuentra en proceso operativo/)).not.toBeInTheDocument();
});
