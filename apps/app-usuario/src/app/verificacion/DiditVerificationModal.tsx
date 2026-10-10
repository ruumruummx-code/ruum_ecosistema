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
      // Aceptar mensajes de Didit vengan del iframe o de una ventana nueva:
      // el origen ya está validado y el payload se interpreta de forma segura.
      // (Antes se exigía event.source === iframe, lo que rompía "Abrir en nueva ventana".)
      const mensaje = interpretarMensajeDidit(event.data);
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
      className="user-v2-scope user-v2-secondary-screen fixed inset-0 z-50 m-0 flex h-[100dvh] w-[100vw] max-h-none max-w-none items-center justify-center border-0 bg-black/75 px-4 py-6 backdrop-blur-xs sm:py-10 open:flex"
      aria-modal="true"
      aria-labelledby="titulo-didit-usuario"
      aria-describedby="didit-desc didit-permisos-nota"
    >
      <div className="user-v2-modal w-full max-w-xl overflow-hidden rounded-2xl border border-[#334155] bg-[#1E293B] shadow-2xl flex flex-col max-h-[92vh] text-white">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-[#334155] p-4 shrink-0 bg-[#0F172A]">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" aria-hidden="true">🪪</span>
            <h2 id="titulo-didit-usuario" className="font-display text-base sm:text-lg font-bold text-white">
              Verificación de identidad oficial
            </h2>
          </div>
          <button
            ref={cerrarBtnRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar verificación"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-[#334155] hover:text-white transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFC400] focus-visible:outline-offset-2"
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
              className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#FFC400]/15 text-2xl font-bold text-[#FFC400] animate-spin"
              aria-hidden
            >
              ⟳
            </div>
            <p className="mt-4 font-display text-base font-semibold text-white">
              Procesando verificación de identidad…
            </p>
            <p className="mt-1 font-body text-xs text-[#94A3B8]">
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
                className="user-v2-modal-secondary w-full rounded-xl border border-[#475569] bg-transparent py-3 font-display text-sm font-semibold text-white hover:bg-[#334155] transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={onReintentar}
                disabled={cargando}
                className="user-v2-modal-primary w-full rounded-xl bg-[#FFC400] py-3 font-display text-sm font-bold text-[#151515] hover:bg-[#e0ac00] transition cursor-pointer"
              >
                Reintentar verificación
              </button>
            </div>
          </div>
        ) : urlValida && url ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between gap-2 bg-[#0F172A] px-4 py-2 border-b border-[#334155] text-xs">
              <span className="text-[#94A3B8] truncate">
                Prueba biométrica y validación oficial en tiempo real
              </span>
              <button
                type="button"
                onClick={abrirEnNuevaVentana}
                className="shrink-0 font-display font-bold text-[#FFC400] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Abrir en nueva ventana ↗
              </button>
            </div>
            <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[11px] leading-4 text-amber-200" role="note" aria-live="polite">
              Antes de continuar, Didit solicitará acceso a <strong>cámara</strong>, <strong>micrófono</strong> y <strong>ubicación</strong> para la prueba de vida. Solo se usan para esta verificación y puedes revocar el permiso desde el diálogo del navegador. Ningún dato biométrico se comparte con conductores.
            </div>
            <div className="relative h-[min(460px,60dvh)] sm:h-[min(520px,62dvh)] w-full bg-black/40">
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
            <div className="p-4 bg-[#0F172A] border-t border-[#334155] flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-[#94A3B8] text-center sm:text-left">
                Tu cuenta se actualizará automáticamente al completar la prueba. Si abriste en nueva ventana, vuelve aquí y pulsa el botón.
              </p>
              <button
                type="button"
                onClick={onFinalizar}
                disabled={cargando}
                className="user-v2-modal-primary w-full sm:w-auto rounded-xl bg-[#FFC400] px-5 py-2.5 font-display text-xs font-bold text-[#151515] hover:bg-[#e0ac00] transition cursor-pointer"
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
                className="user-v2-modal-secondary rounded-xl border border-[#475569] px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-[#334155] transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={onReintentar}
                className="user-v2-modal-primary rounded-xl bg-[#FFC400] px-5 py-2.5 font-display text-sm font-bold text-[#151515] hover:bg-[#e0ac00] transition cursor-pointer"
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
