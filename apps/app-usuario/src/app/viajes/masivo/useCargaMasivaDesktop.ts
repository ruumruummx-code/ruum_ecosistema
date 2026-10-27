"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCargaMasiva, STORAGE_KEY_CARGA_ACTIVA } from "../nuevo/hooks/useCargaMasiva";

export interface CargaRecienteItem {
  id: string;
  fechaHora: string;
  archivo: string;
  traslados: number;
  totalMXN?: number;
  estado: "Completado" | "En proceso" | "Con errores";
  accion: "Ver resultado" | "Ver detalle" | "Ver errores";
  esLocal?: boolean;
}

export interface CargaPendienteItem {
  id: string;
  totalMXN: number;
  cantidad_traslados: number;
  creado_en?: string;
  archivo?: string;
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
    totalMXN: p.totalMXN,
    estado,
    accion,
    esLocal: false,
  };
}

const LIMITE_TAMANO_BYTES = 5 * 1024 * 1024; // 5 MB

export function descargarReporteLote(carga: CargaRecienteItem) {
  const lineas = [
    ["ID Lote", "Archivo", "Fecha y Hora", "Cantidad de Traslados", "Estado", "Tipo"],
    [
      carga.id,
      carga.archivo,
      carga.fechaHora,
      String(carga.traslados),
      carga.estado,
      carga.esLocal ? "Borrador local" : "Lote servidor",
    ],
  ];
  const contenido = lineas
    .map((fila) => fila.map((campo) => `"${campo.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte_${carga.archivo.replace(/\.[^/.]+$/, "")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copiarResumenLote(carga: CargaRecienteItem): Promise<boolean> {
  const texto = `Lote: ${carga.archivo}\nID: ${carga.id}\nFecha: ${carga.fechaHora}\nTraslados: ${carga.traslados}\nEstado: ${carga.estado}${carga.totalMXN ? `\nTotal: $${carga.totalMXN.toFixed(2)} MXN` : ""}`;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Fallback a elemento temporal
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = texto;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const exito = document.execCommand("copy");
    document.body.removeChild(textarea);
    return exito;
  } catch {
    return false;
  }
}

export function useCargaMasivaDesktop() {
  const cargaMasiva = useCargaMasiva();
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [toast, setToast] = useState<ToastNotificacion | null>(null);
  const [cargasRecientes, setCargasRecientes] = useState<CargaRecienteItem[]>([]);
  const [cargasPendientes, setCargasPendientes] = useState<CargaPendienteItem[]>([]);
  const [cargandoPendientes, setCargandoPendientes] = useState(false);
  const [menuAbiertoId, setMenuAbiertoId] = useState<string | null>(null);
  const [guiaModalAbierto, setGuiaModalAbierto] = useState(false);
  const [modalDetalleData, setModalDetalleData] = useState<{
    titulo: string;
    item: CargaRecienteItem;
  } | null>(null);

  // Estados de checkout y pago
  const [pago, setPago] = useState({ listo: false, procesando: false });
  const [conciliando, setConciliando] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);

  // Edición inline de filas en la tabla desktop
  const [filaEditando, setFilaEditando] = useState<number | null>(null);
  const [filtroTab, setFiltroTab] = useState<"todas" | "validas" | "errores">("todas");

  const mostrarToast = useCallback((mensaje: string, tipo: "error" | "exito" | "info" = "info") => {
    setToast({ mensaje, tipo });
  }, []);

  const cerrarToast = useCallback(() => {
    setToast(null);
  }, []);

  const ultimoEstadoAnunciado = useRef<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Carga y sincronización de pendientes desde el servidor
  const refrescarPendientes = useCallback(async () => {
    setCargandoPendientes(true);
    try {
      const lista = await cargaMasiva.consultarCargasPendientes();
      if (Array.isArray(lista)) {
        setCargasPendientes(lista);
        setCargasRecientes(lista.map(mapearPendienteACargaReciente));
      }
    } finally {
      setCargandoPendientes(false);
    }
  }, [cargaMasiva]);

  useEffect(() => {
    let activo = true;
    void cargaMasiva.consultarCargasPendientes().then((pendientes) => {
      if (!activo) return;
      if (Array.isArray(pendientes)) {
        setCargasPendientes(pendientes);
        setCargasRecientes(pendientes.map(mapearPendienteACargaReciente));
      }
    });
    return () => {
      activo = false;
    };
  }, [cargaMasiva.consultarCargasPendientes]);

  // Recuperación segura de checkout si existe carga activa en localStorage
  useEffect(() => {
    try {
      const guardada = localStorage.getItem(STORAGE_KEY_CARGA_ACTIVA);
      if (guardada && cargaMasiva.estado === "idle") {
        void cargaMasiva.reanudarCarga(guardada).then((reanudado) => {
          if (reanudado) {
            mostrarToast("Sesión de checkout recuperada.", "info");
          }
        });
      }
    } catch {
      // Ignorar fallo de almacenamiento
    }
  }, [cargaMasiva, mostrarToast]);

  // Sincronización de notificaciones reactivas según el estado
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
      void refrescarPendientes();
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
    mostrarToast,
    refrescarPendientes,
  ]);

  // Validación y parseo del archivo .xlsx
  const validarYProcesarArchivo = useCallback(
    async (archivo: File) => {
      const nombreMin = archivo.name.toLowerCase();
      if (!nombreMin.endsWith(".xlsx")) {
        mostrarToast("Formato no admitido. Selecciona un archivo con extensión .xlsx", "error");
        return false;
      }

      if (archivo.size > LIMITE_TAMANO_BYTES) {
        mostrarToast("El archivo excede el límite máximo permitido de 5 MB.", "error");
        return false;
      }

      setNombreArchivo(archivo.name);
      mostrarToast(`Archivo "${archivo.name}" recibido. Procesando contenido...`, "info");

      try {
        await cargaMasiva.cargarArchivo(archivo);
        return true;
      } catch {
        mostrarToast("Ocurrió un error al procesar el archivo. Revisa su formato e intenta de nuevo.", "error");
        return false;
      }
    },
    [cargaMasiva, mostrarToast]
  );

  // Reanudar carga pendiente del servidor
  const handleReanudarCarga = useCallback(
    async (id: string) => {
      mostrarToast("Reanudando carga pendiente...", "info");
      const reanudada = await cargaMasiva.reanudarCarga(id);
      if (reanudada) {
        mostrarToast("Carga recuperada exitosamente para revisión de tarifas y checkout.", "exito");
      }
      return reanudada;
    },
    [cargaMasiva, mostrarToast]
  );

  // Descartar carga pendiente del servidor
  const handleDescartarCarga = useCallback(
    async (id: string) => {
      await cargaMasiva.descartarCargaPendiente(id);
      await refrescarPendientes();
      mostrarToast("Carga pendiente descartada.", "info");
    },
    [cargaMasiva, refrescarPendientes, mostrarToast]
  );

  // Conciliación de pago con polling y verificación estructurada
  const verificarPago = useCallback(async () => {
    if (!cargaMasiva.cargaId) return;
    setConciliando(true);
    setErrorPago(null);

    try {
      const demoras = [1500, 3000, 5000, 8000];
      let pagado = false;

      for (let i = 0; i < demoras.length; i++) {
        if (i > 0) {
          await new Promise((r) => setTimeout(r, demoras[i - 1]));
        }
        const data = await cargaMasiva.consultarEstadoPago(cargaMasiva.cargaId);
        if (data.pagado) {
          pagado = true;
          break;
        }
      }

      if (!pagado) {
        throw new Error(
          "Tu pago sigue en proceso de confirmación. Puedes revisar su estado en Mis viajes en unos momentos."
        );
      }

      cargaMasiva.confirmarPago();
      mostrarToast("¡Pago masivo confirmado con éxito!", "exito");
      await refrescarPendientes();
    } catch (err) {
      setErrorPago(err instanceof Error ? err.message : "No se pudo consultar el pago.");
    } finally {
      setConciliando(false);
    }
  }, [cargaMasiva, mostrarToast, refrescarPendientes]);

  // Cancelar flujo activo y volver al estado inicial
  const handleCancelarCarga = useCallback(() => {
    cargaMasiva.cancelar();
    setNombreArchivo(null);
    setFilaEditando(null);
    setErrorPago(null);
    setPago({ listo: false, procesando: false });
  }, [cargaMasiva]);

  // Menús contextuales y modales
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

  // Acciones reales de fila
  const handleDescargarReporte = useCallback(
    (carga: CargaRecienteItem) => {
      toggleMenu(carga.id);
      descargarReporteLote(carga);
      mostrarToast(`Descargando reporte de ${carga.archivo}...`, "info");
    },
    [mostrarToast, toggleMenu]
  );

  const handleCopiarResumen = useCallback(
    async (carga: CargaRecienteItem) => {
      toggleMenu(carga.id);
      await copiarResumenLote(carga);
      mostrarToast("Resumen de carga copiado al portapapeles", "exito");
    },
    [mostrarToast, toggleMenu]
  );

  // Edición de fila
  const iniciarEdicionFila = useCallback((indice: number) => {
    setFilaEditando(indice);
  }, []);

  const cancelarEdicionFila = useCallback(() => {
    setFilaEditando(null);
  }, []);

  const guardarEdicionFila = useCallback(
    (indice: number, campo: string, valor: string) => {
      cargaMasiva.corregirCampo(indice, campo, valor);
    },
    [cargaMasiva]
  );

  return {
    ...cargaMasiva,
    nombreArchivo,
    arrastrando,
    setArrastrando,
    toast,
    mostrarToast,
    cerrarToast,
    validarYProcesarArchivo,
    cargasRecientes,
    cargasPendientes,
    cargandoPendientes,
    refrescarPendientes,
    handleReanudarCarga,
    handleDescartarCarga,
    handleCancelarCarga,
    pago,
    setPago,
    conciliando,
    errorPago,
    verificarPago,
    menuAbiertoId,
    toggleMenu,
    guiaModalAbierto,
    setGuiaModalAbierto,
    modalDetalleData,
    abrirDetalle,
    cerrarDetalle,
    handleDescargarReporte,
    handleCopiarResumen,
    filaEditando,
    iniciarEdicionFila,
    cancelarEdicionFila,
    guardarEdicionFila,
    filtroTab,
    setFiltroTab,
  };
}
