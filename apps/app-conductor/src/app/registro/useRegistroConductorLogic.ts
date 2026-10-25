"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { fortalezaPassword, traducirErrorAuth, traducirErrorOperativo } from "@ruum/shared/utils";
import {
  validarCampoRegistroConductor,
  type CampoRegistroConductor,
} from "@ruum/shared/validacion";
import {
  enviarSolicitudConductor,
  guardarBorradorConductor,
  iniciarSolicitudConductor,
  iniciarVerificacionDidit,
  obtenerConductorActual,
  obtenerEstadoVerificacionDiditConductor,
  obtenerSolicitudConductorActual,
  registrarConsentimientosConductor,
  type ExpedienteSolicitudConductorV2,
} from "@ruum/api/services";
import {
  listarConsentimientosSolicitud,
  listarDocumentosSolicitud,
  obtenerBorradorSolicitud,
} from "@ruum/api/drivers";
import { crearClienteNavegador, tieneSupabaseConfigurado, obtenerOriginApp } from "../../lib/supabase-browser";
import type { Json } from "@ruum/shared/types";
import { consultarCodigoPostalMx } from "../../lib/codigos-postales";
import { limpiarBorradorRegistroLocal } from "../../lib/borrador-registro";
import {
  PASOS_REGISTRO,
  type EstadoGuardadoRemoto,
} from "./registration-types";
import {
  fusionarJsonExpediente,
  limpiarTexto,
  objetoJson,
  soloDigitos,
  telefonoE164Mx,
} from "./registration-validation";
import { useRegistrationDocuments } from "./useRegistrationDocuments";
import { useRegistrationDraft } from "./useRegistrationDraft";
import { useRegistrationTelemetry } from "./useRegistrationTelemetry";

const VERSION_APP_REGISTRO = "1.0.0";
const RETRASO_GUARDADO_REMOTO_MS = 900;
export const CODIGO_OTP_LONGITUD = 6;
const ESPERA_REENVIO_OTP_SEGUNDOS = 60;
export const MAX_INTENTOS_OTP = 5;

function mensajeDeError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const mensaje = (error as { message?: unknown }).message;
    if (typeof mensaje === "string") return mensaje;
  }
  return "";
}

function canalRegistro(): "web" | "android" | "ios" {
  if (typeof navigator === "undefined") return "web";
  if (/android/i.test(navigator.userAgent)) return "android";
  if (/iPad|iPhone|iPod/i.test(navigator.userAgent)) return "ios";
  return "web";
}

type SolicitudConductorResumen = {
  datos_personales?: Json | null;
  domicilio?: Json | null;
  licencia?: Json | null;
  contacto_emergencia?: Json | null;
};

function combinarExpedienteConRemoto(
  expediente: ExpedienteSolicitudConductorV2,
  remoto: SolicitudConductorResumen | null
) {
  if (!remoto) return expediente;
  return {
    datosPersonales: fusionarJsonExpediente(expediente.datosPersonales, remoto.datos_personales),
    domicilio: fusionarJsonExpediente(expediente.domicilio, remoto.domicilio),
    licencia: fusionarJsonExpediente(expediente.licencia, remoto.licencia),
    contactoEmergencia: fusionarJsonExpediente(expediente.contactoEmergencia, remoto.contacto_emergencia),
  };
}

