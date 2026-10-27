"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import { logStructuredError } from "../../lib/logger";
import { iniciales } from "./cuenta-utils";
import { useTema } from "../TemaProvider";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import { TERMINOLOGIA_USUARIO } from "../../lib/glosario";
import type { CuentaReal } from "./cuenta-ui";

export interface ActividadItem {
  id: string;
  tipo: "traslado" | "vehiculo" | "sesion" | "perfil";
  titulo: string;
  fechaFormateada: string;
  estado: string;
  enlace?: string;
}

export const TIPS_SEMANA = [
  "Mantén tu información actualizada para recibir notificaciones importantes sobre tus traslados.",
  "Revisa el Pasaporte Digital para dar seguimiento en tiempo real y consultar la evidencia fotográfica.",
  "Consulta y actualiza tus datos fiscales desde Facturación.",
  "Revisa tus preferencias de notificaciones y los canales disponibles para tus traslados.",
];

export function useCuentaUsuario(cuenta: CuentaReal) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { tema, alternar } = useTema();

  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [errorSesion, setErrorSesion] = useState<string | null>(null);
  const [tipIndex, setTipIndex] = useState(0);
  const [seguridadModalAbierto, setSeguridadModalAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [dropdownPerfilAbierto, setDropdownPerfilAbierto] = useState(false);

  const salidaRef = useRef(false);

  const siguienteTip = useCallback(() => {
    setTipIndex((prev) => (prev + 1) % TIPS_SEMANA.length);
  }, []);

  const cerrarSesion = useCallback(async () => {
    if (salidaRef.current) return;
    salidaRef.current = true;
    setCerrandoSesion(true);
    setErrorSesion(null);

    try {
      const { error } = await crearClienteNavegador().auth.signOut();
      if (error) throw error;

      try {
        localStorage.removeItem("ruumruum.traslados-nuevo.borrador.v2");
        localStorage.removeItem("ruum-onboarding-paso");
        localStorage.removeItem("ruum-onboarding-paso:exp");
        localStorage.removeItem("ruum-onboarding-visto");
        localStorage.removeItem("ruum-onboarding-visto:exp");
      } catch {
        // Modo incógnito o sin localStorage disponible
      }

      startTransition(() => {
        router.replace("/login");
        router.refresh();
      });
    } catch (err) {
      logStructuredError("cuenta", "cerrar_sesion_fallido", err);
      setErrorSesion("No pudimos cerrar tu sesión. Intenta de nuevo.");
      setCerrandoSesion(false);
      salidaRef.current = false;
    }
  }, [router]);

  const usuario = cuenta.usuario;
  const nombreCompleto = usuario?.nombre?.trim() || "Usuario";
  const primerNombre = nombreCompleto.split(/\s+/)[0] || "Usuario";
  const inicialesUsuario = iniciales(nombreCompleto, "US");
  const correo = cuenta.correoRegistro?.trim() || "Sin correo registrado";
  const telefono = usuario?.telefono?.trim() || "Sin teléfono registrado";
  const esVerificado = usuario?.estado_verificacion === "verificado";

  const totalIncidencias = cuenta.incidenciasAbiertas ?? 0;
  const totalTraslados = cuenta.totalTraslados ?? 0;
  const totalVehiculos = cuenta.vehiculos?.length ?? 0;

  const estadoVerificacion = usuario?.estado_verificacion;
  const etiquetaVerificacion = esVerificado ? "Verificado" : estadoVerificacion === "rechazado" ? "Documentación rechazada" : estadoVerificacion === "en_revision" ? "En revisión" : "Pendiente de verificación";
  const fechaActividad = (fecha: string) => new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", dateStyle: "medium", timeStyle: "short" }).format(new Date(fecha));
  const actividades: ActividadItem[] = (cuenta.traslados ?? [])
    .filter(t => t.traslado_id && t.creado_en && Number.isFinite(Date.parse(t.creado_en)))
    .sort((a, b) => Date.parse(b.creado_en!) - Date.parse(a.creado_en!))
    .slice(0, 4)
    .map(t => ({
      id: t.traslado_id!,
      tipo: "traslado",
      titulo: [t.vehiculo_marca, t.vehiculo_modelo, t.vehiculo_placas].filter(Boolean).join(" · ") || "Traslado " + t.traslado_id!.slice(0, 8).toUpperCase(),
      fechaFormateada: "Creado: " + fechaActividad(t.creado_en!),
      estado: t.estado ? TERMINOLOGIA_USUARIO[t.estado] ?? ETIQUETA_ESTADO_TRASLADO[t.estado] : "Estado no disponible",
      enlace: "/viajes/" + t.traslado_id,
    }));

  return {
    // Estado de sesión
    cerrarSesion,
    cerrandoSesion,
    errorSesion,
    // Perfil y métricas
    usuario,
    nombreCompleto,
    primerNombre,
    inicialesUsuario,
    correo,
    telefono,
    esVerificado,
    etiquetaVerificacion,
    totalIncidencias,
    totalTraslados,
    totalVehiculos,
    // Actividad y consejos
    actividades,
    tipActual: TIPS_SEMANA[tipIndex],
    siguienteTip,
    seguridadModalAbierto,
    setSeguridadModalAbierto,
    // Búsqueda y menús
    busqueda,
    setBusqueda,
    dropdownPerfilAbierto,
    setDropdownPerfilAbierto,
    // Tema
    tema,
    alternarTema: alternar,
  };
}
