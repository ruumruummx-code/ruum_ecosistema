// Smoke tests SSR (sin jsdom): verifican que los componentes presentacionales
// renderizan su contenido esencial y no revientan con props límite.
// Nota: children van dentro de props (los overloads de createElement en
// @types/react v19 no aceptan children solo como argumentos).
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { Aviso } from "./Aviso";
import { EmptyState } from "./EmptyState";
import { StatusChip, type StatusChipProps } from "./StatusChip";

describe("ui smoke — Button", () => {
  it("renderiza hijos y variante primary con icono por defecto", () => {
    const html = renderToStaticMarkup(h(Button, { children: "Continuar" }));
    expect(html).toContain("Continuar");
    expect(html).toContain("<button");
    expect(html).toContain("<svg");
  });

  it("loading deshabilita y muestra busy; danger sin icono explícito usa warning", () => {
    const html = renderToStaticMarkup(h(Button, { loading: true, children: "X" }));
    expect(html).toContain("disabled");
    expect(html).toContain('aria-busy="true"');
    const danger = renderToStaticMarkup(h(Button, { variant: "danger", children: "Y" }));
    expect(danger).toContain("M10.3 3.6");
  });

  it("quiet sin icono no dibuja svg", () => {
    const html = renderToStaticMarkup(h(Button, { variant: "quiet", children: "Z" }));
    expect(html).not.toContain("<svg");
  });
});

describe("ui smoke — Card / Aviso / EmptyState", () => {
  it("Card envuelve hijos", () => {
    expect(renderToStaticMarkup(h(Card, { children: "contenido" }))).toContain("contenido");
  });

  it("Aviso danger usa role=alert e info role=status", () => {
    expect(renderToStaticMarkup(h(Aviso, { tono: "danger", titulo: "T", children: "c" }))).toContain('role="alert"');
    expect(renderToStaticMarkup(h(Aviso, { children: "c" }))).toContain('role="status"');
  });

  it("EmptyState muestra título y descripción", () => {
    const html = renderToStaticMarkup(h(EmptyState, { titulo: "Sin viajes", descripcion: "Nada por aquí" }));
    expect(html).toContain("Sin viajes");
    expect(html).toContain("Nada por aquí");
  });
});

describe("ui smoke — StatusChip", () => {
  it("los 12 estados visuales renderizan etiqueta", () => {
    const etiquetas: Array<[StatusChipProps["estado"], string]> = [
      ["solicitado", "Solicitado"],
      ["cotizacion-confirmada", "Cotizaci"],
      ["pendiente-conductor", "Pendiente de conductor"],
      ["conductor-asignado", "Conductor asignado"],
      ["evidencia-inicial-completa", "Evidencia inicial completa"],
      ["en-ruta", "En ruta"],
      ["entrega-confirmada", "Entrega confirmada"],
      ["cerrado", "Cerrado"],
      ["evidencia-pendiente", "Evidencia pendiente"],
      ["incidente-abierto", "Incidente"],
      ["cancelado", "Cancelado"],
      ["pago-detenido", "Pago detenido"],
    ];
    for (const [estado, etiqueta] of etiquetas) {
      const html = renderToStaticMarkup(h(StatusChip, { estado }));
      expect(html).toContain('role="status"');
      expect(html.includes(etiqueta), estado).toBe(true);
    }
  });
});
