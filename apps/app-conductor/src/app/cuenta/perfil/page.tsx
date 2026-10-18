"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";

import { ChangeEvent, useEffect, useState } from "react";
import { actualizarPerfilConductor, esErrorSolicitudPendiente, subirFotoPerfilConductor, validarFotoPerfilConductor } from "@ruum/api/services";
import { consultarCodigoPostalMx, traducirErrorOperativo, validarDimensionesMinimasImagen, type DatosCodigoPostal } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { cargarConductorCuenta, telefonoE164, type ConductorCuenta } from "../cuenta-utils";
import { enmascararUltimos } from "../datos-sensibles";
import { DriverProfileView } from "./DriverProfileView";
import { DetailIcon, type DetailIconName } from "../DriverDetailsShell";
import { DetailsNotice } from "../DetailsNotice";
import styles from "../details.module.css";

const PERFIL_DEFAULT = {
  nombre: "",
  email: "",
  telefono: "",
  curp: "",
  licencia_numero: "",
  licencia_tipo: "",
  licencia_vigencia: "",
  codigo_postal: "",
  estado_residencia: "",
  ciudad_municipio: "",
  colonia: "",
  calle: "",
  numero: "",
  referencias: "",
  contacto_emergencia_nombre: "",
  contacto_emergencia_telefono: ""
};

type CampoPerfil = keyof typeof PERFIL_DEFAULT;
type CampoSensiblePerfil = "nombre" | "curp" | "licencia_numero";
type IdPestana = "identidad" | "documentacion" | "ubicacion";

type NotificacionPerfil = { tipo: "success" | "error" | "info"; mensaje: string } | null;

const PESTANAS: { id: IdPestana; titulo: string; icono: string; descripcion: string; campos: CampoPerfil[] }[] = [
  {
    id: "identidad",
    titulo: "Identidad",
    icono: "👤",
    descripcion: "Fotografía, datos personales, correo y teléfono de contacto",
    campos: ["nombre", "email", "telefono", "curp"]
  },
  {
    id: "documentacion",
    titulo: "Documentación",
    icono: "📄",
    descripcion: "Licencia de conducir y vigencia operativa",
    campos: ["licencia_numero", "licencia_tipo", "licencia_vigencia"]
  },
  {
    id: "ubicacion",
    titulo: "Ubicación y emergencia",
    icono: "📍",
    descripcion: "Domicilio particular y contacto de emergencia",
    campos: [
      "codigo_postal",
      "estado_residencia",
      "ciudad_municipio",
      "colonia",
      "calle",
      "numero",
      "referencias",
      "contacto_emergencia_nombre",
      "contacto_emergencia_telefono"
    ]
  }
];

const CAMPO_CONFIG: Record<CampoPerfil, { etiqueta: string; tipo?: string; colSpan?: string; placeholder?: string }> = {
  nombre: { etiqueta: "Nombre completo", placeholder: "Ej. Juan Pérez López" },
  email: { etiqueta: "Correo electrónico", tipo: "email", placeholder: "correo@ejemplo.com" },
  telefono: { etiqueta: "Teléfono", placeholder: "10 dígitos" },
  curp: { etiqueta: "CURP", placeholder: "18 caracteres" },
  licencia_numero: { etiqueta: "Número de licencia", placeholder: "Ej. B12345678" },
  licencia_tipo: { etiqueta: "Tipo de licencia" },
  licencia_vigencia: { etiqueta: "Vigencia de licencia", tipo: "date" },
  codigo_postal: { etiqueta: "Código postal", placeholder: "5 dígitos" },
  estado_residencia: { etiqueta: "Estado", placeholder: "Estado de residencia" },
  ciudad_municipio: { etiqueta: "Ciudad o municipio", placeholder: "Municipio" },
  colonia: { etiqueta: "Colonia", placeholder: "Nombre de colonia" },
  calle: { etiqueta: "Calle", placeholder: "Calle principal" },
  numero: { etiqueta: "Número", placeholder: "Ext. / Int." },
  referencias: { etiqueta: "Referencias", colSpan: "sm:col-span-2", placeholder: "Entre qué calles o referencias visuales" },
  contacto_emergencia_nombre: { etiqueta: "Contacto de emergencia", placeholder: "Nombre del familiar o contacto" },
  contacto_emergencia_telefono: { etiqueta: "Teléfono de emergencia", placeholder: "10 dígitos" }
};

