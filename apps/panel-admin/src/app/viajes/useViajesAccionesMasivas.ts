"use client";

import { useState } from "react";
import {
  obtenerAdminActual,
  registrarEvento,
  listarAuditoriaOperativaTraslados,
  ejecutarAccionMasiva as ejecutarAccionMasivaAdmin,
  exportarEvidenciaFirmada,
  resolverUrlEvidencia
} from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import type {
  PasaporteRow,
  AccionMasivaConfig,
  EstadoAccionMasiva,
  ResultadoAccionMasiva,
  AuditoriaOperacionMasiva,
  PrioridadOperativa
} from "./ViajesTipos";
import {
  exportarTrasladosCsv,
  descargarArchivo
} from "./ViajesTipos";

export function useViajesAccionesMasivas({
  trasladosSeleccionados,
  setAuditoriaMasiva
}: {
  trasladosSeleccionados: PasaporteRow[];
  setAuditoriaMasiva: (fn: (prev: AuditoriaOperacionMasiva[]) => AuditoriaOperacionMasiva[]) => void;
}) {
  const [accionMasiva, setAccionMasiva] = useState<AccionMasivaConfig | null>(null);
  const [estadoAccionMasiva, setEstadoAccionMasiva] = useState<EstadoAccionMasiva>("pendiente");
  const [resultadosAccionMasiva, setResultadosAccionMasiva] = useState<ResultadoAccionMasiva[]>([]);
  const [confirmacionMasiva, setConfirmacionMasiva] = useState(false);
  const [responsableMasivo, setResponsableMasivo] = useState("Supervisor");
  const [prioridadMasiva, setPrioridadMasiva] = useState<PrioridadOperativa>("alta");
  const [etiquetaMasiva, setEtiquetaMasiva] = useState("Corporativo");
  const [procesandoMasiva, setProcesandoMasiva] = useState(false);

  function abrirAccionMasiva(accion: AccionMasivaConfig) {
    setAccionMasiva(accion);
    setEstadoAccionMasiva("pendiente");
    setResultadosAccionMasiva([]);
    setConfirmacionMasiva(false);
  }

  async function registrarAuditoriaMasiva(
    accion: AccionMasivaConfig,
    resultados: ResultadoAccionMasiva[],
    opciones: { bloquearSiFalla?: boolean } = {}
  ) {
    if (!tieneSupabaseConfigurado()) return;
    try {
      const cliente = crearClienteNavegador();
      const admin = await obtenerAdminActual(cliente);
      if (!admin?.id) return;
      await Promise.all(
        resultados.map((resultado) =>
          registrarEvento(cliente, "modificacion_traslado_activo", "admin", admin.id, {
            traslado_id: resultado.trasladoId,
            accion_masiva: accion.id,
            resultado: resultado.estado,
            detalle: resultado.detalle,
            folio: resultado.folio
          })
        )
      );
      const audit = await listarAuditoriaOperativaTraslados(cliente).catch(() => []);
      setAuditoriaMasiva(() => audit);
    } catch {
      if (opciones.bloquearSiFalla) {
        throw new Error("No se pudo registrar la auditoría remota. La operación no se completó.");
      }
      setAuditoriaMasiva(() => []);
    }
  }

  async function ejecutarAccionMasiva() {
    if (!accionMasiva || trasladosSeleccionados.length === 0) return;
    setProcesandoMasiva(true);

    const ids = trasladosSeleccionados.map((t) => t.traslado_id).filter(Boolean) as string[];

    if (accionMasiva.id === "exportar") {
      exportarTrasladosCsv(trasladosSeleccionados);
      const resultados = ids.map((id) => ({
        trasladoId: id,
        folio: id.slice(0, 8).toUpperCase(),
        estado: "aplicado" as const,
        detalle: "Incluido en exportación CSV."
      }));
      await registrarAuditoriaMasiva(accionMasiva, resultados, { bloquearSiFalla: false });
      setResultadosAccionMasiva(resultados);
      setEstadoAccionMasiva("exitoso");
      setProcesandoMasiva(false);
      return;
    }

    if (accionMasiva.id === "descargar_evidencia") {
      try {
        const cliente = crearClienteNavegador();
        const evidencia = await exportarEvidenciaFirmada(cliente, ids);
        const conUrls = await Promise.all(
          evidencia.evidencia.map(async (item) => ({
            ...item,
            fotos: await Promise.all(
              item.fotos.map(async (foto) => ({
                ...foto,
                url_firmada: await resolverUrlEvidencia(cliente, foto.storage_path)
              }))
            )
          }))
        );
        descargarArchivo(
          `ruum-evidencia-seleccion-${new Date().toISOString().slice(0, 10)}.json`,
          "application/json",
          JSON.stringify(conUrls, null, 2)
        );
        const resultados = ids.map((id) => ({
          trasladoId: id,
          folio: id.slice(0, 8).toUpperCase(),
          estado: "aplicado" as const,
          detalle: "Evidencia exportada con URLs firmadas."
        }));
        await registrarAuditoriaMasiva(accionMasiva, resultados, { bloquearSiFalla: false });
        setResultadosAccionMasiva(resultados);
        setEstadoAccionMasiva("exitoso");
      } catch (err) {
        const resultados = ids.map((id) => ({
          trasladoId: id,
          folio: id.slice(0, 8).toUpperCase(),
          estado: "bloqueado" as const,
          detalle: err instanceof Error ? err.message : "Error al exportar evidencia."
        }));
        setResultadosAccionMasiva(resultados);
        setEstadoAccionMasiva("bloqueado");
      }
      setProcesandoMasiva(false);
      return;
    }

    try {
      const cliente = crearClienteNavegador();
      const payload: Record<string, unknown> = {};
      if (accionMasiva.id === "asignar_responsable") payload.responsable = responsableMasivo;
      if (accionMasiva.id === "cambiar_prioridad") payload.prioridad = prioridadMasiva;
      if (accionMasiva.id === "etiquetar") payload.etiqueta = etiquetaMasiva;

      const resultado = await ejecutarAccionMasivaAdmin(cliente, accionMasiva.id, ids, payload);
      const resultados = (resultado.resultados ?? []).map((r) => ({
        trasladoId: r.traslado_id,
        folio: r.traslado_id.slice(0, 8).toUpperCase(),
        estado: r.estado as ResultadoAccionMasiva["estado"],
        detalle: r.detalle
      }));
      await registrarAuditoriaMasiva(accionMasiva, resultados);
      setResultadosAccionMasiva(resultados);
      setEstadoAccionMasiva(
        resultado.bloqueados === resultado.total
          ? "bloqueado"
          : resultado.aplicados === resultado.total
          ? "exitoso"
          : "parcial"
      );
    } catch (err) {
      const resultados = ids.map((id) => ({
        trasladoId: id,
        folio: id.slice(0, 8).toUpperCase(),
        estado: "bloqueado" as const,
        detalle: err instanceof Error ? err.message : "Error al ejecutar acción masiva."
      }));
      setResultadosAccionMasiva(resultados);
      setEstadoAccionMasiva("bloqueado");
    }
    setProcesandoMasiva(false);
  }

  return {
    accionMasiva,
    setAccionMasiva,
    estadoAccionMasiva,
    resultadosAccionMasiva,
    confirmacionMasiva,
    setConfirmacionMasiva,
    responsableMasivo,
    setResponsableMasivo,
    prioridadMasiva,
    setPrioridadMasiva,
    etiquetaMasiva,
    setEtiquetaMasiva,
    procesandoMasiva,
    abrirAccionMasiva,
    ejecutarAccionMasiva
  };
}
