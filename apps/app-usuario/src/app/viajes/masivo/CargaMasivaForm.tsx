"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Aviso, Button, Icono } from "@ruum/ui";
import {
  COLUMNAS_PLANTILLA,
  COLUMNAS_REQUERIDAS,
  EJEMPLO_CSV_PLANTILLA,
  pLimit,
  type FilaCsv
} from "@ruum/shared/utils";
import {
  categoriaTarifaSugeridaParaVehiculo,
  gamaSugeridaParaVehiculo,
  tipoSugeridoParaVehiculo
} from "@ruum/shared/catalogos";
import {
  crearTrasladosMasivosUsuario,
  procesarCargaTrasladosMasivosUsuario,
  obtenerEstadoCargaMasivaUsuario,
  listarCargasMasivasUsuario,
  previsualizarTarifaUsuario,
  obtenerUsuarioActual,
  listarVehiculosDeUsuario,
  type CargaTrasladosMasivosUsuario,
  type FilaTrasladoMasivoNormalizada,
  type ResultadoCargaTrasladosMasivos
} from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import { consultarCodigoPostalMx } from "@/lib/codigos-postales";
import {
  calcularRutaMapbox,
  geocodificarDireccion,
  mensajeErrorMapbox,
  tieneMapboxConfigurado
} from "@/lib/mapbox";

import { CAMPOS_COMUNES, filasParaPlantilla, generarPlantillaExcel, leerArchivoMasivo } from "./plantilla-excel";
import type { VehiculoGuardado } from "../nuevo/types";

interface FilaPrevalidada {
  numero: number;
  original: FilaCsv;
  excluida?: boolean;
  datos: FilaTrasladoMasivoNormalizada;
  tarifa?: number;
  errorTarifa?: string;
  errores: string[];
  advertencias: string[];
}

function limpiar(v: string | undefined): string {
  return v?.trim() ?? "";
}

function numeroTexto(v: string | undefined): string {
  const limpio = limpiar(v);
  return limpio && !Number.isNaN(Number(limpio)) ? limpio : "";
}

function construirDireccionCompleta(calle: string, numero: string, colonia: string, cp: string, ciudad: string, estado: string) {
  return [calle, numero, colonia, cp, ciudad, estado, "México"].map((val) => val.trim()).filter(Boolean).join(", ");
}

