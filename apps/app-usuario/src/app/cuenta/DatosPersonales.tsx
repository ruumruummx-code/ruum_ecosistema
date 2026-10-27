"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icono } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import { actualizarFechaNacimientoUsuario, actualizarPerfilUsuario, obtenerUrlFotoPerfilUsuario, subirFotoPerfil } from "@ruum/api/services";
import { consultarCodigoPostalMx } from "../../lib/codigos-postales";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { logStructuredWarn } from "../../lib/logger";
import { soloDigitos, telefonoLocalMx, telefonoMx } from "../../lib/registro-usuario";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

function separarNombreApellido(nombreCompleto: string | null) {
  const partes = (nombreCompleto ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return { nombre: "", apellido: "" };
  if (partes.length === 1) return { nombre: partes[0] ?? "", apellido: "" };
  if (partes.length === 2) return { nombre: partes[0] ?? "", apellido: partes[1] ?? "" };
  if (partes.length === 3) return { nombre: partes[0] ?? "", apellido: partes.slice(1).join(" ") };
  return {
    nombre: partes.slice(0, 2).join(" "),
    apellido: partes.slice(2).join(" "),
  };
}

function nombreCompleto(nombre: string, apellido: string) {
  return [nombre.trim(), apellido.trim()].filter(Boolean).join(" ");
}

function iniciales(nombre: string, apellido: string) {
  const n = nombre.trim().split(/\s+/)[0]?.[0]?.toUpperCase() ?? "";
  const a = apellido.trim().split(/\s+/)[0]?.[0]?.toUpperCase() ?? "";
  return `${n}${a}` || "RR";
}

function domicilioCompleto({
  calle,
  numero,
  colonia,
  codigoPostal,
  ciudad,
  estado,
  referencias,
}: {
  calle: string;
  numero: string;
  colonia: string;
  codigoPostal: string;
  ciudad: string;
  estado: string;
  referencias: string;
}) {
  return [
    [calle.trim(), numero.trim()].filter(Boolean).join(" "),
    colonia.trim() ? `Col. ${colonia.trim()}` : "",
    codigoPostal.trim() ? `CP ${codigoPostal.trim()}` : "",
    ciudad.trim(),
    estado.trim(),
    referencias.trim() ? `Ref. ${referencias.trim()}` : "",
  ]
    .filter(Boolean)
    .join(", ");
}

/* Iconos SVG */
function IconoCamara({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function IconoCheckCirculo({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export interface DatosPersonalesProps {
  usuario: Usuario;
  correoRegistro?: string | null;
  fotoUrlInicial?: string | null;
  escritorio?: boolean;
}

function esErrorEsquemaFechaNacimiento(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string | number; status?: number; message?: string };
  return (
    e.code === "PGRST204" ||
    e.code === "42703" ||
    (typeof e.message === "string" &&
      e.message.includes("fecha_nacimiento") && (e.message.includes("schema cache") || e.message.includes("column")))
  );
}

export function DatosPersonales({ usuario, fotoUrlInicial, correoRegistro, escritorio = false }: DatosPersonalesProps) {
  const router = useRouter();
  const guardadoRef = useRef(false);
  const subidaRef = useRef(false);
  const temporalFotoRef = useRef<string | null>(null);
  const exitoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (temporalFotoRef.current) URL.revokeObjectURL(temporalFotoRef.current); if (exitoTimerRef.current) clearTimeout(exitoTimerRef.current); cpRequestRef.current++; }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nombreInicial = separarNombreApellido(usuario.nombre);
  const [nombre, setNombre] = useState(nombreInicial.nombre);
  const [apellido, setApellido] = useState(nombreInicial.apellido);
  const [fotoPath, setFotoPath] = useState(usuario.foto_url ?? "");
  const [fotoUrl, setFotoUrl] = useState(fotoUrlInicial ?? "");
  const [telefono, setTelefono] = useState(telefonoLocalMx(usuario.telefono ?? ""));
  // C-4: sin fecha hardcodeada — se lee del perfil (si la columna existe) o queda vacía.
  const [fechaNacimiento, setFechaNacimiento] = useState(usuario.fecha_nacimiento ?? "");

  // Dirección
  const [pais, setPais] = useState(usuario.pais ?? "México");
  const [estado, setEstado] = useState(usuario.estado ?? "");
  const [codigoPostal, setCodigoPostal] = useState(usuario.codigo_postal ?? "");
  const [ciudad, setCiudad] = useState(usuario.ciudad ?? "");
  const [colonia, setColonia] = useState(usuario.colonia ?? "");
  const [calle, setCalle] = useState(usuario.calle ?? "");
  const [numero, setNumero] = useState(usuario.numero ?? "");
  const [referencias, setReferencias] = useState(usuario.referencias ?? "");

  // Estado del formulario
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [avisoDiscreto, setAvisoDiscreto] = useState<string | null>(null);
  const [pestana, setPestana] = useState<"personal" | "direccion">("personal");
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    const actualizar = () => viewportRef.current?.style.setProperty("--profile-viewport-height", (viewport?.height ?? window.innerHeight) + "px");
    actualizar();
    viewport?.addEventListener("resize", actualizar);
    viewport?.addEventListener("scroll", actualizar);
    window.addEventListener("resize", actualizar);
    return () => { viewport?.removeEventListener("resize", actualizar); viewport?.removeEventListener("scroll", actualizar); window.removeEventListener("resize", actualizar); };
  }, []);

  // CP lookup
  const [consultandoCp, setConsultandoCp] = useState(false);
  const [avisoCp, setAvisoCp] = useState<string | null>(null);
  const [coloniasCp, setColoniasCp] = useState<string[]>([]);
  const cpRequestRef = useRef(0);

  useEffect(() => {
    if (codigoPostal.length === 5) {
      void consultarCodigoPostal(codigoPostal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function consultarCodigoPostal(valor: string, completar = false) {
    const request = ++cpRequestRef.current;
    const cp = pais === "México" ? soloDigitos(valor, 5) : valor.slice(0, 12);
    setCodigoPostal(cp);

    if (pais !== "México" || cp.length !== 5) {
      setConsultandoCp(false);
      setColoniasCp([]);
      return;
    }

    setConsultandoCp(completar);
    setAvisoCp(null);
    try {
      const datosCp = await consultarCodigoPostalMx(cp);
      if (request !== cpRequestRef.current) return;
      if (!datosCp) { if (completar) setAvisoCp("No encontramos ese código postal. Verifica el dato y completa el domicilio manualmente."); return; }

      if (completar && datosCp.estado) setEstado(datosCp.estado);
      if (completar && datosCp.ciudades?.[0]) setCiudad(datosCp.ciudades[0]);
      if (datosCp.colonias && datosCp.colonias.length > 0) {
        setColoniasCp(datosCp.colonias);
        if (completar && (!colonia || !datosCp.colonias.includes(colonia))) {
          setColonia(datosCp.colonias[0] ?? "");
        }
      }
    } catch (err) {
      // Dejar captura manual si falla el lookup
      logStructuredWarn("cuenta/DatosPersonales", "lookup_cp_fallido", err, { cp });
      if (completar && request === cpRequestRef.current) setAvisoCp("No pudimos consultar el código postal. Puedes completar el domicilio manualmente.");
    } finally {
      if (request === cpRequestRef.current) setConsultandoCp(false);
    }
  }

  async function cargarFoto(archivo: File | undefined) {
    if (!archivo || subidaRef.current || guardadoRef.current) return;
    setMensajeError(null);

    if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type) || archivo.size > 5 * 1024 * 1024) {
      setMensajeError("Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.");
      return;
    }

    if (!tieneSupabaseConfigurado()) {
      setMensajeError("No hay conexión configurada para subir tu fotografía.");
      return;
    }

    subidaRef.current = true;
    setSubiendoFoto(true);
    try {
      const cliente = crearClienteNavegador();
      const nuevaFotoPath = await subirFotoPerfil(cliente, archivo);
      setFotoPath(nuevaFotoPath);
      const urlFirmada = await obtenerUrlFotoPerfilUsuario(cliente, nuevaFotoPath);
      if (temporalFotoRef.current) URL.revokeObjectURL(temporalFotoRef.current);
      temporalFotoRef.current = urlFirmada ? null : URL.createObjectURL(archivo);
      setFotoUrl(urlFirmada ?? temporalFotoRef.current ?? "");
    } catch (err) {
      setMensajeError(err instanceof Error ? err.message : "No pudimos subir la fotografía.");
    } finally {
      subidaRef.current = false;
      setSubiendoFoto(false);
    }
  }

  async function guardarCambios(e: React.FormEvent) {
    e.preventDefault();
    if (guardadoRef.current || subidaRef.current || consultandoCp) return;
    setMensajeError(null);
    setMensajeExito(false);
    setAvisoDiscreto(null);

    if (!nombre.trim() || !apellido.trim()) {
      setPestana("personal");
      setMensajeError("Ingresa tu nombre y apellido completos.");
      return;
    }

    if (telefono && telefono.length !== 10) {
      setPestana("personal");
      setMensajeError("El teléfono debe tener 10 dígitos.");
      return;
    }

    if (pais === "México" && codigoPostal && !/^\d{5}$/.test(codigoPostal)) { setPestana("direccion"); setMensajeError("El código postal debe tener 5 dígitos."); return; }

    // C-4: validar fecha de nacimiento real (sin default ficticio).
    if (fechaNacimiento) {
      const fecha = new Date(`${fechaNacimiento}T00:00:00`);
      const hoy = new Date();
      if (Number.isNaN(fecha.getTime())) {
        setPestana("personal");
        setMensajeError("La fecha de nacimiento no es válida.");
        return;
      }
      if (fecha > hoy) {
        setPestana("personal");
        setMensajeError("La fecha de nacimiento no puede ser futura.");
        return;
      }
      const edad = hoy.getFullYear() - fecha.getFullYear() - (hoy.getMonth() < fecha.getMonth() || (hoy.getMonth() === fecha.getMonth() && hoy.getDate() < fecha.getDate()) ? 1 : 0);
      if (edad < 18) {
        setPestana("personal");
        setMensajeError("Debes ser mayor de edad para usar Ruum Ruum.");
        return;
      }
    }

    if (!tieneSupabaseConfigurado()) {
      setMensajeError("No hay conexión configurada para guardar los cambios.");
      return;
    }
    guardadoRef.current = true;
    setGuardando(true);

    try {
      if (tieneSupabaseConfigurado()) {
        const cliente = crearClienteNavegador();
        await actualizarPerfilUsuario(cliente, {
          nombre: nombreCompleto(nombre, apellido),
          foto_url: fotoPath.trim() || null,
          telefono: telefono ? telefonoMx(telefono) : null,
          pais: pais.trim() || "México",
          estado: estado.trim(),
          codigo_postal: codigoPostal,
          ciudad: ciudad.trim(),
          colonia: colonia.trim(),
          calle: calle.trim(),
          numero: numero.trim(),
          referencias: referencias.trim() || null,
          direccion_principal: domicilioCompleto({
            calle,
            numero,
            colonia,
            codigoPostal,
            ciudad,
            estado,
            referencias,
          }),
        });
        // Persistir fecha de nacimiento si fue provista. Si el esquema no tiene
        // la columna aún (PGRST204/400), restringimos el catch a error de schema,
        // loggeamos advertencia y mostramos aviso discreto sin bloquear el perfil.
        if (fechaNacimiento !== (usuario.fecha_nacimiento ?? "")) {
          try {
            await actualizarFechaNacimientoUsuario(cliente, fechaNacimiento || null);
          } catch (errFecha) {
            if (esErrorEsquemaFechaNacimiento(errFecha)) {
              console.warn(
                "[DatosPersonales] Columna fecha_nacimiento no disponible en esquema (PGRST204/400); no persistió:",
                errFecha
              );
              setAvisoDiscreto(
                "Tu perfil se guardó, pero la fecha de nacimiento no se pudo registrar en la base de datos."
              );
            } else {
              // Cualquier otro error (red, permisos, etc.) no se silencia
              throw new Error("Los datos personales se guardaron, pero no pudimos guardar la fecha de nacimiento. Reintenta guardar para completar el cambio.", { cause: errFecha });
            }
          }
        }
      }

      setMensajeExito(true);
      router.refresh();
      if (exitoTimerRef.current) clearTimeout(exitoTimerRef.current);
      exitoTimerRef.current = setTimeout(() => {
        setMensajeExito(false);
        setAvisoDiscreto(null);
      }, 5000);
    } catch (err) {
      setMensajeError(err instanceof Error ? err.message : "Error al guardar los cambios.");
    } finally {
      guardadoRef.current = false;
      setGuardando(false);
    }
  }

  return (
    <div ref={viewportRef} className={`user-profile-editor ${escritorio ? "is-desktop" : ""}`}>
      <header className="user-profile-appbar">
        <Link href="/cuenta?seccion=perfil" aria-label="Volver a mi cuenta" className="user-profile-back"><Icono nombre="atras" className="size-4" />Atrás</Link>
        <h1>Editar Perfil</h1>
        <span aria-hidden="true" />
      </header>
      <div role="tablist" aria-label="Secciones del perfil" className="user-profile-tabs">
        {(["personal", "direccion"] as const).map((id, index) => <button key={id} id={`perfil-tab-${id}`} type="button" role="tab" aria-selected={pestana === id} aria-controls={`perfil-panel-${id}`} tabIndex={pestana === id ? 0 : -1} onClick={() => setPestana(id)} onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const next = event.key === "Home" ? "personal" : event.key === "End" ? "direccion" : index === 0 ? "direccion" : "personal";
            setPestana(next); document.getElementById(`perfil-tab-${next}`)?.focus();
          }
        }}>{id === "personal" ? "Personal" : "Dirección"}</button>)}
      </div>
      <form id="editar-perfil-form" noValidate onSubmit={guardarCambios} className="user-profile-form">
        <fieldset disabled={guardando || subiendoFoto} className="contents">
        <section id="perfil-panel-personal" role="tabpanel" aria-labelledby="perfil-tab-personal" hidden={pestana !== "personal"} className="user-profile-panel">
          <div className="user-profile-photo">
            {fotoUrl ? <Image src={fotoUrl} alt="Foto de perfil" width={48} height={48} unoptimized /> : <span aria-hidden="true">{iniciales(nombre, apellido)}</span>}
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={subiendoFoto || guardando} aria-label="Cambiar foto de perfil"><IconoCamara />{subiendoFoto ? "Subiendo foto…" : "Cambiar foto"}</button>
            <input ref={fileInputRef} type="file" accept="image/*" aria-label="Archivo de foto de perfil" onChange={(event) => { const archivo = event.target.files?.[0]; event.target.value = ""; void cargarFoto(archivo); }} hidden />
          </div>
          <div className="user-profile-grid">
            <CampoPerfil id="nombre" etiqueta="Nombre(s)"><input id="nombre" autoComplete="given-name" value={nombre} onChange={(e) => setNombre(e.target.value)} required /></CampoPerfil>
            <CampoPerfil id="apellido" etiqueta="Apellidos"><input id="apellido" autoComplete="family-name" value={apellido} onChange={(e) => setApellido(e.target.value)} required /></CampoPerfil>
            <CampoPerfil id="telefono" etiqueta="Teléfono"><input id="telefono" type="tel" autoComplete="tel-national" inputMode="numeric" maxLength={10} value={telefono} onChange={(e) => setTelefono(telefonoLocalMx(e.target.value))} /></CampoPerfil>
            <CampoPerfil id="fecha-nacimiento" etiqueta="Fecha de nacimiento"><input id="fecha-nacimiento" type="date" autoComplete="bday" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} /></CampoPerfil>
            <CampoPerfil id="email" etiqueta="Correo electrónico" ancho><input id="email" type="email" value={correoRegistro ?? ""} disabled title="Para cambiar tu correo, contacta a soporte" /></CampoPerfil>
          </div>
        </section>
        <section id="perfil-panel-direccion" role="tabpanel" aria-labelledby="perfil-tab-direccion" hidden={pestana !== "direccion"} className="user-profile-panel">
          <div className="user-profile-grid">
            <CampoPerfil id="pais" etiqueta="País"><select id="pais" autoComplete="country-name" value={pais} onChange={(e) => { cpRequestRef.current++; setConsultandoCp(false); setColoniasCp([]); setAvisoCp(null); setPais(e.target.value); }}>{Array.from(new Set([pais, "México", "Estados Unidos", "Colombia", "Argentina", "España"])).filter(Boolean).map(valor => <option key={valor}>{valor}</option>)}</select></CampoPerfil>
            <CampoPerfil id="cp" etiqueta="Código postal"><input id="cp" autoComplete="postal-code" inputMode={pais === "México" ? "numeric" : "text"} maxLength={pais === "México" ? 5 : 12} value={codigoPostal} onChange={(e) => void consultarCodigoPostal(e.target.value, true)} /></CampoPerfil>
            <CampoPerfil id="estado" etiqueta="Estado"><input id="estado" autoComplete="address-level1" value={estado} onChange={(e) => setEstado(e.target.value)} /></CampoPerfil>
            <CampoPerfil id="ciudad" etiqueta="Ciudad"><input id="ciudad" autoComplete="address-level2" value={ciudad} onChange={(e) => setCiudad(e.target.value)} /></CampoPerfil>
            <CampoPerfil id="colonia" etiqueta="Colonia" ancho>{coloniasCp.length > 1 ? <select id="colonia" value={colonia} onChange={(e) => setColonia(e.target.value)}>{Array.from(new Set([colonia, ...coloniasCp])).filter(Boolean).map(valor => <option key={valor}>{valor}</option>)}</select> : <input id="colonia" value={colonia} onChange={(e) => setColonia(e.target.value)} />}</CampoPerfil>
            <CampoPerfil id="calle" etiqueta="Calle"><input id="calle" autoComplete="address-line1" value={calle} onChange={(e) => setCalle(e.target.value)} /></CampoPerfil>
            <CampoPerfil id="numero" etiqueta="Número"><input id="numero" autoComplete="address-line2" value={numero} onChange={(e) => setNumero(e.target.value)} /></CampoPerfil>
            <CampoPerfil id="referencias" etiqueta="Referencias" ancho><input id="referencias" value={referencias} onChange={(e) => setReferencias(e.target.value)} /></CampoPerfil>
          </div>
        </section>
        </fieldset>
      </form>
      <footer className="user-profile-actions">
        <div className="user-profile-feedback" aria-live="polite">
          {consultandoCp && <p role="status">Consultando código postal…</p>}
          {avisoCp && !consultandoCp && <p>{avisoCp}</p>}
          {mensajeError && <p role="alert">{mensajeError}</p>}
          {avisoDiscreto && !mensajeError && (
            <p role="status" className="user-profile-warning text-xs text-amber-600 dark:text-amber-400">
              {avisoDiscreto}
            </p>
          )}
          {mensajeExito && !mensajeError && (
            <p role="status">
              {avisoDiscreto
                ? "Cambios guardados con observaciones"
                : "Tus datos se guardaron correctamente"}
            </p>
          )}
        </div>
        <button type="submit" form="editar-perfil-form" disabled={guardando || subiendoFoto || consultandoCp}><IconoCheckCirculo className="size-5" />{guardando ? "Guardando cambios…" : "Guardar cambios"}</button>
      </footer>
    </div>
  );
}

function CampoPerfil({ id, etiqueta, ancho = false, children }: { id: string; etiqueta: string; ancho?: boolean; children: ReactNode }) {
  return <div className={`user-profile-field ${ancho ? "is-wide" : ""}`}><label htmlFor={id}>{etiqueta}</label>{children}</div>;
}
