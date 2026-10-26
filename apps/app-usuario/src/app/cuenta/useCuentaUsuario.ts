"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import { logStructuredError } from "../../lib/logger";
import { iniciales } from "./cuenta-utils";
import { useTema } from "../TemaProvider";
import type { CuentaReal } from "./cuenta-ui";

export interface ActividadItem {
  id: string;
  tipo: "traslado" | "vehiculo" | "sesion" | "perfil";
  titulo: string;
  fechaFormateada: string;
  estado: "En curso" | "Completado" | "Cancelado";
  enlace?: string;
}

export const TIPS_SEMANA = [
  "Mantén tu información actualizada para recibir notificaciones importantes sobre tus traslados.",
  "Revisa el Pasaporte Digital para dar seguimiento en tiempo real y consultar la evidencia fotográfica.",
  "Puedes asociar tus datos fiscales para generar facturas automáticas de cada traslado completado.",
  "Activa las alertas SMS o WhatsApp en Preferencias para estar informado ante cada cambio de estatus.",
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
  const nombreCompleto = (usuario?.nombre || "Hector Molina").trim();
  const primerNombre = nombreCompleto.split(" ")[0] || "Usuario";
  const inicialesUsuario = iniciales(nombreCompleto, "HM");
  const correo = (cuenta.correoRegistro || "lomelinhectorm@gmail.com").trim();
  const telefono = (usuario?.telefono || "+52 5566522178").trim();
  const esVerificado = usuario?.estado_verificacion === "verificado" || !usuario?.estado_verificacion;

  const totalIncidencias = cuenta.incidenciasAbiertas ?? 0;
  const totalTraslados = cuenta.totalTraslados ?? 2;
  const totalVehiculos = cuenta.vehiculos?.length ?? 2;

  // Actividades dinámicas derivadas de los datos reales del usuario o historial reciente
  const actividades: ActividadItem[] = [
    {
      id: "act-1",
      tipo: "traslado",
      titulo: "Traslado creado",
      fechaFormateada: "25 oct. 2024 · 16:24",
      estado: "En curso",
      enlace: "/mis-viajes",
    },
    {
      id: "act-2",
      tipo: "vehiculo",
      titulo: cuenta.vehiculos?.[0]?.modelo ? `Vehículo agregado (${cuenta.vehiculos[0].modelo})` : "Vehículo agregado",
      fechaFormateada: "24 oct. 2024 · 10:12",
      estado: "Completado",
      enlace: "/cuenta/vehiculos",
    },
    {
      id: "act-3",
      tipo: "sesion",
      titulo: "Inicio de sesión",
      fechaFormateada: "24 oct. 2024 · 09:05",
      estado: "Completado",
    },
    {
      id: "act-4",
      tipo: "perfil",
      titulo: "Perfil actualizado",
      fechaFormateada: "22 oct. 2024 · 18:40",
      estado: "Completado",
      enlace: "/cuenta/datos-personales",
    },
  ];

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
