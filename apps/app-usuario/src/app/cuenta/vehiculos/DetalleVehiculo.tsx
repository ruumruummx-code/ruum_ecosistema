"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Car, FileText, Hash, MoreHorizontal, Palette, Pencil, Wrench } from "lucide-react";
import { Button, Card, Sheet, Tabs, TabsContent, TabsList, TabsTrigger, cn } from "@ruum/ui/base";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import type { Vehiculo } from "../cuenta-ui";
import { nombreVehiculo } from "./VehicleListItem";
import { fechaVehiculo, type TrasladoVehiculo } from "./vehiculos-model";
import { AtributosVehiculo, EstadoVehiculo, ImagenVehiculo } from "./VehiculoVisual";

const PESTANAS = ["Información", "Documentos", "Historial"] as const;
type Pestana = (typeof PESTANAS)[number];

export const ITEM_MENU =
  "flex min-h-11 items-center rounded-md px-3 text-left text-sm font-medium text-ui-fg hover:bg-ui-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring";
export const MENU = "absolute right-0 z-30 mt-1 flex w-52 flex-col rounded-lg border border-ui-line bg-ui-card p-1.5 shadow-ui-md";

/** Panel de detalle del vehículo seleccionado (desde 1024 px, junto al listado). */
export function DetalleVehiculo({ vehiculo: v, traslados }: { vehiculo: Vehiculo; traslados: TrasladoVehiculo[] }) {
  const [tab, setTab] = useState<Pestana>("Información");
  const [menu, setMenu] = useState(false);
  const [editando, setEditando] = useState(false);
  const historial = traslados
    .filter((t) => t.vehiculo_id === v.id && Boolean(t.traslado_id))
    .sort((a, b) => (Date.parse(b.creado_en ?? "") || 0) - (Date.parse(a.creado_en ?? "") || 0));
  const nombre = nombreVehiculo(v);
  const campos = [
    [Wrench, "Marca", v.marca],
    [Car, "Modelo", v.modelo],
    [Calendar, "Año", v.anio],
    [Palette, "Color", v.color],
    [Hash, "Número de serie (VIN)", v.vin],
  ] as const;
  const documentos = [
    ["Tarjeta de circulación", v.tiene_tarjeta_circulacion],
    ["Verificación vehicular", v.tiene_verificacion],
    ["Permiso especial vigente", v.permiso_especial_vigente],
  ] as const;

  return (
    <Card asChild className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4 xl:p-5">
      <aside aria-label={`Detalle de ${nombre}`}>
        <div className="sticky -top-4 z-20 -mx-4 -mt-4 flex shrink-0 flex-wrap items-center gap-2 bg-ui-card px-4 pt-4 pb-2 xl:-top-5 xl:-mx-5 xl:-mt-5 xl:px-5 xl:pt-5" role="group" aria-label="Acciones del vehículo">
          <Button asChild size="sm">
            <Link href={`/viajes/nuevo?${new URLSearchParams({ vehiculo: v.id })}`}>
              <Car aria-hidden="true" />
              Seleccionar para traslado
            </Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditando(true)}>
            <Pencil aria-hidden="true" />
            Editar
          </Button>
        </div>

        <div className="relative shrink-0">
          <div className="absolute inset-x-2 top-2 z-10 flex items-start justify-between">
            <EstadoVehiculo vehiculo={v} />
            <div className="relative">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Más opciones del vehículo seleccionado"
                aria-expanded={menu}
                onClick={() => setMenu(!menu)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setMenu(false);
                }}
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
              {menu && (
                <div className={MENU}>
                  <Link className={ITEM_MENU} href={`/cuenta/vehiculos/${v.id}`}>
                    Abrir expediente
                  </Link>
                  <button
                    type="button"
                    className={ITEM_MENU}
                    onClick={() => {
                      setTab("Historial");
                      setMenu(false);
                    }}
                  >
                    Consultar historial
                  </button>
                  <Link className={ITEM_MENU} href={`/soporte?${new URLSearchParams({ vehiculo: v.id })}`}>
                    Solicitar ayuda
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="flex max-h-44 items-center justify-center overflow-hidden rounded-lg bg-ui-muted xl:max-h-52">
            <ImagenVehiculo vehiculo={v} grande />
          </div>
        </div>

        <header className="shrink-0">
          <h2 className="text-xl font-bold">{nombre}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ui-fg-muted">
            <span className="font-mono font-semibold text-ui-fg">{v.placas?.trim() || "Sin placas"}</span>
            {v.alias?.trim() && <span>· {v.alias}</span>}
          </p>
        </header>

        <AtributosVehiculo vehiculo={v} detalle className="shrink-0" />

        <Tabs
          value={tab}
          onValueChange={(valor) => {
            setTab(valor as Pestana);
            setMenu(false);
          }}
          activationMode="manual"
          className="flex flex-col gap-3"
        >
          <TabsList aria-label="Vista del vehículo">
            {PESTANAS.map((p) => (
              <TabsTrigger key={p} value={p}>
                {p}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="Información">
            <div>
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {campos.map(([Icono, etiqueta, valor]) => (
                  <div key={etiqueta} className={cn("rounded-md border border-ui-line p-2.5", etiqueta.startsWith("Número") && "sm:col-span-2")}>
                    <dt className="flex items-center gap-1.5 text-xs text-ui-fg-muted">
                      <Icono aria-hidden="true" className="size-3.5" />
                      {etiqueta}
                    </dt>
                    <dd className="mt-0.5 break-all text-sm font-medium">{String(valor ?? "").trim() || "No registrado"}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </TabsContent>

          <TabsContent value="Documentos">
            <div>
              <section aria-label={`Documentos de ${nombre}`} className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Documentación declarada</h3>
                <p className="text-sm text-ui-fg-muted">
                  No hay archivos de documentos vinculados a este vehículo ni fechas registradas para calcular alertas de vencimiento.
                </p>
                <ul className="flex flex-col divide-y divide-ui-line rounded-md border border-ui-line">
                  {documentos.map(([etiqueta, valor]) => (
                    <li key={etiqueta} className="flex items-center gap-2 px-3 py-2.5 text-sm">
                      <FileText aria-hidden="true" className="size-4 shrink-0 text-ui-fg-muted" />
                      <span className="flex-1">{etiqueta}</span>
                      <strong className={cn("font-semibold", valor ? "text-ui-success" : "text-ui-fg-muted")}>
                        {valor === true
                          ? "Declarada"
                          : typeof valor === "string" && valor.trim()
                            ? valor
                            : valor === false
                              ? "Pendiente"
                              : "Sin registro"}
                      </strong>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="Historial">
            <div>
              <section aria-label={`Historial de ${nombre}`} className="flex flex-col gap-2 pb-1 text-sm">
                <div className="flex items-center gap-3 rounded-md border border-ui-line p-2.5">
                  <Calendar aria-hidden="true" className="size-4 shrink-0 text-ui-fg-muted" />
                  <p>
                    <strong className="block font-semibold">Vehículo registrado</strong>
                    <small className="text-xs text-ui-fg-muted">{fechaVehiculo(v.creado_en)}</small>
                  </p>
                </div>
                {historial.length ? (
                  historial.slice(0, 2).map((t) => (
                    <Link
                      key={t.traslado_id}
                      href={`/viajes/${t.traslado_id}`}
                      className="flex items-center gap-3 rounded-md border border-ui-line p-2.5 hover:bg-ui-muted"
                    >
                      <Car aria-hidden="true" className="size-4 shrink-0 text-ui-fg-muted" />
                      <p>
                        <strong className="flex items-center gap-1 font-semibold">
                          {t.origen_ciudad || "Origen pendiente"}
                          <ArrowRight aria-hidden="true" className="size-3.5" />
                          {t.destino_ciudad || "Destino pendiente"}
                        </strong>
                        <small className="text-xs text-ui-fg-muted">
                          {fechaVehiculo(t.creado_en)} · {t.estado ? ETIQUETA_ESTADO_TRASLADO[t.estado] : "Estado pendiente"}
                        </small>
                      </p>
                    </Link>
                  ))
                ) : (
                  <p className="text-ui-fg-muted">Este vehículo aún no tiene traslados registrados.</p>
                )}
                <Button asChild variant="link" size="sm" className="self-start">
                  <Link href={`/mis-viajes?${new URLSearchParams({ buscar: v.placas?.trim() || nombre })}`}>
                    Ver historial completo
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </section>
            </div>
          </TabsContent>
        </Tabs>

        <Sheet open={editando} onClose={() => setEditando(false)} titulo="Editar información del vehículo" etiquetaCerrar="Cerrar edición">
          <div className="flex flex-col gap-3 text-sm">
            <strong className="text-base">{nombre}</strong>
            <p className="text-ui-fg-muted">
              Para corregir los datos de un vehículo registrado, solicita la actualización a soporte. Conservaremos el vínculo con tus traslados y
              documentos.
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-ui-fg-muted">Placas</dt>
              <dd className="font-medium">{v.placas || "Sin placas"}</dd>
              <dt className="text-ui-fg-muted">Alias</dt>
              <dd className="font-medium">{v.alias || "Sin alias"}</dd>
            </dl>
            <Button asChild className="self-start">
              <Link href={`/soporte?${new URLSearchParams({ vehiculo: v.id, motivo: "correccion_datos" })}`}>
                Solicitar corrección de datos
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Sheet>
      </aside>
    </Card>
  );
}