export function useRegistroConductorLogic() {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [curp, setCurp] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacionPassword, setConfirmacionPassword] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [estado, setEstado] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [ciudades, setCiudades] = useState<string[]>([]);
  const [colonias, setColonias] = useState<string[]>([]);
  const [consultandoCp, setConsultandoCp] = useState(false);
  const [colonia, setColonia] = useState("");
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [referencias, setReferencias] = useState("");
  const [numeroLicencia, setNumeroLicencia] = useState("");
  const [tipoLicencia, setTipoLicencia] = useState("");
  const [vigenciaLicencia, setVigenciaLicencia] = useState("");
  const [autorizaVerificacion, setAutorizaVerificacion] = useState(false);
  const [declaraSinSuspensiones, setDeclaraSinSuspensiones] = useState(false);
  const [contactoEmergenciaNombre, setContactoEmergenciaNombre] = useState("");
  const [contactoEmergenciaTelefono, setContactoEmergenciaTelefono] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [confirmaPrivacidad, setConfirmaPrivacidad] = useState(false);
  const [erroresCampos, setErroresCampos] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [registroListo, setRegistroListo] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [sesionActivaTrasRegistro, setSesionActivaTrasRegistro] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorRecuperable, setErrorRecuperable] = useState(false);
  const [mostrarDetalleConsentimiento, setMostrarDetalleConsentimiento] = useState(false);
  const [sesionAutenticada, setSesionAutenticada] = useState(false);
  const [solicitudRemotaId, setSolicitudRemotaId] = useState<string | null>(null);
  const [estadoGuardadoRemoto, setEstadoGuardadoRemoto] = useState<EstadoGuardadoRemoto>("inactivo");
  const [detalleGuardadoRemoto, setDetalleGuardadoRemoto] = useState<string | null>(null);
  const [reintentoConexion, setReintentoConexion] = useState(0);

  const hidratacionRemotaCompletaRef = useRef(false);
  const omitirPrimerGuardadoRemotoRef = useRef(false);
  const ultimoGuardadoRemotoRef = useRef("");
  const solicitudRemotaIdRef = useRef<string | null>(null);
  const aceptadosEnRef = useRef(new Date().toISOString());
  const aceptacionLegalAlEnviarRef = useRef(false);

  const [pendienteOtp, setPendienteOtp] = useState(false);
  const [codigoOtp, setCodigoOtp] = useState("");
  const [verificandoOtp, setVerificandoOtp] = useState(false);
  const [errorOtp, setErrorOtp] = useState<string | null>(null);
  const [reenviandoOtp, setReenviandoOtp] = useState(false);
  const [esperaReenvioOtp, setEsperaReenvioOtp] = useState(0);
  const reenvioOtpDisponibleEnRef = useRef(0);
  const [intentosFallidosOtp, setIntentosFallidosOtp] = useState(0);

  const [mostrarVerificacionDidit, setMostrarVerificacionDidit] = useState(false);
  const [urlVerificacionDidit, setUrlVerificacionDidit] = useState<string | null>(null);
  const [iniciandoVerificacionDidit, setIniciandoVerificacionDidit] = useState(false);
  const [errorVerificacionDidit, setErrorVerificacionDidit] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "enlace_invalido") {
        setError("El enlace de verificación ha expirado o ya fue utilizado. Si ya confirmaste tu cuenta, puedes iniciar sesión directamente.");
      }
    }
  }, []);

  const nombreCompleto = useMemo(() => limpiarTexto(`${nombre} ${apellidos}`), [nombre, apellidos]);
  const fuerzaPassword = useMemo(() => fortalezaPassword(password), [password]);
  const borradorLocal = useMemo(() => ({
    paso,
    nombre,
    apellidos,
    telefono,
    email,
    codigoPostal,
    estado,
    ciudad,
    colonia,
    tipoLicencia,
    vigenciaLicencia,
  }), [paso, nombre, apellidos, telefono, email, codigoPostal, estado, ciudad, colonia, tipoLicencia, vigenciaLicencia]);
  const tieneErroresActivos = Object.values(erroresCampos).some(Boolean);

  const registrarTelemetria = useRegistrationTelemetry(paso);

  function setCampoError(campo: string, mensaje: string) {
    setErroresCampos((prev) => ({ ...prev, [campo]: mensaje }));
    return !mensaje;
  }

  function limpiarErrorCampo(campo: string) {
    if (erroresCampos[campo]) setErroresCampos((prev) => ({ ...prev, [campo]: "" }));
  }

  const {
    documentos,
    estadoDocumentos,
    documentosRemotos,
    setDocumentosRemotos,
    setEstadoDocumentos,
    documentoDisponible,
    validarDocumento,
    cambiarDocumento,
    cargarDocumentos,
  } = useRegistrationDocuments({
    setCampoError,
    limpiarErrorCampo,
    registrarTelemetria,
    paso,
  });

  const {
    borradorDisponible,
    borradorLocalGuardado,
    restaurarBorrador,
    descartarBorrador,
  } = useRegistrationDraft({
    enabled: !enviado && !pendienteOtp && !sesionAutenticada,
    snapshot: borradorLocal,
    onRestore: (borrador) => {
      setNombre(borrador.nombre ?? "");
      setApellidos(borrador.apellidos ?? "");
      setTelefono(borrador.telefono ?? "");
      setEmail(borrador.email ?? "");
      setCodigoPostal(borrador.codigoPostal ?? "");
      setEstado(borrador.estado ?? "");
      setCiudad(borrador.ciudad ?? "");
      setColonia(borrador.colonia ?? "");
      setTipoLicencia(borrador.tipoLicencia ?? "");
      setVigenciaLicencia(borrador.vigenciaLicencia ?? "");
      setPaso(0);

      const cp = soloDigitos(borrador.codigoPostal ?? "", 5);
      if (cp.length === 5) void buscarCodigoPostal(cp);
    },
  });

  function validarCampo(campo: CampoRegistroConductor, valor: string) {
    return setCampoError(campo, validarCampoRegistroConductor(campo, valor));
  }

  function validarCurp(valor = curp) {
    return validarCampo("curp", valor);
  }

  function validarTelefono(campo: "telefono" | "contactoEmergenciaTelefono", valor: string, setter: (valor: string) => void) {
    const normalizado = soloDigitos(valor);
    if (normalizado !== valor) setter(normalizado);
    return validarCampo(campo, normalizado);
  }

  function validarPassword(valor = password) {
    return validarCampo("password", valor);
  }

  function validarConfirmacion(valor = confirmacionPassword, base = password) {
    if (sesionAutenticada) return setCampoError("confirmacionPassword", "");
    if (!valor) return setCampoError("confirmacionPassword", "Confirma tu contraseña");
    return setCampoError("confirmacionPassword", valor !== base ? "Las contraseñas no coinciden" : "");
  }

  function validarVigenciaLicencia(valor = vigenciaLicencia) {
    return validarCampo("vigenciaLicencia", valor);
  }

  async function buscarCodigoPostal(cp: string) {
    setConsultandoCp(true);
    setCampoError("codigoPostal", "");
    try {
      const datos = await consultarCodigoPostalMx(cp);
      if (!datos) throw new Error("CP no encontrado");
      setEstado(datos.estado);
      setCiudades(datos.ciudades);
      setCiudad(datos.ciudades[0] ?? "");
      setColonias(datos.colonias);
      setColonia(datos.colonias[0] ?? "");
      setErroresCampos((prev) => ({ ...prev, estado: "", ciudad: "", colonia: "" }));
    } catch {
      setEstado("");
      setCiudad("");
      setCiudades([]);
      setColonias([]);
      setColonia("");
      setCampoError("codigoPostal", "No encontramos ese código postal. Verifica que tenga 5 dígitos o captura el domicilio manualmente.");
    } finally {
      setConsultandoCp(false);
    }
  }

  function validarPaso(indice = paso, aceptaLicenciaAlContinuar = false, aceptarLegalAlEnviar = false) {
    if (indice === 0) {
      return [
        validarTelefono("telefono", telefono, setTelefono),
        validarCampo("email", email),
        sesionAutenticada ? setCampoError("password", "") : validarPassword(),
        validarConfirmacion(),
        setCampoError("aceptaTerminos", (aceptaTerminos || aceptarLegalAlEnviar) && (confirmaPrivacidad || aceptarLegalAlEnviar) ? "" : "Acepta los Términos y Condiciones y el Aviso de Privacidad para continuar."),
      ].every(Boolean);
    }
    if (indice === 1) {
      return [
        validarCampo("nombre", nombre),
        validarCampo("apellidos", apellidos),
        validarCurp(),
        validarCampo("codigoPostal", codigoPostal),
        validarCampo("estado", estado),
        validarCampo("ciudad", ciudad),
        validarCampo("colonia", colonia),
        validarCampo("calle", calle),
        validarCampo("numero", numero),
        validarCampo("referencias", referencias),
        validarCampo("contactoEmergenciaNombre", contactoEmergenciaNombre),
        validarTelefono("contactoEmergenciaTelefono", contactoEmergenciaTelefono, setContactoEmergenciaTelefono),
      ].every(Boolean);
    }
    if (indice === 2) {
      return [
        validarCampo("numeroLicencia", numeroLicencia),
        validarCampo("tipoLicencia", tipoLicencia),
        validarVigenciaLicencia(),
        setCampoError("autorizaVerificacion", (aceptaLicenciaAlContinuar || autorizaVerificacion) ? "" : "Debes autorizar la verificación de antecedentes"),
        setCampoError("declaraSinSuspensiones", (aceptaLicenciaAlContinuar || declaraSinSuspensiones) ? "" : "Debes confirmar esta declaración"),
      ].every(Boolean);
    }
    if (indice === 3) {
      return [
        setCampoError("cuentaVerificada", sesionAutenticada ? "" : "Confirma tu cuenta antes de cargar documentos"),
        validarDocumento("licenciaFrente"),
        validarDocumento("licenciaReverso"),
        validarDocumento("identificacionOficial"),
      ].every(Boolean);
    }
    return [
      setCampoError("aceptaTerminos", aceptaTerminos || aceptarLegalAlEnviar ? "" : "Debes aceptar los términos de servicio"),
      setCampoError("confirmaPrivacidad", confirmaPrivacidad || aceptarLegalAlEnviar ? "" : "Debes confirmar que leíste el aviso de privacidad"),
    ].every(Boolean);
  }

  function formularioCompleto() {
    return Boolean(
      nombre.trim() &&
        apellidos.trim() &&
        curp.trim() &&
        telefono.trim() &&
        email.trim() &&
        (sesionAutenticada || (password && confirmacionPassword)) &&
        codigoPostal.trim() &&
        estado.trim() &&
        ciudad.trim() &&
        colonia.trim() &&
        calle.trim() &&
        numero.trim() &&
        referencias.trim() &&
        numeroLicencia.trim() &&
        tipoLicencia.trim() &&
        vigenciaLicencia &&
        documentoDisponible("licenciaFrente") &&
        documentoDisponible("licenciaReverso") &&
        documentoDisponible("identificacionOficial") &&
        autorizaVerificacion &&
        declaraSinSuspensiones &&
        contactoEmergenciaNombre.trim() &&
        contactoEmergenciaTelefono.trim()
    );
  }

  function camposFaltantes() {
    const faltantes: string[] = [];
    if (!nombre.trim() || !apellidos.trim()) faltantes.push("nombre y apellidos");
    if (!curp.trim()) faltantes.push("tu CURP");
    if (!telefono.trim()) faltantes.push("tu teléfono");
    if (!email.trim()) faltantes.push("tu correo");
    if (!sesionAutenticada && (!password || !confirmacionPassword)) faltantes.push("tu contraseña");
    if (!codigoPostal.trim() || !estado.trim() || !ciudad.trim() || !colonia.trim() || !calle.trim() || !numero.trim() || !referencias.trim()) faltantes.push("tu domicilio");
    if (!numeroLicencia.trim() || !tipoLicencia.trim() || !vigenciaLicencia) faltantes.push("los datos de tu licencia");
    if (!documentoDisponible("licenciaFrente")) faltantes.push("la foto de la licencia (frente)");
    if (!documentoDisponible("licenciaReverso")) faltantes.push("la foto de la licencia (reverso)");
    if (!documentoDisponible("identificacionOficial")) faltantes.push("tu identificación oficial");
    if (!autorizaVerificacion) faltantes.push("autorizar la verificación de antecedentes");
    if (!declaraSinSuspensiones) faltantes.push("confirmar la declaración de suspensiones");
    if (!contactoEmergenciaNombre.trim() || !contactoEmergenciaTelefono.trim()) faltantes.push("tu contacto de emergencia");
    return faltantes;
  }

  const puedeEnviar = !enviando && !tieneErroresActivos && formularioCompleto();

  const contratoExpediente = useCallback(() => {
    const aceptadosEn = aceptadosEnRef.current;
    return {
      datosPersonales: {
        nombre: nombreCompleto,
        nombres: limpiarTexto(nombre),
        apellidos: limpiarTexto(apellidos),
        email: email.trim().toLowerCase(),
        telefono: telefonoE164Mx(telefono),
        curp: curp.trim().toUpperCase(),
        autoriza_verificacion_antecedentes: autorizaVerificacion,
        declara_sin_suspensiones: declaraSinSuspensiones,
        acepta_terminos_servicio: aceptaTerminos || aceptacionLegalAlEnviarRef.current,
        confirma_aviso_privacidad: confirmaPrivacidad || aceptacionLegalAlEnviarRef.current,
        version_terminos_aceptada: 1,
        version_aviso_privacidad: 1,
        terminos_aceptados_en: aceptadosEn,
        marca_terminos: "ruum ruum by Movilia",
      },
      domicilio: {
        codigo_postal: codigoPostal.trim(),
        estado: limpiarTexto(estado),
        ciudad_municipio: limpiarTexto(ciudad),
        colonia: limpiarTexto(colonia),
        calle: limpiarTexto(calle),
        numero: limpiarTexto(numero),
        referencias: limpiarTexto(referencias),
      },
      licencia: {
        numero: limpiarTexto(numeroLicencia),
        tipo: limpiarTexto(tipoLicencia),
        vigencia: vigenciaLicencia,
      },
      contactoEmergencia: {
        nombre: limpiarTexto(contactoEmergenciaNombre),
        telefono: soloDigitos(contactoEmergenciaTelefono),
      },
    };
  }, [nombreCompleto, nombre, apellidos, email, telefono, curp, autorizaVerificacion, declaraSinSuspensiones, aceptaTerminos, confirmaPrivacidad, codigoPostal, estado, ciudad, colonia, calle, numero, referencias, numeroLicencia, tipoLicencia, vigenciaLicencia, contactoEmergenciaNombre, contactoEmergenciaTelefono]);

  async function prepararSolicitudBorrador(cliente: ReturnType<typeof crearClienteNavegador>) {
    const inicio = await iniciarSolicitudConductor(cliente);
    if (!inicio.solicitudId) {
      throw new Error(
        inicio.conductorId
          ? "Esta cuenta ya tiene un perfil de conductor operativo."
          : "No pudimos iniciar la solicitud."
      );
    }
    const solicitudRemota = await obtenerBorradorSolicitud(cliente, inicio.solicitudId).catch(() => null);
    const expediente = combinarExpedienteConRemoto(contratoExpediente(), solicitudRemota);

    setSesionAutenticada(true);
    setSolicitudRemotaId(inicio.solicitudId);
    solicitudRemotaIdRef.current = inicio.solicitudId;
    hidratacionRemotaCompletaRef.current = true;
    omitirPrimerGuardadoRemotoRef.current = true;
    limpiarBorradorRegistroLocal();
    await guardarBorradorConductor(cliente, expediente, Math.max(paso + 1, inicio.pasoActual, 1));
    setEstadoGuardadoRemoto("guardado");
    return inicio.solicitudId;
  }

  function iniciarEsperaReenvioOtp() {
    reenvioOtpDisponibleEnRef.current = Date.now() + ESPERA_REENVIO_OTP_SEGUNDOS * 1000;
    setEsperaReenvioOtp(ESPERA_REENVIO_OTP_SEGUNDOS);
  }

  async function crearCuentaParaContinuar() {
    if (!validarPaso(0)) return false;
    if (!tieneSupabaseConfigurado()) {
      setError("Supabase no está configurado. El registro no está disponible en este entorno.");
      return false;
    }
    setEnviando(true);
    setError(null);
    try {
      const cliente = crearClienteNavegador();
      if (sesionAutenticada) {
        if (!solicitudRemotaIdRef.current && !solicitudRemotaId) await prepararSolicitudBorrador(cliente);
        return true;
      }
      const { data: datosAuth, error: errorAuth } = await cliente.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            tipo_registro: "conductor",
            version_registro: 2,
          },
          emailRedirectTo: `${obtenerOriginApp()}/auth/callback`,
        },
      });
      if (errorAuth) throw errorAuth;
      if (!datosAuth.user) throw new Error("No se pudo crear la cuenta. Intenta de nuevo.");
      limpiarBorradorRegistroLocal();
      if (datosAuth.session) {
        await prepararSolicitudBorrador(cliente);
        setSesionActivaTrasRegistro(true);
        return true;
      }
      iniciarEsperaReenvioOtp();
      setPendienteOtp(true);
      return false;
    } catch (err) {
      setError(traducirErrorAuth(err));
      return false;
    } finally {
      setEnviando(false);
    }
  }

  async function avanzar() {
    setError(null);
    if (paso === 0 && !sesionAutenticada) {
      const cuentaLista = await crearCuentaParaContinuar();
      if (!cuentaLista) return;
    }
    if (validarPaso(paso, paso === 2)) {
      if (paso === 2) {
        aceptadosEnRef.current = new Date().toISOString();
        setAutorizaVerificacion(true);
        setDeclaraSinSuspensiones(true);
      }
      registrarTelemetria("paso_completado", paso + 1);
      setPaso((actual) => Math.min(actual + 1, PASOS_REGISTRO.length - 1));
    }
  }

  function volver() {
    setError(null);
    setPaso((actual) => Math.max(actual - 1, 0));
  }

  async function procesarSolicitudAutenticada(cliente: ReturnType<typeof crearClienteNavegador>) {
    const solicitudId = solicitudRemotaIdRef.current ?? solicitudRemotaId ?? await prepararSolicitudBorrador(cliente);

    try {
      await registrarConsentimientosConductor(
        cliente,
        solicitudId,
        [
          { tipoDocumento: "terminos_servicio", version: 1 },
          { tipoDocumento: "aviso_privacidad", version: 1 },
          { tipoDocumento: "autorizacion_antecedentes", version: 1 },
          { tipoDocumento: "declaracion_suspensiones", version: 1 },
        ],
        canalRegistro(),
        VERSION_APP_REGISTRO
      );
    } catch (err) {
      if (!/ya no admite consentimientos/i.test(mensajeDeError(err))) {
        console.error("[registro] fallo registrando consentimientos", err);
        throw err;
      }
    }

    try {
      await guardarBorradorConductor(cliente, contratoExpediente(), PASOS_REGISTRO.length);
    } catch (err) {
      if (!/ya no admite cambios/i.test(mensajeDeError(err))) {
        console.error("[registro] fallo guardando borrador", err);
        throw err;
      }
    }

    try {
      await cargarDocumentos(cliente, solicitudId);
    } catch (err) {
      console.error("[registro] fallo cargando documentos", err);
      throw err;
    }

    let resultado;
    try {
      resultado = await enviarSolicitudConductor(cliente);
    } catch (err) {
      console.error("[registro] fallo enviando solicitud", err);
      throw err;
    }
    registrarTelemetria("solicitud_enviada", PASOS_REGISTRO.length, "enviado");

    const solicitudIdDidit = resultado.solicitudId ?? solicitudRemotaIdRef.current ?? solicitudRemotaId;
    if (solicitudIdDidit) {
      solicitudRemotaIdRef.current = solicitudIdDidit;
      setSolicitudRemotaId(solicitudIdDidit);
      registrarTelemetria("didit_iniciado", PASOS_REGISTRO.length, "auto");
      setMostrarVerificacionDidit(true);
      setIniciandoVerificacionDidit(true);
      setErrorVerificacionDidit(null);
      try {
        const { url } = await iniciarVerificacionDidit(cliente, solicitudIdDidit);
        setUrlVerificacionDidit(url);
      } catch (err) {
        const mensaje = traducirErrorOperativo(err, "No pudimos iniciar la verificación de identidad automáticamente. Podrás reintentar o completarla desde tu panel.");
        setErrorVerificacionDidit(mensaje);
        registrarTelemetria("didit_error", PASOS_REGISTRO.length, "auto_inicio_fallido");
      } finally {
        setIniciandoVerificacionDidit(false);
      }
    }

    return resultado;
  }

  async function crearCuenta(e: FormEvent) {
    e.preventDefault();
    const todoValido = PASOS_REGISTRO.every((_, indice) => validarPaso(indice, false, true));
    if (!todoValido) {
      const primerPasoConError = PASOS_REGISTRO.findIndex((_, indice) => !validarPaso(indice));
      setPaso(primerPasoConError >= 0 ? primerPasoConError : paso);
      return;
    }
    if (!tieneSupabaseConfigurado()) {
      setError(" El registro no está disponible en este entorno.");
      return;
    }
    aceptacionLegalAlEnviarRef.current = true;
    aceptadosEnRef.current = new Date().toISOString();
    setAceptaTerminos(true);
    setConfirmaPrivacidad(true);

    setEnviando(true);
    setError(null);
    setErrorRecuperable(false);
    let cuentaCreada = sesionAutenticada;

    try {
      const cliente = crearClienteNavegador();
      if (!sesionAutenticada) {
        const cuentaLista = await crearCuentaParaContinuar();
        if (!cuentaLista) return;
        cuentaCreada = true;
      }
      setSesionActivaTrasRegistro(true);
      await procesarSolicitudAutenticada(cliente);
      limpiarBorradorRegistroLocal();
      setEnviado(true);
    } catch (err) {
      if (cuentaCreada) registrarTelemetria("rpc_error", paso + 1, "enviar_solicitud");
      setErrorRecuperable(true);
      const generico = "No pudimos enviar tu solicitud. Tu cuenta quedó creada y puedes reintentar.";
      const traducido = cuentaCreada ? traducirErrorOperativo(err, generico) : traducirErrorAuth(err);
      const detalle = mensajeDeError(err).trim();
      setError(traducido === generico && detalle ? `${generico} Detalle: ${detalle}` : traducido);
    } finally {
      setEnviando(false);
    }
  }

  async function reintentarEnvio() {
    setEnviando(true);
    setError(null);
    setErrorRecuperable(false);
    try {
      const cliente = crearClienteNavegador();
      setSesionActivaTrasRegistro(true);
      await procesarSolicitudAutenticada(cliente);
      limpiarBorradorRegistroLocal();
      setEnviado(true);
    } catch (err) {
      setErrorRecuperable(true);
      const generico = "No pudimos reintentar el envío. Inténtalo de nuevo.";
      const traducido = traducirErrorOperativo(err, generico);
      const detalle = mensajeDeError(err).trim();
      setError(traducido === generico && detalle ? `${generico} Detalle: ${detalle}` : traducido);
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarCodigoOtp(e: FormEvent) {
    e.preventDefault();
    if (intentosFallidosOtp >= MAX_INTENTOS_OTP) {
      setErrorOtp(`Has superado el máximo de ${MAX_INTENTOS_OTP} intentos. Solicita un nuevo código.`);
      return;
    }
    const codigo = codigoOtp.trim();
    if (!new RegExp(`^\\d{${CODIGO_OTP_LONGITUD}}$`).test(codigo)) {
      setErrorOtp(`Escribe el código de ${CODIGO_OTP_LONGITUD} dígitos que enviamos a tu correo.`);
      return;
    }

    setVerificandoOtp(true);
    setErrorOtp(null);
    let cuentaVerificada = false;
    try {
      const cliente = crearClienteNavegador();
      const { data, error: errorVerificacion } = await cliente.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: codigo,
        type: "signup",
      });
      if (errorVerificacion) throw errorVerificacion;
      if (!data.session) throw new Error("El código se validó pero no pudimos iniciar tu sesión. Entra desde el acceso.");
      cuentaVerificada = true;

      setIntentosFallidosOtp(0);
      setSesionActivaTrasRegistro(true);
      setSesionAutenticada(true);
      setPendienteOtp(false);

      if (paso < PASOS_REGISTRO.length - 1) {
        try {
          await prepararSolicitudBorrador(cliente);
        } catch (borradorErr) {
          console.error("[confirmarCodigoOtp] Aviso: error no fatal al preparar borrador inicial:", borradorErr);
        }
        setPaso((actual) => Math.min(actual + 1, PASOS_REGISTRO.length - 1));
        return;
      }
      await procesarSolicitudAutenticada(cliente);
      limpiarBorradorRegistroLocal();
      setEnviado(true);
    } catch (err) {
      console.error("[confirmarCodigoOtp] Error al verificar OTP:", err);
      if (cuentaVerificada) {
        registrarTelemetria("rpc_error", paso + 1, "enviar_solicitud");
        setError(traducirErrorOperativo(err, "Tu cuenta quedó verificada, pero hubo un problema al procesar la solicitud. Puedes reintentar."));
      } else {
        registrarTelemetria("otp_error", paso + 1, "verificar_otp");
        setIntentosFallidosOtp((prev) => prev + 1);
        const restantes = MAX_INTENTOS_OTP - (intentosFallidosOtp + 1);
        const base = traducirErrorAuth(err);
        setErrorOtp(restantes > 0 ? `${base} Te quedan ${restantes} intentos.` : `${base} Has agotado los intentos. Solicita un nuevo código.`);
      }
    } finally {
      setVerificandoOtp(false);
    }
  }

  async function reenviarCodigoOtp() {
    if (esperaReenvioOtp > 0 || reenviandoOtp) return;
    setReenviandoOtp(true);
    setErrorOtp(null);
    try {
      const cliente = crearClienteNavegador();
      const { error: errorReenvio } = await cliente.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${obtenerOriginApp()}/auth/callback`,
        },
      });
      if (errorReenvio) throw errorReenvio;
      iniciarEsperaReenvioOtp();
      setIntentosFallidosOtp(0);
      setCodigoOtp("");
    } catch (err) {
      registrarTelemetria("otp_error", paso + 1, "reenviar_otp");
      setErrorOtp(traducirErrorAuth(err));
    } finally {
      setReenviandoOtp(false);
    }
  }

  const esperandoReenvioOtp = esperaReenvioOtp > 0;
  useEffect(() => {
    if (!pendienteOtp || !esperandoReenvioOtp) return;
    const actualizar = () => setEsperaReenvioOtp(Math.max(0, Math.ceil((reenvioOtpDisponibleEnRef.current - Date.now()) / 1000)));
    const intervalo = setInterval(actualizar, 1000);
    window.addEventListener("focus", actualizar);
    return () => { clearInterval(intervalo); window.removeEventListener("focus", actualizar); };
  }, [pendienteOtp, esperandoReenvioOtp]);

  useEffect(() => {
    if (!tieneSupabaseConfigurado()) {
      hidratacionRemotaCompletaRef.current = true;
      setRegistroListo(true);
      return;
    }
    let activo = true;
    const cliente = crearClienteNavegador();
    async function hidratar() {
      try {
        const { data: sesion } = await cliente.auth.getUser();
        if (!activo || !sesion.user) {
          hidratacionRemotaCompletaRef.current = true;
          return;
        }
        setSesionAutenticada(true);
        descartarBorrador();
        setEmail(sesion.user.email ?? "");
        const solicitud = await obtenerSolicitudConductorActual(cliente);
        if (!solicitud) {
          const conductorExistente = await obtenerConductorActual(cliente);
          if (conductorExistente) { router.replace("/panel"); return; }
          const inicio = await iniciarSolicitudConductor(cliente);
          if (!inicio.solicitudId) { router.replace("/panel"); return; }
          setSolicitudRemotaId(inicio.solicitudId);
          solicitudRemotaIdRef.current = inicio.solicitudId;
          hidratacionRemotaCompletaRef.current = true;
          omitirPrimerGuardadoRemotoRef.current = true;
          setEstadoGuardadoRemoto("guardado");
          return;
        }
        if (["listo_para_enviar", "en_revision", "requiere_correccion", "aprobado", "rechazado", "suspendido"].includes(solicitud.estado)) {
          router.replace("/panel");
          return;
        }
        const [docsRemotos, consentimientosRemotos] = await Promise.all([
          listarDocumentosSolicitud(cliente, solicitud.id),
          listarConsentimientosSolicitud(cliente, solicitud.id),
        ]);
        const personales = objetoJson(solicitud.datos_personales);
        const domicilio = objetoJson(solicitud.domicilio);
        const licencia = objetoJson(solicitud.licencia);
        const contacto = objetoJson(solicitud.contacto_emergencia);
        const nombreCompletoRemoto = String(personales.nombre ?? "").trim();
        const partesNombre = nombreCompletoRemoto.split(/\s+/).filter(Boolean);
        setNombre(String(personales.nombres ?? partesNombre[0] ?? ""));
        setApellidos(String(personales.apellidos ?? partesNombre.slice(1).join(" ")));
        setCurp(String(personales.curp ?? ""));
        setTelefono(soloDigitos(String(personales.telefono ?? "").replace(/^\+?52/, "")));
        setCodigoPostal(String(domicilio.codigo_postal ?? ""));
        setEstado(String(domicilio.estado ?? ""));
        setCiudad(String(domicilio.ciudad_municipio ?? ""));
        setColonia(String(domicilio.colonia ?? ""));
        if (domicilio.ciudad_municipio) setCiudades([String(domicilio.ciudad_municipio)]);
        if (domicilio.colonia) setColonias([String(domicilio.colonia)]);
        setCalle(String(domicilio.calle ?? ""));
        setNumero(String(domicilio.numero ?? ""));
        setReferencias(String(domicilio.referencias ?? ""));
        setNumeroLicencia(String(licencia.numero ?? ""));
        setTipoLicencia(String(licencia.tipo ?? ""));
        setVigenciaLicencia(String(licencia.vigencia ?? ""));
        setContactoEmergenciaNombre(String(contacto.nombre ?? ""));
        setContactoEmergenciaTelefono(soloDigitos(String(contacto.telefono ?? "")));
        const consentimientos = new Set(consentimientosRemotos.map((fila) => fila.tipo_documento));
        setAceptaTerminos(consentimientos.has("terminos_servicio"));
        setConfirmaPrivacidad(consentimientos.has("aviso_privacidad"));
        setAutorizaVerificacion(consentimientos.has("autorizacion_antecedentes"));
        setDeclaraSinSuspensiones(consentimientos.has("declaracion_suspensiones"));
        const aceptacion = consentimientosRemotos[0]?.aceptado_en;
        if (aceptacion) aceptadosEnRef.current = aceptacion;
        const tiposRemotos = new Set(docsRemotos.map((doc) => doc.tipo));
        setDocumentosRemotos(tiposRemotos);
        setEstadoDocumentos({
          licenciaFrente: tiposRemotos.has("licencia_frente") ? "subido" : "pendiente",
          licenciaReverso: tiposRemotos.has("licencia_reverso") ? "subido" : "pendiente",
          identificacionOficial: tiposRemotos.has("identificacion_oficial") ? "subido" : "pendiente",
        });
        setSolicitudRemotaId(solicitud.id);
        solicitudRemotaIdRef.current = solicitud.id;
        setPaso(Math.min(Math.max((solicitud.paso_actual ?? 1) - 1, 0), PASOS_REGISTRO.length - 1));
        omitirPrimerGuardadoRemotoRef.current = true;
        hidratacionRemotaCompletaRef.current = true;
        setEstadoGuardadoRemoto("guardado");
      } catch (err) {
        hidratacionRemotaCompletaRef.current = true;
        registrarTelemetria("rpc_error", undefined, "recuperar_expediente");
        setError(traducirErrorOperativo(err, "No pudimos recuperar tu expediente. Vuelve a intentarlo."));
      } finally {
        if (activo) setRegistroListo(true);
      }
    }
    void hidratar();
    const { data: suscripcion } = cliente.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") limpiarBorradorRegistroLocal();
    });
    return () => { activo = false; suscripcion.subscription.unsubscribe(); };
  }, [router, registrarTelemetria, descartarBorrador, setDocumentosRemotos, setEstadoDocumentos]);

  useEffect(() => {
    const sinConexion = () => setEstadoGuardadoRemoto("sin_conexion");
    const conConexion = () => { setEstadoGuardadoRemoto("guardado"); setReintentoConexion((valor) => valor + 1); };
    window.addEventListener("offline", sinConexion);
    window.addEventListener("online", conConexion);
    return () => { window.removeEventListener("offline", sinConexion); window.removeEventListener("online", conConexion); };
  }, []);

  useEffect(() => {
    if (!sesionAutenticada || !solicitudRemotaId || !hidratacionRemotaCompletaRef.current || enviado || pendienteOtp) return;
    if (omitirPrimerGuardadoRemotoRef.current) { omitirPrimerGuardadoRemotoRef.current = false; return; }
    if (!navigator.onLine) {
      const offlineTimer = setTimeout(() => setEstadoGuardadoRemoto("sin_conexion"), 0);
      return () => clearTimeout(offlineTimer);
    }
    const expediente = contratoExpediente();
    const consentimientos = [
      (aceptaTerminos || aceptacionLegalAlEnviarRef.current) ? { tipoDocumento: "terminos_servicio" as const, version: 1 } : null,
      (confirmaPrivacidad || aceptacionLegalAlEnviarRef.current) ? { tipoDocumento: "aviso_privacidad" as const, version: 1 } : null,
      autorizaVerificacion ? { tipoDocumento: "autorizacion_antecedentes" as const, version: 1 } : null,
      declaraSinSuspensiones ? { tipoDocumento: "declaracion_suspensiones" as const, version: 1 } : null,
    ].filter((valor): valor is NonNullable<typeof valor> => valor !== null);
    const firma = JSON.stringify({ expediente, paso, consentimientos });
    if (firma === ultimoGuardadoRemotoRef.current) return;
    setEstadoGuardadoRemoto("guardando");
    setDetalleGuardadoRemoto(null);
    const timer = setTimeout(async () => {
      try {
        const cliente = crearClienteNavegador();
        if (consentimientos.length) await registrarConsentimientosConductor(cliente, solicitudRemotaId, consentimientos, canalRegistro(), VERSION_APP_REGISTRO);
        await guardarBorradorConductor(cliente, expediente, paso + 1);
        ultimoGuardadoRemotoRef.current = firma;
        setEstadoGuardadoRemoto("guardado");
      } catch (err) {
        registrarTelemetria("rpc_error", paso + 1, "guardar_borrador");
        const mensaje = traducirErrorOperativo(err);
        setDetalleGuardadoRemoto(mensaje);
        setEstadoGuardadoRemoto(navigator.onLine ? "error" : "sin_conexion");
      }
    }, RETRASO_GUARDADO_REMOTO_MS);
    return () => clearTimeout(timer);
  }, [sesionAutenticada, solicitudRemotaId, enviado, pendienteOtp, reintentoConexion, paso, contratoExpediente, autorizaVerificacion, declaraSinSuspensiones, aceptaTerminos, confirmaPrivacidad, registrarTelemetria]);

  function cerrarVerificacionDidit() {
    setMostrarVerificacionDidit(false);
    setUrlVerificacionDidit(null);
    setErrorVerificacionDidit(null);
    router.push(sesionActivaTrasRegistro ? "/panel" : "/login");
  }

  useEffect(() => {
    if (!mostrarVerificacionDidit || !urlVerificacionDidit) return;
    const solicitudId = solicitudRemotaIdRef.current ?? solicitudRemotaId;
    if (!solicitudId) return;

    let cancelado = false;
    let timer: ReturnType<typeof setTimeout>;

    const verificar = async () => {
      try {
        const cliente = crearClienteNavegador();
        const estado = await obtenerEstadoVerificacionDiditConductor(cliente, solicitudId);
        if (cancelado) return;

        if (estado && ["aprobado", "rechazado", "error", "expirado", "cancelado"].includes(estado.estado)) {
          setMostrarVerificacionDidit(false);
          setUrlVerificacionDidit(null);
          registrarTelemetria("didit_completado", PASOS_REGISTRO.length, "polling");
          router.push(sesionActivaTrasRegistro ? "/panel" : "/login");
          return;
        }
        timer = setTimeout(verificar, 3000);
      } catch {
        timer = setTimeout(verificar, 5000);
      }
    };

    verificar();
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [mostrarVerificacionDidit, urlVerificacionDidit, solicitudRemotaId, sesionActivaTrasRegistro, router, registrarTelemetria]);

  function reintentarVerificacionDidit() {
    const id = solicitudRemotaIdRef.current ?? solicitudRemotaId;
    if (!id) {
      setErrorVerificacionDidit("No encontramos la solicitud activa para reintentar la verificación.");
      return;
    }
    setErrorVerificacionDidit(null);
    setIniciandoVerificacionDidit(true);
    setMostrarVerificacionDidit(true);
    (async () => {
      try {
        const cliente = crearClienteNavegador();
        const { url } = await iniciarVerificacionDidit(cliente, id);
        setUrlVerificacionDidit(url);
      } catch (err) {
        setErrorVerificacionDidit(traducirErrorOperativo(err, "No pudimos reintentar la verificación."));
      } finally {
        setIniciandoVerificacionDidit(false);
      }
    })();
  }

  function finalizarVerificacionDidit() {
    setMostrarVerificacionDidit(false);
    setUrlVerificacionDidit(null);
    registrarTelemetria("didit_completado", PASOS_REGISTRO.length, "auto");
    router.push(sesionActivaTrasRegistro ? "/panel" : "/login");
  }

  const registroCompacto = (paso < PASOS_REGISTRO.length || pendienteOtp) && !enviado;
  const cuentaCompleta = aceptaTerminos && confirmaPrivacidad
    && !validarCampoRegistroConductor("telefono", telefono)
    && !validarCampoRegistroConductor("email", email)
    && (sesionAutenticada || (!validarCampoRegistroConductor("password", password) && Boolean(confirmacionPassword) && password === confirmacionPassword));
  const domicilioYContactoCompletos = (["codigoPostal", "estado", "ciudad", "colonia", "calle", "numero", "referencias", "contactoEmergenciaNombre", "contactoEmergenciaTelefono"] as const).every((campo) => {
    const valores = { codigoPostal, estado, ciudad, colonia, calle, numero, referencias, contactoEmergenciaNombre, contactoEmergenciaTelefono };
    return !validarCampoRegistroConductor(campo, valores[campo]);
  });

  return {
    router,
    paso,
    setPaso,
    nombre,
    setNombre,
    apellidos,
    setApellidos,
    curp,
    setCurp,
    telefono,
    setTelefono,
    email,
    setEmail,
    password,
    setPassword,
    confirmacionPassword,
    setConfirmacionPassword,
    codigoPostal,
    setCodigoPostal,
    estado,
    setEstado,
    ciudad,
    setCiudad,
    ciudades,
    setCiudades,
    colonias,
    setColonias,
    consultandoCp,
    colonia,
    setColonia,
    calle,
    setCalle,
    numero,
    setNumero,
    referencias,
    setReferencias,
    numeroLicencia,
    setNumeroLicencia,
    tipoLicencia,
    setTipoLicencia,
    vigenciaLicencia,
    setVigenciaLicencia,
    autorizaVerificacion,
    setAutorizaVerificacion,
    declaraSinSuspensiones,
    setDeclaraSinSuspensiones,
    contactoEmergenciaNombre,
    setContactoEmergenciaNombre,
    contactoEmergenciaTelefono,
    setContactoEmergenciaTelefono,
    aceptaTerminos,
    setAceptaTerminos,
    confirmaPrivacidad,
    setConfirmaPrivacidad,
    erroresCampos,
    enviando,
    registroListo,
    enviado,
    sesionActivaTrasRegistro,
    error,
    setError,
    errorRecuperable,
    setErrorRecuperable,
    mostrarDetalleConsentimiento,
    setMostrarDetalleConsentimiento,
    sesionAutenticada,
    estadoGuardadoRemoto,
    detalleGuardadoRemoto,
    pendienteOtp,
    setPendienteOtp,
    codigoOtp,
    setCodigoOtp,
    verificandoOtp,
    errorOtp,
    setErrorOtp,
    reenviandoOtp,
    esperaReenvioOtp,
    intentosFallidosOtp,
    mostrarVerificacionDidit,
    setMostrarVerificacionDidit,
    urlVerificacionDidit,
    iniciandoVerificacionDidit,
    errorVerificacionDidit,
    nombreCompleto,
    fuerzaPassword,
    documentos,
    estadoDocumentos,
    documentosRemotos,
    cambiarDocumento,
    documentoDisponible,
    borradorDisponible,
    borradorLocalGuardado,
    restaurarBorrador,
    descartarBorrador,
    puedeEnviar,
    limpiarErrorCampo,
    validarTelefono,
    validarCampo,
    validarPassword,
    validarConfirmacion,
    validarCurp,
    validarVigenciaLicencia,
    buscarCodigoPostal,
    camposFaltantes,
    avanzar,
    volver,
    crearCuenta,
    reintentarEnvio,
    confirmarCodigoOtp,
    reenviarCodigoOtp,
    cerrarVerificacionDidit,
    reintentarVerificacionDidit,
    finalizarVerificacionDidit,
    registroCompacto,
    cuentaCompleta,
    domicilioYContactoCompletos,
    CODIGO_OTP_LONGITUD,
    MAX_INTENTOS_OTP,
    aceptadosEnRef,
  };
}
