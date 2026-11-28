"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Ellipsis,
  FileUp,
  Headset,
  IdCard,
  Lightbulb,
  MapPin,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Route,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import { Badge, Button, Card, cn, useMediaQuery } from "@ruum/ui/base";
import type { Database } from "@ruum/shared/types";
import { chatDisponible } from "@ruum/shared/rules";
import { crearLlamadaEnmascarada } from "@ruum/api/services";
import { obtenerFotoPerfilConductor } from "@ruum/api/drivers";
import { obtenerHistorial, obtenerViajeActivo, progresoPorEstadoTraslado } from "../lib/inicio";
import { estadoVisibleTraslado, lineasVehiculo, placaVisible } from "../lib/traslado-presentacion";
import { CONTACTOS_SOPORTE_USUARIO } from "../lib/contactos-soporte";
import { PROMESA_SOPORTE } from "../lib/promesa-soporte";
import { crearClienteNavegador } from "../lib/supabase-browser";
import { TONO_ESTADO } from "./mis-viajes/presentacion";
import { useDashboardTracking } from "./dashboard/useDashboardTracking";

const MapaEnVivo = dynamic(() => import("./viajes/[id]/MapaPasaporte").then((m) => m.MapaPasaporte), {
  ssr: false,
  loading: () => (
    <div role="status" className="flex h-full items-center justify-center text-sm text-ui-fg-muted">
      Cargando mapa…
    </div>
  ),
});

type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Vehiculo = Database["public"]["Tables"]["vehiculos"]["Row"];

/** Desde este ancho la pantalla muestra mapa, historial y tips (marco de escritorio). */
const QUERY_ESCRITORIO = "(min-width: 1024px)";

export interface InicioUsuarioProps {
  usuario: Usuario | null;
  traslados: Pasaporte[];
  conductorFotoUrl?: string | null;
  vehiculos?: Vehiculo[];
  errorVehiculos?: boolean;
  historialReciente?: Pasaporte[];
  totalActivos?: number | null;
  completadosMes?: number | null;
  /**
   * Marco que monta esta copia: `page.tsx` monta una dentro de la navegación móvil
   * (oculta desde 1024 px) y otra dentro de la barra lateral (oculta debajo).
   * Solo la copia visible consulta datos en vivo. Sin marco, siempre activa.
   */
  marco?: "movil" | "escritorio";
}

const TIPS = [
  { titulo: "Optimiza tus traslados", texto: "Registra varios vehículos en una carga masiva y ahorra tiempo." },
  { titulo: "Tu traslado, siempre a la vista", texto: "Consulta la ruta y las actualizaciones desde tu Pasaporte Digital." },
  { titulo: "Ten tus documentos a mano", texto: "Completa los datos de tu vehículo para agilizar tu próxima solicitud." },
];

const ETAPAS = ["Recolección", "En tránsito", "Entrega"];

const formatoNumero = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 });
const formatoDia = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric", month: "short" });
const formatoHora = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", hour: "numeric", minute: "2-digit" });

function nombreVehiculo(t: Pasaporte) {
  return [t.vehiculo_marca, t.vehiculo_modelo, t.vehiculo_anio].filter(Boolean).join(" ") || "Vehículo por confirmar";
}

function primerNombre(usuario: Usuario | null) {
  const nombre = usuario?.nombre?.trim().split(/\s+/)[0];
  return nombre ? nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase() : null;
}

