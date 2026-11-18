"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CarFront, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, Plus, Search, SlidersHorizontal } from "lucide-react";
import {
  Button,
  ChipGroup,
  EmptyState,
  InputConIcono,
  Label,
  NativeSelect,
  PageHeader,
  Sheet,
  Skeleton,
  Stat,
  StatGroup,
  useMediaQuery,
} from "@ruum/ui/base";
import { DetalleTraslado } from "./DetalleTraslado";
import { TrasladoItem } from "./TrasladoItem";
import { ETIQUETAS_PESTANA, ORDEN_PESTANAS, presentarViaje } from "./presentacion";
import { useGestionTraslados, type PestañaFiltro, type ViajeLista } from "./useGestionTraslados";

export const POR_PAGINA = 8;
/** Desde este ancho la lista convive con el panel de detalle (master-detail). */
export const QUERY_PANEL = "(min-width: 1280px)";

const OPCIONES_FECHA = [
  { valor: "todas", etiqueta: "Todas las fechas" },
  { valor: "hoy", etiqueta: "Hoy" },
  { valor: "semana", etiqueta: "Esta semana" },
  { valor: "mes", etiqueta: "Este mes" },
];

export interface MisTrasladosProps {
  traslados: ViajeLista[];
  pestanaInicial?: PestañaFiltro;
  busquedaInicial?: string;
  gastoConfirmadoServidor?: number;
  /** Refresca los datos del servidor cada 30 s y al recuperar foco/red. */
  autoActualizar?: boolean;
}

/**
 * Mis traslados — una sola pantalla para móvil y escritorio (sistema base v2).
 * Móvil: lista de tarjetas; la tarjeta abre el expediente.
 * ≥1280px: misma lista + panel de detalle a la derecha.
 */
