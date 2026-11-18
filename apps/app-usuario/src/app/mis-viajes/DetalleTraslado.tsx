"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Check,
  Maximize2,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { Button, Card, Tabs, TabsContent, TabsList, TabsTrigger, cn } from "@ruum/ui/base";
import { chatDisponible } from "@ruum/shared/rules";
import { crearLlamadaEnmascarada } from "@ruum/api/services";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import { CONTACTOS_SOPORTE_USUARIO } from "../../lib/contactos-soporte";
import { progresoPorEstadoTraslado } from "../../lib/inicio";
import { placaVisible } from "../../lib/traslado-presentacion";
import { useDashboardTracking } from "../dashboard/useDashboardTracking";
import { SolicitudCalificacion } from "../viajes/[id]/SolicitudCalificacion";
import { ExportarPasaportePdf } from "../viajes/[id]/ExportarPasaportePdf";
import { CancelarTraslado } from "../viajes/[id]/CancelarTraslado";
import { EstadoTraslado, VehiculoTraslado } from "./VisualesTraslado";
import { fechaProgramada, folioCorto, vehiculoNombre, pestañaDeViaje, type ViajeLista } from "./useGestionTraslados";

const Mapa = dynamic(() => import("../viajes/[id]/MapaPasaporte").then((m) => m.MapaPasaporte), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-ui-fg-muted" role="status">
      Cargando mapa…
    </div>
  ),
});

type Paso = { titulo: string; texto: string; nota?: string; estado: "hecho" | "actual" | "pendiente"; icono: React.ReactNode };

