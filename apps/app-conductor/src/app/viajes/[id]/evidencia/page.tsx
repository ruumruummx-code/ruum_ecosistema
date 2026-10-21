"use client";

import { useParams } from "next/navigation";
import { useEvidenciaPageLogic } from "./useEvidenciaPageLogic";
import { EvidenciaHeader } from "./EvidenciaHeader";
import { EvidenciaProgress } from "./EvidenciaProgress";
import { EvidenciaStepper } from "./EvidenciaStepper";
import { EvidenciaFotosSection } from "./EvidenciaFotosSection";
import { EvidenciaKmCombustibleSection } from "./EvidenciaKmCombustibleSection";
import { EvidenciaLlavesSection } from "./EvidenciaLlavesSection";
import { EvidenciaDocumentosSection } from "./EvidenciaDocumentosSection";
import { EvidenciaNotasSection } from "./EvidenciaNotasSection";
import { EvidenciaFooter } from "./EvidenciaFooter";
import { EvidenciaCsatSheet } from "./EvidenciaCsatSheet";
import { EvidenciaSoporteSheet } from "./EvidenciaSoporteSheet";
import { Aviso } from "@ruum/ui";
import { SecondaryTripNavBar } from "../SecondaryTripNavBar";

export default function PaginaEvidencia() {
  const { id } = useParams<{ id: string }>();

  const {
    estadoActual,
    pasaporte,
    tipo,
    soporteAbierto,
    setSoporteAbierto,
    cargando,
    error,
    aviso,
    avisoExito,
    setAviso,
    setAvisoExito,
    kilometraje,
    setKilometraje,
    gasolinaSegments,
    setGasolinaSegments,
    llavesCount,
    setLlavesCount,
    tarjetaCirculacion,
    setTarjetaCirculacion,
    talonVerificacion,
    setTalonVerificacion,
    hologramaVerificacion,
    setHologramaVerificacion,
    placaDelantera,
    setPlacaDelantera,
    placaTrasera,
    setPlacaTrasera,
    notas,
    setNotas,
    acordeonDocsAbierto,
    setAcordeonDocsAbierto,
    acordeonNotasAbierto,
    setAcordeonNotasAbierto,
    presentaDanosNuevos,
    setPresentaDanosNuevos,
    mostrarRecibo,
    setMostrarRecibo,
    tipoReporteEnviado,
    setTipoReporteEnviado,
    enviandoCopia,
    setEnviandoCopia,
    showCsatSheet,
    setShowCsatSheet,
    csatValor,
    setCsatValor,
    cesValor,
    setCesValor,
    enviandoFeedback,
    setEnviandoFeedback,
    fotos,
    setFotos,
    enviando,
    setEnviando,
    fotosObligatorias,
    totalRequisitos,
    angulosObligatorios,
    fotosObligCapturadas,
    docsCapturados,
    totalCapturados,
    origen,
    folio,
    registrarFotoLocal,
    drenarCola,
    capturar,
    procesarArchivoSeleccionado,
    getFuelText,
    guardarBorrador,
    finalizar,
    enviarFeedback,
    omitirFeedback,
    isPhotoCaptured,
    obtenerFoto,
    inputArchivoRef,
    anguloArchivoRef
  } = useEvidenciaPageLogic(id);

  if (cargando) {
    return (
      <div className="mx-auto w-full max-w-md px-6 py-20 text-center text-text-primary">
        <div className="w-8 h-8 border-4 border-signal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-body text-sm font-semibold text-text-secondary">Cargando checklist de evidencias...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 sm:px-6 sm:py-10 flex flex-col justify-between min-h-screen text-text-primary">
      <EvidenciaHeader tipo={tipo} folio={folio} origen={origen} />

      {/* Progress */}
      {(() => {
        const porcentaje = Math.round((totalCapturados / Math.max(1, totalRequisitos)) * 100);
        const faltantesFotos = angulosObligatorios.filter((a) => !fotos.some((f) => f.angulo === a));
        return (
          <EvidenciaProgress
            porcentaje={porcentaje}
            totalCapturados={totalCapturados}
            totalRequisitos={totalRequisitos}
            fotosObligCapturadas={fotosObligCapturadas}
            fotosObligatorias={fotosObligatorias}
            faltantesFotos={faltantesFotos}
            onIrAFotos={() => document.getElementById("evid-fotos")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          />
        );
      })()}

      {/* Stepper */}
      <EvidenciaStepper
        fotosObligCapturadas={fotosObligCapturadas}
        fotosObligatorias={fotosObligatorias}
        kilometraje={kilometraje}
        llavesCount={llavesCount}
        docsCapturados={docsCapturados}
        notas={notas}
        onIrAFotos={() => document.getElementById("evid-fotos")?.scrollIntoView({ behavior: "smooth" })}
      />

      {/* Section 1: Fotos */}
      <EvidenciaFotosSection
        fotos={fotos}
        capturar={capturar}
        obtenerFoto={obtenerFoto}
        inputArchivoRef={inputArchivoRef}
        procesarArchivoSeleccionado={procesarArchivoSeleccionado}
      />

      {/* Section 2: KM y Combustible */}
      <EvidenciaKmCombustibleSection
        kilometraje={kilometraje}
        setKilometraje={setKilometraje}
        gasolinaSegments={gasolinaSegments}
        setGasolinaSegments={setGasolinaSegments}
        getFuelText={getFuelText}
      />

      {/* Section 3: Llaves */}
      <EvidenciaLlavesSection llavesCount={llavesCount} setLlavesCount={setLlavesCount} />

      {/* Section 4: Documentos y Placas */}
      <EvidenciaDocumentosSection
        tarjetaCirculacion={tarjetaCirculacion}
        setTarjetaCirculacion={setTarjetaCirculacion}
        talonVerificacion={talonVerificacion}
        setTalonVerificacion={setTalonVerificacion}
        hologramaVerificacion={hologramaVerificacion}
        setHologramaVerificacion={setHologramaVerificacion}
        placaDelantera={placaDelantera}
        setPlacaDelantera={setPlacaDelantera}
        placaTrasera={placaTrasera}
        setPlacaTrasera={setPlacaTrasera}
        docsCapturados={docsCapturados}
      />

      {/* Section 5: Notas */}
      <EvidenciaNotasSection
        tipo={tipo}
        notas={notas}
        setNotas={setNotas}
        presentaDanosNuevos={presentaDanosNuevos}
        setPresentaDanosNuevos={setPresentaDanosNuevos}
      />

      {error && (
        <div className="mt-4 px-1">
          <Aviso tono="danger">{error}</Aviso>
        </div>
      )}
      {avisoExito && (
        <div className="mt-4 px-1">
          <Aviso tono="info">{avisoExito}</Aviso>
        </div>
      )}

      <div className="text-center font-body text-[9px] text-text-tertiary font-bold mt-6 tracking-wide select-none">
        ruumruum · evidencias generadas previas al {tipo === "inicial" ? "inicio" : "cierre"} del traslado
      </div>

      {/* Footer sticky */}
      <EvidenciaFooter
        totalCapturados={totalCapturados}
        totalRequisitos={totalRequisitos}
        enviando={enviando}
        onGuardarBorrador={guardarBorrador}
        onFinalizar={finalizar}
        soporteAbierto={soporteAbierto}
        setSoporteAbierto={setSoporteAbierto}
      />

      {/* Secondary Bottom Navigation Bar */}
      {pasaporte && (
        <SecondaryTripNavBar trasladoId={id} pasaporte={pasaporte} />
      )}

      {/* R5 — CSAT/CES Sheet */}
      <EvidenciaCsatSheet
        showCsatSheet={showCsatSheet}
        setShowCsatSheet={setShowCsatSheet}
        csatValor={csatValor}
        setCsatValor={setCsatValor}
        cesValor={cesValor}
        setCesValor={setCesValor}
        enviandoFeedback={enviandoFeedback}
        setEnviandoFeedback={setEnviandoFeedback}
        onEnviarFeedback={enviarFeedback}
        onOmitirFeedback={omitirFeedback}
      />

      {/* Bottom Sheet de Soporte */}
      <EvidenciaSoporteSheet soporteAbierto={soporteAbierto} setSoporteAbierto={setSoporteAbierto} />
    </div>
  );
}
