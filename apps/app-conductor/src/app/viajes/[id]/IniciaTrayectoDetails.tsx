"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PasaporteRow } from "../trips-utils";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { avanzarEstadoTraslado } from "@ruum/api/services";
import { TripStage } from "./TripStage";

export function IniciaTrayectoDetails({ pasaporte, volver }: { pasaporte: PasaporteRow; volver: string }) {
  const router = useRouter();
  const [procesando, setProcesando] = useState(false);
  useEffect(() => { setProcesando(false); }, [pasaporte.estado]);
  const [error, setError] = useState<string | null>(null);
  const received = pasaporte.estado === "vehiculo_recibido";
  async function continuar() {
    if (procesando) return;
    setProcesando(true); setError(null);
    try {
      await avanzarEstadoTraslado(crearClienteNavegador(), pasaporte.traslado_id!, received ? "vehiculo_recibido" : "evidencia_inicial_completada");
      router.refresh();
    } catch (err) { setError(traducirErrorOperativo(err, "No pudimos actualizar la recepción del vehículo.")); setProcesando(false); }
  }
  return <TripStage minimal pasaporte={pasaporte} backHref={volver} destination={received}
    title={received ? "Inicia el trayecto" : "Confirma la recepción"}
    instruction={received ? "Confirma cuando estés listo para salir." : "El registro inicial está completo."}
    stateLabel={received ? "Vehículo recibido" : "Registro inicial completo"}
    primaryLabel={received ? "Iniciar traslado" : "Confirmar recepción"} onPrimary={() => void continuar()} busy={procesando} error={error} />;
}
