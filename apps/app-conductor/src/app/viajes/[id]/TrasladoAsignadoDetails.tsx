"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PasaporteRow } from "../trips-utils";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { avanzarEstadoTraslado } from "@ruum/api/services";
import { TripStage } from "./TripStage";

export function TrasladoAsignadoDetails({ pasaporte, volver }: { pasaporte: PasaporteRow; volver: string }) {
  const router = useRouter();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trasladoId = pasaporte.traslado_id!;
  async function handleIniciarCamino() {
    if (procesando) return;
    setProcesando(true);
    setError(null);
    try {
      const cliente = crearClienteNavegador();
      await avanzarEstadoTraslado(cliente, trasladoId, "conductor_asignado");
      router.refresh();
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos iniciar el traslado. Intenta de nuevo."));
      setProcesando(false);
    }
  }

  return <TripStage pasaporte={pasaporte} backHref={volver} title="Prepara la recogida" instruction="Revisa el punto de origen antes de salir." stateLabel="Asignado"
    primaryLabel="Iniciar ruta" onPrimary={() => void handleIniciarCamino()} busy={procesando} error={error} />;
}
