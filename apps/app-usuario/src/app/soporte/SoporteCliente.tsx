"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Database } from "@ruum/shared/types";
import { FormularioSoporte } from "./FormularioSoporte";

type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

export interface SoporteClienteProps {
  usuario: Usuario | null;
  traslados: Pasaporte[];
  viajePreseleccionado?: string;
  motivoPreseleccionado?: string;
  canalPreseleccionado?: string;
}

interface MensajeChat {
  id: string;
  remitente: "agente" | "usuario";
  texto: string;
}

/* Íconos SVG dedicados con alta fidelidad */
function IconoSvg({ nombre, className = "size-5" }: { nombre: string; className?: string }) {
  switch (nombre) {
    case "flecha-atras":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      );
    case "headset":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      );
    case "truck":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case "chat":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="9" y1="10" x2="9.01" y2="10" strokeWidth="3" />
          <line x1="12" y1="10" x2="12.01" y2="10" strokeWidth="3" />
          <line x1="15" y1="10" x2="15.01" y2="10" strokeWidth="3" />
        </svg>
      );
    case "phone":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z" />
        </svg>
      );
    case "email":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      );
    case "chevron-derecha":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
    case "clock":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "info":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="3" />
        </svg>
      );
    case "alerta-triangulo":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
        </svg>
      );
    case "car-crash":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 8l-2-2-4 4-2-2" />
          <circle cx="6" cy="18" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path d="M3 14h18" />
          <path d="M5 14l1.5-5h7l2 5" />
        </svg>
      );
    case "tarjeta":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      );
    case "camara":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case "paper-plane":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      );
    case "user":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="7" r="4" />
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        </svg>
      );
    case "help":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
        </svg>
      );
    default:
      return null;
  }
}

