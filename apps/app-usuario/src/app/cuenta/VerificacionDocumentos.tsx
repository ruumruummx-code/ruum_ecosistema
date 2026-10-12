"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, Icono, SENDAS_ICONO } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import { iniciales } from "./cuenta-utils";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

type EstadoDoc = "verificado" | "pendiente" | "vencido" | "faltante";

interface DocItem {
  id: string;
  titulo: string;
  descripcion: string;
  estado: EstadoDoc;
  icono: string;
  fecha?: string;
}

const ESTADO_DOC_LABEL: Record<EstadoDoc, string> = {
  verificado: "Verificado",
  pendiente: "Pendiente",
  vencido: "Vencido",
  faltante: "Faltante",
};

const ESTADO_DOC_COLOR: Record<EstadoDoc, string> = {
  verificado: "bg-[#e9f3ee] text-[#1f6b4a]",
  pendiente: "bg-[#fef4e6] text-[#b36b1e]",
  vencido: "bg-[#fdeaea] text-[#b33c3c]",
  faltante: "bg-[#f2f6fb] text-[#8b9bb0]",
};

const ESTADO_DOC_ICON_BG: Record<EstadoDoc, string> = {
  verificado: "bg-[#e9f3ee] text-[#1f6b4a]",
  pendiente: "bg-[#fef4e6] text-[#b36b1e]",
  vencido: "bg-[#fdeaea] text-[#b33c3c]",
  faltante: "bg-[#f2f6fb] text-[#a6b7cb]",
};

const ESTADO_DOC_BORDER: Record<EstadoDoc, string> = {
  verificado: "border-l-[#2e9e6b]",
  pendiente: "border-l-[#e8a23e]",
  vencido: "border-l-[#e84a3e]",
  faltante: "border-l-[#cbd5e1]",
};

function TarjetaDoc({
  doc,
  onVerDetalle,
  onSubir,
}: {
  doc: DocItem;
  onVerDetalle: (doc: DocItem) => void;
  onSubir: (doc: DocItem) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3.5 rounded-[20px] border border-[#eef2f7] border-l-4 ${ESTADO_DOC_BORDER[doc.estado]} bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.99]`}
    >
      <button
        type="button"
        onClick={() => onVerDetalle(doc)}
        className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
        aria-label={`Ver detalle de ${doc.titulo}`}
      >
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${ESTADO_DOC_ICON_BG[doc.estado]}`}>
          <Icono d={doc.icono} className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-bold tracking-tight text-[#0b1e33]">{doc.titulo}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-[#8b9bb0]">
            {doc.estado === "verificado" && <Icono d="M20 6L9 17l-5-5" className="size-3 text-[#1f6b4a]" />}
            {doc.estado === "pendiente" && <Icono d="M12 6v6l4 2" className="size-3 text-[#b36b1e]" />}
            {doc.estado === "vencido" && <Icono d="M12 8v5m0 4h.01" className="size-3 text-[#b33c3c]" />}
            {doc.estado === "faltante" && <Icono d="M12 8v5m0 4h.01" className="size-3 text-[#a6b7cb]" />}
            <span className="truncate">{doc.descripcion}</span>
          </span>
        </span>
      </button>
      <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${ESTADO_DOC_COLOR[doc.estado]}`}>
        {doc.estado === "verificado" && <Icono d="M20 6L9 17l-5-5" className="size-3" />}
        {doc.estado === "pendiente" && <Icono d="M12 6v6l4 2" className="size-3" />}
        {doc.estado === "vencido" && <Icono d="M12 8v5m0 4h.01" className="size-3" />}
        {doc.estado === "faltante" && <Icono d="M12 8v5m0 4h.01" className="size-3" />}
        {ESTADO_DOC_LABEL[doc.estado]}
      </span>
      {doc.estado === "faltante" && (
        <Button
          type="button"
          onClick={() => onSubir(doc)}
          className="shrink-0 rounded-full px-3.5 py-2 text-[11px] font-bold"
        >
          Subir
        </Button>
      )}
    </div>
  );
}

