import DashboardCliente, { type DashboardInitialData } from "./DashboardCliente";
import { crearClienteServidor } from "../lib/supabase-server";
import { listarConductoresAdmin, listarIncidenciasAdmin, listarTrasladosActivosMapa, obtenerAdminActual, obtenerAlertasEmergenciaAdmin, obtenerIndicadoresAccionablesDashboard } from "@ruum/api/services";
import { normalizarRolAdmin, puedeVerRuta } from "../lib/roles-admin";

export const dynamic = "force-dynamic";

async function cargarInicial(): Promise<DashboardInitialData | null> {
  try {
    const cliente = await crearClienteServidor();
    const admin = await obtenerAdminActual(cliente);
    const rol = normalizarRolAdmin(admin?.rol_operativo);
    const [indicadores, incidencias, conductores, emergencias, trasladosActivos] = await Promise.all([
      obtenerIndicadoresAccionablesDashboard(cliente), listarIncidenciasAdmin(cliente),
      listarConductoresAdmin(cliente), obtenerAlertasEmergenciaAdmin(cliente),
      puedeVerRuta(rol, "/mapa") ? listarTrasladosActivosMapa(cliente).catch(() => []) : Promise.resolve([])
    ]);
    return {
      indicadores,
      incidencias: incidencias.filter((item) => !item.resuelta),
      conductoresDocVencido: conductores.filter((item) => !item.documentos_vigentes),
      emergencias,
      trasladosActivos,
      rol,
      cargadoEn: new Date().toISOString()
    };
  } catch (error) {
    console.error("[dashboard] lectura inicial de servidor fallida", error);
    return null;
  }
}

export default async function PaginaDashboard() {
  return <DashboardCliente inicial={await cargarInicial()} />;
}
