"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Aviso, MobileButton } from "@ruum/ui";
import { reportarIncidencia } from "@ruum/api/services";
import { ETIQUETA_TIPO_INCIDENCIA } from "@ruum/shared/constants";
import type { MomentoIncidencia, TipoIncidencia } from "@ruum/shared/types";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { registrarEventoUx } from "../../lib/analytics";
import { CONTACTOS_SOPORTE_USUARIO } from "../../lib/contactos-soporte";

type Props = {
  traslados: { id: string; label: string }[];
  preseleccionado?: string;
  emailUsuario?: string | null;
  motivoInicial?: string;
  descripcionInicial?: string;
  onEnviandoChange?: (enviando: boolean) => void;
};

const MOTIVOS = [
  "Reportar problema con un viaje",
  "Reportar daño o incidente",
  "Ayuda con pagos o facturación",
  "Dudas con evidencia fotográfica",
  "Cancelaciones o reprogramación",
  "Consulta general u otro",
] as const;

const HORARIO_SOPORTE = {
  dias: "Lunes a Viernes",
  horas: "8:00–20:00 (hora CDMX)",
  sla: "<30 min",
  slaFueraHorario: "<2 horas",
};

const CORREO_SOPORTE = CONTACTOS_SOPORTE_USUARIO.soporte.correo.valor;

