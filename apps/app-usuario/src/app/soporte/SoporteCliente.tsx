"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import type { Database } from "@ruum/shared/types";
import { HojaTareaCuenta } from "../cuenta/HojaTareaCuenta";
import { obtenerViajeActivo } from "../../lib/inicio";
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
    if (!usuario?.nombre) return "usuario";
    const parte = usuario.nombre.trim().split(/\s+/)[0];
    return parte ? parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase() : "usuario";
  }, [usuario?.nombre]);

  // Detección de viaje activo
  const viajeActivo = useMemo(() => {
    if (viajePreseleccionado) {
      return traslados.find((t) => t.traslado_id === viajePreseleccionado) ?? null;
    }
    return obtenerViajeActivo(traslados);
  }, [traslados, viajePreseleccionado]);

  const folioActivo = viajeActivo?.traslado_id
    ? `#${viajeActivo.traslado_id.slice(0, 8).toUpperCase()}`
    : null;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        texto: `Hola ${primerNombre}. Este chat es demostrativo. Para atención real utiliza los canales de contacto o crea un reporte.`,
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
        texto: "Describe tu consulta. Para seguimiento real, crea un reporte de soporte.",
      });
    }

    setMensajesChat(iniciales);
    setModalChatAbierto(true);
  }

  const cerrarChat = useCallback(() => setModalChatAbierto(false), []);

  function abrirTelefono() {
    setModalTelefonoAbierto(true);
  }

  const cerrarTelefono = useCallback(() => setModalTelefonoAbierto(false), []);
  const cerrarReporte = useCallback(() => setModalReporte(false), []);

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

    // Respuesta automática (SOP-1: el chat en vivo es demostrativo; la atención
    // real se da por teléfono, WhatsApp, correo o ticket de reporte).
    setTimeout(() => {
      const respAgente: MensajeChat = {
        id: `agent-${Date.now()}`,
        remitente: "agente",
        texto: "Respuesta automática (demo): recibimos tu mensaje. Para atención real usa llamada, WhatsApp, correo o crea un reporte.",
      };
      setMensajesChat((prev) => [...prev, respAgente]);
    }, 600);
  }

  return <div className="user-support-view">
    <header className="user-profile-appbar"><Link href="/cuenta?seccion=soporte" aria-label="Volver a mi cuenta" className="user-profile-back">‹ Atrás</Link><h1>Soporte</h1><span aria-hidden="true" /></header>
    <p className="user-support-status">Canales de soporte <span aria-hidden="true">•</span> {folioActivo ? `Traslado ${folioActivo}` : "Sin traslado activo"}</p>
    <section className="user-support-channels" aria-label="Canales de atención">
      <button type="button" onClick={() => abrirChat()}><IconoSvg nombre="chat" /><span>Chat en vivo</span><small>Demo</small></button>
      <button type="button" onClick={abrirTelefono}><IconoSvg nombre="phone" /><span>Llamada</span></button>
      <a href="https://wa.me/525588880000?text=Hola%20Ruum%20Ruum,%20necesito%20asistencia%20con%20mi%20traslado." target="_blank" rel="noopener noreferrer"><IconoSvg nombre="whatsapp" /><span>WhatsApp</span></a>
      <a href="mailto:soporte@ruumruum.com?subject=Soporte%20Ruum%20Ruum"><IconoSvg nombre="email" /><span>Correo</span></a>
    </section>
    <section className="user-support-topics" aria-labelledby="temas-frecuentes-titulo"><h2 id="temas-frecuentes-titulo">Temas frecuentes</h2>
      {[
        ["Problema con un traslado", "alerta-triangulo"], ["Reportar daño o incidente", "car-crash"],
        ["Ayuda con pagos", "tarjeta"], ["Ayuda con evidencia", "camara"],
      ].map(([tema, icono]) => <button key={tema} type="button" onClick={() => abrirChat(tema)}><IconoSvg nombre={icono} className="size-4 shrink-0" /><span>{tema}</span><IconoSvg nombre="chevron-derecha" className="size-4" /></button>)}
      <Link href="/preguntas-frecuentes"><IconoSvg nombre="help" className="size-4 shrink-0" /><span>Preguntas frecuentes</span><IconoSvg nombre="chevron-derecha" className="size-4" /></Link>
    </section>
    {modalChatAbierto && <HojaTareaCuenta titulo="Chat en vivo · Demo" extendida cerrar={cerrarChat}><div className="user-support-chat">
      <p role="note">Chat demostrativo. Para atención real usa llamada, WhatsApp, correo o crea un reporte.</p>
      <div className="user-support-messages" role="log" aria-label="Mensajes del chat">{mensajesChat.map(mensaje => <p key={mensaje.id} className={mensaje.remitente === "usuario" ? "is-user" : ""}>{mensaje.texto}</p>)}<div ref={chatBottomRef} /></div>
      {temaSeleccionado && <p className="sr-only">{temaSeleccionado}</p>}
      <form onSubmit={enviarMensaje}><input aria-label="Mensaje" placeholder="Escribe tu mensaje..." value={mensajeInput} onChange={e => setMensajeInput(e.target.value)} /><button type="submit" aria-label="Enviar mensaje">Enviar</button></form>
      <div className="user-support-chat-actions"><button type="button" onClick={() => { cerrarChat(); setModalReporte(true); }}>Crear reporte</button><button type="button" onClick={cerrarChat}>Cerrar chat</button></div>
    </div></HojaTareaCuenta>}
    {modalTelefonoAbierto && <HojaTareaCuenta titulo="Llamada telefónica" cerrar={cerrarTelefono}><div className="user-support-phone"><p>+52 55 8888 0000</p><a href="tel:+525588880000">Llamar ahora</a><button type="button" onClick={cerrarTelefono}>Cancelar</button></div></HojaTareaCuenta>}
    {modalReporte && <HojaTareaCuenta titulo="Reportar problema a soporte" extendida cerrar={cerrarReporte}><div className="user-support-report"><FormularioSoporte traslados={traslados.filter(t => t.traslado_id).map(t => ({ id: t.traslado_id!, label: `${t.vehiculo_marca ?? "Vehículo"} - ${t.traslado_id!.slice(0, 8)}` }))} preseleccionado={viajeActivo?.traslado_id ?? undefined} emailUsuario={usuario?.correo_facturacion} motivoInicial={motivoPreseleccionado === "eliminar_cuenta" ? "Consulta general u otro" : undefined} /></div></HojaTareaCuenta>}
  </div>;
}
