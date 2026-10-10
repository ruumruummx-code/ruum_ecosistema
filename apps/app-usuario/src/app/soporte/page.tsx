import type { Metadata } from "next";
import Link from "next/link";
import type { Database } from "@ruum/shared/types";
import { Aviso, Button } from "@ruum/ui";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { SoporteCliente } from "./SoporteCliente";

export const metadata: Metadata = {
  title: "Ayuda y soporte — Ruum Ruum",
  robots: { index: false, follow: false },
};

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];

/**
 * M5 (auditoría): mismo anti-patrón A-4 ya corregido en mis-viajes y cuenta.
 * Antes el catch devolvía `{ usuario: null, traslados: [] }`, indistinguible
 * de "sin sesión / sin traslados": con Supabase caído se pintaba el
 * formulario vacío como si el usuario no tuviera traslados. Ahora el error
 * es un estado explícito con aviso y reintento.
 */
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
  searchParams: Promise<{ viaje?: string; motivo?: string }>;
}) {
  const { viaje, motivo } = await searchParams;
  const resultado = await obtenerContexto();

  if (resultado.estado === "error") {
    return (
      <>
        <NavegacionUsuario variante="claro" />
        <main className="user-v2-scope user-v2-page user-v2-secondary-screen"><div className="user-v2-content user-v2-content--wide py-12 text-center">
          <Aviso tono="danger">
            No pudimos cargar tu información en este momento. Inténtalo de nuevo en unos segundos.
          </Aviso>
          <div className="mt-6 flex justify-center">
            <Link href="/soporte">
              <Button className="w-full sm:w-auto">Reintentar</Button>
            </Link>
          </div>
        </div>
        </main>
      </>
    );
  }

  // Sin sesión el middleware ya redirige a /login; si llegara aquí, el
  // formulario sin contexto de usuario es el comportamiento correcto.
  const usuario = resultado.estado === "ok" ? resultado.usuario : null;
  const traslados = resultado.estado === "ok" ? resultado.traslados : [];

  return (
    <>
      <NavegacionUsuario variante="claro" />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen"><div className="user-v2-content">
        <SoporteCliente
          usuario={usuario}
          traslados={traslados}
          viajePreseleccionado={viaje}
          motivoPreseleccionado={motivo}
        />
      </div>
    </main>
    </>
  );
}

