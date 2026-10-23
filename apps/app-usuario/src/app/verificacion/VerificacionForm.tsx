"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Aviso, MobileButton, MobileCard } from "@ruum/ui";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import {
  subirDocumentoIdentidad,
  subirFotoPerfil,
  actualizarPerfilUsuario,
  iniciarVerificacionDiditUsuario,
  obtenerEstadoVerificacionDiditUsuario,
  obtenerUsuarioActual,
  type PerfilUsuarioActualizable
} from "@ruum/api/services";
import { consultarCodigoPostalMx } from "../../lib/codigos-postales";
import { logStructuredWarn } from "../../lib/logger";
import { VerificationSheet } from "./VerificationSheet";
import { DiditVerificationModal } from "./DiditVerificationModal";

const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "application/pdf", "image/heic", "image/heif"];
const EXTENSIONES_ACEPTADAS = [".jpg", ".jpeg", ".png", ".pdf", ".heic", ".heif"];
const TAMANO_MAXIMO_MB = 10;
const TAMANO_MAXIMO_RETRATO_DIDIT_MB = 2;

function soloDigitos(valor: string, maximo?: number) {
  const limpio = valor.replace(/\D/g, "");
  return maximo ? limpio.slice(0, maximo) : limpio;
}

function extensionArchivo(nombre: string) {
  const punto = nombre.lastIndexOf(".");
  return punto >= 0 ? nombre.slice(punto).toLowerCase() : "";
}

function esErrorRed(error: unknown) {
  const mensaje = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    mensaje.includes("network") ||
    mensaje.includes("fetch") ||
    mensaje.includes("failed to fetch") ||
    mensaje.includes("load failed") ||
    mensaje.includes("timeout")
  );
}