export function SoporteCliente({
  usuario,
  traslados,
  viajePreseleccionado,
  motivoPreseleccionado,
  canalPreseleccionado,
}: SoporteClienteProps) {
  const [modalChatAbierto, setModalChatAbierto] = useState(false);
  const [modalTelefonoAbierto, setModalTelefonoAbierto] = useState(false);
  const [modalReporte, setModalReporte] = useState(false);

  const [temaSeleccionado, setTemaSeleccionado] = useState<string | null>(null);
  const [mensajeInput, setMensajeInput] = useState("");
  const [mensajesChat, setMensajesChat] = useState<MensajeChat[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Nombre de pila para saludo personalizado
  const primerNombre = useMemo(() => {
    if (!usuario?.nombre) return "Laura";
    const parte = usuario.nombre.trim().split(/\s+/)[0];
    return parte ? parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase() : "Laura";
  }, [usuario?.nombre]);

  // Detección de viaje activo
  const viajeActivo = useMemo(() => {
    if (viajePreseleccionado) {
      return traslados.find((t) => t.traslado_id === viajePreseleccionado) ?? null;
    }
    return (
      traslados.find(
        (t) => t.estado && !["servicio_cerrado", "servicio_cancelado", "traslado_fallido"].includes(t.estado)
      ) ?? null
    );
  }, [traslados, viajePreseleccionado]);

  const folioActivo = viajeActivo?.traslado_id
    ? `#${viajeActivo.traslado_id.slice(0, 8).toUpperCase()}`
    : "#RR-4829";

  const vehiculoTexto = viajeActivo
    ? [viajeActivo.vehiculo_marca, viajeActivo.vehiculo_modelo, viajeActivo.vehiculo_anio].filter(Boolean).join(" ")
    : "Toyota Corolla 2021";

  const estadoTexto = viajeActivo?.estado
    ? viajeActivo.estado.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    : "En camino al destino";

  // Efecto para abrir canales según query parameters
  useEffect(() => {
    if (canalPreseleccionado === "chat" || canalPreseleccionado === "live") {
      abrirChat();
    } else if (canalPreseleccionado === "telefono" || canalPreseleccionado === "call") {
      abrirTelefono();
    } else if (motivoPreseleccionado === "eliminar_cuenta") {
      setModalReporte(true);
    } else if (motivoPreseleccionado) {
      const mapaMotivos: Record<string, string> = {
        problema_traslado: "Problema con un traslado",
        ayuda_evidencia: "Ayuda con evidencia",
        pagos: "Ayuda con pagos",
        dano: "Reportar daño o incidente",
      };
      abrirChat(mapaMotivos[motivoPreseleccionado] || motivoPreseleccionado);
    }
  }, [canalPreseleccionado, motivoPreseleccionado]);

  // Manejo de tecla Escape
  useEffect(() => {
    function manejarKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModalChatAbierto(false);
        setModalTelefonoAbierto(false);
        setModalReporte(false);
      }
    }
    window.addEventListener("keydown", manejarKeyDown);
    return () => window.removeEventListener("keydown", manejarKeyDown);
  }, []);

  // Auto scroll al final del chat cuando llegan mensajes
  useEffect(() => {
    if (modalChatAbierto && typeof chatBottomRef.current?.scrollIntoView === "function") {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajesChat, modalChatAbierto]);

  function abrirChat(tema?: string) {
    setTemaSeleccionado(tema ?? null);
    const iniciales: MensajeChat[] = [
      {
        id: "msg-1",
        remitente: "agente",
        texto: `Hola ${primerNombre} 👋 Soy Ana de Ruum Ruum. ¿En qué puedo ayudarte hoy?`,
      },
    ];

    if (tema) {
      iniciales.push({
        id: "msg-2",
        remitente: "usuario",
        texto: tema,
      });
      iniciales.push({
        id: "msg-3",
        remitente: "agente",
        texto: "Entiendo. ¿Podrías darme más detalles sobre lo que está ocurriendo? Estoy aquí para ayudarte.",
      });
    }

    setMensajesChat(iniciales);
    setModalChatAbierto(true);
  }

  function cerrarChat() {
    setModalChatAbierto(false);
  }

  function abrirTelefono() {
    setModalTelefonoAbierto(true);
  }

  function cerrarTelefono() {
    setModalTelefonoAbierto(false);
  }

  function enviarMensaje(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const texto = mensajeInput.trim();
    if (!texto) return;

    const nuevoMsgUsuario: MensajeChat = {
      id: `user-${Date.now()}`,
      remitente: "usuario",
      texto,
    };

    setMensajesChat((prev) => [...prev, nuevoMsgUsuario]);
    setMensajeInput("");

    // Respuesta simulada de soporte en tiempo real
    setTimeout(() => {
      const respAgente: MensajeChat = {
        id: `agent-${Date.now()}`,
        remitente: "agente",
        texto: "Gracias por la información. Estamos revisando tu caso de inmediato y un asesor te atenderá.",
      };
      setMensajesChat((prev) => [...prev, respAgente]);
    }, 600);
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-5 pb-24 text-[#0b1e33]">
      {/* Header */}
      <header className="flex items-center gap-3.5 border-b border-[#f0f4fa] bg-white px-2 py-3">
        <Link
          href="/cuenta"
          aria-label="Volver a cuenta"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f2f6fc] text-[#0b1e33] transition-transform active:scale-95 hover:bg-[#e3ebf5]"
        >
          <IconoSvg nombre="flecha-atras" className="size-4.5" />
        </Link>
        <div>
          <h1 className="text-[18px] font-bold tracking-tight text-[#0b1e33]">
            Contactar a soporte
          </h1>
          <p className="text-[12px] font-medium text-[#6b7c94]">
            Estamos aquí para ayudarte
          </p>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0b1e33] to-[#162c47] p-6 text-white shadow-[0_16px_32px_-12px_rgba(11,30,51,0.4)]">
        <div className="pointer-events-none absolute -top-14 -right-14 size-40 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 size-36 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,transparent_70%)]" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex size-[60px] shrink-0 items-center justify-center rounded-[20px] bg-white/12 text-white backdrop-blur-sm">
            <IconoSvg nombre="headset" className="size-7" />
          </div>
          <div>
            <h2 className="text-[20px] font-extrabold tracking-tight text-white leading-tight">
              Soporte Ruum Ruum
            </h2>
            <p className="mt-1 text-[13px] font-medium text-white/70 leading-snug">
              Atención 24/7 durante tu traslado
            </p>
          </div>
        </div>

        {/* Live status */}
        <div className="relative z-10 mt-4 flex w-fit items-center gap-2 rounded-full bg-white/12 px-3.5 py-2 text-[12px] font-bold text-white backdrop-blur-sm">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(74,222,128,0.3)]" />
          </span>
          <span>En línea · Tiempo de respuesta: 2 min</span>
        </div>
      </section>

      {/* Banner traslado activo */}
      <section
        aria-label="Traslado activo"
        className="flex items-center gap-3.5 rounded-[20px] border border-[#f5dcb0] bg-gradient-to-br from-[#fef7e8] to-[#fcecd4] p-4.5"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-white text-[#b36b1e] shadow-[0_4px_10px_rgba(179,107,30,0.1)]">
          <IconoSvg nombre="truck" className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-extrabold tracking-tight text-[#7a4e15]">
            Traslado activo · {folioActivo}
          </div>
          <div className="mt-0.5 text-[12px] font-medium text-[#8a5e25] truncate">
            {vehiculoTexto} · {estadoTexto}
          </div>
        </div>
      </section>

      {/* Métodos de contacto */}
      <section aria-labelledby="canales-atencion-titulo">
        <h2 id="canales-atencion-titulo" className="mb-3 px-1 text-[12px] font-bold uppercase tracking-[0.8px] text-[#8b9bb0]">
          Canales de atención
        </h2>

        <div className="flex flex-col gap-3">
          {/* Chat en vivo */}
          <button
            type="button"
            onClick={() => abrirChat()}
            className="flex w-full items-center gap-4 rounded-[20px] border border-[#eef2f7] border-l-4 border-l-[#2e9e6b] bg-white p-4.5 text-left shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.99] hover:bg-[#fbfdff]"
          >
            <div className="flex size-[52px] shrink-0 items-center justify-center rounded-[17px] bg-[#e9f3ee] text-[#1f6b4a]">
              <IconoSvg nombre="chat" className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[15px] font-bold text-[#0b1e33] tracking-tight">
                <span>Chat en vivo</span>
                <span className="rounded-full bg-[#e9f3ee] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1f6b4a]">
                  Recomendado
                </span>
              </div>
              <div className="mt-0.5 text-[12.5px] font-medium text-[#8b9bb0] leading-snug">
                Respuesta inmediata · Disponible 24/7
              </div>
            </div>
            <IconoSvg nombre="chevron-derecha" className="size-4 shrink-0 text-[#c3cfdd]" />
          </button>

          {/* Teléfono */}
          <button
            type="button"
            onClick={abrirTelefono}
            className="flex w-full items-center gap-4 rounded-[20px] border border-[#eef2f7] bg-white p-4.5 text-left shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.99] hover:bg-[#fbfdff]"
          >
            <div className="flex size-[52px] shrink-0 items-center justify-center rounded-[17px] bg-[#f0f5fe] text-[#2e5a88]">
              <IconoSvg nombre="phone" className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-[#0b1e33] tracking-tight">
                Llamada telefónica
              </div>
              <div className="mt-0.5 text-[12.5px] font-medium text-[#8b9bb0] leading-snug">
                Atención personalizada · 24/7
              </div>
            </div>
            <IconoSvg nombre="chevron-derecha" className="size-4 shrink-0 text-[#c3cfdd]" />
          </button>

          {/* WhatsApp */}
          <a
            href="https://wa.me/525588880000?text=Hola%20Ruum%20Ruum,%20necesito%20asistencia%20con%20mi%20traslado."
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-4 rounded-[20px] border border-[#eef2f7] bg-white p-4.5 text-left shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.99] hover:bg-[#fbfdff]"
          >
            <div className="flex size-[52px] shrink-0 items-center justify-center rounded-[17px] bg-[#e6f5ec] text-[#25d366]">
              <IconoSvg nombre="whatsapp" className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-[#0b1e33] tracking-tight">
                WhatsApp
              </div>
              <div className="mt-0.5 text-[12.5px] font-medium text-[#8b9bb0] leading-snug">
                Mensajes de estado y soporte
              </div>
            </div>
            <IconoSvg nombre="chevron-derecha" className="size-4 shrink-0 text-[#c3cfdd]" />
          </a>

          {/* Email */}
          <a
            href="mailto:soporte@ruumruum.com?subject=Soporte%20Ruum%20Ruum"
            className="flex w-full items-center gap-4 rounded-[20px] border border-[#eef2f7] bg-white p-4.5 text-left shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.99] hover:bg-[#fbfdff]"
          >
            <div className="flex size-[52px] shrink-0 items-center justify-center rounded-[17px] bg-[#fef4e6] text-[#b36b1e]">
              <IconoSvg nombre="email" className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-[#0b1e33] tracking-tight">
                Correo electrónico
              </div>
              <div className="mt-0.5 text-[12.5px] font-medium text-[#8b9bb0] leading-snug">
                soporte@ruumruum.com
              </div>
            </div>
            <IconoSvg nombre="chevron-derecha" className="size-4 shrink-0 text-[#c3cfdd]" />
          </a>
        </div>
      </section>

      {/* Temas rápidos */}
      <section aria-labelledby="temas-frecuentes-titulo">
        <h2 id="temas-frecuentes-titulo" className="mb-3 px-1 text-[12px] font-bold uppercase tracking-[0.8px] text-[#8b9bb0]">
          Temas frecuentes
        </h2>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => abrirChat("Problema con un traslado")}
            className="flex flex-col gap-2 rounded-[18px] border border-[#eef2f7] bg-white p-4 text-left shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-transform active:scale-[0.98] hover:bg-[#fbfdff]"
          >
            <div className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-[#fef4e6] text-[#b36b1e]">
              <IconoSvg nombre="alerta-triangulo" className="size-4.5" />
            </div>
            <div className="text-[13px] font-bold text-[#0b1e33] leading-snug tracking-tight">
              Problema con un traslado
            </div>
            <div className="-mt-1 text-[11px] font-medium text-[#8b9bb0]">
              Incidencias durante el servicio
            </div>
          </button>

          <button
            type="button"
            onClick={() => abrirChat("Reportar daño o incidente")}
            className="flex flex-col gap-2 rounded-[18px] border border-[#eef2f7] bg-white p-4 text-left shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-transform active:scale-[0.98] hover:bg-[#fbfdff]"
          >
            <div className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-[#fdeaea] text-[#b33c3c]">
              <IconoSvg nombre="car-crash" className="size-4.5" />
            </div>
            <div className="text-[13px] font-bold text-[#0b1e33] leading-snug tracking-tight">
              Reportar daño
            </div>
            <div className="-mt-1 text-[11px] font-medium text-[#8b9bb0]">
              Documentación de daños
            </div>
          </button>

          <button
            type="button"
            onClick={() => abrirChat("Ayuda con pagos")}
            className="flex flex-col gap-2 rounded-[18px] border border-[#eef2f7] bg-white p-4 text-left shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-transform active:scale-[0.98] hover:bg-[#fbfdff]"
          >
            <div className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-[#f0f5fe] text-[#2e5a88]">
              <IconoSvg nombre="tarjeta" className="size-4.5" />
            </div>
            <div className="text-[13px] font-bold text-[#0b1e33] leading-snug tracking-tight">
              Ayuda con pagos
            </div>
            <div className="-mt-1 text-[11px] font-medium text-[#8b9bb0]">
              Transacciones y cobros
            </div>
          </button>

          <button
            type="button"
            onClick={() => abrirChat("Ayuda con evidencia")}
            className="flex flex-col gap-2 rounded-[18px] border border-[#eef2f7] bg-white p-4 text-left shadow-[0_4px_12px_rgba(0,0,0,0.01)] transition-transform active:scale-[0.98] hover:bg-[#fbfdff]"
          >
            <div className="flex size-[38px] shrink-0 items-center justify-center rounded-xl bg-[#f2eef9] text-[#5e3b8c]">
              <IconoSvg nombre="camara" className="size-4.5" />
            </div>
            <div className="text-[13px] font-bold text-[#0b1e33] leading-snug tracking-tight">
              Ayuda con evidencia
            </div>
            <div className="-mt-1 text-[11px] font-medium text-[#8b9bb0]">
              Fotografías y checks
            </div>
          </button>
        </div>
      </section>

      {/* Horarios */}
      <section
        aria-labelledby="horarios-titulo"
        className="rounded-[20px] border border-[#eef2f7] bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
      >
        <div id="horarios-titulo" className="flex items-center gap-2.5 font-bold text-[14.5px] text-[#0b1e33] mb-3.5">
          <div className="flex size-7.5 items-center justify-center rounded-[10px] bg-[#f0f5fe] text-[#2e5a88]">
            <IconoSvg nombre="clock" className="size-3.5" />
          </div>
          <span>Horarios de atención</span>
        </div>

        <div className="divide-y divide-[#f0f4fa] text-[13.5px]">
          <div className="flex justify-between items-center py-2.5">
            <span className="font-medium text-[#6b7c94]">Chat en vivo</span>
            <span className="flex items-center gap-1.5 font-semibold text-[#1f6b4a]">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(74,222,128,0.25)]" />
              24/7 · En línea
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5">
            <span className="font-medium text-[#6b7c94]">Teléfono</span>
            <span className="flex items-center gap-1.5 font-semibold text-[#1f6b4a]">
              <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(74,222,128,0.25)]" />
              24/7 · En línea
            </span>
          </div>
          <div className="flex justify-between items-center py-2.5">
            <span className="font-medium text-[#6b7c94]">WhatsApp</span>
            <span className="font-semibold text-[#1a293b]">Lun – Dom · 8:00 – 22:00</span>
          </div>
          <div className="flex justify-between items-center pt-2.5">
            <span className="font-medium text-[#6b7c94]">Correo electrónico</span>
            <span className="font-semibold text-[#1a293b]">Respuesta en 24 h</span>
          </div>
        </div>
      </section>

      {/* Nota de soporte */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#dfe8f3] bg-[#f0f5fe] p-4">
        <div className="text-[#2e5a88] shrink-0 mt-0.5">
          <IconoSvg nombre="info" className="size-4.5" />
        </div>
        <p className="text-[12.5px] font-medium text-[#3d5470] leading-relaxed">
          Durante un traslado activo, el botón de soporte está siempre visible. El acceso no requiere más de un toque desde cualquier pantalla del traslado.
        </p>
      </div>

      {/* Enlace directo a Preguntas Frecuentes */}
      <Link
        href="/preguntas-frecuentes"
        className="flex items-center justify-between rounded-[20px] border border-[#eef2f7] bg-white p-4.5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-colors hover:border-[#0b1e33]/20"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-[#f0f5fe] text-[#2e5a88]">
            <IconoSvg nombre="help" className="size-5" />
          </div>
          <div>
            <div className="text-[14px] font-bold text-[#0b1e33]">
              Preguntas frecuentes
            </div>
            <div className="text-[12px] font-medium text-[#6b7c94]">
              Encuentra respuestas rápidas y guías de servicio
            </div>
          </div>
        </div>
        <IconoSvg nombre="chevron-derecha" className="size-4 shrink-0 text-[#c3cfdd]" />
      </Link>

      {/* ============================================================ */}
      {/* MODAL: CHAT EN VIVO (Bottom sheet)                           */}
      {/* ============================================================ */}
      {modalChatAbierto && (
        <div
          id="chatModal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-titulo"
          onClick={cerrarChat}
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1e33]/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-[28px] bg-white p-6 shadow-2xl animate-in slide-in-from-bottom duration-300"
          >
            {/* Sheet handle */}
            <div className="mx-auto mb-4 h-1 w-11 rounded-full bg-[#dde5ef]" />

            <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-[22px] bg-[#e9f3ee] text-[#1f6b4a]">
              <IconoSvg nombre="chat" className="size-7" />
            </div>

            <h3 id="chat-titulo" className="text-center text-[19px] font-extrabold text-[#0b1e33] tracking-tight">
              Chat en vivo
            </h3>
            <p className="mt-1 mb-4 text-center text-[13.5px] font-medium text-[#6b7c94] leading-snug">
              {temaSeleccionado
                ? "Un agente especializado te atenderá en menos de 2 minutos."
                : "Un agente te atenderá en menos de 2 minutos."}
            </p>

            {/* Chat mock messages */}
            <div className="mb-4 max-h-[260px] flex-1 overflow-y-auto rounded-[20px] border border-[#eef2f7] bg-[#f8fafd] p-4.5 space-y-3.5">
              {mensajesChat.map((m) => {
                const esAgente = m.remitente === "agente";
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${esAgente ? "" : "flex-row-reverse"}`}
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white text-[12px] font-bold ${
                        esAgente ? "bg-[#2e5a88]" : "bg-[#0b1e33]"
                      }`}
                    >
                      {esAgente ? <IconoSvg nombre="headset" className="size-4" /> : <IconoSvg nombre="user" className="size-4" />}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-[16px] px-3.5 py-3 text-[13px] font-medium leading-relaxed shadow-sm ${
                        esAgente
                          ? "rounded-tl-sm bg-[#eef3fa] text-[#1a293b]"
                          : "rounded-tr-sm bg-white text-[#1a293b] border border-[#eef2f7]"
                      }`}
                    >
                      {m.texto}
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat input */}
            <form onSubmit={enviarMensaje} className="flex items-center gap-2 rounded-2xl border border-[#e6edf6] bg-[#f8fafd] p-1.5 pl-4">
              <input
                type="text"
                value={mensajeInput}
                onChange={(e) => setMensajeInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                aria-label="Mensaje para soporte"
                className="w-full bg-transparent text-[14px] font-medium text-[#0b1e33] outline-none placeholder:text-[#a6b7cb]"
              />
              <button
                type="submit"
                aria-label="Enviar mensaje"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0b1e33] text-white transition-transform active:scale-95"
              >
                <IconoSvg nombre="paper-plane" className="size-4.5" />
              </button>
            </form>

            <button
              type="button"
              onClick={cerrarChat}
              className="mt-3.5 w-full py-2.5 text-center text-[14px] font-bold text-[#6b7c94] transition-colors hover:text-[#0b1e33]"
            >
              Cerrar chat
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: LLAMADA TELEFÓNICA (Bottom sheet)                     */}
      {/* ============================================================ */}
      {modalTelefonoAbierto && (
        <div
          id="phoneModal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="telefono-titulo"
          onClick={cerrarTelefono}
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#0b1e33]/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-[28px] bg-white p-6 shadow-2xl animate-in slide-in-from-bottom duration-300"
          >
            {/* Sheet handle */}
            <div className="mx-auto mb-4 h-1 w-11 rounded-full bg-[#dde5ef]" />

            <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-[22px] bg-[#f0f5fe] text-[#2e5a88]">
              <IconoSvg nombre="phone" className="size-7" />
            </div>

            <h3 id="telefono-titulo" className="text-center text-[19px] font-extrabold text-[#0b1e33] tracking-tight">
              Llamada telefónica
            </h3>
            <p className="mt-1 mb-5 text-center text-[13.5px] font-medium text-[#6b7c94] leading-snug">
              Nuestro equipo de soporte está disponible para atenderte.
            </p>

            <div className="mb-4 rounded-[18px] border border-[#eef2f7] bg-[#f8fafd] p-5 text-center">
              <div className="text-[26px] font-extrabold tracking-tight text-[#0b1e33]">
                +52 55 8888 0000
              </div>
              <div className="mt-1 text-[12.5px] font-semibold uppercase tracking-[0.5px] text-[#8b9bb0]">
                Línea de soporte Ruum Ruum
              </div>
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-[#1f6b4a]">
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_2px_rgba(74,222,128,0.25)]" />
                Disponible 24/7
              </div>
            </div>

            <a
              href="tel:+525588880000"
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0b1e33] py-4 text-[15px] font-bold text-white shadow-[0_10px_22px_-8px_rgba(11,30,51,0.4)] transition-transform active:scale-[0.98]"
            >
              <IconoSvg nombre="phone" className="size-4.5" />
              <span>Llamar ahora</span>
            </a>

            <button
              type="button"
              onClick={cerrarTelefono}
              className="w-full py-3 text-center text-[14px] font-bold text-[#6b7c94] transition-colors hover:text-[#0b1e33]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal alternativo: Formulario de reporte directo */}
      {modalReporte && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1e33]/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl text-[#0b1e33]">
            <div className="flex items-center justify-between border-b border-[#f0f4fa] pb-4 mb-4">
              <h3 className="text-[17px] font-extrabold text-[#0b1e33]">
                Reportar problema a soporte
              </h3>
              <button
                type="button"
                onClick={() => setModalReporte(false)}
                aria-label="Cerrar formulario"
                className="flex size-9 items-center justify-center rounded-full bg-[#f2f6fc] text-[#6b7c94] hover:text-[#0b1e33]"
              >
                ✕
              </button>
            </div>

            <FormularioSoporte
              traslados={traslados
                .filter((t) => t.traslado_id)
                .map((t) => ({
                  id: t.traslado_id!,
                  label: `${t.vehiculo_marca ?? "Vehículo"} - ${t.traslado_id!.slice(0, 8)}`,
                }))}
              preseleccionado={viajeActivo?.traslado_id ?? undefined}
              emailUsuario={usuario?.correo_facturacion}
              motivoInicial={motivoPreseleccionado === "eliminar_cuenta" ? "Consulta general u otro" : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
