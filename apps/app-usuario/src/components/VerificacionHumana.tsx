"use client";

import { useEffect, useRef } from "react";

/**
 * Widget de Cloudflare Turnstile para login y recuperación.
 *
 * Los endpoints exigen CAPTCHA solo cuando el riesgo es alto y el servidor
 * tiene TURNSTILE_SECRET_KEY + NEXT_PUBLIC_TURNSTILE_SITE_KEY. Este widget
 * se monta cuando la API responde 428 (`captchaRequerido`) y entrega el token
 * al formulario vía `onToken`. Sin site key no se renderiza nada (y el
 * servidor tampoco exige CAPTCHA, ver `captchaConfigurado`).
 */

const URL_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    contenedor: HTMLElement,
    opciones: {
      sitekey: string;
      language?: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    }
  ) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let cargaScript: Promise<TurnstileApi> | null = null;

function cargarTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (cargaScript) return cargaScript;
  cargaScript = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = URL_SCRIPT;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile_no_disponible")));
    script.onerror = () => {
      cargaScript = null;
      reject(new Error("turnstile_no_disponible"));
    };
    document.head.appendChild(script);
  });
  return cargaScript;
}

export function turnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
}

export function VerificacionHumana({
  onToken,
  onError,
}: {
  onToken: (token: string | null) => void;
  onError?: () => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const siteKey = turnstileSiteKey();

  useEffect(() => {
    if (!siteKey || !contenedor.current) return;
    let widgetId: string | null = null;
    let activo = true;
    cargarTurnstile()
      .then((api) => {
        if (!activo || !contenedor.current) return;
        widgetId = api.render(contenedor.current, {
          sitekey: siteKey,
          language: "es",
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-callback": () => {
            onToken(null);
            onError?.();
          },
        });
      })
      .catch(() => onError?.());
    return () => {
      activo = false;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, onToken, onError]);

  if (!siteKey) return null;
  return <div ref={contenedor} aria-label="Verificación de seguridad" />;
}
