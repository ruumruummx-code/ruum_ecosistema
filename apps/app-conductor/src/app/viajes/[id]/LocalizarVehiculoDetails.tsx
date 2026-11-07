"use client";
import { TripStage } from "./TripStage";
import styles from "./trip-stage.module.css";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { evaluarVerificacionRepuveLocal } from "@ruum/shared/rules";
import {
  URL_PORTAL_REPUVE,
  type Database,
  type ResultadoVerificacionRepuveConductor,
} from "@ruum/shared/types";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import {
  avanzarEstadoTraslado,
  obtenerResumenVerificacionRepuve,
  registrarVerificacionRepuveConductor,
  subirCapturaRepuve,
} from "@ruum/api/services";
import { TripSupportDialog } from "./TripSupportDialog";
import { TripDialog } from "./TripDialog";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];

const OPCIONES_RESULTADO_REPUVE: {
  valor: ResultadoVerificacionRepuveConductor;
  etiqueta: string;
}[] = [
  { valor: "limpio", etiqueta: "Sin reporte de robo (Limpio)" },
  { valor: "con_reporte_robo", etiqueta: "Con reporte de robo vigente" },
  { valor: "con_aviso_recuperado", etiqueta: "Con aviso / recuperado / alerta" },
  { valor: "no_encontrado", etiqueta: "No encontrado en REPUVE" },
  { valor: "error_portal", etiqueta: "Portal REPUVE sin servicio" },
];

