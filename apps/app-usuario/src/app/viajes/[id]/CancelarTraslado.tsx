"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Aviso, Button, Field } from "@ruum/ui";
import { MENSAJES_CLAVE_UX } from "@ruum/shared/constants";
import { formatearPrecio } from "@ruum/shared/utils";
import type { Database } from "@ruum/shared/types";
import { cancelarTraslado, usuarioPuedeCancelar } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import {
  validarTransicionFlujo10,
  calcularPenalizacionCancelacionF10,
  registrarAuditoriaAccionF10,
} from "@/lib/flujo10-transiciones-policy";

type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];

function horasRestantes(fechaIso: string | null) {
  if (!fechaIso) return Number.POSITIVE_INFINITY;
  return Math.max(0, (new Date(fechaIso).getTime() - Date.now()) / (1000 * 60 * 60));
}

export function CancelarTraslado({
  trasladoId,
  estado,
  precio,
  fechaProgramada,
  conductorAsignado,
  cerrado = false,
  onAbrirChat,
}: {
  trasladoId: string;
  estado: EstadoTraslado;
  precio: number;
  fechaProgramada: string | null;
  conductorAsignado: boolean;
  cerrado?: boolean;
  onAbrirChat?: () => void;
}) {
  const router = useRouter();
  const [motivo, setMotivo] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const contenedor = useRef<HTMLDivElement>(null);
  const bloqueo = useRef(false);
  const restaurarFoco = useRef(false);
  const [cancelado, setCancelado] = useState(false);
  const tituloId = useId();
  const consecuenciasId = useId();

  useEffect(() => {
    if (mensaje) {
      contenedor.current?.querySelector<HTMLElement>("[data-resultado]")?.focus();
    } else if (confirmando) {
      contenedor.current?.querySelector<HTMLElement>("[data-confirmacion]")?.focus();
    } else if (restaurarFoco.current) {
      contenedor.current?.querySelector<HTMLButtonElement>("[data-abrir-confirmacion]")?.focus();
      restaurarFoco.current = false;
    }
  }, [confirmando, mensaje]);

  const terminal = ["servicio_cerrado", "servicio_cancelado", "traslado_fallido"].includes(estado);
  if (terminal || cerrado) return null;

  // CB-2 / CA-4: Validación de transición contra máquina de estados de Flujo 10 y F8
  const validacionF10 = validarTransicionFlujo10("cancelar_traslado", estado, { trasladoId });

  if (!usuarioPuedeCancelar(estado) || !validacionF10.permitida) {
    const mensajeBloqueo = validacionF10.motivoBloqueo ??
      `La cancelación desde la aplicación no está habilitada para el estado actual: ${estado.replaceAll("_", " ")}. Contacta a Soporte para revisar tu solicitud.`;

    return (
      <div className="mt-5 rounded-lg border border-ink/15 bg-mist p-4">
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-ink/60">Cancelación no disponible</p>
        <p className="mt-1 font-body text-sm text-ink/80">
          {mensajeBloqueo}
        </p>
        <p className="mt-2 font-body text-xs text-ink/60">
          Si requieres asistencia urgente o surge alguna eventualidad, por favor{" "}
          <a href="#chat-conductor" onClick={onAbrirChat} className="font-semibold text-route-action underline">comunícate con el conductor</a> o{" "}
          <Link href={`/soporte?viaje=${encodeURIComponent(trasladoId)}&motivo=cancelacion`} className="font-semibold text-route-action underline">contacta a Soporte</Link>.
        </p>
      </div>
    );
  }

  const cargo = calcularPenalizacionCancelacionF10(
    precio,
    horasRestantes(fechaProgramada),
    conductorAsignado,
    estado === "conductor_en_punto_de_recoleccion"
  );

  async function cancelar() {
    if (bloqueo.current) return;
    bloqueo.current = true;
    setProcesando(true);
    setMensaje(null);
    try {
      if (!tieneSupabaseConfigurado()) {
        setMensaje({ tono: "danger", texto: "Supabase no está configurado. No se puede cancelar el traslado." });
        return;
      }
      const cliente = crearClienteNavegador();
      const resultado = await cancelarTraslado(cliente, trasladoId, motivo);

      // CB-3 / T10 / CA-8: Registro de auditoría
      registrarAuditoriaAccionF10({
        trasladoId,
        usuarioId: "cliente_sesion",
        accion: "cancelar_traslado",
        estadoAnterior: estado,
        estadoNuevo: "servicio_cancelado",
        timestamp: new Date().toISOString(),
        metadata: {
          motivo: motivo.trim(),
          porcentajeCargo: resultado.porcentaje_cargo,
          montoCargo: resultado.monto_cargo,
        },
      });

      setCancelado(true);
      setConfirmando(false);
      setMensaje({
        tono: "info",
        texto: `Traslado cancelado. Cargo registrado: ${formatearPrecio(resultado.monto_cargo)}.`,
      });
      router.refresh();
    } catch (err) {
      setMensaje({ tono: "danger", texto: err instanceof Error ? err.message : "No pudimos cancelar el traslado." });
    } finally {
      bloqueo.current = false;
      setProcesando(false);
    }
  }

  return (
    <div ref={contenedor} aria-busy={procesando} className="mt-5 rounded-lg border border-danger/25 bg-danger-soft px-4 py-4">
      <p className="font-body text-sm font-semibold text-danger">Cancelar viaje</p>
      <p className="mt-1 font-body text-sm text-ink/65">
        {MENSAJES_CLAVE_UX.cancelacion} {cargo.mensaje}
      </p>

      <div role="status" aria-live="polite" aria-atomic="true">
        {confirmando && <span className="sr-only">Confirmación de cancelación. {cargo.mensaje} Esta acción no se puede deshacer.</span>}
        {mensaje && <div className="mt-3" data-resultado tabIndex={-1}><Aviso tono={mensaje.tono}>{mensaje.texto}</Aviso></div>}
      </div>

      {/* Confirmación inline: foco en el contexto y anuncio sin interrumpir. */}
      {confirmando ? (
        <div data-confirmacion tabIndex={-1} role="group" aria-labelledby={tituloId} aria-describedby={consecuenciasId} className="mt-4 rounded-lg border border-danger/30 bg-danger-soft/60 p-4">
          <p id={tituloId} className="font-body text-sm font-semibold text-danger">
            ¿Confirmar cancelación?
          </p>
          <p id={consecuenciasId} className="mt-1 font-body text-sm leading-5 text-ink/70">
            {cargo.mensaje} Esta acción no se puede deshacer.
          </p>
          {motivo.trim() && (
            <p className="mt-1 font-body text-xs text-ink/50">
              Motivo registrado: &quot;{motivo.trim()}&quot;
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <Button
              variant="danger"
              onClick={cancelar}
              disabled={procesando}
            >
              {procesando ? "Cancelando…" : "Sí, cancelar el viaje"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => { restaurarFoco.current = true; setMensaje(null); setConfirmando(false); }}
              disabled={procesando}
            >
              No, mantener
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          <Field
            etiqueta="Motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Cuéntanos por qué necesitas cancelar"
          />
          <Button
            variant="danger"
            data-abrir-confirmacion
            onClick={() => { setMensaje(null); setConfirmando(true); }}
            disabled={procesando || cancelado}
          >
            Cancelar viaje
          </Button>
        </div>
      )}
    </div>
  );
}
