export function aplicarPreferenciasAplicacion(pref: Record<string, unknown>) {
  const raiz = document.documentElement;
  raiz.setAttribute("data-units", pref.unidades === "Imperial" ? "imperial" : "metric");
  raiz.style.fontSize = pref.accesibilidad === "Texto grande" ? "18px" : "";
  if (pref.accesibilidad === "Alto contraste") raiz.setAttribute("data-a11y-contrast", "high");
  else raiz.removeAttribute("data-a11y-contrast");
  if (pref.accesibilidad === "Texto grande") raiz.setAttribute("data-a11y-font", "large");
  else raiz.removeAttribute("data-a11y-font");
  window.dispatchEvent(new Event("ruum:unidades-actualizadas"));
}
