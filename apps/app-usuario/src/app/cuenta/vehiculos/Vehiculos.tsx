"use client";
import { useId, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, ChevronLeft, ChevronRight, CircleCheck, FileText, MoreHorizontal, Plus, RefreshCw, Search, SlidersHorizontal, Wrench } from "lucide-react";
import { Button, Card, Input, InputConIcono, Label, NativeSelect, cn, useMediaQuery } from "@ruum/ui/base";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import type { Vehiculo } from "../cuenta-ui";
import { nombreVehiculo } from "./VehicleListItem";
import { estadoVehiculo, etiquetaTransmision, normalizarVehiculo, type TrasladoVehiculo } from "./vehiculos-model";
import { AtributosVehiculo, EstadoVehiculo, ImagenVehiculo } from "./VehiculoVisual";
import { DetalleVehiculo, ITEM_MENU, MENU } from "./DetalleVehiculo";

const SIN_TRASLADOS: TrasladoVehiculo[] = [];
const POR_PAGINA = 5;
/** Desde 1024 px el detalle se abre en un panel junto al listado; antes, en su propia página. */
const QUERY_PANEL = "(min-width: 1024px)";

/**
 * Mis vehículos: una sola pantalla responsiva. `page.tsx` la coloca en el marco
 * de navegación de cada tamaño.
 */
