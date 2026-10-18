"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Aviso } from "@ruum/ui";
import { crearLlamadaEnmascarada } from "@ruum/api/services";
import { chatDisponible } from "@ruum/shared/rules";
import type { Database } from "@ruum/shared/types";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../lib/supabase-browser";
import { iniciales } from "./cuenta/cuenta-utils";

type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];

interface ConductorAsignadoProps {
  trasladoId: string;
  estado: EstadoTraslado;
  nombre: string;
  fotoUrl: string | null;
  evidencia?: ReactNode;
  compacto?: boolean;
}

function IconoChat() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H12l-4.5 3v-3A2.5 2.5 0 0 1 5 12.5v-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 8.5h7M8.5 11.5h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconoTelefono() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.2 4.5 9.5 4a1.3 1.3 0 0 1 1.5.8l1.1 3a1.3 1.3 0 0 1-.4 1.4l-1.5 1.2a12.7 12.7 0 0 0 4.4 4.4l1.2-1.5a1.3 1.3 0 0 1 1.4-.4l3 1.1a1.3 1.3 0 0 1 .8 1.5l-.5 2.3a1.8 1.8 0 0 1-2 1.4A16.4 16.4 0 0 1 4.8 6.5a1.8 1.8 0 0 1 1.4-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ConductorAsignado({ trasladoId, estado, nombre, fotoUrl, evidencia, compacto = false }: ConductorAsignadoProps) {
  // "CO" conserva el respaldo histórico de este avatar (canónico en cuenta-utils).
  const siglas = iniciales(nombre, "CO");
  const [llamando, setLlamando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const disponible = chatDisponible(estado);

  async function manejarLlamada() {
    if (!tieneSupabaseConfigurado()) {
      setError("Supabase no está configurado. No se puede iniciar la llamada.");
      return;
    }

    setLlamando(true);
    setError(null);

    try {
      const numero = await crearLlamadaEnmascarada(crearClienteNavegador(), trasladoId);
      window.location.href = `tel:${numero}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos iniciar la llamada.");
    } finally {
      setLlamando(false);
    }
  }

  if (compacto) {
    return <section id="assignedDriverCommunication" aria-label="Conductor asignado" className="home-driver">
      <span className="home-driver-avatar" aria-hidden="true">
        {fotoUrl ? <Image src={fotoUrl} alt="" width={36} height={36} unoptimized /> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></svg>}
      </span>
      <div><p>Tu conductor</p><h3 title={nombre}>{nombre}</h3></div>
      <button type="button" onClick={manejarLlamada} disabled={!disponible || llamando} aria-label={llamando ? `Conectando con ${nombre}` : `Llamar a ${nombre}`} className="home-call"><IconoTelefono /></button>
      {error && <p role="alert" className="home-call-error">{error}</p>}
    </section>;
  }

  return (
    <section
      id="assignedDriverCommunication"
      aria-label="Conductor asignado"
      className="rounded-2xl border border-[var(--user-color-border)] bg-[var(--user-color-surface)] p-4 shadow-xs transition  "
    >
      <div className="flex items-center gap-3">
        <div
          className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8fafa] font-bold text-sm text-[#00707a]  dark:text-[#4dd9a3]"
          aria-hidden={fotoUrl ? undefined : true}
        >
          {fotoUrl ? (
            <Image src={fotoUrl} alt={`Foto de ${nombre}`} width={56} height={56} className="size-14 object-cover" unoptimized />
          ) : (
            <span>{siglas}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[var(--user-color-muted)] ">
            Conductor asignado
          </p>
          <h2 id="conductor-asignado" className="truncate text-[16px] font-bold text-[var(--user-color-primary)] ">
            {nombre}
          </h2>
        </div>
      </div>

      <div className={`mt-4 grid ${evidencia ? "grid-cols-[repeat(2,minmax(0,1fr))_auto]" : "grid-cols-2"} gap-2`}>
        <Link
          href={`/viajes/${trasladoId}#chat-conductor`}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d7e1ee] bg-[var(--user-color-surface)] px-3 text-[14px] font-bold text-[var(--user-color-primary)] shadow-2xs transition hover:bg-[#f6f8fb] active:scale-[0.98] dark:border-[#2d4f73]  "
          aria-label={`Abrir chat con ${nombre}`}
        >
          <IconoChat />
          <span>Chat</span>
        </Link>
        <button
          type="button"
          onClick={manejarLlamada}
          disabled={!disponible || llamando}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d7e1ee] bg-[var(--user-color-surface)] px-3 text-[14px] font-bold text-[var(--user-color-primary)] shadow-2xs transition hover:bg-[#f6f8fb] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 dark:border-[#2d4f73]  "
          aria-label={`Llamar a ${nombre}`}
        >
          <IconoTelefono />
          <span>{llamando ? "Conectando…" : "Llamar"}</span>
        </button>
        {evidencia}
      </div>

      {error && <div className="mt-3"><Aviso tono="danger">{error}</Aviso></div>}
    </section>
  );
}
