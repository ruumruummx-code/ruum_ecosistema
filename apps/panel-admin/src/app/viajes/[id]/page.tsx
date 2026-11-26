"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Aviso, EstadoBadge, EstadoStepper } from "@ruum/ui";
import { AdminPageHeader } from "../../admin-ui";
import { AdminLoadingState, AdminEmptyState, AdminErrorState } from "../../admin-components";
import { suscribirCanalSeguro } from "@ruum/shared/utils";
import type { Database } from "@ruum/shared/types";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import {
  obtenerPasaporteDigital,
  listarConductoresAdmin,
  obtenerNotasInternas,
  agregarNotaInterna,
  asignarConductorAdmin,
  cambiarEstatusAdmin,
  obtenerAdminActual,
  obtenerAuditoriaTraslado,
  marcarTrasladoFallido,
  guardarDistanciaYTiempoTraslado,
  sugerirTarifaTraslado,
  clasificarVehiculoParaTarifa,
  aplicarTarifaNormativaAdmin,
  obtenerTrazabilidadMasivaTraslado,
  obtenerFinanzasTrasladoAdmin,
  type FinanzasTrasladoAdmin,
  type TrazabilidadMasivaTraslado
} from "@ruum/api/services";
import { obtenerRutaMapbox, tieneMapboxConfigurado } from "@/lib/mapbox-rutas";
import { obtenerVersionTraslado } from "@ruum/api/transfers";
import { ResolucionLlaves } from "./ResolucionLlaves";
import { VerificacionRepuveAdmin } from "./VerificacionRepuveAdmin";
import { ViajeDetalleCards } from "./ViajeDetalleCards";
import { ViajeDetalleOperaciones } from "./ViajeDetalleOperaciones";
import { ViajeDetalleNotasAuditoria } from "./ViajeDetalleNotasAuditoria";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type ConductorRow = Database["public"]["Tables"]["conductores"]["Row"];
type NotaRow = Database["public"]["Tables"]["notas_internas_traslado"]["Row"];
type AuditoriaRow = Database["public"]["Tables"]["registro_auditoria"]["Row"];
type EstadoTraslado = Database["public"]["Enums"]["estado_traslado"];
type CausaFallido = Database["public"]["Enums"]["causa_fallido"];

