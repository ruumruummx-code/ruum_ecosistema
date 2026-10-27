"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { Database } from "@ruum/shared/types";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import { chatDisponible } from "@ruum/shared/rules";
import { crearLlamadaEnmascarada } from "@ruum/api/services";
import { construirNotificaciones, obtenerViajeActivo, obtenerHistorial, progresoPorEstadoTraslado } from "../lib/inicio";
import { TERMINOLOGIA_USUARIO } from "../lib/glosario";
import { CONTACTOS_SOPORTE_USUARIO } from "../lib/contactos-soporte";
import { crearClienteNavegador } from "../lib/supabase-browser";
import { UserDashboardLayout } from "../components/layout/UserDashboardLayout";
import { DashboardIcon as Icon, type DashboardIconName } from "./dashboard/DashboardIcon";
import { useDashboardTracking } from "./dashboard/useDashboardTracking";
import styles from "./dashboard/dashboard.module.css";

const LiveMap = dynamic(() => import("./viajes/[id]/MapaPasaporte").then(m => m.MapaPasaporte), {
  ssr: false,
  loading: () => <div className={styles.mapLoading} role="status">Cargando mapa…</div>,
});
type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Vehiculo = Database["public"]["Tables"]["vehiculos"]["Row"];
export interface InicioDesktopProps {
  usuario: Usuario | null;
  traslados: Pasaporte[];
  conductorFotoUrl?: string | null;
  vehiculos?: Vehiculo[];
  errorVehiculos?: boolean;
}
const actions: { title: string; description: string; href: string; icon: DashboardIconName; tone: string }[] = [
  { title: "Registrar nuevo traslado", description: "Moviliza un vehículo de forma segura.", href: "/viajes/nuevo", icon: "plus", tone: "blue" },
  { title: "Carga masiva de traslados", description: "Registra varios traslados desde un archivo.", href: "/viajes/masivo", icon: "file", tone: "green" },
  { title: "Mis vehículos registrados", description: "Administra tu flota de vehículos.", href: "/cuenta/vehiculos", icon: "car", tone: "purple" },
  { title: "Ver historial de traslados", description: "Consulta tus traslados anteriores.", href: "/mis-viajes", icon: "clock", tone: "orange" },
];
const tips = [
  { title: "Optimiza tus traslados", text: "Registra varios vehículos en una carga masiva y ahorra tiempo." },
  { title: "Tu traslado, siempre a la vista", text: "Consulta la ruta y las actualizaciones desde tu Pasaporte Digital." },
  { title: "Ten tus documentos a mano", text: "Completa los datos de tu vehículo para agilizar tu próxima solicitud." },
];
function modelo(t: Pasaporte) { return [t.vehiculo_marca, t.vehiculo_modelo, t.vehiculo_anio].filter(Boolean).join(" ") || "Vehículo registrado"; }
function estadoTexto(t: Pasaporte) { return t.estado ? TERMINOLOGIA_USUARIO[t.estado] ?? ETIQUETA_ESTADO_TRASLADO[t.estado] : "Por confirmar"; }
function tono(t: Pasaporte) {
  if (t.estado === "traslado_en_curso") return "green";
  if (["servicio_cerrado", "entrega_confirmada", "pago_completado"].includes(t.estado ?? "")) return "blue";
  if (["traslado_fallido", "servicio_cancelado", "incidencia_reportada"].includes(t.estado ?? "")) return "red";
  return "orange";
}
function VehicleImage({ traslado, vehiculos, hero = false }: { traslado: Pasaporte; vehiculos: Vehiculo[]; hero?: boolean }) {
  const foto = vehiculos.find(v => v.id === traslado.vehiculo_id)?.fotos_urls?.find(url => /^https?:\/\//.test(url));
  const type = traslado.vehiculo_tipo === "suv" ? "suv" : traslado.vehiculo_tipo === "pick_up" ? "pickup" : "sedan";
  return <Image src={foto ?? `/imagenes/dashboard-${type}.webp`} alt={foto ? modelo(traslado) : `Ilustración de ${type === "sedan" ? "sedán" : type === "suv" ? "SUV" : "pickup"}`} width={hero ? 720 : 120} height={hero ? 400 : 70} sizes={hero ? "(min-width: 1600px) 320px, 230px" : "70px"} unoptimized priority={hero} className={hero ? styles.heroCar : styles.vehicleThumb} />;
}
function Driver({ viaje, foto }: { viaje: Pasaporte; foto: string | null }) {
  const [llamando, setLlamando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const disponible = viaje.estado && chatDisponible(viaje.estado);
  const nombre = viaje.conductor_nombre || "Conductor asignado";
  async function llamar() {
    if (!viaje.traslado_id) return;
    setLlamando(true); setError(null);
    try {
      const numero = await crearLlamadaEnmascarada(crearClienteNavegador(), viaje.traslado_id);
      if (typeof numero !== "string" || !/^\+?[\d ()-]{8,25}$/.test(numero)) throw new Error("numero_no_disponible");
      window.location.href = `tel:${numero.replace(/[ ()-]/g, "")}`;
    } catch { setError("No pudimos conectar la llamada. Intenta de nuevo."); }
    finally { setLlamando(false); }
  }
  return <section className={`${styles.card} ${styles.driver}`} aria-label="Conductor asignado">
    <h2 className={styles.cardHeading}><span className={styles.headingIcon}><Icon name="user" /></span>Conductor asignado</h2>
    {viaje.conductor_id ? <>
      <div className={styles.driverBody}>
        <span className={styles.avatar}>{foto ? <Image src={foto} width={88} height={88} alt={`Foto de ${nombre}`} unoptimized /> : <Icon name="user" />}</span>
        <div className={styles.driverIdentity}><strong>{nombre}</strong>{viaje.conductor_calificacion != null && <span className={styles.rating}><Icon name="star" />{Number(viaje.conductor_calificacion).toFixed(1)}</span>}
          <p><Icon name="shield" />{viaje.conductor_estado === "activo" ? "Conductor verificado" : "Conductor asignado"}</p>
          <small>Comunicación segura en tu traslado</small>
        </div>
        <div className={styles.contacts}>
          <button type="button" onClick={llamar} disabled={!disponible || llamando} aria-label={`Llamar a ${nombre}`}><span><Icon name="phone" /></span>{llamando ? "Conectando…" : "Llamar"}</button>
          <a href={CONTACTOS_SOPORTE_USUARIO.soporte.whatsapp.href} target="_blank" rel="noopener noreferrer" aria-label="Contactar soporte por WhatsApp" title="WhatsApp con soporte; el número del conductor es privado"><span className={styles.whatsapp}><Icon name="whatsapp" /></span>WhatsApp <small>soporte</small></a>
          <Link href={`/viajes/${viaje.traslado_id}#chat-conductor`} aria-label={`Enviar mensaje a ${nombre}`}><span><Icon name="chat" /></span>Mensaje</Link>
        </div>
      </div>{error && <p role="alert" className={styles.callError}>{error}</p>}
    </> : <div className={styles.pendingDriver}><Icon name="user" /><p>Estamos buscando a tu conductor.<small>Sus datos y canales de contacto aparecerán aquí al ser asignado.</small></p></div>}
  </section>;
}
function ActiveOverview({ viaje, vehiculos, foto, enabled }: { viaje: Pasaporte; vehiculos: Vehiculo[]; foto: string | null; enabled: boolean }) {
  const { ubicacion, actualizado, error, refrescar } = useDashboardTracking(viaje.traslado_id!, viaje.estado, enabled);
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const progress = progresoPorEstadoTraslado(viaje.estado);
  const current = progress >= 85 ? 2 : progress >= 65 ? 1 : 0;
  const moving = viaje.estado === "traslado_en_curso" || viaje.estado === "incidencia_reportada";
  const fresh = !error && actualizado && Date.now() - Date.parse(actualizado) < 90_000;
  const href = `/viajes/${viaje.traslado_id}`;
  const coordinates = [viaje.origen_lat, viaje.origen_lng, viaje.destino_lat, viaje.destino_lng].every(v => typeof v === "number" && Number.isFinite(v));
  return <section className={styles.overview} aria-label="Traslado activo y seguimiento">
    <article className={styles.activeCard} aria-label="Traslado activo">
      <div className={styles.activeTop}><p className={styles.eyebrow}><i />TRASLADO ACTIVO</p><h2>{modelo(viaje)}</h2><div className={styles.plate}><strong>{viaje.vehiculo_placas || "Sin placas"}</strong><span>Placas: {viaje.vehiculo_placas || "Por confirmar"}</span></div><VehicleImage traslado={viaje} vehiculos={vehiculos} hero /></div>
      <div className={styles.route}><Icon name="pin" /><div><strong>{viaje.origen_ciudad || "Origen por confirmar"}</strong><small>{viaje.origen_direccion || "Punto de recolección"}</small></div><span className={styles.routeLine}><Icon name="arrow" /></span><Icon name="pin" /><div><strong>{viaje.destino_ciudad || "Destino por confirmar"}</strong><small>{viaje.destino_direccion || "Punto de entrega"}</small></div></div>
      <dl className={styles.metrics}><div><dt>ESTADO ACTUAL</dt><dd><span className={styles.status} data-tone={tono(viaje)}><Icon name="car" />{estadoTexto(viaje)}</span></dd></div><div><dt>TIEMPO RESTANTE</dt><dd><Icon name="clock" />{fresh && moving && eta !== null ? `${eta} min` : "Por confirmar"}</dd></div><div><dt>DISTANCIA RESTANTE</dt><dd><Icon name="route" />{fresh && moving && distance !== null ? `${distance} km` : "Por confirmar"}</dd></div></dl>
      <ol className={styles.timeline} aria-label="Progreso del traslado">{["Recolección", "En tránsito", "Entrega"].map((label, index) => {
        const done = progress >= 100 || index < current;
        const active = index === current && progress < 100;
        return <li key={label} data-completed={done} data-active={active}><Link href={`${href}${index === 1 ? "#en-ruta" : "#fotos"}`} aria-current={active ? "step" : undefined}><span>{done ? <Icon name="check" /> : index === 1 ? <Icon name="car" /> : <i />}</span><strong>{index + 1}. {label}</strong><small>{done ? "Completada" : active && (progress >= 40) ? "En curso" : "Pendiente"}</small></Link></li>;
      })}</ol>
      <Link className={styles.detailsButton} href={href}><Icon name="arrow" />Ver detalles del traslado<Icon name="arrow" /></Link>
    </article>
    <div className={styles.trackingColumn}>
      <section className={`${styles.card} ${styles.mapCard}`} aria-label="Seguimiento en vivo"><header className={styles.cardHeading}><span className={styles.headingIcon}><Icon name="car" /></span><h2>Seguimiento en vivo</h2><Link href={`${href}#en-ruta`}>Abrir en mapa<Icon name="expand" /></Link></header>
        <div className={styles.mapArea}>{coordinates && enabled ? <LiveMap origen={{ lat: viaje.origen_lat, lng: viaje.origen_lng }} destino={{ lat: viaje.destino_lat, lng: viaje.destino_lng }} ubicacion={ubicacion} activo compact seguirUbicacion={Boolean(fresh && moving && ubicacion)} haciaOrigen={!moving && progress < 65} onEta={setEta} onDistance={setDistance} /> : <div className={styles.mapLoading}><Icon name="pin" /><p>Ruta por confirmar<small>El mapa aparecerá cuando se confirmen los puntos del traslado.</small></p></div>}
          <button type="button" className={styles.liveBadge} onClick={refrescar} title="Actualizar ubicación" data-live={Boolean(fresh)}><Icon name="refresh" />{error ? "Reintentar seguimiento" : fresh ? "Actualización en tiempo real" : "Esperando ubicación GPS"}<i /></button>
        </div>
      </section><Driver viaje={viaje} foto={foto} />
    </div>
  </section>;
}
export function InicioDesktop({ usuario, traslados, conductorFotoUrl = null, vehiculos = [], errorVehiculos = false }: InicioDesktopProps) {
  const router = useRouter();
  const [tip, setTip] = useState(0);
  const [desktopVisible, setDesktopVisible] = useState(false);
  useEffect(() => {
    const media = window.matchMedia?.("(min-width: 1024px)");
    if (!media) return;
    const actualizar = () => setDesktopVisible(media.matches);
    actualizar();
    media.addEventListener("change", actualizar);
    return () => media.removeEventListener("change", actualizar);
  }, []);
  const [menuId, setMenuId] = useState<string | null>(null);
  const viaje = obtenerViajeActivo(traslados);
  const historial = obtenerHistorial(traslados).filter(t => t.traslado_id);
  const nombre = usuario?.nombre?.trim().split(/\s+/)[0] || "Usuario";
  useEffect(() => {
    if (!desktopVisible) return;
    const actualizar = () => { if (document.visibilityState === "visible" && navigator.onLine) router.refresh(); };
    const timer = window.setInterval(actualizar, 30_000);
    window.addEventListener("focus", actualizar); window.addEventListener("online", actualizar);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", actualizar); window.removeEventListener("online", actualizar); };
  }, [router, desktopVisible]);
  useEffect(() => {
    if (!menuId) return;
    const cerrar = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenuId(null); document.getElementById(`opciones-${menuId}`)?.focus(); } };
    const fuera = (e: MouseEvent) => { if (!(e.target as Element).closest('[data-transfer-menu]')) setMenuId(null); };
    document.addEventListener("keydown", cerrar); document.addEventListener("click", fuera);
    return () => { document.removeEventListener("keydown", cerrar); document.removeEventListener("click", fuera); };
  }, [menuId]);
  return <UserDashboardLayout usuario={usuario} nombre={usuario?.nombre} notificaciones={construirNotificaciones(usuario, traslados)} totalVehiculos={errorVehiculos ? undefined : vehiculos.length} idContenido="desktopMainContent" padding="ninguno" fixedContent dashboardHeader>
    <div className={styles.dashboard} data-testid="desktop-dashboard">
      <header className={styles.welcome}><div><p>Bienvenido de nuevo, {nombre}</p><h1>Tu traslado, en orden.</h1><span>Gestiona, monitorea y da seguimiento a todos tus traslados de forma simple y segura.</span></div><Link href="/viajes/nuevo" className={styles.primary}><Icon name="plus" />Registrar nuevo traslado</Link></header>
      {errorVehiculos && <p role="alert" className={styles.loadError}>No pudimos cargar tus vehículos. <button onClick={() => router.refresh()}>Reintentar</button></p>}
      {viaje?.traslado_id ? <ActiveOverview key={viaje.traslado_id} viaje={viaje} vehiculos={vehiculos} foto={conductorFotoUrl} enabled={desktopVisible} /> : <section className={styles.emptyOverview} aria-label="Sin traslado activo"><div><p className={styles.eyebrow}><Icon name="car" />TU PRÓXIMO DESTINO EMPIEZA AQUÍ</p><h2>No tienes traslados activos</h2><p>Registra un nuevo traslado y sigue cada etapa de tu vehículo desde un solo lugar.</p><Link href="/viajes/nuevo" className={styles.primary}><Icon name="plus" />Registrar traslado</Link></div><Image src="/imagenes/dashboard-sedan.webp" width={720} height={400} alt="Ilustración de un sedán blanco" unoptimized priority /></section>}
      <nav className={styles.quickActions} aria-label="Acciones rápidas">{actions.map(action => <Link key={action.href} href={action.href} data-tone={action.tone}><span className={styles.actionIcon}><Icon name={action.icon} /></span><div><strong>{action.title}</strong><p>{action.description}</p></div><Icon name="chevron" /></Link>)}</nav>
      <div className={styles.bottomRow}>
        <section className={`${styles.card} ${styles.recent}`} aria-label="Últimos traslados"><header className={styles.sectionHeading}><h2>Últimos traslados</h2><Link href="/mis-viajes">Ver todos</Link></header><div className={styles.recentScroll} tabIndex={0} aria-label="Tabla de últimos traslados"><table><thead><tr><th>VEHÍCULO</th><th>ORIGEN</th><th aria-label="Ruta" /><th>DESTINO</th><th>FECHA</th><th>ESTADO</th><th aria-label="Opciones" /></tr></thead><tbody>{historial.map(item => <tr key={item.traslado_id}><td><Link href={`/viajes/${item.traslado_id}`} className={styles.vehicleCell}><VehicleImage traslado={item} vehiculos={vehiculos} /><div><strong>{modelo(item)}</strong><small>{item.vehiculo_placas || "Sin placas"}</small></div></Link></td><td>{item.origen_ciudad || "Por confirmar"}</td><td><Icon name="arrow" /></td><td>{item.destino_ciudad || "Por confirmar"}</td><td>{item.creado_en && Number.isFinite(Date.parse(item.creado_en)) ? <time dateTime={item.creado_en}>{new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric", month: "short" }).format(new Date(item.creado_en))}<small>{new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", hour: "numeric", minute: "2-digit" }).format(new Date(item.creado_en))}</small></time> : "Sin fecha"}</td><td><span className={styles.status} data-tone={tono(item)}><i />{estadoTexto(item)}</span></td><td data-transfer-menu><button id={`opciones-${item.traslado_id}`} type="button" aria-label={`Opciones del traslado ${item.vehiculo_placas || item.traslado_id}`} aria-expanded={menuId === item.traslado_id} onClick={() => setMenuId(menuId === item.traslado_id ? null : item.traslado_id)}><Icon name="more" /></button>{menuId === item.traslado_id && <div className={styles.rowMenu}><Link href={`/viajes/${item.traslado_id}`}>Ver detalles</Link><Link href={`/soporte?traslado=${item.traslado_id}`}>Solicitar ayuda</Link></div>}</td></tr>)}</tbody></table>{!historial.length && <p className={styles.emptyHistory}>Aún no tienes traslados registrados. Aquí encontrarás tus próximos viajes.</p>}</div></section>
        <aside className={styles.supportColumn} aria-label="Ayuda y consejos"><section className={styles.support}><span className={styles.supportIcon}><Icon name="support" /></span><div><h2>¿Necesitas ayuda?</h2><p>Nuestro equipo está listo para apoyarte en todo momento.</p><Link href="/soporte">Contactar soporte<Icon name="chevron" /></Link></div></section><section className={`${styles.card} ${styles.tips}`} aria-label="Tips Ruum Ruum"><header><h2><Icon name="bulb" />Tips Ruum Ruum</h2><div>{tips.map((_, index) => <button key={index} type="button" aria-label={`Ver tip ${index + 1}`} aria-current={tip === index ? "true" : undefined} onClick={() => setTip(index)}><i /></button>)}</div></header><div className={styles.tipContent}><button type="button" aria-label="Tip anterior" onClick={() => setTip((tip + tips.length - 1) % tips.length)}><Icon name="chevron" /></button><div aria-live="polite"><h3>{tips[tip].title}</h3><p>{tips[tip].text}</p></div><button type="button" aria-label="Tip siguiente" onClick={() => setTip((tip + 1) % tips.length)}><Icon name="chevron" /></button></div></section></aside>
      </div>
    </div>
  </UserDashboardLayout>;
}