function ImagenVehiculo({ traslado, vehiculos, grande = false, prioridad = false, className }: {
  traslado: Pasaporte;
  vehiculos: Vehiculo[];
  grande?: boolean;
  prioridad?: boolean;
  className?: string;
}) {
  const foto = vehiculos.find((v) => v.id === traslado.vehiculo_id)?.fotos_urls?.find((url) => /^https?:\/\//.test(url));
  const tipo = traslado.vehiculo_tipo === "suv" ? "suv" : traslado.vehiculo_tipo === "pick_up" ? "pickup" : "sedan";
  const alt = foto ? nombreVehiculo(traslado) : `Ilustración de ${tipo === "sedan" ? "sedán" : tipo === "suv" ? "SUV" : "pickup"}`;
  return (
    <Image
      src={foto ?? `/imagenes/dashboard-${tipo}.webp`}
      alt={alt}
      width={grande ? 720 : 120}
      height={grande ? 400 : 70}
      sizes={grande ? "(min-width: 1024px) 240px, 160px" : "64px"}
      unoptimized
      priority={prioridad}
      className={cn("object-contain", className)}
    />
  );
}

/* ---------- Conductor ---------- */

function Conductor({ viaje, foto }: { viaje: Pasaporte; foto: string | null }) {
  const [llamando, setLlamando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!viaje.conductor_id) {
    return (
      <div className="flex items-start gap-3 border-t border-ui-line pt-4">
        <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full bg-ui-brand motion-safe:animate-pulse" />
        <div role="status" className="text-sm">
          <p className="text-ui-fg">Estamos buscando a tu conductor.</p>
          <Link href="/cuenta/preferencias" className="mt-1 inline-block text-ui-fg-muted underline underline-offset-2 hover:text-ui-fg">
            Configurar avisos del traslado
          </Link>
        </div>
      </div>
    );
  }

  const nombre = viaje.conductor_nombre || "Conductor asignado";
  const disponible = Boolean(viaje.estado && chatDisponible(viaje.estado));
  const whatsapp = `${CONTACTOS_SOPORTE_USUARIO.soporte.whatsapp.href.split("?")[0]}?text=${encodeURIComponent(
    `Hola, necesito ayuda con mi traslado ${viaje.traslado_id ?? ""}`,
  )}`;

  async function llamar() {
    if (!viaje.traslado_id) return;
    setLlamando(true);
    setError(null);
    try {
      const numero = await crearLlamadaEnmascarada(crearClienteNavegador(), viaje.traslado_id);
      if (typeof numero !== "string" || !/^\+?[\d ()-]{8,25}$/.test(numero)) throw new Error("numero_no_disponible");
      window.location.href = `tel:${numero.replace(/[ ()-]/g, "")}`;
    } catch {
      setError("No pudimos conectar la llamada. Intenta de nuevo.");
    } finally {
      setLlamando(false);
    }
  }

  return (
    <section aria-label="Conductor asignado" className="border-t border-ui-line pt-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-ui-muted text-ui-fg-muted">
          {foto ? (
            <Image src={foto} width={96} height={96} alt={`Foto de ${nombre}`} unoptimized className="size-full object-cover" />
          ) : (
            <User aria-hidden="true" className="size-6" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-ui-fg-muted">Conductor asignado</p>
          <p className="flex min-w-0 items-center gap-x-2 text-sm font-semibold whitespace-nowrap text-ui-fg">
            <span className="truncate">{nombre}</span>
            {viaje.conductor_calificacion != null && (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-ui-fg-muted">
                <Star aria-hidden="true" className="size-3.5 fill-current text-ui-warning" />
                {Number(viaje.conductor_calificacion).toFixed(1)}
              </span>
            )}
          </p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs whitespace-nowrap text-ui-fg-muted">
            <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">{viaje.conductor_estado === "activo" ? "Conductor verificado" : "Comunicación segura en tu traslado"}</span>
          </p>
        </div>
        <div className="flex w-full gap-2 2xl:w-auto">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 2xl:flex-none"
            onClick={llamar}
            disabled={!disponible || llamando}
            aria-label={llamando ? `Conectando con ${nombre}` : `Llamar a ${nombre}`}
          >
            <Phone aria-hidden="true" />
            {llamando ? "Conectando…" : "Llamar"}
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1 2xl:flex-none">
            <Link href={`/viajes/${viaje.traslado_id}#chat-conductor`} aria-label={`Mensaje a ${nombre}`}>
              <MessageSquare aria-hidden="true" />
              Mensaje
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1 2xl:flex-none">
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp soporte"
              title="WhatsApp con soporte; el número del conductor es privado"
            >
              <MessageCircle aria-hidden="true" className="text-ui-success" />
              Soporte
            </a>
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-md bg-ui-danger-soft px-3 py-2 text-sm text-ui-danger">
          {error}
        </p>
      )}
    </section>
  );
}

/* ---------- Traslado activo ---------- */

function Metrica({ etiqueta, icono, children }: { etiqueta: string; icono?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-0 border-ui-line py-1 sm:border-l sm:pl-4 sm:first:border-l-0 sm:first:pl-0">
      <dt className="text-xs text-ui-fg-muted">{etiqueta}</dt>
      <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-ui-fg [&_svg]:size-4 [&_svg]:text-ui-fg-muted">
        {icono}
        {children}
      </dd>
    </div>
  );
}

function TrasladoActivo({ viaje, vehiculos, foto, mapaActivo, prioridadImagen }: {
  viaje: Pasaporte;
  vehiculos: Vehiculo[];
  foto: string | null;
  mapaActivo: boolean;
  prioridadImagen: boolean;
}) {
  const progreso = progresoPorEstadoTraslado(viaje.estado);
  const enSeguimiento = Boolean(viaje.conductor_id) && progreso >= 40;
  const seguimiento = useDashboardTracking(viaje.traslado_id!, viaje.estado, mapaActivo && enSeguimiento);
  const [etaVivo, setEtaVivo] = useState<number | null>(null);
  const [distanciaViva, setDistanciaViva] = useState<number | null>(null);
  const [etaRuta, setEtaRuta] = useState<number | null>(null);
  const [distanciaRuta, setDistanciaRuta] = useState<number | null>(null);

  const actual = progreso >= 85 ? 2 : progreso >= 65 ? 1 : 0;
  const enMovimiento = enSeguimiento && progreso === 65;
  const reciente = !seguimiento.error && seguimiento.actualizado && Date.now() - Date.parse(seguimiento.actualizado) < 90_000;
  const datosVivos = mapaActivo && enMovimiento;

  const minutos = etaRuta ?? (viaje.tiempo_estimado_horas ? Math.round(viaje.tiempo_estimado_horas * 60) : null);
  const kilometros = distanciaRuta ?? viaje.distancia_km;
  const tiempoEstimado = minutos && minutos > 0
    ? minutos >= 60 ? `~${formatoNumero.format(minutos / 60)} h` : `~${formatoNumero.format(minutos)} min`
    : "Por confirmar";
  const distanciaEstimada = kilometros && kilometros > 0 ? `~${formatoNumero.format(kilometros)} km` : "Por confirmar";

  const estado = estadoVisibleTraslado(viaje);
  const detalle = `/viajes/${viaje.traslado_id}`;
  const folio = viaje.traslado_id?.slice(0, 8).toUpperCase() ?? "—";
  const origen = viaje.origen_ciudad || viaje.origen_direccion || "Origen por confirmar";
  const destino = viaje.destino_ciudad || viaje.destino_direccion || "Destino por confirmar";
  const coordenadas = [viaje.origen_lat, viaje.origen_lng, viaje.destino_lat, viaje.destino_lng].every(
    (v) => typeof v === "number" && Number.isFinite(v),
  );
  const rutaPrevista = viaje.conductor_id ? "Ruta prevista" : "Ruta prevista (en espera de asignación)";
  const tituloMapa = enSeguimiento ? "Seguimiento en vivo" : "Ruta prevista";

  return (
    <>
      <section
        aria-label={`Traslado Activo #${folio}`}
        data-theme="dark"
        className="flex min-w-0 flex-col gap-4 rounded-lg border border-ui-line bg-ui-card p-4 text-ui-fg shadow-ui-md sm:p-6 lg:gap-3 lg:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <Badge tone="info" dot>
              Traslado activo
            </Badge>
            <Link href={detalle} className="mt-2 block rounded-md hover:underline">
              <h2 className="truncate text-xl font-semibold tracking-tight lg:text-2xl" title={nombreVehiculo(viaje)}>
                {nombreVehiculo(viaje)}
              </h2>
            </Link>
            <p className="mt-1 text-sm text-ui-fg-muted">Placas {placaVisible(viaje.vehiculo_placas)}</p>
          </div>
          <ImagenVehiculo traslado={viaje} vehiculos={vehiculos} grande prioridad={prioridadImagen} className="h-16 w-28 shrink-0 sm:h-24 sm:w-40" />
        </div>

        <p className="flex min-w-0 items-center gap-2 text-sm" title={`${origen} → ${destino}`}>
          <MapPin aria-hidden="true" className="size-4 shrink-0 text-ui-fg-muted" />
          <span className="truncate">{origen}</span>
          <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-ui-fg-muted" />
          <span className="sr-only">hacia</span>
          <span className="truncate">{destino}</span>
        </p>

        <dl className="grid gap-3 border-t border-ui-line pt-4 sm:grid-cols-3">
          <Metrica etiqueta="Estado actual">
            <Badge tone={TONO_ESTADO[estado.tono]} dot>{estado.etiqueta}</Badge>
            {estado.detalle && estado.detalle !== estado.etiqueta && (
              <span className="truncate text-xs font-normal text-ui-fg-muted">{estado.detalle}</span>
            )}
          </Metrica>
          <Metrica etiqueta={datosVivos ? "Tiempo restante" : "Tiempo estimado"} icono={<Clock3 aria-hidden="true" />}>
            {datosVivos ? (reciente && etaVivo !== null ? `${etaVivo} min` : "Por confirmar") : tiempoEstimado}
          </Metrica>
          <Metrica etiqueta={datosVivos ? "Distancia restante" : "Distancia estimada"} icono={<Route aria-hidden="true" />}>
            {datosVivos ? (reciente && distanciaViva !== null ? `${distanciaViva} km` : "Por confirmar") : distanciaEstimada}
          </Metrica>
        </dl>

        <ol aria-label="Progreso del traslado" className="grid grid-cols-3">
          {ETAPAS.map((etapa, i) => {
            const completada = progreso >= 100 || i < actual;
            const enCurso = i === actual && progreso < 100;
            const situacion = completada ? "Completada" : enCurso && progreso >= 40 ? "En curso" : "Pendiente";
            return (
              <li
                key={etapa}
                aria-current={enCurso ? "step" : undefined}
                className={cn(
                  "relative min-w-0 text-center",
                  i < ETAPAS.length - 1 &&
                    "after:absolute after:top-4 after:left-[calc(50%+1.25rem)] after:h-0.5 after:w-[calc(100%-2.5rem)] after:bg-ui-line-strong",
                  completada && "after:bg-ui-success",
                )}
              >
                <Link
                  href={`${detalle}${i === 1 ? "#en-ruta" : "#fotos"}`}
                  className="flex flex-col items-center gap-1 rounded-md px-1 py-1 hover:bg-ui-muted"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-8 place-items-center rounded-full border-2 border-ui-line-strong bg-ui-muted text-ui-fg-muted [&_svg]:size-4",
                      completada && "border-ui-success bg-ui-success text-ui-card",
                      enCurso && "border-ui-brand bg-ui-brand text-ui-on-brand",
                    )}
                  >
                    {completada ? <Check /> : i === 1 ? <CarFront /> : <span className="size-1.5 rounded-full bg-current" />}
                  </span>
                  <span className="text-xs font-semibold">
                    {i + 1}. {etapa}
                  </span>
                  <span className="text-xs text-ui-fg-muted">{situacion}</span>
                </Link>
              </li>
            );
          })}
        </ol>

        <Conductor viaje={viaje} foto={foto} />

        <Button asChild variant="outline" className="self-stretch sm:self-end">
          <Link href={detalle}>
            Ver detalles del traslado
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>

      <Card asChild className="hidden min-h-80 flex-col overflow-hidden lg:flex">
        <section aria-label={tituloMapa}>
          <header className="flex items-center gap-2 border-b border-ui-line px-4 py-3">
            <CarFront aria-hidden="true" className="size-4 text-ui-fg-muted" />
            <h2 className="text-sm font-semibold">{tituloMapa}</h2>
            <Button asChild size="sm" variant="ghost" className="ml-auto">
              <Link href={`${detalle}#en-ruta`}>
                Abrir en mapa
                <Maximize2 aria-hidden="true" />
              </Link>
            </Button>
          </header>
          <div className="relative isolate min-h-64 flex-1 bg-ui-muted">
            {coordenadas && mapaActivo ? (
              <MapaEnVivo
                key={enSeguimiento ? "vivo" : "prevista"}
                origen={{ lat: viaje.origen_lat, lng: viaje.origen_lng }}
                destino={{ lat: viaje.destino_lat, lng: viaje.destino_lng }}
                ubicacion={enSeguimiento ? seguimiento.ubicacion : null}
                activo={enSeguimiento}
                compact
                rutaPrevista={!enSeguimiento}
                estadoTexto={enSeguimiento ? estado.etiqueta : rutaPrevista}
                seguirUbicacion={Boolean(reciente && enMovimiento && seguimiento.ubicacion)}
                onEta={enSeguimiento ? setEtaVivo : setEtaRuta}
                onDistance={enSeguimiento ? setDistanciaViva : setDistanciaRuta}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-ui-fg-muted">
                <MapPin aria-hidden="true" className="size-5" />
                <p>Ruta por confirmar</p>
                <p className="text-xs">El mapa aparecerá cuando se confirmen los puntos del traslado.</p>
              </div>
            )}
            {enSeguimiento ? (
              <Button size="sm" variant="outline" onClick={seguimiento.refrescar} className="absolute right-3 bottom-3 z-10 rounded-full shadow-ui-md" title="Actualizar ubicación">
                <RefreshCw aria-hidden="true" />
                {seguimiento.error
                  ? "Reintentar seguimiento"
                  : reciente && seguimiento.realtime
                    ? "Actualización en tiempo real"
                    : reciente
                      ? "Ubicación actualizada"
                      : "Esperando ubicación GPS"}
                <span aria-hidden="true" className={cn("size-2 rounded-full", reciente ? "bg-ui-success" : "bg-ui-warning")} />
              </Button>
            ) : (
              coordenadas && (
                <p className="absolute right-3 bottom-3 z-10 rounded-full border border-ui-line bg-ui-card px-3 py-1.5 text-xs text-ui-fg shadow-ui-md">
                  {rutaPrevista}
                </p>
              )
            )}
          </div>
        </section>
      </Card>
    </>
  );
}

