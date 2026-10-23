"use client";
import { TripActionDock } from "./TripOperationalFrame";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Aviso } from "@ruum/ui";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { avanzarEstadoTraslado, extraerRutaComprobante, resolverUrlEvidencia } from "@ruum/api/services";
import { subirArchivoEvidenciaStorage } from "@ruum/api/custody";
import {
  eliminarGastoTraslado,
  listarGastosTraslado,
  listarInspeccionesTraslado,
  registrarGastoTraslado,
} from "@ruum/api/drivers";
import { SecondaryTripNavBar } from "./SecondaryTripNavBar";
import type { PasaporteRow, EstadoTraslado, InspeccionData, GastoData } from "./cierre/cierre-types";
import { labelGasto } from "./cierre/cierre-types";
import { CierreExitoPantalla } from "./cierre/CierreExitoPantalla";
import { CierreConciliacionSection } from "./cierre/CierreConciliacionSection";
import { CierreGastosSection } from "./cierre/CierreGastosSection";
import { CierreConfirmacionModal } from "./cierre/CierreConfirmacionModal";
import { CierreSoporteSheet } from "./cierre/CierreSoporteSheet";
import {
  obtenerEvidenciasDescartadasPorTraslado,
  type EvidenciaDescartada
} from "@/lib/evidencias-descartadas";

