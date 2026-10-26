"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCargaMasiva } from "../nuevo/hooks/useCargaMasiva";

export interface CargaRecienteItem {
  id: string;
  fechaHora: string;
  archivo: string;
  traslados: number;
  estado: "Completado" | "En proceso" | "Con errores";
  accion: "Ver resultado" | "Ver detalle" | "Ver errores";
}

export interface ToastNotificacion {
  mensaje: string;
  tipo: "error" | "exito" | "info";
}

export function mapearPendienteACargaReciente(p: {
  id: string;
  totalMXN: number;
  cantidad_traslados: number;
  creado_en?: string;
  archivo?: string;
  estado?: string;
}): CargaRecienteItem {
  const fecha = p.creado_en ? new Date(p.creado_en) : new Date();
  const estado: "Completado" | "En proceso" | "Con errores" =
    p.estado === "Completado" ? "Completado" : p.estado === "Con errores" ? "Con errores" : "En proceso";
  const accion: "Ver resultado" | "Ver detalle" | "Ver errores" =
    estado === "Completado" ? "Ver resultado" : estado === "Con errores" ? "Ver errores" : "Ver detalle";

  return {
    id: p.id,
    fechaHora: fecha.toLocaleString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    archivo: p.archivo || `lote_${p.id.slice(0, 8)}.xlsx`,
    traslados: p.cantidad_traslados,
    estado,
    accion,
  };
}

const LIMITE_TAMANO_BYTES = 5 * 1024 * 1024; // 5 MB

export function useCargaMasivaDesktop() {
  const cargaMasiva = useCargaMasiva();
  const [arrastrando, setArrastrando] = useState(false);
  const [toast, setToast] = useState<ToastNotificacion | null>(null);
  const [cargasRecientes, setCargasRecientes] = useState<CargaRecienteItem[]>([]);
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null);
  const [guiaModalAbierto, setGuiaModalAbierto] = useState(false);
  const [modalDetalleData, setModalDetalleData] = useState<{
    titulo: string;
    item: CargaRecienteItem;
  } | null>(null);

  const mostrarToast = useCallback((mensaje: string, tipo: "error" | "exito" | "info" = "info") => {
    setToast({ mensaje, tipo });
  }, []);

  const cerrarToast = useCallback(() => {
    setToast(null);
  }, []);

  // Evitar repetición de toasts cuando el estado se re-evalúa
  const ultimoEstadoAnunciado = useRef<string | null>(null);

  // Auto-descarte de toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Carga inicial de datos reales desde el servidor al montar
  useEffect(() => {
    let activo = true;
    void cargaMasiva.consultarCargasPendientes().then((pendientes) => {
      if (!activo) return;
      if (Array.isArray(pendientes)) {
        setCargasRecientes(pendientes.map(mapearPendienteACargaReciente));
      }
    });
    return () => {
      activo = false;
    };
  }, [cargaMasiva.consultarCargasPendientes]);

  // Sincronización de estado reactivo desde useCargaMasiva hacia la vista de escritorio
  useEffect(() => {
    const claveEstado = `${cargaMasiva.estado}:${cargaMasiva.todasListas}:${cargaMasiva.filasCorrectas?.length ?? 0}:${cargaMasiva.filasConError?.length ?? 0}`;
    if (ultimoEstadoAnunciado.current === claveEstado) return;

    if (cargaMasiva.estado === "resultados") {
      ultimoEstadoAnunciado.current = claveEstado;
      if (cargaMasiva.todasListas) {
        const cantidad = cargaMasiva.filasCorrectas?.length ?? cargaMasiva.filasCotizables?.length ?? 0;
        mostrarToast(`Archivo validado con éxito: ${cantidad} traslados listos para cotizar.`, "exito");
      } else {
        const cantidadErrores = cargaMasiva.filasConError?.length ?? 0;
        mostrarToast(`Se detectaron ${cantidadErrores} filas con observaciones en el archivo.`, "error");
      }

      // Reconstruir la lista de cargas recientes desde el servidor
      void cargaMasiva.consultarCargasPendientes().then((pendientes) => {
        if (Array.isArray(pendientes) && pendientes.length > 0) {
          setCargasRecientes(pendientes.map(mapearPendienteACargaReciente));
        }
      });
    } else if (cargaMasiva.error) {
      ultimoEstadoAnunciado.current = claveEstado;
      mostrarToast(cargaMasiva.error, "error");
    }
  }, [
    cargaMasiva.estado,
    cargaMasiva.todasListas,
    cargaMasiva.filasCorrectas?.length,
    cargaMasiva.filasCotizables?.length,
    cargaMasiva.filasConError?.length,
    cargaMasiva.error,
    cargaMasiva.consultarCargasPendientes,
    mostrarToast,
  ]);

  // Validación estricta y procesamiento de archivo
  const validarYProcesarArchivo = useCallback(
    async (archivo: File) => {
      // 1. Validar extensión .xlsx
      const nombreMin = archivo.name.toLowerCase();
      if (!nombreMin.endsWith(".xlsx")) {
        mostrarToast("Formato no admitido. Selecciona un archivo con extensión .xlsx", "error");
        return false;
      }

      // 2. Validar tamaño menor a 5 MB
      if (archivo.size > LIMITE_TAMANO_BYTES) {
        mostrarToast("El archivo excede el límite máximo permitido de 5 MB.", "error");
        return false;
      }

      mostrarToast(`Archivo "${archivo.name}" recibido. Procesando contenido...`, "info");

      try {
        await cargaMasiva.cargarArchivo(archivo);

        // Agregamos el archivo a la lista de cargas recientes en tiempo real
        const nuevaCarga: CargaRecienteItem = {
          id: `carga-${Date.now()}`,
          fechaHora: new Date().toLocaleString("es-MX", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          archivo: archivo.name,
          traslados: cargaMasiva.filasVisibles.length || 1,
          estado: "En proceso",
          accion: "Ver detalle",
        };

        setCargasRecientes((prev) => [nuevaCarga, ...prev]);
        return true;
      } catch {
        mostrarToast("Ocurrió un error al procesar el archivo. Revisa su formato e intenta de nuevo.", "error");
        return false;
      }
    },
    [cargaMasiva, mostrarToast]
  );

  const toggleMenu = useCallback((id: string) => {
    setMenuAbiertoId((prev) => (prev === id ? null : id));
  }, []);

  const abrirDetalle = useCallback((item: CargaRecienteItem) => {
    setModalDetalleData({
      titulo: item.accion === "Ver errores" ? "Detalle de errores del archivo" : "Detalle de la carga masiva",
      item,
    });
  }, []);

  const cerrarDetalle = useCallback(() => {
    setModalDetalleData(null);
  }, []);

  return {
    ...cargaMasiva,
    arrastrando,
    setArrastrando,
    toast,
    mostrarToast,
    cerrarToast,
    validarYProcesarArchivo,
    cargasRecientes,
    menuAbiertoId,
    toggleMenu,
    guiaModalAbierto,
    setGuiaModalAbierto,
    modalDetalleData,
    abrirDetalle,
    cerrarDetalle,
  };
}
