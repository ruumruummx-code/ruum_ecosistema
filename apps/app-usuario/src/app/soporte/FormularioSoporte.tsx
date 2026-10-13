"use client";
import { useState } from "react";
import Link from "next/link";
import { Aviso, MobileButton } from "@ruum/ui";
import { reportarIncidencia } from "@ruum/api/services";
import type { TipoIncidencia } from "@ruum/shared/types";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { registrarEventoUx } from "../../lib/analytics";

type Props = {
  traslados: { id: string; label: string }[];
  preseleccionado?: string;
  emailUsuario?: string | null;
  motivoInicial?: string;
};

const MOTIVOS = [
  "Reportar problema con un viaje",
  "Reportar daño o incidente",
  "Ayuda con pagos o facturación",
  "Dudas con evidencia fotográfica",
  "Cancelaciones o reprogramación",
  "Consulta general u otro",
] as const;

/* TipoIncidencia es un enum cerrado en BD (sin "consulta_general"). Los motivos
   de soporte que no son incidencias operativas se registran con el tipo más
   cercano y el motivo real siempre viaja en la descripción ([Soporte
   app-usuario] Motivo: …). Sin viaje seleccionado la consulta sale por correo
   y no toca esta taxonomía. */
const MOTIVO_A_TIPO_INCIDENCIA: Record<string, TipoIncidencia> = {
  "Reportar daño o incidente": "dano_previo_relevante",
  "Reportar problema con un viaje": "contacto_no_localizado",
  "Ayuda con pagos o facturación": "documentacion_incompleta",
  "Dudas con evidencia fotográfica": "dano_no_reportado",
  "Cancelaciones o reprogramación": "contacto_no_localizado",
  "Consulta general u otro": "perdida_conectividad",
};

const HORARIO_SOPORTE = {
  dias: "Lunes a Viernes",
  horas: "8:00–20:00 (hora CDMX)",
  sla: "<30 min",
  slaFueraHorario: "<2 horas",
};

const CORREO_SOPORTE = "soporte@ruumruum.mx";

