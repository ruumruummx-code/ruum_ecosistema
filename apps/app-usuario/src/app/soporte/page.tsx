import type { Metadata } from "next";
import type { Database } from "@ruum/shared/types";
import { SoporteResponsive } from "./SoporteResponsive";

export const metadata: Metadata = {
  title: "Ayuda y soporte — Ruum Ruum",
  robots: { index: false, follow: false },
};

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];

type ResultadoContexto =
  | { estado: "ok"; usuario: Usuario; traslados: Pasaporte[] }
  | { estado: "sin_sesion" }
  | { estado: "error" };

async function obtenerContexto(): Promise<ResultadoContexto> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { estado: "error" };
  }

  try {
    const { crearClienteServidor } = await import("../../lib/supabase-server");
    const { obtenerUsuarioActual, listarTrasladosDeUsuario } = await import("@ruum/api/services");
    const cliente = await crearClienteServidor();
    const usuario = await obtenerUsuarioActual(cliente);
    if (!usuario) return { estado: "sin_sesion" };
    const traslados = await listarTrasladosDeUsuario(cliente, usuario.id);
    return { estado: "ok", usuario, traslados };
  } catch (err) {
    console.error("[app-usuario:obtenerContextoSoporte] supabase_error", {
      message: err instanceof Error ? err.message : String(err),
    });
    return { estado: "error" };
  }
}

export default async function PaginaSoporte({
  searchParams,
}: {
  searchParams: Promise<{ viaje?: string; motivo?: string; canal?: string }>;
}) {
  const { viaje, motivo, canal } = await searchParams;
  const resultado = await obtenerContexto();

  return <SoporteResponsive
    key={`${viaje ?? ""}:${motivo ?? ""}:${canal ?? ""}`}
    usuario={resultado.estado === "ok" ? resultado.usuario : null}
    traslados={resultado.estado === "ok" ? resultado.traslados : []}
    errorCarga={resultado.estado === "error"}
    viajePreseleccionado={viaje}
    motivoPreseleccionado={motivo}
    canalPreseleccionado={canal}
  />;
}