export default function PaginaDetalleViajeAdmin() {
  const { id } = useParams<{ id: string }>();

  const [pasaporte, setPasaporte] = useState<PasaporteRow | null>(null);
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [conductores, setConductores] = useState<ConductorRow[]>([]);
  const [notas, setNotas] = useState<NotaRow[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaRow[]>([]);
  const [trazabilidadMasiva, setTrazabilidadMasiva] = useState<TrazabilidadMasivaTraslado | null>(null);
  const [finanzas, setFinanzas] = useState<FinanzasTrasladoAdmin | null>(null);
  const [cargando, setCargando] = useState(true);

  const [precioFinalInput, setPrecioFinalInput] = useState("");
  const [procesando, setProcesando] = useState<"conductor" | "estado" | "precio" | "nota" | "fallido" | "sugerencia" | null>(null);
  const [aviso, setAviso] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const avisoRef = useRef<HTMLDivElement>(null);

  function mostrarAviso(nuevoAviso: { tono: "info" | "danger"; texto: string }) {
    setAviso(nuevoAviso);
    setTimeout(() => avisoRef.current?.focus(), 50);
  }

  const recargar = useCallback(async () => {
    if (!tieneSupabaseConfigurado()) {
      setPasaporte(null);
      setConductores([]);
      setNotas([]);
      setAuditoria([]);
      setTrazabilidadMasiva(null);
      setFinanzas(null);
      setPrecioFinalInput("");
      setVersion(undefined);
      setCargando(false);
      return;
    }

    try {
      const cliente = crearClienteNavegador();
      const [p, v, conds, notasReales, auditoriaReal, adminReal, trazabilidadReal, finanzasReales] = await Promise.all([
        obtenerPasaporteDigital(cliente, id),
        obtenerVersionTraslado(cliente, id),
        listarConductoresAdmin(cliente),
        obtenerNotasInternas(cliente, id),
        obtenerAuditoriaTraslado(cliente, id),
        obtenerAdminActual(cliente),
        obtenerTrazabilidadMasivaTraslado(cliente, id),
        obtenerFinanzasTrasladoAdmin(cliente, id).catch(() => null)
      ]);
      setPasaporte(p);
      setVersion(v ?? undefined);
      setConductores(conds.filter((c) => c.estado === "activo" || c.estado === "modo_prueba_supervisada"));
      setNotas(notasReales);
      setAuditoria(auditoriaReal);
      setTrazabilidadMasiva(trazabilidadReal);
      setFinanzas(finanzasReales);
      setPrecioFinalInput(p?.precio_final != null ? String(p.precio_final) : "");
      if (adminReal) setAdminId(adminReal.id);
    } catch {
      setPasaporte(null);
      setConductores([]);
      setAuditoria([]);
      setTrazabilidadMasiva(null);
      setFinanzas(null);
      setPrecioFinalInput("");
      setVersion(undefined);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    void recargar();

    const cliente = tieneSupabaseConfigurado() ? crearClienteNavegador() : null;
    let desuscribir: (() => Promise<void>) | null = null;

    if (cliente) {
      const canal = cliente
        .channel(`detalle-traslado-${id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "traslados", filter: `id=eq.${id}` }, () => {
          void recargar();
        });

      desuscribir = suscribirCanalSeguro(cliente, canal, {
        onError: (err) => console.warn("[AdminDetalleTraslado] error en canal", err)
      });
    }

    function manejarVisibilidad() {
      if (document.visibilityState === "visible") void recargar();
    }
    document.addEventListener("visibilitychange", manejarVisibilidad);

    const intervalo = setInterval(() => void recargar(), 60000);

    return () => {
      if (desuscribir) void desuscribir();
      document.removeEventListener("visibilitychange", manejarVisibilidad);
      clearInterval(intervalo);
    };
  }, [recargar, id]);

  async function asignar(conductorId: string) {
    if (!pasaporte || !conductorId) return;
    if (!pasaporte.traslado_id || !pasaporte.estado) {
      mostrarAviso({ tono: "danger", texto: "El traslado no tiene folio o estado operativo suficiente para asignar conductor." });
      return;
    }
    const trasladoId = pasaporte.traslado_id;
    const estadoActual = pasaporte.estado;
    setProcesando("conductor");
    setAviso(null);

    try {
      const cliente = crearClienteNavegador();
      await asignarConductorAdmin(cliente, trasladoId, conductorId, estadoActual);
      mostrarAviso({ tono: "info", texto: "Conductor asignado." });
      setPasaporte(await obtenerPasaporteDigital(cliente, trasladoId));
      setAuditoria(await obtenerAuditoriaTraslado(cliente, trasladoId));
    } catch (err) {
      mostrarAviso({ tono: "danger", texto: err instanceof Error ? err.message : "No pudimos asignar el conductor." });
    } finally {
      setProcesando(null);
    }
  }

  async function cambiarEstatus(nuevoEstado: EstadoTraslado) {
    if (!pasaporte || !nuevoEstado) return;
    if (!pasaporte.traslado_id || !pasaporte.estado) {
      mostrarAviso({ tono: "danger", texto: "El traslado no tiene folio o estado operativo suficiente para cambiar estatus." });
      return;
    }
    const trasladoId = pasaporte.traslado_id;
    const estadoActual = pasaporte.estado;
    setProcesando("estado");
    setAviso(null);

    try {
      const cliente = crearClienteNavegador();
      await cambiarEstatusAdmin(cliente, trasladoId, estadoActual, nuevoEstado, undefined, version);
      mostrarAviso({ tono: "info", texto: "Estatus actualizado." });
      const [nuevoP, nuevoV] = await Promise.all([
        obtenerPasaporteDigital(cliente, trasladoId),
        obtenerVersionTraslado(cliente, trasladoId)
      ]);
      setPasaporte(nuevoP);
      setVersion(nuevoV ?? undefined);
      setAuditoria(await obtenerAuditoriaTraslado(cliente, trasladoId));
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("CONCURRENCY_CONFLICT")) {
        mostrarAviso({ tono: "danger", texto: "El registro fue modificado por otro operador. Recarga la página e inténtalo de nuevo." });
      } else {
        mostrarAviso({ tono: "danger", texto: err instanceof Error ? err.message : "No pudimos cambiar el estatus." });
      }
    } finally {
      setProcesando(null);
    }
  }

  async function guardarClasificacionVehiculo(
    categoria: Database["public"]["Enums"]["categoria_tarifa_vehiculo"],
    gama: Database["public"]["Enums"]["gama_vehiculo"],
    condicion: Database["public"]["Enums"]["condicion_vehiculo"]
  ) {
    if (!pasaporte || !pasaporte.vehiculo_id || !pasaporte.traslado_id) return;
    const trasladoId = pasaporte.traslado_id;
    setProcesando("sugerencia");
    setAviso(null);
    try {
      const cliente = crearClienteNavegador();
      await clasificarVehiculoParaTarifa(cliente, pasaporte.vehiculo_id, {
        categoria_tarifa: categoria,
        gama,
        condicion
      });
      setPasaporte(await obtenerPasaporteDigital(cliente, trasladoId));
      mostrarAviso({ tono: "info", texto: "Clasificación del vehículo guardada." });
    } catch (err) {
      mostrarAviso({ tono: "danger", texto: err instanceof Error ? err.message : "No se pudo guardar la clasificación." });
    } finally {
      setProcesando(null);
    }
  }

  async function calcularTarifaNormativa() {
    if (!pasaporte) return null;
    if (!pasaporte.traslado_id) {
      mostrarAviso({ tono: "danger", texto: "El traslado no tiene folio suficiente para calcular tarifa." });
      return null;
    }
    const trasladoId = pasaporte.traslado_id;
    const coordenadasCompletas =
      pasaporte.origen_lat != null && pasaporte.origen_lng != null &&
      pasaporte.destino_lat != null && pasaporte.destino_lng != null;
    if (!coordenadasCompletas) {
      mostrarAviso({ tono: "danger", texto: "El traslado no tiene coordenadas de origen/destino completas." });
      return null;
    }
    const requiereRuta = pasaporte.distancia_km == null || pasaporte.tiempo_estimado_horas == null;
    if (requiereRuta && !tieneMapboxConfigurado()) {
      mostrarAviso({ tono: "danger", texto: "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN no está configurado en este entorno." });
      return null;
    }

    setProcesando("sugerencia");
    setAviso(null);
    try {
      const cliente = crearClienteNavegador();
      let distanciaKm = pasaporte.distancia_km;
      let tiempoHoras = pasaporte.tiempo_estimado_horas;

      if (requiereRuta) {
        const ruta = await obtenerRutaMapbox(
          [pasaporte.origen_lng!, pasaporte.origen_lat!],
          [pasaporte.destino_lng!, pasaporte.destino_lat!]
        );
        distanciaKm = ruta.distanciaKm;
        tiempoHoras = ruta.tiempoHoras;
        if (distanciaKm == null || tiempoHoras == null) {
          mostrarAviso({ tono: "danger", texto: "Mapbox Directions no devolvió una ruta calculable para este origen/destino." });
          return null;
        }

        await guardarDistanciaYTiempoTraslado(cliente, trasladoId, {
          distancia_km: distanciaKm,
          tiempo_estimado_horas: tiempoHoras
        });
      }

      const tarifa = await sugerirTarifaTraslado(cliente, trasladoId);
      setPrecioFinalInput(String(tarifa));
      setPasaporte(await obtenerPasaporteDigital(cliente, trasladoId));
      mostrarAviso({
        tono: "info",
        texto: `Tarifa normativa calculada: $${tarifa.toLocaleString("es-MX")} · Ruta: ${distanciaKm} km, ${tiempoHoras} h.`
      });
      return tarifa;
    } catch (err) {
      mostrarAviso({
        tono: "danger",
        texto: err instanceof Error ? err.message : "No se pudo calcular la tarifa normativa."
      });
      return null;
    } finally {
      setProcesando(null);
    }
  }

  async function aplicarTarifaNormativa() {
    if (!pasaporte) return;
    if (!pasaporte.traslado_id) {
      mostrarAviso({ tono: "danger", texto: "El traslado no tiene folio suficiente para emitir cotización." });
      return;
    }
    const trasladoId = pasaporte.traslado_id;

    setAviso(null);

    try {
      const tarifa = await calcularTarifaNormativa();
      if (tarifa == null || Number.isNaN(tarifa) || tarifa <= 0) {
        mostrarAviso({ tono: "danger", texto: "No se pudo obtener una tarifa normativa válida para aplicar." });
        return;
      }
      setProcesando("precio");
      const cliente = crearClienteNavegador();
      const aplicada = await aplicarTarifaNormativaAdmin(cliente, trasladoId);
      setPrecioFinalInput(String(aplicada));
      mostrarAviso({ tono: "info", texto: "Tarifa normativa aplicada y cotización emitida para aceptación del usuario." });
      setPasaporte(await obtenerPasaporteDigital(cliente, trasladoId));
      setAuditoria(await obtenerAuditoriaTraslado(cliente, trasladoId));
    } catch (err) {
      mostrarAviso({ tono: "danger", texto: err instanceof Error ? err.message : "No pudimos aplicar la tarifa normativa." });
    } finally {
      setProcesando(null);
    }
  }

  async function marcarFallido(causa: CausaFallido) {
    if (!pasaporte) return;
    if (!pasaporte.traslado_id) {
      mostrarAviso({ tono: "danger", texto: "El traslado no tiene folio suficiente para marcarlo como fallido." });
      return;
    }
    const trasladoId = pasaporte.traslado_id;
    setProcesando("fallido");
    setAviso(null);

    try {
      const cliente = crearClienteNavegador();
      const resultado = await marcarTrasladoFallido(cliente, trasladoId, causa);
      mostrarAviso({ tono: "info", texto: resultado.mensaje });
      setPasaporte(await obtenerPasaporteDigital(cliente, trasladoId));
      setAuditoria(await obtenerAuditoriaTraslado(cliente, trasladoId));
    } catch (err) {
      mostrarAviso({ tono: "danger", texto: err instanceof Error ? err.message : "No pudimos marcar el traslado como fallido." });
    } finally {
      setProcesando(null);
    }
  }

  async function agregarNota(contenido: string) {
    if (!pasaporte || !contenido.trim()) return;
    if (!pasaporte.traslado_id) {
      mostrarAviso({ tono: "danger", texto: "El traslado no tiene folio suficiente para agregar notas." });
      return;
    }
    const trasladoId = pasaporte.traslado_id;
    setProcesando("nota");
    setAviso(null);

    if (!adminId) {
      mostrarAviso({ tono: "danger", texto: "No pudimos identificar al administrador para guardar la nota." });
      setProcesando(null);
      return;
    }

    try {
      const cliente = crearClienteNavegador();
      await agregarNotaInterna(cliente, trasladoId, adminId, contenido);
      setNotas(await obtenerNotasInternas(cliente, trasladoId));
    } catch (err) {
      mostrarAviso({ tono: "danger", texto: err instanceof Error ? err.message : "No pudimos guardar la nota." });
    } finally {
      setProcesando(null);
    }
  }

  if (cargando) {
    return (
      <main className="admin-page-shell">
        <AdminLoadingState label="Cargando detalle del traslado" />
      </main>
    );
  }

  if (!pasaporte) {
    return (
      <main className="admin-page-shell">
        <AdminEmptyState
          title="No encontramos ese traslado"
          description="El traslado que buscas no existe o no está disponible."
          action={<Link href="/viajes" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-fg">← Volver a traslados</Link>}
        />
      </main>
    );
  }

  if (!pasaporte.traslado_id || !pasaporte.estado) {
    return (
      <main className="admin-page-shell">
        <AdminErrorState
          title="No pudimos cargar el estado del traslado"
          description="El registro no incluye folio o estado operativo suficiente para administrarlo."
          action={<Link href="/viajes" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-fg">← Volver a traslados</Link>}
        />
      </main>
    );
  }

  return (
    <main className="admin-page-shell">
      <AdminPageHeader
        etiqueta="Operación"
        titulo={`${pasaporte.vehiculo_marca} ${pasaporte.vehiculo_modelo} ${pasaporte.vehiculo_anio ?? ""}`}
        descripcion={`Folio ${pasaporte.traslado_id.slice(0, 8).toUpperCase()}`}
        breadcrumb={[
          { label: "Traslados", href: "/viajes" },
          { label: pasaporte.traslado_id.slice(0, 8).toUpperCase() }
        ]}
        accion={
          <>
            <EstadoBadge estado={pasaporte.estado} />
            <Link href={`/viajes/${pasaporte.traslado_id}/custodia`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-fg">Cadena de custodia</Link>
            <Link href={`/viajes/${pasaporte.traslado_id}/tracking`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-fg">Tracking GPS</Link>
          </>
        }
      />

      {aviso && (
        <div
          ref={avisoRef}
          tabIndex={-1}
          className="mt-4 outline-none"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>
        </div>
      )}

      <div className="mt-6">
        <EstadoStepper estado={pasaporte.estado} />
      </div>
      <ResolucionLlaves trasladoId={id} />
      <VerificacionRepuveAdmin trasladoId={id} />

      <ViajeDetalleCards
        pasaporte={pasaporte}
        finanzas={finanzas}
        trazabilidadMasiva={trazabilidadMasiva}
      />

      <ViajeDetalleOperaciones
        pasaporte={pasaporte}
        conductores={conductores}
        procesando={procesando}
        precioFinalInput={precioFinalInput}
        onAsignarConductor={asignar}
        onCambiarEstatus={cambiarEstatus}
        onGuardarClasificacion={guardarClasificacionVehiculo}
        onCalcularTarifa={calcularTarifaNormativa}
        onAplicarTarifa={aplicarTarifaNormativa}
        onMarcarFallido={marcarFallido}
      />

      <ViajeDetalleNotasAuditoria
        notas={notas}
        auditoria={auditoria}
        procesando={procesando}
        onAgregarNota={agregarNota}
      />
    </main>
  );
}
