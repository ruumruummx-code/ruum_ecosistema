"use client";

import { useEffect, useRef } from "react";
import { Aviso, useDialogAccesible } from "@ruum/ui";
import { esOrigenDiditValido, interpretarMensajeDidit } from "../../lib/didit";

interface Props {
  isOpen: boolean;
  url: string | null;
  cargando: boolean;
  error: string | null;
  onCerrar: () => void;
  onReintentar: () => void;
  onFinalizar: () => void;
}

function esUrlDiditValida(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) return false;
  try {
    const parsed = new URL(trimmed);
    return (
      parsed.hostname === "verify.didit.me" ||
      parsed.hostname.endsWith(".didit.me") ||
      parsed.hostname === "didit.me"
    );
  } catch {
    return false;
  }
}

export function DiditVerificationModal({
  isOpen,
  url,
  cargando,
  error,
  onCerrar,
  onReintentar,
  onFinalizar,
}: Props) {
  const cerrarBtnRef = useRef<HTMLButtonElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Deuda (auditoría): showModal + trampa + restauración + cierre vive en
  // `useDialogAccesible` (@ruum/ui). Aquí quedan backdrop-click y mensajes.
  const dialogRef = useDialogAccesible({ abierto: isOpen, focoInicial: cerrarBtnRef, alCancelar: onCerrar });

  // Clic en backdrop (área fuera del .max-w-xl) cierra — UX esperado.
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const alBackdrop = (e: MouseEvent) => {
      if (e.target === dialog) onCerrar();
    };
    dialog.addEventListener("click", alBackdrop);
    return () => dialog.removeEventListener("click", alBackdrop);
  }, [isOpen, onCerrar, dialogRef]);

  useEffect(() => {
    if (!isOpen) return;
    const handleMessage = (event: MessageEvent) => {
      if (!esOrigenDiditValido(event.origin)) return;
      // V-1: defensa en profundidad — el intérprete también valida el origen.
      const mensaje = interpretarMensajeDidit(event.data, event.origin);
      if (!mensaje) return;
      if (mensaje.tipo === "cancelado") onCerrar();
      else onFinalizar();
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOpen, onCerrar, onFinalizar]);

  if (!isOpen) return null;

  const urlValida = esUrlDiditValida(url);

  const abrirEnNuevaVentana = () => {
    if (urlValida && url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 flex h-[100dvh] w-[100vw] max-h-none max-w-none items-center justify-center border-0 bg-black/80 px-4 py-6 backdrop-blur-xs sm:py-10 open:flex"
      aria-modal="true"
      aria-labelledby="titulo-didit-usuario"
      aria-describedby="didit-desc didit-permisos-nota"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-[#1a3a5c] bg-[#0a2342] shadow-2xl flex flex-col max-h-[92vh] text-white">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-[#1a3a5c] px-5 py-4 shrink-0 bg-[#071930]">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400" aria-hidden="true">
              <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M7 7h10M7 12h10M7 17h6" />
              </svg>
            </span>
            <h2 id="titulo-didit-usuario" className="text-base sm:text-lg font-bold text-white tracking-tight">
              Verificación de identidad oficial
            </h2>
          </div>
          <button
            ref={cerrarBtnRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar verificación"
            className="flex size-9 items-center justify-center rounded-full text-gray-400 hover:bg-[#162c47] hover:text-white transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            ✕
          </button>
        </div>

        {/* R4: descripciones para aria-describedby + aviso previo de permisos sensible — C-05: nota visible antes de conceder */}
        <p id="didit-desc" className="sr-only">
          Modal de verificación externa de identidad con Didit. Usa Tab y Shift+Tab para navegar entre controles y Esc para cerrar en cualquier momento.
        </p>
        <p id="didit-permisos-nota" className="sr-only">
          El siguiente iframe es de verify.didit.me y solicitará permiso de cámara, micrófono y ubicación para la prueba de vida. Puedes permitir o denegar desde el diálogo del navegador.
        </p>

        {/* Contenido según estado */}
        {cargando ? (
          <div className="p-10 text-center" role="status" aria-live="polite">
            <div
              className="mx-auto flex size-14 items-center justify-center rounded-full bg-sky-500/15 text-sky-400"
              aria-hidden="true"
            >
              <svg className="size-7 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
            <p className="mt-4 text-base font-bold text-white">
              Procesando verificación de identidad…
            </p>
            <p className="mt-1.5 text-xs text-[#a8b5cc] max-w-sm mx-auto leading-relaxed">
              Conectando con el servicio seguro y encriptado de Didit. Puedes cerrar con Esc en cualquier momento sin perder tu solicitud: podrás reintentar.
            </p>
          </div>
        ) : error ? (
          <div className="p-6">
            <Aviso tono="danger">{error}</Aviso>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onCerrar}
                className="w-full rounded-2xl border border-[#1a3a5c] bg-[#071930] py-3 text-sm font-semibold text-white hover:bg-[#162c47] transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={onReintentar}
                disabled={cargando}
                className="w-full rounded-2xl bg-sky-500 py-3 text-sm font-bold text-[#0a2342] hover:bg-sky-400 transition cursor-pointer"
              >
                Reintentar verificación
              </button>
            </div>
          </div>
        ) : urlValida && url ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between gap-2 bg-[#071930] px-4 py-2.5 border-b border-[#1a3a5c] text-xs">
              <span className="text-[#a8b5cc] truncate">
                Prueba biométrica y validación oficial en tiempo real
              </span>
              <button
                type="button"
                onClick={abrirEnNuevaVentana}
                className="shrink-0 font-bold text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer transition"
              >
                Abrir en nueva ventana ↗
              </button>
            </div>
            <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-[11.5px] leading-4 text-amber-200" role="note" aria-live="polite">
              Antes de continuar, Didit solicitará acceso a <strong>cámara</strong>, <strong>micrófono</strong> y <strong>ubicación</strong> para la prueba de vida. Solo se usan para esta verificación y puedes revocar el permiso desde el diálogo del navegador. Ningún dato biométrico se comparte con conductores.
            </div>
            <div className="relative h-[min(460px,60dvh)] sm:h-[min(520px,62dvh)] w-full bg-black/50">
              <iframe
                ref={iframeRef}
                src={url}
                className="w-full h-full border-0"
                title="Verificación de identidad Didit — iframe externo verify.didit.me"
                allow="camera; microphone; geolocation"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                referrerPolicy="strict-origin"
                loading="lazy"
                aria-describedby="didit-permisos-nota"
              />
            </div>
            <div className="p-4 bg-[#071930] border-t border-[#1a3a5c] flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-[#a8b5cc] text-center sm:text-left leading-relaxed">
                Tu cuenta se actualizará automáticamente al completar la prueba. Si abriste en nueva ventana, vuelve aquí y pulsa el botón.
              </p>
              <button
                type="button"
                onClick={onFinalizar}
                disabled={cargando}
                className="w-full sm:w-auto shrink-0 rounded-2xl bg-sky-500 px-5 py-2.5 text-xs font-bold text-[#0a2342] hover:bg-sky-400 transition cursor-pointer"
              >
                Ya completé la verificación
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Aviso tono="atencion">No se recibió una URL válida de verificación de Didit.</Aviso>
            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={onCerrar}
                className="rounded-2xl border border-[#1a3a5c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#162c47] transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={onReintentar}
                className="rounded-2xl bg-sky-500 px-5 py-2.5 text-sm font-bold text-[#0a2342] hover:bg-sky-400 transition cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
