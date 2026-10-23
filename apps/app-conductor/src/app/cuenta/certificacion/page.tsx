"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenerConfiguracionConductor, obtenerConductorActual, obtenerSolicitudIdActivaConductor, tieneDatosBancariosConductor, iniciarVerificacionDidit } from "@ruum/api/services";
import { REQUISITOS_MINIMOS_CERTIFICACION, type ClaveRequisitoCertificacion } from "@ruum/shared/constants";
import { esActivoParaAsignacionMCE } from "@ruum/shared/rules";
import type { Database } from "@ruum/shared/types";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { alertaLicencia15Dias, esSmartphoneCompatible, evaluarChecklist } from "@/lib/certificacion";
import { DiditVerificationModal } from "@/app/registro/DiditVerificationModal";
import { buildDocumentChecklist } from "../documentos/document-checklist";
import { DriverCertificationView } from "./DriverCertificationView";

type Driver = Database["public"]["Tables"]["conductores"]["Row"];
const ROUTES: Partial<Record<ClaveRequisitoCertificacion, string>> = {
  identificacion_oficial: "/cuenta/documentos", licencia_vigente: "/cuenta/documentos",
  comprobante_domicilio: "/cuenta/documentos", constancia_fiscal: "/cuenta/documentos",
  cuenta_bancaria_propia: "/cuenta/datos-bancarios", smartphone_compatible: "/cuenta/perfil",
  consentimiento_antecedentes: "/registro",
};
export default function PaginaCertificacion() {
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [documents, setDocuments] = useState<Parameters<typeof buildDocumentChecklist>[0]>([]);
  const [bank, setBank] = useState(false);
  const [smartphone, setSmartphone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [solicitudId, setSolicitudId] = useState<string | null>(null);
  const [modalDidit, setModalDidit] = useState(false);
  const [urlDidit, setUrlDidit] = useState<string | null>(null);
  const [loadingDidit, setLoadingDidit] = useState(false);
  const [errorDidit, setErrorDidit] = useState<string | null>(null);
  const [openMce, setOpenMce] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoading(true); setError(null); setSmartphone(esSmartphoneCompatible());
    void (async () => {
      try {
        const client = crearClienteNavegador();
        const current = await obtenerConductorActual(client);
        if (!current) throw new Error("No se encontró el conductor. Inicia sesión nuevamente.");
        const [config, hasBank, application] = await Promise.all([
          obtenerConfiguracionConductor(client, current.id), tieneDatosBancariosConductor(client, current.id), obtenerSolicitudIdActivaConductor(client),
        ]);
        if (!alive) return;
        setDriver(config.conductor); setDocuments(config.documentos); setBank(hasBank); setSolicitudId(application);
      } catch (e) { if (alive) setError(traducirErrorOperativo(e, "No pudimos cargar tu certificación.")); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [revision]);
  const docs = buildDocumentChecklist(documents, driver);
  const approved = (type: string) => docs.some(doc => doc.type === type && ["aprobado", "por_vencer"].includes(doc.status));
  const checklist = evaluarChecklist({
    identificacionAprobada: approved("identificacion_oficial"),
    licenciaAprobada: approved("licencia_frente") && approved("licencia_reverso"), licenciaVigencia: driver?.licencia_vigencia ?? null,
    comprobanteDomicilio: approved("documento_operativo"), constanciaFiscal: approved("constancia_situacion_fiscal"),
    cuentaBancariaPropia: bank, smartphoneCompatible: smartphone,
    consentimientoBiometricoGeo: !!driver?.identidad_validada,
    consentimientoAntecedentes: !!driver?.autoriza_verificacion_antecedentes,
    capacitacionAprobada: !!driver?.capacitacion_aprobada,
    evaluacionPracticaAprobada: !!driver?.evaluacion_practica_aprobada && !!driver?.prueba_manejo_aprobada,
  });
  const mce = esActivoParaAsignacionMCE({
    identidadValidada: !!driver?.identidad_validada, licenciaValidada: !!driver?.licencia_validada,
    licenciaVigente: checklist.licencia_vigente, capacitacionAprobada: !!driver?.capacitacion_aprobada,
    evaluacionPracticaAprobada: !!driver?.evaluacion_practica_aprobada, pruebaManejoAprobada: !!driver?.prueba_manejo_aprobada,
    estado: driver?.estado ?? "pendiente_verificacion",
  });
  const next = REQUISITOS_MINIMOS_CERTIFICACION.find(item => !checklist[item.clave]);
  async function startDidit() {
    setModalDidit(true); setLoadingDidit(true); setErrorDidit(null);
    try {
      if (!solicitudId) throw new Error("No hay una solicitud activa para iniciar la verificación. Contacta a soporte desde Cuenta.");
      const result = await iniciarVerificacionDidit(crearClienteNavegador(), solicitudId); setUrlDidit(result.url);
    } catch (e) { setErrorDidit(traducirErrorOperativo(e, "No pudimos iniciar la verificación de identidad.")); }
    finally { setLoadingDidit(false); }
  }
  function complete() {
    if (!next || loading || error) return;
    if (next.clave === "consentimiento_biometrico_geo") { void startDidit(); return; }
    const route = ROUTES[next.clave];
    if (route) router.push(route.startsWith("/cuenta/") ? `${route}?volver=${encodeURIComponent(window.location.pathname + window.location.search)}` : route); else setOpenMce(true);
  }
  const licenseAlert = alertaLicencia15Dias(driver?.licencia_vigencia ?? null);
  return <>
    <DriverCertificationView driver={driver} checklist={checklist} loading={loading} error={error}
      active={mce.activo} reason={mce.motivo} licenseWarning={licenseAlert.activa ? licenseAlert.mensaje : null}
      onRetry={() => setRevision(value => value + 1)} onComplete={complete} openMce={openMce} onOpenMce={() => setOpenMce(false)}/>
    {modalDidit && <DiditVerificationModal isOpen url={urlDidit} cargando={loadingDidit} error={errorDidit}
      onCerrar={() => { setModalDidit(false); setUrlDidit(null); }} onReintentar={startDidit}
      onFinalizar={() => { setModalDidit(false); setUrlDidit(null); setRevision(value => value + 1); }}/>}
  </>;
}
