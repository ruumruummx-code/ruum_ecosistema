"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { chatDisponible } from "@ruum/shared/rules";
import { crearLlamadaEnmascarada } from "@ruum/api/services";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import {
  crearClienteNavegador,
  tieneSupabaseConfigurado,
} from "../../lib/supabase-browser";
import { CONTACTOS_SOPORTE_USUARIO } from "../../lib/contactos-soporte";
import { progresoPorEstadoTraslado } from "../../lib/inicio";
import { DashboardIcon as Icon } from "../dashboard/DashboardIcon";
import { useDashboardTracking } from "../dashboard/useDashboardTracking";
import { CancelarTraslado } from "../viajes/[id]/CancelarTraslado";
import { EstadoTraslado, VehiculoTraslado } from "./VisualesTraslado";
import {
  fechaProgramada,
  folioCorto,
  vehiculoNombre,
  pestañaDeViaje,
  type ViajeLista,
} from "./useGestionTraslados";
import s from "./traslados-desktop.module.css";

const Mapa = dynamic(
  () => import("../viajes/[id]/MapaPasaporte").then((m) => m.MapaPasaporte),
  {
    ssr: false,
    loading: () => (
      <div className={s.mapEmpty} role="status">
        Cargando mapa…
      </div>
    ),
  },
);
export function DetalleTrasladoDesktop({
  viaje,
  cerrar,
}: {
  viaje: ViajeLista;
  cerrar: () => void;
}) {
  const p = viaje.pasaporte;
  const id = p.traslado_id ?? "";
  const [tab, setTab] = useState("Seguimiento");
  const [cancelar, setCancelar] = useState(false);
  const [llamando, setLlamando] = useState(false);
  const [error, setError] = useState("");
  const [eta, setEta] = useState<number | null>(null);
  const [foto, setFoto] = useState<{ id: string; url: string } | null>(null);
  useEffect(() => {
    if (!p.conductor_id || !tieneSupabaseConfigurado()) return;
    let vigente = true;
    const conductorId = p.conductor_id;
    const cargar = () => {
      void import("@ruum/api/drivers")
        .then(({ obtenerFotoPerfilConductor }) =>
          obtenerFotoPerfilConductor(crearClienteNavegador(), conductorId),
        )
        .then((url) => {
          if (vigente) setFoto(url ? { id: conductorId, url } : null);
        })
        .catch(() => {
          if (vigente) setFoto(null);
        });
    };
    cargar();
    const renovar = window.setInterval(cargar, 25 * 60 * 1000);
    return () => {
      vigente = false;
      window.clearInterval(renovar);
    };
  }, [p.conductor_id]);
  const activo = pestañaDeViaje(p) === "activos";
  const tracking = useDashboardTracking(id, p.estado, activo);
  const progreso = progresoPorEstadoTraslado(p.estado);
  const terminal = ["finalizados", "cancelados"].includes(pestañaDeViaje(p));
  const fecha = fechaProgramada(viaje.traslado?.fecha_hora_programada ?? null);
  const origen =
    viaje.traslado?.origen_direccion ||
    p.origen_direccion ||
    "Dirección pendiente";
  const destino =
    viaje.traslado?.destino_direccion ||
    p.destino_direccion ||
    "Dirección pendiente";
  const coordinates = [
    p.origen_lat,
    p.origen_lng,
    p.destino_lat,
    p.destino_lng,
  ].every((v) => typeof v === "number" && Number.isFinite(v));
  const contacto = Boolean(p.estado && chatDisponible(p.estado));
  async function llamar() {
    setLlamando(true);
    setError("");
    try {
      const numero = await crearLlamadaEnmascarada(crearClienteNavegador(), id);
      if (typeof numero !== "string" || !/^\+?[\d ()-]{8,25}$/.test(numero))
        throw new Error("numero_no_disponible");
      window.location.href = `tel:${numero.replace(/[ ()-]/g, "")}`;
    } catch {
      setError("No pudimos conectar la llamada. Intenta de nuevo.");
    } finally {
      setLlamando(false);
    }
  }
  return (
    <aside className={s.detail} aria-label={`Detalle de ${vehiculoNombre(p)}`}>
      <header className={s.detailHeading}>
        <VehiculoTraslado viaje={viaje} grande />
        <div>
          <h2>{vehiculoNombre(p)}</h2>
          <span>{p.vehiculo_placas || "Placas pendientes"}</span>
          <EstadoTraslado viaje={viaje} />
        </div>
        <button aria-label="Cerrar detalle" onClick={cerrar}>
          <svg
            viewBox="0 0 24 24"
            stroke="currentColor"
            fill="none"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <path d="m5 5 14 14M19 5 5 19" />
          </svg>
        </button>
      </header>
      <div
        className={s.detailTabs}
        role="tablist"
        aria-label="Vista del traslado"
      >
        {["Seguimiento", "Detalles", "Historial"].map((t, i, all) => (
          <button
            key={t}
            id={`detalle-tab-${t}`}
            role="tab"
            tabIndex={t === tab ? 0 : -1}
            aria-selected={t === tab}
            aria-controls="detalle-panel"
            onClick={() => {
              setTab(t);
              setCancelar(false);
            }}
            onKeyDown={(e) => {
              const n =
                e.key === "ArrowRight"
                  ? (i + 1) % 3
                  : e.key === "ArrowLeft"
                    ? (i + 2) % 3
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? 2
                        : -1;
              if (n >= 0) {
                e.preventDefault();
                setTab(all[n]);
                document.getElementById(`detalle-tab-${all[n]}`)?.focus();
              }
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div
        id="detalle-panel"
        role="tabpanel"
        aria-labelledby={`detalle-tab-${tab}`}
        className={s.detailContent}
        data-scroll={cancelar || tab !== "Seguimiento"}
      >
        {cancelar ? (
          <>
            <button className={s.back} onClick={() => setCancelar(false)}>
              Volver al seguimiento
            </button>
            {p.estado && (
              <CancelarTraslado
                trasladoId={id}
                estado={p.estado}
                precio={Number(p.precio_final ?? p.precio_cotizado ?? 0)}
                fechaProgramada={viaje.traslado?.fecha_hora_programada ?? null}
                conductorAsignado={Boolean(p.conductor_id)}
              />
            )}
          </>
        ) : tab === "Seguimiento" ? (
          <>
            <div className={s.map}>
              {coordinates ? (
                <Mapa
                  origen={{ lat: p.origen_lat, lng: p.origen_lng }}
                  destino={{ lat: p.destino_lat, lng: p.destino_lng }}
                  ubicacion={tracking.ubicacion}
                  activo
                  compact
                  seguirUbicacion={activo && Boolean(tracking.ubicacion)}
                  onEta={setEta}
                />
              ) : (
                <div className={s.mapEmpty}>
                  <Icon name="pin" />
                  <span>Ruta por confirmar</span>
                  <small>
                    El mapa aparecerá cuando se confirmen las ubicaciones.
                  </small>
                </div>
              )}
              {id && (
                <Link href={`/viajes/${id}#en-ruta`} className={s.expand}>
                  Abrir en mapa
                  <Icon name="expand" />
                </Link>
              )}
            </div>
            <ol className={s.timeline}>
              <li
                data-done={
                  (!terminal && progreso >= 65) ||
                  pestañaDeViaje(p) === "finalizados"
                }
              >
                <span className={s.step}>
                  <Icon name={progreso >= 65 ? "check" : "car"} />
                </span>
                <div>
                  <strong>
                    {progreso >= 65 && pestañaDeViaje(p) !== "cancelados"
                      ? "Recolección completada"
                      : "Recolección pendiente"}
                  </strong>
                  <p>{origen}</p>
                  <small>
                    Programado: {fecha.fecha}, {fecha.hora}
                  </small>
                </div>
              </li>
              <li data-active={activo}>
                <span className={s.step}>
                  <Icon name="pin" />
                </span>
                <div>
                  <strong>
                    {pestañaDeViaje(p) === "cancelados"
                      ? "Traslado cancelado"
                      : activo
                        ? p.estado
                          ? ETIQUETA_ESTADO_TRASLADO[p.estado]
                          : "En curso"
                        : "Seguimiento"}
                  </strong>
                  <p>
                    {tracking.ubicacion
                      ? "Ubicación actualizada"
                      : "Sin ubicación reciente"}
                  </p>
                  <small>
                    {tracking.actualizado
                      ? fechaProgramada(tracking.actualizado).hora
                      : "Esperando actualización"}
                  </small>
                  {tracking.error && (
                    <small role="status">
                      No pudimos actualizar la ubicación.
                    </small>
                  )}
                </div>
              </li>
              <li data-done={pestañaDeViaje(p) === "finalizados"}>
                <span className={s.step}>
                  <Icon
                    name={pestañaDeViaje(p) === "finalizados" ? "check" : "car"}
                  />
                </span>
                <div>
                  <strong>
                    {pestañaDeViaje(p) === "finalizados"
                      ? "Entrega completada"
                      : "Entrega pendiente"}
                  </strong>
                  <p>{destino}</p>
                  <small>
                    {eta != null && activo
                      ? `Tiempo estimado: ${Math.round(eta)} min`
                      : "Consulta el detalle para más información"}
                  </small>
                </div>
              </li>
            </ol>
          </>
        ) : tab === "Detalles" ? (
          <dl className={s.facts}>
            <dt>Folio</dt>
            <dd>{folioCorto(id)}</dd>
            <dt>Vehículo</dt>
            <dd>{vehiculoNombre(p)}</dd>
            <dt>Placas</dt>
            <dd>{p.vehiculo_placas || "Pendientes"}</dd>
            <dt>Origen</dt>
            <dd>{origen}</dd>
            <dt>Destino</dt>
            <dd>{destino}</dd>
            <dt>Fecha programada</dt>
            <dd>
              {fecha.fecha}, {fecha.hora}
            </dd>
            <dt>Estado</dt>
            <dd>
              {p.estado ? ETIQUETA_ESTADO_TRASLADO[p.estado] : "Pendiente"}
            </dd>
            <dt>Distancia</dt>
            <dd>
              {p.distancia_km != null
                ? `${p.distancia_km} km`
                : "Por confirmar"}
            </dd>
          </dl>
        ) : (
          <div className={s.history}>
            <h3>Actividad del traslado</h3>
            {p.creado_en && (
              <p>
                <strong>Solicitud registrada</strong>
                <small>
                  {fechaProgramada(p.creado_en).fecha},{" "}
                  {fechaProgramada(p.creado_en).hora}
                </small>
              </p>
            )}
            <p>
              <strong>Estado actual</strong>
              <span>
                {p.estado ? ETIQUETA_ESTADO_TRASLADO[p.estado] : "Pendiente"}
              </span>
              {p.actualizado_en && (
                <small>
                  {fechaProgramada(p.actualizado_en).fecha},{" "}
                  {fechaProgramada(p.actualizado_en).hora}
                </small>
              )}
            </p>
            <Link href={`/viajes/${id}`}>
              Consultar expediente completo
              <Icon name="arrow" />
            </Link>
          </div>
        )}
      </div>
      <section className={s.driver} aria-label="Conductor asignado">
        <h3>Conductor asignado</h3>
        <div className={s.driverBody}>
          <span className={s.avatar}>
            {foto?.id === p.conductor_id ? (
              <Image
                src={foto.url}
                alt={`Foto de ${p.conductor_nombre || "conductor"}`}
                width={104}
                height={104}
                unoptimized
                onError={() => setFoto(null)}
              />
            ) : (
              <Icon name="user" />
            )}
          </span>
          <div className={s.driverName}>
            <strong>{p.conductor_nombre || "Por asignar"}</strong>
            {p.conductor_calificacion != null && (
              <span className={s.rating}>
                <Icon name="star" />
                {Number(p.conductor_calificacion).toFixed(1)}
              </span>
            )}
            <small>
              {p.conductor_estado === "activo" ? (
                <>
                  <Icon name="shield" />
                  Conductor verificado
                </>
              ) : (
                "Los datos se actualizan al asignar conductor"
              )}
            </small>
          </div>
          {p.conductor_id && (
            <div className={s.contacts}>
              <button
                aria-label={`Llamar a ${p.conductor_nombre}`}
                disabled={!contacto || llamando}
                onClick={llamar}
              >
                <Icon name="phone" />
              </button>
              <a
                aria-label="Contactar soporte por WhatsApp"
                title="WhatsApp con soporte"
                href={`${CONTACTOS_SOPORTE_USUARIO.soporte.whatsapp.href.split("?")[0]}?text=${encodeURIComponent(`Necesito ayuda con mi traslado ${id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="whatsapp" />
              </a>
              {contacto && (
                <Link
                  aria-label={`Enviar mensaje a ${p.conductor_nombre}`}
                  href={`/viajes/${id}#chat-conductor`}
                >
                  <Icon name="chat" />
                </Link>
              )}
            </div>
          )}
        </div>
        {error && <p role="alert">{error}</p>}
      </section>
      <footer className={s.detailActions}>
        <button
          className={s.danger}
          disabled={terminal || !id}
          onClick={() => setCancelar(true)}
        >
          Cancelar traslado
        </button>
        <Link href={`/soporte?traslado=${encodeURIComponent(id)}`}>
          Contactar soporte
        </Link>
      </footer>
    </aside>
  );
}
