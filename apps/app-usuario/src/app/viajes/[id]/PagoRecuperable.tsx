"use client";

import { useEffect, useState } from "react";
import { PagoTraslado } from "./PagoTraslado";

/** Retraso máximo de setTimeout en navegadores (2^31-1 ms ≈ 24.8 días). */
export const MAX_TIMEOUT_MS = 2147483647;

export function PagoRecuperable({ trasladoId, monto, cotizacionExpiraEn }: {
  trasladoId: string;
  monto: number;
  cotizacionExpiraEn: string;
}) {
  const [vigente, setVigente] = useState(false);

  useEffect(() => {
    const expiraEn = new Date(cotizacionExpiraEn).getTime();
    let vencimiento = 0;
    const comprobar = () => {
      const ahora = Date.now();
      // Ventana inválida o ya vencida: no hay nada que esperar.
      if (Number.isNaN(expiraEn) || expiraEn <= ahora) {
        setVigente(false);
        return;
      }
      setVigente(true);
      // setTimeout con retraso > 2^31-1 ms (~24.8 días) se desborda en
      // navegadores y se dispara de inmediato, consumiendo el aviso único.
      // Se rearma por tramos hasta la expiración real.
      vencimiento = window.setTimeout(comprobar, Math.min(expiraEn - ahora, MAX_TIMEOUT_MS));
    };
    const comprobacionInicial = window.setTimeout(comprobar, 0);
    return () => {
      window.clearTimeout(comprobacionInicial);
      window.clearTimeout(vencimiento);
    };
  }, [cotizacionExpiraEn]);

  return vigente ? <PagoTraslado trasladoId={trasladoId} monto={monto} /> : null;
}