function LineaTiempo({ pasos }: { pasos: Paso[] }) {
  return (
    <ol className="flex flex-col">
      {pasos.map((paso, i) => (
        <li key={paso.titulo} className="relative flex gap-3 pb-5 last:pb-0">
          {i < pasos.length - 1 && <span aria-hidden="true" className="absolute top-8 bottom-0 left-4 w-px bg-ui-line" />}
          <span
            aria-hidden="true"
            className={cn(
              "relative flex size-8 shrink-0 items-center justify-center rounded-full border [&_svg]:size-4",
              paso.estado === "hecho" && "border-transparent bg-ui-success-soft text-ui-success",
              paso.estado === "actual" && "border-transparent bg-ui-brand text-ui-on-brand",
              paso.estado === "pendiente" && "border-ui-line bg-ui-card text-ui-fg-muted",
            )}
          >
            {paso.icono}
          </span>
          <div className="min-w-0 pt-1">
            <p className="text-sm font-semibold text-ui-fg">{paso.titulo}</p>
            <p className="mt-0.5 text-sm text-ui-fg-muted [overflow-wrap:anywhere]">{paso.texto}</p>
            {paso.nota && <p className="mt-0.5 text-xs text-ui-fg-muted">{paso.nota}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DetalleTraslado({ viaje, cerrar }: { viaje: ViajeLista; cerrar: () => void }) {
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
        .then(({ obtenerFotoPerfilConductor }) => obtenerFotoPerfilConductor(crearClienteNavegador(), conductorId))
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

  const categoria = pestañaDeViaje(p);
  const activo = categoria === "activos";
  const tracking = useDashboardTracking(id, p.estado, activo);
  const progreso = p.cerrado_en || p.estado_operativo === "closed" ? 100 : progresoPorEstadoTraslado(p.estado);
  const terminal = categoria === "finalizados" || categoria === "cancelados";
  const fecha = fechaProgramada(viaje.traslado?.fecha_hora_programada ?? null);
  const origen = viaje.traslado?.origen_direccion || p.origen_direccion || "Dirección pendiente";
  const destino = viaje.traslado?.destino_direccion || p.destino_direccion || "Dirección pendiente";
  const estadoTexto = p.estado ? ETIQUETA_ESTADO_TRASLADO[p.estado] : "Pendiente";
  const coordenadas = [p.origen_lat, p.origen_lng, p.destino_lat, p.destino_lng].every(
    (v) => typeof v === "number" && Number.isFinite(v),
  );
  const contacto = Boolean(p.estado && chatDisponible(p.estado));
  const recolectado = progreso >= 65 && categoria !== "cancelados";

  async function llamar() {
    setLlamando(true);
    setError("");
    try {
      const numero = await crearLlamadaEnmascarada(crearClienteNavegador(), id);
      if (typeof numero !== "string" || !/^\+?[\d ()-]{8,25}$/.test(numero)) throw new Error("numero_no_disponible");
      window.location.href = `tel:${numero.replace(/[ ()-]/g, "")}`;
    } catch {
      setError("No pudimos conectar la llamada. Intenta de nuevo.");
    } finally {
      setLlamando(false);
    }
  }

  const pasos: Paso[] = [
    {
      titulo: recolectado ? "Recolección completada" : "Recolección pendiente",
      texto: origen,
      nota: `Programado: ${fecha.fecha}, ${fecha.hora}`,
      estado: (!terminal && progreso >= 65) || categoria === "finalizados" ? "hecho" : "pendiente",
      icono: recolectado ? <Check /> : <Car />,
    },
    {
      titulo: categoria === "cancelados" ? "Traslado cancelado" : activo ? estadoTexto : "Seguimiento",
      texto: tracking.ubicacion ? "Ubicación actualizada" : "Sin ubicación reciente",
      nota: tracking.error
        ? "No pudimos actualizar la ubicación."
        : tracking.actualizado
          ? fechaProgramada(tracking.actualizado).hora
          : "Esperando actualización",
      estado: activo ? "actual" : "pendiente",
      icono: <MapPin />,
    },
    {
      titulo: categoria === "finalizados" ? "Entrega completada" : "Entrega pendiente",
      texto: destino,
      nota: eta != null && activo ? `Tiempo estimado: ${Math.round(eta)} min` : "Consulta el detalle para más información",
      estado: categoria === "finalizados" ? "hecho" : "pendiente",
      icono: categoria === "finalizados" ? <Check /> : <Car />,
    },
  ];

  return (
    <aside
      aria-label={`Detalle de ${vehiculoNombre(p)}`}
      className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-ui-line bg-ui-card shadow-ui-sm"
    >
      <header className="flex items-start gap-4 border-b border-ui-line p-5">
        <VehiculoTraslado viaje={viaje} grande />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-ui-fg [overflow-wrap:anywhere]">{vehiculoNombre(p)}</h2>
          <p className="mt-0.5 font-mono text-xs text-ui-fg-muted">{placaVisible(p.vehiculo_placas)}</p>
          <EstadoTraslado viaje={viaje} className="mt-2" />
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Cerrar detalle" onClick={cerrar} className="-mt-1 -mr-2">
          <X />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <SolicitudCalificacion key={id} trasladoId={id} conductorId={p.conductor_id} estado={p.estado} cerradoEn={p.cerrado_en ?? p.actualizado_en} />

        <Tabs
          value={tab}
          onValueChange={(valor) => {
            setTab(valor);
            setCancelar(false);
          }}
          className="p-5"
        >
          <TabsList aria-label="Vista del traslado">
            {["Seguimiento", "Detalles", "Historial"].map((t) => (
              <TabsTrigger key={t} value={t}>
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          {cancelar ? (
            <div className="mt-4 flex flex-col gap-3">
              <Button variant="link" className="self-start" onClick={() => setCancelar(false)}>
                <ArrowLeft /> Volver al seguimiento
              </Button>
              {p.estado && (
                <CancelarTraslado
                  cerrado={Boolean(p.cerrado_en) || p.estado_operativo === "closed"}
                  trasladoId={id}
                  estado={p.estado}
                  precio={Number(p.precio_final ?? p.precio_cotizado ?? 0)}
                  fechaProgramada={viaje.traslado?.fecha_hora_programada ?? null}
                  conductorAsignado={Boolean(p.conductor_id)}
                />
              )}
            </div>
          ) : (
            <>
              <TabsContent value="Seguimiento" className="mt-4 flex flex-col gap-5">
                <div className="relative h-44 overflow-hidden rounded-md border border-ui-line bg-ui-muted">
                  {coordenadas ? (
                    <Mapa
                      origen={{ lat: p.origen_lat, lng: p.origen_lng }}
                      destino={{ lat: p.destino_lat, lng: p.destino_lng }}
                      ubicacion={tracking.ubicacion}
                      activo
                      compact
                      seguirUbicacion={activo && Boolean(tracking.ubicacion)}
                      onEta={setEta}
                      origenCiudad={p.origen_ciudad ?? undefined}
                      destinoCiudad={p.destino_ciudad ?? undefined}
                      estadoTexto={p.estado ?? undefined}
                      actualizadoEn={tracking.ubicacion?.registrado_en || p.actualizado_en || undefined}
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 px-6 text-center">
                      <MapPin className="size-5 text-ui-fg-muted" aria-hidden="true" />
                      <span className="text-sm font-medium text-ui-fg">Ruta por confirmar</span>
                      <small className="text-xs text-ui-fg-muted">El mapa aparecerá cuando se confirmen las ubicaciones.</small>
                    </div>
                  )}
                  {id && (
                    <Button asChild size="sm" variant="outline" className="absolute top-2 right-2 h-8">
                      <Link href={`/viajes/${id}#en-ruta`}>
                        Abrir en mapa <Maximize2 />
                      </Link>
                    </Button>
                  )}
                </div>
                <LineaTiempo pasos={pasos} />
              </TabsContent>

              <TabsContent value="Detalles" className="mt-4">
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                  {(
                    [
                      ["Folio", <span key="f" className="font-mono">{folioCorto(id)}</span>],
                      ["Vehículo", vehiculoNombre(p)],
                      ["Placas", <span key="p" className="font-mono">{placaVisible(p.vehiculo_placas)}</span>],
                      ["Origen", origen],
                      ["Destino", destino],
                      ["Fecha programada", `${fecha.fecha}, ${fecha.hora}`],
                      ["Estado", estadoTexto],
                      ["Distancia", p.distancia_km != null ? `${p.distancia_km} km` : "Por confirmar"],
                    ] as const
                  ).map(([etiqueta, valor]) => (
                    <div key={etiqueta} className="contents">
                      <dt className="text-ui-fg-muted">{etiqueta}</dt>
                      <dd className="text-ui-fg [overflow-wrap:anywhere]">{valor}</dd>
                    </div>
                  ))}
                </dl>
              </TabsContent>

              <TabsContent value="Historial" className="mt-4 flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-ui-fg">Actividad del traslado</h3>
                <ul className="flex flex-col gap-3 text-sm">
                  {p.creado_en && (
                    <li className="flex flex-col">
                      <strong className="font-medium text-ui-fg">Solicitud registrada</strong>
                      <small className="text-xs text-ui-fg-muted">
                        {fechaProgramada(p.creado_en).fecha}, {fechaProgramada(p.creado_en).hora}
                      </small>
                    </li>
                  )}
                  <li className="flex flex-col">
                    <strong className="font-medium text-ui-fg">Estado actual</strong>
                    <span className="text-ui-fg">{estadoTexto}</span>
                    {p.actualizado_en && (
                      <small className="text-xs text-ui-fg-muted">
                        {fechaProgramada(p.actualizado_en).fecha}, {fechaProgramada(p.actualizado_en).hora}
                      </small>
                    )}
                  </li>
                </ul>
                <Button asChild variant="link" className="self-start">
                  <Link href={`/viajes/${id}`}>
                    Consultar expediente completo <ArrowRight />
                  </Link>
                </Button>
              </TabsContent>
            </>
          )}
        </Tabs>

        <section aria-label="Conductor asignado" className="px-5 pb-5">
          <Card className="p-4 shadow-none">
            <h3 className="text-xs font-medium text-ui-fg-muted">Conductor asignado</h3>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ui-muted text-ui-fg-muted">
                {foto && foto.id === p.conductor_id ? (
                  <Image
                    src={foto.url}
                    alt={`Foto de ${p.conductor_nombre || "conductor"}`}
                    width={88}
                    height={88}
                    unoptimized
                    className="size-full object-cover"
                    onError={() => setFoto(null)}
                  />
                ) : (
                  <UserRound className="size-5" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-semibold text-ui-fg">
                  <span className="truncate">{p.conductor_nombre || "Por asignar"}</span>
                  {p.conductor_calificacion != null && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-ui-fg-muted">
                      <Star className="size-3.5 fill-current text-ui-warning" aria-hidden="true" />
                      {Number(p.conductor_calificacion).toFixed(1)}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-ui-fg-muted">
                  {p.conductor_estado === "activo" ? (
                    <>
                      <ShieldCheck className="size-3.5 text-ui-success" aria-hidden="true" />
                      Conductor verificado
                    </>
                  ) : (
                    "Los datos se actualizan al asignar conductor"
                  )}
                </p>
              </div>
              {p.conductor_id && (
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Llamar a ${p.conductor_nombre}`}
                    disabled={!contacto || llamando}
                    onClick={llamar}
                  >
                    <Phone />
                  </Button>
                  <Button asChild variant="outline" size="icon-sm">
                    <a
                      aria-label="Contactar soporte por WhatsApp"
                      title="WhatsApp con soporte"
                      href={`${CONTACTOS_SOPORTE_USUARIO.soporte.whatsapp.href.split("?")[0]}?text=${encodeURIComponent(`Necesito ayuda con mi traslado ${id}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle />
                    </a>
                  </Button>
                  {contacto && (
                    <Button asChild variant="outline" size="icon-sm">
                      <Link aria-label={`Enviar mensaje a ${p.conductor_nombre}`} href={`/viajes/${id}#chat-conductor`}>
                        <MessageSquareText />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
            {error && (
              <p role="alert" className="mt-3 text-sm text-ui-danger">
                {error}
              </p>
            )}
          </Card>
        </section>
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-ui-line p-4">
        <ExportarPasaportePdf trasladoId={id} />
        <Button variant="danger" size="sm" disabled={terminal || !id} onClick={() => setCancelar(true)}>
          Cancelar traslado
        </Button>
        <Button asChild variant="ghost" size="sm" className="ml-auto">
          <Link href={`/soporte?traslado=${encodeURIComponent(id)}`}>Contactar soporte</Link>
        </Button>
      </footer>
    </aside>
  );
}
