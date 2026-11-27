"use client";
import { useCallback, useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bell,
  Calendar,
  Car,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  Clock,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Globe,
  House,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Monitor,
  Pencil,
  Phone,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  User,
} from "lucide-react";
import { Badge, Button, Card, cn } from "@ruum/ui/base";
import { enmascararRfc } from "@ruum/api/services";
import { construirUbicaciones } from "../ubicaciones/ubicaciones-usuario";
import { useCuentaUsuario } from "./useCuentaUsuario";
import type { CuentaReal } from "./cuenta-ui";
import { actividadCuenta, direccionCuenta, fechaCuenta, mesAltaCuenta, type ActividadCuenta } from "./cuenta-model";
import { DialogoCuenta, MODOS_CUENTA, type ModalCuenta } from "./DialogoCuenta";

/** Mismo corte que `lg:` (barra lateral de UserDashboardLayout). */
const QUERY_ESCRITORIO = "(min-width: 1024px)";

type Icono = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;

const TONO_ACTIVIDAD: Record<ActividadCuenta["tono"], "success" | "info" | "warning" | "neutral"> = {
  green: "success",
  blue: "info",
  orange: "warning",
  gray: "neutral",
};

const ENFOQUE = "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring";
const FILA_OPCION = cn("flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-ui-muted", ENFOQUE);

function AvatarCuenta({ url, nombre, iniciales }: { url: string | null; nombre: string; iniciales: string }) {
  const [error, setError] = useState(false);
  return (
    <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ui-brand-soft text-xl font-bold text-ui-brand-soft-fg xl:size-20">
      {url && !error ? (
        <Image
          src={url}
          width={192}
          height={192}
          alt={`Fotografía de ${nombre}`}
          className="size-full object-cover"
          unoptimized
          onError={() => setError(true)}
        />
      ) : (
        <span aria-label={`Iniciales de ${nombre}`}>{iniciales}</span>
      )}
    </span>
  );
}

function CabeceraTarjeta({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold">{titulo}</h2>
      {children}
    </header>
  );
}

function IconoCirculo({ icono: Icono, className }: { icono: Icono; className?: string }) {
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full bg-ui-brand-soft text-ui-brand-soft-fg", className)}>
      <Icono aria-hidden="true" className="size-5" />
    </span>
  );
}

export interface CuentaProps {
  cuenta: CuentaReal;
  seccionInicial?: string;
  /** Marco de navegación que la contiene; `page.tsx` monta una copia en cada uno. */
  marco?: "movil" | "escritorio";
}

/**
 * Mi cuenta: una sola pantalla responsiva. `page.tsx` la coloca en el marco de
 * navegación de cada tamaño (barra inferior en móvil, barra lateral desde 1024 px).
 */
