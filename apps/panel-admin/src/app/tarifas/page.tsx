"use client";

import { useEffect, useMemo, useState } from "react";
import { Aviso } from "@ruum/ui";
import { AdminPageHeader } from "../admin-ui";
import { AdminDialog } from "../admin-components";
import {
  obtenerConfiguracionTarifas,
  type ConfiguracionTarifas
} from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import {
  VACIO,
  SECCIONES_TARIFAS,
  type SeccionTarifas,
  type TarifaConfigRow
} from "./TarifasTipos";
import {
  ResumenVigente,
  PrincipiosTarifarios,
  FormulaVigente
} from "./TarifasComponentes";
import { ParametrosNormativos } from "./ParametrosNormativos";
import {
  SimuladorNormativo,
  PoliticaVigente,
  AuditoriaTarifaria
} from "./TarifasVistasAdicionales";

export default function PaginaTarifasAdmin() {
  const [datos, setDatos] = useState<ConfiguracionTarifas>(VACIO);
  const [configVista, setConfigVista] = useState<TarifaConfigRow | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seccionActiva, setSeccionActiva] = useState<SeccionTarifas>("resumen");
  const [hayCambiosSinGuardar, setHayCambiosSinGuardar] = useState(false);
  const [seccionPendiente, setSeccionPendiente] = useState<SeccionTarifas | null>(null);
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState<Date | null>(null);

  async function cargar() {
    if (!tieneSupabaseConfigurado()) {
      setError("Supabase no está configurado en este entorno.");
      setCargando(false);
      return;
    }
    try {
      const cliente = crearClienteNavegador();
      const configuracion = await obtenerConfiguracionTarifas(cliente);
      setDatos(configuracion);
      setConfigVista(configuracion.config);
      setUltimaSincronizacion(new Date());
      setError(
        configuracion.vehiculo.length === 0
          ? "No se encontró configuración de tarifas. Si no eres admin, este módulo no te mostrará datos (RLS admin-only)."
          : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la política tarifaria.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => void cargar(), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hayCambiosSinGuardar) return;
    function confirmarSalida(evento: BeforeUnloadEvent) {
      evento.preventDefault();
      evento.returnValue = "";
    }
    window.addEventListener("beforeunload", confirmarSalida);
    return () => window.removeEventListener("beforeunload", confirmarSalida);
  }, [hayCambiosSinGuardar]);

  function cambiarSeccion(siguiente: SeccionTarifas) {
    if (siguiente === seccionActiva) return;
    if (hayCambiosSinGuardar) {
      setSeccionPendiente(siguiente);
      return;
    }
    setSeccionActiva(siguiente);
  }

  function confirmarCambioSeccion() {
    if (!seccionPendiente) return;
    setHayCambiosSinGuardar(false);
    setSeccionActiva(seccionPendiente);
    setSeccionPendiente(null);
  }

  const cliente = tieneSupabaseConfigurado() ? crearClienteNavegador() : null;
  const datosFormula = useMemo(
    () => ({ ...datos, config: configVista ?? datos.config }),
    [configVista, datos]
  );
  const modoActual =
    seccionActiva === "base" || seccionActiva === "factores" || seccionActiva === "versiones"
      ? "Editando"
      : "Consultando";

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 sm:px-8 sm:py-10">
      <AdminDialog
        open={seccionPendiente !== null}
        title="Descartar cambios sin guardar"
        description="Hay modificaciones sin guardar. Al cambiar de sección se descartará el borrador actual."
        onOpenChange={(abierto) => {
          if (!abierto) setSeccionPendiente(null);
        }}
        footer={
          <>
            <button
              type="button"
              onClick={() => setSeccionPendiente(null)}
              className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarCambioSeccion}
              className="rounded-lg border border-ui-danger/30 bg-ui-danger-soft px-4 py-2 font-body text-sm font-semibold text-ui-danger hover:bg-ui-danger hover:text-ui-on-brand"
            >
              Continuar
            </button>
          </>
        }
      >
        <span />
      </AdminDialog>
      <AdminPageHeader
        etiqueta="Administración"
        titulo="Tarifas"
        descripcion="Políticas aprobadas, fórmula auditable y simulación del precio aplicable a cada traslado."
        breadcrumb={[{ label: "Administración" }, { label: "Tarifas" }]}
        estadoConexion={error ? "sin_conexion" : cargando ? "actualizando" : "conectado"}
        ultimaActualizacion={ultimaSincronizacion}
        contadorResultados={
          datos.vehiculo.length +
          datos.gama.length +
          datos.condicion.length +
          datos.horario.length +
          datos.dia.length
        }
      />

      {error && (
        <div className="mt-4">
          <Aviso tono="atencion">{error}</Aviso>
        </div>
      )}

      {cargando ? (
        <div className="mt-6 grid gap-6" aria-label="Cargando política tarifaria" aria-busy="true">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-lg border border-ui-line bg-ui-card p-6">
              <div className="h-5 w-48 animate-pulse rounded bg-ui-muted" />
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((campo) => (
                  <div key={campo} className="h-12 animate-pulse rounded-lg bg-ui-muted" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-6">
          <ResumenVigente datos={datos} modo={modoActual} hayCambios={hayCambiosSinGuardar} />
          <nav
            className="sticky top-0 z-30 -mx-2 rounded-lg border border-ui-line bg-ui-card px-2 py-2 shadow-ui-md backdrop-blur"
            aria-label="Secciones de tarifas"
          >
            <div className="flex gap-1 overflow-x-auto">
              {SECCIONES_TARIFAS.map((seccion) => (
                <button
                  key={seccion.id}
                  type="button"
                  onClick={() => cambiarSeccion(seccion.id)}
                  aria-current={seccionActiva === seccion.id ? "page" : undefined}
                  className={[
                    "shrink-0 rounded-lg px-4 py-2.5 font-body text-sm font-semibold transition-colors",
                    seccionActiva === seccion.id
                      ? "bg-ui-brand text-ui-fg"
                      : "text-ui-fg-muted hover:bg-ui-muted hover:text-ui-fg"
                  ].join(" ")}
                >
                  {seccion.etiqueta}
                </button>
              ))}
            </div>
          </nav>

          {seccionActiva === "resumen" && (
            <>
              <PrincipiosTarifarios />
              <FormulaVigente datos={datosFormula} />
            </>
          )}
          {seccionActiva === "base" && (
            <ParametrosNormativos
              key={`base-${datos.config?.actualizado_en ?? "sin-config"}`}
              seccion="base"
              datos={datos}
              cliente={cliente}
              onGuardado={cargar}
              onConfigVista={setConfigVista}
              onDirtyChange={setHayCambiosSinGuardar}
            />
          )}
          {seccionActiva === "factores" && (
            <ParametrosNormativos
              key={`factores-${datos.config?.actualizado_en ?? "sin-config"}`}
              seccion="factores"
              datos={datos}
              cliente={cliente}
              onGuardado={cargar}
              onConfigVista={setConfigVista}
              onDirtyChange={setHayCambiosSinGuardar}
            />
          )}
          {seccionActiva === "simulador" && <SimuladorNormativo datos={datos} />}
          {seccionActiva === "versiones" && (
            <PoliticaVigente
              key={datos.config?.actualizado_en ?? "sin-config"}
              datos={datos}
              cliente={cliente}
              onGuardado={cargar}
              onDirtyChange={setHayCambiosSinGuardar}
            />
          )}
          {seccionActiva === "auditoria" && <AuditoriaTarifaria datos={datos} />}
        </div>
      )}
    </main>
  );
}
