import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";
import { BotonReintentarSesion } from "../ReintentarSesion";
import { Aviso, Button, MobileShell } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { MisTrasladosCliente } from "./MisViajesCliente";
import { MisViajesDesktop } from "./MisViajesDesktop";
import { construirNotificaciones, type NotificacionInicio } from "../../lib/inicio";
import {
  obtenerListaTrasladosConsolidadaUsuario,
  type ViajeListaDTO,
  type ConteosTraslados,
  type OpcionesConsultaTraslados,
} from "../../lib/traslados-consulta";
import type { CategoriaPestana } from "../../lib/estados-traslado-policy";

export const metadata: Metadata = {
  title: "Mis Traslados — Ruum Ruum",
  robots: { index: false, follow: false },
};

type PestañaTraslados = CategoriaPestana;

const PESTANAS: { id: PestañaTraslados; etiqueta: string }[] = [
  { id: "activos", etiqueta: "Activos" },
  { id: "programados", etiqueta: "Programados" },
  { id: "finalizados", etiqueta: "Finalizados" },
  { id: "cancelados", etiqueta: "Cancelados" },
  { id: "en_revision", etiqueta: "En revisión" },
];

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
    pagina?: string;
    limite?: string;
    snapshot_version?: string;
  }>;
}) {
  const { tab, buscar, pagina, limite, snapshot_version } = await searchParams;
  const numPagina = Number(pagina) > 0 ? Number(pagina) : 1;
  const numLimite = Number(limite) > 0 ? Number(limite) : 10;
  const pestañaActiva = PESTANAS.some((pestaña) => pestaña.id === tab)
    ? (tab as PestañaTraslados)
    : "activos";

  const resultado = await obtenerTraslados({
    pagina: numPagina,
    limite: numLimite,
    tab,
    buscar,
    snapshotVersionCliente: snapshot_version,
  });

  if (resultado.estado === "error") {
    const aviso = (
      <div className="space-y-5 p-6 text-center">
        <Aviso tono="danger">
          No pudimos cargar tus traslados en este momento. Inténtalo de nuevo en unos segundos.
        </Aviso>
        <div className="flex justify-center gap-3">
          <BotonReintentarSesion />
          <Link href="/soporte">
            <Button>Reportar un problema</Button>
          </Link>
        </div>
      </div>
    );
    return (
      <>
        <div className="lg:hidden">
          <NavegacionUsuario variante="claro" />
          <MobileShell as="main" variant="compact" navInferiorVisible={true}>
            {aviso}
          </MobileShell>
        </div>
        <div className="hidden lg:flex">
          <UserDashboardLayout>{aviso}</UserDashboardLayout>
        </div>
      </>
    );
  }

  if (resultado.estado === "sin_sesion") redirect("/login");
  const Traslados = resultado.estado === "ok" ? resultado.traslados : [];
  const usuario = resultado.estado === "ok" ? resultado.usuario : null;
  const gastoConfirmado = resultado.estado === "ok" ? resultado.gastoConfirmadoTotal : 0;
  const snapshotVersion = resultado.estado === "ok" ? resultado.snapshotVersion : undefined;

  return (
    <>
      {/* VISTA MÓVIL (< 1024px): Mobile-first con soporte de categorías y fail-closed */}
      <div className="lg:hidden flex flex-col h-full w-full">
        <NavegacionUsuario
          variante="claro"
          notificaciones={resultado.estado === "ok" ? resultado.notificaciones : []}
        />
        <MobileShell
          as="main"
          variant="compact"
          navInferiorVisible={true}
          className="user-v2-scope user-transfers-shell"
          contentClassName="user-transfers-content"
        >
          <MisTrasladosCliente
            Traslados={Traslados}
            pestanaInicial={pestañaActiva}
            gastoConfirmadoServidor={gastoConfirmado}
            snapshotVersion={snapshotVersion}
          />
        </MobileShell>
      </div>

      {/* VISTA ESCRITORIO (>= 1024px): Dashboard de Gestión con métricas confirmadas */}
      <div className="hidden lg:flex h-full w-full">
        <MisViajesDesktop
          traslados={Traslados}
          nombreUsuario={usuario?.nombre}
          pestanaInicial={PESTANAS.some((p) => p.id === tab) ? pestañaActiva : "todos"}
          busquedaInicial={typeof buscar === "string" ? buscar : ""}
          notificaciones={resultado.estado === "ok" ? resultado.notificaciones : []}
          gastoConfirmadoServidor={gastoConfirmado}
          snapshotVersion={snapshotVersion}
        />
      </div>
    </>
  );
}
