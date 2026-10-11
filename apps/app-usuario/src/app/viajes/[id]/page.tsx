import { NavegacionUsuario } from "../../NavegacionUsuario";
import { obtenerDatos } from "./obtenerDatosTraslado";
import { TrasladoNoEncontrado } from "./TrasladoNoEncontrado";
import { PasaporteDigitalSegmentado } from "./PasaporteDigitalSegmentado";

// El Pasaporte contiene datos protegidos por sesión y cambia con el estado
// operativo del traslado; nunca debe prerenderizarse ni servirse desde caché.
export const dynamic = "force-dynamic";
export const dynamicParams = true;

export default async function PaginaTraslado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const {
    pasaporte,
    traslado,
    vehiculo,
    conductor,
    evidencia,
    incidencias,
    disputas,
    reclamosSeguro,
    calificacion,
    pagos,
    ultimaUbicacion,
  } = await obtenerDatos(id);

  // R2 defense-in-depth: verificar que el traslado pertenece al usuario autenticado (RLS puede fallar)
  if (pasaporte?.usuario_id) {
    try {
      const { crearClienteServidor: crearClienteAuth } = await import("@/lib/supabase-server");
      const clienteAuth = await crearClienteAuth();
      const {
        data: { user },
      } = await clienteAuth.auth.getUser();
      if (!user) {
        // Tratar como no encontrado para no filtrar existencia (IDOR)
        return <TrasladoNoEncontrado />;
      }

      // `pasaporte.usuario_id` referencia public.usuarios.id; no es el mismo
      // UUID que auth.users.id. Resolver primero el perfil evita rechazar
      // traslados legítimos como "no encontrados".
      const { obtenerUsuarioIdPorAuth } = await import("@ruum/api/identity");
      const perfilId = await obtenerUsuarioIdPorAuth(clienteAuth, user.id);
      if (!perfilId || perfilId !== pasaporte.usuario_id) {
        // Tratar como no encontrado para no filtrar existencia (IDOR)
        return <TrasladoNoEncontrado />;
      }
    } catch {
      // Si falla la verificación de sesión, no exponer datos
      return <TrasladoNoEncontrado variante="sesion" />;
    }
  }

  if (!pasaporte) {
    return <TrasladoNoEncontrado conInicio />;
  }

  if (!pasaporte.traslado_id || !pasaporte.estado) {
    return <TrasladoNoEncontrado variante="incompleto" />;
  }

  return (
    <>
      <NavegacionUsuario variante="claro" />
      <main className="user-v2-scope user-v2-page user-v2-secondary-screen">
        <PasaporteDigitalSegmentado
          pasaporte={pasaporte}
          traslado={traslado}
          vehiculo={vehiculo}
          conductor={conductor}
          evidencia={evidencia}
          incidencias={incidencias}
          disputas={disputas}
          reclamosSeguro={reclamosSeguro}
          calificacion={calificacion}
          pagos={pagos}
          ultimaUbicacion={ultimaUbicacion}
        />
      </main>
    </>
  );
}
