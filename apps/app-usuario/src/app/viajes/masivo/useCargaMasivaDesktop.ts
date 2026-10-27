"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motivosFilaMasiva, numeroFilaExcel } from "@/lib/carga-masiva";
import { useCargaMasiva, STORAGE_KEY_CARGA_ACTIVA, type FilaMasiva } from "../nuevo/hooks/useCargaMasiva";

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

/**
 * Genera y descarga un CSV con el detalle completo por traslado:
 * Índice, Estatus, Vehículo, Origen, Destino, Tarifa, Incidencia.
 */
export function descargarReporteDetallado(filas: FilaMasiva[], nombreArchivo: string) {
  const lineas = [
    ["Fila Excel", "Estatus", "Vehículo", "Origen", "Destino", "Tarifa", "Incidencia"],
    ...filas.map((fila) => {
      const vehiculo =
        [fila.datos.marca, fila.datos.modelo, fila.datos.anio].filter(Boolean).join(" ") ||
        "Sin especificar";

      const origenCp = fila.datos.origenCodigoPostal || fila.datos.origen_codigo_postal || "";
      const origenDir =
        [
          fila.datos.origen_calle || fila.datos.origenCalle,
          fila.datos.origen_numero || fila.datos.origenNumero,
          origenCp ? `CP ${origenCp}` : "",
        ]
          .filter(Boolean)
          .join(" ") ||
        origenCp ||
        "–";

      const destinoCp = fila.datos.destinoCodigoPostal || fila.datos.destino_codigo_postal || "";
      const destinoDir =
        [
          fila.datos.destino_calle || fila.datos.destinoCalle,
          fila.datos.destino_numero || fila.datos.destinoNumero,
          destinoCp ? `CP ${destinoCp}` : "",
        ]
          .filter(Boolean)
          .join(" ") ||
        destinoCp ||
        "–";

      const estatus =
        fila.estado === "correcto"
          ? fila.errorCotizacion
            ? "Incidencia de ruta"
            : "Válido"
          : "Con incidencias";

      const tarifa =
        fila.tarifa != null ? `$${fila.tarifa.toFixed(2)} MXN` : "Pendiente";

      const incidencia = motivosFilaMasiva(fila).join("; ") || "Ninguna";

      return [
        String(numeroFilaExcel(fila)),
        estatus,
        vehiculo,
        origenDir,
        destinoDir,
        tarifa,
        incidencia,
      ];
    }),
  ];

  // BOM \uFEFF para asegurar decodificación correcta en Excel en español
  const contenido =
    "\uFEFF" +
    lineas
      .map((fila) => fila.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(","))
      .join("\n");

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const nombreBase = nombreArchivo.replace(/\.[^/.]+$/, "");
  a.download = `reporte_detalle_${nombreBase}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Genera y descarga un CSV con el resumen de métricas del lote cuando
 * no se dispone del desglose individual de filas en memoria.
 */
export function descargarResumenLote(carga: CargaRecienteItem) {
  const lineas = [
    [
      "ID Lote",
      "Archivo",
      "Fecha y Hora",
      "Cantidad de Traslados",
      "Total Estimado MXN",
      "Estado",
      "Tipo de Registro",
    ],
    [
      carga.id,
      carga.archivo,
      carga.fechaHora,
      String(carga.traslados),
      carga.totalMXN != null ? `$${carga.totalMXN.toFixed(2)} MXN` : "–",
      carga.estado,
      carga.esLocal ? "Borrador local" : "Lote servidor",
    ],
  ];

  const contenido =
    "\uFEFF" +
    lineas
      .map((fila) => fila.map((campo) => `"${String(campo).replace(/"/g, '""')}"`).join(","))
      .join("\n");

  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resumen_lote_${carga.archivo.replace(/\.[^/.]+$/, "")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function descargarReporteLote(carga: CargaRecienteItem, filas?: FilaMasiva[]) {
  if (filas && filas.length > 0) {
    descargarReporteDetallado(filas, carga.archivo);
  } else {
    descargarResumenLote(carga);
  }
}

export async function copiarResumenLote(carga: CargaRecienteItem): Promise<boolean> {
  const texto = `Lote: ${carga.archivo}\nID: ${carga.id}\nFecha: ${carga.fechaHora}\nTraslados: ${carga.traslados}\nEstado: ${carga.estado}${carga.totalMXN ? `\nTotal: $${carga.totalMXN.toFixed(2)} MXN` : ""}`;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Fallback a elemento temporal si Clipboard API no está permitida
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
    return Boolean(exito);
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

  // Carga y sincronización de pendientes desde el servidor con referencias estables
  const consultarPendientesRef = useRef(cargaMasiva.consultarCargasPendientes);
  consultarPendientesRef.current = cargaMasiva.consultarCargasPendientes;

  const refrescarPendientes = useCallback(async () => {
    setCargandoPendientes(true);
    try {
      const lista = await consultarPendientesRef.current();
      if (Array.isArray(lista)) {
        setCargasPendientes(lista);
        setCargasRecientes(lista.map(mapearPendienteACargaReciente));
      }
    } finally {
      setCargandoPendientes(false);
    }
  }, []);

  const consultaPendientesInicialRef = useRef(false);
  useEffect(() => {
    if (consultaPendientesInicialRef.current) return;
    consultaPendientesInicialRef.current = true;
    let activo = true;

    void consultarPendientesRef.current().then((pendientes) => {
      if (!activo) return;
      if (Array.isArray(pendientes)) {
        setCargasPendientes(pendientes);
        setCargasRecientes(pendientes.map(mapearPendienteACargaReciente));
      }
    });

    return () => {
      activo = false;
    };
  }, []);

  // F04: Protección contra ejecuciones repetidas al montar o ante cambios de identidad
  const reanudacionIntentadaRef = useRef(false);
  const reanudarCargaRef = useRef(cargaMasiva.reanudarCarga);
  reanudarCargaRef.current = cargaMasiva.reanudarCarga;
  const estadoCarga = cargaMasiva.estado;

  // Recuperación segura de checkout si existe carga activa en localStorage
  useEffect(() => {
    if (reanudacionIntentadaRef.current) return;
    if (estadoCarga !== "idle") return;

    try {
      const guardada =
        typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEY_CARGA_ACTIVA)
          : null;
      if (guardada) {
        reanudacionIntentadaRef.current = true;
        void reanudarCargaRef.current(guardada).then((reanudado) => {
          if (reanudado) {
            mostrarToast("Sesión de checkout recuperada.", "info");
          }
        });
      }
    } catch {
      // Ignorar fallo de almacenamiento
    }
  }, [estadoCarga, mostrarToast]);

  // Sincronización de notificaciones reactivas según el estado
  useEffect(() => {
    const claveEstado = `${cargaMasiva.error ?? ""}:${cargaMasiva.estado}:${cargaMasiva.todasListas}:${cargaMasiva.filasCorrectas?.length ?? 0}:${cargaMasiva.filasConError?.length ?? 0}`;
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
        const procesado = await cargaMasiva.cargarArchivo(archivo);
        setFiltroTab("todas");
        setFilaEditando(null);
        return procesado !== false;
      } catch (err) {
        mostrarToast(err instanceof Error ? err.message : "Ocurrió un error al procesar el archivo.", "error");
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
      try {
        await cargaMasiva.descartarCargaPendiente(id);
        await refrescarPendientes();
        mostrarToast("Carga pendiente descartada.", "info");
      } catch (err) {
        mostrarToast(err instanceof Error ? err.message : "No se pudo descartar la carga pendiente.", "error");
      }
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
    setFiltroTab("todas");
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

  // F01: Acciones reales de descarga con distinción entre detalle y resumen
  const handleDescargarReporte = useCallback(
    (carga: CargaRecienteItem) => {
      toggleMenu(carga.id);
      const tieneFilasActivas =
        (carga.id === cargaMasiva.cargaId || carga.esLocal) &&
        cargaMasiva.filas &&
        cargaMasiva.filas.length > 0;
      const filasADescargar = tieneFilasActivas ? cargaMasiva.filas : undefined;

      descargarReporteLote(carga, filasADescargar);
      if (filasADescargar && filasADescargar.length > 0) {
        mostrarToast(`Descargando reporte detallado de ${carga.archivo}...`, "info");
      } else {
        mostrarToast(`Descargando resumen del lote ${carga.archivo}...`, "info");
      }
    },
    [cargaMasiva.cargaId, cargaMasiva.filas, mostrarToast, toggleMenu]
  );

  const handleDescargarDetalleActivo = useCallback(() => {
    if (!cargaMasiva.filas || cargaMasiva.filas.length === 0) {
      mostrarToast("No hay datos de traslados para exportar.", "error");
      return;
    }
    descargarReporteDetallado(cargaMasiva.filas, nombreArchivo || "lote_traslados.xlsx");
    mostrarToast("Descargando reporte detallado de traslados (.csv)...", "info");
  }, [cargaMasiva.filas, nombreArchivo, mostrarToast]);

  // F02: Verificación real del éxito de copiado al portapapeles
  const handleCopiarResumen = useCallback(
    async (carga: CargaRecienteItem) => {
      toggleMenu(carga.id);
      const copiado = await copiarResumenLote(carga);
      if (copiado) {
        mostrarToast("Resumen de carga copiado al portapapeles.", "exito");
      } else {
        mostrarToast("No se pudo copiar el resumen al portapapeles.", "error");
      }
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
    (indice: number, cambios: Record<string, string>) => {
      cargaMasiva.corregirCampos(indice, cambios);
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
    handleDescargarDetalleActivo,
    handleCopiarResumen,
    filaEditando,
    iniciarEdicionFila,
    cancelarEdicionFila,
    guardarEdicionFila,
    filtroTab,
    setFiltroTab,
  };
}