const CAMPOS_SOLO_LECTURA = new Set<CampoPerfil>(["licencia_tipo"]);
// PR-04: licencia_tipo y licencia_vigencia son sensibles (vigencia explícita por spec). Se mantienen solo lectura en UI
// pero si cambia via admin/solicitud, requiere revisión. foto_perfil también es sensible (identidad).

function perfilDesdeConductor(conductor: ConductorCuenta | null) {
  return {
    nombre: conductor?.nombre ?? "",
    email: conductor?.email ?? "",
    telefono: (conductor?.telefono ?? "").replace(/^\+?52(\d{10})$/, "$1"),
    curp: conductor?.curp ?? "",
    licencia_numero: conductor?.licencia_numero ?? "",
    licencia_tipo: conductor?.licencia_tipo ?? "",
    licencia_vigencia: conductor?.licencia_vigencia ?? "",
    codigo_postal: conductor?.codigo_postal ?? "",
    estado_residencia: conductor?.estado_residencia ?? "",
    ciudad_municipio: conductor?.ciudad_municipio ?? "",
    colonia: conductor?.colonia ?? "",
    calle: conductor?.calle ?? "",
    numero: conductor?.numero ?? "",
    referencias: conductor?.referencias ?? "",
    contacto_emergencia_nombre: conductor?.contacto_emergencia_nombre ?? "",
    contacto_emergencia_telefono: (conductor?.contacto_emergencia_telefono ?? "").replace(/^\+?52(\d{10})$/, "$1")
  };
}

function evaluarValidacionInline(clave: CampoPerfil, valor: string): { esValido: boolean | null; mensaje?: string } {
  const limpio = valor.trim();
  if (!limpio) return { esValido: null };

  switch (clave) {
    case "email": {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio);
      return { esValido: ok, mensaje: ok ? "Formato válido" : "Formato de correo inválido" };
    }
    case "telefono":
    case "contacto_emergencia_telefono": {
      const digitos = limpio.replace(/\D/g, "");
      const ok = digitos.length === 10 || (digitos.length === 12 && digitos.startsWith("52"));
      return { esValido: ok, mensaje: ok ? "Formato válido" : "Ingresa 10 dígitos" };
    }
    case "curp": {
      const ok = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/i.test(limpio);
      return { esValido: ok, mensaje: ok ? "CURP válida" : "Deben ser 18 caracteres" };
    }
    case "licencia_numero": {
      const ok = limpio.length >= 5;
      return { esValido: ok, mensaje: ok ? "Válido" : "Mínimo 5 caracteres" };
    }
    case "licencia_vigencia": {
      const fecha = new Date(limpio);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const ok = !isNaN(fecha.getTime()) && fecha >= hoy;
      return { esValido: ok, mensaje: ok ? "Vigente" : "La fecha no debe estar vencida" };
    }
    case "codigo_postal": {
      const ok = /^\d{5}$/.test(limpio);
      return { esValido: ok, mensaje: ok ? "Código de 5 dígitos" : "Debe tener 5 dígitos" };
    }
    case "nombre":
    case "contacto_emergencia_nombre": {
      const ok = limpio.length >= 3;
      return { esValido: ok };
    }
    default:
      return { esValido: null };
  }
}

