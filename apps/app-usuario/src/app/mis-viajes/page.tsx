import type { Metadata } from "next";
import Link from "next/link";
import { Button, PassportCard } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { MisTrasladosCliente } from "./MisViajesCliente";

export const metadata: Metadata = {
  title: "Mis Traslados — Ruum Ruum",
  robots: { index: false, follow: false },
};
type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type Traslado = Pick<
  Database["public"]["Tables"]["traslados"]["Row"],
  "id" | "origen_direccion" | "origen_ciudad" | "destino_direccion" | "destino_ciudad" | "fecha_hora_programada"
>;

type PestañaTraslados = "activos" | "programados" | "finalizados" | "cancelados";

interface ViajeLista {
  pasaporte: Pasaporte;
  traslado: Traslado | null;
}

const PESTANAS: { id: PestañaTraslados; etiqueta: string }[] = [
  { id: "activos", etiqueta: "Activos" },
  { id: "programados", etiqueta: "Programados" },
  { id: "finalizados", etiqueta: "Finalizados" },
  { id: "cancelados", etiqueta: "Cancelados" }
];

async function obtenerTraslados(): Promise<ViajeLista[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return [];

  try {
    const { crearClienteServidor } = await import("../../lib/supabase-server");
    const { obtenerUsuarioActual, listarTrasladosDeUsuario } = await import("@ruum/api/services");
    const { obtenerTrasladosPorIds } = await import("@ruum/api/transfers");
    const cliente = await crearClienteServidor();
    const usuario = await obtenerUsuarioActual(cliente);

    if (!usuario) return [];

    const pasaportes = await listarTrasladosDeUsuario(cliente, usuario.id);
    const ids = pasaportes.map((pasaporte) => pasaporte.traslado_id).filter((id): id is string => Boolean(id));
    const traslados = await obtenerTrasladosPorIds(cliente, ids);
    const trasladosPorId = new Map(traslados.map((traslado) => [traslado.id, traslado]));
    return pasaportes.map((pasaporte) => ({
      pasaporte,
      traslado: pasaporte.traslado_id ? trasladosPorId.get(pasaporte.traslado_id) ?? null : null
    }));
  } catch (err) {
    console.error("[app-usuario:obtenerTraslados] supabase_error", {
      message: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export default async function PaginaMisTraslados({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const pestañaActiva = PESTANAS.some((pestaña) => pestaña.id === tab) ? (tab as PestañaTraslados) : "activos";
  const Traslados = await obtenerTraslados();

  return (
    <main className="user-v2-scope user-v2-page">
      <NavegacionUsuario variante="claro" />
      <div className="user-v2-content">
        <MisTrasladosCliente Traslados={Traslados} pestanaInicial={pestañaActiva} />
      </div>
    </main>
  );
}
