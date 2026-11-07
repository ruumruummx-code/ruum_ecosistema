"use client";
import { useRef, useState } from "react";
import { obtenerHeadersCsrfAsync } from "../../lib/csrf";
import { RESUMEN_SOPORTE } from "../../lib/promesa-soporte";
import { InformacionSoporte } from "./InformacionSoporte";
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
  const ticketRef = useRef<{ contenido: string; id: string } | null>(null);

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
      viaEmail: false
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
          msg: `Reporte registrado. Folio: ${folio}. Nuestro equipo dará seguimiento desde tu expediente. ${RESUMEN_SOPORTE}`,
          folio
        });
        setDescripcion("");
        setMotivo(MOTIVOS[0]);
        setViajeId(traslados.some(t => t.id === preseleccionado) ? preseleccionado! : "");
        return;
      }

      const contenido = JSON.stringify({ trasladoId: viajeId || null, motivo, descripcion: descripcion.trim() });
      if (ticketRef.current?.contenido !== contenido) ticketRef.current = { contenido, id: crypto.randomUUID() };
      const respuesta = await fetch("/api/soporte", {
        method: "POST", headers: await obtenerHeadersCsrfAsync({ "Content-Type": "application/json" }),
        body: JSON.stringify({ ...JSON.parse(contenido), id: ticketRef.current.id }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok || !datos.id) throw new Error(datos.error ?? "No se confirmó el ticket.");
      const folio = `SOP-${datos.id.toUpperCase()}`;
      setResultado({ ok: true, msg: `Tu consulta quedó registrada. Nuestro equipo la atenderá desde la bandeja de soporte. ${RESUMEN_SOPORTE}`, folio });
      ticketRef.current = null;
      setDescripcion("");
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
      <div className="sm:col-span-2"><InformacionSoporte /></div>

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
          Tu consulta se guardará con un folio. Para una incidencia operativa, selecciona el viaje, el tipo y el momento.
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
            <option value="">Consulta de soporte</option>
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


      </div>
    </form>
  );
}