async function calcularSha256(contenido: string): Promise<string> {
  const buffer = new TextEncoder().encode(contenido);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function dormir(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}

export const MAX_INTENTOS_MASIVO = 20;

export function CargaMasivaForm() {
  const router = useRouter();
  const [vehiculosPlantilla, setVehiculosPlantilla] = useState<VehiculoGuardado[]>([]);
  const [seleccionVehiculos, setSeleccionVehiculos] = useState<string[]>([]);
  const [comunesPlantilla, setComunesPlantilla] = useState<FilaCsv>({ modalidad_programacion: "lo_antes_posible", tipo_ruta: "local" });
  const [cantidadPlantilla, setCantidadPlantilla] = useState(1);
  const [preparandoPlantilla, setPreparandoPlantilla] = useState(false);
  const [mostrarPreparacion, setMostrarPreparacion] = useState(false);
  const abortEnriquecimientoRef = useRef<AbortController | null>(null);
  const abortCargaRef = useRef<AbortController | null>(null);

  // R6 cleanup on-unmount: si el usuario navega fuera mientras hay polling/enriquecimiento, abortar
  useEffect(() => {
    return () => {
      abortEnriquecimientoRef.current?.abort();
      abortCargaRef.current?.abort();
    };
  }, []);
  const [historial, setHistorial] = useState<CargaTrasladosMasivosUsuario[]>([]);
  const [errorHistorial, setErrorHistorial] = useState(false);
  const [cotizando, setCotizando] = useState(false);
  const [progresoCarga, setProgresoCarga] = useState<ResultadoCargaTrasladosMasivos | null>(null);
  const abortCotizacionRef = useRef<AbortController | null>(null);

  const actualizarHistorial = async () => {
    try {
      setHistorial(await listarCargasMasivasUsuario(crearClienteNavegador()));
      setErrorHistorial(false);
    } catch { setErrorHistorial(true); }
  };

  useEffect(() => {
    let activa = true;
    if (tieneSupabaseConfigurado()) {
      listarCargasMasivasUsuario(crearClienteNavegador()).then((cargas) => {
        if (activa) setHistorial(cargas);
      }).catch(() => { if (activa) setErrorHistorial(true); });
    }
    return () => { activa = false; abortCotizacionRef.current?.abort(); };
  }, []);

  const [paso, setPaso] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [edicion, setEdicion] = useState<{ numero: number; datos: FilaCsv } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [reporteServidor, setReporteServidor] = useState<string | null>(null);
  const [errorReporte, setErrorReporte] = useState(false);
  const cargaIdRef = useRef<string | null>(null);
  const filasEnviadasRef = useRef<FilaPrevalidada[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [progresoGeocodificacion, setProgresoGeocodificacion] = useState<{ actual: number; total: number } | null>(null);
  const [filas, setFilas] = useState<FilaPrevalidada[]>([]);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCargaTrasladosMasivos | null>(null);
  const [filtroTabla, setFiltroTabla] = useState<"todas" | "validas" | "advertencias" | "errores">("todas");
  const [pagoProcesando, setPagoProcesando] = useState(false);
  const [pagoCompletado, setPagoCompletado] = useState(false);

  const totalErrores = filas.filter((f) => f.errores.length > 0).length;
  const totalAdvertencias = filas.filter((f) => f.errores.length === 0 && f.advertencias.length > 0).length;
  const filasSeleccionadas = filas.filter((f) => f.errores.length === 0 && !f.excluida);
  const totalValidas = filasSeleccionadas.length;
  const totalOmitidas = filas.length - totalValidas;
  const todasCotizadas = totalValidas > 0 && filasSeleccionadas.every((f) => f.tarifa !== undefined && !f.errorTarifa);
  const totalCotizado = filasSeleccionadas.reduce((total, f) => total + (f.tarifa ?? 0), 0);
  const moneda = (valor: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(valor);

  // ── 1. Descarga de plantilla CSV ─────────────────────────────────────────
  const descargarPlantilla = () => {
    const fechaEjemplo = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const plantilla = EJEMPLO_CSV_PLANTILLA.replace(/\d{4}-\d{2}-\d{2}(?=T)/g, fechaEjemplo);
    const blob = new Blob([plantilla], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla-traslados-masivos-ruum.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const cargarVehiculosPlantilla = async () => {
    setPreparandoPlantilla(true);
    setErrorGeneral(null);
    try {
      const cliente = crearClienteNavegador();
      const usuario = await obtenerUsuarioActual(cliente);
      if (!usuario) throw new Error("Inicia sesión para precargar tus vehículos.");
      const vehiculos = await listarVehiculosDeUsuario(cliente, usuario.id);
      setVehiculosPlantilla(vehiculos);
      setSeleccionVehiculos([]);
      if (!vehiculos.length) setErrorGeneral("No tienes vehículos guardados. Puedes generar filas vacías con los datos comunes.");
    } catch (err) { setErrorGeneral(err instanceof Error ? err.message : "No se pudieron cargar tus vehículos."); }
    finally { setPreparandoPlantilla(false); }
  };

  const descargarExcel = async () => {
    setPreparandoPlantilla(true);
    setErrorGeneral(null);
    try {
      const seleccion = vehiculosPlantilla.filter((v) => seleccionVehiculos.includes(v.id));
      const contenido = await generarPlantillaExcel(filasParaPlantilla(seleccion, comunesPlantilla, cantidadPlantilla));
      const url = URL.createObjectURL(new Blob([contenido], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "plantilla-traslados-precargada-ruum.xlsx";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) { setErrorGeneral(err instanceof Error ? err.message : "No se pudo generar la plantilla."); }
    finally { setPreparandoPlantilla(false); }
  };

  // ── 2. Descarga de errores CSV ───────────────────────────────────────────
  const descargarReporteErrores = (contenido: string) => {
    const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-errores-traslados-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── 3. Procesar archivo CSV seleccionado ─────────────────────────────────
  const manejarArchivo = async (archivoSeleccionado: File) => {
    abortEnriquecimientoRef.current?.abort();
    setErrorGeneral(null);
    setEdicion(null);
    setReporteServidor(null);
    setErrorReporte(false);
    cargaIdRef.current = null;
    if (!/\.(csv|xlsx)$/i.test(archivoSeleccionado.name)) {
      setErrorGeneral("El archivo debe tener formato .csv o .xlsx");
      return;
    }
    if (archivoSeleccionado.size > 5 * 1024 * 1024) {
      setErrorGeneral("El archivo no debe exceder 5 MB.");
      return;
    }

    setArchivo(archivoSeleccionado);
    setAnalizando(true);

    try {
      const revision = await leerArchivoMasivo(archivoSeleccionado);

      if (revision.errores.length > 0) {
        setErrorGeneral(`Error en el formato del archivo: ${revision.errores.slice(0, 3).join(", ")}`);
        setAnalizando(false);
        return;
      }

      if (revision.filas.length === 0) {
        setErrorGeneral("El archivo no contiene filas de datos.");
        setAnalizando(false);
        return;
      }

      if (revision.filas.length > 100) {
        setErrorGeneral(`El archivo contiene ${revision.filas.length} filas. El límite por carga es de 100 traslados.`);
        setAnalizando(false);
        return;
      }

      // R6: rate-limit 2 + backoff 429 + abort por nuevo archivo/unmount
      abortEnriquecimientoRef.current?.abort();
      const controller = new AbortController();
      abortEnriquecimientoRef.current = controller;
      const limit = pLimit(2);
      let completadas = 0;
      setProgresoGeocodificacion({ actual: 0, total: revision.filas.length });

      const tareas = revision.filas.map((fila, index) =>
        limit(async () => {
          if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
          // Pequeño jitter para no ráfaga exacta contra cuota Mapbox 600/min
          if (index % 4 === 0 && index !== 0) await dormir(220, controller.signal);
          const prevalidada = await enriquecerFilaUsuario(fila, index + 1, controller.signal);
          completadas += 1;
          setProgresoGeocodificacion({ actual: completadas, total: revision.filas.length });
          return prevalidada;
        })
      );

      const filasEnriquecidas = await Promise.all(tareas);
      if (controller.signal.aborted) return;
      setFilas(filasEnriquecidas);
      setFiltroTabla(filasEnriquecidas.some((f) => f.errores.length > 0) ? "errores" : "todas");
      setPaso(2);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setErrorGeneral(err instanceof Error ? err.message : "Error al procesar el archivo CSV.");
    } finally {
      setAnalizando(false);
      setProgresoGeocodificacion(null);
    }
  };

  // ── 4. Enriquecer fila individual ────────────────────────────────────────
  const enriquecerFilaUsuario = async (fila: FilaCsv, numero: number, signal?: AbortSignal): Promise<FilaPrevalidada> => {
    const errores: string[] = [];
    const advertencias: string[] = [];

    // Validar requeridos
    for (const col of COLUMNAS_REQUERIDAS) {
      if (!fila[col]?.trim()) errores.push(`${col} es requerido`);
    }
    if (!fila.vehiculo_placas?.trim() && !fila.vehiculo_vin?.trim()) {
      errores.push("Placas o VIN requeridos");
    }

    const modalidad = fila.modalidad_programacion?.trim() || "lo_antes_posible";
    if (modalidad === "programado" && !fila.fecha_hora_programada?.trim()) {
      errores.push("Fecha y hora requerida para modalidad programada");
    }

    for (const campo of ["origen_codigo_postal", "destino_codigo_postal"]) {
      if (limpiar(fila[campo]) && !/^\d{5}$/.test(limpiar(fila[campo]))) errores.push(campo + " debe tener 5 dígitos");
    }
    if (limpiar(fila.vehiculo_anio) && !/^\d{4}$/.test(limpiar(fila.vehiculo_anio))) errores.push("El año debe tener 4 dígitos");
    if (!["lo_antes_posible", "programado"].includes(modalidad)) errores.push("Modalidad de programación inválida");
    if (modalidad === "programado" && fila.fecha_hora_programada &&
        (!Number.isFinite(Date.parse(fila.fecha_hora_programada)) || Date.parse(fila.fecha_hora_programada) <= Date.now())) {
      errores.push("La fecha programada debe ser válida y futura");
    }

    for (const campo of ["tiene_tarjeta_circulacion", "tiene_verificacion", "puede_circular_rodando"]) {
      if (limpiar(fila[campo]) && !["true", "false"].includes(limpiar(fila[campo]))) errores.push(campo + " debe ser Sí o No en Excel, o true/false en CSV");
    }
    if (limpiar(fila.vehiculo_transmision) && !["manual", "automatica", "electrica"].includes(limpiar(fila.vehiculo_transmision))) errores.push("Transmisión inválida");
    if (limpiar(fila.vehiculo_tipo) && !["sedan", "suv", "pick_up", "van", "luxury", "coleccion"].includes(limpiar(fila.vehiculo_tipo))) errores.push("Tipo de vehículo inválido");
    if (limpiar(fila.tipo_ruta) && !["local", "foraneo"].includes(limpiar(fila.tipo_ruta))) errores.push("Tipo de ruta inválido");
    // No consultar servicios externos para filas con errores bloqueantes.
    // Consulta de código postal SEPOMEX
    const origenCp = limpiar(fila.origen_codigo_postal);
    const destinoCp = limpiar(fila.destino_codigo_postal);
    const [origenCpDatos, destinoCpDatos] = await Promise.all([
      errores.length ? Promise.resolve(null) : consultarCodigoPostalMx(origenCp),
      errores.length ? Promise.resolve(null) : consultarCodigoPostalMx(destinoCp)
    ]);

    if (!errores.length && origenCp && !origenCpDatos) advertencias.push("CP origen no encontrado en SEPOMEX");
    if (!errores.length && destinoCp && !destinoCpDatos) advertencias.push("CP destino no encontrado en SEPOMEX");

    const origenEstado = limpiar(fila.origen_estado) || origenCpDatos?.estado || "";
    const destinoEstado = limpiar(fila.destino_estado) || destinoCpDatos?.estado || "";
    const origenCiudad = limpiar(fila.origen_ciudad) || origenCpDatos?.ciudades[0] || "";
    const destinoCiudad = limpiar(fila.destino_ciudad) || destinoCpDatos?.ciudades[0] || "";
    const origenColonia = limpiar(fila.origen_colonia);
    const destinoColonia = limpiar(fila.destino_colonia);

    const origenDireccion = construirDireccionCompleta(
      limpiar(fila.origen_calle),
      limpiar(fila.origen_numero),
      origenColonia,
      origenCp,
      origenCiudad,
      origenEstado
    );
    const destinoDireccion = construirDireccionCompleta(
      limpiar(fila.destino_calle),
      limpiar(fila.destino_numero),
      destinoColonia,
      destinoCp,
      destinoCiudad,
      destinoEstado
    );

    let origenLat = numeroTexto(fila.origen_lat);
    let origenLng = numeroTexto(fila.origen_lng);
    let destinoLat = numeroTexto(fila.destino_lat);
    let destinoLng = numeroTexto(fila.destino_lng);
    let distanciaKm = numeroTexto(fila.distancia_km);
    let tiempoEstimadoHoras = numeroTexto(fila.tiempo_estimado_horas);

    // Geocodificación Mapbox si faltan coordenadas — timeout, retry y abort centralizados en lib/mapbox
    if (errores.length === 0 && tieneMapboxConfigurado() && !signal?.aborted) {
      try {
        const [geoOrigen, geoDestino] = await Promise.all([
          origenLat && origenLng ? null : geocodificarDireccion(origenDireccion, signal),
          destinoLat && destinoLng ? null : geocodificarDireccion(destinoDireccion, signal)
        ]);
        if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
        if (geoOrigen) {
          origenLat = String(geoOrigen.lat);
          origenLng = String(geoOrigen.lng);
        }
        if (geoDestino) {
          destinoLat = String(geoDestino.lat);
          destinoLng = String(geoDestino.lng);
        }

        // Calcular distancia y tiempo si faltan
        if ((!distanciaKm || !tiempoEstimadoHoras) && origenLat && origenLng && destinoLat && destinoLng) {
          const ruta = await calcularRutaMapbox(
            { lat: Number(origenLat), lng: Number(origenLng) },
            { lat: Number(destinoLat), lng: Number(destinoLng) },
            signal
          );
          if (ruta) {
            distanciaKm = String(ruta.distanciaKm);
            tiempoEstimadoHoras = String(ruta.tiempoEstimadoHoras);
          }
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") throw e;
        advertencias.push(mensajeErrorMapbox(e));
      }
    }

    const marca = limpiar(fila.vehiculo_marca);
    const modelo = limpiar(fila.vehiculo_modelo);
    const tipoVehiculo = tipoSugeridoParaVehiculo(marca, modelo) ?? "sedan";
    const categoriaTarifa = categoriaTarifaSugeridaParaVehiculo(marca, modelo) ?? "ligero_a";
    const gama = gamaSugeridaParaVehiculo(marca, modelo) ?? "entrada";

    return {
      numero,
      original: { ...fila },
      errores,
      advertencias,
      datos: {
        referencia_externa: limpiar(fila.referencia_externa),
        vehiculo_placas: limpiar(fila.vehiculo_placas).toUpperCase(),
        vehiculo_vin: limpiar(fila.vehiculo_vin).toUpperCase(),
        vehiculo_marca: marca,
        vehiculo_modelo: modelo,
        vehiculo_anio: limpiar(fila.vehiculo_anio),
        vehiculo_tipo: limpiar(fila.vehiculo_tipo) || tipoVehiculo,
        vehiculo_transmision: limpiar(fila.vehiculo_transmision),
        estado_general_declarado: limpiar(fila.estado_general_declarado),
        tiene_tarjeta_circulacion: limpiar(fila.tiene_tarjeta_circulacion),
        tiene_verificacion: limpiar(fila.tiene_verificacion),
        puede_circular_rodando: limpiar(fila.puede_circular_rodando),
        vehiculo_color: limpiar(fila.vehiculo_color),
        categoria_tarifa: categoriaTarifa,
        gama,
        condicion: limpiar(fila.condicion) || "seminueva",
        contacto_entrega_nombre: limpiar(fila.contacto_entrega_nombre),
        contacto_entrega_telefono: limpiar(fila.contacto_entrega_telefono),
        contacto_recepcion_nombre: limpiar(fila.contacto_recepcion_nombre),
        contacto_recepcion_telefono: limpiar(fila.contacto_recepcion_telefono),
        origen_direccion: origenDireccion,
        origen_ciudad: origenCiudad || "CDMX",
        origen_lat: origenLat || undefined,
        origen_lng: origenLng || undefined,
        origen_referencias: limpiar(fila.origen_referencias),
        destino_direccion: destinoDireccion,
        destino_ciudad: destinoCiudad || "CDMX",
        destino_lat: destinoLat || undefined,
        destino_lng: destinoLng || undefined,
        destino_referencias: limpiar(fila.destino_referencias),
        modalidad_programacion: modalidad,
        fecha_hora_programada: limpiar(fila.fecha_hora_programada) || undefined,
        tipo_ruta: limpiar(fila.tipo_ruta) || "local",
        ventana_recoleccion: limpiar(fila.ventana_recoleccion),
        ventana_entrega: limpiar(fila.ventana_entrega),
        distancia_km: distanciaKm || undefined,
        tiempo_estimado_horas: tiempoEstimadoHoras || undefined,
        instrucciones_especiales: limpiar(fila.instrucciones_especiales)
      }
    };
  };

  const cotizarSeleccionadas = async () => {
    abortCotizacionRef.current?.abort();
    const controller = new AbortController();
    abortCotizacionRef.current = controller;
    setCotizando(true);
    setErrorGeneral(null);
    setPaso(3);
    const limit = pLimit(2);
    try {
      const cliente = crearClienteNavegador();
      const cotizadas = await Promise.all(filasSeleccionadas.map((fila) => limit(async () => {
        if (controller.signal.aborted) return fila;
        try {
          const distancia = Number(fila.datos.distancia_km);
          const tiempo = Number(fila.datos.tiempo_estimado_horas);
          if (!Number.isFinite(distancia) || distancia <= 0 || !Number.isFinite(tiempo) || tiempo <= 0) {
            throw new Error("Completa una ruta con distancia y tiempo válidos para cotizar.");
          }
          const tarifa = await previsualizarTarifaUsuario(cliente, {
            marca: fila.datos.vehiculo_marca,
            modelo: fila.datos.vehiculo_modelo,
            distanciaKm: distancia,
            tiempoEstimadoHoras: tiempo,
            fechaHora: fila.datos.modalidad_programacion === "programado" && fila.datos.fecha_hora_programada ? new Date(fila.datos.fecha_hora_programada) : null,
            condicion: fila.datos.condicion as Parameters<typeof previsualizarTarifaUsuario>[1]["condicion"]
          });
          if (!tarifa.disponible || typeof tarifa.tarifa !== "number" || !Number.isFinite(tarifa.tarifa) || tarifa.tarifa < 0) {
            throw new Error(tarifa.motivo || "No hay una tarifa disponible para este vehículo.");
          }
          return { ...fila, tarifa: tarifa.tarifa, errorTarifa: undefined, datos: {
            ...fila.datos,
            categoria_tarifa: tarifa.categoria_tarifa ?? fila.datos.categoria_tarifa,
            gama: tarifa.gama ?? fila.datos.gama
          } };
        } catch (err) {
          return { ...fila, tarifa: undefined, errorTarifa: err instanceof Error ? err.message : "No se pudo consultar la tarifa." };
        }
      })));
      if (!controller.signal.aborted) setFilas((actuales) => actuales.map((fila) => cotizadas.find((f) => f.numero === fila.numero) ?? fila));
    } catch (err) {
      if (!controller.signal.aborted) setErrorGeneral(err instanceof Error ? err.message : "No se pudo cotizar el lote.");
    } finally { if (!controller.signal.aborted) setCotizando(false); }
  };

  const guardarEdicion = async () => {
    if (!edicion) return;
    setGuardando(true);
    setErrorGeneral(null);
    const controller = new AbortController();
    abortEnriquecimientoRef.current = controller;
    try {
      const datos = { ...edicion.datos };
      const anterior = filas.find((f) => f.numero === edicion.numero)?.original;
      for (const lado of ["origen", "destino"]) {
        if (["calle", "numero", "colonia", "codigo_postal", "estado", "ciudad"].some((campo) => datos[lado + "_" + campo] !== anterior?.[lado + "_" + campo])) {
          delete datos[lado + "_lat"];
          delete datos[lado + "_lng"];
          delete datos.distancia_km;
          delete datos.tiempo_estimado_horas;
        }
      }
      const revisada = await enriquecerFilaUsuario(datos, edicion.numero, controller.signal);
      if (controller.signal.aborted) return;
      setFilas((actuales) => actuales.map((f) => f.numero === revisada.numero ? { ...revisada, excluida: f.excluida } : f));
      setEdicion(null);
      setFiltroTabla("todas");
    } catch (err) {
      if (!controller.signal.aborted) setErrorGeneral(err instanceof Error ? err.message : "No se pudo revisar la fila.");
    } finally { setGuardando(false); }
  };

  const cargarReporteServidor = async () => {
    if (!cargaIdRef.current) return;
    try {
      const carga = await obtenerEstadoCargaMasivaUsuario(crearClienteNavegador(), cargaIdRef.current);
      if (!carga?.reporte_errores_csv) throw new Error("Reporte aún no disponible");
      // El servidor numera las filas del subconjunto enviado; recuperar el número original.
      const reporte = carga.reporte_errores_csv.replace(/^(\d+),/gm, (_, numero: string) =>
        String(filasEnviadasRef.current[Number(numero) - 1]?.numero ?? numero) + ",");
      setReporteServidor(reporte);
      setErrorReporte(false);
    } catch { setErrorReporte(true); }
  };

  const seguirCarga = async (cargaId: string, controller: AbortController) => {
      if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
      const cliente = crearClienteNavegador();
      // 2. Procesar lote en chunks — R6: delay + maxRetries para evitar loop infinito
      let resProcesamiento = await procesarCargaTrasladosMasivosUsuario(cliente, cargaId, 50);
      const MAX_INTENTOS = MAX_INTENTOS_MASIVO;
      let intentos = 0;

      if (controller.signal.aborted) return;
      setProgresoCarga(resProcesamiento);
      while (resProcesamiento.estado === "procesando" || resProcesamiento.estado === "pendiente") {
        if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
        if (intentos++ >= MAX_INTENTOS) {
          throw new Error("El lote sigue pendiente. Puedes reanudarlo desde Cargas recientes.");
        }
        await dormir(1000 + Math.min(intentos * 250, 3000), controller.signal);
        resProcesamiento = await procesarCargaTrasladosMasivosUsuario(cliente, cargaId, 50);
        if (controller.signal.aborted) return;
        setProgresoCarga(resProcesamiento);
      }

      if (controller.signal.aborted) return;
      setResultado(resProcesamiento);
      setPaso(4);
      if (resProcesamiento.filas_error > 0) await cargarReporteServidor();
      await actualizarHistorial();
  };

  const abrirCarga = async (carga: CargaTrasladosMasivosUsuario) => {
    if (enviando) return;
    setEnviando(true);
    setErrorGeneral(null);
    setReporteServidor(null);
    setErrorReporte(false);
    setResultado(null);
    setProgresoCarga(null);
    cargaIdRef.current = carga.id;
    filasEnviadasRef.current = [];
    const controller = new AbortController();
    abortCargaRef.current?.abort();
    abortCargaRef.current = controller;
    try {
      if (carga.estado === "pendiente" || carga.estado === "procesando") {
        await seguirCarga(carga.id, controller);
      } else {
        const actual = await obtenerEstadoCargaMasivaUsuario(crearClienteNavegador(), carga.id);
        if (!actual) throw new Error("No se encontró el lote.");
        if (controller.signal.aborted) return;
        setResultado({ ...actual, carga_id: actual.id });
        setReporteServidor(actual.reporte_errores_csv);
        setErrorReporte(actual.filas_error > 0 && !actual.reporte_errores_csv);
        setPaso(4);
      }
    } catch (err) {
      if (!controller.signal.aborted) setErrorGeneral(err instanceof Error ? err.message : "No se pudo abrir el lote.");
    } finally { setEnviando(false); void actualizarHistorial(); }
  };

  // ── 5. Confirmar y procesar carga en backend ─────────────────────────────
  const ejecutarCarga = async () => {
    if (!archivo || !todasCotizadas || cotizando || enviando) return;
    setEnviando(true);
    setProgresoCarga(null);
    setErrorGeneral(null);
    // R6: abort control para evitar loop infinito si usuario navega/cancela
    abortCargaRef.current?.abort();
    const controller = new AbortController();
    abortCargaRef.current = controller;

    try {
      if (!tieneSupabaseConfigurado()) {
        throw new Error("Supabase no está configurado.");
      }
      if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
      const cliente = crearClienteNavegador();
      const seleccionadas = filasSeleccionadas;
      filasEnviadasRef.current = seleccionadas;
      const hash = await calcularSha256(JSON.stringify(seleccionadas.map((f) => f.original)));

      // 1. Encolar carga en backend
      const resCreacion = await crearTrasladosMasivosUsuario(cliente, {
        nombreArchivo: archivo.name.replace(/\.xlsx$/i, ".csv"),
        filas: seleccionadas.map((f) => f.datos),
        hashArchivo: hash,
        tamanoBytes: archivo.size,
        mimeType: "text/csv"
      });

      cargaIdRef.current = resCreacion.carga_id;

      await seguirCarga(resCreacion.carga_id, controller);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setErrorGeneral(err instanceof Error ? err.message : "Error al procesar la carga masiva.");
    } finally {
      setEnviando(false);
      void actualizarHistorial();
    }
  };

  const filasFiltradas = filas.filter((f) => {
    if (filtroTabla === "errores") return f.errores.length > 0;
    if (filtroTabla === "advertencias") return f.errores.length === 0 && f.advertencias.length > 0;
    if (filtroTabla === "validas") return f.errores.length === 0;
    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 h-[100dvh] overflow-y-auto overflow-x-hidden">
      {/* Encabezado */}
      <header className="space-y-2 border-b border-[#1C2A3E]/60 pb-4">
        <div className="flex items-center justify-between">
          <Link
            href="/viajes/nuevo"
            className="text-xs font-semibold text-[#8E9CAE] hover:text-[#FFC400] transition flex items-center gap-1"
          >
            ← Volver a traslado individual
          </Link>
          <span className="text-[11px] font-mono tracking-wide uppercase px-2.5 py-1 rounded bg-[#141F32] text-[#FFC400] border border-[#FFC400]/20">
            Carga masiva Excel / CSV
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
          Creación masiva de traslados
        </h1>
        <p className="text-xs sm:text-sm font-body text-[#8E9CAE]">
          Sube un archivo Excel o CSV con hasta 100 vehículos y rutas para cotizar y programar en lote de forma segura.
        </p>
      </header>

      {paso === 1 && (
        <section className="rounded-xl border border-[#1C2A3E] bg-[#0A1220] p-4 space-y-3">
          <h2 className="text-white font-bold">Cargas recientes</h2>
          {errorHistorial && <Aviso tono="atencion">No se pudo cargar el historial. <button type="button" onClick={() => void actualizarHistorial()}>Reintentar historial</button></Aviso>}
          {!errorHistorial && historial.length === 0 && <p className="text-sm text-slate-400">No hay cargas recientes.</p>}
          <ul className="space-y-3">
            {historial.map((carga) => (
              <li key={carga.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3 text-sm text-slate-200">
                <div><p>{carga.nombre_archivo}</p><p className="text-xs text-slate-400">{carga.estado.replaceAll("_", " ")} · {carga.filas_procesadas}/{carga.total_filas} procesadas · {carga.filas_creadas} creadas · {carga.filas_error} con error</p></div>
                <Button type="button" variant="secondary" disabled={enviando || analizando} onClick={() => void abrirCarga(carga)}>{carga.estado === "pendiente" || carga.estado === "procesando" ? "Reanudar lote" : "Ver resultado"}</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {enviando && (
        <div role="status" className="rounded-xl border border-[#FFC400]/30 p-4 text-slate-200">
          <p>{progresoCarga ? "Procesadas " + progresoCarga.filas_procesadas + " de " + progresoCarga.total_filas + " · " + progresoCarga.filas_creadas + " creadas · " + progresoCarga.filas_error + " con error" : "Abriendo lote…"}</p>
          <Button type="button" variant="secondary" onClick={() => { abortCargaRef.current?.abort(); setErrorGeneral("Seguimiento detenido. Reanuda el lote desde Cargas recientes."); }}>Detener seguimiento</Button>
        </div>
      )}
      {paso !== 1 && !enviando && !cotizando && (
        <Button type="button" variant="secondary" onClick={() => { setPaso(1); void actualizarHistorial(); }}>Ver cargas recientes</Button>
      )}
      {/* Indicador de pasos */}
      <nav aria-label="Progreso de carga masiva" className="grid grid-cols-5 gap-2 text-center text-xs font-display">
        {[
          { num: 1, label: "1. Archivo" },
          { num: 2, label: "2. Revisión" },
          { num: 3, label: "3. Resumen" },
          { num: 4, label: "4. Resultado" },
          { num: 5, label: "5. Pago" }
        ].map((p) => (
          <div
            key={p.num}
            className={`py-2 rounded-lg border font-bold transition ${
              paso === p.num
                ? "border-[#FFC400] bg-[#FFC400]/10 text-[#FFC400]"
                : paso > p.num
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border-[#1C2A3E] bg-[#0A1220] text-[#64748B]"
            }`}
          >
            {p.label}
          </div>
        ))}
      </nav>

      {errorGeneral && (
        <Aviso tono="danger" aria-live="assertive">
          {errorGeneral}
        </Aviso>
      )}

      {/* ── PASO 1: SUBIR ARCHIVO ───────────────────────────────────────── */}
      {paso === 1 && (
        <section className="space-y-6 rounded-2xl border border-[#1C2A3E] bg-[#0A1220]/95 p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#1C2A3E]/60 pb-5">
            <div>
              <h2 className="text-base font-bold text-white font-display">Plantilla recomendada</h2>
              <p className="text-xs text-[#8E9CAE] mt-0.5">
                Usa nuestra plantilla oficial con encabezados válidos y formatos de ejemplo.
              </p>
            </div>
            <Button variant="secondary" onClick={descargarPlantilla} type="button">
              Descargar plantilla CSV
            </Button>
          </div>

          <div className="space-y-3">
            <Button type="button" variant="secondary" onClick={() => setMostrarPreparacion((actual) => !actual)}>Preparar plantilla Excel precargada</Button>
            {mostrarPreparacion && (
              <div className="space-y-4 rounded-xl border border-slate-700 p-4">
                <h3 className="text-white font-bold">Datos para tu plantilla</h3>
                <p className="text-xs text-slate-400">Selecciona tus vehículos y completa datos comunes. Podrás editar cada fila en Excel. Las rutas con paradas intermedias se capturan en traslado individual.</p>
                <Button type="button" variant="secondary" loading={preparandoPlantilla} onClick={() => void cargarVehiculosPlantilla()}>Cargar mis vehículos</Button>
                {vehiculosPlantilla.map((v) => <label key={v.id} className="flex gap-2 text-sm text-slate-200">
                  <input type="checkbox" checked={seleccionVehiculos.includes(v.id)} disabled={preparandoPlantilla} onChange={(e) => { const seleccionada = e.target.checked; setSeleccionVehiculos((actual) => seleccionada ? [...actual, v.id] : actual.filter((id) => id !== v.id)); }} />
                  {v.marca} {v.modelo} · {v.placas || v.vin}
                </label>)}
                <p className="text-sm text-slate-300">{seleccionVehiculos.length} vehículos seleccionados (máximo 100).</p>
                {!seleccionVehiculos.length && <label className="block text-sm text-slate-300">Cantidad de filas vacías<input className="block rounded bg-[#070D18] p-2" type="number" min={1} max={100} value={cantidadPlantilla} onChange={(e) => setCantidadPlantilla(Number(e.target.value))} /></label>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CAMPOS_COMUNES.map(([titulo, campo]) => <label key={campo} className="text-xs text-slate-300">{titulo.replaceAll("_", " ")}
                    {campo === "modalidad_programacion" || campo === "tipo_ruta" ? (
                      <select className="block w-full rounded bg-[#070D18] p-2" value={comunesPlantilla[campo] ?? ""} onChange={(e) => setComunesPlantilla({ ...comunesPlantilla, [campo]: e.target.value })}>
                        {(campo === "tipo_ruta" ? ["local", "foraneo"] : ["lo_antes_posible", "programado"]).map((opcion) => <option key={opcion} value={opcion}>{opcion.replaceAll("_", " ")}</option>)}
                      </select>
                    ) : <input className="block w-full rounded bg-[#070D18] p-2" value={comunesPlantilla[campo] ?? ""} onChange={(e) => setComunesPlantilla({ ...comunesPlantilla, [campo]: e.target.value })} />}
                  </label>)}
                </div>
                <Button type="button" loading={preparandoPlantilla} disabled={seleccionVehiculos.length > 100} onClick={() => void descargarExcel()}>Descargar Excel precargado</Button>
              </div>
            )}
            <label
              htmlFor="archivo-csv"
              className="flex flex-col items-center justify-center border-2 border-dashed border-[#1C2A3E] hover:border-[#FFC400]/50 bg-[#070D18]/80 rounded-xl p-8 text-center cursor-pointer transition"
            >
              <div className="size-12 rounded-full bg-[#141F32] flex items-center justify-center text-[#FFC400] mb-3">
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm font-bold text-white font-display">
                Selecciona tu archivo Excel o CSV
              </p>
              <p className="text-xs text-[#8E9CAE] mt-1">
                Archivos .xlsx o .csv hasta 5 MB (máximo 100 traslados por lote)
              </p>
              <input
                id="archivo-csv"
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={analizando || enviando}
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void manejarArchivo(f);
                }}
              />
            </label>
          </div>

          {analizando && (
            <div className="p-4 rounded-xl border border-[#FFC400]/30 bg-[#FFC400]/5 space-y-3">
              <div className="flex items-center justify-between text-xs text-[#FFC400] font-bold">
                <span>Analizando archivo y calculando rutas...</span>
                {progresoGeocodificacion && (
                  <span>
                    {progresoGeocodificacion.actual} / {progresoGeocodificacion.total}
                  </span>
                )}
              </div>
              <div className="w-full bg-[#141F32] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#FFC400] h-full transition-all duration-300"
                  style={{
                    width: progresoGeocodificacion
                      ? `${Math.round((progresoGeocodificacion.actual / progresoGeocodificacion.total) * 100)}%`
                      : "25%"
                  }}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    abortEnriquecimientoRef.current?.abort();
                    setErrorGeneral("Carga cancelada por el usuario.");
                  }}
                >
                  Cancelar carga
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── PASO 2: REVISIÓN TABULAR ────────────────────────────────────── */}
      {paso === 2 && (
        <section className="space-y-6">
          {/* Métricas de revisión */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setFiltroTabla("todas")}
              className={`p-4 rounded-xl border text-left transition ${
                filtroTabla === "todas" ? "border-sky-500 bg-sky-500/10" : "border-[#1C2A3E] bg-[#0A1220]"
              }`}
            >
              <p className="text-xs text-[#8E9CAE]">Total filas</p>
              <p className="text-xl font-extrabold text-white mt-1 font-mono">{filas.length}</p>
            </button>
            <button
              type="button"
              onClick={() => setFiltroTabla("validas")}
              className={`p-4 rounded-xl border text-left transition ${
                filtroTabla === "validas" ? "border-emerald-500 bg-emerald-500/10" : "border-[#1C2A3E] bg-[#0A1220]"
              }`}
            >
              <p className="text-xs text-[#8E9CAE]">Listas para crear</p>
              <p className="text-xl font-extrabold text-emerald-400 mt-1 font-mono">{totalValidas}</p>
            </button>
            <button
              type="button"
              onClick={() => setFiltroTabla("advertencias")}
              className={`p-4 rounded-xl border text-left transition ${
                filtroTabla === "advertencias" ? "border-amber-500 bg-amber-500/10" : "border-[#1C2A3E] bg-[#0A1220]"
              }`}
            >
              <p className="text-xs text-[#8E9CAE]">Advertencias</p>
              <p className="text-xl font-extrabold text-amber-400 mt-1 font-mono">{totalAdvertencias}</p>
            </button>
            <button
              type="button"
              onClick={() => setFiltroTabla("errores")}
              className={`p-4 rounded-xl border text-left transition ${
                filtroTabla === "errores" ? "border-rose-500 bg-rose-500/10" : "border-[#1C2A3E] bg-[#0A1220]"
              }`}
            >
              <p className="text-xs text-[#8E9CAE]">Con errores</p>
              <p className="text-xl font-extrabold text-rose-400 mt-1 font-mono">{totalErrores}</p>
            </button>
          </div>

          {totalErrores > 0 && (
            <Aviso tono="atencion">
              {totalErrores} {totalErrores === 1 ? "fila contiene errores bloqueantes" : "filas contienen errores bloqueantes"}.
              Puedes corregirlas aquí. Solo se enviarán las filas válidas y seleccionadas.
            </Aviso>
          )}

          {/* Tabla de filas */}
          <div className="rounded-2xl border border-[#1C2A3E] bg-[#0A1220]/95 overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[460px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-[#141F32] border-b border-[#1C2A3E] text-[#8E9CAE] uppercase font-mono">
                  <tr>
                    <th className="py-3 px-3">Incluir</th>
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3">Vehículo</th>
                    <th className="py-3 px-3">Origen</th>
                    <th className="py-3 px-3">Destino</th>
                    <th className="py-3 px-3">Distancia</th>
                    <th className="py-3 px-3">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2A3E]/60 text-slate-200">
                  {filasFiltradas.map((f) => {
                    const tieneError = f.errores.length > 0;
                    const tieneAdv = f.advertencias.length > 0;
                    return (
                      <tr key={f.numero} className="hover:bg-white/5 transition">
                        <td className="py-2.5 px-3">
                          <input
                            type="checkbox"
                            aria-label={`Incluir fila ${f.numero}`}
                            checked={!f.excluida && !tieneError}
                            disabled={tieneError || guardando}
                            onChange={(e) => {
                              const incluida = e.target.checked;
                              setFilas((actuales) => actuales.map((fila) =>
                                fila.numero === f.numero ? { ...fila, excluida: !incluida } : fila
                              ));
                            }}
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#8E9CAE]">{f.numero}</td>
                        <td className="py-2.5 px-3">
                          {tieneError ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Error
                            </span>
                          ) : tieneAdv ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Aviso
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Listo
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-white whitespace-nowrap">
                          {f.datos.vehiculo_marca} {f.datos.vehiculo_modelo} ({f.datos.vehiculo_anio})
                          <span className="block text-[11px] text-[#8E9CAE] font-mono">
                            {f.datos.vehiculo_placas || f.datos.vehiculo_vin || "Sin placa"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-[200px] truncate" title={f.datos.origen_direccion}>
                          {f.datos.origen_direccion}
                        </td>
                        <td className="py-2.5 px-3 max-w-[200px] truncate" title={f.datos.destino_direccion}>
                          {f.datos.destino_direccion}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono">
                          {f.datos.distancia_km ? `${Number(f.datos.distancia_km).toFixed(1)} km` : "Pendiente"}
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {tieneError ? (
                            <span className="text-rose-400">{f.errores.join("; ")}</span>
                          ) : tieneAdv ? (
                            <span className="text-amber-400">{f.advertencias.join("; ")}</span>
                          ) : (
                            <span className="text-emerald-400">Ruta lista</span>
                          )}
                          <button type="button" className="block mt-2 text-[#FFC400] underline" disabled={guardando} onClick={() => setEdicion({ numero: f.numero, datos: { ...f.original } })}>Corregir fila {f.numero}</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {edicion && (
            <form className="rounded-xl border border-[#1C2A3E] bg-[#0A1220] p-4 space-y-4" onSubmit={(e) => { e.preventDefault(); void guardarEdicion(); }}>
              <h3 className="text-white font-bold">Corregir fila {edicion.numero}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from(new Set([...COLUMNAS_PLANTILLA, ...Object.keys(edicion.datos)])).map((campo) => (
                  <label key={campo} className="text-xs text-slate-300">{campo.replaceAll("_", " ")}
                    <input className="block w-full mt-1 rounded border border-slate-600 bg-[#070D18] p-2 text-white" value={edicion.datos[campo] ?? ""} disabled={guardando} onChange={(e) => setEdicion({ ...edicion, datos: { ...edicion.datos, [campo]: e.target.value } })} />
                  </label>
                ))}
              </div>
              <Button type="submit" loading={guardando}>Guardar y volver a validar</Button>
              <Button type="button" variant="secondary" disabled={guardando} onClick={() => setEdicion(null)}>Descartar cambios</Button>
            </form>
          )}
          <div className="flex items-center justify-between pt-2">
            <Button variant="secondary" onClick={() => { setEdicion(null); setPaso(1); }} disabled={guardando} type="button">
              Cargar otro archivo
            </Button>
            <Button
              variant="primary"
              disabled={totalValidas === 0 || !!edicion || guardando}
              onClick={() => void cotizarSeleccionadas()}
              type="button"
            >
              Continuar al resumen ({totalValidas} listos)
            </Button>
          </div>
        </section>
      )}

      {/* ── PASO 3: RESUMEN Y CONFIRMACIÓN ─────────────────────────────── */}
      {paso === 3 && (
        <section className="space-y-6 rounded-2xl border border-[#1C2A3E] bg-[#0A1220]/95 p-6 shadow-xl">
          <h2 className="text-lg font-bold font-display text-white border-b border-[#1C2A3E] pb-3">
            Confirmación del lote de traslados
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[#1C2A3E] bg-[#070D18]">
              <p className="text-xs text-[#8E9CAE]">Traslados a procesar</p>
              <p className="text-2xl font-extrabold text-[#FFC400] font-mono mt-1">{totalValidas}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#1C2A3E] bg-[#070D18]">
              <p className="text-xs text-[#8E9CAE]">Archivo origen</p>
              <p className="text-sm font-semibold text-white mt-2 truncate">{archivo?.name}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#1C2A3E] bg-[#070D18]">
              <p className="text-xs text-[#8E9CAE]">Filas pendientes o excluidas</p>
              <p className="text-2xl font-extrabold text-rose-400 font-mono mt-1">{totalOmitidas}</p>
            </div>
          </div>

          <div aria-live="polite" className="space-y-3">
            <h3 className="text-white font-bold">Cotización del lote</h3>
            {cotizando ? <p className="text-slate-300">Consultando tarifas…</p> : (
              <>
                <ul className="space-y-2 text-sm text-slate-200">
                  {filasSeleccionadas.map((f) => <li key={f.numero}>Fila {f.numero} · {f.datos.vehiculo_placas || f.datos.vehiculo_vin}: {f.errorTarifa || (f.tarifa !== undefined ? moneda(f.tarifa) : "Pendiente de cotizar")}</li>)}
                </ul>
                <p className="text-lg text-[#FFC400] font-bold">{todasCotizadas ? "Total estimado" : "Subtotal de filas cotizadas"}: {moneda(totalCotizado)}</p>
                {!todasCotizadas && <Button type="button" variant="secondary" onClick={() => void cotizarSeleccionadas()}>Reintentar cotización</Button>}
                <p className="text-xs text-slate-400">Importes en MXN. La tarifa se recalcula al crear; puede variar si cambia el horario o la configuración vigente.</p>
              </>
            )}
          </div>
          <p className="text-sm text-slate-200">Se enviarán {totalValidas} de {filas.length} filas. {totalOmitidas} quedarán pendientes o excluidas.</p>
          <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 text-xs text-sky-200 space-y-1">
            <p className="font-bold text-sky-400">ℹ️ Cálculo tarifario server-side</p>
            <p>
              Cada traslado cotizado se creará con la tarifa vigente calculada según la
              categoría del vehículo, distancia y ventanas de tiempo.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#1C2A3E]">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setPaso(2)} type="button" disabled={enviando || cotizando}>
                Volver a la tabla
              </Button>

            </div>
            <Button
              variant="primary"
              loading={enviando}
              disabled={enviando || cotizando || !todasCotizadas}
              onClick={ejecutarCarga}
              type="button"
            >
              Crear {totalValidas} traslados
            </Button>
          </div>
        </section>
      )}

      {/* ── PASO 4: RESULTADO Y REPORTE ─────────────────────────────────── */}
      {paso === 4 && resultado && (
        <section className="space-y-6 rounded-2xl border border-[#1C2A3E] bg-[#0A1220]/95 p-6 shadow-xl text-center">
          <div className="size-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <Icono nombre="palomita" className="size-8" strokeWidth={2.5} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold font-display text-white">
              {resultado.estado === "cancelada" ? "Lote cancelado" : resultado.estado === "rechazada" ? "Lote rechazado" : "Carga masiva procesada"}
            </h2>
            <p className="text-sm text-[#8E9CAE]">
              {resultado.filas_creadas} traslados fueron registrados exitosamente en tu cuenta.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto py-2">
            <div className="p-3 rounded-xl border border-[#1C2A3E] bg-[#070D18]">
              <p className="text-[11px] text-[#8E9CAE]">Creados</p>
              <p className="text-xl font-bold text-emerald-400 font-mono">{resultado.filas_creadas}</p>
            </div>
            <div className="p-3 rounded-xl border border-[#1C2A3E] bg-[#070D18]">
              <p className="text-[11px] text-[#8E9CAE]">Con error</p>
              <p className="text-xl font-bold text-rose-400 font-mono">{resultado.filas_error}</p>
            </div>
            <div className="p-3 rounded-xl border border-[#1C2A3E] bg-[#070D18] col-span-2 sm:col-span-1">
              <p className="text-[11px] text-[#8E9CAE]">Total procesados</p>
              <p className="text-xl font-bold text-white font-mono">{resultado.filas_procesadas}</p>
            </div>
          </div>

          {resultado.filas_error > 0 && (
            <div className="max-w-md mx-auto">
              <Aviso tono="atencion">
                Algunas filas no pudieron crearse. Puedes descargar el reporte de errores para corregirlas.
              </Aviso>
              {errorReporte && <Aviso tono="atencion">No se pudo recuperar el reporte. <button type="button" onClick={() => void cargarReporteServidor()}>Reintentar reporte</button></Aviso>}
              <div className="mt-3">
                <Button
                  variant="secondary"
                  disabled={!reporteServidor}
                  onClick={() => reporteServidor && descargarReporteErrores(reporteServidor)}
                  type="button"
                >
                  Descargar reporte de errores (.csv)
                </Button>
              </div>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-[#1C2A3E]">
            <Button variant="secondary" onClick={() => { setPaso(1); setArchivo(null); setFilas([]); setResultado(null); setReporteServidor(null); setErrorReporte(false); }} type="button">
              Cargar otro archivo
            </Button>
            <Button variant="primary" onClick={() => setPaso(5)} type="button">
              Proceder al pago ({moneda(totalCotizado)})
            </Button>
          </div>
        </section>
      )}

      {/* ── PASO 5: CHECKOUT CONSOLIDADO ─────────────────────────────────── */}
      {paso === 5 && (
        <section className="space-y-6 rounded-2xl border border-[#1C2A3E] bg-[#0A1220]/95 p-6 shadow-xl">
          <h2 className="text-lg font-bold font-display text-white border-b border-[#1C2A3E] pb-3">
            Pago consolidado del lote
          </h2>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-[#FFC400]/30 bg-[#FFC400]/5">
              <p className="text-xs text-[#8E9CAE]">Total a pagar ({totalValidas} traslados)</p>
              <p className="text-3xl font-extrabold text-[#FFC400] font-mono mt-1">{moneda(totalCotizado)}</p>
            </div>

            <div className="space-y-2 text-sm text-slate-200 max-h-[200px] overflow-y-auto">
              {filasSeleccionadas.map((f) => (
                <div key={f.numero} className="flex justify-between items-center py-1 border-b border-[#1C2A3E]/40">
                  <span>Fila {f.numero} · {f.datos.vehiculo_placas || f.datos.vehiculo_vin}</span>
                  <span className="font-mono">{f.tarifa !== undefined ? moneda(f.tarifa) : "Pendiente"}</span>
                </div>
              ))}
            </div>

            {pagoCompletado ? (
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center">
                <p className="text-emerald-400 font-bold text-lg">Pago procesado exitosamente</p>
                <p className="text-sm text-slate-300 mt-1">Tus {totalValidas} traslados han sido registrados.</p>
                <Button variant="primary" onClick={() => router.push("/mis-viajes")} type="button" className="mt-4">
                  Ver mis traslados
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Al continuar, se procesará el pago de todos los traslados del lote de forma consolidada.
                </p>
                <Button
                  variant="primary"
                  loading={pagoProcesando}
                  disabled={pagoProcesando || !todasCotizadas}
                  onClick={async () => {
                    setPagoProcesando(true);
                    try {
                      // Simular procesamiento de pago consolidado
                      await new Promise((resolve) => setTimeout(resolve, 2000));
                      setPagoCompletado(true);
                    } catch (err) {
                      setErrorGeneral(err instanceof Error ? err.message : "Error al procesar el pago.");
                    } finally {
                      setPagoProcesando(false);
                    }
                  }}
                  type="button"
                >
                  Pagar {moneda(totalCotizado)} con Stripe
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#1C2A3E]">
            <Button variant="secondary" onClick={() => setPaso(4)} type="button" disabled={pagoProcesando}>
              Volver al resultado
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
