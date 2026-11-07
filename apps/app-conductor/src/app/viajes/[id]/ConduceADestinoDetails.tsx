"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PasaporteRow } from "../trips-utils";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { avanzarEstadoTraslado, confirmarLlegadaDestino, obtenerPasaporteDigital } from "@ruum/api/services";
import { TripStage } from "./TripStage";
import { distanciaMetrosEntre, obtenerUbicacionActualConEstado } from "@/lib/ubicacion";
export function ConduceADestinoDetails({ pasaporte, volver }: { pasaporte: PasaporteRow; volver: string }) {
  const router = useRouter();
  const [procesando, setProcesando] = useState(false);
  useEffect(() => { setProcesando(false); }, [pasaporte.estado]);
  const [error, setError] = useState<string | null>(null);
  const trasladoId = pasaporte.traslado_id!;
  const navigationTargetLat = pasaporte.destino_lat;
  const navigationTargetLng = pasaporte.destino_lng;
  const recording = pasaporte.estado === "llegada_a_destino" || pasaporte.estado === "evidencia_final_en_proceso";
  async function handleLlegueDestino() {
    if (procesando) return;
    setProcesando(true);
    setError(null);

    try {
      const cliente = crearClienteNavegador();

      const pasaporteFresco = await obtenerPasaporteDigital(cliente, trasladoId);
      const estadoDb = pasaporteFresco?.estado || pasaporte.estado;

      if (!["traslado_en_curso", "llegada_a_destino", "evidencia_final_en_proceso"].includes(estadoDb || "")) {
        router.refresh(); setProcesando(false); return;
      }
      if (estadoDb === "evidencia_final_en_proceso") {
        router.push(`/viajes/${trasladoId}/evidencia`);
        return;
      }

      if (estadoDb === "traslado_en_curso") {
        let distanciaM: number | null = null;
        let fueraGeocerca = false;
        let precisionM: number | null = null;
        let antiguedadS: number | null = null;
        let motivoSinMedicion: string | null = null;

        try {
          const resUbicacion = await obtenerUbicacionActualConEstado();
          if (resUbicacion.estado === "ok") {
            const coords = resUbicacion.coordenadas;
            precisionM = coords.precisionM ?? null;
            const ahoraMs = Date.now();
            const capturaMs = coords.capturedAt ? Date.parse(coords.capturedAt) : ahoraMs;
            const edadMs = Math.max(0, ahoraMs - capturaMs);
            antiguedadS = Math.round(edadMs / 1000);

            // Si la lectura supera los 120s se cataloga como obsoleta (H06)
            if (edadMs > 120_000) {
              motivoSinMedicion = "lectura_obsoleta";
            }

            if (navigationTargetLat != null && navigationTargetLng != null) {
              const d = distanciaMetrosEntre(
                { lat: coords.lat, lng: coords.lng },
                { lat: navigationTargetLat, lng: navigationTargetLng }
              );
              distanciaM = Math.round(d);
              // Geocerca de llegada configurada en 500 metros
              fueraGeocerca = distanciaM > 500;
            } else {
              motivoSinMedicion = motivoSinMedicion || "destino_sin_coordenadas";
            }
          } else if (resUbicacion.estado === "denegado") {
            motivoSinMedicion = "gps_denegado";
          } else {
            motivoSinMedicion = "gps_no_disponible";
          }
        } catch {
          motivoSinMedicion = "error_obtener_ubicacion";
        }

        await confirmarLlegadaDestino(cliente, trasladoId, {
          fueraGeocerca,
          distanciaM,
          precisionM,
          antiguedadS,
          motivoSinMedicion
        });
        router.refresh(); return;
      }

      await avanzarEstadoTraslado(cliente, trasladoId, "llegada_a_destino");
      router.push(`/viajes/${trasladoId}/evidencia`);
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos registrar tu llegada al destino. Intenta de nuevo."));
      setProcesando(false);
    }
  }

  return <TripStage pasaporte={pasaporte} backHref={volver} destination
    title={recording ? "Registra la entrega" : "Conduce al destino"}
    instruction={recording ? "Completa el registro final antes de entregar." : "Confirma la llegada al punto de entrega."}
    stateLabel={recording ? "En el destino" : "Trayecto en curso"}
    primaryLabel={recording ? "Continuar registro final" : "Confirmar llegada a destino"}
    onPrimary={() => void handleLlegueDestino()} busy={procesando} error={error} />;
}
