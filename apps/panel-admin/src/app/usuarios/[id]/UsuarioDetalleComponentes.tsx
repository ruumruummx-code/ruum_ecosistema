"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AdminBadge, AdminDrawer } from "../../admin-components";
import type {
  UsuarioRow,
  ViajeRow,
  ConteosTabs,
  Tab
} from "./UsuarioDetalleTipos";
import {
  ETIQUETA_VERIFICACION,
  ETIQUETA_ESTADO_CUENTA,
  TARJETAS_RESUMEN,
  aTitleCase,
  formatearTelefono,
  folioCorto,
  formatearFechaOperativa,
  descripcionVehiculo,
  dinero,
  tonoEstadoTraslado,
  etiquetaEstadoTraslado
} from "./UsuarioDetalleTipos";

export function ToastAviso({ aviso, onCerrar }: { aviso: { tono: "info" | "danger"; texto: string }; onCerrar: () => void }) {
  const estilos = aviso.tono === "danger"
    ? "border-ui-danger/35 bg-ui-danger-soft text-ui-danger"
    : "border-ui-success/35 bg-ui-success-soft text-ui-success";
  return (
    <div className="fixed right-5 top-5 z-50 w-[min(360px,calc(100vw-2.5rem))]">
      <div role="status" aria-live="polite" className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 shadow-ui-md ${estilos}`}>
        <p className="font-body text-sm font-semibold">{aviso.texto}</p>
        <button type="button" onClick={onCerrar} className="grid size-6 shrink-0 place-items-center rounded-full border border-current/25 font-body text-xs font-bold hover:bg-ui-card" aria-label="Cerrar notificación">X</button>
      </div>
    </div>
  );
}

export function Seccion({ titulo, children, action, consistente = false }: { titulo: string; children: ReactNode; action?: ReactNode; consistente?: boolean }) {
  return (
    <div className={`flex h-full flex-col rounded-lg border border-ui-line bg-ui-card p-4 ${consistente ? "min-h-[248px]" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ui-fg">{titulo}</h3>
        {action}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null | undefined }) {
  return (
    <div className="min-w-0 rounded-lg border border-ui-line bg-ui-muted px-3 py-2.5 font-body text-sm">
      <span className="block text-xs font-normal text-ui-fg-muted">{etiqueta}</span>
      <span className="mt-1 block truncate font-semibold text-ui-fg" title={typeof valor === "string" ? valor : undefined}>{valor || <ValorVacio />}</span>
    </div>
  );
}

export function ValorVacio({ texto = "Sin dato" }: { texto?: string }) {
  return <span className="font-normal text-ui-fg-muted">{texto}</span>;
}

function BadgeVerificacion({ estado }: { estado: string }) {
  const tone = estado === "verificado" ? "success" : estado === "rechazado" ? "danger" : "warning";
  return <AdminBadge tone={tone}>{ETIQUETA_VERIFICACION[estado] ?? aTitleCase(estado.replaceAll("_", " "))}</AdminBadge>;
}

function BadgeCuenta({ estado }: { estado: string }) {
  const tone = estado === "activa" ? "success" : "danger";
  return <AdminBadge tone={tone}>{ETIQUETA_ESTADO_CUENTA[estado] ?? aTitleCase(estado.replaceAll("_", " "))}</AdminBadge>;
}

export function BadgeEstadoTraslado({ viaje }: { viaje: ViajeRow }) {
  const estado = viaje.tiene_incidencia_abierta || Number(viaje.incidencias_abiertas ?? 0) > 0 ? "incidencia" : viaje.estado;
  const tone = tonoEstadoTraslado(estado);
  return <AdminBadge tone={tone}>{etiquetaEstadoTraslado(estado)}</AdminBadge>;
}

export function MinimizacionItem({ estado, tono, titulo, detalle }: { estado: string; tono: "neutral" | "info" | "success" | "warning" | "danger"; titulo: string; detalle: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-ui-line px-3 py-3">
      <div>
        <p className="font-body text-sm font-semibold text-ui-fg">{titulo}</p>
        <p className="mt-1 font-body text-sm text-ui-fg-muted">{detalle}</p>
      </div>
      <AdminBadge tone={tono}>{estado}</AdminBadge>
    </div>
  );
}

function ResumenStickyDato({ etiqueta, valor }: { etiqueta: string; valor: string | null | undefined }) {
  return (
    <div className="rounded-lg border border-ui-line bg-ui-muted px-3 py-2">
      <p className="font-body text-xs font-medium text-ui-fg-muted">{etiqueta}</p>
      <p className="mt-1 truncate font-body text-sm font-semibold text-ui-fg">{valor || "No registrado"}</p>
    </div>
  );
}

export function ResumenUsuarioSticky({ usuario }: { usuario: UsuarioRow }) {
  const iniciales = (aTitleCase(usuario.nombre) ?? "Usuario")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toLocaleUpperCase("es-MX");

  return (
    <aside className="lg:sticky lg:top-20">
      <div className="rounded-lg border border-ui-line bg-ui-card p-5 shadow-ui-sm">
        <div className="flex items-start gap-3">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-ui-brand text-lg font-display font-semibold text-ui-on-brand">
            {iniciales || "U"}
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-semibold text-ui-fg">{aTitleCase(usuario.nombre) || "Usuario sin nombre"}</h2>
            <p className="mt-1 truncate font-body text-sm text-ui-fg-muted">{usuario.correo_facturacion ?? "No registrado"}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <BadgeCuenta estado={usuario.estado_cuenta ?? "activa"} />
          <BadgeVerificacion estado={usuario.estado_verificacion} />
        </div>
        <div className="mt-5 grid gap-3">
          <ResumenStickyDato etiqueta="Tipo de cuenta" valor={aTitleCase(usuario.tipo_cuenta)} />
          <ResumenStickyDato etiqueta="Rol" valor={aTitleCase(usuario.rol.replaceAll("_", " "))} />
          <ResumenStickyDato etiqueta="RFC" valor={usuario.rfc} />
          <ResumenStickyDato etiqueta="Teléfono" valor={formatearTelefono(usuario.telefono)} />
        </div>
      </div>
    </aside>
  );
}

export function ResumenActividad({ conteos, onSeleccionarTab }: { conteos: ConteosTabs; onSeleccionarTab: (tab: Tab) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:min-w-[520px] xl:grid-cols-5">
      {TARJETAS_RESUMEN.map((tarjeta) => {
        const valor = conteos[tarjeta.tab];
        return (
          <button
            key={tarjeta.tab}
            type="button"
            onClick={() => onSeleccionarTab(tarjeta.tab)}
            className={`rounded-lg border border-ui-line bg-ui-muted px-3 py-3 text-left transition hover:border-ui-focus/35 hover:bg-ui-card hover:shadow-ui-sm ${valor === 0 ? "opacity-65" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="grid size-6 place-items-center rounded-full bg-ui-muted font-body text-xs font-bold text-ui-fg-muted" aria-hidden="true">{tarjeta.icono}</span>
              <span className="font-mono-ruum text-2xl font-semibold text-ui-fg">{valor ?? "..."}</span>
            </div>
            <p className="mt-1 font-body text-xs text-ui-fg-muted">{tarjeta.etiqueta}</p>
            <p className="mt-1 font-body text-xs font-medium text-ui-brand">Ver módulo</p>
          </button>
        );
      })}
    </div>
  );
}

export function DetalleViajeDrawer({ viaje, onCerrar }: { viaje: ViajeRow | null; onCerrar: () => void }) {
  return (
    <AdminDrawer
      open={Boolean(viaje)}
      title={viaje ? `Traslado ${folioCorto(viaje.traslado_id)}` : "Detalle de traslado"}
      description={viaje ? `${etiquetaEstadoTraslado(viaje.tiene_incidencia_abierta ? "incidencia" : viaje.estado)} · ${formatearFechaOperativa(viaje.creado_en)}` : undefined}
      onOpenChange={(open) => { if (!open) onCerrar(); }}
      footer={viaje && <Link href={`/viajes/${viaje.traslado_id}`} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted">Abrir página completa</Link>}
    >
      {viaje && (
        <div className="space-y-5">
          <Seccion titulo="Resumen">
            <Dato etiqueta="Folio" valor={viaje.traslado_id} />
            <Dato etiqueta="Estado" valor={etiquetaEstadoTraslado(viaje.tiene_incidencia_abierta ? "incidencia" : viaje.estado)} />
            <Dato etiqueta="Creación" valor={formatearFechaOperativa(viaje.creado_en)} />
            <Dato etiqueta="Tipo de servicio" valor={aTitleCase(viaje.vehiculo_tipo ?? viaje.vehiculo_categoria_tarifa)} />
          </Seccion>
          <Seccion titulo="Ruta">
            <Dato etiqueta="Origen" valor={viaje.origen_direccion || viaje.origen_ciudad} />
            <Dato etiqueta="Destino" valor={viaje.destino_direccion || viaje.destino_ciudad} />
            <Dato etiqueta="Distancia" valor={viaje.distancia_km != null ? `${viaje.distancia_km.toFixed(1)} km` : null} />
            <Dato etiqueta="Tiempo estimado" valor={viaje.tiempo_estimado_horas != null ? `${viaje.tiempo_estimado_horas.toFixed(1)} h` : null} />
          </Seccion>
          <Seccion titulo="Vehículo y conductor">
            <Dato etiqueta="Vehículo" valor={descripcionVehiculo(viaje)} />
            <Dato etiqueta="Placas" valor={viaje.vehiculo_placas} />
            <Dato etiqueta="Conductor" valor={aTitleCase(viaje.conductor_nombre)} />
            <Dato etiqueta="Calificación" valor={viaje.conductor_calificacion != null ? viaje.conductor_calificacion.toFixed(1) : null} />
          </Seccion>
          <Seccion titulo="Operación">
            <Dato etiqueta="Incidencias abiertas" valor={String(viaje.incidencias_abiertas ?? 0)} />
            <Dato etiqueta="Pago" valor={viaje.monto_pagado != null ? dinero(viaje.monto_pagado) : null} />
            <Dato etiqueta="Precio final" valor={viaje.precio_final != null ? dinero(viaje.precio_final) : null} />
          </Seccion>
        </div>
      )}
    </AdminDrawer>
  );
}
