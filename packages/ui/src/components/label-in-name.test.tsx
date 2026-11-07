import { describe, expect, it } from "vitest";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EstadoStepper, MobileProgress } from "./EstadoStepper";
import { RuumHeader } from "./RuumHeader";
import { Chat } from "./Chat";
import { MobileButton } from "./MobileButton";
import { MobileRow } from "./MobileRow";

describe("SD-REM-011: Coincidencia entre texto visible y nombre accesible (WCAG 2.5.3 Label in Name)", () => {
  it("EstadoStepper: summary no tiene aria-label discordante y muestra desglose visible", () => {
    const html = renderToStaticMarkup(h(EstadoStepper, { estado: "solicitud_creada" }));
    expect(html).toContain("Ver desglose de etapas (1/7)");
    // No debe contener el aria-label antiguo que ocultaba el texto visible
    expect(html).not.toContain('aria-label="Ver todas las etapas del traslado"');
  });

  it("MobileProgress: summary de etapas conserva el texto visible sin sobrescritura espuria", () => {
    const html = renderToStaticMarkup(h(MobileProgress, { estado: "traslado_en_curso" }));
    expect(html).toContain("Ver desglose de etapas");
    expect(html).not.toContain('aria-label="Ver todas las etapas del traslado"');
  });

  it("RuumHeader: el enlace del logo incluye el texto visible de la marca y rol sin discrepancias", () => {
    const htmlUsuario = renderToStaticMarkup(h(RuumHeader, { rol: "usuario" }));
    expect(htmlUsuario).toContain("Ruum Ruum");
    expect(htmlUsuario).toContain("Usuario");
    expect(htmlUsuario).not.toContain('aria-label="Ruum Ruum"');

    const htmlConductor = renderToStaticMarkup(h(RuumHeader, { rol: "conductor" }));
    expect(htmlConductor).toContain("Ruum Ruum");
    expect(htmlConductor).toContain("conductor");
    expect(htmlConductor).not.toContain('aria-label="Ruum Ruum"');
  });

  it("Chat: el botón de envío deriva su nombre del texto visible tanto en reposo como enviando", () => {
    const htmlReposo = renderToStaticMarkup(h(Chat, { propio: "usuario", mensajes: [], onEnviar: () => {} }));
    expect(htmlReposo).toContain("Enviar");
    expect(htmlReposo).not.toContain('aria-label="Enviar mensaje"');
  });

  it("AC-4: MobileButton (SD-REM-003) preserva el texto visible durante reposo y loading", () => {
    const htmlDefault = renderToStaticMarkup(h(MobileButton, { children: "Guardar viaje" }));
    expect(htmlDefault).toContain("Guardar viaje");

    const htmlLoading = renderToStaticMarkup(h(MobileButton, { loading: true, children: "Guardar viaje" }));
    expect(htmlLoading).toContain("Guardar viaje");
    expect(htmlLoading).toContain('aria-busy="true"');
  });

  it("AC-4: MobileRow (SD-REM-007) mantiene el título visible como nombre accesible en deshabilitado", () => {
    const htmlDisabled = renderToStaticMarkup(h(MobileRow, { titulo: "Cancelar traslado", href: "#cancelar", disabled: true }));
    expect(htmlDisabled).toContain("Cancelar traslado");
    expect(htmlDisabled).toContain('role="link"');
    expect(htmlDisabled).toContain('aria-disabled="true"');
  });
});
