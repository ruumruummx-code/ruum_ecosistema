"use client";

import Link from "next/link";
import { Aviso, Card } from "@ruum/ui";
import { ConductorScreen, ConductorPageHeader } from "../../components/ConductorScreen";
import { useCerrarSesion } from "@/lib/use-cerrar-sesion";

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
          <p className="font-body text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">
            Protección de la Cuenta
          </p>
          <h2 className="font-display text-lg font-bold text-text-primary mb-4">
            Credenciales de Acceso
          </h2>

          <div className="grid gap-4">
            {/* 2. Rediseño del Callout Informativo de Seguridad (sin bordes de input, con ícono 🛡️) */}
            <div className="flex items-start gap-3.5 rounded-xl border border-border/60 bg-surface-elevated/70 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-route-action/15 font-display text-lg text-route-action">
                🛡️
              </div>
              <div className="font-body text-xs leading-5 text-text-secondary">
                <strong className="block font-display text-sm font-bold text-text-primary mb-0.5">
                  Verificación de Seguridad por Correo
                </strong>
                Por protección operativa, cualquier cambio de contraseña requiere confirmación mediante un enlace seguro enviado a tu correo electrónico registrado.
              </div>
            </div>

            {/* Acción de Cambio de Contraseña */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/50 bg-surface-elevated/30 p-4">
              <div>
                <span className="block font-display text-sm font-bold text-text-primary">
                  Contraseña de inicio de sesión
                </span>
                <span className="block font-body text-xs text-text-tertiary">
                  Te enviaremos un enlace de restablecimiento seguro a tu correo
                </span>
              </div>

              <Link
                href="/recuperar-password"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-action-primary px-5 py-2.5 font-display text-xs font-bold text-on-primary shadow-xs transition hover:bg-action-primary/90 active:scale-95"
              >
                Cambiar contraseña →
              </Link>
            </div>
          </div>
        </Card>

        {/* 3. Tarjeta 2: Escalabilidad - Estado de Sesión y Dispositivos */}
        <Card>
          <p className="font-body text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">
            Conexión Activa
          </p>
          <h2 className="font-display text-lg font-bold text-text-primary mb-4">
            Sesión y Dispositivo Registrado
          </h2>

          <div className="grid gap-3 rounded-xl border border-border/40 bg-surface-elevated/40 p-4 font-body text-xs sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-lg">
                📱
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wider text-text-tertiary text-[11px]">Dispositivo Activo</dt>
                <dd className="font-bold text-text-primary text-xs mt-0.5">Aplicación Conductor Ruum</dd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-lg text-control">
                🔒
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wider text-text-tertiary text-[11px]">Estado de Protección</dt>
                <dd className="font-bold text-control text-xs mt-0.5">Sesión Encriptada SSL</dd>
              </div>
            </div>
          </div>
        </Card>

        {/* 1. Sección Separada Independiente: Acción de Salida (Cerrar Sesión) */}
        <Card className="border-danger/40 bg-danger-soft">
          <p className="font-body text-xs font-bold uppercase tracking-wider text-danger mb-1">
            Salida de la Plataforma
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-text-primary">
                Cerrar Sesión Activa
              </h2>
              <p className="mt-0.5 font-body text-xs text-text-tertiary leading-5">
                Saldrás de tu cuenta en este dispositivo. Para recibir o realizar traslados nuevamente deberás iniciar sesión.
              </p>
            </div>

            {/* 1. Botón de Salida con Tratamiento Destructivo Sutil (Previene toques accidentales) */}
            <button
              type="button"
              onClick={() => void cerrarSesion()}
              disabled={cerrandoSesion}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-danger bg-surface px-5 py-2.5 font-display text-xs font-bold text-danger shadow-2xs transition hover:border-danger hover:bg-danger-soft active:scale-95 disabled:opacity-50"
            >
              {cerrandoSesion ? "Cerrando sesión..." : "🚪 Cerrar sesión"}
            </button>
          </div>
        </Card>
      </div>
    </ConductorScreen>
  );
}