export function FormularioSoporte({ traslados, preseleccionado, emailUsuario, motivoInicial }: Props) {
  const motivoValido = motivoInicial && (MOTIVOS as readonly string[]).includes(motivoInicial) ? motivoInicial : undefined;
  const [motivo, setMotivo] = useState<string>(motivoValido ?? MOTIVOS[0] ?? "Otro");
  const [viajeId, setViajeId] = useState(preseleccionado ?? "");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string; folio?: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (descripcion.trim().length < 10) {
      setResultado({ 
        ok: false, 
        msg: "Describe con al menos 10 caracteres para que podamos ayudarte." 
      });
      return;
    }
    setEnviando(true);
    setResultado(null);
    registrarEventoUx("soporte_enviado", { 
      motivo, 
      tiene_viaje: Boolean(viajeId),
      viaEmail: !tieneSupabaseConfigurado()
    });

    try {
      // Intento 1: Registro formal de incidencia en Supabase si hay viaje seleccionado
      if (tieneSupabaseConfigurado() && viajeId) {
        const cliente = crearClienteNavegador();
        const tipo: TipoIncidencia = MOTIVO_A_TIPO_INCIDENCIA[motivo] ?? "dano_previo_relevante";
        
        const data = await reportarIncidencia(
          cliente,
          viajeId,
          tipo,
          "durante_traslado",
          `[Soporte app-usuario] Motivo: ${motivo}\n\n${descripcion.trim()}`
        );

        const folio = `INC-${data.id.slice(0, 8).toUpperCase()}`;
        setResultado({ 
          ok: true, 
          msg: `¡Ticket e incidencia registrados en Torre de Control! Folio: ${folio}. Nuestro equipo dará seguimiento directo desde tu expediente en ${HORARIO_SOPORTE.sla} (${HORARIO_SOPORTE.dias} ${HORARIO_SOPORTE.horas}) o ${HORARIO_SOPORTE.slaFueraHorario} fuera de horario.`,
          folio
        });
        setDescripcion("");
        setMotivo(MOTIVOS[0]);
        setViajeId(preseleccionado ?? "");
        return;
      }

      // Fallback: mailto prellenado si es consulta general sin viaje asociado
      const subject = encodeURIComponent(`[Ruum Ruum Soporte] ${motivo}${viajeId ? ` · Viaje: ${viajeId.slice(0, 8).toUpperCase()}` : ""}`);
      const body = encodeURIComponent(
        `Motivo: ${motivo}\n` +
        `Viaje: ${viajeId || "Sin viaje vinculado (consulta general)"}\n` +
        `Correo usuario: ${emailUsuario || "No proporcionado"}\n\n` +
        `Descripción:\n${descripcion.trim()}\n\n` +
        `---\n` +
        `Enviado desde app-usuario Ruum Ruum\n` +
        `Horario soporte: ${HORARIO_SOPORTE.dias} ${HORARIO_SOPORTE.horas}\n` +
        `SLA: ${HORARIO_SOPORTE.sla} en horario, ${HORARIO_SOPORTE.slaFueraHorario} fuera de horario`
      );
      
      const mailtoUrl = `mailto:${CORREO_SOPORTE}?subject=${subject}&body=${body}`;
      
      if (typeof window !== "undefined" && window.location) {
        window.location.href = mailtoUrl;
      }
      
      setResultado({ 
        ok: true, 
        msg: `Abrimos tu cliente de correo con el mensaje prellenado. Si no se abrió automáticamente, escribe a ${CORREO_SOPORTE}. Respondemos en ${HORARIO_SOPORTE.sla} (${HORARIO_SOPORTE.dias} ${HORARIO_SOPORTE.horas}).`
      });
    } catch (err) {
      console.warn("[soporte] Error al reportar incidencia, recurriendo a mailto:", err);
      // Fallback a mailto si la inserción en base de datos fallara (por ejemplo, falta de conectividad o permisos)
      const subject = encodeURIComponent(`[Ruum Ruum Soporte] ${motivo}${viajeId ? ` · Viaje: ${viajeId.slice(0, 8).toUpperCase()}` : ""}`);
      const body = encodeURIComponent(
        `Motivo: ${motivo}\n` +
        `Viaje: ${viajeId || "—"}\n` +
        `Correo usuario: ${emailUsuario || "No proporcionado"}\n\n` +
        `Descripción:\n${descripcion.trim()}`
      );
      if (typeof window !== "undefined" && window.location) {
        window.location.href = `mailto:${CORREO_SOPORTE}?subject=${subject}&body=${body}`;
      }
      setResultado({
        ok: true,
        msg: `Abrimos tu cliente de correo para enviar tu reporte a ${CORREO_SOPORTE}. Nos pondremos en contacto contigo a la brevedad.`
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      {/* SLA y horario - SIEMPRE VISIBLE */}
      <div className="sm:col-span-2 rounded-2xl border border-[#c8dcf8] bg-[#edf4fe] dark:border-[#1d4576] dark:bg-[#0f2d52]/50 p-4">
        <div className="flex items-start gap-3">
          <svg className="size-6 text-[#104ca0] dark:text-[#6ba8ff] flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <div>
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#104ca0] dark:text-[#6ba8ff]">Atención al cliente</p>
            <p className="mt-1 text-[13.5px] text-[#0a2342] dark:text-white">
              <span className="font-bold">Horario:</span> {HORARIO_SOPORTE.dias} {HORARIO_SOPORTE.horas}
            </p>
            <p className="mt-0.5 text-[13.5px] text-[#0a2342] dark:text-white">
              <span className="font-bold">Tiempo de respuesta:</span> {HORARIO_SOPORTE.sla} en horario, {HORARIO_SOPORTE.slaFueraHorario} fuera de horario
            </p>
            <p className="mt-0.5 text-[12px] text-[#4e5f80] dark:text-[#a8b5cc]">
              Correo: <span className="font-semibold text-[#0a2342] dark:text-white">{CORREO_SOPORTE}</span>
            </p>
          </div>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-bold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]">
          Motivo <span className="text-[#9a2637] dark:text-[#ff6b7a]">*</span>
        </span>
        <select 
          value={motivo} 
          onChange={(e) => setMotivo(e.target.value)} 
          className="w-full rounded-2xl border border-[#d7e1ee] bg-white dark:border-[#1a3a5c] dark:bg-[#0a2342] px-3.5 py-3 text-[14px] font-medium text-[#0a2342] dark:text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-[#0066ff]"
          required
        >
          {MOTIVOS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <span className="text-[12px] text-[#4e5f80] dark:text-[#a8b5cc]">
          Las consultas generales sin viaje se atienden por correo; con viaje se abre un folio de seguimiento.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-bold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]">
          Viaje relacionado <span className="text-[#4e5f80] dark:text-[#a8b5cc] font-normal">(opcional)</span>
        </span>
        <select 
          value={viajeId} 
          onChange={(e) => setViajeId(e.target.value)} 
          className="w-full rounded-2xl border border-[#d7e1ee] bg-white dark:border-[#1a3a5c] dark:bg-[#0a2342] px-3.5 py-3 text-[14px] font-medium text-[#0a2342] dark:text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-[#0066ff]"
        >
          <option value="">Sin viaje / consulta general</option>
          {traslados.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-[12px] font-bold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]">
          Descripción <span className="text-[#9a2637] dark:text-[#ff6b7a]">*</span>
        </span>
        <textarea
          rows={5}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Describe lo que pasó con detalle. Incluye: fecha, hora aproximada, ubicación, y cualquier evidencia relevante (fotos, testigos). Mientras más información proporciones, más rápido podremos resolver tu caso."
          className="w-full rounded-2xl border border-[#d7e1ee] bg-white dark:border-[#1a3a5c] dark:bg-[#0a2342] px-3.5 py-3 text-[14px] font-medium text-[#0a2342] dark:text-white placeholder:text-[#4e5f80] dark:placeholder:text-[#a8b5cc] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-[#0066ff] resize-none"
          required
          minLength={10}
          maxLength={1000}
        />
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-[#4e5f80] dark:text-[#a8b5cc]">
            {descripcion.length}/1000 caracteres
          </span>
          {descripcion.length > 0 && descripcion.length < 10 && (
            <span className="text-[12px] font-semibold text-[#9a2637] dark:text-[#ff6b7a]">Mínimo 10 caracteres</span>
          )}
        </div>
      </label>

      <div className="sm:col-span-2">
        <MobileButton 
          type="submit" 
          disabled={enviando || descripcion.trim().length < 10}
          loading={enviando}
          className="w-full sm:w-auto"
        >
          {enviando ? "Enviando…" : "Enviar a soporte"}
        </MobileButton>
        
        {/* Mensaje de éxito con folio destacado */}
        {resultado && (
          <div className="mt-4">
            {resultado.folio ? (
              <Aviso tono="success">
                <p className="text-sm">
                  <span className="font-bold">¡Mensaje recibido con éxito!</span>
                  <br />
                  Folio: <span className="font-mono font-bold text-[#08705f] dark:text-[#4dd9a3]">{resultado.folio}</span>
                  <br />
                  {resultado.msg}
                </p>
              </Aviso>
            ) : (
              <Aviso tono={resultado.ok ? "success" : "danger"}>
                {resultado.msg}
              </Aviso>
            )}
          </div>
        )}
        
        {/* Ayuda adicional */}
        {!resultado && (
          <p className="mt-4 text-xs leading-5 text-[#4e5f80] dark:text-[#a8b5cc]">
            <span className="font-semibold text-[#0a2342] dark:text-white">¿Necesitas ayuda inmediata?</span>{" "}
            Si es una emergencia con daño o seguridad durante el traslado, usa el{" "}
            <Link href={viajeId ? `/viajes/${viajeId}#chat-conductor` : "/mis-viajes"} className="font-semibold text-[#0066ff] dark:text-[#4d94ff] underline-offset-2 hover:underline">
              chat del Pasaporte Digital
            </Link>.
          </p>
        )}
      </div>
    </form>
  );
}
