"use client";

import Image from "next/image";

import { useEffect, useState } from "react";
import { Aviso, Button, Field } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import { actualizarPerfilUsuario, obtenerUrlFotoPerfilUsuario, subirFotoPerfil } from "@ruum/api/services";
import { consultarCodigoPostalMx } from "../../lib/codigos-postales";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { soloDigitos, telefonoLocalMx, telefonoMx } from "../../lib/registro-usuario";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

function separarNombreApellido(nombreCompleto: string | null) {
  const partes = (nombreCompleto ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 1) return { nombre: partes[0] ?? "", apellido: "" };
  return {
    nombre: partes.slice(0, -1).join(" "),
    apellido: partes.at(-1) ?? ""
  };
}

function nombreCompleto(nombre: string, apellido: string) {
  return [nombre.trim(), apellido.trim()].filter(Boolean).join(" ");
}

function iniciales(nombre: string, apellido: string) {
  return [nombre, apellido]
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.trim()[0]?.toUpperCase())
    .join("") || "RR";
}

function domicilioCompleto({
  calle,
  numero,
  colonia,
  codigoPostal,
  ciudad,
  estado,
  referencias
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
    referencias.trim() ? `Ref. ${referencias.trim()}` : ""
  ]
    .filter(Boolean)
    .join(", ");
}

