"use client";

import { Button as BaseButton } from "@ruum/ui/base";
import Link from "next/link";
import { Aviso, Card } from "@ruum/ui";
import { ConductorScreen, ConductorPageHeader } from "../../components/ConductorScreen";
import { useCerrarSesion } from "@/lib/use-cerrar-sesion";

import { ConductorIcon } from "@/components/icons";
export default function PaginaSeguridadCuenta() {
  const { cerrarSesion, cerrandoSesion, errorCerrarSesion } = useCerrarSesion();

  return (
    <ConductorScreen variant="detail" label="Contenido de Seguridad y Sesión" header={<ConductorPageHeader title="Seguridad y Sesión" description="Administra tus credenciales de acceso, dispositivos y la sesión de tu cuenta." />}>


      {errorCerrarSesion && (
        <div className="mt-5">
          <Aviso tono="danger">{errorCerrarSesion}</Aviso>
        </div>
      )}

      <div className="mt-6 grid gap-6">
        {/* 3. Tarjeta 1: Escalabilidad - Credenciales de Acceso */}
        <Card>
          <p className="font-body text-xs font-bold uppercase tracking-wider text-ui-fg-muted mb-1">
            Protección de la Cuenta
          </p>
          <h2 className="font-display text-lg font-bold text-ui-fg mb-4">
            Credenciales de Acceso
          </h2>

          <div className="grid gap-4">
            {/* 2. Rediseño del Callout Informativo de Seguridad (sin bordes de input, con ícono de escudo) */}
            <div className="flex items-start gap-3.5 rounded-xl border border-ui-line/60 bg-ui-muted/70 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ui-brand/15 font-display text-lg text-ui-brand">
                <ConductorIcon name="shield" />
              </div>
              <div className="font-body text-xs leading-5 text-ui-fg-muted">
                <strong className="block font-display text-sm font-bold text-ui-fg mb-0.5">
                  Verificación de Seguridad por Correo
                </strong>
                Por protección operativa, cualquier cambio de contraseña requiere confirmación mediante un enlace seguro enviado a tu correo electrónico registrado.
              </div>
            </div>

            {/* Acción de Cambio de Contraseña */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-ui-line/50 bg-ui-muted/30 p-4">
              <div>
                <span className="block font-display text-sm font-bold text-ui-fg">
                  Contraseña de inicio de sesión
                </span>
                <span className="block font-body text-xs text-ui-fg-muted">
                  Te enviaremos un enlace de restablecimiento seguro a tu correo
                </span>
              </div>

              <Link
                href="/recuperar-password"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-action-primary px-5 py-2.5 font-display text-xs font-bold text-ui-on-brand shadow-xs transition hover:bg-action-primary/90 active:scale-95"
              >
                Cambiar contraseña →
              </Link>
            </div>
          </div>
        </Card>

        {/* 3. Tarjeta 2: Escalabilidad - Estado de Sesión y Dispositivos */}
        <Card>
          <p className="font-body text-xs font-bold uppercase tracking-wider text-ui-fg-muted mb-1">
            Conexión Activa
          </p>
          <h2 className="font-display text-lg font-bold text-ui-fg mb-4">
            Sesión y Dispositivo Registrado
          </h2>

          <div className="grid gap-3 rounded-xl border border-ui-line/40 bg-ui-muted/40 p-4 font-body text-xs sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-ui-line bg-ui-card text-lg">
                <ConductorIcon name="phone" />
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wider text-ui-fg-muted text-xs">Dispositivo Activo</dt>
                <dd className="font-bold text-ui-fg text-xs mt-0.5">Aplicación Conductor Ruum</dd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-ui-line bg-ui-card text-lg text-ui-success">
                <ConductorIcon name="lock" />
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wider text-ui-fg-muted text-xs">Estado de Protección</dt>
                <dd className="font-bold text-ui-success text-xs mt-0.5">Sesión Encriptada SSL</dd>
              </div>
            </div>
          </div>
        </Card>

        {/* 1. Sección Separada Independiente: Acción de Salida (Cerrar Sesión) */}
        <Card className="border-ui-danger/40 bg-ui-danger-soft">
          <p className="font-body text-xs font-bold uppercase tracking-wider text-ui-danger mb-1">
            Salida de la Plataforma
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-ui-fg">
                Cerrar Sesión Activa
              </h2>
              <p className="mt-0.5 font-body text-xs text-ui-fg-muted leading-5">
                Saldrás de tu cuenta en este dispositivo. Para recibir o realizar traslados nuevamente deberás iniciar sesión.
              </p>
            </div>

            {/* 1. Botón de Salida con Tratamiento Destructivo Sutil (Previene toques accidentales) */}
            <BaseButton variant="ghost"
              type="button"
              onClick={() => void cerrarSesion()}
              disabled={cerrandoSesion}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-ui-danger bg-ui-card px-5 py-2.5 font-display text-xs font-bold text-ui-danger shadow-2xs transition hover:border-ui-danger hover:bg-ui-danger-soft active:scale-95 disabled:opacity-50"
            >
              {cerrandoSesion ? "Cerrando sesión..." : "Cerrar sesión"}
            </BaseButton>
          </div>
        </Card>
      </div>
    </ConductorScreen>
  );
}
