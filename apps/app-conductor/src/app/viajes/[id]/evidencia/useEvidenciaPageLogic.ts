"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Aviso, MapaEstatico } from "@ruum/ui";
import { TEXTOS_CARGANDO } from "@ruum/shared/constants";
import type { AnguloEvidencia, Database, FotoEvidencia, TipoEvidencia } from "@ruum/shared/types";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import { CONTACTOS_SOPORTE_CONDUCTOR } from "@/lib/contactos-soporte";
import { esNativo } from "@/lib/capacitor";
import { capturarFoto, seleccionarFotoGaleria, comprimirDataUrl, evaluarNitidez } from "@/lib/camara";
import {
  obtenerPasaporteDigital,
  obtenerEvidenciaDeTraslado,
  confirmarEvidenciaCompleta,
  firmarUrlsEvidencia,
  registrarEvento
} from "@ruum/api/services";
import { useEvidenceQueue } from "./useEvidenceQueue";
import { fotoSrc } from "./evidence-requirements";
import { obtenerInspeccionTraslado, guardarInspeccionTraslado } from "@ruum/api/drivers";
import { useLiveRegion } from "@/components/LiveRegionProvider";

type PasaporteDigitalRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type EstadoTraslado = "pendiente_de_conductor" | "conductor_asignado" | "conductor_en_camino_al_origen" | "conductor_en_punto_de_recoleccion" | "verificacion_vehiculo_en_proceso" | "evidencia_inicial_en_proceso" | "traslado_en_curso" | "llegada_a_destino" | "evidencia_final_en_proceso" | "servicio_cerrado";

// Map trip state to evidence type
export function tipoEvidenciaPorEstado(estado: EstadoTraslado): TipoEvidencia | null {
  if (["conductor_en_punto_de_recoleccion", "verificacion_vehiculo_en_proceso", "evidencia_inicial_en_proceso"].includes(estado)) {
    return "inicial";
  }
  if (["llegada_a_destino", "evidencia_final_en_proceso"].includes(estado)) {
    return "final";
  }
  return null;
}

export interface UseEvidenciaPageLogic {
  estadoActual: EstadoTraslado | null;
  pasaporte: PasaporteDigitalRow | null;
  tipo: TipoEvidencia | null;
  soporteAbierto: boolean;
  setSoporteAbierto: (v: boolean) => void;
  cargando: boolean;
  error: string | null;
  aviso: string | null;
  avisoExito: string | null;
  setAviso: (v: string | null) => void;
  setAvisoExito: (v: string | null) => void;
  // Inspeccion form values
  kilometraje: string;
  setKilometraje: (v: string) => void;
  gasolinaSegments: number;
  setGasolinaSegments: (v: number) => void;
  llavesCount: number;
  setLlavesCount: (v: number) => void;
  tarjetaCirculacion: string;
  setTarjetaCirculacion: (v: string) => void;
  talonVerificacion: string;
  setTalonVerificacion: (v: string) => void;
  hologramaVerificacion: string;
  setHologramaVerificacion: (v: string) => void;
  placaDelantera: string;
  setPlacaDelantera: (v: string) => void;
  placaTrasera: string;
  setPlacaTrasera: (v: string) => void;
  notas: string;
  setNotas: (v: string) => void;
  // Accordion states
  acordeonDocsAbierto: boolean;
  setAcordeonDocsAbierto: (v: boolean) => void;
  acordeonNotasAbierto: boolean;
  setAcordeonNotasAbierto: (v: boolean) => void;
  // Custom states
  presentaDanosNuevos: boolean;
  setPresentaDanosNuevos: (v: boolean) => void;
  mostrarRecibo: boolean;
  setMostrarRecibo: (v: boolean) => void;
  tipoReporteEnviado: "sms" | "email" | null;
  setTipoReporteEnviado: (v: "sms" | "email" | null) => void;
  enviandoCopia: boolean;
  setEnviandoCopia: (v: boolean) => void;
  // R5 — CES/CSAT
  showCsatSheet: boolean;
  setShowCsatSheet: (v: boolean) => void;
  csatValor: number | null;
  setCsatValor: (v: number | null) => void;
  cesValor: number | null;
  setCesValor: (v: number | null) => void;
  enviandoFeedback: boolean;
  setEnviandoFeedback: (v: boolean) => void;
  // Uploaded photos
  fotos: FotoEvidencia[];
  setFotos: (v: FotoEvidencia[]) => void;
  enviando: AnguloEvidencia | "guardar" | "confirmar" | null;
  setEnviando: (v: AnguloEvidencia | "guardar" | "confirmar" | null) => void;
  // Computed
  fotosObligatorias: number;
  totalRequisitos: number;
  angulosObligatorios: AnguloEvidencia[];
  fotosObligCapturadas: number;
  docsCapturados: number;
  totalCapturados: number;
  origen: string;
  folio: string;
  // Refs
  inputArchivoRef: React.RefObject<HTMLInputElement | null>;
  anguloArchivoRef: React.RefObject<AnguloEvidencia | null>;
  // Functions
  registrarFotoLocal: (angulo: AnguloEvidencia, dataUrl: string) => Promise<void>;
  drenarCola: () => Promise<void>;
  capturar: (angulo: AnguloEvidencia) => Promise<void>;
  procesarArchivoSeleccionado: (archivo: File | undefined) => Promise<void>;
  getFuelText: (segments: number) => string;
  guardarBorrador: () => Promise<void>;
  finalizar: () => Promise<void>;
  enviarFeedback: () => Promise<void>;
  omitirFeedback: () => Promise<void>;
  isPhotoCaptured: (angulo: AnguloEvidencia) => boolean;
  obtenerFoto: (angulo: AnguloEvidencia) => FotoEvidencia | undefined;
}

