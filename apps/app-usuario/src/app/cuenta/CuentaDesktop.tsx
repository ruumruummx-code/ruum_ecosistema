"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useCuentaUsuario } from "./useCuentaUsuario";
import type { CuentaReal } from "./cuenta-ui";
import { construirNotificaciones } from "../../lib/inicio";
import { construirUbicaciones } from "../ubicaciones/ubicaciones-usuario";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";
import {
  actividadCuenta,
  antiguedadCuenta,
  direccionCuenta,
  fechaCuenta,
} from "./cuenta-desktop-model";
import {
  AvatarCuenta,
  CabeceraCuentaArte,
  CuentaIcon as Icon,
  EscudoCuenta,
  type CuentaIconName,
} from "./CuentaVisual";
import { DialogoCuentaDesktop, type ModalCuenta } from "./DialogoCuentaDesktop";
import s from "./cuenta-desktop.module.css";
export interface CuentaDesktopProps {
  cuenta: CuentaReal;
  seccionInicial?: string;
}
const modos: ModalCuenta[] = [
  "consejos",
  "seguridad",
  "mfa",
  "sesiones",
  "pagos",
  "legal",
  "soporte",
];
export function CuentaDesktop({ cuenta, seccionInicial }: CuentaDesktopProps) {
  const {
    cerrarSesion,
    cerrandoSesion,
    errorSesion,
    nombreCompleto,
    primerNombre,
    inicialesUsuario,
    correo,
    telefono,
    esVerificado,
    etiquetaVerificacion,
    totalIncidencias,
    totalTraslados,
    totalVehiculos,
  } = useCuentaUsuario(cuenta);
  const [modal, setModal] = useState<ModalCuenta | null>(null);
  const origenModal = useRef<HTMLElement | null>(null);
  const abrirModal = useCallback((modo: ModalCuenta) => {
    origenModal.current = document.activeElement as HTMLElement | null;
    setModal(modo);
  }, []);
  const cerrarModal = useCallback(() => {
    setModal(null);
    requestAnimationFrame(() =>
      origenModal.current?.focus({ preventScroll: true }),
    );
  }, []);
  const usuario = cuenta.usuario;
  const ubicaciones = useMemo(
    () => construirUbicaciones(usuario, cuenta.traslados ?? []),
    [usuario, cuenta.traslados],
  );
  const actividades = useMemo(() => actividadCuenta(cuenta), [cuenta]);
  const direccion = direccionCuenta(usuario);
  const fiscal = cuenta.empresa ?? usuario;
  useEffect(() => {
    if (window.innerWidth < 1024) return;
    if (seccionInicial === "perfil")
      document
        .getElementById("informacion-personal-cuenta")
        ?.focus({ preventScroll: true });
    else if (modos.includes(seccionInicial as ModalCuenta))
      setModal(seccionInicial as ModalCuenta);
  }, [seccionInicial]);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(min-width: 1024px)");
    const cambiar = (event: MediaQueryListEvent) => {
      if (!event.matches) setModal(null);
    };
    media.addEventListener("change", cambiar);
    return () => media.removeEventListener("change", cambiar);
  }, []);
  const datosPersonales: [CuentaIconName, string, string][] = [
    ["user", "Nombre completo", nombreCompleto],
    ["mail", "Correo electrónico", correo],
    ["phone", "Teléfono", telefono],
    ["globe", "País", usuario.pais?.trim() || "País no registrado"],
    ["clock", "Zona horaria del servicio", "(UTC-06:00) Ciudad de México"],
  ];
  return (
    <UserDashboardLayout
      usuario={usuario}
      nombre={nombreCompleto}
      correo={correo}
      totalVehiculos={totalVehiculos}
      notificaciones={construirNotificaciones(usuario, cuenta.traslados ?? [])}
      onCerrarSesion={cerrarSesion}
      fixedContent
      dashboardHeader
      padding="ninguno"
      idContenido="contenido-cuenta"
    >
      <div className={s.page} data-testid="account-desktop">
        {errorSesion && !modal && (
          <div role="alert" className={s.error}>
            {errorSesion}
          </div>
        )}
        <header className={s.heading}>
          <div>
            <p>Mi cuenta</p>
            <h1>
              Hola, {primerNombre} <span aria-hidden="true">👋</span>
            </h1>
            <span>
              Aquí puedes gestionar tu información, seguridad y configuración.
            </span>
          </div>
          <CabeceraCuentaArte />
        </header>
        <div className={s.banners}>
          <section className={s.profile} aria-label="Resumen de perfil">
            <div className={s.profileTop}>
              <div className={s.avatarWrap}>
                <AvatarCuenta
                  key={cuenta.fotoPerfilUrl}
                  url={cuenta.fotoPerfilUrl}
                  nombre={nombreCompleto}
                  iniciales={inicialesUsuario}
                />
                <span className={s.avatarMark} data-verified={esVerificado}>
                  <Icon name="check" />
                </span>
              </div>
              <div className={s.profileIdentity}>
                <div>
                  <h2>{nombreCompleto}</h2>
                  <span className={s.verification} data-verified={esVerificado}>
                    <Icon name={esVerificado ? "check" : "shield"} />
                    {etiquetaVerificacion}
                  </span>
                </div>
                <p>{correo}</p>
                <p>{telefono}</p>
              </div>
              <Link className={s.editProfile} href="/cuenta/datos-personales">
                <Icon name="edit" />
                Editar perfil
              </Link>
            </div>
            <div className={s.stats}>
              {(
                [
                  ["shield", totalIncidencias, "Incidencias", "/soporte"],
                  ["car", totalTraslados, "Traslados", "/mis-viajes"],
                  ["car", totalVehiculos, "Vehículos", "/cuenta/vehiculos"],
                  ["pin", ubicaciones.length, "Ubicaciones", "/ubicaciones"],
                  [
                    "calendar",
                    antiguedadCuenta(usuario.creado_en),
                    "Cliente desde",
                    "/cuenta/datos-personales",
                  ],
                ] as const
              ).map(([icon, value, label, href]) => (
                <Link key={label} href={href} aria-label={`${value} ${label}`}>
                  <Icon name={icon} />
                  <div>
                    <strong>{value}</strong>
                    <small>{label}</small>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <section
            className={s.verifiedBanner}
            aria-label="Estado de verificación"
          >
            <div>
              <h2>
                {esVerificado
                  ? "Tu cuenta está verificada"
                  : etiquetaVerificacion}
              </h2>
              <p>
                {esVerificado
                  ? "Consulta tus datos y el estado de tus servicios."
                  : "Completa tu verificación para solicitar servicios de traslado."}
              </p>
              {esVerificado ? (
                <button onClick={() => abrirModal("consejos")}>
                  Ver consejos de seguridad
                  <Icon name="arrow" />
                </button>
              ) : (
                <Link href="/cuenta/verificacion-documentos">
                  Revisar verificación
                  <Icon name="arrow" />
                </Link>
              )}
            </div>
            <EscudoCuenta verificado={esVerificado} />
          </section>
        </div>
        <nav className={s.quickLinks} aria-label="Categorías de mi cuenta">
          <Link href="/cuenta/datos-personales" data-tone="blue">
            <span className={s.quickIcon}>
              <Icon name="user" />
            </span>
            <div>
              <strong>Datos personales</strong>
              <small>Consulta y actualiza tu información.</small>
            </div>
            <Icon name="chevron" />
          </Link>
          <button onClick={() => abrirModal("seguridad")} data-tone="green">
            <span className={s.quickIcon}>
              <Icon name="lock" />
            </span>
            <div>
              <strong>Seguridad</strong>
              <small>Contraseña y verificación.</small>
            </div>
            <Icon name="chevron" />
          </button>
          <button onClick={() => abrirModal("pagos")} data-tone="purple">
            <span className={s.quickIcon}>
              <Icon name="card" />
            </span>
            <div>
              <strong>Métodos de pago</strong>
              <small>Tarjetas y facturación.</small>
            </div>
            <Icon name="chevron" />
          </button>
          <Link href="/cuenta/preferencias" data-tone="orange">
            <span className={s.quickIcon}>
              <Icon name="bell" />
            </span>
            <div>
              <strong>Preferencias</strong>
              <small>Notificaciones y experiencia.</small>
            </div>
            <Icon name="chevron" />
          </Link>
        </nav>
        <div className={s.columns}>
          <div className={s.leftColumn}>
            <section
              className={s.card}
              aria-label="Información personal"
              id="informacion-personal-cuenta"
              tabIndex={-1}
            >
              <header>
                <h2>Información personal</h2>
                <Link className={s.edit} href="/cuenta/datos-personales">
                  <Icon name="edit" />
                  Editar
                </Link>
              </header>
              <dl className={s.personalFields}>
                {datosPersonales.map(([icon, label, value]) => (
                  <div key={label}>
                    <dt>
                      <Icon name={icon} />
                      {label}
                    </dt>
                    <dd title={value}>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section
              className={`${s.card} ${s.addressCard}`}
              aria-label="Dirección y facturación"
            >
              <header>
                <h2>Dirección y facturación</h2>
                <Link className={s.edit} href="/cuenta/facturacion">
                  <Icon name="edit" />
                  Editar
                </Link>
              </header>
              <div className={s.addressColumns}>
                <Link
                  className={s.addressBlock}
                  href="/cuenta/datos-personales"
                >
                  <span className={s.blockIcon}>
                    <Icon name="home" />
                  </span>
                  <div>
                    <div className={s.blockHeading}>
                      <h3>Dirección principal</h3>
                      {direccion.length > 0 && (
                        <span className={s.defaultBadge}>
                          <Icon name="pin" />
                          Predeterminada
                        </span>
                      )}
                    </div>
                    {direccion.length ? (
                      direccion.map((line, i) => <p key={i}>{line}</p>)
                    ) : (
                      <p>Agrega tu dirección principal.</p>
                    )}
                  </div>
                </Link>
                <Link className={s.addressBlock} href="/cuenta/facturacion">
                  <span className={s.blockIcon}>
                    <Icon name="file" />
                  </span>
                  <div>
                    <h3>Datos de facturación</h3>
                    <p>
                      {fiscal.razon_social?.trim() ||
                        "Nombre fiscal no registrado"}
                    </p>
                    <p>RFC: {fiscal.rfc?.trim() || "No registrado"}</p>
                    <p>
                      Régimen fiscal:{" "}
                      {fiscal.regimen_fiscal?.trim() || "No registrado"}
                    </p>
                    <p>
                      CP:{" "}
                      {fiscal.codigo_postal_fiscal?.trim() || "No registrado"}
                    </p>
                  </div>
                </Link>
              </div>
            </section>
          </div>
          <div className={s.rightColumn}>
            <section className={s.card} aria-label="Actividad reciente">
              <header>
                <h2>Actividad reciente</h2>
                <Link className={s.textLink} href="/mis-viajes">
                  Ver toda
                </Link>
              </header>
              {actividades.length ? (
                <ol className={s.activity}>
                  {actividades.map((a) => (
                    <li key={a.id}>
                      <Link href={a.href}>
                        <span className={s.activityIcon}>
                          <Icon name={a.icono} />
                        </span>
                        <div>
                          <strong title={a.titulo}>{a.titulo}</strong>
                          <time dateTime={a.fecha}>{fechaCuenta(a.fecha)}</time>
                        </div>
                        <span className={s.activityStatus} data-tone={a.tono}>
                          <Icon name="check" />
                          {a.etiqueta}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className={s.emptyActivity}>
                  <Icon name="clock" />
                  <p>No hay actividad registrada.</p>
                  <Link href="/viajes/nuevo">
                    Registrar mi primer traslado
                    <Icon name="arrow" />
                  </Link>
                </div>
              )}
            </section>
            <section
              className={`${s.card} ${s.securityCard}`}
              aria-label="Seguridad de la cuenta"
            >
              <header>
                <h2>Seguridad de la cuenta</h2>
                <button
                  className={s.textLink}
                  onClick={() => abrirModal("seguridad")}
                >
                  Ver detalles
                </button>
              </header>
              <div className={s.securityRows}>
                <div>
                  <Icon name="lock" />
                  <div>
                    <strong>Contraseña</strong>
                    <small>Actualízala periódicamente</small>
                  </div>
                  <Link
                    className={s.smallAction}
                    href="/cuenta/cambiar-contrasena"
                  >
                    Cambiar
                  </Link>
                </div>
                <div>
                  <Icon name="shield" />
                  <div>
                    <strong>Verificación en dos pasos</strong>
                    <small>Agregar una capa extra de seguridad</small>
                  </div>
                  <button
                    className={s.smallAction}
                    onClick={() => abrirModal("mfa")}
                  >
                    Activar
                  </button>
                </div>
                <div>
                  <Icon name="device" />
                  <div>
                    <strong>Dispositivos activos</strong>
                    <small>Gestiona tus sesiones iniciadas</small>
                  </div>
                  <button
                    className={s.smallAction}
                    onClick={() => abrirModal("sesiones")}
                  >
                    Administrar
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      {modal && (
        <DialogoCuentaDesktop
          key={modal}
          modo={modal}
          cerrar={cerrarModal}
          cambiar={setModal}
          metodoPago={usuario.metodo_pago_registrado === true}
          correo={correo}
          cerrarSesion={cerrarSesion}
          cerrandoSesion={cerrandoSesion}
          errorSesion={errorSesion}
        />
      )}
    </UserDashboardLayout>
  );
}
