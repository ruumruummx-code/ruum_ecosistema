"use client";

import { useState } from "react";
import { actualizarPreferenciasNotificaciones } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import type { Usuario } from "./cuenta-ui";

const INTERRUPTORES = [
  { campo: "notificaciones_push", etiqueta: "Push", ayuda: "Avisos en este dispositivo." },
  { campo: "notificaciones_email", etiqueta: "Correo electrónico", ayuda: "Resúmenes y comprobantes." },
  { campo: "notificaciones_sms_whatsapp", etiqueta: "SMS / WhatsApp", ayuda: "Alertas urgentes del traslado." },
  { campo: "alertas_pago", etiqueta: "Alertas de pago", ayuda: "Cargos, cotizaciones y facturas." },
  { campo: "notificaciones_promocionales", etiqueta: "Promocionales", ayuda: "Ofertas y novedades." },
] as const;

type CampoPreferencia = (typeof INTERRUPTORES)[number]["campo"];

export function PreferenciasToggles({ usuario }: { usuario: Usuario }) {
  const [valores, setValores] = useState<Record<CampoPreferencia, boolean>>({
    notificaciones_push: Boolean(usuario.notificaciones_push),
    notificaciones_email: Boolean(usuario.notificaciones_email),
    notificaciones_sms_whatsapp: Boolean(usuario.notificaciones_sms_whatsapp),
    alertas_pago: Boolean(usuario.alertas_pago),
    notificaciones_promocionales: Boolean(usuario.notificaciones_promocionales),
  });
  const [guardando, setGuardando] = useState<CampoPreferencia | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function alternar(campo: CampoPreferencia) {
    if (guardando) return;
    if (!tieneSupabaseConfigurado()) {
      setAviso("La configuración no está disponible en este entorno.");
      return;
    }
    const previo = valores[campo];
    setValores((v) => ({ ...v, [campo]: !previo }));
    setGuardando(campo);
    setAviso(null);
    try {
      const cliente = crearClienteNavegador();
      await actualizarPreferenciasNotificaciones(cliente, { [campo]: !previo });
    } catch {
      setValores((v) => ({ ...v, [campo]: previo }));
      setAviso("No pudimos guardar el cambio. Intenta de nuevo.");
    } finally {
      setGuardando(null);
    }
  }

  return (
    <div>
      <div className="grid gap-1" role="group" aria-label="Preferencias de notificación">
        {INTERRUPTORES.map(({ campo, etiqueta, ayuda }) => {
          const activo = valores[campo];
          const ocupado = guardando === campo;
          return (
            <div
              key={campo}
              className="flex items-center justify-between gap-4 border-t border-[var(--user-color-border)] py-3 first:border-t-0"
            >
              <div>
                <p className="font-body text-sm font-semibold text-[var(--user-color-primary)]">{etiqueta}</p>
                <p className="mt-0.5 font-body text-xs text-[var(--user-color-muted)]">{ayuda}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={activo}
                aria-label={etiqueta}
                disabled={guardando !== null}
                onClick={() => void alternar(campo)}
                className={`relative inline-flex h-8 min-h-8 w-14 shrink-0 items-center rounded-full border px-1 transition focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--user-color-action)] disabled:cursor-wait ${
                  activo
                    ? "justify-end border-[var(--user-color-action)] bg-[var(--user-color-action)]"
                    : "justify-start border-[var(--user-color-border)] bg-[var(--user-color-surface-soft)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-flex size-6 items-center justify-center rounded-full bg-white text-[11px] font-bold ${
                    activo ? "text-[var(--user-color-action)]" : "text-[var(--user-color-muted)]"
                  }`}
                >
                  {ocupado ? "…" : activo ? "✓" : "○"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-2 min-h-5" role="status" aria-live="polite" aria-atomic="true">
        {aviso && <p className="font-body text-xs text-[var(--user-color-error)]">{aviso}</p>}
      </div>
    </div>
  );
}