/* ── Pantalla de confirmación tras envío manual ── */
function ConfirmacionEnRevision() {
  return (
    <div className="flex flex-col gap-5">
      <MobileCard padding="lg" elevated className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]">
          <svg
            className="size-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h2 className="mt-4 text-[20px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">
          Documentación enviada
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
          Recibimos tu identificación y domicilio. El equipo de Ruum revisará
          tu información en un plazo de <strong className="font-semibold text-[#0a2342] dark:text-white">24 a 48 horas hábiles</strong>.
        </p>

        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[#f3d8a2] bg-[#fef4e6] p-3.5 text-left dark:border-[#664d00] dark:bg-[#3d2e00]/40">
          <svg className="mt-0.5 size-4 shrink-0 text-[#765100] dark:text-[#ffc933]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
          <p className="text-[12px] leading-5 text-[#765100] dark:text-[#ffc933]">
            Mientras tu cuenta está en revisión puedes explorar la app. Te
            notificaremos por correo y SMS cuando quedes habilitado para solicitar traslados.
          </p>
        </div>

        <div className="mt-6">
          <Link
            href="/"
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#0a2342] px-5 py-3.5 text-[15.5px] font-bold text-white shadow-[0_12px_24px_-8px_rgba(10,35,66,0.35)] transition hover:bg-[#162c47] active:scale-[0.98] dark:bg-[#4d94ff] dark:text-[#061529]"
          >
            Ir al inicio
          </Link>
        </div>
      </MobileCard>
    </div>
  );
}

interface VerificacionFormProps {
  fotoPerfilInicial?: string | null;
  /** En revisión documental se ofrece Didit sin repetir el formulario manual. */
  soloDidit?: boolean;
  /** Destino interno tras completar la verificación (sanitizado por el padre). */
  destinoExito?: string;
}

export function VerificacionForm({ fotoPerfilInicial, soloDidit = false, destinoExito = "/viajes/nuevo" }: VerificacionFormProps = {}) {
  const router = useRouter();
  const cpDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Didit Verification State */
  const [mostrarDiditModal, setMostrarDiditModal] = useState(false);
  const [urlDidit, setUrlDidit] = useState<string | null>(null);
  const [sessionIdDidit, setSessionIdDidit] = useState<string | null>(null);
  const [cargandoDidit, setCargandoDidit] = useState(false);
  const [errorDidit, setErrorDidit] = useState<string | null>(null);
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState(fotoPerfilInicial ?? "");
  const [subiendoFotoPerfil, setSubiendoFotoPerfil] = useState(false);
  const [verificacionCompletada, setVerificacionCompletada] = useState(false);
  const [pollingDiditActivo, setPollingDiditActivo] = useState(false);
  const pollingRef = useRef<{ cancelado: boolean }>({ cancelado: false });

  // Polling corto tras modal o webhook demorado (cada 2s, máx 10 intentos = 20s)
  useEffect(() => {
    if (!pollingDiditActivo) return;
    pollingRef.current.cancelado = false;
    let intentos = 0;
    const maxIntentos = 10;

    const interval = setInterval(async () => {
      if (pollingRef.current.cancelado || intentos >= maxIntentos) {
        clearInterval(interval);
        setPollingDiditActivo(false);
        return;
      }
      intentos += 1;
      try {
        const cliente = crearClienteNavegador();
        const usuario = await obtenerUsuarioActual(cliente);
        if (usuario?.estado_verificacion === "verificado") {
          clearInterval(interval);
          setPollingDiditActivo(false);
          setVerificacionCompletada(true);
          router.push(destinoExito);
          router.refresh();
        }
      } catch (err) {
        // reintenta en el próximo ciclo
        logStructuredWarn("verificacion/VerificacionForm", "polling_didit_intento_fallido", err, { intentos });
      }
    }, 2000);

    return () => {
      pollingRef.current.cancelado = true;
      clearInterval(interval);
    };
  }, [pollingDiditActivo, destinoExito, router]);

  /* Manual Verification Form State */
  const [mostrarFoto, setMostrarFoto] = useState(false);
  const [mostrarFormularioManual, setMostrarFormularioManual] = useState(false);
  const [codigoPostal, setCodigoPostal] = useState("");
  const [estadoMx, setEstadoMx] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [colonia, setColonia] = useState("");
  const [coloniasCp, setColoniasCp] = useState<string[]>([]);
  const [ciudadesCp, setCiudadesCp] = useState<string[]>([]);
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [referencias, setReferencias] = useState("");
  const [cpConsultando, setCpConsultando] = useState(false);
  const [cpAviso, setCpAviso] = useState<string | null>(null);
  const [documento, setDocumento] = useState<File | null>(null);
  const [docAviso, setDocAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  /* Funciones Didit */
  async function iniciarDidit() {
    if (cargandoDidit) return;
    setCargandoDidit(true);
    setErrorDidit(null);
    setUrlDidit(null);
    setSessionIdDidit(null);
    setMostrarDiditModal(true);
    try {
      const cliente = crearClienteNavegador();
      const { url, sessionId } = await iniciarVerificacionDiditUsuario(cliente);
      setUrlDidit(url);
      setSessionIdDidit(sessionId ?? null);
    } catch (err) {
      setErrorDidit(
        err instanceof Error ? err.message : "No fue posible conectar con el servicio de verificación de Didit."
      );
    } finally {
      setCargandoDidit(false);
    }
  }

  function cerrarDidit() {
    const teniaSesion = Boolean(sessionIdDidit);
    setMostrarDiditModal(false);
    setUrlDidit(null);
    setSessionIdDidit(null);
    setErrorDidit(null);
    if (teniaSesion) {
      setPollingDiditActivo(true);
    }
  }

  async function cargarFotoPerfilDidit(archivo: File | undefined) {
    if (!archivo) return;
    setErrorDidit(null);
    if (!archivo.type.startsWith("image/")) {
      setErrorDidit("Selecciona una fotografía en formato JPG, PNG, WEBP o HEIC.");
      return;
    }
    // A-12: si supera 2 MB, intentar compresión cliente antes de rechazar; si falla, guiar
    let archivoAEnviar = archivo;
    if (archivo.size > TAMANO_MAXIMO_RETRATO_DIDIT_MB * 1024 * 1024) {
      const sizeMB = (archivo.size / 1024 / 1024).toFixed(1);
      // Intentar compresión vía canvas para imágenes grandes (evita obligar al usuario a buscar herramienta externa)
      try {
        const comprimido = await comprimirImagenCliente(archivo, TAMANO_MAXIMO_RETRATO_DIDIT_MB);
        if (comprimido && comprimido.size <= TAMANO_MAXIMO_RETRATO_DIDIT_MB * 1024 * 1024) {
          archivoAEnviar = comprimido;
        } else {
          setErrorDidit(
            `La foto pesa ${sizeMB} MB y supera el límite de ${TAMANO_MAXIMO_RETRATO_DIDIT_MB} MB. Se intentó comprimir sin éxito. Prueba: envía la foto por WhatsApp a ti mismo y descárgala (se comprime a JPG), o usa tinypng.com / fotos.google.com para reducirla, o toma la foto con resolución menor.`
          );
          return;
        }
      } catch (err) {
        logStructuredWarn("verificacion/VerificacionForm", "compresion_foto_perfil_fallida", err, { sizeMB });
        setErrorDidit(
          `La foto pesa ${sizeMB} MB y supera ${TAMANO_MAXIMO_RETRATO_DIDIT_MB} MB. Comprime la imagen antes de subirla: en iPhone Fotos > Compartir > Guardar en Archivos reduce calidad, o usa tinypng.com.`
        );
        return;
      }
    }

    setSubiendoFotoPerfil(true);
    try {
      const url = await subirFotoPerfil(crearClienteNavegador(), archivoAEnviar);
      setFotoPerfilUrl(url);
    } catch (err) {
      setErrorDidit(err instanceof Error ? err.message : "No pudimos guardar tu fotografía de perfil.");
    } finally {
      setSubiendoFotoPerfil(false);
    }
  }

  async function comprimirImagenCliente(archivo: File, maxMB: number): Promise<File | null> {
    // Solo imágenes
    if (!archivo.type.startsWith("image/")) return null;
    try {
      const bitmap = await createImageBitmap(archivo);
      const maxDim = 1024;
      let { width, height } = bitmap;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bitmap, 0, 0, width, height);
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.72));
      if (!blob) return null;
      if (blob.size > maxMB * 1024 * 1024) return null;
      return new File([blob], archivo.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
    } catch {
      return null;
    }
  }

  async function finalizarDidit() {
    if (cargandoDidit) return;
    /* CORRECCIÓN stale-session: sin sessionId el lookup devolvía la última
       verificación del usuario (podía ser de un intento anterior) y marcar
       éxito/rechazo equivocado. Se captura el id al inicio y se exige para
       decidir por tabla; sin id solo vale el estado canónico del usuario. */
    const sid = sessionIdDidit;
    if (!sid) {
      setErrorDidit("No pudimos vincular la sesión de verificación. Cierra y vuelve a iniciar la verificación con Didit.");
      return;
    }
    setCargandoDidit(true);
    setErrorDidit(null);
    try {
      const cliente = crearClienteNavegador();
      let resultado: "verificado" | "rechazado" | "pendiente" = "pendiente";

      // El mensaje del iframe sólo indica que Didit terminó. El webhook puede
      // tardar unos segundos; esperar la actualización canónica evita mostrar
      // éxito mientras la cuenta todavía sigue pendiente.
      for (let intento = 0; intento < 12; intento += 1) {
        const usuario = await obtenerUsuarioActual(cliente);
        const verificacion = await obtenerEstadoVerificacionDiditUsuario(cliente, sid);

        if (usuario?.estado_verificacion === "verificado") {
          resultado = "verificado";
          break;
        }
        /* Solo cuenta la fila de ESTA sesión: si el servicio devolvió otra
           (p. ej. por condición de carrera), se ignora y se sigue esperando. */
        if (verificacion && verificacion.session_id !== sid) {
          if (intento < 11) await new Promise((resolve) => window.setTimeout(resolve, 1000));
          continue;
        }
        if (["rechazado", "error", "expirado", "cancelado"].includes(verificacion?.estado ?? "")) {
          resultado = "rechazado";
          break;
        }
        if (intento < 11) await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }

      if (resultado === "verificado") {
        setMostrarDiditModal(false);
        setUrlDidit(null);
        setSessionIdDidit(null);
        setVerificacionCompletada(true);
        router.push(destinoExito);
        router.refresh();
        return;
      } else if (resultado === "rechazado") {
        setErrorDidit("La verificación no pudo confirmarse. Puedes reintentar o usar la opción manual.");
      } else {
        setErrorDidit("Recibimos tu verificación, pero todavía estamos procesando el resultado. Estamos consultando en segundo plano.");
        setPollingDiditActivo(true);
      }
      router.refresh();
    } catch (err) {
      setErrorDidit(err instanceof Error ? err.message : "No pudimos consultar el resultado de Didit.");
      router.refresh();
    } finally {
      setCargandoDidit(false);
    }
  }

  /* Consultar Código Postal (con debounce: evita disparar en cada tecla) */
  function consultarCPDebounced(valor: string) {
    const cp = soloDigitos(valor, 5);
    setCodigoPostal(cp);
    if (cpDebounceRef.current) clearTimeout(cpDebounceRef.current);
    if (cp.length !== 5) {
      setCpAviso(null);
      setCiudadesCp([]);
      setColoniasCp([]);
      return;
    }
    cpDebounceRef.current = setTimeout(() => {
      void consultarCP(cp);
    }, 500);
  }

  async function consultarCP(valor: string) {
    const cp = soloDigitos(valor, 5);
    setCodigoPostal(cp);
    if (cp.length !== 5) {
      setCpAviso(null);
      setCiudadesCp([]);
      setColoniasCp([]);
      return;
    }
    setCpConsultando(true);
    setCpAviso(null);
    try {
      const datos = await consultarCodigoPostalMx(cp);
      if (!datos) throw new Error("CP no encontrado");
      setEstadoMx(datos.estado);
      setCiudadesCp(datos.ciudades ?? []);
      setCiudad(datos.ciudades?.[0] ?? "");
      setColoniasCp(datos.colonias ?? []);
      setColonia(datos.colonias?.[0] ?? "");
      setCpAviso(null);
    } catch (err) {
      logStructuredWarn("verificacion/VerificacionForm", "lookup_cp_fallido", err, { cp });
      setCpAviso("No encontramos ese código postal. Verifica o escríbelo manualmente.");
    } finally {
      setCpConsultando(false);
    }
  }

  function manejarDocumento(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const extension = extensionArchivo(archivo.name);
    const esHeic =
      ["image/heic", "image/heif"].includes(archivo.type.toLowerCase()) ||
      [".heic", ".heif"].includes(extension);
    const formatoSoportado =
      TIPOS_ACEPTADOS.includes(archivo.type) || EXTENSIONES_ACEPTADAS.includes(extension);

    // C-04: HEIC — no borrar selección; conservar archivo y ofrecer guía de conversión. iOS 17+ default HEIC.
    if (esHeic) {
      setDocumento(archivo);
      setDocAviso(
        "Detectamos formato HEIC (iPhone). Lo conservamos para que no pierdas la selección, pero para máxima compatibilidad conviértelo a JPG: en iPhone ve a Ajustes › Cámara › Formatos › Más compatible y vuelve a tomar la foto, o usa un conversor a JPG/PDF. Puedes intentar enviarlo; si el servidor lo rechaza, conviértelo e intenta de nuevo."
      );
      // No limpiar e.target.value para no perder archivo si el usuario decide reintentar tras convertir
      return;
    }
    if (!formatoSoportado) {
      setDocumento(null);
      setDocAviso("Formato no soportado. Selecciona un archivo JPG, PNG, PDF o HEIC (recomendado JPG).");
      e.target.value = "";
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
      setDocumento(null);
      setDocAviso(`Archivo muy grande (${(archivo.size / 1024 / 1024).toFixed(1)} MB). Comprime o reduce la resolución hasta máximo ${TAMANO_MAXIMO_MB} MB. En iPhone, envía la foto por WhatsApp a ti mismo y descárgala — se comprime a JPG.`);
      e.target.value = "";
      return;
    }
    // Advertencia para HEIC que llegó por tipo genérico pero con extensión permitida extendida
    if (esHeic) {
      setDocAviso(
        "Archivo HEIC conservado. Si el envío falla, conviértelo a JPG antes de reintentar."
      );
    } else {
      setDocAviso(null);
    }
    setDocumento(archivo);
  }

  async function enviarManual(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    if (!documento) {
      setError("Adjunta tu identificación oficial para continuar.");
      return;
    }
    /* CORRECCIÓN domicilio incompleto: antes solo se exigía calle+CP+colonia y
       estado/ciudad podían guardarse vacíos. Se exigen los 5 para no persistir
       direcciones parciales. */
    if (
      !calle.trim() ||
      soloDigitos(codigoPostal, 5).length !== 5 ||
      !colonia.trim() ||
      !estadoMx.trim() ||
      !ciudad.trim()
    ) {
      setError("Completa tu domicilio (calle, código postal, colonia, ciudad y estado) antes de continuar.");
      return;
    }

    setEnviando(true);
    setError(null);
    setDocAviso("Validando el contenido y enviando de forma segura…");

    try {
      const cliente = crearClienteNavegador();

      const direccionPrincipal = [
        [calle.trim(), numero.trim()].filter(Boolean).join(" "),
        colonia ? `Col. ${colonia}` : "",
        codigoPostal ? `CP ${codigoPostal}` : "",
        ciudad,
        estadoMx,
      ]
        .filter(Boolean)
        .join(", ");

      await actualizarPerfilUsuario(cliente, {
        pais: "México",
        estado: estadoMx.trim(),
        codigo_postal: soloDigitos(codigoPostal, 5),
        ciudad: ciudad.trim(),
        colonia: colonia.trim(),
        calle: calle.trim(),
        numero: numero.trim() || null,
        referencias: referencias.trim() || null,
        direccion_principal: direccionPrincipal,
      } as PerfilUsuarioActualizable);

      await subirDocumentoIdentidad(cliente, documento);
      setDocAviso("Identificación recibida correctamente y enviada a revisión.");
      setEnviado(true);
      router.refresh();
    } catch (err) {
      setDocAviso("La carga no se completó. Tu archivo sigue seleccionado para que puedas reintentar.");
      setError(
        esErrorRed(err)
          ? "Error de red. Acción: revisa tu conexión y reintenta la carga."
          : err instanceof Error
          ? err.message
          : "Error al guardar. Intenta de nuevo."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (verificacionCompletada) {
    return (
      <MobileCard padding="lg" elevated className="text-center space-y-4 border-[#c8e6d8] bg-[#e9f3ee]/40 dark:border-[#135939] dark:bg-[#0a2e1f]/40">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]">
          <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <div>
          <h2 className="text-[20px] font-bold text-[#0a2342] dark:text-[#f6f8fb]">¡Identidad Verificada con Éxito!</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#4e5f80] dark:text-[#a8b5cc]">
            Tu cuenta ha sido aprobada de manera inmediata mediante Didit. Ya tienes acceso total para solicitar traslados y rastrearlos con el Pasaporte Digital.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href={destinoExito}
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#0a2342] px-5 py-3.5 text-[15.5px] font-bold text-white shadow-[0_12px_24px_-8px_rgba(10,35,66,0.35)] transition hover:bg-[#162c47] active:scale-[0.98] dark:bg-[#4d94ff] dark:text-[#061529]"
          >
            Solicitar mi primer traslado
          </Link>
        </div>
      </MobileCard>
    );
  }

  if (enviado) {
    return <ConfirmacionEnRevision />;
  }

  const campoBase =
    "w-full rounded-2xl border border-[#e6edf6] bg-white px-3.5 py-3 text-[14.5px] font-medium text-[#0a2342] outline-none transition focus:border-[#0a2342] focus:bg-white focus:ring-4 focus:ring-[#0a2342]/5 dark:border-[#1a3a5c] dark:bg-[#071322] dark:text-white dark:focus:border-sky-400";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section className="flex min-h-0 flex-1 flex-col justify-center gap-4 text-center">
        <div className="mx-auto flex size-16 shrink-0 items-center justify-center rounded-full bg-[#edf4fe] text-[#104ca0] dark:bg-[#0f2d52] dark:text-[#6ba8ff]" aria-hidden="true">
          <svg className="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M6 16c0-4 6-4 6 0m3-7h3m-3 4h3"/></svg>
        </div>
        <div><h2 className="text-2xl font-bold">Verificación instantánea</h2>
        <p className="mt-2 text-sm text-[#4e5f80] dark:text-[#a8b5cc]">Valida tu INE en menos de 2 minutos.</p></div>
        {pollingDiditActivo && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-3 text-xs font-semibold text-sky-800 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
            <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
            <span>Confirmando verificación con Didit en segundo plano…</span>
          </div>
        )}
        <MobileButton type="button" onClick={() => fotoPerfilUrl ? void iniciarDidit() : setMostrarFoto(true)} disabled={cargandoDidit || subiendoFotoPerfil || pollingDiditActivo} loading={cargandoDidit || subiendoFotoPerfil || pollingDiditActivo} className="w-full">Iniciar verificación con Didit</MobileButton>
        <p className="flex items-center justify-center gap-1 text-[11px] leading-4 text-[#4e5f80] dark:text-[#a8b5cc]">
          <svg className="size-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg>
          Tus datos se encriptan bajo estándares bancarios.
        </p>
      </section>
      <VerificationSheet open={mostrarFoto} onClose={() => setMostrarFoto(false)} title="Fotografía de referencia">
                {!fotoPerfilUrl && (
          <div className="rounded-2xl border border-[#f3d8a2] bg-[#fef4e6] p-4 dark:border-[#664d00] dark:bg-[#3d2e00]/40 space-y-3">
            <div className="flex items-start gap-2.5">
              <svg className="mt-0.5 size-4 shrink-0 text-[#765100] dark:text-[#ffc933]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4m0 4h.01" />
              </svg>
              <p className="text-[12px] leading-5 text-[#765100] dark:text-[#ffc933]">
                Este flujo usa coincidencia facial. Sube primero una fotografía clara de tu rostro para que Didit pueda compararla con la prueba de vida.
              </p>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#765100] dark:text-[#ffc933]">
                Fotografía de referencia
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                onChange={(e) => void cargarFotoPerfilDidit(e.target.files?.[0])}
                disabled={subiendoFotoPerfil || cargandoDidit}
                className="w-full rounded-xl border border-[#e6edf6] bg-white px-3 py-2 text-xs text-[#0a2342] file:mr-3 file:rounded-lg file:border-0 file:bg-[#0a2342] file:px-3 file:py-1.5 file:font-semibold file:text-white dark:border-[#1a3a5c] dark:bg-[#071322] dark:text-white dark:file:bg-sky-500 dark:file:text-[#0a2342]"
              />
              <span className="text-[11px] text-[#765100]/80 dark:text-[#ffc933]/80">
                {subiendoFotoPerfil ? "Guardando fotografía…" : "Máximo 2 MB. Si tu foto pesa más, la comprimimos automáticamente o puedes usar tinypng.com."}
              </span>
            </label>
          </div>
        )}

        {errorDidit && <Aviso tono="danger">{errorDidit}</Aviso>}
        <MobileButton type="button" className="mt-4 w-full" disabled={!fotoPerfilUrl || subiendoFotoPerfil} onClick={() => { setMostrarFoto(false); void iniciarDidit(); }}>Continuar con Didit</MobileButton>
      </VerificationSheet>

      {/* Modal Didit */}
      <DiditVerificationModal
        isOpen={mostrarDiditModal}
        url={urlDidit}
        cargando={cargandoDidit}
        error={errorDidit}
        onCerrar={cerrarDidit}
        onReintentar={iniciarDidit}
        onFinalizar={finalizarDidit}
      />

      {!soloDidit && (
        <>
          <button type="button" onClick={() => setMostrarFormularioManual(true)} aria-haspopup="dialog" className="min-h-12 shrink-0 py-3 text-sm font-semibold text-[#4e5f80] dark:text-[#a8b5cc]">Prefiero subir mis documentos manualmente</button>
          <VerificationSheet open={mostrarFormularioManual} onClose={() => setMostrarFormularioManual(false)} title="Carga manual de documentos">
            <p className="mb-4 text-sm text-[#4e5f80] dark:text-[#a8b5cc]">Completa tu domicilio y adjunta tu identificación. La revisión toma 24–48 horas hábiles.</p>
            <form id="formulario-verificacion-manual" onSubmit={enviarManual}>
              <MobileCard padding="lg" elevated className="flex flex-col gap-6">
              {/* ── Domicilio ── */}
              <fieldset className="flex flex-col gap-4 border-none p-0 m-0">
                <legend className="text-[12px] font-bold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]">
                  Domicilio
                </legend>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[#4e5f80] dark:text-[#a8b5cc]">Código postal</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={codigoPostal}
                    onChange={(e) => consultarCPDebounced(e.target.value)}
                    placeholder="06600"
                    maxLength={5}
                    required
                    className={campoBase}
                  />
                  {cpConsultando && (
                    <span className="text-xs text-[#4e5f80]" role="status" aria-live="polite">
                      Buscando…
                    </span>
                  )}
                  {cpAviso && (
                    <span className="text-xs font-medium text-[#765100] dark:text-[#ffc933]" role="status" aria-live="polite">
                      {cpAviso}
                    </span>
                  )}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[#4e5f80] dark:text-[#a8b5cc]">Estado</span>
                    <input
                      type="text"
                      value={estadoMx}
                      onChange={(e) => setEstadoMx(e.target.value)}
                      placeholder="CDMX"
                      required
                      className={campoBase}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[#4e5f80] dark:text-[#a8b5cc]">Ciudad</span>
                    {ciudadesCp.length > 1 ? (
                      <select
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        className={campoBase}
                      >
                        {ciudadesCp.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        placeholder="Ciudad de México"
                        required
                        className={campoBase}
                      />
                    )}
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[#4e5f80] dark:text-[#a8b5cc]">Colonia</span>
                  {coloniasCp.length > 1 ? (
                    <select
                      value={colonia}
                      onChange={(e) => setColonia(e.target.value)}
                      className={campoBase}
                    >
                      {coloniasCp.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={colonia}
                      onChange={(e) => setColonia(e.target.value)}
                      placeholder="Juárez"
                      required
                      className={campoBase}
                    />
                  )}
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <label className="col-span-2 flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[#4e5f80] dark:text-[#a8b5cc]">Calle</span>
                    <input
                      type="text"
                      value={calle}
                      onChange={(e) => setCalle(e.target.value)}
                      placeholder="Av. Insurgentes"
                      required
                      className={campoBase}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-semibold text-[#4e5f80] dark:text-[#a8b5cc]">Núm.</span>
                    <input
                      type="text"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="123"
                      className={campoBase}
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-[#4e5f80] dark:text-[#a8b5cc]">
                    Referencias <span className="text-xs font-normal opacity-70">(opcional)</span>
                  </span>
                  <textarea
                    value={referencias}
                    onChange={(e) => setReferencias(e.target.value)}
                    placeholder="Entre calles, color de fachada, etc."
                    className={`${campoBase} min-h-[76px] resize-none`}
                    maxLength={300}
                    aria-label="Referencias del domicilio"
                  />
                  <span className="text-right text-[11px] font-medium text-[#4e5f80] dark:text-[#a8b5cc]">{referencias.length}/300</span>
                </label>
              </fieldset>

              {/* ── Identificación oficial ── */}
              <fieldset className="flex flex-col gap-3 border-none p-0 m-0">
                <legend className="text-[12px] font-bold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]">
                  Identificación oficial
                </legend>
                <p className="text-[12.5px] text-[#4e5f80] dark:text-[#a8b5cc]">
                  INE, pasaporte vigente o licencia de conducir.
                </p>
                <p className="text-[12.5px] font-medium text-[#0a2342] dark:text-[#f6f8fb]">
                  Formatos aceptados: JPG, PNG, PDF y HEIC (iPhone — se recomienda convertir a JPG). Tamaño máximo: {TAMANO_MAXIMO_MB} MB.
                </p>

                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#d7e1ee] p-6 text-center transition hover:border-[#0a2342] hover:bg-[#f8fafd] dark:border-[#1a3a5c] dark:hover:border-sky-400 dark:hover:bg-[#071930]">
                  {documento ? (
                    <>
                      <span className="flex size-10 items-center justify-center rounded-full bg-[#e9f3ee] text-[#08705f] dark:bg-[#0a2e1f] dark:text-[#4dd9a3]">
                        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </span>
                      <span className="text-sm font-bold text-[#0a2342] dark:text-[#f6f8fb] w-full min-w-0 break-all">{documento.name}</span>
                      <span className="text-xs text-[#4e5f80] dark:text-[#a8b5cc]">Toca para cambiar el archivo</span>
                    </>
                  ) : (
                    <>
                      <span className="flex size-10 items-center justify-center rounded-full bg-[#edf4fe] text-[#104ca0] dark:bg-[#0f2d52] dark:text-[#6ba8ff]">
                        <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </span>
                      <span className="text-sm font-semibold text-[#0a2342] dark:text-[#f6f8fb]">
                        Toca para seleccionar tu identificación
                      </span>
                    </>
                  )}
                  <input
                    id="input-documento-identidad"
                    type="file"
                    accept={[...TIPOS_ACEPTADOS, ...EXTENSIONES_ACEPTADAS].join(",")}
                    onChange={manejarDocumento}
                    disabled={enviando}
                    className="sr-only"
                    aria-label="Subir identificación oficial"
                    aria-describedby={docAviso ? "doc-aviso" : undefined}
                    aria-invalid={Boolean(docAviso && !documento)}
                  />
                </label>
                {docAviso && (
                  <p id="doc-aviso" className="text-xs font-medium text-red-600 dark:text-red-400" role="alert" aria-live="assertive">
                    {docAviso}
                  </p>
                )}
              </fieldset>

              {error && (
                <div role="alert" aria-live="assertive">
                  <Aviso tono="danger">{error}</Aviso>
                </div>
              )}

              <MobileButton
                type="submit"
                disabled={enviando}
                loading={enviando}
                className="w-full"
              >
                Enviar para revisión manual
              </MobileButton>
            </MobileCard>
          </form>
          </VerificationSheet>
        </>
      )}
    </div>
  );
}