export function CierreTrasladoDetails({
  pasaporte,
  volver,
}: {
  pasaporte: PasaporteRow;
  volver: string;
}) {
  const router = useRouter();
  const trasladoId = pasaporte.traslado_id || "";
  const estadoActual = pasaporte.estado as EstadoTraslado;

  const [inspeccionInicial, setInspeccionInicial] = useState<InspeccionData | null>(null);
  const [inspeccionFinal, setInspeccionFinal] = useState<InspeccionData | null>(null);
  const [gastos, setGastos] = useState<GastoData[]>([]);
  const [evidenciasDescartadas, setEvidenciasDescartadas] = useState<EvidenciaDescartada[]>([]);

  const [tipoGasto, setTipoGasto] = useState<GastoData["tipo"]>("caseta");
  const [montoGasto, setMontoGasto] = useState("");
  const [descGasto, setDescGasto] = useState("");
  const [comprobanteArchivo, setComprobanteArchivo] = useState<File | null>(null);

  const [confirmarCierreAbierto, setConfirmarCierreAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisoExito, setAvisoExito] = useState<string | null>(null);
  const [soporteAbierto, setSoporteAbierto] = useState(false);
  const [resolviendoGastoId, setResolviendoGastoId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCierreData() {
      if (!trasladoId) return;
      setCargando(true);
      setError(null);
      try {
        const cliente = crearClienteNavegador();
        const insps = await listarInspeccionesTraslado(cliente, trasladoId);

        if (insps) {
          const inicial = insps.find((i) => i.tipo === "inicial") as InspeccionData | undefined;
          const final = insps.find((i) => i.tipo === "final") as InspeccionData | undefined;
          if (inicial) setInspeccionInicial(inicial);
          if (final) setInspeccionFinal(final);
        }

        const gst = await listarGastosTraslado(cliente, trasladoId);
        if (gst) {
          setGastos(
            gst.map((g) => {
              const { ruta, texto } = extraerRutaComprobante(g.descripcion, g.comprobante_ruta);
              return {
                id: g.id,
                tipo: g.tipo as GastoData["tipo"],
                monto: Number(g.monto),
                descripcion: texto || g.descripcion,
                comprobante_ruta: ruta,
                registrado_en: g.registrado_en,
              };
            })
          );
        }

        const descartes = await obtenerEvidenciasDescartadasPorTraslado(trasladoId);
        setEvidenciasDescartadas(descartes);
      } catch (err) {
        setError(traducirErrorOperativo(err, "No pudimos cargar la información de cierre."));
      } finally {
        setCargando(false);
      }
    }
    void loadCierreData();
  }, [trasladoId]);

  async function handleVerComprobante(gastoId: string, ruta: string) {
    setResolviendoGastoId(gastoId);
    try {
      const cliente = crearClienteNavegador();
      const urlTemporal = await resolverUrlEvidencia(cliente, ruta, 60 * 30);
      if (urlTemporal) {
        window.open(urlTemporal, "_blank", "noopener,noreferrer");
      } else {
        setError("No se pudo generar el enlace temporal para ver el comprobante.");
      }
    } catch {
      setError("No se pudo abrir el comprobante.");
    } finally {
      setResolviendoGastoId(null);
    }
  }

  async function subirArchivoStorage(cliente: ReturnType<typeof crearClienteNavegador>, archivo: File): Promise<string> {
    const { data: sesion } = await cliente.auth.getUser();
    const authUserId = sesion?.user?.id || "conductor";
    const extension = archivo.name.split(".").pop()?.toLowerCase() || "jpg";
    const nombreLimpio = archivo.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
    const ruta = `${authUserId}/${trasladoId}/gastos/${id}-${nombreLimpio}.${extension}`;

    const { error: uploadError } = await subirArchivoEvidenciaStorage(cliente, ruta, archivo, {
      upsert: false,
      contentType: archivo.type || "image/jpeg",
    });
    if (uploadError) throw uploadError;
    return ruta;
  }

  async function handleAgregarGasto(e: React.FormEvent) {
    e.preventDefault();
    if (procesando) return;
    setError(null);

    const montoVal = Number(montoGasto);
    if (isNaN(montoVal) || montoVal <= 0) {
      setError("El monto del gasto debe ser un número mayor a cero.");
      return;
    }

    if ((tipoGasto === "combustible" || tipoGasto === "caseta") && !comprobanteArchivo) {
      setError(`El comprobante de pago (foto del ticket) es obligatorio para registrar gastos de ${labelGasto(tipoGasto)}.`);
      return;
    }

    setProcesando(true);
    try {
      const cliente = crearClienteNavegador();
      let comprobanteRutaSubida: string | null = null;

      if (comprobanteArchivo) {
        comprobanteRutaSubida = await subirArchivoStorage(cliente, comprobanteArchivo);
      }

      const finalDesc = comprobanteRutaSubida
        ? `[COMPROBANTE_RUTA: ${comprobanteRutaSubida}] ${descGasto.trim() || labelGasto(tipoGasto)}`
        : descGasto.trim() || null;

      const data = await registrarGastoTraslado(cliente, {
        trasladoId,
        tipo: tipoGasto,
        monto: montoVal,
        descripcion: finalDesc,
        comprobanteRuta: comprobanteRutaSubida || null,
      });

      if (data) {
        const { ruta, texto } = extraerRutaComprobante(data.descripcion, data.comprobante_ruta);
        const nuevoGasto: GastoData = {
          id: data.id,
          tipo: data.tipo as GastoData["tipo"],
          monto: Number(data.monto),
          descripcion: texto || data.descripcion,
          comprobante_ruta: ruta || comprobanteRutaSubida || null,
          registrado_en: data.registrado_en,
        };
        setGastos((prev) => [nuevoGasto, ...prev]);
        setMontoGasto("");
        setDescGasto("");
        setComprobanteArchivo(null);
      }
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos registrar el gasto."));
    } finally {
      setProcesando(false);
    }
  }

  async function handleEliminarGasto(id: string) {
    if (procesando) return;
    setError(null);
    setProcesando(true);
    try {
      const cliente = crearClienteNavegador();
      await eliminarGastoTraslado(cliente, id);
      setGastos((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos eliminar el gasto."));
    } finally {
      setProcesando(false);
    }
  }

  async function handleFinalizarTraslado() {
    if (procesando) return;
    setProcesando(true);
    setError(null);
    setAvisoExito(null);

    if (
      inspeccionInicial?.kilometraje &&
      inspeccionFinal?.kilometraje &&
      inspeccionFinal.kilometraje <= inspeccionInicial.kilometraje
    ) {
      setError(`Incoherencia en kilometraje: El kilometraje final (${inspeccionFinal.kilometraje.toLocaleString("es-MX")} km) debe ser mayor al inicial (${inspeccionInicial.kilometraje.toLocaleString("es-MX")} km). Por favor, contacta a soporte o corrige el registro.`);
      setProcesando(false);
      return;
    }

    try {
      const cliente = crearClienteNavegador();

      if (montoGasto.trim() !== "") {
        const montoVal = Number(montoGasto);
        if (!isNaN(montoVal) && montoVal > 0) {
          if ((tipoGasto === "combustible" || tipoGasto === "caseta") && !comprobanteArchivo) {
            setError(`Tienes un gasto de ${labelGasto(tipoGasto)} pendiente por agregar. Para registrarlo, debes adjuntar la foto del ticket.`);
            setProcesando(false);
            return;
          }

          let comprobanteRutaSubida: string | null = null;
          if (comprobanteArchivo) {
            comprobanteRutaSubida = await subirArchivoStorage(cliente, comprobanteArchivo);
          }

          const finalDesc = comprobanteRutaSubida
            ? `[COMPROBANTE_RUTA: ${comprobanteRutaSubida}] ${descGasto.trim() || labelGasto(tipoGasto)}`
            : descGasto.trim() || null;

          await registrarGastoTraslado(cliente, {
            trasladoId,
            tipo: tipoGasto,
            monto: montoVal,
            descripcion: finalDesc,
            comprobanteRuta: comprobanteRutaSubida || null,
          });

          setMontoGasto("");
          setDescGasto("");
          setComprobanteArchivo(null);
        }
      }

      if (estadoActual === "evidencia_final_completada") {
        await avanzarEstadoTraslado(cliente, trasladoId, "evidencia_final_completada");
        await new Promise((resolve) => setTimeout(resolve, 300));
        await avanzarEstadoTraslado(cliente, trasladoId, "entrega_confirmada");
      } else if (estadoActual === "entrega_confirmada") {
        await avanzarEstadoTraslado(cliente, trasladoId, "entrega_confirmada");
      }

      setAvisoExito("¡Vehículo entregado y traslado finalizado exitosamente!");
      setTimeout(() => {
        router.push("/viajes");
      }, 1500);
    } catch (err) {
      setError(traducirErrorOperativo(err, "No pudimos completar el cierre del traslado."));
      setProcesando(false);
    }
  }

  const renderBadge = () => {
    if (estadoActual === "evidencia_final_completada") {
      return (
        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-1 rounded-full text-[10px] font-black tracking-widest font-display uppercase">
          Pendiente de Entrega
        </span>
      );
    }
    if (estadoActual === "entrega_confirmada") {
      return (
        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest font-display uppercase">
          Entrega Confirmada
        </span>
      );
    }
    return (
      <span className="bg-emerald-600/20 border border-emerald-500/30 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black tracking-widest font-display uppercase">
        Servicio Cerrado
      </span>
    );
  };

  if (cargando) {
    return (
      <div className="mx-auto w-full max-w-md px-6 py-20 text-center text-text-primary">
        <div className="w-8 h-8 border-4 border-route-action border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-body text-sm font-semibold">Cargando detalles de cierre...</p>
      </div>
    );
  }

  if (estadoActual === "servicio_cerrado") {
    return <CierreExitoPantalla trasladoId={trasladoId} pasaporte={pasaporte} gastos={gastos} />;
  }

  const writable = estadoActual === "evidencia_final_completada";

  return (
    <div className="mx-auto w-full max-w-md md:max-w-xl px-4 py-5 flex flex-col justify-between min-h-screen text-text-primary">
      <div className="w-full flex flex-col flex-1 animate-fade-in pb-36">
        {/* Header */}
        <header className="grid grid-cols-[auto_1fr_auto] items-center pb-3 border-b border-border/10 select-none">
          <Link
            href={volver}
            className="p-1.5 text-text-secondary hover:text-text-primary transition-colors shrink-0 rounded-full hover:bg-surface-elevated/60"
            aria-label="Volver"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="font-display text-sm font-bold text-text-primary">Cierre de Traslado</span>
            <span className="font-mono text-[10px] text-text-tertiary mt-0.5 tracking-wider uppercase">ID {trasladoId.slice(0, 8).toUpperCase()}</span>
          </div>
          <Link
            href={`/cuenta/soporte?traslado=${trasladoId}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/15 bg-surface-elevated hover:bg-surface text-text-primary hover:text-route-action transition-colors shadow-xs focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-route-action"
            aria-label="Ayuda"
          >
            <span className="font-display text-xs font-black">?</span>
          </Link>
        </header>
      <SecondaryTripNavBar trasladoId={trasladoId} pasaporte={pasaporte} />

        {/* Header status badge section */}
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="font-body text-[10px] text-text-tertiary font-bold tracking-wide uppercase">
              REVISION Y CONCILIACION
            </span>
            {renderBadge()}
          </div>
          <h1 className="font-display text-2xl font-black text-text-primary leading-tight mt-0.5">
            Cierre de Traslado
          </h1>
          <p className="font-body text-xs text-text-secondary leading-relaxed mt-0.5">
            Resumen de conciliación de entrega y registro de gastos finales.
          </p>
        </div>

        {/* Card: Vehicle and Route info */}
        <div className="mt-5 bg-surface-elevated border border-border/20 rounded-2xl p-4.5 shadow-xs">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-display text-[9px] font-black text-route-action tracking-widest uppercase">
                  UNIDAD
                </span>
                <h3 className="font-display text-sm font-bold text-text-primary mt-0.5">
                  {pasaporte.vehiculo_marca} {pasaporte.vehiculo_modelo} {pasaporte.vehiculo_anio}
                </h3>
                <p className="font-body text-[11px] text-text-tertiary mt-0.5">
                  Placas: <span className="text-text-secondary font-bold font-mono">{pasaporte.vehiculo_placas || "Por confirmar"}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="font-display text-[9px] font-black text-route-action tracking-widest uppercase">
                  FOLIO VIAJE
                </span>
                <p className="font-display text-xs font-black text-text-primary mt-0.5 font-mono">
                  #{trasladoId.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>
            
            <div className="border-t border-border/10 pt-3 flex justify-between items-center text-xs font-body text-text-secondary">
              <div className="flex flex-col">
                <span className="text-[9px] text-text-tertiary font-black font-display tracking-widest uppercase">ORIGEN</span>
                <span className="font-bold text-text-primary mt-0.5">{pasaporte.origen_ciudad}</span>
              </div>
              <span className="text-text-tertiary font-bold">➔</span>
              <div className="flex flex-col text-right">
                <span className="text-[9px] text-text-tertiary font-black font-display tracking-widest uppercase">DESTINO</span>
                <span className="font-bold text-text-primary mt-0.5">{pasaporte.destino_ciudad}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Banner: Evidencia Descartada si existe */}
        {evidenciasDescartadas.length > 0 && (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/30 p-4 text-xs text-red-200 shadow-md">
            <div className="flex items-center gap-2 font-bold text-red-400 mb-1">
              <span aria-hidden="true">⚠️</span>
              <span>Evidencia descartada en este traslado ({evidenciasDescartadas.length})</span>
            </div>
            <p className="text-text-secondary leading-relaxed">
              Se detectaron fotografías que no pudieron sincronizarse dentro del límite permitido ({evidenciasDescartadas.map((e) => e.angulo || "general").join(", ")}).
              El cierre requerirá confirmación explícita de aviso a Torre de Control para evitar cierre silencioso.
            </p>
          </div>
        )}

        {/* Card: Checklist Conciliación */}
        <CierreConciliacionSection
          inspeccionInicial={inspeccionInicial}
          inspeccionFinal={inspeccionFinal}
        />

        {/* Section: Gastos de Traslado */}
        <CierreGastosSection
          writable={writable}
          gastos={gastos}
          tipoGasto={tipoGasto}
          setTipoGasto={setTipoGasto}
          montoGasto={montoGasto}
          setMontoGasto={setMontoGasto}
          descGasto={descGasto}
          setDescGasto={setDescGasto}
          comprobanteArchivo={comprobanteArchivo}
          setComprobanteArchivo={setComprobanteArchivo}
          procesando={procesando}
          onAgregarGasto={handleAgregarGasto}
          onEliminarGasto={handleEliminarGasto}
          onVerComprobante={handleVerComprobante}
          resolviendoGastoId={resolviendoGastoId}
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
      </div>

      {/* Sticky footer for action buttons */}
      <TripActionDock status={writable ? "Cierre · Confirma la entrega del vehículo" : "Traslado cerrado"} error={error}>
        <div className="max-w-md md:max-w-xl mx-auto flex flex-col gap-2">

          {writable ? (
            <button
              type="button"
              onClick={() => setConfirmarCierreAbierto(true)}
              disabled={procesando}
              className="w-full min-h-[48px] rounded-2xl bg-signal hover:bg-signal/85 text-slate-950 font-display text-xs font-black tracking-widest uppercase transition-all cursor-pointer shadow-lg select-none flex items-center justify-center focus:outline-hidden"
            >
              {procesando ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                "FINALIZAR Y ENTREGAR VEHÍCULO"
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/viajes")}
              className="w-full min-h-[48px] rounded-2xl bg-surface-elevated hover:bg-border/60 text-text-primary font-display text-xs font-black tracking-widest uppercase transition-all cursor-pointer shadow-xs select-none flex items-center justify-center"
            >
              VOLVER A TRASLADOS
            </button>
          )}
        </div>
      </TripActionDock>


      {/* Bottom Sheet de Soporte */}
      <CierreSoporteSheet abierto={soporteAbierto} onCerrar={() => setSoporteAbierto(false)} />

      {/* Confirmation Modal for Finalization */}
      <CierreConfirmacionModal
        abierto={confirmarCierreAbierto}
        onCerrar={() => setConfirmarCierreAbierto(false)}
        onConfirmar={() => {
          setConfirmarCierreAbierto(false);
          void handleFinalizarTraslado();
        }}
        procesando={procesando}
        evidenciasDescartadas={evidenciasDescartadas}
      />
    </div>
  );
}