export function Cuenta({ cuenta, seccionInicial, marco }: CuentaProps) {
  const {
    cerrarSesionLocal,
    cerrarSesionGlobal,
    cerrandoSesion,
    errorSesion,
    nombreCompleto,
    primerNombre,
    inicialesUsuario,
    correo,
    telefono,
    esVerificado,
    etiquetaVerificacion,
    esSolicitudConductorPendiente,
    totalIncidencias,
    totalTraslados,
    totalVehiculos,
  } = useCuentaUsuario(cuenta);
  const [modal, setModal] = useState<ModalCuenta | null>(null);
  const cerrarModal = useCallback(() => setModal(null), []);
  /* Las dos copias de la pantalla no pueden compartir ids: la del marco móvil lleva sufijo. */
  const sufijo = marco === "movil" ? "-movil" : "";
  const idPersonal = `informacion-personal-cuenta${sufijo}`;
  const idSeguridad = `seguridad-de-la-cuenta${sufijo}`;

  const usuario = cuenta.usuario;
  const ubicaciones = useMemo(() => construirUbicaciones(usuario, cuenta.traslados ?? []), [usuario, cuenta.traslados]);
  const actividades = useMemo(() => actividadCuenta(cuenta), [cuenta]);
  const direccion = direccionCuenta(usuario);
  const fiscal = cuenta.empresa ?? usuario;
  const faltanDatosFiscales = [fiscal.razon_social, fiscal.rfc, fiscal.regimen_fiscal, fiscal.codigo_postal_fiscal].some((dato) => !dato?.trim());
  const estadoPago =
    usuario.metodo_pago_registrado === true
      ? "Método de pago registrado"
      : usuario.metodo_pago_registrado === false
        ? "Sin método de pago registrado"
        : "Consulta tus opciones de pago";

  /* `?seccion=` solo se aplica en la copia visible: enfoca un bloque o abre su diálogo. */
  useEffect(() => {
    if (!seccionInicial) return;
    const escritorio = Boolean(window.matchMedia?.(QUERY_ESCRITORIO).matches);
    if (marco && (marco === "escritorio") !== escritorio) return;
    if (seccionInicial === "perfil") document.getElementById(idPersonal)?.focus({ preventScroll: marco === "escritorio" });
    else if (MODOS_CUENTA.includes(seccionInicial as ModalCuenta)) setModal(seccionInicial as ModalCuenta);
  }, [seccionInicial, marco, idPersonal]);

  /* Un diálogo modal abierto en la copia que queda oculta dejaría la página inerte. */
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(QUERY_ESCRITORIO);
    const cambiar = () => setModal(null);
    media.addEventListener?.("change", cambiar);
    return () => media.removeEventListener?.("change", cambiar);
  }, []);

  const datosPersonales: [Icono, string, string][] = [
    [User, "Nombre completo", nombreCompleto],
    [Mail, "Correo electrónico", correo],
    [Phone, "Teléfono", telefono],
    [Globe, "País", usuario.pais?.trim() || "País no registrado"],
    [Clock, "Zona horaria del servicio", "(UTC-06:00) Ciudad de México"],
  ];
  const indicadores = [
    [ShieldAlert, totalIncidencias, "Incidencias", "/soporte"],
    [Car, totalTraslados, "Traslados", "/mis-viajes"],
    [Car, totalVehiculos, "Vehículos", "/cuenta/vehiculos"],
    [MapPin, ubicaciones.length, "Ubicaciones", "/ubicaciones"],
  ] as const;
  const accesos: { href: string; icono: Icono; titulo: string; detalle: string }[] = [
    { href: `#${idPersonal}`, icono: User, titulo: "Datos personales", detalle: "Ir a información personal." },
    { href: `#${idSeguridad}`, icono: Lock, titulo: "Seguridad", detalle: "Ir a seguridad de la cuenta." },
    { href: "/cuenta/metodos-pago", icono: CreditCard, titulo: "Métodos de pago", detalle: estadoPago },
    { href: "/cuenta/preferencias", icono: Bell, titulo: "Preferencias", detalle: "Notificaciones y experiencia." },
  ];
  const tarjetaEnfocable = cn("scroll-mt-4", ENFOQUE);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 sm:p-6 xl:gap-5" data-testid="cuenta">
      {errorSesion && !modal && (
        <p role="alert" className="rounded-md bg-ui-danger-soft p-3 text-sm font-medium text-ui-danger">
          {errorSesion}
        </p>
      )}

      <header>
        <p className="text-sm font-medium text-ui-fg-muted">Mi cuenta</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Hola, {primerNombre} <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1 text-sm text-ui-fg-muted">Aquí puedes gestionar tu información, seguridad y configuración.</p>
      </header>

      {esSolicitudConductorPendiente && (
        <div
          role="region"
          aria-label="Estado de solicitud de conductor"
          className="flex items-center gap-3 rounded-lg border border-ui-warning bg-ui-warning-soft p-4"
        >
          <TriangleAlert aria-hidden="true" className="size-5 shrink-0 text-ui-warning" />
          <div>
            <strong className="block text-sm font-semibold text-ui-fg">Solicitud de conductor en revisión</strong>
            <span className="text-sm text-ui-fg-muted">Tu postulación como conductor está en proceso de validación operativa.</span>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.95fr)_minmax(0,1fr)] xl:gap-5">
        <Card asChild className="flex flex-col gap-4 p-4 xl:p-5">
          <section aria-label="Resumen de perfil">
            <div className="flex flex-wrap items-start gap-4">
              <div className="relative">
                <AvatarCuenta key={cuenta.fotoPerfilUrl} url={cuenta.fotoPerfilUrl} nombre={nombreCompleto} iniciales={inicialesUsuario} />
                {esVerificado && (
                  <span className="absolute -right-0.5 -bottom-0.5 flex size-6 items-center justify-center rounded-full border-2 border-ui-card bg-ui-success text-ui-card">
                    <CircleCheck aria-hidden="true" className="size-4" />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="min-w-0 truncate text-lg font-bold">{nombreCompleto}</h2>
                  <Badge tone={esVerificado ? "success" : "warning"}>
                    {esVerificado ? <CircleCheck aria-hidden="true" className="size-3.5" /> : <ShieldAlert aria-hidden="true" className="size-3.5" />}
                    {etiquetaVerificacion}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-ui-fg-muted">{correo}</p>
                <p className="truncate text-sm text-ui-fg-muted">{telefono}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="max-sm:w-full">
                <Link href="/cuenta/datos-personales">
                  <Pencil aria-hidden="true" />
                  Editar perfil
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-1 border-t border-ui-line pt-3 sm:grid-cols-3 2xl:grid-cols-5">
              {indicadores.map(([Icono, valor, etiqueta, href]) => (
                <Link key={etiqueta} href={href} aria-label={`${valor} ${etiqueta}`} className={cn("flex items-center gap-2.5 rounded-md p-2 hover:bg-ui-muted", ENFOQUE)}>
                  <Icono aria-hidden="true" className="size-5 shrink-0 text-ui-fg-muted" />
                  <span className="min-w-0">
                    <strong className="block text-lg leading-tight font-bold tabular-nums">{valor}</strong>
                    <small className="block truncate text-xs text-ui-fg-muted">{etiqueta}</small>
                  </span>
                </Link>
              ))}
              <div className="flex items-center gap-2.5 p-2">
                <Calendar aria-hidden="true" className="size-5 shrink-0 text-ui-fg-muted" />
                <span className="min-w-0">
                  <strong className="block truncate text-sm leading-tight font-bold">{mesAltaCuenta(usuario.creado_en)}</strong>
                  <small className="block truncate text-xs text-ui-fg-muted">Cliente desde</small>
                </span>
              </div>
            </div>
          </section>
        </Card>

        <Card asChild className={cn("flex items-center gap-4 p-4 xl:p-5", esVerificado ? "bg-ui-brand-soft" : "bg-ui-warning-soft")}>
          <section aria-label="Estado de verificación">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold">{esVerificado ? "Tu cuenta está verificada" : etiquetaVerificacion}</h2>
              <p className="mt-1 text-sm text-ui-fg-muted">
                {esVerificado ? "Consulta tus datos y el estado de tus servicios." : "Completa tu verificación para solicitar servicios de traslado."}
              </p>
              {esVerificado ? (
                <Button variant="link" size="sm" className="mt-2" onClick={() => setModal("consejos")}>
                  Ver consejos de seguridad
                  <ArrowRight aria-hidden="true" />
                </Button>
              ) : (
                <Button asChild variant="link" size="sm" className="mt-2">
                  <Link href="/cuenta/verificacion-documentos">
                    Revisar verificación
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              )}
            </div>
            {esVerificado ? (
              <ShieldCheck aria-hidden="true" className="size-14 shrink-0 text-ui-brand" />
            ) : (
              <ShieldAlert aria-hidden="true" className="size-14 shrink-0 text-ui-warning" />
            )}
          </section>
        </Card>
      </div>

      <nav aria-label="Categorías de mi cuenta" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {accesos.map(({ href, icono, titulo, detalle }) => (
          <Card asChild key={titulo} className={cn("flex items-center gap-3 p-3.5 hover:bg-ui-muted", ENFOQUE)}>
            <Link href={href}>
              <IconoCirculo icono={icono} />
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-semibold">{titulo}</strong>
                <small className="block text-xs text-ui-fg-muted">{detalle}</small>
              </span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ui-fg-muted" />
            </Link>
          </Card>
        ))}
      </nav>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:gap-5">
        <div className="flex min-w-0 flex-col gap-4 xl:gap-5">
          <Card asChild className={cn("flex flex-col gap-3 p-4 xl:p-5", tarjetaEnfocable)}>
            <section aria-label="Información personal" id={idPersonal} tabIndex={-1}>
              <CabeceraTarjeta titulo="Información personal">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/cuenta/datos-personales">
                    <Pencil aria-hidden="true" />
                    Editar
                  </Link>
                </Button>
              </CabeceraTarjeta>
              <dl className="flex flex-col divide-y divide-ui-line">
                {datosPersonales.map(([Icono, etiqueta, valor]) => (
                  <div key={etiqueta} className="grid gap-x-3 gap-y-0.5 py-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                    <dt className="flex items-center gap-2 text-sm text-ui-fg-muted">
                      <Icono aria-hidden="true" className="size-4 shrink-0" />
                      {etiqueta}
                    </dt>
                    <dd className="truncate text-sm font-medium" title={valor}>
                      {valor}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </Card>

          <Card asChild className="flex flex-col gap-3 p-4 xl:p-5">
            <section aria-label="Dirección y facturación">
              <CabeceraTarjeta titulo="Dirección y facturación">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/cuenta/facturacion">
                    <Pencil aria-hidden="true" />
                    Editar
                  </Link>
                </Button>
              </CabeceraTarjeta>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/cuenta/datos-personales" className={cn("flex gap-3 rounded-md border border-ui-line p-3 hover:bg-ui-muted", ENFOQUE)}>
                  <IconoCirculo icono={House} className="size-9" />
                  <div className="min-w-0 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">Dirección principal</h3>
                      {direccion.length > 0 && (
                        <Badge tone="info">
                          <MapPin aria-hidden="true" className="size-3" />
                          Predeterminada
                        </Badge>
                      )}
                    </div>
                    {direccion.length ? (
                      direccion.map((linea, i) => (
                        <p key={i} className="text-ui-fg-muted">
                          {linea}
                        </p>
                      ))
                    ) : (
                      <p className="text-ui-fg-muted">Agrega tu dirección principal.</p>
                    )}
                  </div>
                </Link>
                <div className="flex gap-3 rounded-md border border-ui-line p-3">
                  <IconoCirculo icono={FileText} className="size-9" />
                  <div className="min-w-0 text-sm">
                    <h3 className="font-semibold">Datos de facturación</h3>
                    <p className="break-words text-ui-fg-muted">{fiscal.razon_social?.trim() || "Nombre fiscal no registrado"}</p>
                    <p className="text-ui-fg-muted">RFC: {fiscal.rfc?.trim() ? enmascararRfc(fiscal.rfc) : "No registrado"}</p>
                    <p className="text-ui-fg-muted">Régimen fiscal: {fiscal.regimen_fiscal?.trim() || "No registrado"}</p>
                    <p className="text-ui-fg-muted">CP: {fiscal.codigo_postal_fiscal?.trim() || "No registrado"}</p>
                    {faltanDatosFiscales && (
                      <Button asChild variant="link" size="sm" className="mt-2 whitespace-normal text-left">
                        <Link href="/cuenta/facturacion">Completar datos fiscales</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4 xl:gap-5">
          <Card asChild className="flex flex-col gap-3 p-4 xl:p-5">
            <section aria-label="Actividad reciente">
              <CabeceraTarjeta titulo="Actividad reciente">
                <Button asChild variant="link" size="sm">
                  <Link href="/mis-viajes">Ver toda</Link>
                </Button>
              </CabeceraTarjeta>
              {actividades.length ? (
                <ol className="flex flex-col divide-y divide-ui-line">
                  {actividades.map((a) => (
                    <li key={a.id}>
                      <Link href={a.href} className={cn("-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-ui-muted", ENFOQUE)}>
                        <IconoCirculo icono={a.icono === "pin" ? MapPin : a.icono === "user" ? User : Car} className="size-9" />
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-sm font-semibold" title={a.titulo}>
                            {a.titulo}
                          </strong>
                          <time dateTime={a.fecha} className="block text-xs text-ui-fg-muted">
                            {fechaCuenta(a.fecha)}
                          </time>
                        </span>
                        <Badge tone={TONO_ACTIVIDAD[a.tono]} className="shrink-0">
                          {a.etiqueta}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 text-center text-sm">
                  <Clock aria-hidden="true" className="size-6 text-ui-fg-muted" />
                  <p className="text-ui-fg-muted">No hay actividad registrada.</p>
                  <Button asChild variant="link" size="sm">
                    <Link href="/viajes/nuevo">
                      Registrar mi primer traslado
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              )}
            </section>
          </Card>

          <Card asChild className={cn("flex flex-col gap-3 p-4 xl:p-5", tarjetaEnfocable)}>
            <section aria-label="Seguridad de la cuenta" id={idSeguridad} tabIndex={-1}>
              <CabeceraTarjeta titulo="Seguridad de la cuenta">
                <Button variant="link" size="sm" onClick={() => setModal("seguridad")}>
                  Ver detalles
                </Button>
              </CabeceraTarjeta>
              <div className="flex flex-col divide-y divide-ui-line">
                {(
                  [
                    [Lock, "Contraseña", "Actualízala periódicamente", "Cambiar", "/cuenta/cambiar-contrasena"],
                    [ShieldCheck, "Verificación en dos pasos", "Agregar una capa extra de seguridad", "Activar", "mfa"],
                    [Monitor, "Dispositivos activos", "Gestiona tus sesiones iniciadas", "Administrar", "sesiones"],
                  ] as const
                ).map(([Icono, titulo, detalle, accion, destino]) => (
                  <div key={titulo} className="flex items-center gap-3 py-2.5">
                    <Icono aria-hidden="true" className="size-5 shrink-0 text-ui-fg-muted" />
                    <div className="min-w-0 flex-1 text-sm">
                      <strong className="block font-semibold">{titulo}</strong>
                      <small className="block text-xs text-ui-fg-muted">{detalle}</small>
                    </div>
                    {destino.startsWith("/") ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href={destino}>{accion}</Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setModal(destino as ModalCuenta)}>
                        {accion}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </Card>
        </div>
      </div>

      <Card asChild className="overflow-hidden">
        <section aria-label="Más opciones">
          <h2 className="px-4 pt-4 pb-1 text-base font-semibold">Más opciones</h2>
          <div className="flex flex-col divide-y divide-ui-line">
            <Link href="/cuenta/verificacion-documentos" className={FILA_OPCION}>
              <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-ui-fg-muted" />
              <span className="min-w-0 flex-1 text-sm font-semibold">Verificación y documentos</span>
              <Badge tone={esVerificado ? "success" : "warning"}>{etiquetaVerificacion}</Badge>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ui-fg-muted" />
            </Link>
            <Link href="/viajes/masivo" className={FILA_OPCION}>
              <FileSpreadsheet aria-hidden="true" className="size-5 shrink-0 text-ui-fg-muted" />
              <span className="min-w-0 flex-1 text-sm font-semibold">Cargas masivas pendientes</span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ui-fg-muted" />
            </Link>
            <button type="button" aria-haspopup="dialog" className={FILA_OPCION} onClick={() => setModal("soporte")}>
              <CircleHelp aria-hidden="true" className="size-5 shrink-0 text-ui-fg-muted" />
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-semibold">Ayuda y soporte</strong>
                <small className="block text-xs text-ui-fg-muted">Preguntas frecuentes, reportes y contacto</small>
              </span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ui-fg-muted" />
            </button>
            <button type="button" aria-haspopup="dialog" className={FILA_OPCION} onClick={() => setModal("legal")}>
              <Scale aria-hidden="true" className="size-5 shrink-0 text-ui-fg-muted" />
              <span className="min-w-0 flex-1">
                <strong className="block text-sm font-semibold">Legal y cuenta</strong>
                <small className="block text-xs text-ui-fg-muted">Términos, privacidad y eliminación de cuenta</small>
              </span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ui-fg-muted" />
            </button>
            {/* Desde 1024 px el cierre de sesión vive en el menú de usuario de la cabecera. */}
            <button
              type="button"
              className={cn(FILA_OPCION, "text-ui-danger lg:hidden")}
              disabled={cerrandoSesion}
              aria-busy={cerrandoSesion}
              onClick={() => void cerrarSesionLocal()}
            >
              <LogOut aria-hidden="true" className="size-5 shrink-0" />
              <span className="min-w-0 flex-1 text-sm font-semibold">{cerrandoSesion ? "Cerrando sesión…" : "Cerrar sesión"}</span>
            </button>
          </div>
        </section>
      </Card>

      {modal && (
        <DialogoCuenta
          key={modal}
          modo={modal}
          cerrar={cerrarModal}
          cambiar={setModal}
          metodoPago={usuario.metodo_pago_registrado === true}
          correo={correo}
          cerrarSesion={cerrarSesionLocal}
          cerrarSesionGlobal={cerrarSesionGlobal}
          cerrandoSesion={cerrandoSesion}
          errorSesion={errorSesion}
        />
      )}
    </div>
  );
}
