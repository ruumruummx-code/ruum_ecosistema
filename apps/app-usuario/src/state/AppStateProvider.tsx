"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type Context, type ReactNode } from "react";
import type { UbicacionTraslado } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import {
  crearEstadoNuevoTrasladoInicial,
  crearEstadoRealtimeTraslado,
  nuevoTrasladoReducer,
  realtimeTrasladosReducer,
  type EstadoRealtimeTraslado,
  type NuevoTrasladoAction,
  type NuevoTrasladoState,
  type RealtimeTrasladoPatch,
  type RealtimeTrasladosAction,
  type RealtimeTrasladosState,
  type SetNuevoTrasladoField
} from "./app-state";

const NuevoTrasladoStateContext = createContext<NuevoTrasladoState | null>(null);
const NuevoTrasladoDispatchContext = createContext<((action: NuevoTrasladoAction) => void) | null>(null);
const RealtimeStateContext = createContext<RealtimeTrasladosState | null>(null);
const RealtimeDispatchContext = createContext<((action: RealtimeTrasladosAction) => void) | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [nuevoTraslado, dispatchNuevoTraslado] = useReducer(
    nuevoTrasladoReducer,
    undefined,
    crearEstadoNuevoTrasladoInicial
  );
  const [trasladosRealtime, dispatchRealtime] = useReducer(realtimeTrasladosReducer, {});
  // RC-12: identidad del usuario anterior para detectar cambio de cuenta.
  const usuarioPrevioRef = useRef<string | null | undefined>(undefined);

  // RC-12: al cambiar de identidad (logout o cambio de cuenta en el mismo
  // dispositivo) se descarta el estado global y el borrador local para no
  // exponer datos del usuario anterior.
  useEffect(() => {
    if (!tieneSupabaseConfigurado()) return;
    const cliente = crearClienteNavegador();
    const { data: { subscription } } = cliente.auth.onAuthStateChange((_evento, sesion) => {
      const idActual = sesion?.user?.id ?? null;
      if (usuarioPrevioRef.current === undefined) {
        usuarioPrevioRef.current = idActual;
        return;
      }
      if (usuarioPrevioRef.current !== idActual) {
        usuarioPrevioRef.current = idActual;
        dispatchNuevoTraslado({ type: "reset" });
        dispatchRealtime({ type: "resetAll" });
        try {
          localStorage.removeItem("ruumruum.traslados-nuevo.borrador.v2");
        } catch {
          // localStorage no disponible: nada que limpiar.
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <NuevoTrasladoStateContext.Provider value={nuevoTraslado}>
      <NuevoTrasladoDispatchContext.Provider value={dispatchNuevoTraslado}>
        <RealtimeStateContext.Provider value={trasladosRealtime}>
          <RealtimeDispatchContext.Provider value={dispatchRealtime}>
            {children}
          </RealtimeDispatchContext.Provider>
        </RealtimeStateContext.Provider>
      </NuevoTrasladoDispatchContext.Provider>
    </NuevoTrasladoStateContext.Provider>
  );
}

function useRequiredContext<T>(context: Context<T | null>, nombre: string) {
  const value = useContext(context);
  if (value === null) throw new Error(`${nombre} debe usarse dentro de AppStateProvider`);
  return value;
}

export function useNuevoTrasladoState() {
  const state = useRequiredContext(NuevoTrasladoStateContext, "useNuevoTrasladoState");
  const dispatch = useRequiredContext(NuevoTrasladoDispatchContext, "useNuevoTrasladoState");

  const setField = useCallback<SetNuevoTrasladoField>((key, value) => {
    dispatch({ type: "set", key, value });
  }, [dispatch]);
  const reset = useCallback(() => dispatch({ type: "reset" }), [dispatch]);

  return useMemo(() => ({ state, setField, reset }), [reset, setField, state]);
}

export function useTrasladoRealtime(trasladoId: string) {
  const state = useRequiredContext(RealtimeStateContext, "useTrasladoRealtime");
  const dispatch = useRequiredContext(RealtimeDispatchContext, "useTrasladoRealtime");
  const traslado: EstadoRealtimeTraslado = state[trasladoId] ?? crearEstadoRealtimeTraslado();

  const inicializar = useCallback((ubicacionInicial: UbicacionTraslado | null = null) => {
    dispatch({ type: "init", trasladoId, ubicacionInicial });
  }, [dispatch, trasladoId]);
  const actualizar = useCallback((patch: RealtimeTrasladoPatch) => {
    dispatch({ type: "patch", trasladoId, patch });
  }, [dispatch, trasladoId]);
  const cargarMensajes = useCallback((mensajes: EstadoRealtimeTraslado["mensajes"]) => {
    dispatch({ type: "messages", trasladoId, mensajes });
  }, [dispatch, trasladoId]);
  const agregarMensaje = useCallback((mensaje: EstadoRealtimeTraslado["mensajes"][number]) => {
    dispatch({ type: "message", trasladoId, mensaje });
  }, [dispatch, trasladoId]);
  // Deuda realtime: la acción "clear" existía pero nadie la despachaba y cada
  // traslado visitado retenía chat/ubicación/mensajes toda la sesión SPA.
  const limpiar = useCallback(() => {
    dispatch({ type: "clear", trasladoId });
  }, [dispatch, trasladoId]);

  return useMemo(() => ({ ...traslado, inicializar, actualizar, cargarMensajes, agregarMensaje, limpiar }), [
    agregarMensaje,
    actualizar,
    cargarMensajes,
    inicializar,
    limpiar,
    traslado
  ]);
}
