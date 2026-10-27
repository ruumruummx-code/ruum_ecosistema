import type { Metadata } from "next";
import Link from "next/link";
import { Aviso, Button, MobileShell } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { MisTrasladosCliente } from "./MisViajesCliente";
import { MisViajesDesktop } from "./MisViajesDesktop";
import { construirNotificaciones, type NotificacionInicio } from "../../lib/inicio";

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

/**
 * A-4 (auditoría): antes el catch devolvía `[]`, igual que "no tienes
 * traslados". Un fallo de Supabase se veía como una cuenta vacía y el usuario
 * veía un CTA para crear uno, sin ninguna señal de que algo falló. Ahora el
 * error es un estado explícito y la página muestra un aviso con reintento.
 */
type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];

type ResultadoTraslados =
  | { estado: "ok"; usuario: UsuarioRow; traslados: ViajeLista[]; notificaciones: NotificacionInicio[] }
  | { estado: "sin_sesion" }
  | { estado: "error" };

async function obtenerTraslados(): Promise<ResultadoTraslados> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return { estado: "sin_sesion" };

  try {
    const { crearClienteServidor } = await import("../../lib/supabase-server");
    const { obtenerUsuarioActual, listarTrasladosDeUsuario } = await import("@ruum/api/services");
    const { obtenerTrasladosPorIds } = await import("@ruum/api/transfers");
    const cliente = await crearClienteServidor();
    const usuario = await obtenerUsuarioActual(cliente);

    if (!usuario) return { estado: "sin_sesion" };

    const pasaportes = await listarTrasladosDeUsuario(cliente, usuario.id);
    const ids = pasaportes.map((pasaporte) => pasaporte.traslado_id).filter((id): id is string => Boolean(id));
    const traslados = await obtenerTrasladosPorIds(cliente, ids);
    const trasladosPorId = new Map(traslados.map((traslado) => [traslado.id, traslado]));
    return {
      estado: "ok",
      usuario,
      notificaciones: construirNotificaciones(usuario, pasaportes),
      traslados: pasaportes.map((pasaporte) => ({
        pasaporte,
        traslado: pasaporte.traslado_id ? trasladosPorId.get(pasaporte.traslado_id) ?? null : null
      }))
    };
  } catch (err) {
    console.error("[app-usuario:obtenerTraslados] supabase_error", {
      message: err instanceof Error ? err.message : String(err),
    });
    return { estado: "error" };
  }
}

export default async function PaginaMisTraslados({
  searchParams
}: {
  searchParams: Promise<{ tab?: string; buscar?: string }>;
}) {
  const { tab, buscar } = await searchParams;
  const pestañaActiva = PESTANAS.some((pestaña) => pestaña.id === tab) ? (tab as PestañaTraslados) : "activos";
  const resultado = await obtenerTraslados();

  if (resultado.estado === "error") {
    return (
      <>
        <NavegacionUsuario variante="claro" />
        <MobileShell as="main" variant="compact" navInferiorVisible={true} className="user-v2-scope user-transfers-shell" contentClassName="user-transfers-content">
          <div className="user-transfers-fallback text-center">
            <Aviso tono="danger">
              No pudimos cargar tus traslados en este momento. Inténtalo de nuevo en unos segundos.
            </Aviso>
            <div className="mt-6 flex justify-center">
              <Link href="/soporte">
                <Button className="w-full sm:w-auto">Reportar un problema</Button>
              </Link>
            </div>
          </div>
        </MobileShell>
      </>
    );
  }

  // Sin sesión el middleware ya redirige a /login; si llegara aquí, la lista
  // vacía es el comportamiento correcto.
  const Traslados = resultado.estado === "ok" ? resultado.traslados : [];
  const usuario = resultado.estado === "ok" ? resultado.usuario : null;

  return (
    <>
      {/* VISTA MÓVIL (< 1024px): Intacta con enfoque mobile-first */}
      <div className="lg:hidden flex flex-col h-full w-full">
        <NavegacionUsuario variante="claro" notificaciones={resultado.estado === "ok" ? resultado.notificaciones : []} />
        <MobileShell as="main" variant="compact" navInferiorVisible={true} className="user-v2-scope user-transfers-shell" contentClassName="user-transfers-content">
          <MisTrasladosCliente Traslados={Traslados} pestanaInicial={pestañaActiva} />
        </MobileShell>
      </div>

      {/* VISTA ESCRITORIO (>= 1024px): Dashboard de Gestión de Traslados */}
      <div className="hidden lg:flex h-full w-full overflow-hidden">
        <MisViajesDesktop
          traslados={Traslados}
          nombreUsuario={usuario?.nombre}
          pestanaInicial="todos"
          busquedaInicial={typeof buscar === "string" ? buscar : ""}
          notificaciones={resultado.estado === "ok" ? resultado.notificaciones : []}
        />
      </div>
    </>
  );
}
