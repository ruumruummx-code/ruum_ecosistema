import { expect, type Page } from "@playwright/test";

/**
 * Utilidades de navegación E2E.
 *
 * Todas las páginas de `app-usuario` se renderizan con `"use client"` bajo un
 * shell server-rendered: el HTML devuelto por el servidor ya contiene los
 * controles, pero **no tienen controladores de React todavía**. Un `click()`
 * sobre ese HTML dispara el comportamiento nativo del navegador (por ejemplo,
 * un `<form method=get>` navega a `/registro?` sin validar nada), lo que hacía
 * que los flujos avanzasen "a ratos" y que esta batería fallase de forma
 * intermitente. Por eso *siempre* esperamos a que React termine de hidratar
 * antes de interactuar.
 *
 * La señal que usamos es la presencia de las propiedades `__reactFiber$` /
 * `__reactProps$` que React inyecta en cada nodo montado. No es una API
 * pública de React, pero es exactamente la condición que necesitamos
 * comprobar: "este nodo ya tiene sus handlers asignados".
 */
export async function esperarHidratacion(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const candidatos = [
        document.body,
        document.querySelector("form"),
        document.querySelector("button"),
        document.querySelector("input"),
        document.querySelector("[role=dialog]"),
      ].filter((nodo): nodo is HTMLElement => Boolean(nodo));

      return candidatos.some((nodo) =>
        Object.keys(nodo).some((clave) => clave.startsWith("__react")),
      );
    },
    undefined,
    { timeout: 60_000 },
  );

  // Pequeño respiro: los efectos (fetch de perfil, consentimiento, etc.)
  // se ejecutan en el mismo flush y necesitan un tick para montar overlays.
  await page.waitForTimeout(500);
}

/** Devuelve la ruta actual de la pestaña sin origin (p. ej. `/login?next=%2F`). */
export function rutaActual(page: Page): string {
  const url = new URL(page.url());
  return `${url.pathname}${url.search}`;
}

/**
 * Acepta el consentimiento de términos si la app lo muestra.
 *
 * El mock de GoTrue devuelve `version_terminos_aceptada`, así que esto sólo
 * interviene si el perfil viene sin versión (p. ej. tras registro). Devuelve
 * `true` si había diálogo, para que el caller pueda decidir si es un fallo.
 */
export async function aceptarConsentimientoSiAparece(page: Page): Promise<boolean> {
  const boton = page.getByRole("button", { name: /aceptar (los )?t[ée]rminos/i });
  try {
    await boton.waitFor({ state: "visible", timeout: 1500 });
  } catch {
    return false;
  }
  await boton.click();
  await expect(boton).toHaveCount(0, { timeout: 10_000 });
  return true;
}