export function useEvidenciaPageLogic(id: string): UseEvidenciaPageLogic {
  const router = useRouter();
  const inputArchivoRef = useRef<HTMLInputElement | null>(null);
  const anguloArchivoRef = useRef<AnguloEvidencia | null>(null);

  const { alert: anunciarUrgente, announce } = useLiveRegion();
  const [estadoActual, setEstadoActual] = useState<EstadoTraslado | null>(null);
  const [pasaporte, setPasaporte] = useState<PasaporteDigitalRow | null>(null);
  const [tipo, setTipo] = useState<TipoEvidencia | null>(null);
  const [soporteAbierto, setSoporteAbierto] = useState(false);

  // Inspeccion Form Values
  const [kilometraje, setKilometraje] = useState("");
  const [gasolinaSegments, setGasolinaSegments] = useState(4); // default 4/8 (1/2)
  const [llavesCount, setLlavesCount] = useState(2);
  const [tarjetaCirculacion, setTarjetaCirculacion] = useState("");
  const [talonVerificacion, setTalonVerificacion] = useState("");
  const [hologramaVerificacion, setHologramaVerificacion] = useState("");
  const [placaDelantera, setPlacaDelantera] = useState("");
  const [placaTrasera, setPlacaTrasera] = useState("");
  const [notas, setNotas] = useState("");

  // Accordion states for Documentos/Placas and Notas
  const [acordeonDocsAbierto, setAcordeonDocsAbierto] = useState(true);
  const [acordeonNotasAbierto, setAcordeonNotasAbierto] = useState(true);

  // Custom states for damages and receipt modal
  const [presentaDanosNuevos, setPresentaDanosNuevos] = useState(false);
  const [mostrarRecibo, setMostrarRecibo] = useState(false);
  const [tipoReporteEnviado, setTipoReporteEnviado] = useState<"sms" | "email" | null>(null);
  const [enviandoCopia, setEnviandoCopia] = useState(false);

  // R5 — CES/CSAT (1/3 traslados, post-evidencia)
  const [showCsatSheet, setShowCsatSheet] = useState(false);
  const [csatValor, setCsatValor] = useState<number | null>(null);
  const [cesValor, setCesValor] = useState<number | null>(null);
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);

  // Uploaded photos
  const [fotos, setFotos] = useState<FotoEvidencia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState<AnguloEvidencia | "guardar" | "confirmar" | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [avisoExito, setAvisoExito] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    cargarPendientesLocales,
    drenarColaPendiente,
    registrarFotoEnCola
  } = useEvidenceQueue({ trasladoId: id, tipo });

  const fotosObligatorias = 5; // frente, lado_piloto, lado_copiloto, trasera, tablero (adicional es opcional)
  const totalRequisitos = fotosObligatorias + 1 + 5; // fotos obligatorias + kilometraje + 5 docs/placas = 11
  const angulosObligatorios: AnguloEvidencia[] = ["frente", "lado_piloto", "lado_copiloto", "trasera", "tablero"];
  const fotosObligCapturadas = angulosObligatorios.filter((a) => fotos.some((f) => f.angulo === a)).length;
  const docsCapturados = [tarjetaCirculacion, talonVerificacion, hologramaVerificacion, placaDelantera, placaTrasera].filter((v) => v === "si").length;
  const totalCapturados = fotosObligCapturadas + docsCapturados + (kilometraje.trim() ? 1 : 0);

  const origen =
    pasaporte?.origen_ciudad ||
    (process.env.NODE_ENV !== "production" ? "San Mateo Atenco" : "Origen no especificado");
  const folio = pasaporte?.traslado_id?.slice(0, 8).toUpperCase() || id.slice(0, 8).toUpperCase();

  // Load inspection from database
  const loadInspeccion = useCallback(async (tipoEvidencia: TipoEvidencia) => {
    const cliente = crearClienteNavegador();
    const data = await obtenerInspeccionTraslado(cliente, id, tipoEvidencia);
    if (data) {
      if (data.kilometraje !== null) {
        setKilometraje(data.kilometraje.toLocaleString("es-MX"));
      }
      setLlavesCount(data.llaves_recibidas == null ? 2 : Number(data.llaves_recibidas));
      setTarjetaCirculacion(data.tarjeta_circulacion || "no");
      setTalonVerificacion(data.talon_verificacion || "no");
      setHologramaVerificacion(data.holograma_verificacion ? "si" : "no");
      setPlacaDelantera(data.placa_delantera || "no");
      setPlacaTrasera(data.placa_trasera || "no");
      setNotas(data.notas || "");

      // Fuel map to segments
      if (data.combustible) {
        if (data.combustible === "Lleno") setGasolinaSegments(8);
        else if (data.combustible === "3/4") setGasolinaSegments(6);
        else if (data.combustible === "1/2") setGasolinaSegments(4);
        else if (data.combustible === "1/4") setGasolinaSegments(2);
        else if (data.combustible === "Reserva") setGasolinaSegments(1);
      }
    }
  }, [id]);

  const refrescarEvidencia = useCallback(async (tipoEvidencia: TipoEvidencia) => {
    const cliente = crearClienteNavegador();
    const [remotas, locales] = await Promise.all([
      obtenerEvidenciaDeTraslado(cliente, id, tipoEvidencia),
      cargarPendientesLocales()
    ]);
    const remotasFirmadas = await firmarUrlsEvidencia(cliente, remotas);
    setFotos([
      ...remotasFirmadas,
      ...locales.filter(
        (local) => local.tipo === tipoEvidencia && !remotasFirmadas.some((remota) => remota.id === local.id)
      )
    ]);
  }, [cargarPendientesLocales, id]);

  useEffect(() => {
    async function init() {
      if (!tieneSupabaseConfigurado()) {
        setAviso("Supabase no está configurado.");
        setCargando(false);
        return;
      }
      try {
        const cliente = crearClienteNavegador();
        const p = await obtenerPasaporteDigital(cliente, id);
        if (p) {
          setPasaporte(p);
          setEstadoActual(p.estado as EstadoTraslado);
          const t = tipoEvidenciaPorEstado(p.estado as EstadoTraslado) || "inicial";
          setTipo(t);
          await Promise.all([loadInspeccion(t), refrescarEvidencia(t)]);
        }
      } catch (err) {
        setAviso(traducirErrorOperativo(err, "No pudimos cargar la información de evidencias."));
      } finally {
        setCargando(false);
      }
    }
    init();
  }, [id, loadInspeccion, refrescarEvidencia]);

  // Handle local file selection
  async function registrarFotoLocal(angulo: AnguloEvidencia, dataUrl: string) {
    if (!tipo) return;
    setEnviando(angulo);
    setError(null);
    setAviso(null);
    try {
      const { nitida, motivo } = await evaluarNitidez(dataUrl);
      if (!nitida) {
        const msg =
          motivo === "muy_oscura"
            ? `Foto "${angulo}" muy oscura. Enciende el flash o busca mejor luz y vuelve a capturar.`
            : motivo === "muy_clara"
            ? `Foto "${angulo}" sobreexpuesta. Evita luz directa al lente y reintenta.`
            : `Foto "${angulo}" borrosa. Sostén el teléfono firme a 1–2 m y reintenta.`;
        setError(msg);
        anunciarUrgente(msg);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([30, 30, 30]);
        setEnviando(null);
        return;
      }
    } catch {}
    try {
      const locales = await registrarFotoEnCola({ angulo, dataUrl });
      setFotos((prev) => [
        ...prev.filter((foto) => !locales.some((local) => local.id === foto.id)),
        ...locales.filter((local) => local.tipo === tipo)
      ]);

      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      if (offline) {
        setAviso("⚠️ Sin conexión. Guardamos la fotografía en la caché local del dispositivo de forma segura.");
        announce(`Foto ${angulo} guardada sin conexión, se sincronizará`);
      } else {
        setAvisoExito(`Fotografía "${angulo}" registrada localmente.`);
        announce(`Foto ${angulo} capturada`);
      }
      void drenarCola();
    } catch (err) {
      const msg = traducirErrorOperativo(err, "No pudimos guardar la fotografía.");
      setError(msg);
      anunciarUrgente(msg);
    } finally {
      setEnviando(null);
    }
  }

  const drenarCola = useCallback(async () => {
    if (!tipo) return;
    try {
      const subidas = await drenarColaPendiente();
      if (!subidas) return;
      await refrescarEvidencia(tipo);
      setAvisoExito(`✓ Conexión recuperada. Sincronizamos ${subidas} foto${subidas === 1 ? "" : "s"} en segundo plano con éxito.`);
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos sincronizar las fotos pendientes."));
    }
  }, [drenarColaPendiente, refrescarEvidencia, tipo]);

  useEffect(() => {
    if (!tipo) return;
    const timer = setTimeout(() => {
      void drenarCola();
    }, 500);

    const alVolverEnLinea = () => {
      void drenarCola();
    };

    window.addEventListener("online", alVolverEnLinea);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", alVolverEnLinea);
    };
  }, [tipo, drenarCola]);

  async function capturar(angulo: AnguloEvidencia) {
    if (esNativo()) {
      try {
        const foto = await capturarFoto();
        if (foto?.dataUrl) {
          await registrarFotoLocal(angulo, foto.dataUrl);
        }
      } catch (err) {
        setError(traducirErrorOperativo(err, "Error al tomar fotografía."));
      }
    } else {
      anguloArchivoRef.current = angulo;
      inputArchivoRef.current?.click();
    }
  }

  async function procesarArchivoSeleccionado(archivo: File | undefined) {
    const angulo = anguloArchivoRef.current;
    if (!archivo || !angulo) return;
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        if (reader.result) {
          let dataUrl = String(reader.result);
          try { dataUrl = await comprimirDataUrl(dataUrl, 1280, 0.72); } catch {}
          await registrarFotoLocal(angulo, dataUrl);
        }
      };
      reader.readAsDataURL(archivo);
    } catch (err) {
      setError("No se pudo leer el archivo seleccionado.");
    } finally {
      anguloArchivoRef.current = null;
      if (inputArchivoRef.current) inputArchivoRef.current.value = "";
    }
  }

  function getFuelText(segments: number) {
    if (segments >= 8) return "Lleno";
    if (segments >= 6) return "3/4";
    if (segments >= 4) return "1/2";
    if (segments >= 2) return "1/4";
    return "Reserva";
  }

  async function guardarBorrador() {
    if (!tipo) return;
    setEnviando("guardar");
    setError(null);
    setAviso(null);
    setAvisoExito(null);

    const cleanKilometraje = Number(kilometraje.replace(/[^0-9]/g, ""));

    try {
      const cliente = crearClienteNavegador();
      await guardarInspeccionTraslado(cliente, {
          traslado_id: id,
          tipo,
          combustible: getFuelText(gasolinaSegments),
          kilometraje: cleanKilometraje || null,
          llaves_recibidas: String(llavesCount),
          holograma_verificacion: hologramaVerificacion === "si",
          talon_verificacion: talonVerificacion,
          tarjeta_circulacion: tarjetaCirculacion,
          placa_delantera: placaDelantera,
          placa_trasera: placaTrasera,
          notas: notas.trim() || null
        });
      setAvisoExito("Borrador guardado exitosamente.");
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos guardar el borrador."));
    } finally {
      setEnviando(null);
    }
  }

  async function finalizar() {
    if (!tipo) return;
    setEnviando("confirmar");
    setError(null);
    setAviso(null);
    setAvisoExito(null);

    const requiredAngles: AnguloEvidencia[] = ["frente", "lado_piloto", "lado_copiloto", "trasera", "tablero"];
    const missingPhotos = requiredAngles.filter(
      (angle) => !fotos.some((f) => f.angulo === angle)
    );
    const pendingSync = requiredAngles.filter(
      (angle) => {
        const f = fotos.find((x) => x.angulo === angle);
        return f && !f.sincronizada;
      }
    );

    if (missingPhotos.length > 0) {
      const msg = `Falta capturar fotografías obligatorias: ${missingPhotos.join(", ")}. Toca cada cuadro para tomar la foto.`;
      setError(msg);
      anunciarUrgente(msg);
      setEnviando(null);
      return;
    }
    if (pendingSync.length > 0) {
      const msg = `Fotografías aún sincronizando: ${pendingSync.join(", ")}. Espera a que suban y reintenta.`;
      setError(msg);
      anunciarUrgente(msg);
      setEnviando(null);
      void drenarCola();
      return;
    }
    if (tipo === "final" && presentaDanosNuevos && !fotos.some((f) => f.angulo === "dano_previo")) {
      const msg = "Marcaste que hay daños nuevos: captura la foto de \"Daño previo\" para documentarlos.";
      setError(msg);
      anunciarUrgente(msg);
      setEnviando(null);
      return;
    }

    try {
      const cleanKilometraje = Number(kilometraje.replace(/[^0-9]/g, ""));
      const cliente = crearClienteNavegador();
      await guardarInspeccionTraslado(cliente, {
          traslado_id: id,
          tipo,
          combustible: getFuelText(gasolinaSegments),
          kilometraje: cleanKilometraje || null,
          llaves_recibidas: String(llavesCount),
          holograma_verificacion: hologramaVerificacion === "si",
          talon_verificacion: talonVerificacion,
          tarjeta_circulacion: tarjetaCirculacion,
          placa_delantera: placaDelantera,
          placa_trasera: placaTrasera,
          notas: notas.trim() || null
        });

      const estadoEsperado = tipo === "inicial" ? "evidencia_inicial_en_proceso" : "evidencia_final_en_proceso";
      await confirmarEvidenciaCompleta(cliente, id, estadoActual ?? estadoEsperado, tipo);
      setAvisoExito("Evidencias completadas y enviadas con éxito.");
      anunciarUrgente("Evidencia enviada con éxito");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([20, 30, 20]);
      const debePedirFeedback = tipo === "final" && (process.env.NODE_ENV !== "production" ? true : Math.random() < 0.34);
      if (debePedirFeedback) {
        setShowCsatSheet(true);
        setEnviando(null);
        return;
      }
      router.push(`/viajes/${id}`);
    } catch (err) {
      const msg = traducirErrorOperativo(err, "No pudimos finalizar el registro de evidencias.");
      setError(msg);
      anunciarUrgente(msg);
    } finally {
      setEnviando(null);
    }
  }

  async function enviarFeedback() {
    if (csatValor == null || cesValor == null) return;
    setEnviandoFeedback(true);
    try {
      const cliente = crearClienteNavegador();
      await Promise.allSettled([
        registrarEvento(cliente as unknown as Parameters<typeof registrarEvento>[0], "csat_traslado" as unknown as Parameters<typeof registrarEvento>[1], "conductor", id, { traslado_id: id, csat: csatValor, ces: cesValor, tipo } as unknown as Parameters<typeof registrarEvento>[4]),
        registrarEvento(cliente as unknown as Parameters<typeof registrarEvento>[0], "ces_evidencia" as unknown as Parameters<typeof registrarEvento>[1], "conductor", id, { traslado_id: id, ces: cesValor, csat: csatValor, tipo } as unknown as Parameters<typeof registrarEvento>[4])
      ]);
      try {
        localStorage.setItem(`ruum_csat_${id}`, JSON.stringify({ csat: csatValor, ces: cesValor, at: new Date().toISOString() }));
      } catch {}
      anunciarUrgente(`Gracias por tu feedback ${csatValor} estrellas`);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(20);
    } catch {}
    setEnviandoFeedback(false);
    setShowCsatSheet(false);
    router.push(`/viajes/${id}`);
  }

  async function omitirFeedback() {
    setShowCsatSheet(false);
    router.push(`/viajes/${id}`);
  }

  function isPhotoCaptured(angulo: AnguloEvidencia) {
    return fotos.some((f) => f.angulo === angulo);
  }

  function obtenerFoto(angulo: AnguloEvidencia) {
    return fotos.find((f) => f.angulo === angulo);
  }

  return {
    estadoActual,
    pasaporte,
    tipo,
    soporteAbierto,
    setSoporteAbierto,
    cargando,
    error,
    aviso,
    avisoExito,
    setAviso,
    setAvisoExito,
    kilometraje,
    setKilometraje,
    gasolinaSegments,
    setGasolinaSegments,
    llavesCount,
    setLlavesCount,
    tarjetaCirculacion,
    setTarjetaCirculacion,
    talonVerificacion,
    setTalonVerificacion,
    hologramaVerificacion,
    setHologramaVerificacion,
    placaDelantera,
    setPlacaDelantera,
    placaTrasera,
    setPlacaTrasera,
    notas,
    setNotas,
    acordeonDocsAbierto,
    setAcordeonDocsAbierto,
    acordeonNotasAbierto,
    setAcordeonNotasAbierto,
    presentaDanosNuevos,
    setPresentaDanosNuevos,
    mostrarRecibo,
    setMostrarRecibo,
    tipoReporteEnviado,
    setTipoReporteEnviado,
    enviandoCopia,
    setEnviandoCopia,
    showCsatSheet,
    setShowCsatSheet,
    csatValor,
    setCsatValor,
    cesValor,
    setCesValor,
    enviandoFeedback,
    setEnviandoFeedback,
    fotos,
    setFotos,
    enviando,
    setEnviando,
    fotosObligatorias,
    totalRequisitos,
    angulosObligatorios,
    fotosObligCapturadas,
    docsCapturados,
    totalCapturados,
    origen,
    folio,
    registrarFotoLocal,
    drenarCola,
    capturar,
    procesarArchivoSeleccionado,
    getFuelText,
    guardarBorrador,
    finalizar,
    enviarFeedback,
    omitirFeedback,
    isPhotoCaptured,
    obtenerFoto,
    inputArchivoRef,
    anguloArchivoRef
  };
}
