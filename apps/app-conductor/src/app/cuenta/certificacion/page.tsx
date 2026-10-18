"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Aviso, Button } from "@ruum/ui";
import {
  CARTA_DERECHOS_CONDUCTOR,
  COMPROMISOS_CONDUCTOR,
  ETIQUETA_NIVEL_CERTIFICACION,
  NIVELES_CERTIFICACION_SERVICIO,
  REQUISITOS_MINIMOS_CERTIFICACION,
} from "@ruum/shared/constants";
import { esActivoParaAsignacionMCE, puedeAscenderNivel } from "@ruum/shared/rules";
import { obtenerConfiguracionConductor, obtenerConductorActual, obtenerSolicitudIdActivaConductor, tieneDatosBancariosConductor } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import { alertaLicencia15Dias, esSmartphoneCompatible, evaluarChecklist } from "@/lib/certificacion";
import { CuentaHeader } from "../CuentaHeader";
import { DiditVerificationModal } from "@/app/registro/DiditVerificationModal";
import { iniciarVerificacionDidit } from "@ruum/api/services";
import { traducirErrorOperativo } from "@ruum/shared/utils";

const RUTA_POR_REQUISITO: Record<string, string> = {
  identificacion_oficial: "/cuenta/documentos",
  licencia_frente: "/cuenta/documentos",
  licencia_reverso: "/cuenta/documentos",
  constancia_situacion_fiscal: "/cuenta/documentos",
  documento_operativo: "/cuenta/documentos",
  cuenta_bancaria: "/cuenta/datos-bancarios",
  smartphone_compatible: "/cuenta/perfil",
  consentimiento_biometrico_geo: "/cuenta/documentos",
  consentimiento_antecedentes: "/cuenta/documentos",
  capacitacion_aprobada: "/cuenta/certificacion",
  evaluacion_practica_aprobada: "/cuenta/certificacion",
};

function ProgressRing({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.min(1, value / max);
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const color = pct === 1 ? "text-emerald-600" : pct >= 0.7 ? "text-amber-600" : "text-route-action";
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-14 shrink-0">
        <svg width={56} height={56} viewBox="0 0 56 56" className="-rotate-90" aria-hidden>
          <circle cx={28} cy={28} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-border/30" />
          <circle
            cx={28}
            cy={28}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className={color}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-black tabular-nums text-text-primary">
          {value}/{max}
        </span>
      </div>
    </div>
  );
}

