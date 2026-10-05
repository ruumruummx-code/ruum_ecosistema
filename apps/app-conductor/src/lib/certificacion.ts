// Modelo 11 — helpers de presentación para app-conductor (certificación + Didit + MCE).
import {
  DIAS_ALERTA_VENCIMIENTO_LICENCIA,
  diasParaVencerLicencia,
} from "@ruum/shared/validacion";
import {
  ETIQUETA_NIVEL_CERTIFICACION,
  REQUISITOS_MINIMOS_CERTIFICACION,
  type ClaveRequisitoCertificacion,
} from "@ruum/shared/constants";

export { ETIQUETA_NIVEL_CERTIFICACION, REQUISITOS_MINIMOS_CERTIFICACION };
export type { ClaveRequisitoCertificacion };

export interface EntradasChecklist {
  identificacionAprobada: boolean;
  licenciaAprobada: boolean;
  licenciaVigencia: string | null;
  comprobanteDomicilio: boolean;
  constanciaFiscal: boolean;
  cuentaBancariaPropia: boolean;
  smartphoneCompatible: boolean;
  consentimientoBiometricoGeo: boolean;
  consentimientoAntecedentes: boolean;
  capacitacionAprobada: boolean;
  evaluacionPracticaAprobada: boolean;
}

export function evaluarChecklist(e: EntradasChecklist): Record<ClaveRequisitoCertificacion, boolean> {
  const licenciaVigente =
    e.licenciaAprobada && !!e.licenciaVigencia && diasParaVencerLicencia(e.licenciaVigencia) >= 0;
  return {
    identificacion_oficial: e.identificacionAprobada,
    licencia_vigente: licenciaVigente,
    comprobante_domicilio: e.comprobanteDomicilio,
    constancia_fiscal: e.constanciaFiscal,
    cuenta_bancaria_propia: e.cuentaBancariaPropia,
    smartphone_compatible: e.smartphoneCompatible,
    consentimiento_biometrico_geo: e.consentimientoBiometricoGeo,
    consentimiento_antecedentes: e.consentimientoAntecedentes,
    capacitacion_aprobada: e.capacitacionAprobada,
    evaluacion_practica_aprobada: e.evaluacionPracticaAprobada,
  };
}

export function alertaLicencia15Dias(vigencia: string | null | undefined): {
  activa: boolean;
  dias: number | null;
  mensaje: string | null;
} {
  if (!vigencia) return { activa: false, dias: null, mensaje: null };
  const dias = diasParaVencerLicencia(vigencia);
  if (dias < 0)
    return {
      activa: true,
      dias,
      mensaje: "Tu licencia está vencida. Estás deshabilitado para traslados hasta renovarla.",
    };
  if (dias <= DIAS_ALERTA_VENCIMIENTO_LICENCIA)
    return {
      activa: true,
      dias,
      mensaje: `Tu licencia vence en ${dias} día(s). Renuévala para no perder actividad (alerta 15 días).`,
    };
  return { activa: false, dias, mensaje: null };
}

export function esSmartphoneCompatible(): boolean {
  if (typeof navigator === "undefined") return true;
  const ua = navigator.userAgent || "";
  const esMovil = /android|iphone|ipad|ipod|mobile/i.test(ua);
  const tieneCamara = !!(navigator.mediaDevices?.getUserMedia || (navigator as unknown as { getUserMedia?: unknown }).getUserMedia);
  const tieneGeo = typeof navigator.geolocation !== "undefined";
  // En escritorio se permite continuar (captura desde PC); en móvil se exigen cámara + GPS.
  if (!esMovil) return true;
  return tieneCamara && tieneGeo;
}
