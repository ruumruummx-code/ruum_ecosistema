/** @vitest-environment jsdom */
import { afterEach, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { formatearDistanciaUsuario, useFormatoDistancia } from "./use-formato-distancia";
import { aplicarPreferenciasAplicacion } from "./preferencias-aplicacion";
import { readFileSync } from "node:fs";
import path from "node:path";
function Distancia() { const formato = useFormatoDistancia(); return <p>{formato(16.09344)}</p>; }
afterEach(() => aplicarPreferenciasAplicacion({}));
it("convierte únicamente la presentación y responde al cambio de unidades", () => {
  render(<Distancia />);
  expect(screen.getByText("16.1 km")).toBeInTheDocument();
  act(() => aplicarPreferenciasAplicacion({ unidades: "Imperial" }));
  expect(screen.getByText("10 mi")).toBeInTheDocument();
  act(() => aplicarPreferenciasAplicacion({ unidades: "Métrico" }));
  expect(screen.getByText("16.1 km")).toBeInTheDocument();
  expect(formatearDistanciaUsuario(0, true)).toBe("0 mi");
});
it("activa y revierte los modos de accesibilidad", () => {
  aplicarPreferenciasAplicacion({ accesibilidad: "Alto contraste" });
  expect(document.documentElement).toHaveAttribute("data-a11y-contrast", "high");
  aplicarPreferenciasAplicacion({ accesibilidad: "Texto grande" });
  expect(document.documentElement).not.toHaveAttribute("data-a11y-contrast");
  expect(document.documentElement.style.fontSize).toBe("18px");
  aplicarPreferenciasAplicacion({ accesibilidad: "Estándar" });
  expect(document.documentElement.style.fontSize).toBe("");
});
it("el modo de contraste aplica colores legibles a los controles reales", () => {
  const estilos = document.createElement("style");
  const css = readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf8");
  estilos.textContent = css.slice(css.indexOf("/* Preferencia de contraste"));
  document.head.appendChild(estilos);
  const boton = document.createElement("button");
  boton.textContent = "Guardar";
  document.body.appendChild(boton);
  try {
    aplicarPreferenciasAplicacion({ accesibilidad: "Alto contraste" });
    expect(getComputedStyle(boton).color).toBe("rgb(0, 0, 0)");
    expect(getComputedStyle(boton).backgroundColor).toBe("rgb(255, 255, 255)");
  } finally { estilos.remove(); boton.remove(); }
});