function SinTrasladoActivo({ prioridadImagen }: { prioridadImagen: boolean }) {
  return (
    <section
      aria-label="Sin traslados activos"
      data-theme="dark"
      className="flex items-center gap-4 overflow-hidden rounded-lg border border-ui-line bg-ui-card p-5 text-ui-fg shadow-ui-md sm:p-6 lg:col-span-2"
    >
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">No tienes traslados activos</h2>
        <p className="mt-2 max-w-prose text-sm text-ui-fg-muted">
          Solicita tu primer traslado y sigue cada etapa en tiempo real con evidencia fotográfica.
        </p>
        <Button asChild className="mt-5 w-full sm:w-auto">
          <Link href="/viajes/nuevo">
            <Plus aria-hidden="true" />
            Solicitar traslado
          </Link>
        </Button>
      </div>
      <Image
        src="/imagenes/dashboard-sedan.webp"
        width={720}
        height={400}
        alt=""
        unoptimized
        priority={prioridadImagen}
        className="hidden w-2/5 max-w-sm object-contain sm:block"
      />
    </section>
  );
}

/* ---------- Accesos, historial, soporte y tips ---------- */

function Acceso({ href, titulo, valor, icono, etiqueta, className }: {
  href: string;
  titulo: string;
  valor: string;
  icono: ReactNode;
  etiqueta?: string;
  className?: string;
}) {
  return (
    <Card asChild className={cn("min-w-0", className)}>
      <li>
        <Link
          href={href}
          aria-label={etiqueta}
          className="flex h-full items-center gap-3 rounded-lg p-3 hover:bg-ui-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring"
        >
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-ui-brand-soft text-ui-brand-soft-fg [&_svg]:size-5">
            {icono}
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm font-semibold text-ui-fg">{titulo}</strong>
            <span className="block truncate text-xs text-ui-fg-muted">{valor}</span>
          </span>
        </Link>
      </li>
    </Card>
  );
}