export function LocalizarVehiculoDetails({
  pasaporte,
  volver,
}: {
  pasaporte: PasaporteRow;
  volver: string;
}) {
  const router = useRouter();
  const [estadoLocal, setEstadoLocal] = useState<EstadoTraslado>(
    (pasaporte.estado || "conductor_en_punto_de_recoleccion") as EstadoTraslado
  );
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [soporteAbierto, setSoporteAbierto] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);

  // Estado del paso de verificación REPUVE
  const [vinFisico, setVinFisico] = useState("");
  const [placasFisicas, setPlacasFisicas] = useState("");
  const [resultadoRepuve, setResultadoRepuve] =
    useState<ResultadoVerificacionRepuveConductor>("limpio");
  const [capturaArchivo, setCapturaArchivo] = useState<File | null>(null);
  const [capturaPathSubida, setCapturaPathSubida] = useState<string | null>(null);
  const [repuveValidoEnServidor, setRepuveValidoEnServidor] = useState(false);
  const [estatusServidor, setEstatusServidor] = useState<string | null>(null);
  const [intentoBloqueadoGuardado, setIntentoBloqueadoGuardado] = useState(false);

  const trasladoId = pasaporte.traslado_id!;

  // Sin fallbacks falsos: si el pasaporte llega sin VIN o placas reales, se bloquea el paso
  const placasReales = pasaporte.vehiculo_placas?.trim() || "";
  const vinReal = pasaporte.vehiculo_vin?.trim() || "";
  const faltanDatosVehiculo = !vinReal || !placasReales;

  const placas = placasReales || "Sin placas registradas";
  const vin = vinReal || "Sin VIN registrado";
  const enPasoVerificacion = estadoLocal === "verificacion_vehiculo_en_proceso";

  useEffect(() => {
    setEstadoLocal((pasaporte.estado || "conductor_en_punto_de_recoleccion") as EstadoTraslado);
  }, [pasaporte.estado]);

  useEffect(() => {
    let activo = true;
    async function consultarEstatusRepuve() {
      try {
        const cliente = crearClienteNavegador();
        const resumen = await obtenerResumenVerificacionRepuve(cliente, trasladoId);
        if (!activo || !resumen) return;
        setRepuveValidoEnServidor(Boolean(resumen.valida_para_avanzar));
        setEstatusServidor(resumen.estatus_resumido ?? null);
      } catch {
        // En entorno sin RPC o test unitario sin mock, se mantiene en false
      }
    }
    if (enPasoVerificacion) {
      void consultarEstatusRepuve();
    }
    return () => {
      activo = false;
    };
  }, [enPasoVerificacion, trasladoId]);

  const evaluacionRepuve = evaluarVerificacionRepuveLocal({
    vinEsperado: vinReal,
    placasEsperadas: placasReales,
    vinFisico,
    placasFisicas,
    resultado: resultadoRepuve,
    tienePlacas: true,
  });

  const hayCamposIngresados =
    vinFisico.trim().length > 0 && placasFisicas.trim().length > 0;
  const detectaBloqueoOperativo =
    !repuveValidoEnServidor &&
    (resultadoRepuve !== "limpio" || (hayCamposIngresados && !evaluacionRepuve.coincide));

  async function handleIniciarInspeccion() {
    if (faltanDatosVehiculo) {
      setError(
        "El pasaporte digital no tiene VIN o placas reales registrados. Reporta a soporte antes de continuar."
      );
      setSoporteAbierto(true);
      return;
    }

    setProcesando(true);
    setError(null);
    setAviso(null);
    try {
      const cliente = crearClienteNavegador();

      if (estadoLocal === "conductor_en_punto_de_recoleccion") {
        const siguiente = (await avanzarEstadoTraslado(
          cliente,
          trasladoId,
          "conductor_en_punto_de_recoleccion"
        )) as EstadoTraslado;
        setEstadoLocal(siguiente || "verificacion_vehiculo_en_proceso");
        setProcesando(false);
        return;
      }

      if (estadoLocal === "verificacion_vehiculo_en_proceso" && repuveValidoEnServidor) {
        await avanzarEstadoTraslado(cliente, trasladoId, "verificacion_vehiculo_en_proceso");
        router.push(`/viajes/${trasladoId}/evidencia`);
        return;
      }

      if (estadoLocal === "evidencia_inicial_en_proceso") {
        router.push(`/viajes/${trasladoId}/evidencia`);
        return;
      }
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos iniciar la verificación del vehículo."));
    } finally {
      setProcesando(false);
    }
  }

  async function handleRegistrarVerificacionRepuve() {
    if (faltanDatosVehiculo) {
      setError(
        "El pasaporte digital no tiene VIN o placas reales registrados. Reporta a soporte antes de continuar."
      );
      return;
    }

    if (!vinFisico.trim() || !placasFisicas.trim()) {
      setError("Captura el VIN físico y las placas físicas leídas directamente en el vehículo.");
      return;
    }

    if (!capturaArchivo && !capturaPathSubida) {
      setError("Adjunta la captura de pantalla de la consulta en el portal REPUVE.");
      return;
    }

    setProcesando(true);
    setError(null);
    setAviso(null);

    try {
      const cliente = crearClienteNavegador();
      let pathFinal = capturaPathSubida;
      if (!pathFinal && capturaArchivo) {
        pathFinal = await subirCapturaRepuve(cliente, trasladoId, capturaArchivo);
        setCapturaPathSubida(pathFinal);
      }

      if (!pathFinal) {
        throw new Error("No se pudo obtener la ruta de la captura REPUVE.");
      }

      const registro = await registrarVerificacionRepuveConductor(cliente, {
        trasladoId,
        vinFisico,
        placasFisicas,
        resultado: resultadoRepuve,
        capturaPath: pathFinal,
      });

      if (!registro.puede_avanzar) {
        setIntentoBloqueadoGuardado(true);
        setRepuveValidoEnServidor(false);
        setError(
          evaluacionRepuve.motivoBloqueo ||
            "La verificación REPUVE registró una alerta o discrepancia. Reporta a soporte para revisión."
        );
        return;
      }

      setRepuveValidoEnServidor(true);
      await avanzarEstadoTraslado(cliente, trasladoId, "verificacion_vehiculo_en_proceso");
      router.push(`/viajes/${trasladoId}/evidencia`);
    } catch (err) {
      setError(
        traducirErrorOperativo(err, "No pudimos registrar la verificación REPUVE del vehículo.")
      );
    } finally {
      setProcesando(false);
    }
  }

  const blocked = faltanDatosVehiculo || detectaBloqueoOperativo;
  const needsVerification = enPasoVerificacion && !repuveValidoEnServidor;
  const recording = estadoLocal === "evidencia_inicial_en_proceso";
  const action = blocked ? () => setSoporteAbierto(true) : needsVerification ? () => setVerificationOpen(true) : () => void handleIniciarInspeccion();
  return <>
    <TripStage pasaporte={pasaporte} backHref={volver} stateLabel={recording ? "Registro inicial pendiente" : enPasoVerificacion ? "Verificación del vehículo" : "En el origen"}
      title={recording ? "Registra la recogida" : enPasoVerificacion ? "Verifica el vehículo" : "Recibe el vehículo"}
      instruction={faltanDatosVehiculo ? "Faltan VIN o placas. Consulta a soporte." : recording ? "Continúa las fotos y los datos del vehículo." : enPasoVerificacion ? "Comprueba VIN, placas y consulta REPUVE." : "Comprueba los datos con el contacto."}
      primaryLabel={blocked ? "Contactar soporte" : needsVerification ? "Abrir verificación" : recording || enPasoVerificacion ? "Continuar registro inicial" : "Confirmar contacto y vehículo"}
      onPrimary={action} busy={procesando} error={error} notice={aviso}
      extraTools={enPasoVerificacion && !faltanDatosVehiculo && <button type="button" onClick={() => setVerificationOpen(true)}>Revisar verificación REPUVE</button>} />
    {verificationOpen && <TripDialog title="Verificación del vehículo" onClose={() => setVerificationOpen(false)}>
      <div className={styles.verification} data-verificacion-repuve>
        <p>VIN registrado: {vin}</p><p>Placas registradas: {placas}</p>
        <a href={URL_PORTAL_REPUVE} target="_blank" rel="noopener noreferrer">Abrir portal REPUVE</a>
        {repuveValidoEnServidor ? <p role="status">{estatusServidor === "autorizado_por_soporte" ? "Verificación autorizada por soporte" : "Verificación registrada y validada"}</p> : <>
          <label>VIN físico en unidad<input value={vinFisico} onChange={e => setVinFisico(e.target.value.toUpperCase())} /></label>
          <label>Placas físicas<input value={placasFisicas} onChange={e => setPlacasFisicas(e.target.value.toUpperCase())} /></label>
          <label>Resultado en REPUVE<select value={resultadoRepuve} onChange={e => setResultadoRepuve(e.target.value as ResultadoVerificacionRepuveConductor)}>{OPCIONES_RESULTADO_REPUVE.map(option => <option key={option.valor} value={option.valor}>{option.etiqueta}</option>)}</select></label>
          <label>Captura de pantalla REPUVE<input type="file" accept="image/*" onChange={e => { setCapturaArchivo(e.target.files?.[0] ?? null); setCapturaPathSubida(null); }} /></label>
          {detectaBloqueoOperativo && <p role="alert">{evaluacionRepuve.motivoBloqueo || "La verificación requiere revisión de soporte."}</p>}
          {error && <p role="alert">{error}</p>}
          {detectaBloqueoOperativo ? <>
            {!intentoBloqueadoGuardado && hayCamposIngresados && Boolean(capturaArchivo || capturaPathSubida) && <button type="button" disabled={procesando} onClick={() => void handleRegistrarVerificacionRepuve()}>Guardar evidencia de bloqueo</button>}
            <button type="button" onClick={() => setSoporteAbierto(true)}>Contactar soporte</button>
          </> : <button type="button" disabled={procesando} onClick={() => void handleRegistrarVerificacionRepuve()}>{procesando ? "Guardando…" : "Confirmar verificación"}</button>}
        </>}
      </div>
    </TripDialog>}
    {soporteAbierto && <TripSupportDialog onClose={() => setSoporteAbierto(false)} />}
  </>;
}
