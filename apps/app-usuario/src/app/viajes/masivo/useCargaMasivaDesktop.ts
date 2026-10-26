"use client";

import { useCallback, useEffect, useState } from "react";
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

const CARGAS_INICIALES: CargaRecienteItem[] = [
  {
    id: "rec-1",
    fechaHora: "26/10/2024 01:03 a. m.",
    archivo: "traslados_octubre.xlsx",
    traslados: 85,
    estado: "Completado",
    accion: "Ver resultado",
  },
  {
    id: "rec-2",
    fechaHora: "24/10/2024 11:42 a. m.",
    archivo: "ruta_quincena.xlsx",
    traslados: 100,
    estado: "En proceso",
    accion: "Ver detalle",
  },
  {
    id: "rec-3",
    fechaHora: "22/10/2024 03:18 p. m.",
    archivo: "traslados_sucursal.xlsx",
    traslados: 48,
    estado: "Con errores",
    accion: "Ver errores",
  },
];

const LIMITE_TAMANO_BYTES = 25 * 1024 * 1024; // 25 MB

export function useCargaMasivaDesktop() {
  const cargaMasiva = useCargaMasiva();
  const [arrastrando, setArrastrando] = useState(false);
  const [toast, setToast] = useState<ToastNotificacion | null>(null);
  const [cargasRecientes, setCargasRecientes] = useState<CargaRecienteItem[]>(CARGAS_INICIALES);
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null);
  const [guiaModalAbierto, setGuiaModalAbierto] = useState(false);
  const [modalDetalleData, setModalDetalleData] = useState<{
    titulo: string;
    item: CargaRecienteItem;
  } | null>(null);

  // Auto-descarte de toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const mostrarToast = useCallback((mensaje: string, tipo: "error" | "exito" | "info" = "info") => {
    setToast({ mensaje, tipo });
  }, []);

  const cerrarToast = useCallback(() => {
    setToast(null);
  }, []);

  // Validación estricta y procesamiento de archivo
  const validarYProcesarArchivo = useCallback(
    async (archivo: File) => {
      // 1. Validar extensión .xlsx
      const nombreMin = archivo.name.toLowerCase();
      if (!nombreMin.endsWith(".xlsx")) {
        mostrarToast("Formato no admitido. Selecciona un archivo con extensión .xlsx", "error");
        return false;
      }

      // 2. Validar tamaño menor a 25 MB
      if (archivo.size > LIMITE_TAMANO_BYTES) {
        mostrarToast("El archivo excede el límite máximo permitido de 25 MB.", "error");
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