function UltimosTraslados({ historial, vehiculos }: { historial: Pasaporte[]; vehiculos: Vehiculo[] }) {
  const [menuId, setMenuId] = useState<string | null>(null);
  const idBase = useId();

  useEffect(() => {
    if (!menuId) return;
    const cerrar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuId(null);
      document.getElementById(`${idBase}-${menuId}`)?.focus();
    };
    const fuera = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-transfer-menu]")) setMenuId(null);
    };
    document.addEventListener("keydown", cerrar);
    document.addEventListener("click", fuera);
    return () => {
      document.removeEventListener("keydown", cerrar);
      document.removeEventListener("click", fuera);
    };
  }, [menuId, idBase]);

  return (
    <Card asChild className="hidden min-w-0 flex-col lg:flex">
      <section aria-label="Últimos traslados">
        <header className="flex items-center justify-between gap-3 border-b border-ui-line px-4 py-3">
          <h2 className="text-base font-semibold">Últimos traslados</h2>
          <Link href="/mis-viajes" className="text-sm text-ui-brand hover:underline">
            Ver todos
          </Link>
        </header>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-ui-muted text-xs text-ui-fg-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">Vehículo</th>
                <th className="w-1/6 px-2 py-2 font-semibold">Origen</th>
                <th className="w-8 py-2" aria-label="Ruta" />
                <th className="w-1/6 px-2 py-2 font-semibold">Destino</th>
                <th className="w-24 px-2 py-2 font-semibold">Fecha</th>
                <th className="w-28 px-2 py-2 font-semibold">Estado</th>
                <th className="w-12 py-2" aria-label="Opciones" />
              </tr>
            </thead>
            <tbody>
              {historial.map((item) => {
                const { marca, modelo } = lineasVehiculo(item);
                const fecha = item.creado_en && Number.isFinite(Date.parse(item.creado_en)) ? new Date(item.creado_en) : null;
                const estado = estadoVisibleTraslado(item);
                const abierto = menuId === item.traslado_id;
                return (
                  <tr key={item.traslado_id} className="border-b border-ui-line align-middle text-ui-fg-muted hover:bg-ui-muted">
                    <td className="px-3 py-2">
                      <Link href={`/viajes/${item.traslado_id}`} className="flex min-w-0 items-center gap-2 rounded-md">
                        <ImagenVehiculo traslado={item} vehiculos={vehiculos} className="h-8 w-14 shrink-0" />
                        <span className="min-w-0">
                          {marca && <strong className="block truncate font-semibold text-ui-fg">{marca}</strong>}
                          {modelo && <strong className="block truncate font-semibold text-ui-fg">{modelo}</strong>}
                          <span className="block text-xs">{placaVisible(item.vehiculo_placas)}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-2 py-2 break-words">{item.origen_ciudad || "Por confirmar"}</td>
                    <td className="py-2">
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </td>
                    <td className="px-2 py-2 break-words">{item.destino_ciudad || "Por confirmar"}</td>
                    <td className="px-2 py-2">
                      {fecha ? (
                        <time dateTime={fecha.toISOString()}>
                          {formatoDia.format(fecha)}
                          <span className="block text-xs">{formatoHora.format(fecha)}</span>
                        </time>
                      ) : (
                        "Sin fecha"
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <Badge tone={TONO_ESTADO[estado.tono]} title={estado.detalle ?? undefined}>
                        {estado.etiqueta}
                      </Badge>
                    </td>
                    <td data-transfer-menu className="relative py-2">
                      <Button
                        id={`${idBase}-${item.traslado_id}`}
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Opciones del traslado ${item.vehiculo_placas || item.traslado_id}`}
                        aria-expanded={abierto}
                        onClick={() => setMenuId(abierto ? null : item.traslado_id)}
                      >
                        <Ellipsis aria-hidden="true" />
                      </Button>
                      {abierto && (
                        <div className="absolute top-1 right-10 z-20 w-40 rounded-lg border border-ui-line bg-ui-card p-1 shadow-ui-md">
                          <Link href={`/viajes/${item.traslado_id}`} className="block rounded-md px-3 py-2 text-sm text-ui-fg hover:bg-ui-muted">
                            Ver detalles
                          </Link>
                          <Link href={`/soporte?traslado=${item.traslado_id}`} className="block rounded-md px-3 py-2 text-sm text-ui-fg hover:bg-ui-muted">
                            Solicitar ayuda
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!historial.length && <p className="p-6 text-center text-sm text-ui-fg-muted">Aún no hay traslados completados o cancelados.</p>}
        </div>
      </section>
    </Card>
  );
}

function Soporte() {
  return (
    <Card asChild className="flex items-start gap-3 p-4">
      <section aria-label="Ayuda y soporte">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-ui-brand-soft text-ui-brand-soft-fg [&_svg]:size-5">
          <Headset />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">¿Necesitas ayuda?</h2>
          <ul className="mt-1 space-y-0.5 text-sm text-ui-fg-muted">
            <li>{PROMESA_SOPORTE.acceso}</li>
            <li>{PROMESA_SOPORTE.atencion}</li>
            <li>{PROMESA_SOPORTE.respuesta}</li>
            <li>{PROMESA_SOPORTE.emergencia}</li>
          </ul>
          <Button asChild size="sm" variant="secondary" className="mt-3">
            <Link href="/soporte">
              Contactar soporte
              <ChevronRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>
    </Card>
  );
}

function Tips() {
  const [tip, setTip] = useState(0);
  const actual = TIPS[tip];
  return (
    <Card asChild className="hidden p-4 lg:block">
      <section aria-label="Tips Ruum Ruum">
        <header className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb aria-hidden="true" className="size-4 text-ui-warning" />
            Tips Ruum Ruum
          </h2>
          <div className="flex items-center">
            {TIPS.map((item, i) => (
              <button
                key={item.titulo}
                type="button"
                aria-label={`Ver tip ${i + 1}: ${item.titulo}`}
                aria-current={tip === i ? "true" : undefined}
                onClick={() => setTip(i)}
                className="grid size-7 place-items-center rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring pointer-coarse:size-11"
              >
                <span aria-hidden="true" className={cn("size-2 rounded-full border border-ui-fg-muted", tip === i && "border-ui-brand bg-ui-brand")} />
              </button>
            ))}
          </div>
        </header>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-ui-muted p-3">
          <Button size="icon-sm" variant="ghost" aria-label="Tip anterior" onClick={() => setTip((tip + TIPS.length - 1) % TIPS.length)}>
            <ChevronLeft aria-hidden="true" />
          </Button>
          <div aria-live="polite" className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-ui-fg">{actual.titulo}</h3>
            <p className="mt-0.5 text-xs text-ui-fg-muted">{actual.texto}</p>
          </div>
          <Button size="icon-sm" variant="ghost" aria-label="Tip siguiente" onClick={() => setTip((tip + 1) % TIPS.length)}>
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </section>
    </Card>
  );
}

/* ---------- Pantalla ---------- */

/**
 * Inicio del usuario — una sola pantalla para todos los anchos (sistema base v2).
 * 390 px: saludo, traslado activo con conductor, accesos y soporte.
 * ≥1024 px: además mapa en vivo, indicadores, últimos traslados y tips.
 */
export function InicioUsuario({
  usuario,
  traslados,
  conductorFotoUrl = null,
  vehiculos = [],
  errorVehiculos = false,
  historialReciente,
  totalActivos,
  completadosMes,
  marco,
}: InicioUsuarioProps) {
  const router = useRouter();
  const esEscritorio = useMediaQuery(QUERY_ESCRITORIO);
  const montada = !marco || (marco === "escritorio") === esEscritorio;
  const idAccesos = useId();
  const viaje = obtenerViajeActivo(traslados);
  const [foto, setFoto] = useState(conductorFotoUrl);

  useEffect(() => {
    let vigente = true;
    setFoto(conductorFotoUrl);
    if (!montada || !viaje?.conductor_id || conductorFotoUrl) return () => { vigente = false; };
    void obtenerFotoPerfilConductor(crearClienteNavegador(), viaje.conductor_id)
      .then((url) => { if (vigente) setFoto(url); })
      .catch(() => { /* el avatar genérico es un respaldo válido */ });
    return () => { vigente = false; };
  }, [conductorFotoUrl, viaje?.conductor_id, montada]);

  useEffect(() => {
    if (!montada) return;
    const actualizar = () => {
      if (document.visibilityState === "visible" && navigator.onLine) router.refresh();
    };
    const temporizador = window.setInterval(actualizar, 30_000);
    window.addEventListener("focus", actualizar);
    window.addEventListener("online", actualizar);
    return () => {
      window.clearInterval(temporizador);
      window.removeEventListener("focus", actualizar);
      window.removeEventListener("online", actualizar);
    };
  }, [router, montada]);

  const nombre = primerNombre(usuario);
  const ultimo = viaje ?? obtenerHistorial(traslados)[0];
  const pasaporte = ultimo?.traslado_id ? `/viajes/${ultimo.traslado_id}` : "/pasaporte";
  const historial = (historialReciente ?? obtenerHistorial(traslados)).filter(
    (t) => t.traslado_id && (t.estado === "servicio_cerrado" || t.estado === "servicio_cancelado"),
  );
  const totalVehiculos = errorVehiculos ? null : vehiculos.length;

  return (
    <div
      data-testid={marco ? `inicio-${marco}` : "inicio"}
      className="relative flex min-h-full flex-col gap-4 bg-ui-bg px-4 pt-4 pb-[calc(var(--user-mobile-nav-height,5rem)+1.5rem)] text-ui-fg sm:px-6 lg:gap-5 lg:px-8 lg:pt-5 lg:pb-8">
      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{nombre ? `Hola, ${nombre}` : "Hola"}</h1>
          <p className="mt-1 text-sm text-ui-fg-muted">Aquí va el estatus de tu traslado.</p>
        </div>
        {/* En móvil la acción principal es el botón flotante de la navegación. */}
        <Button asChild className="hidden shrink-0 lg:inline-flex">
          <Link href="/viajes/nuevo">
            <Plus aria-hidden="true" />
            Solicitar traslado
          </Link>
        </Button>
      </header>

      {errorVehiculos && (
        <p role="alert" className="flex flex-wrap items-center gap-2 rounded-lg border border-ui-warning bg-ui-warning-soft px-4 py-3 text-sm text-ui-warning">
          No pudimos cargar tus vehículos.
          <Button size="sm" variant="link" onClick={() => router.refresh()}>
            Reintentar
          </Button>
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-5">
        {viaje?.traslado_id ? (
          <TrasladoActivo
            key={viaje.traslado_id}
            viaje={viaje}
            vehiculos={vehiculos}
            foto={foto}
            mapaActivo={montada && esEscritorio}
            prioridadImagen={montada}
          />
        ) : (
          <SinTrasladoActivo prioridadImagen={montada} />
        )}
      </div>

      <nav aria-labelledby={idAccesos}>
        <h2 id={idAccesos} className="sr-only">
          Accesos rápidos
        </h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Acceso
            href="/cuenta/vehiculos"
            titulo="Mis vehículos"
            valor={totalVehiculos === null ? "—" : `${totalVehiculos} ${totalVehiculos === 1 ? "registrado" : "registrados"}`}
            icono={<CarFront />}
          />
          <Acceso href={pasaporte} titulo="Pasaporte digital" valor="Tu último traslado" icono={<IdCard />} />
          <Acceso
            href="/mis-viajes"
            titulo="Traslados activos"
            valor={String(totalActivos ?? "—")}
            icono={<Route />}
            className="hidden lg:block"
          />
          <Acceso
            href="/mis-viajes?tab=finalizados"
            titulo="Completados este mes"
            valor={String(completadosMes ?? "—")}
            icono={<CircleCheck />}
            className="hidden lg:block"
          />
          <Acceso href="/viajes/masivo" titulo="Carga masiva" valor="Importar archivo" icono={<FileUp />} className="hidden lg:block" />
        </ul>
      </nav>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-5">
        <UltimosTraslados historial={historial} vehiculos={vehiculos} />
        <aside aria-label="Ayuda y consejos" className="flex min-w-0 flex-col gap-4 lg:gap-6">
          <Soporte />
          <Tips />
        </aside>
      </div>
    </div>
  );
}
