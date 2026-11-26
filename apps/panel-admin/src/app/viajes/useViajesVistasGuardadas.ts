"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { AdminDataTableSortState } from "../AdminDataTable";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import {
  obtenerPreferenciaAdmin,
  guardarPreferenciaAdmin,
  listarAuditoriaOperativaTraslados
} from "@ruum/api/services";
import type {
  VistaGuardada,
  AlcanceVistaGuardada,
  FiltrosAvanzados,
  AuditoriaOperacionMasiva
} from "./ViajesTipos";
import {
  COLUMNAS_OPERATIVAS_INICIALES,
  VISTAS_PREDEFINIDAS,
  PREF_VISTAS_GUARDADAS,
  PESTANAS
} from "./ViajesTipos";

export function useViajesVistasGuardadas({
  filtros,
  setFiltros,
  busqueda,
  setBusqueda,
  columnasVisibles,
  setColumnasVisibles,
  ordenTabla,
  setOrdenTabla,
  setPestana,
  setAuditoriaMasiva
}: {
  filtros: FiltrosAvanzados;
  setFiltros: Dispatch<SetStateAction<FiltrosAvanzados>>;
  busqueda: string;
  setBusqueda: Dispatch<SetStateAction<string>>;
  columnasVisibles: Set<string>;
  setColumnasVisibles: Dispatch<SetStateAction<Set<string>>>;
  ordenTabla: AdminDataTableSortState;
  setOrdenTabla: Dispatch<SetStateAction<AdminDataTableSortState>>;
  setPestana: Dispatch<SetStateAction<string>>;
  setAuditoriaMasiva: (fn: (prev: AuditoriaOperacionMasiva[]) => AuditoriaOperacionMasiva[]) => void;
}) {
  const [vistasGuardadas, setVistasGuardadas] = useState<VistaGuardada[]>([]);
  const [nombreVista, setNombreVista] = useState("");
  const [alcanceVista, setAlcanceVista] = useState<AlcanceVistaGuardada>("privada");

  useEffect(() => {
    if (!tieneSupabaseConfigurado()) return;
    const cliente = crearClienteNavegador();
    void Promise.all([
      obtenerPreferenciaAdmin<VistaGuardada[]>(cliente, PREF_VISTAS_GUARDADAS),
      listarAuditoriaOperativaTraslados(cliente).catch(() => [])
    ])
      .then(([vistas, auditoria]) => {
        setVistasGuardadas(vistas ?? []);
        setAuditoriaMasiva(() => auditoria ?? []);
      })
      .catch(() => {
        setVistasGuardadas([]);
        setAuditoriaMasiva(() => []);
      });
  }, [setAuditoriaMasiva]);

  useEffect(() => {
    if (!tieneSupabaseConfigurado()) return;
    const timer = window.setTimeout(
      () => void guardarPreferenciaAdmin(crearClienteNavegador(), PREF_VISTAS_GUARDADAS, vistasGuardadas),
      400
    );
    return () => window.clearTimeout(timer);
  }, [vistasGuardadas]);

  const vistasDisponibles = useMemo<VistaGuardada[]>(() => {
    const predefinidas = VISTAS_PREDEFINIDAS.map((vista) => ({
      ...vista,
      alcance: "compartida" as const,
      columnas: COLUMNAS_OPERATIVAS_INICIALES,
      orden: vista.id === "riesgo" ? ({ columnId: "sla", direction: "desc" } as AdminDataTableSortState) : ordenTabla,
      esPredeterminada: false
    }));
    return [...predefinidas, ...vistasGuardadas];
  }, [ordenTabla, vistasGuardadas]);

  function guardarVistaActual(esPredeterminada = false) {
    const nombre =
      nombreVista.trim() || `Vista ${new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
    const vista: VistaGuardada = {
      id: `${Date.now()}-${nombre.toLowerCase().replace(/\s+/g, "-")}`,
      nombre,
      alcance: alcanceVista,
      filtros,
      busqueda,
      columnas: Array.from(columnasVisibles),
      orden: ordenTabla,
      esPredeterminada
    };
    setVistasGuardadas((actual) => [
      vista,
      ...actual.map((item) => (esPredeterminada ? { ...item, esPredeterminada: false } : item))
    ]);
    setNombreVista("");
  }

  function aplicarVista(vista: VistaGuardada) {
    setFiltros(vista.filtros);
    setBusqueda(vista.busqueda);
    setColumnasVisibles(new Set(vista.columnas));
    setOrdenTabla(vista.orden);
    const p = PESTANAS.find((item) => item.filtro === vista.filtros.estado);
    setPestana(p?.id ?? "todos");
  }

  function establecerPredeterminada(vistaId: string) {
    setVistasGuardadas((actual) => actual.map((vista) => ({ ...vista, esPredeterminada: vista.id === vistaId })));
  }

  return {
    vistasGuardadas,
    vistasDisponibles,
    nombreVista,
    setNombreVista,
    alcanceVista,
    setAlcanceVista,
    guardarVistaActual,
    aplicarVista,
    establecerPredeterminada
  };
}
