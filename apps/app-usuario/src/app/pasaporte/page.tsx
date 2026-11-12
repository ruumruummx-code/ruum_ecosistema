import Link from "next/link";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "../../lib/supabase-server";
import { logStructuredWarn } from "../../lib/logger";
import { listarTrasladosDeUsuario, obtenerUsuarioActual } from "@ruum/api/services";
import { UserResponsiveLayout } from "../../components/layout/UserResponsiveLayout";
import { Icono, Aviso } from "@ruum/ui";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";
import { BotonReintentarSesion } from "../ReintentarSesion";
import { obtenerViajeActivo } from "../../lib/inicio";
import { HistorialPasaportes, type PasaporteAnterior } from "./HistorialPasaportes";

function ErrorPasaporte() {
  return <UserDashboardLayout><div className="mx-auto max-w-xl space-y-5 py-12 text-center"><Aviso tono="danger">No pudimos cargar tu pasaporte en este momento. Reintenta para consultar tus traslados.</Aviso><BotonReintentarSesion /><Link href="/mis-viajes" className="block underline">Volver a Mis traslados</Link></div></UserDashboardLayout>;
}

// El destino y el historial dependen de la sesión y de sus traslados. Evita
// que el despliegue genere una versión estática compartida entre sesiones.
export const dynamic = "force-dynamic";

export default async function PaginaPasaporte() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return <ErrorPasaporte />;
  }

  let usuario = null;
  let traslados: Awaited<ReturnType<typeof listarTrasladosDeUsuario>> = [];

  try {
    const cliente = await crearClienteServidor();
    usuario = await obtenerUsuarioActual(cliente);
    if (usuario) {
      traslados = await listarTrasladosDeUsuario(cliente, usuario.id);
    }
  } catch (err) {
    // Falla de red o sesión ausente
    logStructuredWarn("pasaporte", "carga_pasaporte_activo_fallida", err);
    return <ErrorPasaporte />;
  }

  if (!usuario) {
    const login = new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
    login.searchParams.set("reason", "authentication_required");
    login.searchParams.set("next", "/pasaporte");
    redirect(`${login.pathname}${login.search}`);
  }

  const activo = obtenerViajeActivo(traslados.filter(t => Boolean(t.traslado_id)));

  if (activo?.traslado_id) {
    redirect(`/viajes/${activo.traslado_id}`);
  }

  const anteriores: PasaporteAnterior[] = traslados.flatMap(t => {
    if (!t.traslado_id || t.estado === "servicio_cancelado" || t.estado === "traslado_fallido") return [];
    const finalizado = Boolean(t.cerrado_en) || t.estado_operativo === "closed" ||
      ["servicio_cerrado", "cierre_operativo_con_incidencia_abierta", "reclamo_resuelto", "disputa_resuelta"].includes(t.estado ?? "");
    if (!finalizado) return [];
    return [{ id: t.traslado_id, marca: t.vehiculo_marca, modelo: t.vehiculo_modelo, anio: t.vehiculo_anio,
      placas: t.vehiculo_placas, origen: t.origen_ciudad, destino: t.destino_ciudad, cerradoEn: t.cerrado_en, creadoEn: t.creado_en }];
  });
  if (anteriores.length) {
    return <UserResponsiveLayout nombre={usuario.nombre} mobileShell mobileNavigation mobileBottomNavigation>
      <HistorialPasaportes pasaportes={anteriores} />
    </UserResponsiveLayout>;
  }

  // Vacío solo si no hay traslado activo ni pasaportes finalizados disponibles.
  return (
    <>
      <UserResponsiveLayout nombre={usuario.nombre} mobileShell mobileNavigation mobileBottomNavigation>
        <div className="user-empty-passport flex min-h-[60vh] flex-col items-center justify-center p-6 text-center" aria-live="polite">
          <div className="flex size-16 items-center justify-center rounded-full bg-[var(--user-color-surface)] text-[var(--user-color-action)] shadow-sm border border-[var(--user-color-border)] mb-4">
            <Icono d="M9 12h6 M9 16h6 M5 21h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" className="size-8" />
          </div>
          <h1 className="font-display text-xl font-bold text-[var(--user-color-primary)] sm:text-2xl">
            Aún no tienes traslados activos
          </h1>
          <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-[var(--user-color-muted)]">
            El Pasaporte Digital documenta la ruta, la custodia y la evidencia fotográfica en tiempo real de tu vehículo durante su traslado.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/viajes/nuevo"
              className="user-v2-primary-button inline-flex min-h-12 items-center justify-center rounded-xl px-6 font-semibold"
            >
              Solicitar nuevo traslado
            </Link>
            {traslados.length > 0 && (
              <Link
                href="/mis-viajes"
                className="user-v2-secondary-button inline-flex min-h-12 items-center justify-center rounded-xl px-6 font-semibold"
              >
                Ver historial de traslados ({traslados.length})
              </Link>
            )}
          </div>
        </div>
      </UserResponsiveLayout>
    </>
  );
}