export function MisTraslados({
  traslados,
  pestanaInicial = "todos",
  busquedaInicial = "",
  gastoConfirmadoServidor,
  autoActualizar = true,
}: MisTrasladosProps) {
  const g = useGestionTraslados<PestañaFiltro>({ traslados, pestanaInicial, busquedaInicial, gastoConfirmadoServidor });
  const router = useRouter();
  const conPanel = useMediaQuery(QUERY_PANEL);
  const raiz = useRef<HTMLDivElement>(null);
  const uid = useId();
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [panelCerrado, setPanelCerrado] = useState(false);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    if (!autoActualizar) return;
    const actualizar = () => {
      // La página monta esta pantalla en el marco móvil y en el de escritorio;
      // solo la instancia visible refresca.
      const visible = raiz.current?.checkVisibility?.() ?? true;
      if (document.visibilityState === "visible" && navigator.onLine && visible) router.refresh();
    };
    const intervalo = window.setInterval(actualizar, 30000);
    window.addEventListener("focus", actualizar);
    window.addEventListener("online", actualizar);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("focus", actualizar);
      window.removeEventListener("online", actualizar);
    };
  }, [router, autoActualizar]);

  const reiniciar = () => {
    setPagina(1);
    setPanelCerrado(false);
  };

  const paginas = Math.max(1, Math.ceil(g.filtrados.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const filas = g.filtrados.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA);
  const elegido = filas.find((v) => v.pasaporte.traslado_id === seleccion) ?? filas[0];
  const mostrarPanel = conPanel && Boolean(elegido) && !panelCerrado;

  const filtrosActivos = Boolean(g.busqueda.trim() || g.tipoVehiculoSeleccionado || g.filtroFecha !== "todas");
  const sinTraslados = traslados.length === 0;
  const opciones = ORDEN_PESTANAS.filter((id) => id !== "en_revision" || g.conteos.en_revision > 0 || g.pestana === "en_revision").map(
    (id) => ({ id, etiqueta: ETIQUETAS_PESTANA[id], conteo: g.conteos[id] }),
  );

  function abrir(viaje: ViajeLista) {
    if (conPanel) {
      setSeleccion(viaje.pasaporte.traslado_id);
      setPanelCerrado(false);
    } else {
      router.push(presentarViaje(viaje).url);
    }
  }

  function limpiar() {
    g.limpiarFiltros();
    g.setPestana("todos");
    reiniciar();
  }

  const camposFiltro = (prefijo: "hoja" | "escritorio") => (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${uid}-${prefijo}-fecha`} className={prefijo === "escritorio" ? "sr-only" : undefined}>
          Fecha
        </Label>
        <NativeSelect
          id={`${uid}-${prefijo}-fecha`}
          value={g.filtroFecha}
          onChange={(e) => {
            g.setFiltroFecha(e.target.value);
            reiniciar();
          }}
        >
          {OPCIONES_FECHA.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${uid}-${prefijo}-tipo`} className={prefijo === "escritorio" ? "sr-only" : undefined}>
          Tipo de vehículo
        </Label>
        <NativeSelect
          id={`${uid}-${prefijo}-tipo`}
          value={g.tipoVehiculoSeleccionado}
          onChange={(e) => {
            g.setTipoVehiculoSeleccionado(e.target.value);
            reiniciar();
          }}
        >
          <option value="">Todos los vehículos</option>
          {g.tiposVehiculo.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </NativeSelect>
      </div>
    </>
  );

  return (
    <div ref={raiz} className="min-h-full bg-ui-bg text-ui-fg">
      {/* La holgura de la barra inferior va en el contenido: el contenedor flex con
          scroll de MobileShell no respeta su propio padding-bottom al final. */}
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 px-4 pt-4 pb-[calc(var(--user-mobile-nav-height,5rem)+1.5rem)] sm:gap-5 sm:px-6 sm:pt-6 lg:px-8 lg:pb-8">
        <PageHeader
          titulo="Mis traslados"
          descripcion="Gestiona, filtra y da seguimiento a tus traslados."
          acciones={
            !sinTraslados && (
              <Button asChild>
                <Link href="/viajes/nuevo">
                  <Plus /> Crear traslado
                </Link>
              </Button>
            )
          }
        />

        <StatGroup aria-label="Resumen de traslados" className="grid-cols-3">
          <Stat etiqueta="Total" valor={g.conteos.todos} icono={<CarFront />} />
          <Stat etiqueta="En curso" valor={g.conteos.activos} icono={<Clock3 />} />
          <Stat etiqueta="Gastado" valor={g.gastoFormateado} icono={<CircleDollarSign />} />
        </StatGroup>

        <div className="flex flex-col gap-3">
          <ChipGroup
            etiqueta="Filtrar por estado del traslado"
            opciones={opciones}
            valor={g.pestana}
            onCambio={(id) => {
              g.setPestana(id);
              reiniciar();
            }}
          />
          <section aria-label="Buscar y filtrar traslados" className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex min-w-0 flex-1 flex-col xl:min-w-64">
              <Label htmlFor={`${uid}-buscar`} className="sr-only">
                Buscar traslado
              </Label>
              <InputConIcono
                id={`${uid}-buscar`}
                type="search"
                icono={<Search />}
                placeholder="Vehículo, placas, folio o destino"
                value={g.busquedaInput}
                aria-busy={g.buscando}
                onChange={(e) => {
                  g.setBusquedaInput(e.target.value);
                  reiniciar();
                }}
                accion={
                  <Button
                    variant={g.tipoVehiculoSeleccionado || g.filtroFecha !== "todas" ? "secondary" : "ghost"}
                    size="icon-sm"
                    className="lg:hidden"
                    aria-controls={`${uid}-filtros`}
                    aria-expanded={g.filtroAbierto}
                    aria-label={
                      g.tipoVehiculoSeleccionado
                        ? `Más filtros, filtro activo: ${g.tipoVehiculoSeleccionado}`
                        : "Más filtros"
                    }
                    onClick={() => g.setFiltroAbierto(true)}
                  >
                    <SlidersHorizontal />
                  </Button>
                }
              />
            </div>
            <div className="hidden shrink-0 gap-3 lg:flex [&_select]:w-auto [&_select]:min-w-44">{camposFiltro("escritorio")}</div>
            {filtrosActivos && filas.length > 0 && (
              <Button variant="ghost" className="hidden lg:inline-flex" onClick={limpiar}>
                Limpiar filtros
              </Button>
            )}
          </section>
        </div>

        <Sheet
          open={g.filtroAbierto}
          onClose={() => g.setFiltroAbierto(false)}
          titulo="Filtrar traslados"
          etiquetaCerrar="Cerrar filtros"
          pie={
            <>
              {filtrosActivos && (
                <Button variant="outline" size="lg" onClick={limpiar}>
                  Limpiar filtros
                </Button>
              )}
              <Button size="lg" onClick={() => g.setFiltroAbierto(false)}>
                Ver {g.filtrados.length} {g.filtrados.length === 1 ? "traslado" : "traslados"}
              </Button>
            </>
          }
        >
          <div id={`${uid}-filtros`} className="flex flex-col gap-4">
            {camposFiltro("hoja")}
          </div>
        </Sheet>

        <div className={mostrarPanel ? "grid grid-cols-[minmax(0,1fr)_26rem] items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_30rem]" : ""}>
          <section
                        aria-label={`Lista de traslados ${ETIQUETAS_PESTANA[g.pestana].toLowerCase()}: ${g.filtrados.length} resultados`}
            aria-busy={g.buscando}
            className="flex min-w-0 flex-col gap-3"
          >
            {g.buscando ? (
              <div className="flex flex-col gap-3" role="status" aria-label="Cargando traslados">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-36 rounded-lg" />
                ))}
              </div>
            ) : filas.length === 0 ? (
              filtrosActivos || !sinTraslados ? (
                <EmptyState
                  icono={<Search />}
                  titulo="No se encontraron traslados"
                  descripcion="Prueba con otro término o cambia los filtros."
                  accion={
                    <Button variant="outline" onClick={limpiar}>
                      Limpiar filtros
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icono={<CarFront />}
                  titulo="Aún no tienes traslados"
                  descripcion="Cuando solicites un traslado, aquí verás su estado, el conductor asignado y su pasaporte digital."
                  accion={
                    <Button asChild size="lg">
                      <Link href="/viajes/nuevo">
                        <Plus /> Crear traslado
                      </Link>
                    </Button>
                  }
                />
              )
            ) : (
              <>
                <ul className={mostrarPanel ? "grid gap-3" : "grid gap-3 md:grid-cols-2 lg:gap-4"}>
                  {filas.map((viaje, i) => (
                    <li key={viaje.pasaporte.traslado_id ?? `${viaje.pasaporte.creado_en}-${i}`} className="min-w-0">
                      <TrasladoItem viaje={viaje} seleccionado={mostrarPanel && elegido === viaje} onAbrir={abrir} />
                    </li>
                  ))}
                </ul>
                <footer className="flex items-center justify-between gap-3 pt-1 text-sm text-ui-fg-muted">
                  <span role="status">
                    Mostrando {(actual - 1) * POR_PAGINA + 1}–{Math.min(actual * POR_PAGINA, g.filtrados.length)} de{" "}
                    {g.filtrados.length} traslados
                  </span>
                  {paginas > 1 && (
                    <nav aria-label="Páginas de traslados" className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Página anterior"
                        disabled={actual === 1}
                        onClick={() => setPagina(actual - 1)}
                      >
                        <ChevronLeft />
                      </Button>
                      <span className="tabular-nums" aria-current="page">
                        {actual} / {paginas}
                      </span>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Página siguiente"
                        disabled={actual === paginas}
                        onClick={() => setPagina(actual + 1)}
                      >
                        <ChevronRight />
                      </Button>
                    </nav>
                  )}
                </footer>
              </>
            )}
          </section>

          {mostrarPanel && elegido && (
            <div className="sticky top-4 flex max-h-[calc(100dvh-var(--rr-header-height,72px)-2rem)] min-h-0 flex-col">
              <DetalleTraslado key={elegido.pasaporte.traslado_id} viaje={elegido} cerrar={() => setPanelCerrado(true)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
