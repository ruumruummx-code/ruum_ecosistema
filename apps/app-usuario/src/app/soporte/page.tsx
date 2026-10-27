import type { Metadata } from "next";
import Link from "next/link";
import type { Database } from "@ruum/shared/types";
import { Aviso, Button, MobileShell } from "@ruum/ui";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { SoporteCliente } from "./SoporteCliente";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";

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
    return { estado: "sin_sesion" };
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

  if (resultado.estado === "error") {
    return (
      <>
        <NavegacionUsuario variante="claro" />
        <MobileShell variant="compact" navInferiorVisible={false} className="user-v2-scope user-support-shell" contentClassName="user-support-content">
          <div className="py-12 text-center">
            <Aviso tono="danger">
              No pudimos cargar tu información en este momento. Inténtalo de nuevo en unos segundos.
            </Aviso>
            <div className="mt-6 flex justify-center">
              <Link href="/soporte">
                <Button className="w-full sm:w-auto">Reintentar</Button>
              </Link>
            </div>
          </div>
        </MobileShell>
      </>
    );
  }

  const usuario = resultado.estado === "ok" ? resultado.usuario : null;
  const traslados = resultado.estado === "ok" ? resultado.traslados : [];

  return (
    <>
      {/* VISTA MÓVIL (< 1024px) */}
      <div className="lg:hidden flex flex-col h-full w-full">
        <NavegacionUsuario variante="claro" nombreUsuario={usuario?.nombre} />
        <MobileShell variant="compact" navInferiorVisible={false} className="user-v2-scope user-support-shell" contentClassName="user-support-content">
          <SoporteCliente
            usuario={usuario}
            traslados={traslados}
            viajePreseleccionado={viaje}
            motivoPreseleccionado={motivo}
            canalPreseleccionado={canal}
          />
        </MobileShell>
      </div>

      {/* VISTA ESCRITORIO (>= 1024px): Con UserDashboardLayout */}
      <div className="hidden lg:flex h-full w-full overflow-hidden">
        <UserDashboardLayout
          usuario={usuario}
          nombre={usuario?.nombre}
        >
          <div className="mx-auto max-w-5xl space-y-6">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--ruum-text)]">
                Ayuda y soporte
              </h1>
              <p className="mt-1 text-xs text-[var(--ruum-text-secondary)]">
                Resuelve dudas, consulta el estado de tus aclaraciones y contacta a nuestro equipo de atención 24/7.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--rr-border,#e3eaf3)] bg-[var(--rr-header-bg,#ffffff)] p-6 shadow-xs">
              <SoporteCliente
                usuario={usuario}
                traslados={traslados}
                viajePreseleccionado={viaje}
                motivoPreseleccionado={motivo}
                canalPreseleccionado={canal}
              />
            </div>
          </div>
        </UserDashboardLayout>
      </div>
    </>
  );
}
