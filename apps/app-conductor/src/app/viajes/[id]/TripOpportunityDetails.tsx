"use client";
import { OpportunityDetailsView } from "./OpportunityDetailsView";
import { TripDialog } from "./TripDialog";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MOTIVOS_RECHAZO, type MotivoRechazo } from "@ruum/shared/constants";
import type { Database } from "@ruum/shared/types";
import { traducirErrorOperativo, suscribirCanalSeguro } from "@ruum/shared/utils";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import { aceptarAsignacion, rechazarAsignacion, consultarOportunidadAsignacion, type OportunidadAsignacion, solicitarAsignacionViaje, registrarEvento, obtenerConductorActual } from "@ruum/api/services";
import { obtenerUbicacionActualConEstado, type Coordenadas } from "@/lib/ubicacion";
import { nombreVehiculo } from "../trips-utils";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];

export function TripOpportunityDetails({
  pasaporte,
  volver
}: {
  pasaporte: PasaporteRow;
  volver: string;
}) {
  const router = useRouter();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisoExito, setAvisoExito] = useState<string | null>(null);
  const [ofertaTomada, setOfertaTomada] = useState(false);
  const [conductorId, setConductorId] = useState<string | null>(null);
  const [oportunidad, setOportunidad] = useState<OportunidadAsignacion | null>(null);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [posicionConductor, setPosicionConductor] = useState<Coordenadas | null>(null);
  const [mostrarModalRechazo, setMostrarModalRechazo] = useState(false);

  const trasladoId = pasaporte.traslado_id!;

  useEffect(() => {
    let activo=true;
    async function consultar() {
      try {
        const estado=await consultarOportunidadAsignacion(crearClienteNavegador(),trasladoId);
        if (!activo) return;
        setOportunidad(estado); setSolicitudEnviada(estado.solicitud_estado === "solicitada"); setOfertaTomada(estado.tomada);
        if (estado.asignada_a_mi) router.replace(`/viajes/${trasladoId}`);
      } catch (err) { if (activo) setError(traducirErrorOperativo(err,"No se pudo verificar la asignación.")); }
    }
    void consultar(); const timer=window.setInterval(() => void consultar(),5000);
    return () => { activo=false; window.clearInterval(timer); };
  },[trasladoId,router]);


  // 2. Suscripción Realtime a cambios en este traslado (Detección de asignación concurrente)
  useEffect(() => {
    if (!trasladoId || !tieneSupabaseConfigurado()) return;

    let cliente: ReturnType<typeof crearClienteNavegador>;
    try {
      cliente = crearClienteNavegador();
    } catch {
      return;
    }

    const canal = cliente
      .channel(`oferta_detalle_${trasladoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "traslados",
          filter: `id=eq.${trasladoId}`
        },
        (payload: { new: { conductor_id?: string | null; estado?: string | null } }) => {
          const nuevo = payload.new;
          if (nuevo && nuevo.conductor_id && nuevo.estado !== "pendiente_de_conductor") {
            if (conductorId && nuevo.conductor_id === conductorId) {
              setAvisoExito("El traslado fue asignado a tu cuenta. Abriendo el flujo operativo...");
              router.push(`/viajes?vista=mis-Traslados`);
            } else {
              setOfertaTomada(true);
            }
          }
        }
      );

    const desuscribir = suscribirCanalSeguro(cliente, canal, {
      onError: (err) => console.warn("[TripOpportunityDetails] error en canal oferta", err)
    });

    return () => {
      void desuscribir();
    };
  }, [trasladoId, conductorId, router]);

  // Si el viaje ya está asignado o no está pendiente, redirigir al flujo activo
  useEffect(() => {
    async function verificarAsignacion() {
      if (!tieneSupabaseConfigurado()) return;
      try {
        const cond = await obtenerConductorActual(crearClienteNavegador()).catch(() => null);
        if (!cond) return;
        setConductorId(cond.id);
        if (pasaporte.conductor_id === cond.id) {
          router.replace(`/viajes/${trasladoId}`);
        }
      } catch {
        // Ignorar error de lectura de sesión
      }
    }

    void verificarAsignacion();
  }, [pasaporte.conductor_id, pasaporte.estado, trasladoId, router]);

  // 3. Cálculo real de aproximación GPS
  useEffect(() => {
    let cancelado = false;
    async function obtenerGPS() {
      try {
        const resultado = await obtenerUbicacionActualConEstado();
        if (!cancelado && resultado.estado === "ok") {
          setPosicionConductor(resultado.coordenadas);
        }
      } catch {
        // Ignorar fallo de geolocalización
      }
    }
    void obtenerGPS();
    return () => {
      cancelado = true;
    };
  }, []);

  async function handleAceptar() {
    if (procesando || !oportunidad?.elegible) return;
    setProcesando(true);
    setError(null);

    try {
      const cliente = crearClienteNavegador();
      const { data: { session } } = await cliente.auth.getSession();
      if (!session?.user) {
        throw new Error("Inicia sesión para poder aceptar traslados.");
      }

      const conductorData = await obtenerConductorActual(cliente).catch(() => null);

      if (!conductorData) {
        throw new Error("No se encontró tu perfil de conductor en el sistema.");
      }

      setConductorId(conductorData.id);
      if (oportunidad.modo === "dirigida") {
        if (!oportunidad.asignacion_id) throw new Error("Falta el identificador de la oferta dirigida.");
        await aceptarAsignacion(cliente, oportunidad.asignacion_id);
        router.replace(`/viajes/${trasladoId}`);
        return;
      }
      const resultado = await solicitarAsignacionViaje(cliente, trasladoId, conductorData.id, posicionConductor);
      const cierre = new Date(resultado.cierra_en).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      setSolicitudEnviada(true);
      setAvisoExito(`Solicitud registrada. La competencia cierra a las ${cierre}; te avisaremos si eres seleccionado.`);
      setProcesando(false);
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos aceptar el traslado."));
      setProcesando(false);
    }
  }

  async function handleConfirmarRechazo(motivo: MotivoRechazo) {
    setMostrarModalRechazo(false);
    setProcesando(true);
    setError(null);

    try {
      const cliente = crearClienteNavegador();
      if (oportunidad?.modo === "dirigida" && oportunidad.asignacion_id) {
        await rechazarAsignacion(cliente, oportunidad.asignacion_id, String(motivo));
        router.push(volver); return;
      }
      const { data: { session } } = await cliente.auth.getSession();
      if (session?.user) {
        const conductorData = await obtenerConductorActual(cliente).catch(() => null);

        if (conductorData) {
          await registrarEvento(cliente, "modificacion_traslado_activo", "conductor", conductorData.id, {
            traslado_id: trasladoId,
            accion: "rechazo_oferta_conductor",
            motivo
          });
        }
      }
      router.push(volver);
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos registrar el rechazo de la oferta."));
      setProcesando(false);
    }
  }

  return <>
    <OpportunityDetailsView oportunidad={oportunidad} pasaporte={pasaporte} volver={volver} procesando={procesando}
      error={error} avisoExito={avisoExito} ofertaTomada={ofertaTomada} solicitudEnviada={solicitudEnviada}
      onAccept={() => void handleAceptar()} onReject={() => setMostrarModalRechazo(true)} />
    {mostrarModalRechazo && <TripDialog title="Motivo de rechazo" onClose={() => setMostrarModalRechazo(false)}>
      <p className="mb-3 text-sm">{nombreVehiculo(pasaporte)}</p>
      <div className="grid gap-2">{MOTIVOS_RECHAZO.map(motivo => <button key={motivo} type="button" onClick={() => void handleConfirmarRechazo(motivo)} className="min-h-11 rounded-xl border border-border p-3 text-left text-sm">{motivo}</button>)}</div>
    </TripDialog>}
  </>;
}