export function FormularioSoporte({ traslados, preseleccionado, emailUsuario, motivoInicial, descripcionInicial, onEnviandoChange }: Props) {
  const motivoValido = motivoInicial && (MOTIVOS as readonly string[]).includes(motivoInicial) ? motivoInicial : undefined;
  const [motivo, setMotivo] = useState<string>(motivoValido ?? MOTIVOS[0] ?? "Otro");
  const [viajeId, setViajeId] = useState(traslados.some(t => t.id === preseleccionado) ? preseleccionado! : "");
  const [tipo, setTipo] = useState<TipoIncidencia | "">("");
  const [momento, setMomento] = useState<MomentoIncidencia | "">("");
  const [descripcion, setDescripcion] = useState(descripcionInicial ?? "");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string; folio?: string; correo?: string } | null>(null);

  const envioRef = useRef(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (envioRef.current) return;
    if (descripcion.trim().length < 10) {
      setResultado({
        ok: false,
        msg: "Describe con al menos 10 caracteres para que podamos ayudarte."
      });
      return;
    }
    if (viajeId && !traslados.some(t => t.id === viajeId)) {
      setResultado({ ok: false, msg: "Selecciona un viaje válido de tu cuenta." });
      return;
    }
    if (viajeId && tipo && !momento) {
      setResultado({ ok: false, msg: "Selecciona en qué momento ocurrió la incidencia." });
      return;
    }
    envioRef.current = true;
    setEnviando(true);
    onEnviandoChange?.(true);
    setResultado(null);
    registrarEventoUx("soporte_enviado", {
      motivo,
      tiene_viaje: Boolean(viajeId),
      viaEmail: !viajeId || !tipo || !tieneSupabaseConfigurado()
    });

    try {
      // Intento 1: Registro formal de incidencia en Supabase si hay viaje seleccionado
      if (tieneSupabaseConfigurado() && viajeId && tipo && momento) {
        const cliente = crearClienteNavegador();

        const data = await reportarIncidencia(
          cliente,
          viajeId,
          tipo,
          momento,
          `[Soporte app-usuario] Motivo: ${motivo}\n\n${descripcion.trim()}`
        );

        const folio = `INC-${data.id.slice(0, 8).toUpperCase()}`;
        setResultado({
          ok: true,
          msg: `Reporte registrado. Folio: ${folio}. Nuestro equipo dará seguimiento desde tu expediente. Tiempo estimado: ${HORARIO_SOPORTE.sla} (${HORARIO_SOPORTE.dias} ${HORARIO_SOPORTE.horas}) o ${HORARIO_SOPORTE.slaFueraHorario} fuera de horario.`,
          folio
        });
        setDescripcion("");
        setMotivo(MOTIVOS[0]);
        setViajeId(traslados.some(t => t.id === preseleccionado) ? preseleccionado! : "");
        return;
      }

      // Fallback: mailto prellenado si es consulta general sin viaje asociado
      const subject = encodeURIComponent(`[Ruum Ruum Soporte] ${motivo}${viajeId ? ` · Viaje: ${viajeId.slice(0, 8).toUpperCase()}` : ""}`);
      const body = encodeURIComponent(
        `Motivo: ${motivo}\n` +
        `Viaje: ${viajeId || "Sin viaje vinculado (consulta general)"}\n` +
        `Correo usuario: ${emailUsuario || "No proporcionado"}\n\n` +
        `Tipo de incidencia: ${tipo ? ETIQUETA_TIPO_INCIDENCIA[tipo] : "Consulta de soporte"}\nMomento: ${momento || "No indicado"}\nDescripción:\n${descripcion.trim()}\n\n` +
        `---\n` +
        `Enviado desde app-usuario Ruum Ruum\n` +
        `Horario soporte: ${HORARIO_SOPORTE.dias} ${HORARIO_SOPORTE.horas}\n` +
        `SLA: ${HORARIO_SOPORTE.sla} en horario, ${HORARIO_SOPORTE.slaFueraHorario} fuera de horario`
      );

      const mailtoUrl = `mailto:${CORREO_SOPORTE}?subject=${subject}&body=${body}`;

      setResultado({
        ok: false,
        msg: "Tu reporte aún no se ha enviado. Abre tu aplicación de correo y envía el mensaje preparado; si no abre, copia la descripción y escribe a " + CORREO_SOPORTE + ".",
        correo: mailtoUrl,
      });
    } catch (err) {
      console.warn("[soporte] Error al reportar incidencia:", err);
      setResultado({
        ok: false,
        msg: "No pudimos confirmar el registro del reporte. Conservamos tus datos para reintentar. Puedes contactar a soporte por correo; verifica si ya existe un folio antes de reenviar.",
        correo: "mailto:" + CORREO_SOPORTE + "?subject=" + encodeURIComponent("[Ruum Ruum Soporte] " + motivo) + "&body=" + encodeURIComponent("Viaje: " + viajeId + "\nCorreo usuario: " + (emailUsuario || "No proporcionado") + "\n\n" + descripcion.trim()),
      });
    } finally {
      envioRef.current = false;
      setEnviando(false);
      onEnviandoChange?.(false);
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
              <span className="font-bold">Tiempo estimado de respuesta:</span> {HORARIO_SOPORTE.sla} en horario, {HORARIO_SOPORTE.slaFueraHorario} fuera de horario
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
          disabled={enviando}
          onChange={(e) => { setMotivo(e.target.value); setResultado(null); }}
          className="w-full rounded-2xl border border-[#d7e1ee] bg-white dark:border-[#1a3a5c] dark:bg-[#0a2342] px-3.5 py-3 text-[14px] font-medium text-[#0a2342] dark:text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-[#0066ff]"
          required
        >
          {MOTIVOS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <span className="text-[12px] text-[#4e5f80] dark:text-[#a8b5cc]">
          Las consultas se preparan por correo. Para registrar una incidencia operativa, selecciona el viaje, el tipo y el momento.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-bold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]">
          Viaje relacionado <span className="text-[#4e5f80] dark:text-[#a8b5cc] font-normal">(opcional)</span>
        </span>
        <select
          value={viajeId}
          disabled={enviando}
          onChange={(e) => { setViajeId(e.target.value); setTipo(""); setMomento(""); setResultado(null); }}
          className="w-full rounded-2xl border border-[#d7e1ee] bg-white dark:border-[#1a3a5c] dark:bg-[#0a2342] px-3.5 py-3 text-[14px] font-medium text-[#0a2342] dark:text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-1 focus-visible:outline-[#0066ff]"
        >
          <option value="">Sin viaje / consulta general</option>
          {traslados.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </label>

      {viajeId && <>
        <label className="flex flex-col gap-1.5">Tipo de incidencia
          <select disabled={enviando} value={tipo} onChange={e => { setTipo(e.target.value as TipoIncidencia | ""); setResultado(null); }} className="rounded-xl border p-3 bg-[var(--ruum-surface)]">
            <option value="">Consulta de soporte por correo</option>
            {Object.entries(ETIQUETA_TIPO_INCIDENCIA).filter(([valor]) => valor !== "conflicto_evidencia").map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </select>
        </label>
        {tipo && <label className="flex flex-col gap-1.5">Momento de la incidencia
          <select disabled={enviando} value={momento} onChange={e => { setMomento(e.target.value as MomentoIncidencia); setResultado(null); }} required className="rounded-xl border p-3 bg-[var(--ruum-surface)]">
            <option value="">Selecciona el momento</option>
            <option value="recoleccion">Recolección</option><option value="durante_traslado">Durante el traslado</option><option value="entrega">Entrega</option><option value="post_cierre">Después del cierre</option>
          </select>
        </label>}
      </>}

      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-[12px] font-bold uppercase tracking-wider text-[#4e5f80] dark:text-[#a8b5cc]">
          Descripción <span className="text-[#9a2637] dark:text-[#ff6b7a]">*</span>
        </span>
        <textarea
          rows={5}
          value={descripcion}
          disabled={enviando}
          onChange={(e) => { setDescripcion(e.target.value); setResultado(null); }}
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
            {resultado.correo && <a href={resultado.correo} className="mt-3 inline-block underline">Abrir correo para enviar reporte</a>}
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
