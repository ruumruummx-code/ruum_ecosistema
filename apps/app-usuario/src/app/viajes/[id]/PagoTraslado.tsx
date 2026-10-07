"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ruum/ui";
import { formatearPrecio } from "@ruum/shared/utils";
import { PagoStripe } from "../../PagoStripe";
import { useTrasladoRealtime } from "@/state/AppStateProvider";

export interface PagoTrasladoProps {
  trasladoId: string;
  monto: number;
}

export function PagoTraslado({ trasladoId, monto }: PagoTrasladoProps) {
  const router = useRouter();
  const { pagoConfirmado: pagado, actualizar } = useTrasladoRealtime(trasladoId);

  if (pagado) {
    return <ConfirmacionPago router={router} />;
  }

  return (
    <div className="mt-6 rounded-2xl border border-[#1C2A3E] bg-[#0A1220] p-4">
      <div className="mb-3 flex items-center justify-between border-b border-[#1C2A3E] pb-3">
        <p className="font-body text-xs font-bold uppercase tracking-wider text-[#8E9CAE]">Pago pendiente</p>
        <p className="font-display text-base font-extrabold text-[#FFC400]">{formatearPrecio(monto)}</p>
      </div>

      <PagoStripe trasladoId={trasladoId} monto={monto} onPagado={() => actualizar({ pagoConfirmado: true })} />
    </div>
  );
}

function ConfirmacionPago({ router }: { router: ReturnType<typeof useRouter> }) {
  // El estado del servidor se refresca solo; el botón queda como respaldo manual.
  useEffect(() => {
    const temporizador = window.setTimeout(() => router.refresh(), 1500);
    return () => window.clearTimeout(temporizador);
  }, [router]);

  return (
    <div
      className="mt-6 rounded-2xl border border-emerald-500/30 bg-[#0A1220] p-4 text-center"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 mb-2" aria-hidden="true">
        ✓
      </div>
      <p className="font-display text-sm font-bold text-white">Pago procesado correctamente</p>
      <p className="mt-1 font-body text-xs text-[#8E9CAE]">
        El estado de tu traslado se actualizará automáticamente.
      </p>
      <Button variant="secondary" className="mt-3" onClick={() => router.refresh()}>
        Actualizar estado ahora
      </Button>
    </div>
  );
}
