"use client";

import { useEffect, useState } from "react";
import { Aviso, Button, Card } from "@ruum/ui";
import {
  CARTA_DERECHOS_CONDUCTOR,
  COMPROMISOS_CONDUCTOR,
  ETIQUETA_NIVEL_CERTIFICACION,
  NIVELES_CERTIFICACION_SERVICIO,
  REQUISITOS_MINIMOS_CERTIFICACION,
} from "@ruum/shared/constants";
import { esActivoParaAsignacionMCE, puedeAscenderNivel } from "@ruum/shared/rules";
import { obtenerConfiguracionConductor, obtenerConductorActual } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import { alertaLicencia15Dias, esSmartphoneCompatible, evaluarChecklist } from "@/lib/certificacion";
import { CuentaHeader } from "../CuentaHeader";
import { DiditVerificationModal } from "@/app/registro/DiditVerificationModal";
import { iniciarVerificacionDidit } from "@ruum/api/services";
import { traducirErrorOperativo } from "@ruum/shared/utils";

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
  const [smartphoneOk] = useState(() => esSmartphoneCompatible());

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
        const { data: banco } = await cliente.from("datos_bancarios_conductor").select("id").eq("conductor_id", c.id).maybeSingle();
        setCuentaBanco(!!banco);
        // Solicitud para reintentar Didit
        const { data: ses } = await cliente.auth.getUser();
        if (ses.user) {
          const { data: sol } = await cliente.from("solicitudes_conductor").select("id").eq("auth_user_id", ses.user.id).order("actualizado_en", { ascending: false }).limit(1).maybeSingle();
          if (sol) setSolicitudId(sol.id);
        }
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
    comprobanteDomicilio: true, // se captura en registro (domicilio + CP validado)
    constanciaFiscal: constanciaOk,
    cuentaBancariaPropia: cuentaBanco,
    smartphoneCompatible: smartphoneOk,
    consentimientoBiometricoGeo: identidadOk, // Didit exige consentimiento expreso previo
    consentimientoAntecedentes: true, // checkbox obligatorio del registro
    capacitacionAprobada: false,
    evaluacionPracticaAprobada: false,
  });
  const pendientes = REQUISITOS_MINIMOS_CERTIFICACION.filter((r) => !checklist[r.clave]);
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

  if (cargando) return <div className="mx-auto max-w-3xl px-4 py-10 font-body text-sm text-text-secondary">Cargando certificación…</div>;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <CuentaHeader titulo="Certificación Ruum" descripcion="Modelo 11 — identidad validada con Didit, capacitación MCE y nivel de servicio." />
      {modalDidit && (
        <DiditVerificationModal isOpen={modalDidit} url={urlDidit} cargando={cargandoDidit} error={errorDidit}
          onCerrar={() => { setModalDidit(false); setUrlDidit(null); }} onReintentar={iniciarDidit} onFinalizar={() => { setModalDidit(false); }} />
      )}

      {alertaLic.activa && <div className="mt-5"><Aviso tono={alertaLic.dias !== null && alertaLic.dias < 0 ? "danger" : "atencion"}>{alertaLic.mensaje}</Aviso></div>}
      {!mce.activo && <div className="mt-5"><Aviso tono="atencion">Aún no estás Activo para asignación (MCE): {mce.motivo}. Completa los pendientes.</Aviso></div>}

      <Card className="mt-6 p-5">
        <h2 className="font-display text-lg font-bold">11.2 · Requisitos mínimos ({Object.values(checklist).filter(Boolean).length}/10)</h2>
        <ul className="mt-3 grid gap-2">
          {REQUISITOS_MINIMOS_CERTIFICACION.map((r) => (
            <li key={r.clave} className="flex items-center gap-2 font-body text-sm">
              <span aria-hidden>{checklist[r.clave] ? "✅" : "⬜"}</span>
              <span className={checklist[r.clave] ? "text-text-primary" : "text-text-tertiary"}>{r.etiqueta}</span>
              {r.bloqueante && <span className="text-[11px] font-bold text-red-500">· bloqueante</span>}
            </li>
          ))}
        </ul>
        {pendientes.length > 0 && <p className="mt-3 font-body text-xs text-text-tertiary">Pendientes: {pendientes.map((p) => p.etiqueta).join(", ")}</p>}
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="font-display text-lg font-bold">11.3 · Validación de identidad y documentos (Didit)</h2>
        <p className="mt-1 font-body text-sm text-text-tertiary">Identidad + licencia vigentes. Sin ambas validadas no hay asignación (filtro MAIC obligatorio).</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button onClick={iniciarDidit}>Iniciar verificación Didit</Button>
          <Button variant="secondary" onClick={() => (window.location.href = "/cuenta/documentos")}>Ir a documentos</Button>
        </div>
        <p className="mt-2 font-body text-xs text-text-tertiary">Estatus: identidad {identidadOk ? "aprobada" : "pendiente/incompleta"} · licencia {licenciaOk ? "aprobada" : "pendiente"} · vigencia {licenciaVigencia ?? "sin registrar"}</p>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="font-display text-lg font-bold">11.4 · Capacitación y evaluación (MCE)</h2>
        <p className="mt-1 font-body text-sm text-text-tertiary">Filtro progresivo: cursos obligatorios → evaluación práctica de evidencia → prueba de manejo. Solo entonces pasas a Activo.</p>
        <ol className="mt-3 grid gap-2 font-body text-sm">
          <li>1. Cursos obligatorios — pendiente</li>
          <li>2. Evaluación práctica de evidencia — pendiente</li>
          <li>3. Prueba práctica de manejo — pendiente</li>
        </ol>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="font-display text-lg font-bold">11.5 · Nivel de certificación (servicios habilitados)</h2>
        <p className="mt-1 font-body text-sm">Nivel actual: <strong>{ETIQUETA_NIVEL_CERTIFICACION[nivel]}</strong></p>
        <div className="mt-3 grid gap-2">
          {NIVELES_CERTIFICACION_SERVICIO.map((n) => (
            <div key={n.nivel} className={`rounded-xl border p-3 ${n.nivel === nivel ? "border-signal bg-signal/5" : "border-border"}`}>
              <p className="font-display text-sm font-bold">Nivel {n.nivel} · {n.denominacion}</p>
              <p className="font-body text-xs text-text-tertiary">{n.descripcion}</p>
              <p className="mt-1 font-body text-xs">Habilita: {n.servicios.join(" · ")}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" disabled={nivel <= 1} onClick={() => setNivel((v) => Math.max(1, v - 1) as 1 | 2 | 3)}>Ver nivel anterior</Button>
          <Button variant="secondary" disabled={nivel >= 3} onClick={() => setNivel((v) => Math.min(3, v + 1) as 1 | 2 | 3)}>Ver siguiente nivel</Button>
        </div>
        {!ascenso.puede && <p className="mt-2 font-body text-xs text-text-tertiary">Para ascender te falta: {ascenso.faltantes.join(", ")}</p>}
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="font-display text-lg font-bold">11.6 · Carta de derechos</h2>
        <ul className="mt-2 grid gap-1.5 font-body text-sm text-text-secondary">
          {CARTA_DERECHOS_CONDUCTOR.map((d) => <li key={d}>· {d}</li>)}
        </ul>
      </Card>

      <Card className="mt-4 p-5">
        <h2 className="font-display text-lg font-bold">11.7 · Compromisos</h2>
        <ul className="mt-2 grid gap-1.5 font-body text-sm text-text-secondary">
          {COMPROMISOS_CONDUCTOR.map((d) => <li key={d}>· {d}</li>)}
        </ul>
      </Card>

      {conductorId && <p className="mt-4 font-body text-[11px] text-text-tertiary">Conductor {conductorId.slice(0, 8)}… · filtro MAIC activo: sin identidad+licencia vigentes no recibes ofertas.</p>}
    </div>
  );
}