export default function PaginaPerfilCuenta() {
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false);
  const [conductor, setConductor] = useState<ConductorCuenta | null>(null);
  const [perfil, setPerfil] = useState(PERFIL_DEFAULT);
  const [sensiblesEditados, setSensiblesEditados] = useState<Set<CampoSensiblePerfil>>(new Set());
  const [notificacion, setNotificacion] = useState<NotificacionPerfil>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [vistaPreviaFoto, setVistaPreviaFoto] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [grupoUbicacion, setGrupoUbicacion] = useState(0);
  const [pestanaActiva, setPestanaActiva] = useState<IdPestana>("identidad");

  // Autocompletado inteligente de CP (SEPOMEX)
  const [buscandoCp, setBuscandoCp] = useState(false);
  const [coloniasDisponibles, setColoniasDisponibles] = useState<string[]>([]);
  const [cpDetectado, setCpDetectado] = useState(false);

  async function cargar() {
    try {
      const actual = await cargarConductorCuenta();
      setConductor(actual);
      const siguiente = perfilDesdeConductor(actual);
      siguiente.curp = "";
      siguiente.licencia_numero = "";
      setPerfil(siguiente);
      setSensiblesEditados(new Set());
      setVistaPreviaFoto(null);
      setErrorCarga(null);
    } catch {
      setErrorCarga("No se pudieron cargar tus datos. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void cargar();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notificacion) return;
    const timer = window.setTimeout(() => setNotificacion(null), 4200);
    return () => window.clearTimeout(timer);
  }, [notificacion]);

  // Consulta automática de CP cuando el usuario escribe 5 dígitos
  async function manejarCambioCp(valorCp: string) {
    const limpio = valorCp.replace(/\D/g, "").slice(0, 5);
    setPerfil((actual) => ({ ...actual, codigo_postal: limpio }));

    if (limpio.length === 5) {
      setBuscandoCp(true);
      try {
        const resultado: DatosCodigoPostal | null = await consultarCodigoPostalMx(limpio);
        if (resultado) {
          setPerfil((actual) => ({
            ...actual,
            estado_residencia: resultado.estado,
            ciudad_municipio: resultado.ciudades[0] ?? actual.ciudad_municipio,
            colonia: resultado.colonias.includes(actual.colonia)
              ? actual.colonia
              : resultado.colonias[0] ?? actual.colonia
          }));
          setColoniasDisponibles(resultado.colonias);
          setCpDetectado(true);
        } else {
          setColoniasDisponibles([]);
          setCpDetectado(false);
        }
      } catch {
        setColoniasDisponibles([]);
        setCpDetectado(false);
      } finally {
        setBuscandoCp(false);
      }
    } else {
      setColoniasDisponibles([]);
      setCpDetectado(false);
    }
  }

  async function guardarPerfil() {
    if (!conductor || guardando) return;
    // PR-04: Determinar si hay cambios sensibles que requieren confirmación
    // Incluye licencia_vigencia explícitamente como sensible
    const tieneSensibleReal =
      sensiblesEditados.size > 0 ||
      (perfil.licencia_vigencia.trim() !== (conductor.licencia_vigencia ?? "") && perfil.licencia_vigencia.trim() !== "");
    if (tieneSensibleReal && !confirmacionAbierta) {
      setConfirmacionAbierta(true);
      return;
    }
    setConfirmacionAbierta(false);
    setNotificacion(null);
    setGuardando(true);
    try {
      const cliente = crearClienteNavegador();
      const perfilParaGuardar = {
        ...perfil,
        curp: sensiblesEditados.has("curp") ? perfil.curp : conductor.curp ?? "",
        licencia_numero: sensiblesEditados.has("licencia_numero") ? perfil.licencia_numero : conductor.licencia_numero ?? "",
        contacto_emergencia_nombre: perfil.contacto_emergencia_nombre,
        contacto_emergencia_telefono: perfil.contacto_emergencia_telefono
      };
      const cambioEmail = Boolean(perfil.email.trim() && perfil.email.trim().toLowerCase() !== (conductor.email ?? "").toLowerCase());
      let confirmacionEmailEnviada = false;
      const nuevoEmailSolicitado = perfil.email.trim();

      if (cambioEmail) {
        const { error: errorAuthEmail } = await cliente.auth.updateUser({ email: nuevoEmailSolicitado });
        if (errorAuthEmail) throw errorAuthEmail;
        confirmacionEmailEnviada = true;
      }
      const resultado = await actualizarPerfilConductor(cliente, conductor.id, {
        ...perfilParaGuardar,
        telefono: telefonoE164(perfilParaGuardar.telefono),
        contacto_emergencia_telefono: telefonoE164(perfilParaGuardar.contacto_emergencia_telefono)
      });
      await cargar();

      // PR-10: Distinguir mensajes según estado real del correo y revisión operativa
      if (resultado.estado === "pendiente") {
        if (confirmacionEmailEnviada) {
          setNotificacion({
            tipo: "info",
            mensaje: `Confirmación enviada a ${nuevoEmailSolicitado}. Además, los cambios sensibles fueron enviados a revisión operativa.`
          });
        } else {
          setNotificacion({
            tipo: "info",
            mensaje: "Cambios enviados a revisión. Un operador validará tu información antes de aplicarla. Recibirás notificación al aprobarse."
          });
        }
      } else {
        if (confirmacionEmailEnviada) {
          setNotificacion({
            tipo: "info",
            mensaje: `Confirmación enviada: Hemos enviado un enlace a ${nuevoEmailSolicitado}. Revisa tu bandeja de entrada para confirmar el cambio. Tu correo actual (${conductor.email}) sigue activo.`
          });
        } else {
          setNotificacion({
            tipo: "success",
            mensaje: "Cambios guardados. Tu perfil se actualizó correctamente."
          });
        }
      }
    } catch (error) {
      // Si es error de solicitud pendiente (foto), mostrar como info
      if (esErrorSolicitudPendiente(error)) {
        setNotificacion({ tipo: "info", mensaje: (error as Error).message });
      } else {
        setNotificacion({ tipo: "error", mensaje: traducirErrorOperativo(error, "No se pudo actualizar el perfil.") });
      }
    } finally {
      setGuardando(false);
    }
  }

  async function subirFotoPerfil(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo || !conductor) return;

    try { validarFotoPerfilConductor(archivo); } catch (cause) {
      setNotificacion({ tipo: "error", mensaje: (cause as Error).message });
      evento.target.value = ""; return;
    }
    // Validación de resolución mínima (300x300px)
    if (archivo.type.startsWith("image/")) {
      const resDimensiones = await validarDimensionesMinimasImagen(archivo, 300, 300);
      if (!resDimensiones.valido) {
        setNotificacion({
          tipo: "error",
          mensaje: resDimensiones.error ?? "La fotografía de perfil debe tener una resolución mínima de 300x300 píxeles."
        });
        evento.target.value = "";
        return;
      }
    }

    // Vista previa instantánea
    const urlTemp = URL.createObjectURL(archivo);
    setVistaPreviaFoto(urlTemp);

    setNotificacion(null);
    setSubiendoFoto(true);
    try {
      const cliente = crearClienteNavegador();
      const fotoUrl = await subirFotoPerfilConductor(cliente, conductor.id, archivo);
      setConductor({ ...conductor, foto_perfil_url: fotoUrl });
      setNotificacion({ tipo: "success", mensaje: "Fotografía de perfil actualizada." });
      setVistaPreviaFoto(null);
      URL.revokeObjectURL(urlTemp);
    } catch (error) {
      if (esErrorSolicitudPendiente(error)) {
        setNotificacion({ tipo: "info", mensaje: (error as Error).message });
        // Mantener foto aprobada intacta, solo preview temporal
        setVistaPreviaFoto(null);
        URL.revokeObjectURL(urlTemp);
      } else {
        setNotificacion({ tipo: "error", mensaje: traducirErrorOperativo(error, "No pudimos actualizar la fotografía de perfil.") });
        setVistaPreviaFoto(null);
        URL.revokeObjectURL(urlTemp);
      }
    } finally {
      setSubiendoFoto(false);
      evento.target.value = "";
    }
  }

  useEffect(() => {
    return () => {
      if (vistaPreviaFoto) URL.revokeObjectURL(vistaPreviaFoto);
    };
  }, [vistaPreviaFoto]);

  function placeholderSensible(campo: CampoPerfil) {
    if (!conductor) return "";
    if (campo === "curp") return conductor.curp ? enmascararUltimos(conductor.curp) : "";
    if (campo === "licencia_numero") return conductor.licencia_numero ? enmascararUltimos(conductor.licencia_numero) : "";
    if (campo === "contacto_emergencia_nombre") return conductor.contacto_emergencia_nombre ? enmascararUltimos(conductor.contacto_emergencia_nombre, 2) : "";
    if (campo === "contacto_emergencia_telefono") return conductor.contacto_emergencia_telefono ? enmascararUltimos(conductor.contacto_emergencia_telefono) : "";
    return "";
  }

  function valorSensibleExiste(campo: CampoPerfil) {
    if (!conductor) return false;
    if (campo === "curp") return Boolean(conductor.curp);
    if (campo === "licencia_numero") return Boolean(conductor.licencia_numero);
    if (campo === "contacto_emergencia_nombre") return Boolean(conductor.contacto_emergencia_nombre);
    if (campo === "contacto_emergencia_telefono") return Boolean(conductor.contacto_emergencia_telefono);
    return false;
  }

  // Comprueba si hay cambios reales en el formulario respecto al objeto conductor
  const hayCambiosReales = Boolean(
    conductor && (
      perfil.nombre.trim() !== (conductor.nombre ?? "") ||
      perfil.email.trim().toLowerCase() !== (conductor.email ?? "").toLowerCase() ||
      telefonoE164(perfil.telefono) !== telefonoE164(conductor.telefono ?? "") ||
      perfil.codigo_postal.trim() !== (conductor.codigo_postal ?? "") ||
      perfil.estado_residencia.trim() !== (conductor.estado_residencia ?? "") ||
      perfil.ciudad_municipio.trim() !== (conductor.ciudad_municipio ?? "") ||
      perfil.colonia.trim() !== (conductor.colonia ?? "") ||
      perfil.calle.trim() !== (conductor.calle ?? "") ||
      perfil.numero.trim() !== (conductor.numero ?? "") ||
      perfil.referencias.trim() !== (conductor.referencias ?? "") ||
      perfil.contacto_emergencia_nombre.trim() !== (conductor.contacto_emergencia_nombre ?? "") ||
      telefonoE164(perfil.contacto_emergencia_telefono) !== telefonoE164(conductor.contacto_emergencia_telefono ?? "") ||
      perfil.licencia_vigencia.trim() !== (conductor.licencia_vigencia ?? "") ||
      sensiblesEditados.size > 0
    )
  );

  const gruposUbicacion: CampoPerfil[][] = [
    ["codigo_postal", "estado_residencia", "ciudad_municipio", "colonia"],
    ["calle", "numero", "referencias"],
    ["contacto_emergencia_nombre", "contacto_emergencia_telefono"]
  ];
  const campos = pestanaActiva === "ubicacion" ? gruposUbicacion[grupoUbicacion] : PESTANAS.find(tab => tab.id === pestanaActiva)!.campos;
  const invalidos = (Object.keys(perfil) as CampoPerfil[]).some(key => {
    const modified = perfil[key].trim() !== (conductor?.[key] ?? "").toString().trim();
    if (!modified || (key === "curp" || key === "licencia_numero") && !sensiblesEditados.has(key)) return false;
    return evaluarValidacionInline(key, perfil[key]).esValido === false || ["nombre", "email", "telefono", "curp", "licencia_numero", "licencia_vigencia"].includes(key) && !perfil[key].trim();
  });
  const nombres = (conductor?.nombre ?? "").trim().split(/\s+/).filter(Boolean);
  const initials = nombres.length ? `${nombres[0][0]}${nombres.length > 1 ? nombres[nombres.length - 1][0] : ""}`.toLocaleUpperCase("es-MX") : "CD";
  const icono = (key: CampoPerfil): DetailIconName => key === "email" ? "mail" : key.includes("telefono") ? "phone" : key === "curp" || key.startsWith("licencia") ? "id" : key.includes("nombre") ? "user" : "pin";
  const aviso = errorCarga ?? notificacion?.mensaje ?? (conductor?.new_email ? `Confirmación pendiente: revisa el enlace enviado a ${conductor.new_email}. Tu correo actual sigue activo.` : null);
  return <>
    <DriverProfileView initials={initials} photo={vistaPreviaFoto || conductor?.foto_perfil_url || null} rating={typeof conductor?.calificacion_promedio === "number" ? conductor.calificacion_promedio : null}
      photoBusy={subiendoFoto} photoEnabled={!!conductor} tab={pestanaActiva} onTab={tab => { setPestanaActiva(tab); setGrupoUbicacion(0); }} onPhoto={event => { void subirFotoPerfil(event); }}
      busy={guardando} saveDisabled={!conductor || !hayCambiosReales || guardando || invalidos || subiendoFoto} onSave={() => { void guardarPerfil(); }}
      feedback={aviso ? <DetailsNotice message={aviso} error={!!errorCarga || notificacion?.tipo === "error"} /> : undefined}>
      {cargando ? <output className={styles.loading}>Cargando perfil…</output> : errorCarga ? <button type="button" className={styles.retry} onClick={() => { setCargando(true); void cargar(); }}>Reintentar carga</button> : <>
        {pestanaActiva === "ubicacion" && <div className={styles.groupPager} role="group" aria-label="Grupos de ubicación"><button type="button" disabled={grupoUbicacion === 0} aria-label="Grupo anterior" onClick={() => setGrupoUbicacion(value => value - 1)}>‹</button><span>{["Domicilio", "Dirección", "Contacto de emergencia"][grupoUbicacion]} · {grupoUbicacion + 1} de 3</span><button type="button" disabled={grupoUbicacion === 2} aria-label="Grupo siguiente" onClick={() => setGrupoUbicacion(value => value + 1)}>›</button></div>}
        <div className={styles.fields} data-tab={pestanaActiva} aria-busy={guardando}>
          {campos.map(key => {
            const config = CAMPO_CONFIG[key];
            const protectedField = (key === "curp" || key === "licencia_numero") && valorSensibleExiste(key) && !sensiblesEditados.has(key);
            const readOnly = CAMPOS_SOLO_LECTURA.has(key) || protectedField;
            const validation = protectedField ? { esValido: null } : evaluarValidacionInline(key, perfil[key]);
            const half = pestanaActiva === "identidad" ? ["telefono", "curp"].includes(key) : pestanaActiva === "ubicacion" && grupoUbicacion < 2 && key !== "referencias";
            const inputId = `profile-${key}`;
            return <div key={key} className={styles.field} data-half={half} data-invalid={validation.esValido === false}>
              <DetailIcon name={icono(key)} />
              <div className={styles.fieldText}><label htmlFor={inputId}>{config.etiqueta}</label>
                {key === "colonia" && coloniasDisponibles.length > 0 ? <select id={inputId} value={perfil.colonia} onChange={event => setPerfil(current => ({ ...current, colonia: event.target.value }))}>{coloniasDisponibles.map(col => <option key={col} value={col}>{col}</option>)}</select> : <input
                  id={inputId} type={key.includes("telefono") ? "tel" : config.tipo ?? "text"} inputMode={key === "codigo_postal" ? "numeric" : undefined}
                  value={protectedField ? "" : perfil[key]} placeholder={protectedField ? placeholderSensible(key) : config.placeholder}
                  readOnly={readOnly} aria-readonly={readOnly || undefined} disabled={guardando}
                  maxLength={key === "curp" ? 18 : key.includes("telefono") ? 13 : key === "codigo_postal" ? 5 : undefined}
                  aria-invalid={validation.esValido === false || undefined} aria-describedby={validation.esValido === false ? `${inputId}-error` : undefined}
                  data-ruum-label={config.etiqueta} onChange={event => {
                    if (readOnly) return;
                    if (key === "codigo_postal") { void manejarCambioCp(event.target.value); return; }
                    if (["nombre", "curp", "licencia_numero"].includes(key)) setSensiblesEditados(current => new Set(current).add(key as CampoSensiblePerfil));
                    const value = key === "curp" || key === "licencia_numero" ? event.target.value.toLocaleUpperCase("es-MX") : event.target.value;
                    setPerfil(current => ({ ...current, [key]: value }));
                  }} />}
                {validation.esValido === false && <span className={styles.fieldError} id={`${inputId}-error`}>{validation.mensaje ?? "Revisa este dato"}</span>}
              </div>
              {protectedField && <button type="button" className={styles.unlock} aria-label={`Editar ${config.etiqueta}`} title="Dato protegido. Los cambios se envían a revisión." onClick={() => { setSensiblesEditados(current => new Set(current).add(key as CampoSensiblePerfil)); setPerfil(current => ({ ...current, [key]: "" })); }}>✎</button>}
            </div>;
          })}
        </div>
        {pestanaActiva === "ubicacion" && (buscandoCp || cpDetectado) && <span className={styles.postalStatus}>{buscandoCp ? "Buscando código postal…" : "Ubicación y colonias autocompletadas"}</span>}
      </>}
    </DriverProfileView>
    <ConfirmDialog open={confirmacionAbierta} title="Guardar cambios sensibles" consequence="Los cambios de identidad y licencia se envían a revisión operativa antes de aplicarse." maskedData={[`Campos modificados: ${sensiblesEditados.size}`]} confirmLabel="Guardar y enviar a revisión" busy={guardando} onCancel={() => setConfirmacionAbierta(false)} onConfirm={() => { void guardarPerfil(); }} />
  </>;
}
