"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icono } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import { actualizarPerfilUsuario, obtenerUrlFotoPerfilUsuario, subirFotoPerfil } from "@ruum/api/services";
import { consultarCodigoPostalMx } from "../../lib/codigos-postales";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
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

function IconoUsuario({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconoCandado({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconoTelefono({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconoMapa({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
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

function IconoInfo({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconoAlerta({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconoUsuarioBorrar({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="17" y1="8" x2="23" y2="14" />
      <line x1="23" y1="8" x2="17" y2="14" />
    </svg>
  );
}

export interface DatosPersonalesProps {
  usuario: Usuario;
  correoRegistro?: string | null;
  fotoUrlInicial?: string | null;
}

export function DatosPersonales({ usuario, fotoUrlInicial, correoRegistro }: DatosPersonalesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nombreInicial = separarNombreApellido(usuario.nombre);
  const [nombre, setNombre] = useState(nombreInicial.nombre);
  const [apellido, setApellido] = useState(nombreInicial.apellido);
  const [fotoPath, setFotoPath] = useState(usuario.foto_url ?? "");
  const [fotoUrl, setFotoUrl] = useState(fotoUrlInicial ?? "");
  const [telefono, setTelefono] = useState(telefonoLocalMx(usuario.telefono ?? ""));
  // C-4: sin fecha hardcodeada — se lee del perfil (si la columna existe) o queda vacía.
  const [fechaNacimiento, setFechaNacimiento] = useState(
    (usuario as unknown as { fecha_nacimiento?: string | null }).fecha_nacimiento ?? ""
  );

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
  const [modalEliminar, setModalEliminar] = useState(false);

  // CP lookup
  const [coloniasCp, setColoniasCp] = useState<string[]>([]);

  useEffect(() => {
    if (codigoPostal.length === 5) {
      void consultarCodigoPostal(codigoPostal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function consultarCodigoPostal(valor: string) {
    const cp = soloDigitos(valor, 5);
    setCodigoPostal(cp);

    if (cp.length !== 5) {
      setColoniasCp([]);
      return;
    }

    try {
      const datosCp = await consultarCodigoPostalMx(cp);
      if (!datosCp) return;

      if (datosCp.estado) setEstado(datosCp.estado);
      if (datosCp.ciudades?.[0]) setCiudad(datosCp.ciudades[0]);
      if (datosCp.colonias && datosCp.colonias.length > 0) {
        setColoniasCp(datosCp.colonias);
        if (!colonia || !datosCp.colonias.includes(colonia)) {
          setColonia(datosCp.colonias[0] ?? "");
        }
      }
    } catch {
      // Dejar captura manual si falla el lookup
    }
  }

  async function cargarFoto(archivo: File | undefined) {
    if (!archivo) return;
    setMensajeError(null);

    if (!archivo.type.startsWith("image/")) {
      setMensajeError("Selecciona un archivo de imagen válido para la foto de perfil.");
      return;
    }

    if (!tieneSupabaseConfigurado()) {
      // Simular cambio en local
      setFotoUrl(URL.createObjectURL(archivo));
      return;
    }

    setSubiendoFoto(true);
    try {
      const cliente = crearClienteNavegador();
      const nuevaFotoPath = await subirFotoPerfil(cliente, archivo);
      setFotoPath(nuevaFotoPath);
      const urlFirmada = await obtenerUrlFotoPerfilUsuario(cliente, nuevaFotoPath);
      setFotoUrl(urlFirmada ?? URL.createObjectURL(archivo));
    } catch (err) {
      setMensajeError(err instanceof Error ? err.message : "No pudimos subir la fotografía.");
    } finally {
      setSubiendoFoto(false);
    }
  }

  async function guardarCambios(e: React.FormEvent) {
    e.preventDefault();
    setMensajeError(null);

    if (!nombre.trim() || !apellido.trim()) {
      setMensajeError("Ingresa tu nombre y apellido completos.");
      return;
    }

    // C-4: validar fecha de nacimiento real (sin default ficticio).
    if (fechaNacimiento) {
      const fecha = new Date(`${fechaNacimiento}T00:00:00`);
      const hoy = new Date();
      if (Number.isNaN(fecha.getTime())) {
        setMensajeError("La fecha de nacimiento no es válida.");
        return;
      }
      if (fecha > hoy) {
        setMensajeError("La fecha de nacimiento no puede ser futura.");
        return;
      }
      const edad = hoy.getFullYear() - fecha.getFullYear() - (hoy.getMonth() < fecha.getMonth() || (hoy.getMonth() === fecha.getMonth() && hoy.getDate() < fecha.getDate()) ? 1 : 0);
      if (edad < 18) {
        setMensajeError("Debes ser mayor de edad para usar Ruum Ruum.");
        return;
      }
    }

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
        // C-4: persistir fecha de nacimiento si la columna existe (migración
        // pendiente); se ignora el error si el esquema aún no la tiene.
        if (fechaNacimiento) {
          try {
            await cliente.from("usuarios").update({ fecha_nacimiento: fechaNacimiento } as never).eq("id", usuario.id);
          } catch {
            // Esquema sin columna fecha_nacimiento — el perfil ya se guardó.
          }
        }
      }

      setMensajeExito(true);
      setTimeout(() => {
        setMensajeExito(false);
      }, 3500);
    } catch (err) {
      setMensajeError(err instanceof Error ? err.message : "Error al guardar los cambios.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header con botón atrás */}
      <header className="flex items-center gap-3.5 border-b border-[#f0f4fa] bg-white px-3 py-3 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <Link
          href="/cuenta"
          aria-label="Volver a mi cuenta"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f2f6fc] text-[#0a2342] transition-all hover:bg-[#e3ebf5] active:scale-95"
        >
          <Icono nombre="atras" className="size-4" strokeWidth={2.2} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold tracking-tight text-[#0a2342] leading-snug">
            Datos personales
          </h1>
          <p className="text-[12px] font-medium text-[#4e5f80]">
            Gestiona tu información de perfil
          </p>
        </div>
      </header>

      {/* Sección Avatar */}
      <div className="flex flex-col items-center pt-2 pb-3">
        <div className="relative mb-3">
          {fotoUrl ? (
            <Image
              src={fotoUrl}
              alt="Foto de perfil"
              width={100}
              height={100}
              className="size-[100px] rounded-full object-cover border-4 border-white shadow-[0_12px_24px_-8px_rgba(11,30,51,0.35)]"
            />
          ) : (
            <div className="flex size-[100px] items-center justify-center rounded-full bg-gradient-to-br from-[#0a2342] to-[#2e5a88] text-[38px] font-bold text-white border-4 border-white shadow-[0_12px_24px_-8px_rgba(11,30,51,0.35)]">
              {iniciales(nombre, apellido)}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendoFoto}
            aria-label="Cambiar foto de perfil"
            className="absolute bottom-[2px] right-[2px] flex size-[34px] items-center justify-center rounded-full bg-[#0a2342] text-white border-[3px] border-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition-all cursor-pointer hover:bg-[#1a3454] active:scale-90"
          >
            <IconoCamara className="size-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => void cargarFoto(e.target.files?.[0])}
            className="hidden"
          />
        </div>
        <p className="text-[12px] font-medium text-[#4e5f80]">
          {subiendoFoto ? "Subiendo foto..." : "Toca para cambiar tu foto"}
        </p>
      </div>

      <form onSubmit={guardarCambios} className="flex flex-col gap-4">
        {/* ============================================= */}
        {/* SECCIÓN 1: INFORMACIÓN PERSONAL               */}
        {/* ============================================= */}
        <section aria-labelledby="sec-personal" className="rounded-[22px] border border-[#eef2f7] bg-white p-[22px_20px] shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
          <div className="mb-5 flex items-center gap-2.5 font-bold text-[15px] text-[#0a2342]">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#f0f5fe] text-[#2e5a88]">
              <IconoUsuario className="size-4" />
            </div>
            <h2 id="sec-personal" className="font-bold text-[15px] text-[#0a2342]">
              Información personal
            </h2>
          </div>

          <div className="flex flex-col gap-4.5">
            {/* Nombre y Apellidos */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="nombre" className="block text-[12px] font-bold text-[#4e5f80] mb-1.5 uppercase tracking-[0.2px]">
                  Nombre(s)
                </label>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Laura"
                  required
                  className="w-full p-[14px_16px] border-[1.5px] border-[#e6edf6] rounded-[14px] text-[14.5px] text-[#0a2342] font-medium bg-[#fafcfe] outline-none transition-all focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/5"
                />
              </div>
              <div>
                <label htmlFor="apellido" className="block text-[12px] font-bold text-[#4e5f80] mb-1.5 uppercase tracking-[0.2px]">
                  Apellidos
                </label>
                <input
                  id="apellido"
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Ej. Martínez Ruiz"
                  required
                  className="w-full p-[14px_16px] border-[1.5px] border-[#e6edf6] rounded-[14px] text-[14.5px] text-[#0a2342] font-medium bg-[#fafcfe] outline-none transition-all focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/5"
                />
              </div>
            </div>

            {/* Correo electrónico */}
            <div>
              <label htmlFor="email" className="flex items-center text-[12px] font-bold text-[#4e5f80] mb-1.5 uppercase tracking-[0.2px]">
                Correo electrónico
                <span className="inline-flex items-center gap-1 bg-[#e9f3ee] text-[#1f6b4a] text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 lowercase tracking-normal">
                  <IconoCheckCirculo className="size-3" /> Verificado
                </span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={correoRegistro ?? ""}
                  disabled
                  placeholder="tu@email.com"
                  className="w-full p-[14px_16px] pr-11 border-[1.5px] border-[#e6edf6] rounded-[14px] text-[14.5px] text-[#4e5f80] font-medium bg-[#f2f6fb] cursor-not-allowed outline-none"
                />
                <IconoCandado className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-[#b0bfd0] pointer-events-none" />
              </div>
              <p className="flex items-center gap-1.5 text-[11.5px] text-[#4e5f80] font-medium mt-1.5">
                <IconoInfo className="size-3.5 text-[#4e5f80] shrink-0" />
                Para cambiar tu correo, contacta a soporte
              </p>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono" className="block text-[12px] font-bold text-[#4e5f80] mb-1.5 uppercase tracking-[0.2px]">
                Teléfono
              </label>
              <div className="relative">
                <input
                  id="telefono"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(telefonoLocalMx(e.target.value))}
                  placeholder="+52 55 1234 5678"
                  className="w-full p-[14px_16px] pr-11 border-[1.5px] border-[#e6edf6] rounded-[14px] text-[14.5px] text-[#0a2342] font-medium bg-[#fafcfe] outline-none transition-all focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/5"
                />
                <IconoTelefono className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-[#b0bfd0] pointer-events-none" />
              </div>
            </div>

            {/* Fecha de nacimiento */}
            <div>
              <label htmlFor="fecha-nacimiento" className="block text-[12px] font-bold text-[#4e5f80] mb-1.5 uppercase tracking-[0.2px]">
                Fecha de nacimiento
              </label>
              <input
                id="fecha-nacimiento"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full p-[14px_16px] border-[1.5px] border-[#e6edf6] rounded-[14px] text-[14.5px] text-[#0a2342] font-medium bg-[#fafcfe] outline-none transition-all focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/5"
              />
            </div>
          </div>
        </section>

        {/* ============================================= */}
        {/* SECCIÓN 2: DIRECCIÓN PRINCIPAL                */}
        {/* ============================================= */}
        <section aria-labelledby="sec-direccion" className="rounded-[22px] border border-[#eef2f7] bg-white p-[22px_20px] shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
          <div className="mb-5 flex items-center gap-2.5 font-bold text-[15px] text-[#0a2342]">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#f0f5fe] text-[#2e5a88]">
              <IconoMapa className="size-4" />
            </div>
            <h2 id="sec-direccion" className="font-bold text-[15px] text-[#0a2342]">
              Dirección principal
            </h2>
          </div>

          <div className="flex flex-col gap-4.5">
            {/* País y Estado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="pais" className="block text-[12px] font-bold text-[#4e5f80] mb-1.5 uppercase tracking-[0.2px]">
                  País
                </label>
                <select
                  id="pais"
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  className="w-full p-[14px_16px] border-[1.5px] border-[#e6edf6] rounded-[14px] text-[14.5px] text-[#0a2342] font-medium bg-[#fafcfe] outline-none transition-all focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/5 cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%278%27%20viewBox=%270%200%2012%208%27%3E%3Cpath%20fill=%27%23b0bfd0%27%20d=%27M6%208L0%200h12z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_18px_center]"
                >
                  <option value="México">México</option>
                  <option value="Estados Unidos">Estados Unidos</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Argentina">Argentina</option>
                  <option value="España">España</option>
                </select>
              </div>
              <div>
                <label htmlFor="estado" className="block text-[12px] font-bold text-[#4e5f80] mb-1.5 uppercase tracking-[0.2px]">
                  Estado
                </label>
                <select
                  id="estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full p-[14px_16px] border-[1.5px] border-[#e6edf6] rounded-[14px] text-[14.5px] text-[#0a2342] font-medium bg-[#fafcfe] outline-none transition-all focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/5 cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%278%27%20viewBox=%270%200%2012%208%27%3E%3Cpath%20fill=%27%23b0bfd0%27%20d=%27M6%208L0%200h12z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_18px_center]"
                >
                  <option value="Ciudad de México">Ciudad de México</option>
                  <option value="Estado de México">Estado de México</option>
                  <option value="Jalisco">Jalisco</option>
                  <option value="Nuevo León">Nuevo León</option>
                  <option value="Puebla">Puebla</option>
                  <option value="Querétaro">Querétaro</option>
                  <option value="Guanajuato">Guanajuato</option>
                  <option value="Yucatán">Yucatán</option>
                  {![
                    "Ciudad de México",
                    "Estado de México",
                    "Jalisco",
                    "Nuevo León",
                    "Puebla",
                    "Querétaro",
                    "Guanajuato",
                    "Yucatán",
                  ].includes(estado) && estado && (
                    <option value={estado}>{estado}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Ciudad y Código Postal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ciudad" className="block text-[12px] font-bold text-[#4e5f80] mb-1.5 uppercase tracking-[0.2px]">
                  Ciudad
                </label>
                <input
                  id="ciudad"
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Ciudad"
                  className="w-full p-[14px_16px] border-[1.5px] border-[#e6edf6] rounded-[14px] text-[14.5px] text-[#0a2342] font-medium bg-[#fafcfe] outline-none transition-all focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/5"
                />
              </div>
              <div>
                <label htmlFor="cp" className="block text-[12px] font-bold text-[#4e5f80] mb-1.5 uppercase tracking-[0.2px]">
                  Código postal
                </label>
                <input
                  id="cp"
                  type="text"
                  maxLength={5}
                  value={codigoPostal}
                  onChange={(e) => void consultarCodigoPostal(e.target.value)}
                  placeholder="00000"
                  className="w-full p-[14px_16px] border-[1.5px] border-[#e6edf6] rounded-[14px] text-[14.5px] text-[#0a2342] font-medium bg-[#fafcfe] outline-none transition-all focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/5"
                />
              </div>
            </div>

            {/* Colonia */}
            <div>
              <label htmlFor="colonia" className="block text-[12px] font-bold text-[#4e5f80] mb-1.5 uppercase tracking-[0.2px]">
                Colonia
              </label>
              {coloniasCp.length > 1 ? (
                <select
                  id="colonia"
                  value={colonia}
                  onChange={(e) => setColonia(e.target.value)}
                  className="w-full p-[14px_16px] border-[1.5px] border-[#e6edf6] rounded-[14px] text-[14.5px] text-[#0a2342] font-medium bg-[#fafcfe] outline-none transition-all focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/5 cursor-pointer appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%278%27%20viewBox=%270%200%2012%208%27%3E%3Cpath%20fill=%27%23b0bfd0%27%20d=%27M6%208L0%200h12z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_18px_center]"
                >
                  {coloniasCp.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="colonia"
                  type="text"
                  value={colonia}
                  onChange={(e) => setColonia(e.target.value)}
                  placeholder="Colonia o barrio"
                  className="w-full p-[14px_16px] border-[1.5px] border-[#e6edf6] rounded-[14px] text-[14.5px] text-[#0a2342] font-medium bg-[#fafcfe] outline-none transition-all focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/5"
                />
              )}
            </div>

            {/* Calle y Número */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="calle" className="block text-[12px] font-bold text-[#4e5f80] mb-1.5 uppercase tracking-[0.2px]">
                  Calle
                </label>
                <input
                  id="calle"
                  type="text"
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                  placeholder="Nombre de la calle"
                  className="w-full p-[14px_16px] border-[1.5px] border-[#e6edf6] rounded-[14px] text-[14.5px] text-[#0a2342] font-medium bg-[#fafcfe] outline-none transition-all focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/5"
                />
              </div>
              <div>
                <label htmlFor="numero" className="block text-[12px] font-bold text-[#4e5f80] mb-1.5 uppercase tracking-[0.2px]">
                  Número
                </label>
                <input
                  id="numero"
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ext. / Int."
                  className="w-full p-[14px_16px] border-[1.5px] border-[#e6edf6] rounded-[14px] text-[14.5px] text-[#0a2342] font-medium bg-[#fafcfe] outline-none transition-all focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/5"
                />
              </div>
            </div>

            {/* Referencias */}
            <div>
              <label htmlFor="referencias" className="block text-[12px] font-bold text-[#4e5f80] mb-1.5 uppercase tracking-[0.2px]">
                Referencias
              </label>
              <input
                id="referencias"
                type="text"
                value={referencias}
                onChange={(e) => setReferencias(e.target.value)}
                placeholder="Edificio blanco frente al parque / Entre calles"
                className="w-full p-[14px_16px] border-[1.5px] border-[#e6edf6] rounded-[14px] text-[14.5px] text-[#0a2342] font-medium bg-[#fafcfe] outline-none transition-all focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/5"
              />
            </div>
          </div>
        </section>

        {/* Mensaje de error si ocurre */}
        {mensajeError && (
          <div role="alert" className="flex items-center gap-2 rounded-[14px] border border-[#f5c6c6] bg-[#fdeaea] p-4 text-[13px] font-semibold text-[#b33c3c]">
            <IconoAlerta className="size-4 shrink-0" />
            <span>{mensajeError}</span>
          </div>
        )}

        {/* Botón Guardar cambios */}
        <button
          type="submit"
          disabled={guardando}
          className="w-full bg-[#0a2342] text-white py-[18px] px-[22px] rounded-[18px] font-bold text-[16px] flex items-center justify-center gap-2.5 shadow-[0_14px_28px_-10px_rgba(11,30,51,0.4)] active:scale-[0.98] transition-all cursor-pointer mt-2 tracking-[-0.2px] hover:bg-[#162a42] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <IconoCheckCirculo className="size-5" />
          {guardando ? "Guardando cambios..." : "Guardar cambios"}
        </button>

        {/* Mensaje de éxito animado */}
        {mensajeExito && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2.5 rounded-[14px] border border-[#cbe5d9] bg-[#e9f3ee] p-[14px_16px] text-[13px] font-semibold text-[#1f6b4a] animate-in fade-in duration-300"
          >
            <IconoCheckCirculo className="size-5 shrink-0" />
            <span>Tus datos se guardaron correctamente</span>
          </div>
        )}
      </form>

      {/* ============================================= */}
      {/* SECCIÓN 3: ZONA DE RIESGO                    */}
      {/* ============================================= */}
      <section aria-labelledby="sec-riesgo" className="rounded-[22px] border border-[#fdeaea] bg-white p-5 shadow-[0_6px_16px_rgba(0,0,0,0.02)] mt-3">
        <div className="mb-2 flex items-center gap-2.5 font-bold text-[15px] text-[#b33c3c]">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#fdeaea] text-[#b33c3c]">
            <IconoAlerta className="size-4" />
          </div>
          <h2 id="sec-riesgo" className="font-bold text-[15px] text-[#b33c3c]">
            Zona de riesgo
          </h2>
        </div>
        <p className="mb-4 text-[13px] font-medium leading-[1.5] text-[#4e5f80]">
          Al eliminar tu cuenta, se borrarán todos tus datos, traslados e información personal de forma permanente. Esta acción no se puede deshacer.
        </p>
        <button
          type="button"
          onClick={() => setModalEliminar(true)}
          className="w-full bg-white text-[#b33c3c] border-[1.5px] border-[#f5c6c6] py-3.5 px-5 rounded-[14px] font-bold text-[14px] flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-[#fdeaea]/40 active:scale-[0.98]"
        >
          <IconoUsuarioBorrar className="size-4" />
          Eliminar mi cuenta
        </button>
      </section>

      {/* Modal Confirmación de Eliminación de Cuenta */}
      {modalEliminar && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-eliminar-titulo"
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(11,30,51,0.5)] backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalEliminar(false);
          }}
        >
          <div
            className="w-full max-w-[420px] rounded-t-[28px] bg-white p-6 pb-8 shadow-2xl sm:rounded-[28px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-[20px] bg-[#fdeaea] text-[#b33c3c]">
              <IconoAlerta className="size-7" />
            </div>
            <h3 id="modal-eliminar-titulo" className="mb-2 text-center text-[18px] font-extrabold text-[#0a2342]">
              ¿Eliminar tu cuenta?
            </h3>
            <p className="mb-6 text-center text-[13.5px] font-medium leading-relaxed text-[#4e5f80]">
              Esta acción no se puede deshacer. Para verificar que no existan traslados en curso ni saldos pendientes, la baja se procesa a través de nuestro canal de soporte.
            </p>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/soporte?motivo=eliminar_cuenta"
                className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#b33c3c] py-3.5 px-5 font-bold text-[14.5px] text-white shadow-[0_8px_20px_-6px_rgba(179,60,60,0.4)] transition-all hover:bg-[#9c2f2f] active:scale-[0.98]"
              >
                <IconoUsuarioBorrar className="size-4" />
                Continuar a soporte
              </Link>
              <button
                type="button"
                onClick={() => setModalEliminar(false)}
                className="w-full rounded-[16px] bg-[#f2f6fc] py-3 text-center font-bold text-[14px] text-[#0a2342] transition-colors hover:bg-[#e4ebf5]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export compatible para componentes que importen DatosPersonalesForm
export { DatosPersonales as DatosPersonalesForm };
