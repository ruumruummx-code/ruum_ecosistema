import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";
import { BotonReintentarSesion } from "../ReintentarSesion";
import { CircleAlert } from "lucide-react";
import { Button, EmptyState, MarcoPantalla } from "@ruum/ui/base";
import type { Database } from "@ruum/shared/types";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { MisTraslados } from "./MisTraslados";
import { construirNotificaciones, type NotificacionInicio } from "../../lib/inicio";
import {
  obtenerListaTrasladosConsolidadaUsuario,
  type ViajeListaDTO,
  type ConteosTraslados,
  type OpcionesConsultaTraslados,
} from "../../lib/traslados-consulta";
import type { PestañaFiltro } from "./useGestionTraslados";

export const metadata: Metadata = {
  title: "Mis Traslados — Ruum Ruum",
  robots: { index: false, follow: false },
};

const PESTANAS: PestañaFiltro[] = ["todos", "activos", "programados", "finalizados", "cancelados", "en_revision"];

type UsuarioRow = Database["public"]["Tables"]["usuarios"]["Row"];

type ResultadoTraslados =
  | {
      estado: "ok";
      usuario: UsuarioRow;
      traslados: ViajeListaDTO[];
      conteos: ConteosTraslados;
      gastoConfirmadoTotal: number;
      snapshotVersion: string;
      snapshotDivergente: boolean;
      totalItems: number;
      pagina: number;
      limite: number;
      totalPaginas: number;
      notificaciones: NotificacionInicio[];
    }
  | { estado: "sin_sesion" }
  | { estado: "error" };

/**
 * RUUM-USR-F8-001 (CB-1 / T1, T3 / CA-1): Loader consolidado server-side con paginación real
 * y control de versiones de snapshot como fuente única de verdad.
 */
async function obtenerTraslados(opciones?: OpcionesConsultaTraslados): Promise<ResultadoTraslados> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return { estado: "sin_sesion" };

  try {
    const { crearClienteServidor } = await import("../../lib/supabase-server");
    const { obtenerUsuarioActual } = await import("@ruum/api/services");
    const cliente = await crearClienteServidor();
    const usuario = await obtenerUsuarioActual(cliente);

    if (!usuario) return { estado: "sin_sesion" };

    const consolidado = await obtenerListaTrasladosConsolidadaUsuario(cliente, usuario.id, opciones);
    const pasaportes = consolidado.items.map((it) => it.pasaporte);

    return {
      estado: "ok",
      usuario,
      notificaciones: construirNotificaciones(usuario, pasaportes),
      traslados: consolidado.items,
      conteos: consolidado.conteos,
      gastoConfirmadoTotal: consolidado.gastoConfirmadoTotal,
      snapshotVersion: consolidado.snapshotVersion,
      snapshotDivergente: consolidado.snapshotDivergente,
      totalItems: consolidado.totalItems,
      pagina: consolidado.pagina,
      limite: consolidado.limite,
      totalPaginas: consolidado.totalPaginas,
    };
  } catch (err) {
    console.error("[app-usuario:obtenerTraslados] supabase_error", {
      message: err instanceof Error ? err.message : String(err),
    });
    return { estado: "error" };
  }
}

export default async function PaginaMisTraslados({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    buscar?: string;
    tipo?: string;
    fecha?: string;
    pagina?: string;
    limite?: string;
    snapshot_version?: string;
  }>;
}) {
  const { tab, buscar, tipo, fecha, pagina, limite, snapshot_version } = await searchParams;
  const numPagina = Number(pagina) > 0 ? Number(pagina) : 1;
  const numLimite = Number(limite) > 0 ? Number(limite) : 10;
  const pestañaActiva: PestañaFiltro = PESTANAS.includes(tab as PestañaFiltro) ? (tab as PestañaFiltro) : "todos";

  const resultado = await obtenerTraslados({
    pagina: numPagina,
    limite: numLimite,
    tab: pestañaActiva,
    buscar,
    tipo,
    fecha,
    snapshotVersionCliente: snapshot_version,
  });

  if (resultado.estado === "error") {
    const aviso = (
      <div className="min-h-full bg-ui-bg px-4 pt-6 sm:px-6 lg:px-8">
        <EmptyState
          icono={<CircleAlert />}
          titulo="No pudimos cargar tus traslados"
          descripcion="Inténtalo de nuevo en unos segundos."
          accion={
            <div className="flex flex-wrap justify-center gap-3">
              <BotonReintentarSesion />
              <Button asChild variant="outline">
                <Link href="/soporte">Reportar un problema</Link>
              </Button>
            </div>
          }
        />
      </div>
    );
    return (
      <>
        <div className="flex h-full w-full flex-col lg:hidden">
          <NavegacionUsuario variante="claro" />
          <MarcoPantalla as="main" variant="wide" padding="none" conFondoCanvas={false} navInferiorVisible className="bg-ui-bg">
            {aviso}
          </MarcoPantalla>
        </div>
        <div className="hidden h-full w-full lg:flex">
          <UserDashboardLayout padding="ninguno" classNameContenido="bg-ui-bg">{aviso}</UserDashboardLayout>
        </div>
      </>
    );
  }

  if (resultado.estado === "sin_sesion") redirect("/login");
  const traslados = resultado.estado === "ok" ? resultado.traslados : [];
  const usuario = resultado.estado === "ok" ? resultado.usuario : null;
  const notificaciones = resultado.estado === "ok" ? resultado.notificaciones : [];
  const contenido = (
    <MisTraslados
      traslados={traslados}
      pestanaInicial={pestañaActiva}
      busquedaInicial={typeof buscar === "string" ? buscar : ""}
      gastoConfirmadoServidor={resultado.estado === "ok" ? resultado.gastoConfirmadoTotal : 0}
      servidor={resultado.estado === "ok" ? {
        conteos: resultado.conteos,
        totalItems: resultado.totalItems,
        pagina: resultado.pagina,
        totalPaginas: resultado.totalPaginas,
        limite: resultado.limite,
        tipo,
        fecha,
      } : undefined}
    />
  );

  /* Una sola pantalla (MisTraslados) dentro del marco de navegación de cada
     tamaño: barra inferior en móvil, barra lateral desde 1024px. */
  return (
    <>
      <div className="flex h-full w-full flex-col lg:hidden">
        <NavegacionUsuario variante="claro" notificaciones={notificaciones} />
        <MarcoPantalla as="main" variant="wide" padding="none" conFondoCanvas={false} navInferiorVisible className="bg-ui-bg">
          {contenido}
        </MarcoPantalla>
      </div>
      <div className="hidden h-full w-full lg:flex">
        <UserDashboardLayout
          idContenido="desktopMainContentTraslados"
          nombre={usuario?.nombre}
          notificaciones={notificaciones}
          dashboardHeader
          padding="ninguno"
          classNameContenido="bg-ui-bg"
        >
          {contenido}
        </UserDashboardLayout>
      </div>
    </>
  );
}
