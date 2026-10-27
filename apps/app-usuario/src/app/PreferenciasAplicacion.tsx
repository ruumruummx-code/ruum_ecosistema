"use client";
import { useEffect } from "react";
import { obtenerPreferenciasUsuarioActual } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../lib/supabase-browser";
import { aplicarPreferenciasAplicacion } from "../lib/preferencias-aplicacion";
import { leerPendientes } from "../lib/preferencias-pendientes";

/** Restaura preferencias al entrar por cualquier pantalla y al cambiar de cuenta. */
export function PreferenciasAplicacion() {
  useEffect(() => {
    if (!tieneSupabaseConfigurado()) return;
    const cliente = crearClienteNavegador();
    let revision = 0;
    let ediciones = 0;
    const alEditar = () => { ediciones++; };
    window.addEventListener("ruum:preferencias-editadas", alEditar);
    let anterior: string | null | undefined;
    const { data: { subscription } } = cliente.auth.onAuthStateChange((_evento, sesion) => {
      const id = sesion?.user.id ?? null;
      if (id === anterior) return;
      anterior = id;
      const actual = ++revision;
      aplicarPreferenciasAplicacion({});
      const edicionInicial = ediciones;
      if (!id) return;
      // Consultar fuera del callback de Auth evita bloquear su renovación de sesión.
      void Promise.resolve().then(() => obtenerPreferenciasUsuarioActual(cliente)).then(usuario => {
        if (actual !== revision || edicionInicial !== ediciones || !usuario) return;
        const preferencias = usuario.preferencias && typeof usuario.preferencias === "object" && !Array.isArray(usuario.preferencias) ? usuario.preferencias : {};
        aplicarPreferenciasAplicacion({ ...preferencias, ...leerPendientes(usuario.id).general });
      }).catch(() => { /* No impedir el uso de la pantalla cuando falla la consulta auxiliar. */ });
    });
    return () => { revision++; subscription.unsubscribe(); window.removeEventListener("ruum:preferencias-editadas", alEditar); };
  }, []);
  return null;
}