export default function PaginaCertificacion() {
  const [cargando, setCargando] = useState(true);
  const [conductorId, setConductorId] = useState<string | null>(null);
  const [solicitudId, setSolicitudId] = useState<string | null>(null);
  const [licenciaVigencia, setLicenciaVigencia] = useState<string | null>(null);
  const [estado, setEstado] = useState("pendiente_verificacion");
  const [identidadOk, setIdentidadOk] = useState(false);
  const [licenciaOk, setLicenciaOk] = useState(false);
  const [constanciaOk, setConstanciaOk] = useState(false);
  const [cuentaBanco, setCuentaBanco] = useState(false);
  const [nivel, setNivel] = useState<1 | 2 | 3>(1);
  const [modalDidit, setModalDidit] = useState(false);
  const [urlDidit, setUrlDidit] = useState<string | null>(null);
  const [cargandoDidit, setCargandoDidit] = useState(false);
  const [errorDidit, setErrorDidit] = useState<string | null>(null);
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const [acordeones, setAcordeones] = useState<Record<string, boolean>>({});
  const [smartphoneOk] = useState(() => esSmartphoneCompatible());

  const toggleAcordeon = (clave: string) => {
    setAcordeones((prev) => ({ ...prev, [clave]: !prev[clave] }));
  };

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        if (!tieneSupabaseConfigurado()) return;
        const cliente = crearClienteNavegador();
        const c = await obtenerConductorActual(cliente);
        if (!vivo || !c) return;
        setConductorId(c.id);
        setEstado(c.estado);
        setLicenciaVigencia(c.licencia_vigencia ?? null);
        const cfg = await obtenerConfiguracionConductor(cliente, c.id).catch(() => null);
        const docs = cfg?.documentos ?? [];
        const aprobado = (t: string) => docs.some((d) => d.tipo === t && d.estado === "aprobado");
        setIdentidadOk(aprobado("identificacion_oficial"));
        setLicenciaOk(aprobado("licencia_frente") && aprobado("licencia_reverso"));
        setConstanciaOk(aprobado("constancia_situacion_fiscal"));
        const cuenta = await tieneDatosBancariosConductor(cliente, c.id).catch(() => false);
        setCuentaBanco(cuenta);
        const solicitudActivaId = await obtenerSolicitudIdActivaConductor(cliente).catch(() => null);
        if (solicitudActivaId) setSolicitudId(solicitudActivaId);
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => { vivo = false; };
  }, []);

  const checklist = evaluarChecklist({
    identificacionAprobada: identidadOk,
    licenciaAprobada: licenciaOk,
    licenciaVigencia,
    comprobanteDomicilio: true,
    constanciaFiscal: constanciaOk,
    cuentaBancariaPropia: cuentaBanco,
    smartphoneCompatible: smartphoneOk,
    consentimientoBiometricoGeo: identidadOk,
    consentimientoAntecedentes: true,
    capacitacionAprobada: false,
    evaluacionPracticaAprobada: false,
  });
  const completados = Object.values(checklist).filter(Boolean).length;
  const pendientes = REQUISITOS_MINIMOS_CERTIFICACION.filter((r) => !checklist[r.clave]);
  const siguiente = pendientes[0];
  const alertaLic = alertaLicencia15Dias(licenciaVigencia);
  const mce = esActivoParaAsignacionMCE({
    identidadValidada: identidadOk,
    licenciaValidada: licenciaOk,
    licenciaVigente: !!licenciaVigencia && (alertaLic.dias ?? -1) >= 0,
    capacitacionAprobada: false,
    evaluacionPracticaAprobada: false,
    pruebaManejoAprobada: false,
    estado,
  });
  const ascenso = puedeAscenderNivel({
    nivelActual: nivel,
    trasladosCompletados: 0,
    puntualidadPct: null,
    calidadEvidenciaPct: null,
    incidentesGravesImputables: 0,
    evaluacionComplementariaAprobada: false,
  });

  async function iniciarDidit() {
    if (!solicitudId) { setErrorDidit("Sin solicitud activa para verificar."); setModalDidit(true); return; }
    setModalDidit(true); setCargandoDidit(true); setErrorDidit(null);
    try {
      const cliente = crearClienteNavegador();
      const { url } = await iniciarVerificacionDidit(cliente, solicitudId);
      setUrlDidit(url);
    } catch (e) {
      setErrorDidit(traducirErrorOperativo(e, "No pudimos iniciar Didit."));
    } finally { setCargandoDidit(false); }
  }

  function irASiguiente() {
    if (!siguiente) return;
    window.location.href = RUTA_POR_REQUISITO[siguiente.clave] ?? "/cuenta/documentos";
  }

  if (cargando) return <div className="mx-auto max-w-md px-4 py-10 font-body text-sm text-text-secondary">Cargando certificación…</div>;

  const estadoActivo = mce.activo;
  const chipColor = estadoActivo ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : "bg-amber-500/10 text-amber-700 border-amber-500/20";

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-[calc(88px+env(safe-area-inset-bottom))]">
      {/* Header: título + chip de estado (sin banner de alerta independiente) */}
      <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-extrabold tracking-tight text-text-primary">Certificación Ruum</h1>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${chipColor}`}>
            {estadoActivo ? "Activo" : "Pendiente"}
          </span>
        </div>
      </header>

      {modalDidit && (
        <DiditVerificationModal isOpen={modalDidit} url={urlDidit} cargando={cargandoDidit} error={errorDidit}
          onCerrar={() => { setModalDidit(false); setUrlDidit(null); }} onReintentar={iniciarDidit} onFinalizar={() => { setModalDidit(false); }} />
      )}

      {/* Resumen de progreso — ProgressRing con completados/totales */}
      <div className="mt-5 px-4">
        <ProgressRing value={completados} max={10} />
        <p className="mt-2 font-body text-sm text-text-secondary">
          {completados} de 10 requisitos completados
        </p>
        <button
          type="button"
          onClick={() => setSheetAbierto(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 font-display text-xs font-bold text-route-action hover:bg-surface-elevated focus-visible:outline-none"
        >
          Ver todos
        </button>
      </div>

      {/* Tarjeta de Siguiente Acción (Next Best Action) */}
      {siguiente && (
        <div className="mt-5 px-4">
          <div className="rounded-xl border border-signal/40 bg-signal/5 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-signal text-slate-950">▶</span>
              <div className="flex-1 min-w-0">
                <p className="font-body text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                  Siguiente acción
                </p>
                <h3 className="mt-0.5 font-display text-sm font-bold text-text-primary leading-tight">
                  {siguiente.etiqueta}
                </h3>
                <button
                  type="button"
                  onClick={irASiguiente}
                  className="mt-3 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-signal px-3.5 py-1.5 font-display text-xs font-black text-slate-950 shadow-sm active:scale-[0.98] transition"
                >
                  Completar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!siguiente && completados === 10 && (
        <div className="mt-5 px-4">
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4 shadow-sm">
            <p className="font-display text-sm font-bold text-emerald-700">¡Certificación completa!</p>
            <p className="mt-1 font-body text-xs text-emerald-600">Cumples todos los requisitos para operar.</p>
          </div>
        </div>
      )}

      {/* Acordeones colapsados por defecto */}
      <section className="mt-5 px-4 space-y-2">
        {/* Capacitación MCE */}
        <div className="rounded-xl border border-border/20 bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => toggleAcordeon("mce")}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface/50 focus-visible:outline-none"
          >
            <span className="font-display text-sm font-bold text-text-primary flex items-center gap-1.5">
              Capacitación y evaluación (MCE)
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={`text-text-tertiary shrink-0 transition-transform ${acordeones.mce ? "rotate-180" : ""}`} aria-hidden>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {acordeones.mce && (
            <div className="border-t border-border/10 px-4 py-3">
              <p className="font-body text-xs text-text-secondary">
                Filtro progresivo: cursos obligatorios → evaluación práctica de evidencia → prueba de manejo.
                Solo entonces pasas a Activo.
              </p>
              <ol className="mt-2 grid gap-1 font-body text-sm text-text-secondary">
                <li>1. Cursos obligatorios — pendiente</li>
                <li>2. Evaluación práctica de evidencia — pendiente</li>
                <li>3. Prueba práctica de manejo — pendiente</li>
              </ol>
              {!mce.activo && (
                <p className="mt-2 font-body text-xs text-text-tertiary">
                  Motivo: {mce.motivo}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Nivel de certificación */}
        <div className="rounded-xl border border-border/20 bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => toggleAcordeon("nivel")}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface/50 focus-visible:outline-none"
          >
            <span className="font-display text-sm font-bold text-text-primary flex items-center gap-1.5">
              Nivel de certificación
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={`text-text-tertiary shrink-0 transition-transform ${acordeones.nivel ? "rotate-180" : ""}`} aria-hidden>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {acordeones.nivel && (
            <div className="border-t border-border/10 px-4 py-3">
              <p className="font-body text-xs text-text-secondary">
                Nivel actual: <span className="font-display text-sm font-bold text-text-primary">{ETIQUETA_NIVEL_CERTIFICACION[nivel]}</span>
              </p>
              <div className="mt-2 grid gap-1">
                {NIVELES_CERTIFICACION_SERVICIO.map((n) => (
                  <div key={n.nivel} className={`rounded-lg border p-2 ${n.nivel === nivel ? "border-signal bg-signal/5" : "border-border/60 bg-surface/50"}`}>
                    <p className={`font-display text-[10px] font-bold ${n.nivel === nivel ? "text-signal" : "text-text-tertiary"}`}>
                      Nivel {n.nivel} · {n.denominacion}
                    </p>
                    <p className="font-body text-[10px] text-text-tertiary leading-snug">{n.descripcion}</p>
                  </div>
                ))}
              </div>
              {!ascenso.puede && (
                <p className="mt-2 font-body text-xs text-text-tertiary">
                  Para ascender te falta: {ascenso.faltantes.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Carta de derechos */}
        <div className="rounded-xl border border-border/20 bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => toggleAcordeon("derechos")}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface/50 focus-visible:outline-none"
          >
            <span className="font-display text-sm font-bold text-text-primary flex items-center gap-1.5">
              Carta de derechos del conductor
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={`text-text-tertiary shrink-0 transition-transform ${acordeones.derechos ? "rotate-180" : ""}`} aria-hidden>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {acordeones.derechos && (
            <div className="border-t border-border/10 px-4 py-3">
              <ul className="grid gap-1 font-body text-xs text-text-secondary">
                {CARTA_DERECHOS_CONDUCTOR.map((d) => (
                  <li key={d} className="flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">•</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Compromisos */}
        <div className="rounded-xl border border-border/20 bg-surface overflow-hidden">
          <button
            type="button"
            onClick={() => toggleAcordeon("compromisos")}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface/50 focus-visible:outline-none"
          >
            <span className="font-display text-sm font-bold text-text-primary flex items-center gap-1.5">
              Compromisos del conductor
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={`text-text-tertiary shrink-0 transition-transform ${acordeones.compromisos ? "rotate-180" : ""}`} aria-hidden>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {acordeones.compromisos && (
            <div className="border-t border-border/10 px-4 py-3">
              <ul className="grid gap-1 font-body text-xs text-text-secondary">
                {COMPROMISOS_CONDUCTOR.map((d) => (
                  <li key={d} className="flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">•</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* BottomSheet: listado completo de requisitos ✅ / ⬜ */}
      {sheetAbierto && (
        <dialog
          open
          className="fixed inset-0 z-50 m-0 flex h-[100dvh] w-[100vw] max-h-none max-w-none items-end justify-center border-0 bg-transparent p-0"
          aria-modal="true"
          aria-labelledby="titulo-requisitos-sheet"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setSheetAbierto(false)}
            aria-label="Cerrar diálogo"
          />
          <div className="relative w-full max-w-md rounded-t-[1.75rem] border-t border-border/40 bg-surface-elevated p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-2xl animate-slideUp">
            <div className="mx-auto h-1 w-10 rounded-full bg-border/60 mb-4" aria-hidden />
            <h2 id="titulo-requisitos-sheet" className="font-display text-base font-black text-text-primary">
              Requisitos de certificación
            </h2>
            <p className="mt-1 font-body text-sm leading-6 text-text-secondary">
              {completados} de 10 completados
            </p>
            <ul className="mt-3 divide-y divide-border/10">
              {REQUISITOS_MINIMOS_CERTIFICACION.map((r) => (
                <li key={r.clave} className="flex items-center justify-between gap-2 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span aria-hidden>{checklist[r.clave] ? "✅" : "⬜"}</span>
                    <span className={`font-body text-sm leading-tight ${checklist[r.clave] ? "text-text-primary" : "text-text-tertiary"}`}>
                      {r.etiqueta}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold ${checklist[r.clave] ? "text-emerald-600" : "text-text-tertiary"}`}>
                    {checklist[r.clave] ? "Listo" : "Pendiente"}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setSheetAbierto(false)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-surface px-4 py-2.5 font-display text-xs font-bold text-text-secondary transition hover:bg-surface-elevated focus-visible:outline-none"
              >
                Cerrar
              </button>
            </div>
          </div>
        </dialog>
      )}

      {conductorId && <p className="mt-4 px-4 font-body text-[11px] text-text-tertiary">
        Conductor {conductorId.slice(0, 8)}… · filtro MAIC activo: sin identidad+licencia vigentes no recibes ofertas.
      </p>}
    </div>
  );
}
