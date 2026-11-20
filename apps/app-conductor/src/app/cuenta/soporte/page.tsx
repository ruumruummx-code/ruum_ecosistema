"use client";

import Link from "next/link";
import { Card } from "@ruum/ui";
import { CONTACTOS_SOPORTE_CONDUCTOR } from "@/lib/contactos-soporte";
import { ConductorScreen, ConductorPageHeader } from "../../components/ConductorScreen";

export default function PaginaSoporteCuenta() {
  const whatsapp = CONTACTOS_SOPORTE_CONDUCTOR.soporte.whatsapp;
  const telefono = CONTACTOS_SOPORTE_CONDUCTOR.soporte.telefono;
  const correo = CONTACTOS_SOPORTE_CONDUCTOR.soporte.correo;
  const bajaCuenta = CONTACTOS_SOPORTE_CONDUCTOR.soporte.bajaCuenta;

  return (
    <ConductorScreen variant="detail" label="Contenido de Centro de Soporte" header={<ConductorPageHeader title="Centro de Soporte" description="Canales oficiales de asistencia operativa, ayuda en ruta y gestión de tu cuenta." />}>


      <div className="mt-6 grid gap-6">
        {/* 3. Banner Destacado Superior: Contexto de Ayuda en Viaje Actual */}
        <div className="relative overflow-hidden rounded-lg border border-ui-brand/40 bg-ui-muted/90 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ui-card border border-ui-line/80 font-display text-xl font-bold text-ui-fg shadow-2xs">
                🚨
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-ui-fg">
                  ¿Tienes un viaje en curso o alguna eventualidad?
                </h2>
                <p className="mt-0.5 font-body text-sm leading-5 text-ui-fg-muted">
                  Accede al reporte prioritario para incidentes en ruta, ajuste de tarifa o contacto con el usuario.
                </p>
              </div>
            </div>

            <Link
              href="/viajes"
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-action-primary px-5 py-3 font-display text-sm font-black text-ui-on-brand shadow-xs transition hover:bg-action-primary-hover active:scale-95 sm:w-auto"
            >
              Ayuda con mi viaje actual →
            </Link>
          </div>
        </div>

        {/* 1. Sección: Ayuda Inmediata (WhatsApp & Teléfono) */}
        <Card>
          <p className="font-body text-sm font-bold uppercase tracking-wider text-ui-fg-muted mb-1">
            Respuesta Rápida
          </p>
          <h2 className="font-display text-lg font-bold text-ui-fg mb-4">
            Ayuda Inmediata
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* WhatsApp */}
            <a
              href={whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-full items-center justify-between gap-3 rounded-xl border border-ui-line bg-ui-success-soft p-4 transition hover:border-ui-success hover:bg-ui-success-soft active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ui-success-soft font-display text-lg text-ui-success">
                  💬
                </div>
                <div className="min-w-0">
                  <span className="block font-display text-sm font-bold text-ui-fg truncate">
                    {whatsapp.etiqueta}
                  </span>
                  {/* 3. Microcopy SLA */}
                  <span className="block font-body text-sm text-ui-success font-semibold">
                    ⚡ Respuesta habitual &lt; 5 min
                  </span>
                </div>
              </div>
              <span className="text-ui-fg-muted transition group-hover:translate-x-1">→</span>
            </a>

            {/* Teléfono */}
            <a
              href={telefono.href}
              className="group flex w-full items-center justify-between gap-3 rounded-xl border border-ui-line bg-ui-brand-soft p-4 transition hover:border-ui-brand hover:bg-ui-brand-soft active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ui-brand-soft font-display text-lg text-ui-brand">
                  📞
                </div>
                <div className="min-w-0">
                  <span className="block font-display text-sm font-bold text-ui-fg truncate">
                    {telefono.etiqueta}
                  </span>
                  {/* 3. Microcopy SLA */}
                  <span className="block font-body text-sm text-ui-brand font-semibold">
                    📞 Atención telefónica 24/7
                  </span>
                </div>
              </div>
              <span className="text-ui-fg-muted transition group-hover:translate-x-1">→</span>
            </a>
          </div>
        </Card>

        {/* 1. Sección: Ayuda Operativa y Consultas */}
        <Card>
          <p className="font-body text-sm font-bold uppercase tracking-wider text-ui-fg-muted mb-1">
            Asistencia en Servicio
          </p>
          <h2 className="font-display text-lg font-bold text-ui-fg mb-4">
            Ayuda Operativa y Correo
          </h2>

          <div className="grid gap-3">
            {/* Reportar problema en viaje (Ancho completo corregido) */}
            <Link
              href="/viajes"
              className="group flex w-full items-center justify-between gap-3 rounded-xl border border-ui-line/80 bg-ui-muted/50 p-4 transition hover:border-ui-brand hover:bg-ui-muted active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ui-warning-soft font-display text-lg text-ui-warning">
                  ⚠️
                </div>
                <div className="min-w-0">
                  <span className="block font-display text-sm font-bold text-ui-fg">
                    Reportar problema en un viaje
                  </span>
                  <span className="block font-body text-sm text-ui-fg-muted">
                    Ajuste de tarifas, objetos olvidados o aclaraciones de ruta • Prioridad operativa
                  </span>
                </div>
              </div>
              <span className="text-ui-fg-muted transition group-hover:translate-x-1">→</span>
            </Link>

            {/* Correo Electrónico */}
            <a
              href={correo.href}
              className="group flex w-full items-center justify-between gap-3 rounded-xl border border-ui-line/80 bg-ui-muted/50 p-4 transition hover:border-ui-brand hover:bg-ui-muted active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ui-brand-soft font-display text-lg text-ui-brand">
                  ✉️
                </div>
                <div className="min-w-0">
                  <span className="block font-display text-sm font-bold text-ui-fg">
                    {correo.etiqueta}
                  </span>
                  {/* 3. Microcopy SLA */}
                  <span className="block font-body text-sm text-ui-fg-muted">
                    Consultas formales y aclaraciones de cuenta • Respuesta en 24 a 48h
                  </span>
                </div>
              </div>
              <span className="text-ui-fg-muted transition group-hover:translate-x-1">→</span>
            </a>
          </div>
        </Card>

        {/* 1. Sección: Gestión de Cuenta y Acción Destructiva Separada */}
        <Card className="border-ui-danger/20 bg-ui-danger/5">
          <p className="font-body text-sm font-bold uppercase tracking-wider text-ui-danger mb-1">
            Gestión Avanzada de Cuenta
          </p>
          <h2 className="font-display text-lg font-bold text-ui-fg mb-2">
            Desactivación de Cuenta
          </h2>
          <p className="font-body text-sm text-ui-fg-muted mb-4 leading-5">
            Si deseas darte de baja del servicio o suspender temporalmente tu perfil, puedes iniciar el proceso con soporte.
          </p>

          {/* Botón Destructivo Separado con Tratamiento de Peligro */}
          <a
            href={bajaCuenta.href}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ui-danger/40 bg-ui-card px-4 py-3 font-display text-sm font-bold text-ui-danger shadow-2xs transition hover:border-ui-danger hover:bg-ui-danger/10 active:scale-95"
          >
            ⚠️ {bajaCuenta.etiqueta}
          </a>
        </Card>
      </div>
    </ConductorScreen>
  );
}
