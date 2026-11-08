"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PasaporteRow } from "../trips-utils";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { avanzarEstadoTraslado } from "@ruum/api/services";
import { TripStage } from "./TripStage";

export function DirigeteAOrigenDetails({ pasaporte, volver }: { pasaporte: PasaporteRow; volver: string }) {
  const router = useRouter();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trasladoId = pasaporte.traslado_id!;
  async function handleLlegueOrigen() {
    if (procesando) return;
    setProcesando(true);
    setError(null);
    try {
      const cliente = crearClienteNavegador();
      await avanzarEstadoTraslado(cliente, trasladoId, "conductor_en_camino_al_origen");
      router.refresh();
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos registrar tu llegada al origen."));
      setProcesando(false);
    }
  }

  return <TripStage minimal pasaporte={pasaporte} backHref={volver} title="Ve al punto de recogida" instruction="Confirma la llegada cuando estés en el lugar." stateLabel="En camino al origen"
    primaryLabel="Confirmar llegada" onPrimary={() => void handleLlegueOrigen()} busy={procesando} error={error} />;
}
