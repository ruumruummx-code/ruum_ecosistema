"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import { useEffect, useRef, useState } from "react";
import { Chat, type MensajeChat, Aviso } from "@ruum/ui";
import { MENSAJES_CLAVE_UX } from "@ruum/shared/constants";
import { chatDisponible } from "@ruum/shared/rules";
import type { Database } from "@ruum/shared/types";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { obtenerMensajes, enviarMensaje, suscribirseAMensajes } from "@ruum/api/services";
import { MENSAJES_RAPIDOS_CONTACTO } from "./quick-messages";

type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];

function claveAvisoChat(trasladoId: string) {
  return `ruum_chat_aviso_${trasladoId}`;
}

function leerAvisoVisto(trasladoId: string) {
  try {
    return window.localStorage.getItem(claveAvisoChat(trasladoId)) === "1";
  } catch {
    return false;
  }
}

function guardarAvisoVisto(trasladoId: string) {
  try {
    window.localStorage.setItem(claveAvisoChat(trasladoId), "1");
    return true;
  } catch {
    return false;
  }
}

export function ChatViaje({ trasladoId, estado }: { trasladoId: string; estado: EstadoTraslado }) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [avisoVisto, setAvisoVisto] = useState(() => leerAvisoVisto(trasladoId));
  const [popoverAvisoAbierto, setPopoverAvisoAbierto] = useState(false);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [enviandoRapido, setEnviandoRapido] = useState<string | null>(null);
  const [errorChat, setErrorChat] = useState<string | null>(null);
  const clienteRef = useRef<ReturnType<typeof crearClienteNavegador> | null>(null);

  const disponible = chatDisponible(estado);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAvisoVisto(leerAvisoVisto(trasladoId));
      setPopoverAvisoAbierto(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [trasladoId]);

  useEffect(() => {
    if (!disponible || !chatAbierto) return;

    let cliente: ReturnType<typeof crearClienteNavegador>;
    try {
      cliente = crearClienteNavegador();
    } catch (err) {
      const timer = setTimeout(() => {
        setMensajes([]);
        setErrorChat(traducirErrorOperativo(err, "No pudimos inicializar el chat."));
      }, 0);
      return () => clearTimeout(timer);
    }
    clienteRef.current = cliente;
    setErrorChat(null);

    let cancelado = false;

    obtenerMensajes(cliente, trasladoId)
      .then((cargados) => {
        if (!cancelado) setMensajes(cargados);
      })
      .catch((err) => {
        if (!cancelado) {
          setMensajes([]);
          setErrorChat(traducirErrorOperativo(err, "No pudimos cargar el chat."));
        }
      });

    const canal = suscribirseAMensajes(
      cliente,
      trasladoId,
      (nuevo) => {
        if (!cancelado) {
          setMensajes((prev) => (prev.some((m) => m.id === nuevo.id) ? prev : [...prev, nuevo]));
        }
      },
      {
        onError: (err) => {
          if (!cancelado) {
            setErrorChat("Se perdió la conexión en tiempo real con el chat.");
            console.warn("[ChatViaje] error en suscripción realtime", err);
          }
        }
      }
    );

    return () => {
      cancelado = true;
      try {
        void cliente.removeChannel(canal);
      } catch {
        // Ignorar fallos de cleanup si ya estaba cerrado
      }
    };
  }, [trasladoId, disponible, chatAbierto]);

  function obtenerClienteChat() {
    if (clienteRef.current) return clienteRef.current;
    const cliente = crearClienteNavegador();
    clienteRef.current = cliente;
    return cliente;
  }

  async function manejarEnvio(contenido: string) {
    const cliente = obtenerClienteChat();
    await enviarMensaje(cliente, trasladoId, contenido);
    // No hace falta actualizar el estado local aquí: la suscripción de
    // Realtime ya lo va a recibir, igual que le llegaría al usuario.
  }

  async function enviarMensajeRapido(contenido: string) {
    setEnviandoRapido(contenido);
    setErrorChat(null);
    try {
      await manejarEnvio(contenido);
    } catch (err) {
      setErrorChat(traducirErrorOperativo(err, "No pudimos enviar el mensaje."));
    } finally {
      setEnviandoRapido(null);
    }
  }

  function confirmarAvisoVisto() {
    if (guardarAvisoVisto(trasladoId)) {
      setAvisoVisto(true);
    }
  }

  return (
    <section id="chat-contacto" className="mt-6 rounded-lg border border-ui-line bg-ui-card">
      {disponible && (
        <div className="px-4 py-4">
          <p className="font-body text-sm font-semibold text-ui-fg-muted">Mensajes rápidos</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {MENSAJES_RAPIDOS_CONTACTO.map((mensajeRapido) => (
              <BaseButton variant="ghost"
                key={mensajeRapido}
                type="button"
                onClick={() => void enviarMensajeRapido(mensajeRapido)}
                disabled={enviandoRapido !== null}
                className="min-h-11 rounded-lg border border-ui-line bg-ui-muted px-3 py-2 text-left font-body text-sm font-semibold text-ui-fg-muted transition hover:border-ui-brand hover:bg-ui-brand-soft hover:text-ui-brand disabled:cursor-not-allowed disabled:text-disabled"
              >
                {enviandoRapido === mensajeRapido ? "Enviando..." : mensajeRapido}
              </BaseButton>
            ))}
          </div>
        </div>
      )}
      <details
        className={["group overflow-hidden", disponible ? "border-t border-ui-line" : ""].join(" ")}
        open={chatAbierto}
        onToggle={(evento) => setChatAbierto(evento.currentTarget.open)}
      >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-ui-brand-soft/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-brand [&::-webkit-details-marker]:hidden">
        <div>
          <p className="font-body text-sm font-semibold text-ui-fg-muted">Chat del traslado</p>
          <p className="mt-1 font-body text-sm font-semibold text-ui-fg">
            {disponible ? "Abrir conversación completa" : "Conversación cerrada"}
          </p>
        </div>
        <span className="font-display text-lg leading-none text-ui-fg-muted transition-transform group-open:rotate-45" aria-hidden>
          +
        </span>
      </summary>
      <div className="border-t border-ui-line px-4 pb-4 pt-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {disponible && avisoVisto && (
              <div className="relative">
                <BaseButton variant="ghost"
                  type="button"
                  aria-label="Ver aviso de comunicación"
                  aria-expanded={popoverAvisoAbierto}
                  onClick={() => setPopoverAvisoAbierto((abierto) => !abierto)}
                  className="flex size-11 items-center justify-center rounded-full border border-ui-brand bg-ui-brand-soft font-body text-sm font-semibold text-ui-brand transition hover:border-ui-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-brand"
                >
                  i
                </BaseButton>
                {popoverAvisoAbierto && (
                  <dialog
                    aria-label="Aviso de comunicación"
                    className="absolute left-0 z-20 mt-2 w-72 rounded-xl border border-ui-brand bg-ui-card p-3 font-body text-sm leading-5 text-ui-brand shadow-3"
                  >
                    {MENSAJES_CLAVE_UX.comunicacion}
                  </dialog>
                )}
              </div>
            )}
          </div>
        </div>
        {errorChat && (
          <div className="mb-2">
            <Aviso tono="danger">{errorChat}</Aviso>
          </div>
        )}
        {disponible && !avisoVisto && (
          <div className="mb-2">
            <Aviso tono="info">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{MENSAJES_CLAVE_UX.comunicacion}</span>
                <BaseButton variant="ghost"
                  type="button"
                  onClick={confirmarAvisoVisto}
                  className="min-h-11 self-start rounded-lg border border-ui-brand bg-ui-card px-3 py-2 font-body text-sm font-semibold text-ui-brand transition hover:border-ui-brand hover:bg-ui-brand-soft sm:self-auto"
                >
                  Entendido
                </BaseButton>
              </div>
            </Aviso>
          </div>
        )}
        <Chat
          propio="conductor"
          mensajes={mensajes}
          onEnviar={manejarEnvio}
          deshabilitado={!disponible}
          mensajeDeshabilitado="El chat se cerró junto con el traslado"
        />
      </div>
      </details>
    </section>
  );
}
