"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icono } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

export type EstadoDoc = "verificado" | "pendiente" | "vencido" | "faltante";

export interface DocItem {
  id: string;
  titulo: string;
  subtitulo: string;
  estado: EstadoDoc;
  etiquetaEstado: string;
  icono: string;
  fechaCarga: string;
  estadoTexto: string;
  archivo: string;
  seccion: "identidad" | "fiscal";
}

/* Iconos SVG representativos */
function IconoINE({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <circle cx="8" cy="10" r="2" />
      <path d="M14 8h4M14 12h4M6 16h12" />
    </svg>
  );
}

function IconoDomicilio({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function IconoUsuarioCheck({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="16 11 18 13 22 9" />
    </svg>
  );
}

function IconoConstanciaFiscal({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 15h6M9 11h6" />
      <path d="M9 19h3" />
    </svg>
  );
}

function IconoHuella({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
      <path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
    </svg>
  );
}

function IconoEmpresa({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
    </svg>
  );
}

function IconoFacturaDollar({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16l3-1.5 3 1.5 3-1.5 3 1.5 3-1.5 3 1.5V8z" />
      <path d="M14 2v6h6" />
      <path d="M12 18v-6" />
      <path d="M10 13.5a1.5 1.5 0 0 1 2-1.5h.5a1.5 1.5 0 0 1 0 3H11a1.5 1.5 0 0 0 0 3h1.5a1.5 1.5 0 0 0 1.5-1.5" />
    </svg>
  );
}

function IconoReloj({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconoCheck({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
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

function IconoNubeSubir({ className = "size-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <polyline points="12 12 12 17" />
      <polyline points="9.5 14.5 12 12 14.5 14.5" />
    </svg>
  );
}

function IconoCamara({ className = "size-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function IconoInfo({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function renderDocIcon(tipo: string, className = "size-5") {
  switch (tipo) {
    case "ine":
      return <IconoINE className={className} />;
    case "domicilio":
      return <IconoDomicilio className={className} />;
    case "usuario":
      return <IconoUsuarioCheck className={className} />;
    case "constancia":
      return <IconoConstanciaFiscal className={className} />;
    case "huella":
      return <IconoHuella className={className} />;
    case "empresa":
      return <IconoEmpresa className={className} />;
    default:
      return <IconoDomicilio className={className} />;
  }
}

export interface VerificacionDocumentosProps {
  usuario: Usuario;
  fotoUrl?: string | null;
}

export function VerificacionDocumentos({ usuario }: VerificacionDocumentosProps) {
  const [docDetalle, setDocDetalle] = useState<DocItem | null>(null);
  const [docSubir, setDocSubir] = useState<DocItem | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const verificado = usuario.estado_verificacion === "verificado";
  const enRevision = usuario.estado_verificacion === "en_revision";

  const docsIdentidad: DocItem[] = [
    {
      id: "ine",
      titulo: "Identificación oficial (INE)",
      subtitulo: verificado ? "Verificado · 12 sep 2026" : "En revisión · Actualizado hoy",
      estado: verificado ? "verificado" : "pendiente",
      etiquetaEstado: verificado ? "Verificado" : "Pendiente",
      icono: "ine",
      fechaCarga: verificado ? "12 sep 2026" : "Hoy, 10:30",
      estadoTexto: verificado ? "Aprobado" : "En revisión",
      archivo: "ine_anverso_reverso.pdf",
      seccion: "identidad",
    },
    {
      id: "comprobante",
      titulo: "Comprobante de domicilio",
      subtitulo: "En revisión · Actualizado hoy",
      estado: "pendiente",
      etiquetaEstado: "Pendiente",
      icono: "domicilio",
      fechaCarga: "Hoy, 10:30",
      estadoTexto: "En revisión",
      archivo: "comprobante_cfe.pdf",
      seccion: "identidad",
    },
    {
      id: "datos-personales",
      titulo: "Datos personales",
      subtitulo: "Nombre, correo y teléfono",
      estado: "verificado",
      etiquetaEstado: "Completado",
      icono: "usuario",
      fechaCarga: "12 sep 2026",
      estadoTexto: "Aprobado",
      archivo: "datos_personales.pdf",
      seccion: "identidad",
    },
  ];

  const docsFiscales: DocItem[] = [
    {
      id: "constancia",
      titulo: "Constancia de Situación Fiscal",
      subtitulo: "En revisión · Subido hoy",
      estado: "pendiente",
      etiquetaEstado: "Pendiente",
      icono: "constancia",
      fechaCarga: "Hoy, 09:15",
      estadoTexto: "En revisión",
      archivo: "constancia_fiscal_sat.pdf",
      seccion: "fiscal",
    },
    {
      id: "rfc",
      titulo: "Datos fiscales (RFC)",
      subtitulo: usuario.rfc ? `${usuario.rfc} · Verificado` : "MART900515ABC · Verificado",
      estado: "verificado",
      etiquetaEstado: "Verificado",
      icono: "huella",
      fechaCarga: "12 sep 2026",
      estadoTexto: "Aprobado",
      archivo: "rfc_sat.pdf",
      seccion: "fiscal",
    },
    {
      id: "facturacion",
      titulo: "Datos de facturación",
      subtitulo: "Régimen fiscal y CP configurados",
      estado: "verificado",
      etiquetaEstado: "Completado",
      icono: "empresa",
      fechaCarga: "12 sep 2026",
      estadoTexto: "Aprobado",
      archivo: "datos_facturacion.pdf",
      seccion: "fiscal",
    },
  ];

  const todosDocs = [...docsIdentidad, ...docsFiscales];
  const docsPendientes = todosDocs.filter((d) => d.estado === "pendiente" || d.estado === "faltante");
  const porcentaje = 75; // En línea con el diseño interactivo (75% con paso Identidad listo, Fiscal en curso)

  // Cerrar modal al presionar Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDocDetalle(null);
        setDocSubir(null);
        setArchivoSeleccionado(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleAbrirDetalle(doc: DocItem) {
    setArchivoSeleccionado(false);
    setMensajeExito(null);
    setDocDetalle(doc);
  }

  function handleConfirmarActualizacion() {
    setMensajeExito("Documento actualizado. Será revisado en menos de 24 horas.");
    setTimeout(() => {
      setDocDetalle(null);
      setArchivoSeleccionado(false);
      setMensajeExito(null);
    }, 2200);
  }

  function handleConfirmarSubida() {
    setMensajeExito("Documento enviado. Será revisado en menos de 24 horas.");
    setTimeout(() => {
      setDocSubir(null);
      setMensajeExito(null);
    }, 2200);
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Header con botón regresar */}
      <header className="flex items-center gap-3.5 border-b border-[#f0f4fa] bg-white px-3 py-3 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <Link
          href="/cuenta"
          aria-label="Volver a mi cuenta"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f2f6fc] text-[#0b1e33] transition-all hover:bg-[#e3ebf5] active:scale-95"
        >
          <Icono nombre="atras" className="size-4" strokeWidth={2.2} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold tracking-tight text-[#0b1e33] leading-snug">
            Verificación y documentos
          </h1>
          <p className="text-[12px] font-medium text-[#6b7c94]">
            Identidad y situación fiscal
          </p>
        </div>
      </header>

      {/* Status banner general */}
      {verificado ? (
        <div className="flex items-center gap-4 rounded-[22px] border border-[#cbe5d9] bg-gradient-to-br from-[#e9f3ee] to-[#dff0e6] p-5 shadow-[0_4px_16px_rgba(31,107,74,0.06)]">
          <div className="flex size-[52px] shrink-0 items-center justify-center rounded-[18px] bg-white text-[#1f6b4a] shadow-[0_4px_12px_rgba(31,107,74,0.12)]">
            <IconoCheckCirculo className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold tracking-tight text-[#1a4a34]">
              Cuenta verificada
            </p>
            <p className="text-[12.5px] font-medium leading-[1.4] text-[#3d7a5a]">
              Tu identidad y documentos están completos y aprobados.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 rounded-[22px] border border-[#f5dcb0] bg-gradient-to-br from-[#fef4e6] to-[#fcecd4] p-5 shadow-[0_4px_16px_rgba(179,107,30,0.06)]">
          <div className="flex size-[52px] shrink-0 items-center justify-center rounded-[18px] bg-white text-[#b36b1e] shadow-[0_4px_12px_rgba(179,107,30,0.12)]">
            <IconoReloj className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-extrabold tracking-tight text-[#7a4e15]">
              Verificación en proceso
            </p>
            <p className="text-[12.5px] font-medium leading-[1.4] text-[#8a5e25]">
              Tienes {docsPendientes.length} documento{docsPendientes.length === 1 ? "" : "s"} pendiente{docsPendientes.length === 1 ? "" : "s"} por revisar. Puedes actualizarlo en cualquier momento.
            </p>
          </div>
        </div>
      )}

      {/* Tarjeta de progreso */}
      <section aria-label="Progreso de verificación" className="rounded-[22px] border border-[#eef2f7] bg-white p-5 shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-[14px] font-bold text-[#0b1e33]">Progreso de verificación</span>
          <span className="text-[18px] font-extrabold tracking-tight text-[#0b1e33]">{porcentaje}%</span>
        </div>
        <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-[#eef2f7]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#0b1e33] to-[#2e5a88] transition-all duration-500"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-semibold">
          <span className="flex items-center gap-1.5 text-[#1f6b4a] font-bold">
            <IconoCheckCirculo className="size-3.5" /> Identidad
          </span>
          <span className="flex items-center gap-1.5 text-[#0b1e33] font-bold">
            <IconoReloj className="size-3.5" /> Fiscal
          </span>
          <span className="flex items-center gap-1.5 text-[#8b9bb0]">
            <span className="inline-block size-3 rounded-full border-2 border-[#cbd5e1]" /> Listo
          </span>
        </div>
      </section>

      {/* ============================================= */}
      {/* SECCIÓN 1: VERIFICACIÓN DE IDENTIDAD          */}
      {/* ============================================= */}
      <div>
        <p className="mb-3 px-1 text-[12px] font-bold uppercase tracking-[0.8px] text-[#8b9bb0]">
          Verificación de identidad
        </p>
        <div className="flex flex-col gap-3">
          {docsIdentidad.map((doc) => (
            <div
              key={doc.id}
              role="button"
              tabIndex={0}
              onClick={() => handleAbrirDetalle(doc)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleAbrirDetalle(doc); }}
              aria-label={`Ver detalle de ${doc.titulo}`}
              className={`flex items-center gap-3.5 rounded-[20px] border border-[#eef2f7] bg-white p-4.5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all cursor-pointer active:scale-[0.99] border-l-4 ${
                doc.estado === "verificado" ? "border-l-[#2e9e6b]" : "border-l-[#e8a23e]"
              }`}
            >
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-[16px] ${
                  doc.estado === "verificado"
                    ? "bg-[#e9f3ee] text-[#1f6b4a]"
                    : "bg-[#fef4e6] text-[#b36b1e]"
                }`}
              >
                {renderDocIcon(doc.icono)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-bold tracking-tight text-[#0b1e33] mb-1">
                  {doc.titulo}
                </p>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#8b9bb0]">
                  {doc.estado === "verificado" ? (
                    <IconoCheckCirculo className="size-3.5 text-[#1f6b4a] shrink-0" />
                  ) : (
                    <IconoReloj className="size-3.5 text-[#b36b1e] shrink-0" />
                  )}
                  <span className="truncate">{doc.subtitulo}</span>
                </div>
              </div>
              <span
                className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  doc.estado === "verificado"
                    ? "bg-[#e9f3ee] text-[#1f6b4a]"
                    : "bg-[#fef4e6] text-[#b36b1e]"
                }`}
              >
                {doc.estado === "verificado" ? (
                  <IconoCheck className="size-3" />
                ) : (
                  <IconoReloj className="size-3" />
                )}
                {doc.etiquetaEstado}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================= */}
      {/* SECCIÓN 2: INFORMACIÓN FISCAL                 */}
      {/* ============================================= */}
      <div className="mt-2">
        <p className="mb-3 px-1 text-[12px] font-bold uppercase tracking-[0.8px] text-[#8b9bb0]">
          Información fiscal
        </p>

        {/* Banner fiscal */}
        <div className="mb-3 flex items-center gap-3.5 rounded-[20px] border border-[#e0d5f0] bg-gradient-to-br from-[#f2eef9] to-[#e9e2f5] p-4.5 shadow-[0_4px_12px_rgba(94,59,140,0.04)]">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-white text-[#5e3b8c] shadow-[0_4px_10px_rgba(94,59,140,0.1)]">
            <IconoFacturaDollar className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-extrabold tracking-tight text-[#3d2566]">
              Datos para facturación
            </p>
            <p className="text-[12px] font-medium leading-[1.4] text-[#6b5296]">
              Requerido para emitir CFDI y comprobantes fiscales
            </p>
          </div>
        </div>

        {/* Tarjetas fiscales */}
        <div className="flex flex-col gap-3">
          {docsFiscales.map((doc) => (
            <div
              key={doc.id}
              role="button"
              tabIndex={0}
              onClick={() => handleAbrirDetalle(doc)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleAbrirDetalle(doc); }}
              aria-label={`Ver detalle de ${doc.titulo}`}
              className={`flex items-center gap-3.5 rounded-[20px] border border-[#eef2f7] bg-white p-4.5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all cursor-pointer active:scale-[0.99] border-l-4 ${
                doc.estado === "verificado" ? "border-l-[#2e9e6b]" : "border-l-[#e8a23e]"
              }`}
            >
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-[16px] ${
                  doc.estado === "verificado"
                    ? "bg-[#e9f3ee] text-[#1f6b4a]"
                    : "bg-[#fef4e6] text-[#b36b1e]"
                }`}
              >
                {renderDocIcon(doc.icono)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-bold tracking-tight text-[#0b1e33] mb-1">
                  {doc.titulo}
                </p>
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#8b9bb0]">
                  {doc.estado === "verificado" ? (
                    <IconoCheckCirculo className="size-3.5 text-[#1f6b4a] shrink-0" />
                  ) : (
                    <IconoReloj className="size-3.5 text-[#b36b1e] shrink-0" />
                  )}
                  <span className="truncate">{doc.subtitulo}</span>
                </div>
              </div>
              <span
                className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  doc.estado === "verificado"
                    ? "bg-[#e9f3ee] text-[#1f6b4a]"
                    : "bg-[#fef4e6] text-[#b36b1e]"
                }`}
              >
                {doc.estado === "verificado" ? (
                  <IconoCheck className="size-3" />
                ) : (
                  <IconoReloj className="size-3" />
                )}
                {doc.etiquetaEstado}
              </span>
            </div>
          ))}
        </div>

        {/* Nota informativa */}
        <div className="mt-3 flex items-start gap-3 rounded-[16px] border border-[#dfe8f3] bg-[#f0f5fe] p-4">
          <IconoInfo className="size-5 shrink-0 text-[#2e5a88] mt-0.5" />
          <p className="text-[12.5px] font-medium leading-[1.5] text-[#3d5470]">
            La Constancia de Situación Fiscal es necesaria para emitir facturas (CFDI) por tus traslados. Puedes descargarla desde el portal del SAT.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: DETALLE / ACTUALIZAR DOCUMENTO                       */}
      {/* ============================================================ */}
      {docDetalle && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="detalle-titulo"
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(11,30,51,0.5)] backdrop-blur-sm transition-opacity"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDocDetalle(null);
              setArchivoSeleccionado(false);
            }
          }}
        >
          <div
            className="w-full max-w-[430px] rounded-t-[28px] bg-white p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Manija */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#dde5ef]" />

            {/* Icono grande */}
            <div
              className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-[22px] ${
                docDetalle.estado === "verificado"
                  ? "bg-[#e9f3ee] text-[#1f6b4a]"
                  : "bg-[#fef4e6] text-[#b36b1e]"
              }`}
            >
              {renderDocIcon(docDetalle.icono, "size-8")}
            </div>

            <h2 id="detalle-titulo" className="mb-2 text-center text-[18px] font-extrabold tracking-tight text-[#0b1e33]">
              {docDetalle.titulo}
            </h2>

            <p className="mb-5 text-center text-[13.5px] font-medium leading-relaxed text-[#6b7c94]">
              {docDetalle.estado === "verificado"
                ? "Este documento ya fue verificado correctamente. Puedes actualizarlo si es necesario."
                : "Este documento está en revisión. Puedes actualizarlo mientras tanto."}
            </p>

            {/* Preview del documento actual */}
            <div className="mb-4 rounded-[18px] border border-[#eef2f7] bg-[#f8fafd] p-4.5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#0b1e33]">Documento actual</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    docDetalle.estado === "verificado"
                      ? "bg-[#e9f3ee] text-[#1f6b4a]"
                      : "bg-[#fef4e6] text-[#b36b1e]"
                  }`}
                >
                  {docDetalle.etiquetaEstado}
                </span>
              </div>
              <div className="flex flex-col gap-2 text-[12.5px]">
                <div className="flex justify-between">
                  <span className="font-medium text-[#8b9bb0]">Fecha de carga</span>
                  <span className="font-semibold text-[#1a293b]">{docDetalle.fechaCarga}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#8b9bb0]">Estado</span>
                  <span className="font-semibold text-[#1a293b]">{docDetalle.estadoTexto}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#8b9bb0]">Archivo</span>
                  <span className="font-semibold text-[#1a293b] truncate max-w-[200px]">
                    {archivoSeleccionado ? "documento_actualizado.pdf" : docDetalle.archivo}
                  </span>
                </div>
              </div>
            </div>

            {/* Área de carga interactiva */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setArchivoSeleccionado(!archivoSeleccionado)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setArchivoSeleccionado(!archivoSeleccionado); }}
              className={`mb-4 flex cursor-pointer flex-col items-center gap-2 rounded-[20px] border-2 border-dashed p-6 transition-all ${
                archivoSeleccionado
                  ? "border-[#2e9e6b] bg-[#f0f9f4]"
                  : "border-[#cbd7e6] bg-[#f8fbfe] hover:border-[#2e5a88]"
              }`}
            >
              {archivoSeleccionado ? (
                <>
                  <IconoCheckCirculo className="size-8 text-[#2e9e6b]" />
                  <span className="text-[13.5px] font-bold text-[#1f6b4a]">✓ Archivo seleccionado</span>
                  <span className="text-[11.5px] font-medium text-[#3d7a5a]">documento_actualizado.pdf</span>
                </>
              ) : (
                <>
                  <IconoNubeSubir className="size-8 text-[#a6b7cb]" />
                  <span className="text-[13.5px] font-semibold text-[#2e5a88]">Actualizar documento</span>
                  <span className="text-[11.5px] font-medium text-[#8b9bb0]">Toca para reemplazar con un archivo más reciente</span>
                </>
              )}
            </div>

            {/* Botón principal */}
            <button
              type="button"
              onClick={handleConfirmarActualizacion}
              className="mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#0b1e33] py-3.5 px-5 text-[15px] font-bold text-white shadow-[0_10px_22px_-8px_rgba(11,30,51,0.4)] transition-all active:scale-[0.98]"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
              Confirmar actualización
            </button>

            {/* Botón cerrar */}
            <button
              type="button"
              onClick={() => {
                setDocDetalle(null);
                setArchivoSeleccionado(false);
              }}
              className="w-full cursor-pointer rounded-[16px] bg-transparent py-3 text-center text-[14px] font-bold text-[#6b7c94] transition-colors hover:text-[#0b1e33]"
            >
              Cerrar
            </button>

            {/* Mensaje de éxito animado */}
            {mensajeExito && (
              <div
                role="status"
                aria-live="polite"
                className="mt-3 flex items-center gap-2.5 rounded-[14px] border border-[#cbe5d9] bg-[#e9f3ee] p-3.5 text-[13px] font-semibold text-[#1f6b4a]"
              >
                <IconoCheckCirculo className="size-4 shrink-0" />
                <span>{mensajeExito}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SUBIR NUEVO DOCUMENTO (opcional / faltante)            */}
      {/* ============================================================ */}
      {docSubir && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="subir-titulo"
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(11,30,51,0.5)] backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDocSubir(null);
          }}
        >
          <div
            className="w-full max-w-[430px] rounded-t-[28px] bg-white p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#dde5ef]" />
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-[22px] bg-[#f0f5fe] text-[#2e5a88]">
              <IconoNubeSubir className="size-8" />
            </div>
            <h2 id="subir-titulo" className="mb-2 text-center text-[18px] font-extrabold tracking-tight text-[#0b1e33]">
              Subir: {docSubir.titulo}
            </h2>
            <p className="mb-5 text-center text-[13.5px] font-medium leading-relaxed text-[#6b7c94]">
              Asegúrate de que la foto sea clara y que todos los datos sean legibles. La verificación toma menos de 24 horas.
            </p>

            <div className="mb-4 flex cursor-pointer flex-col items-center gap-2 rounded-[20px] border-2 border-dashed border-[#cbd7e6] bg-[#f8fbfe] p-6 transition-all hover:border-[#2e5a88]">
              <IconoCamara className="size-8 text-[#a6b7cb]" />
              <span className="text-[13.5px] font-semibold text-[#2e5a88]">Tomar foto o seleccionar archivo</span>
              <span className="text-[11.5px] font-medium text-[#8b9bb0]">JPG, PNG o PDF · Máx. 10 MB</span>
            </div>

            <button
              type="button"
              onClick={handleConfirmarSubida}
              className="mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#0b1e33] py-3.5 px-5 text-[15px] font-bold text-white shadow-[0_10px_22px_-8px_rgba(11,30,51,0.4)] transition-all active:scale-[0.98]"
            >
              <IconoCheckCirculo className="size-4" />
              Confirmar y enviar
            </button>
            <button
              type="button"
              onClick={() => setDocSubir(null)}
              className="w-full cursor-pointer rounded-[16px] bg-transparent py-3 text-center text-[14px] font-bold text-[#6b7c94] transition-colors hover:text-[#0b1e33]"
            >
              Cancelar
            </button>

            {mensajeExito && (
              <div
                role="status"
                aria-live="polite"
                className="mt-3 flex items-center gap-2.5 rounded-[14px] border border-[#cbe5d9] bg-[#e9f3ee] p-3.5 text-[13px] font-semibold text-[#1f6b4a]"
              >
                <IconoCheckCirculo className="size-4 shrink-0" />
                <span>{mensajeExito}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
