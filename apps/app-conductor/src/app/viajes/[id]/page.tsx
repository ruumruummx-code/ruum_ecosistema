import type { Metadata } from "next";
import { obtenerPasaporteDigital } from "@ruum/api/services";
import { crearClienteServidor } from "@/lib/supabase-server";
import { EstadoError } from "../../EstadoError";
import { TripOpportunityDetails } from "./TripOpportunityDetails";
import { LocalizarVehiculoDetails } from "./LocalizarVehiculoDetails";
import { ConduceADestinoDetails } from "./ConduceADestinoDetails";
import { CierreTrasladoDetails } from "./CierreTrasladoDetails";
import { DirigeteAOrigenDetails } from "./DirigeteAOrigenDetails";
import { TrasladoAsignadoDetails } from "./TrasladoAsignadoDetails";
import { TripStatusSummary } from "./TripStatusSummary";
import { IniciaTrayectoDetails } from "./IniciaTrayectoDetails";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function rutaVolverTraslados(valor: string | undefined) {
  if (!valor) return "/viajes";
  try {
    const decodificada = decodeURIComponent(valor);
    return decodificada.startsWith("/viajes") && !decodificada.startsWith("/viajes/") ? decodificada : "/viajes";
  } catch {
    return "/viajes";
  }
}

async function obtenerDatos(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { pasaporte: null };
  }

  const cliente = await crearClienteServidor();
  const pasaporte = await obtenerPasaporteDigital(cliente, id);
  return { pasaporte };
}

export default async function PaginaDetalleViaje({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ volver?: string; cierre?: string }>;
}) {
  const { id } = await params;
  const consulta = await searchParams;
  const volver = rutaVolverTraslados(consulta?.volver);
  const { pasaporte } = await obtenerDatos(id);

  if (!pasaporte) {
    return (
      <EstadoError
        titulo="No encontramos ese viaje"
        descripcion="Revisa el enlace o vuelve a tu lista de Traslados para continuar."
        acciones={[
          { etiqueta: "Ver mis Traslados", href: "/viajes", variant: "primary" },
          { etiqueta: "Volver al panel", href: "/", variant: "quiet" }
        ]}
      />
    );
  }

  if (!pasaporte.estado || !pasaporte.traslado_id) {
    return (
      <EstadoError
        titulo="No pudimos cargar el viaje completo"
        descripcion="Vuelve a intentarlo o contacta a soporte si el problema continúa."
        acciones={[
          { etiqueta: "Ver mis Traslados", href: "/viajes", variant: "primary" },
          { etiqueta: "Volver al panel", href: "/", variant: "quiet" }
        ]}
      />
    );
  }

  if (
    pasaporte.estado === "conductor_asignado" ||
    (Boolean(pasaporte.conductor_id) && pasaporte.estado === "pendiente_de_conductor")
  ) {
    return (
      <TrasladoAsignadoDetails pasaporte={pasaporte} volver={volver} />
    );
  }

  if (pasaporte.estado === "conductor_en_camino_al_origen") {
    return (
      <DirigeteAOrigenDetails pasaporte={pasaporte} volver={volver} />
    );
  }

  if (
    pasaporte.estado === "evidencia_inicial_completada" ||
    pasaporte.estado === "vehiculo_recibido"
  ) {
    return (
      <IniciaTrayectoDetails pasaporte={pasaporte} volver={volver} />
    );
  }

  if (
    pasaporte.estado === "conductor_en_punto_de_recoleccion" ||
    pasaporte.estado === "verificacion_vehiculo_en_proceso" ||
    pasaporte.estado === "evidencia_inicial_en_proceso"
  ) {
    return (
      <LocalizarVehiculoDetails pasaporte={pasaporte} volver={volver} />
    );
  }

  if (
    pasaporte.estado === "traslado_en_curso" ||
    pasaporte.estado === "llegada_a_destino" ||
    pasaporte.estado === "evidencia_final_en_proceso"
  ) {
    return (
      <ConduceADestinoDetails pasaporte={pasaporte} volver={volver} />
    );
  }

  if (pasaporte.estado === "evidencia_final_completada" || pasaporte.estado === "entrega_confirmada") {
    return consulta?.cierre === "1"
      ? <CierreTrasladoDetails pasaporte={pasaporte} volver={volver} />
      : <TripStatusSummary pasaporte={pasaporte} volver={volver} closing />;
  }

  if (pasaporte.estado === "pendiente_de_conductor" && !pasaporte.conductor_id) {
    return <TripOpportunityDetails pasaporte={pasaporte} volver={volver} />;
  }

  // Estados cerrados, en revisión o desconocidos nunca vuelven a ofrecer el inicio.
  return <TripStatusSummary pasaporte={pasaporte} volver={volver} />;
}
