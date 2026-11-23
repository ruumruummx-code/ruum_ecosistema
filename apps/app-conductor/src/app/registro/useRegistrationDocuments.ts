import { useState } from "react";
import { subirDocumentoSolicitudConductor } from "@ruum/api/services";
import { createLogger, errorCode } from "@ruum/shared/utils";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import {
  ETIQUETA_DOCUMENTO,
  TIPOS_ARCHIVO_PERMITIDOS,
  TIPOS_DOCUMENTO,
  estadoInicialDocumentos,
  type DocumentoKey,
  type EstadoDocumento
} from "./registration-types";

const logger = createLogger("registration");

export function useRegistrationDocuments({
  setCampoError,
  limpiarErrorCampo,
  registrarTelemetria,
  paso
}: {
  setCampoError: (campo: string, mensaje: string) => boolean;
  limpiarErrorCampo: (campo: string) => void;
  registrarTelemetria: (evento: "documento_fallo", pasoEvento?: number, codigo?: string) => void;
  paso: number;
}) {
  const [documentos, setDocumentos] = useState<Record<DocumentoKey, File | null>>({
    licenciaFrente: null,
    licenciaReverso: null,
    identificacionOficial: null
  });
  const [estadoDocumentos, setEstadoDocumentos] = useState<Record<DocumentoKey, EstadoDocumento>>(estadoInicialDocumentos);
  const [documentosRemotos, setDocumentosRemotos] = useState<Set<string>>(new Set());

  function documentoDisponible(campo: DocumentoKey) {
    return Boolean(documentos[campo] || documentosRemotos.has(TIPOS_DOCUMENTO[campo]));
  }

  function validarDocumento(campo: DocumentoKey) {
    return setCampoError(campo, documentoDisponible(campo) ? "" : "Carga este documento");
  }

  function cambiarDocumento(campo: DocumentoKey, archivo: File | null) {
    if (archivo && archivo.size > 5 * 1024 * 1024) {
      setDocumentos((prev) => ({ ...prev, [campo]: null }));
      setEstadoDocumentos((prev) => ({ ...prev, [campo]: "error" }));
      setCampoError(campo, "El archivo debe pesar máximo 5 MB");
      return;
    }
    if (archivo && !TIPOS_ARCHIVO_PERMITIDOS.has(archivo.type)) {
      setDocumentos((prev) => ({ ...prev, [campo]: null }));
      setEstadoDocumentos((prev) => ({ ...prev, [campo]: "error" }));
      setCampoError(campo, "Sube una imagen JPG, PNG, WEBP o un PDF");
      return;
    }
    setDocumentos((prev) => ({ ...prev, [campo]: archivo }));
    setEstadoDocumentos((prev) => ({ ...prev, [campo]: archivo ? "listo" : "pendiente" }));
    if (archivo) limpiarErrorCampo(campo);
  }

  async function cargarDocumentos(cliente: ReturnType<typeof crearClienteNavegador>, solicitudId: string) {
    const pendientes = (Object.entries(documentos) as [DocumentoKey, File | null][])
      .filter(([campo, archivo]) => archivo && estadoDocumentos[campo] !== "subido");
    if (pendientes.length === 0) return;

    setEstadoDocumentos((prev) => {
      const siguiente = { ...prev };
      for (const [campo] of pendientes) siguiente[campo] = "subiendo";
      return siguiente;
    });

    const resultados = await Promise.allSettled(
      pendientes.map(([campo, archivo]) => subirDocumentoSolicitudConductor(cliente, solicitudId, TIPOS_DOCUMENTO[campo], archivo as File))
    );
    resultados.forEach((resultado, indice) => {
      if (resultado.status === "rejected") {
        const [campo] = pendientes[indice];
        registrarTelemetria("documento_fallo", paso + 1, TIPOS_DOCUMENTO[campo]);
        logger.warn(
          "registration_document_upload_failed",
          {
            solicitudId,
            documentType: TIPOS_DOCUMENTO[campo],
            step: paso + 1,
            isOnline: typeof navigator === "undefined" ? null : navigator.onLine,
            errorCode: errorCode(resultado.reason)
          },
          "integration_failure"
        );
      }
    });

    // La decisión de detener el envío no puede depender de cuándo React
    // ejecute el actualizador de estado (puede diferirlo o repetirlo).
    const huboError = resultados.some((resultado) => resultado.status === "rejected");
    resultados.forEach((resultado, indice) => {
      const [campo] = pendientes[indice];
      if (resultado.status === "rejected") {
        const detalle = resultado.reason instanceof Error ? resultado.reason.message : "Intenta cargarlo nuevamente.";
        setCampoError(campo, detalle);
      } else {
        limpiarErrorCampo(campo);
      }
    });
    setEstadoDocumentos((prev) => {
      const siguiente = { ...prev };
      resultados.forEach((resultado, indice) => {
        const [campo] = pendientes[indice];
        if (resultado.status === "fulfilled") {
          siguiente[campo] = "subido";
        } else {
          siguiente[campo] = "error";
        }
      });
      return siguiente;
    });

    if (huboError) {
      const camposConError = pendientes
        .filter((_, indice) => resultados[indice].status === "rejected")
        .map(([campo]) => ETIQUETA_DOCUMENTO[campo])
        .join(", ");
      const detalles = resultados.flatMap((resultado) => resultado.status === "rejected" && resultado.reason instanceof Error ? [resultado.reason.message] : []);
      throw new Error(`No pudimos subir: ${camposConError}. ${[...new Set(detalles)].join(" ")} Revisa los documentos y reintenta; los que ya se guardaron se conservan.`);
    }
  }

  return {
    documentos,
    estadoDocumentos,
    documentosRemotos,
    setDocumentosRemotos,
    setEstadoDocumentos,
    documentoDisponible,
    validarDocumento,
    cambiarDocumento,
    cargarDocumentos
  };
}