export function Vehiculos({ vehiculos, traslados = SIN_TRASLADOS }: { vehiculos: Vehiculo[]; traslados?: TrasladoVehiculo[] }) {
  const router = useRouter();
  const conPanel = useMediaQuery(QUERY_PANEL);
  const idFiltros = useId();
  const [actualizando, actualizar] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [orden, setOrden] = useState("recientes");
  const [filtros, setFiltros] = useState(false);
  const [transmision, setTransmision] = useState("");
  const [color, setColor] = useState("");
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [menu, setMenu] = useState<string | null>(null);

  const tipos = [...new Set(vehiculos.map((v) => v.tipo).filter(Boolean))];
  const transmisiones = [...new Set(vehiculos.map(etiquetaTransmision))];
  const disponibles = vehiculos.filter((v) => estadoVehiculo(v) === "disponible").length;
  const revision = vehiculos.filter((v) => estadoVehiculo(v) === "revision").length;
  const porcentaje = (n: number) => (vehiculos.length ? Math.round((n / vehiculos.length) * 100) : 0);

  const filtrados = useMemo(
    () =>
      vehiculos
        .filter(
          (v) =>
            (!tipo || v.tipo === tipo) &&
            (!estado || estadoVehiculo(v) === estado) &&
            (!transmision || etiquetaTransmision(v) === transmision) &&
            (!color || normalizarVehiculo(v.color ?? "").includes(normalizarVehiculo(color))) &&
            normalizarVehiculo([nombreVehiculo(v), v.placas, v.alias].filter(Boolean).join(" ")).includes(normalizarVehiculo(busqueda)),
        )
        .sort((a, b) =>
          orden === "nombre"
            ? nombreVehiculo(a).localeCompare(nombreVehiculo(b), "es")
            : orden === "antiguos"
              ? (Date.parse(a.creado_en) || 0) - (Date.parse(b.creado_en) || 0)
              : (Date.parse(b.creado_en) || 0) - (Date.parse(a.creado_en) || 0),
        ),
    [vehiculos, busqueda, tipo, estado, transmision, color, orden],
  );
  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const filas = filtrados.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA);
  const vehiculo = filas.find((v) => v.id === seleccionado) ?? filas[0];

  const reiniciarPagina = () => {
    setPagina(1);
    setMenu(null);
  };
  const limpiar = () => {
    setBusqueda("");
    setTipo("");
    setEstado("");
    setTransmision("");
    setColor("");
    setOrden("recientes");
    reiniciarPagina();
  };
  const irAPagina = (n: number) => {
    setPagina(n);
    setMenu(null);
  };
  const filtrando = Boolean(busqueda || tipo || estado || transmision || color);

  const metricas = [
    { clave: "registrados", Icono: Car, valor: vehiculos.length, etiqueta: "Vehículos registrados", porcentaje: null, tono: "bg-ui-brand-soft text-ui-brand" },
    { clave: "disponibles", Icono: CircleCheck, valor: disponibles, etiqueta: "Disponibles para traslados", porcentaje: porcentaje(disponibles), tono: "bg-ui-success-soft text-ui-success" },
    { clave: "revision", Icono: Wrench, valor: revision, etiqueta: "En revisión", porcentaje: porcentaje(revision), tono: "bg-ui-warning-soft text-ui-warning" },
    { clave: "documentos", Icono: FileText, valor: 0, etiqueta: "Alertas de vencimiento", porcentaje: null, tono: "bg-ui-neutral-soft text-ui-neutral" },
  ];

  const numerosPagina = Array.from(
    new Set([1, ...Array.from({ length: 3 }, (_, i) => actual - 1 + i).filter((n) => n > 1 && n < paginas), paginas]),
  ).sort((a, b) => a - b);

  return (
    <div
      data-testid="vehiculos"
      className="flex flex-col gap-4 px-4 pt-4 pb-[calc(var(--user-mobile-nav-height,5rem)+1.5rem)] text-ui-fg sm:px-6 lg:h-full lg:min-h-0 lg:overflow-hidden lg:px-8 lg:py-5"
    >
      <header className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis vehículos</h1>
          <p className="mt-1 text-sm text-ui-fg-muted">
            Gestiona los vehículos registrados en tu cuenta y elige uno para tu próximo traslado.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            variant="outline"
            aria-busy={actualizando}
            disabled={actualizando}
            onClick={() => actualizar(() => router.refresh())}
            title="Vuelve a consultar los datos y el estado de los vehículos registrados"
          >
            <RefreshCw aria-hidden="true" />
            {actualizando ? "Consultando flota…" : "Consultar estado de la flota"}
          </Button>
          <Button asChild>
            <Link href="/cuenta/vehiculos/nuevo">
              <Plus aria-hidden="true" />
              Registrar nuevo vehículo
            </Link>
          </Button>
        </div>
      </header>

      <section aria-label="Resumen de vehículos" className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {metricas.map(({ clave, Icono, valor, etiqueta, porcentaje: pct, tono }) => (
          <Card key={clave} className="flex items-center gap-3 p-3">
            <span aria-hidden="true" className={cn("hidden size-10 shrink-0 items-center justify-center rounded-md xl:flex", tono)}>
              <Icono className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block text-xl font-bold">{valor}</strong>
              <small className="block text-xs text-ui-fg-muted">{etiqueta}</small>
              {clave === "documentos" && <small className="block text-xs text-ui-fg-muted">Sin fechas registradas</small>}
            </div>
            {pct != null && <span className="text-xs font-semibold text-ui-fg-muted">{pct}%</span>}
          </Card>
        ))}
      </section>

      <section aria-label="Filtrar vehículos" className="flex shrink-0 flex-col gap-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-[minmax(14rem,1fr)_repeat(3,minmax(0,11rem))_auto]">
          <InputConIcono
            type="search"
            icono={<Search />}
            contenedorClassName="col-span-2 sm:col-span-4 2xl:col-span-1"
            aria-label="Buscar por marca, modelo, placas o alias"
            placeholder="Buscar por marca, modelo, placas o alias..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              reiniciarPagina();
            }}
          />
          <NativeSelect
            aria-label="Tipo de vehículo"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              reiniciarPagina();
            }}
          >
            <option value="">Todos los tipos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {ETIQUETA_TIPO_VEHICULO[t] ?? t}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="Estado"
            value={estado}
            onChange={(e) => {
              setEstado(e.target.value);
              reiniciarPagina();
            }}
          >
            <option value="">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="revision">En revisión</option>
            <option value="pendiente">Por confirmar</option>
          </NativeSelect>
          <NativeSelect
            aria-label="Ordenar por"
            value={orden}
            onChange={(e) => {
              setOrden(e.target.value);
              reiniciarPagina();
            }}
          >
            <option value="recientes">Registro más reciente</option>
            <option value="antiguos">Registro más antiguo</option>
            <option value="nombre">Nombre del vehículo</option>
          </NativeSelect>
          <Button variant="outline" aria-expanded={filtros} aria-controls={idFiltros} onClick={() => setFiltros(!filtros)}>
            <SlidersHorizontal aria-hidden="true" />
            Más filtros
          </Button>
        </div>
        {filtros && (
          <Card
            id={idFiltros}
            className="grid grid-cols-1 items-end gap-3 p-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,12rem)_auto]"
            onKeyDown={(e) => {
              if (e.key === "Escape") setFiltros(false);
            }}
          >
            <Label className="flex flex-col gap-1">
              Transmisión
              <NativeSelect
                value={transmision}
                onChange={(e) => {
                  setTransmision(e.target.value);
                  reiniciarPagina();
                }}
              >
                <option value="">Todas</option>
                {transmisiones.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </NativeSelect>
            </Label>
            <Label className="flex flex-col gap-1">
              Color
              <Input
                value={color}
                placeholder="Ej. Blanco"
                onChange={(e) => {
                  setColor(e.target.value);
                  reiniciarPagina();
                }}
              />
            </Label>
            <Button
              variant="ghost"
              onClick={() => {
                limpiar();
                setFiltros(false);
              }}
            >
              Limpiar filtros
            </Button>
          </Card>
        )}
      </section>

      <div
        className={cn(
          "flex flex-col gap-4 lg:grid lg:min-h-0 lg:flex-1",
          conPanel && vehiculo && "lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)] 2xl:grid-cols-[minmax(0,1fr)_minmax(24rem,28rem)]",
        )}
      >
        <Card asChild className="flex min-h-0 flex-col">
          <section aria-label="Listado de vehículos">
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-ui-line px-4 py-3">
              <p role="status" className="text-sm text-ui-fg-muted">
                Mostrando {filtrados.length} de {vehiculos.length} vehículos
              </p>
              {filtrando && (
                <Button variant="link" size="sm" onClick={limpiar}>
                  Limpiar filtros
                </Button>
              )}
            </div>
            <div
              className="min-h-0 flex-1 p-2 lg:overflow-y-auto"
              tabIndex={0}
              aria-label="Contenedor de vehículos con desplazamiento interno"
            >
              {filas.length ? (
                <ul aria-label="Vehículos guardados" className="flex flex-col gap-2">
                  {filas.map((v) => {
                    const nombre = nombreVehiculo(v);
                    const activo = conPanel && v.id === vehiculo?.id;
                    return (
                      <li
                        key={v.id}
                        data-selected={activo}
                        onClick={() => {
                          if (!conPanel) return;
                          setSeleccionado(v.id);
                          setMenu(null);
                        }}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-2.5 transition-colors",
                          activo ? "border-ui-brand bg-ui-brand-soft" : "border-ui-line",
                          conPanel && "cursor-pointer hover:bg-ui-muted",
                        )}
                      >
                        <ImagenVehiculo vehiculo={v} />
                        <div className="min-w-0 flex-1">
                          <strong className="block truncate text-sm font-semibold sm:text-base">{nombre}</strong>
                          <span className="block truncate font-mono text-sm text-ui-fg-muted">{v.placas?.trim() || "Sin placas"}</span>
                          {v.alias?.trim() && <small className="block truncate text-xs text-ui-fg-muted">{v.alias}</small>}
                          <AtributosVehiculo vehiculo={v} className="mt-1 hidden 2xl:flex" />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <EstadoVehiculo vehiculo={v} />
                          <div className="flex items-center gap-1">
                            {conPanel ? (
                              <Button
                                variant="outline"
                                size="sm"
                                aria-label={`Ver ${nombre}`}
                                aria-pressed={activo}
                                onClick={() => setSeleccionado(v.id)}
                              >
                                Ver
                              </Button>
                            ) : (
                              <Button asChild variant="outline" size="sm">
                                <Link href={`/cuenta/vehiculos/${v.id}`} aria-label={`Ver ${nombre}`}>
                                  Ver
                                </Link>
                              </Button>
                            )}
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Opciones de ${nombre}`}
                                aria-expanded={menu === v.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenu(menu === v.id ? null : v.id);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") setMenu(null);
                                }}
                              >
                                <MoreHorizontal aria-hidden="true" />
                              </Button>
                              {menu === v.id && (
                                <div className={MENU}>
                                  <Link className={ITEM_MENU} href={`/cuenta/vehiculos/${v.id}`}>
                                    Abrir expediente
                                  </Link>
                                  <Link className={ITEM_MENU} href={`/viajes/nuevo?${new URLSearchParams({ vehiculo: v.id })}`}>
                                    Solicitar traslado
                                  </Link>
                                  <Link className={ITEM_MENU} href={`/soporte?${new URLSearchParams({ vehiculo: v.id })}`}>
                                    Solicitar corrección
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <section className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-ui-muted text-ui-fg-muted">
                    <Car className="size-6" />
                  </span>
                  <h2 className="text-lg font-semibold">{vehiculos.length ? "No se encontraron vehículos" : "Sin vehículos registrados"}</h2>
                  <p className="max-w-sm text-sm text-ui-fg-muted">
                    {vehiculos.length
                      ? "Prueba otra búsqueda o limpia los filtros."
                      : "Registra tu vehículo para tenerlo disponible cuando necesites solicitar un traslado."}
                  </p>
                  {vehiculos.length ? (
                    <Button variant="outline" onClick={limpiar}>
                      Mostrar todos
                    </Button>
                  ) : (
                    <Button asChild variant="outline">
                      <Link href="/cuenta/vehiculos/nuevo">
                        Registrar primer vehículo
                        <Plus aria-hidden="true" />
                      </Link>
                    </Button>
                  )}
                </section>
              )}
            </div>
            {paginas > 1 && (
              <footer className="flex shrink-0 flex-col items-center gap-2 border-t border-ui-line px-4 py-3 sm:flex-row sm:justify-between">
                <nav aria-label="Páginas de vehículos" className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" aria-label="Página anterior" disabled={actual === 1} onClick={() => irAPagina(actual - 1)}>
                    <ChevronLeft aria-hidden="true" />
                  </Button>
                  {numerosPagina.map((n, i) => (
                    <span key={n} className="flex items-center gap-1">
                      {i > 0 && n - numerosPagina[i - 1]! > 1 && <span className="px-1 text-ui-fg-muted">…</span>}
                      <Button
                        variant={actual === n ? "secondary" : "ghost"}
                        size="icon-sm"
                        aria-label={`Página ${n}`}
                        aria-current={actual === n ? "page" : undefined}
                        onClick={() => irAPagina(n)}
                      >
                        {n}
                      </Button>
                    </span>
                  ))}
                  <Button variant="ghost" size="icon-sm" aria-label="Página siguiente" disabled={actual === paginas} onClick={() => irAPagina(actual + 1)}>
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </nav>
                <span className="text-xs text-ui-fg-muted">
                  Mostrando {(actual - 1) * POR_PAGINA + 1}–{Math.min(actual * POR_PAGINA, filtrados.length)} de {filtrados.length} vehículos
                </span>
              </footer>
            )}
          </section>
        </Card>
        {conPanel && vehiculo && <DetalleVehiculo key={vehiculo.id} vehiculo={vehiculo} traslados={traslados} />}
      </div>
    </div>
  );
}
