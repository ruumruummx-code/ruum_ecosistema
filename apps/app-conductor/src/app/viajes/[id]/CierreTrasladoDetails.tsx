"use client";

import { useEffect, useRef, useState } from "react";
import {
  consultarAcuseRecepcion,
  consultarResolucionInventarioLlaves,
  consultarResumenEvidenciaCierre,
  guardarAcuseRecepcion,
  type ResumenEvidenciaCierre
} from "@ruum/api/custody";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Database } from "@ruum/shared/types";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { avanzarEstadoTraslado, extraerRutaComprobante } from "@ruum/api/services";
import { listarInspeccionesTraslado } from "@ruum/api/drivers";
import { TripFormFrame } from "./TripFormFrame";
import { SignaturePad } from "./cierre/SignaturePad";
import styles from "./trip-form.module.css";
import { TripSupportDialog } from "./TripSupportDialog";
import { CierreConfirmacionModal } from "./cierre/CierreConfirmacionModal";
import { TripDialog } from "./TripDialog";
import type { PasaporteRow, InspeccionData } from "./cierre/cierre-types";

export function CierreTrasladoDetails({
  pasaporte,
  volver,
}: {
  pasaporte: PasaporteRow;
  volver: string;
}) {
  const router = useRouter();
  const trasladoId = pasaporte.traslado_id || "";
  const estadoActual = pasaporte.estado as Database["public"]["Enums"]["estado_traslado"];

  const [inspeccionInicial, setInspeccionInicial] = useState<InspeccionData | null>(null);
  const [evidenciaCierre, setEvidenciaCierre] = useState<ResumenEvidenciaCierre | null>(null);
  const [llavesResueltas, setLlavesResueltas] = useState(false);
  const [inspeccionFinal, setInspeccionFinal] = useState<InspeccionData | null>(null);
  const [acusePersistido, setAcusePersistido] = useState(false);
  const [referenciaFirma, setReferenciaFirma] = useState<string | null>(null);
  const [guardandoReporte, setGuardandoReporte] = useState(false);
  const [tieneFirma, setTieneFirma] = useState(false);

  const inventarioValido = (valor: string | null | undefined) => typeof valor === "string" && /^[0-9]+$/.test(valor);
  const faltanLlaves = !inventarioValido(inspeccionInicial?.llaves_recibidas) || !inventarioValido(inspeccionFinal?.llaves_recibidas);
  const diferenciaLlaves = Number(inspeccionInicial?.llaves_recibidas) !== Number(inspeccionFinal?.llaves_recibidas);
  const bloqueoLlaves = faltanLlaves || (diferenciaLlaves && !llavesResueltas);
  const bloqueoEvidencia = !evidenciaCierre?.completa;
  const bloqueoFirma = !tieneFirma && !acusePersistido;
  const bloqueoCierre = bloqueoLlaves || bloqueoEvidencia || bloqueoFirma;
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisoExito, setAvisoExito] = useState<string | null>(null);
  const [soporteAbierto, setSoporteAbierto] = useState(false);
  const [modalConfirmacionAbierto, setModalConfirmacionAbierto] = useState(false);

  // Trazabilidad de comprobante_ruta si aplica gasto al cierre con extraerRutaComprobante
  const _comprobanteRutaSanitizada = (ruta?: string | null) => (ruta ? extraerRutaComprobante(null, ruta).ruta : null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState(false);

  const contactoNombre =
    pasaporte.contacto_recepcion_nombre || pasaporte.contacto_entrega_nombre || "Contacto de recepción por confirmar";
  const contactoTelefono =
    pasaporte.contacto_recepcion_telefono || pasaporte.contacto_entrega_telefono || "";
  const telefonoLimpio = contactoTelefono.replace(/[^0-9]/g, "");

  useEffect(() => {
    async function loadInspeccion() {
      if (!trasladoId) return;
      try {
        const cliente = crearClienteNavegador();
        const [insps, resumen, acuse] = await Promise.all([
          listarInspeccionesTraslado(cliente, trasladoId),
          consultarResumenEvidenciaCierre(cliente, trasladoId),
          consultarAcuseRecepcion(cliente, trasladoId)
        ]);
        setEvidenciaCierre(resumen);
        if (acuse?.persistido) {
          setAcusePersistido(true);
          setTieneFirma(true);
          if (acuse.referenciaFirma) setReferenciaFirma(acuse.referenciaFirma);
        }
        if (insps) {
          const inicial = insps.find((i) => i.tipo === "inicial") as InspeccionData | undefined;
          if (inicial) setInspeccionInicial(inicial);
          const final = insps.find((i) => i.tipo === "final") as InspeccionData | undefined;
          if (final) setInspeccionFinal(final);
          const resolucion = await consultarResolucionInventarioLlaves(cliente, trasladoId);
          setLlavesResueltas(Boolean(resolucion && resolucion.inicial === inicial?.llaves_recibidas && resolucion.final === final?.llaves_recibidas));
        }
      } catch (err) {
        setError(traducirErrorOperativo(err, "No pudimos comprobar los requisitos de cierre. Reintenta o consulta a soporte."));
      } finally {
        setCargando(false);
      }
    }
    void loadInspeccion();
  }, [trasladoId]);

  async function handleGuardarReporte() {
    if (guardandoReporte || procesando || acusePersistido) return;
    if (!tieneFirma && !acusePersistido) {
      setError("Debes capturar la firma de conformidad del receptor antes de guardar el reporte.");
      return;
    }

    setGuardandoReporte(true);
    setError(null);
    setAvisoExito(null);

    try {
      const cliente = crearClienteNavegador();
      const canvas = canvasRef.current;
      const firmaDataUrl = canvas ? canvas.toDataURL("image/png") : "";

      const res = await guardarAcuseRecepcion(cliente, {
        trasladoId,
        receptorNombre: contactoNombre,
        receptorTelefono: contactoTelefono,
        firmaDataUrl,
        odometro: inspeccionFinal?.kilometraje ?? null,
        combustible: inspeccionFinal?.combustible ?? null,
        notas: observacionesTexto !== "Ninguna" ? observacionesTexto : null
      });

      setAcusePersistido(true);
      setTieneFirma(true);
      if (res?.referencia) setReferenciaFirma(res.referencia);
      setAvisoExito("Reporte de recepción y firma guardados exitosamente.");
      setTimeout(() => setAvisoExito(null), 4000);
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos guardar el reporte de recepción. Intenta nuevamente."));
    } finally {
      setGuardandoReporte(false);
    }
  }

  async function handleFinalizarTraslado() {
    if (procesando) return;
    if (cargando || bloqueoCierre) {
      if (bloqueoFirma) {
        setError("Cierre bloqueado: se requiere la acreditación digital y la firma de conformidad del receptor.");
      } else if (bloqueoLlaves) {
        setError("Inventario de llaves pendiente. Documenta la diferencia con operación y solicita resolución de administración.");
      } else if (bloqueoEvidencia) {
        setError("Fotografías obligatorias incompletas o en conflicto.");
      } else {
        setError("Cierre pendiente: revisa inventario de llaves, fotografías obligatorias y firma del receptor.");
      }
      return;
    }
    setProcesando(true);
    setError(null);
    setAvisoExito(null);

    try {
      const cliente = crearClienteNavegador();

      // Garantizar que la recepción y firma queden persistidas en el servidor antes de autorizar la transición
      if (!acusePersistido) {
        const canvas = canvasRef.current;
        const firmaDataUrl = canvas ? canvas.toDataURL("image/png") : "";
        const res = await guardarAcuseRecepcion(cliente, {
          trasladoId,
          receptorNombre: contactoNombre,
          receptorTelefono: contactoTelefono,
          firmaDataUrl,
          odometro: inspeccionFinal?.kilometraje ?? null,
          combustible: inspeccionFinal?.combustible ?? null,
          notas: observacionesTexto !== "Ninguna" ? observacionesTexto : null
        });
        setAcusePersistido(true);
        if (res?.referencia) setReferenciaFirma(res.referencia);
      }

      if (estadoActual !== "evidencia_final_completada" && estadoActual !== "entrega_confirmada") throw new Error("El traslado ya no está en un paso de cierre. Vuelve al resumen.");
      await avanzarEstadoTraslado(cliente, trasladoId, estadoActual);
      router.replace(`/viajes/${trasladoId}`);
      router.refresh();
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos completar el cierre del traslado."));
      setProcesando(false);
    }
  }

  const odometroTexto = inspeccionFinal?.kilometraje != null
    ? `${inspeccionFinal.kilometraje.toLocaleString("es-MX")} km`
    : "Sin captura";
  const combustibleTexto = inspeccionFinal?.combustible ? inspeccionFinal.combustible : "Sin captura";
  const observacionesTexto = inspeccionFinal?.notas?.trim() || "Ninguna";

  const delivery=estadoActual==="evidencia_final_completada";
  return <>
    <TripFormFrame id={trasladoId} title="Entrega y cierre" step={step} total={3} stepLabel={["Requisitos","Firma","Confirmación"].at(step)}
      onPrevious={step>0 ? ()=>setStep(step-1) : undefined}
      primary={cargando ? "Comprobando…" : step<2 ? "Continuar" : delivery ? "Confirmar entrega" : "Finalizar servicio"}
      onPrimary={()=>step<2 ? setStep(step+1) : setModalConfirmacionAbierto(true)}
      disabled={cargando || (step===0&&(bloqueoEvidencia||bloqueoLlaves)) || (step===1&&bloqueoFirma) || (step===2&&bloqueoCierre)} busy={procesando||guardandoReporte} error={error} notice={avisoExito}>
      {step===0&&<><h1>Revisa los requisitos</h1><p>El cierre conserva el inventario y las fotografías originales.</p>
        <ul className={styles.checklist}><li>Fotos sincronizadas: origen {evidenciaCierre?.inicial??0}/5 · destino {evidenciaCierre?.final??0}/5</li><li>Llaves: origen {inspeccionInicial?.llaves_recibidas??"Sin captura"} · destino {inspeccionFinal?.llaves_recibidas??"Sin captura"}</li><li>{cargando ? "Consultando el servidor…" : bloqueoEvidencia ? "Fotografías pendientes o en conflicto" : "Fotografías completas"}</li><li>{bloqueoLlaves ? "Inventario pendiente de resolución" : "Inventario conciliado"}</li></ul>
        <button type="button" onClick={()=>setDetails(true)}>Ver registro completo y pendientes</button>
      </>}
      <section hidden={step!==1} className={styles.content} aria-label="Firma de conformidad"><h1>Firma del receptor</h1><p>{contactoNombre}</p>
        {acusePersistido ? <p role="status">Recepción y firma acreditadas por el servidor.</p> : <SignaturePad canvasRef={canvasRef} onChange={setTieneFirma} disabled={procesando||guardandoReporte} />}
        {!acusePersistido && <button type="button" onClick={()=>void handleGuardarReporte()} disabled={!tieneFirma||procesando||guardandoReporte}>Guardar recepción y firma</button>}
      </section>
      {step===2&&<><h1>{delivery ? "Confirma la entrega" : "Finaliza el servicio"}</h1><p>{delivery ? "Confirmar la entrega registra la recepción del vehículo. Después podrás finalizar el servicio." : "Revisa el expediente antes de finalizar el servicio."}</p><p>Receptor: {contactoNombre}</p><p>Firma: {acusePersistido ? "Acreditada en servidor" : tieneFirma ? "Capturada; se guardará al confirmar" : "Pendiente"}</p><button type="button" onClick={()=>setDetails(true)}>Revisar registro completo</button></>}
    </TripFormFrame>
    {details&&<TripDialog title="Registro y pendientes de entrega" onClose={()=>setDetails(false)}><div className={styles.content}><h3>Receptor</h3><p>{contactoNombre}</p>{telefonoLimpio&&<a href={`tel:${telefonoLimpio}`}>Llamar al receptor</a>}
      <p>Odómetro: {odometroTexto}</p><p>Combustible: {combustibleTexto}</p><p className={styles.complete}>Observaciones: {observacionesTexto}</p>
      {bloqueoEvidencia&&<p role="alert">Completa y sincroniza las fotografías obligatorias. {evidenciaCierre?.conflicto ? "Existe un conflicto: solicita revisión sin sustituir el registro original." : ""}</p>}
      {bloqueoLlaves&&<p role="alert">La falta de inventario o una diferencia de llaves requiere resolución administrativa. Conserva los registros y recarga después de resolver.</p>}
      <Link href={`/viajes/${trasladoId}/evidencia`}>Revisar evidencias</Link><button type="button" onClick={()=>location.reload()}>Volver a comprobar requisitos</button><button type="button" onClick={()=>{setDetails(false);setSoporteAbierto(true);}}>Contactar soporte</button>
    </div></TripDialog>}
    {modalConfirmacionAbierto&&<CierreConfirmacionModal abierto onCerrar={()=>setModalConfirmacionAbierto(false)} onConfirmar={()=>{setModalConfirmacionAbierto(false);void handleFinalizarTraslado();}} procesando={procesando||cargando||bloqueoCierre} delivery={delivery} />}
    {soporteAbierto&&<TripSupportDialog onClose={()=>setSoporteAbierto(false)} />}
  </>;
}
