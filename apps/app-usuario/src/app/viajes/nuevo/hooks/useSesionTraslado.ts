import { useEffect } from "react";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import { listarVehiculosDeUsuario, obtenerUsuarioActual } from "@ruum/api/services";
import { registrarEventoUx } from "@/lib/analytics";
import type { TipoCuenta } from "@ruum/shared/types";
import type { SettersFormulario } from "./useSettersFormulario";

interface DependenciasSesion {
  router: { replace: (url: string) => void };
  setBloqueoVerificacion: SettersFormulario["setBloqueoVerificacion"];
  setCargandoSesion: SettersFormulario["setCargandoSesion"];
  setResultado: SettersFormulario["setResultado"];
  setSesionReal: SettersFormulario["setSesionReal"];
  setUsuario: SettersFormulario["setUsuario"];
  setVehiculosGuardados: SettersFormulario["setVehiculosGuardados"];
}

/**
 * God-hook (auditoría): carga de sesión de usuario y vehículos al montar.
 * Se mueve intacta.
 */
export function useSesionTraslado({
  router,
  setBloqueoVerificacion,
  setCargandoSesion,
  setResultado,
  setSesionReal,
  setUsuario,
  setVehiculosGuardados,
}: DependenciasSesion) {
  useEffect(() => {
    async function cargarUsuario() {
      if (!tieneSupabaseConfigurado()) {
        setCargandoSesion(false);
        return;
      }
      try {
        const cliente = crearClienteNavegador();
        const real = await obtenerUsuarioActual(cliente);
        if (!real) {
          registrarEventoUx("traslado_nuevo_sin_sesion", { origen: "carga" });
          router.replace("/login?next=/viajes/nuevo&reason=authentication_required");
          return;
        }
        if (real) {
          if (real.estado_verificacion !== "verificado") {
            setBloqueoVerificacion(
              real.estado_verificacion === "en_revision"
                ? "Tu cuenta está en revisión. Podrás solicitar traslados cuando el equipo apruebe tu documentación."
                : "Necesitamos verificar tu cuenta antes de que solicites un traslado."
            );
            return;
          }
          setUsuario({
            id: real.id,
            tipo_cuenta: real.tipo_cuenta as TipoCuenta,
            rol: real.rol,
            ...(real.empresa_id ? { empresa_id: real.empresa_id } : {}),
            estado_verificacion: real.estado_verificacion,
            traslados_completados_sin_incidencia: real.traslados_completados_sin_incidencia,
            metodo_pago_registrado: real.metodo_pago_registrado,
            creado_en: real.creado_en
          });
          setSesionReal(true);
          setVehiculosGuardados(await listarVehiculosDeUsuario(cliente, real.id));
        }
      } catch (err) {
        setResultado({
          ok: false,
          mensaje: err instanceof Error ? err.message : "No pudimos validar tu sesión. Intenta iniciar sesión de nuevo."
        });
      } finally {
        setCargandoSesion(false);
      }
    }
    cargarUsuario();
  }, [router, setBloqueoVerificacion, setCargandoSesion, setResultado, setSesionReal, setUsuario, setVehiculosGuardados]);
}