function BarraProgreso({ porcentaje, pasos }: { porcentaje: number; pasos: { label: string; estado: "done" | "current" | "pending" }[] }) {
  return (
    <div className="mb-5 rounded-[22px] border border-[#eef2f7] bg-white p-5 shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
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
      <div className="flex justify-between">
        {pasos.map((p) => (
          <span
            key={p.label}
            className={[
              "flex items-center gap-1 text-[11px] font-semibold",
              p.estado === "done" && "text-[#1f6b4a]",
              p.estado === "current" && "font-bold text-[#0b1e33]",
              p.estado === "pending" && "text-[#8b9bb0]",
            ].join(" ")}
          >
            {p.estado === "done" && <Icono d="M20 6L9 17l-5-5" className="size-3" />}
            {p.estado === "current" && <Icono d="M12 6v6l4 2" className="size-3" />}
            {p.estado === "pending" && <span className="size-3 rounded-full border-2 border-[#cbd5e1]" />}
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function BannerEstado({ estado, docsPendientes }: { estado: "verificado" | "pendiente" | "en_revision"; docsPendientes: number }) {
  const config = {
    verificado: {
      bg: "bg-gradient-to-br from-[#e9f3ee] to-[#dff0e6]",
      border: "border-[#cbe5d9]",
      iconBg: "bg-white text-[#1f6b4a]",
      icon: "M20 6L9 17l-5-5",
      title: "Cuenta verificada",
      titleColor: "text-[#1a4a34]",
      sub: "Tu identidad y documentos están completos y aprobados.",
      subColor: "text-[#3d7a5a]",
    },
    pendiente: {
      bg: "bg-gradient-to-br from-[#fef4e6] to-[#fcecd4]",
      border: "border-[#f5dcb0]",
      iconBg: "bg-white text-[#b36b1e]",
      icon: "M12 6v6l4 2",
      title: "Verificación pendiente",
      titleColor: "text-[#7a4e15]",
      sub: `Tienes ${docsPendientes} documento${docsPendientes === 1 ? "" : "s"} pendiente${docsPendientes === 1 ? "" : "s"} por revisar.`,
      subColor: "text-[#8a5e25]",
    },
    en_revision: {
      bg: "bg-gradient-to-br from-[#fef4e6] to-[#fcecd4]",
      border: "border-[#f5dcb0]",
      iconBg: "bg-white text-[#b36b1e]",
      icon: "M12 6v6l4 2",
      title: "Verificación en proceso",
      titleColor: "text-[#7a4e15]",
      sub: "Tus documentos están siendo revisados. Puedes actualizarlos en cualquier momento.",
      subColor: "text-[#8a5e25]",
    },
  }[estado];

  return (
    <div className={`mb-5 flex items-center gap-4 rounded-[22px] border ${config.border} ${config.bg} p-5`}>
      <span className={`flex size-[52px] shrink-0 items-center justify-center rounded-2xl ${config.iconBg} shadow-[0_4px_12px_rgba(0,0,0,0.08)]`}>
        <Icono d={config.icon} className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-[15px] font-extrabold tracking-tight ${config.titleColor}`}>{config.title}</p>
        <p className={`mt-0.5 text-[12.5px] font-medium leading-snug ${config.subColor}`}>{config.sub}</p>
      </div>
    </div>
  );
}

function BannerFiscal() {
  return (
    <div className="mb-5 flex items-center gap-3.5 rounded-[20px] border border-[#e0d5f0] bg-gradient-to-br from-[#f2eef9] to-[#e9e2f5] p-4.5">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5e3b8c] shadow-[0_4px_10px_rgba(94,59,140,0.1)]">
        <Icono d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M16 13H8 M16 17H8" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-extrabold tracking-tight text-[#3d2566]">Datos para facturación</p>
        <p className="mt-0.5 text-[12px] font-medium leading-snug text-[#6b5296]">
          Requerido para emitir CFDI y comprobantes fiscales
        </p>
      </div>
    </div>
  );
}

function ModalDetalle({
  doc,
  onClose,
  onActualizar,
}: {
  doc: DocItem | null;
  onClose: () => void;
  onActualizar: (doc: DocItem) => void;
}) {
  if (!doc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(11,30,51,0.5)] backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${doc.titulo}`}
    >
      <div className="max-h-[85vh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-white p-6 pb-8">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#dde5ef]" />
        <div className="mb-4 flex justify-center">
          <span className={`flex size-16 items-center justify-center rounded-[22px] ${ESTADO_DOC_ICON_BG[doc.estado]}`}>
            <Icono d={doc.icono} className="size-7" />
          </span>
        </div>
        <h3 className="mb-2 text-center text-[18px] font-extrabold tracking-tight text-[#0b1e33]">{doc.titulo}</h3>
        <p className="mb-5 text-center text-[13.5px] font-medium leading-relaxed text-[#6b7c94]">
          {doc.estado === "verificado" && "Este documento ya fue verificado correctamente. Puedes actualizarlo si es necesario."}
          {doc.estado === "pendiente" && "Este documento está en revisión. Puedes actualizarlo mientras tanto."}
          {doc.estado === "vencido" && "Este documento ha vencido. Sube una versión actualizada."}
          {doc.estado === "faltante" && "Aún no has subido este documento."}
        </p>

        <div className="mb-4 rounded-[18px] border border-[#eef2f7] bg-[#f8fafd] p-4.5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#0b1e33]">Documento actual</span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${ESTADO_DOC_COLOR[doc.estado]}`}>
              {ESTADO_DOC_LABEL[doc.estado]}
            </span>
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between text-[12.5px]">
              <span className="font-medium text-[#8b9bb0]">Fecha de carga</span>
              <span className="font-semibold text-[#1a293b]">{doc.fecha ?? "—"}</span>
            </div>
            <div className="flex justify-between text-[12.5px]">
              <span className="font-medium text-[#8b9bb0]">Estado</span>
              <span className="font-semibold text-[#1a293b]">{ESTADO_DOC_LABEL[doc.estado]}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onActualizar(doc)}
          className="mb-3 flex w-full cursor-pointer flex-col items-center gap-2 rounded-[20px] border-2 border-dashed border-[#cbd7e6] bg-[#f8fbfe] p-6 transition-colors active:border-[#2e5a88] active:bg-[#f0f5fe]"
        >
          <Icono d="M7 16a4 4 0 0 1-.88-7.9A5 5 0 1 1 15.9 6h.1a5 5 0 0 1 1 9.9M12 12v9m0-9-3.5 3.5M12 12l3.5 3.5" className="size-7 text-[#a6b7cb]" />
          <span className="text-[13.5px] font-semibold text-[#2e5a88]">Actualizar documento</span>
          <span className="text-[11.5px] font-medium text-[#8b9bb0]">Toca para reemplazar con un archivo más reciente</span>
        </button>

        <Button type="button" onClick={() => onActualizar(doc)} className="mb-2 w-full">
          <Icono d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" className="size-4" />
          Confirmar actualización
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} className="w-full">
          Cerrar
        </Button>
      </div>
    </div>
  );
}

function ModalSubir({
  doc,
  onClose,
  onConfirmar,
}: {
  doc: DocItem | null;
  onClose: () => void;
  onConfirmar: (doc: DocItem) => void;
}) {
  if (!doc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(11,30,51,0.5)] backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Subir ${doc.titulo}`}
    >
      <div className="max-h-[85vh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] bg-white p-6 pb-8">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#dde5ef]" />
        <div className="mb-4 flex justify-center">
          <span className={`flex size-16 items-center justify-center rounded-[22px] ${ESTADO_DOC_ICON_BG[doc.estado]}`}>
            <Icono d="M7 16a4 4 0 0 1-.88-7.9A5 5 0 1 1 15.9 6h.1a5 5 0 0 1 1 9.9M12 12v9m0-9-3.5 3.5M12 12l3.5 3.5" className="size-7" />
          </span>
        </div>
        <h3 className="mb-2 text-center text-[18px] font-extrabold tracking-tight text-[#0b1e33]">Subir: {doc.titulo}</h3>
        <p className="mb-5 text-center text-[13.5px] font-medium leading-relaxed text-[#6b7c94]">
          Asegúrate de que la foto sea clara y que todos los datos sean legibles. La verificación toma menos de 24 horas.
        </p>

        <button
          type="button"
          className="mb-4 flex w-full cursor-pointer flex-col items-center gap-2 rounded-[20px] border-2 border-dashed border-[#cbd7e6] bg-[#f8fbfe] p-6 transition-colors active:border-[#2e5a88] active:bg-[#f0f5fe]"
        >
          <Icono d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z M12 16.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" className="size-7 text-[#a6b7cb]" />
          <span className="text-[13.5px] font-semibold text-[#2e5a88]">Tomar foto o seleccionar archivo</span>
          <span className="text-[11.5px] font-medium text-[#8b9bb0]">JPG, PNG o PDF · Máx. 10 MB</span>
        </button>

        <Button type="button" onClick={() => onConfirmar(doc)} className="mb-2 w-full">
          <Icono d="M20 6L9 17l-5-5" className="size-4" />
          Confirmar y enviar
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} className="w-full">
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function VerificacionDocumentos({ usuario, fotoUrl }: { usuario: Usuario; fotoUrl?: string | null }) {
  const [docDetalle, setDocDetalle] = useState<DocItem | null>(null);
  const [docSubir, setDocSubir] = useState<DocItem | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const verificado = usuario.estado_verificacion === "verificado";
  const enRevision = usuario.estado_verificacion === "en_revision";

  // Documentos de identidad
  const docsIdentidad: DocItem[] = [
    {
      id: "ine",
      titulo: "Identificación oficial (INE)",
      descripcion: verificado ? "Verificado · 12 sep 2026" : "En revisión · Actualizado hoy",
      estado: verificado ? "verificado" : "pendiente",
      icono: "M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",
      fecha: "12 sep 2026",
    },
    {
      id: "comprobante",
      titulo: "Comprobante de domicilio",
      descripcion: "En revisión · Actualizado hoy",
      estado: "pendiente",
      icono: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M16 13H8 M16 17H8",
      fecha: "Hoy",
    },
    {
      id: "datos-personales",
      titulo: "Datos personales",
      descripcion: "Nombre, correo y teléfono",
      estado: "verificado",
      icono: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
      fecha: "12 sep 2026",
    },
  ];

  // Documentos fiscales
  const docsFiscales: DocItem[] = [
    {
      id: "constancia",
      titulo: "Constancia de Situación Fiscal",
      descripcion: "En revisión · Subido hoy",
      estado: "pendiente",
      icono: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M16 13H8 M16 17H8",
      fecha: "Hoy",
    },
    {
      id: "rfc",
      titulo: "Datos fiscales (RFC)",
      descripcion: usuario.rfc ? `${usuario.rfc} · Verificado` : "Pendiente de capturar",
      estado: usuario.rfc ? "verificado" : "faltante",
      icono: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z M22 6 12 13 2 6",
      fecha: "12 sep 2026",
    },
    {
      id: "facturacion",
      titulo: "Datos de facturación",
      descripcion: usuario.regimen_fiscal ? "Régimen fiscal y CP configurados" : "Pendiente de configurar",
      estado: usuario.regimen_fiscal ? "verificado" : "faltante",
      icono: "M3 21h18 M5 21V7l7-4 7 4v14 M9 21v-4h6v4 M9 10h.01 M15 10h.01 M9 14h.01 M15 14h.01",
      fecha: "12 sep 2026",
    },
  ];

  const todosDocs = [...docsIdentidad, ...docsFiscales];
  const docsPendientes = todosDocs.filter((d) => d.estado === "pendiente" || d.estado === "faltante" || d.estado === "vencido").length;
  const porcentaje = Math.round(((todosDocs.length - docsPendientes) / todosDocs.length) * 100);

  function handleActualizar(doc: DocItem) {
    setDocDetalle(null);
    setDocSubir(doc);
  }

  function handleConfirmarSubida(doc: DocItem) {
    setDocSubir(null);
    setMensaje(`Documento "${doc.titulo}" enviado. Será revisado en menos de 24 horas.`);
    setTimeout(() => setMensaje(null), 4000);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Banner de estado */}
      <BannerEstado
        estado={verificado ? "verificado" : enRevision ? "en_revision" : "pendiente"}
        docsPendientes={docsPendientes}
      />

      {/* Barra de progreso */}
      <BarraProgreso
        porcentaje={porcentaje}
        pasos={[
          { label: "Identidad", estado: verificado ? "done" : "current" },
          { label: "Fiscal", estado: verificado ? "done" : "pending" },
          { label: "Listo", estado: verificado ? "done" : "pending" },
        ]}
      />

      {/* Verificación de identidad */}
      <div>
        <p className="mb-3 px-1 text-[12px] font-bold uppercase tracking-[0.8px] text-[#8b9bb0]">
          Verificación de identidad
        </p>
        <div className="grid gap-3">
          {docsIdentidad.map((doc) => (
            <TarjetaDoc
              key={doc.id}
              doc={doc}
              onVerDetalle={setDocDetalle}
              onSubir={setDocSubir}
            />
          ))}
        </div>
      </div>

      {/* Información fiscal */}
      <div className="mt-2">
        <p className="mb-3 px-1 text-[12px] font-bold uppercase tracking-[0.8px] text-[#8b9bb0]">
          Información fiscal
        </p>
        <BannerFiscal />
        <div className="grid gap-3">
          {docsFiscales.map((doc) => (
            <TarjetaDoc
              key={doc.id}
              doc={doc}
              onVerDetalle={setDocDetalle}
              onSubir={setDocSubir}
            />
          ))}
        </div>
      </div>

      {/* Nota informativa */}
      <div className="mt-2 flex items-start gap-3 rounded-[16px] border border-[#dfe8f3] bg-[#f0f5fe] p-4">
        <Icono d="M12 16v-4m0-4h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" className="size-4 shrink-0 text-[#2e5a88]" />
        <p className="text-[12.5px] font-medium leading-relaxed text-[#3d5470]">
          La Constancia de Situación Fiscal es necesaria para emitir facturas (CFDI) por tus traslados. Puedes descargarla desde el portal del SAT.
        </p>
      </div>

      {/* Mensaje de éxito */}
      {mensaje && (
        <div role="status" aria-live="polite" className="flex items-center gap-2.5 rounded-[14px] border border-[#cbe5d9] bg-[#e9f3ee] p-3.5 text-[13px] font-semibold text-[#1f6b4a]">
          <Icono d="M20 6L9 17l-5-5" className="size-4" />
          {mensaje}
        </div>
      )}

      {/* Modales */}
      <ModalDetalle
        doc={docDetalle}
        onClose={() => setDocDetalle(null)}
        onActualizar={handleActualizar}
      />
      <ModalSubir
        doc={docSubir}
        onClose={() => setDocSubir(null)}
        onConfirmar={handleConfirmarSubida}
      />
    </div>
  );
}