export function DatosPersonalesForm({ usuario, fotoUrlInicial }: { usuario: Usuario; fotoUrlInicial?: string | null }) {
  const nombreInicial = separarNombreApellido(usuario.nombre);
  const [nombre, setNombre] = useState(nombreInicial.nombre);
  const [apellido, setApellido] = useState(nombreInicial.apellido);
  const [fotoPath, setFotoPath] = useState(usuario.foto_url ?? "");
  const [fotoUrl, setFotoUrl] = useState(fotoUrlInicial ?? "");
  const [telefono, setTelefono] = useState(telefonoLocalMx(usuario.telefono ?? ""));
  const [pais, setPais] = useState(usuario.pais ?? "México");
  const [estado, setEstado] = useState(usuario.estado ?? "");
  const [codigoPostal, setCodigoPostal] = useState(usuario.codigo_postal ?? "");
  const [ciudad, setCiudad] = useState(usuario.ciudad ?? "");
  const [colonia, setColonia] = useState(usuario.colonia ?? "");
  const [calle, setCalle] = useState(usuario.calle ?? "");
  const [numero, setNumero] = useState(usuario.numero ?? "");
  const [referencias, setReferencias] = useState(usuario.referencias ?? "");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);
  const [cpConsultando, setCpConsultando] = useState(false);
  const [cpAviso, setCpAviso] = useState<string | null>(null);
  const [ciudadesCp, setCiudadesCp] = useState<string[]>(usuario.ciudad ? [usuario.ciudad] : []);
  const [coloniasCp, setColoniasCp] = useState<string[]>(usuario.colonia ? [usuario.colonia] : []);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  useEffect(() => {
    if (codigoPostal.length === 5) void consultarCodigoPostal(codigoPostal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function consultarCodigoPostal(valor: string) {
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
      const datosCp = await consultarCodigoPostalMx(cp);
      if (!datosCp) throw new Error("CP no encontrado");

      setEstado(datosCp.estado);
      setCiudadesCp(datosCp.ciudades);
      setColoniasCp(datosCp.colonias);
      setCiudad(datosCp.ciudades[0] ?? "");
      setColonia(datosCp.colonias[0] ?? "");
      if (datosCp.ciudades.length > 1 || datosCp.colonias.length > 1) {
        setCpAviso("Selecciona la ciudad o municipio y la colonia que correspondan al CP.");
      } else if (!datosCp.ciudades.length || !datosCp.colonias.length) {
        setCpAviso("Captura manualmente los campos que no se prellenaron con el CP.");
      }
    } catch {
      setCiudadesCp([]);
      setColoniasCp([]);
      setCpAviso("No pudimos encontrar ese CP. Captura estado, ciudad y colonia manualmente.");
    } finally {
      setCpConsultando(false);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);

    if (telefono.length !== 10) {
      setMensaje({ tono: "danger", texto: "El teléfono debe tener 10 dígitos; el prefijo +52 ya está aplicado." });
      return;
    }

    if (
      !nombre.trim() ||
      !apellido.trim() ||
      codigoPostal.length !== 5 ||
      !estado.trim() ||
      !ciudad.trim() ||
      !colonia.trim() ||
      !calle.trim() ||
      !numero.trim()
    ) {
      setMensaje({ tono: "danger", texto: "Completa nombre, apellido, teléfono y domicilio antes de guardar." });
      return;
    }

    if (!tieneSupabaseConfigurado()) {
      setMensaje({ tono: "danger", texto: "Supabase no está configurado. No se pueden guardar cambios." });
      return;
    }

    setGuardando(true);
    try {
      await actualizarPerfilUsuario(crearClienteNavegador(), {
        nombre: nombreCompleto(nombre, apellido),
        foto_url: fotoPath.trim() || null,
        telefono: telefonoMx(telefono),
        pais: pais.trim() || "México",
        estado: estado.trim(),
        codigo_postal: codigoPostal,
        ciudad: ciudad.trim(),
        colonia: colonia.trim(),
        calle: calle.trim(),
        numero: numero.trim(),
        referencias: referencias.trim() || null,
        direccion_principal: domicilioCompleto({ calle, numero, colonia, codigoPostal, ciudad, estado, referencias })
      });
      setMensaje({ tono: "info", texto: "Tus datos se guardaron correctamente." });
    } catch (err) {
      setMensaje({ tono: "danger", texto: err instanceof Error ? err.message : "No pudimos guardar los cambios." });
    } finally {
      setGuardando(false);
    }
  }

  async function cargarFoto(archivo: File | undefined) {
    if (!archivo) return;
    setMensaje(null);

    if (!archivo.type.startsWith("image/")) {
      setMensaje({ tono: "danger", texto: "Selecciona una imagen para la fotografía de perfil." });
      return;
    }

    if (!tieneSupabaseConfigurado()) {
      setMensaje({ tono: "danger", texto: "Supabase no está configurado. No se puede subir la fotografía." });
      return;
    }

    setSubiendoFoto(true);
    try {
      const cliente = crearClienteNavegador();
      const nuevaFotoPath = await subirFotoPerfil(cliente, archivo);
      setFotoPath(nuevaFotoPath);
      setFotoUrl(await obtenerUrlFotoPerfilUsuario(cliente, nuevaFotoPath) ?? "");
      setMensaje({ tono: "info", texto: "Fotografía actualizada." });
    } catch (err) {
      setMensaje({ tono: "danger", texto: err instanceof Error ? err.message : "No pudimos subir la fotografía." });
    } finally {
      setSubiendoFoto(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={guardar}>
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 rounded-lg border border-ink/10 p-5">
        {fotoUrl ? (
          <Image src={fotoUrl} alt="Fotografía de perfil" width={80} height={80} className="size-20 rounded-full border-2 border-white object-cover shadow-[0_4px_12px_rgba(0,0,0,0.08)]" />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-full border-2 border-white bg-[#d1ddeb] font-display text-2xl font-bold text-[#0b1e33] shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
            {iniciales(nombre, apellido)}
          </div>
        )}
        <label className="flex cursor-pointer flex-col items-center gap-1.5">
          <span className="font-body text-sm font-medium text-[#2e5a88]">
            {subiendoFoto ? "Subiendo fotografía..." : "Toca para cambiar tu foto"}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => void cargarFoto(e.target.files?.[0])}
            disabled={subiendoFoto}
            className="hidden"
          />
        </label>
      </div>

      {/* Información personal */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field etiqueta="Nombre(s)" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <Field etiqueta="Apellidos" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium">Correo electrónico</span>
        <div className="relative">
          <input
            type="email"
            value={usuario.correo_facturacion ?? ""}
            disabled
            className="w-full rounded-lg border border-ink/20 bg-ink/[0.03] px-3.5 py-2.5 pr-10 font-body text-sm text-ink/65"
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
        </div>
        <span className="font-body text-xs text-ink/65">Para cambiar tu correo, contacta a soporte.</span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-body text-sm font-medium">Teléfono</span>
        <div className="flex overflow-hidden rounded-lg border border-ink/50 bg-mist">
          <span className="flex items-center border-r border-ink/10 px-3.5 font-body text-sm font-semibold text-ink/70">+52</span>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(telefonoLocalMx(e.target.value))}
            inputMode="numeric"
            maxLength={10}
            required
            autoComplete="tel-national"
            className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 font-body text-sm text-ink placeholder:text-ink/65 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-route-dark"
            placeholder="10 dígitos"
          />
        </div>
      </label>

      {/* Dirección */}
      <div className="grid gap-4 rounded-lg border border-ink/10 p-4">
        <p className="font-body text-sm font-semibold">Dirección principal</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field etiqueta="País" value={pais} onChange={(e) => setPais(e.target.value)} required />
          <Field
            etiqueta="Código Postal"
            value={codigoPostal}
            onChange={(e) => void consultarCodigoPostal(e.target.value)}
            onBlur={(e) => consultarCodigoPostal(e.target.value)}
            inputMode="numeric"
            maxLength={5}
            required
            ayuda={cpConsultando ? "Consultando CP..." : cpAviso}
          />
          <Field etiqueta="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} required />
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium">Ciudad o municipio</span>
            {ciudadesCp.length > 0 ? (
              <select
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                required
                className="w-full rounded-lg border border-ink/50 bg-mist px-3.5 py-2.5 font-body text-sm text-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-route-dark"
              >
                {ciudadesCp.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                required
                className="w-full rounded-lg border border-ink/50 bg-mist px-3.5 py-2.5 font-body text-sm text-ink placeholder:text-ink/65 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-route-dark"
              />
            )}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-sm font-medium">Colonia</span>
            {coloniasCp.length > 0 ? (
              <select
                value={colonia}
                onChange={(e) => setColonia(e.target.value)}
                required
                className="w-full rounded-lg border border-ink/50 bg-mist px-3.5 py-2.5 font-body text-sm text-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-route-dark"
              >
                {coloniasCp.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={colonia}
                onChange={(e) => setColonia(e.target.value)}
                required
                className="w-full rounded-lg border border-ink/50 bg-mist px-3.5 py-2.5 font-body text-sm text-ink placeholder:text-ink/65 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-route-dark"
              />
            )}
          </label>
          <Field etiqueta="Calle" value={calle} onChange={(e) => setCalle(e.target.value)} required />
          <Field etiqueta="Número" value={numero} onChange={(e) => setNumero(e.target.value)} required />
        </div>
        <Field
          etiqueta="Referencias"
          value={referencias}
          onChange={(e) => setReferencias(e.target.value)}
          placeholder="Entre calles, color de fachada, acceso, piso, etc."
        />
      </div>

      {mensaje && (
        <div role="status" aria-live="polite" aria-atomic="true">
          <Aviso tono={mensaje.tono}>{mensaje.texto}</Aviso>
        </div>
      )}

      <div>
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
