"use client";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  House,
  MapPin,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { Button, Card, InputConIcono, Label, NativeSelect, cn, useMediaQuery } from "@ruum/ui/base";
import {
  aplicarLibreta,
  direccionCompleta,
  enlaceBuscarUbicacion,
  ladoHabitual,
  normalizarBusqueda,
  type FuenteUbicacion,
  type UbicacionUsuario,
} from "./ubicaciones-usuario";
import { libretaVacia, type LibretaUbicaciones, type OperacionUbicacion } from "./libreta-ubicaciones";
import { guardarOperacionUbicacion } from "./cliente-ubicaciones";
import { EtiquetaUbicacion, IconoUbicacion, nombreUbicacion } from "./UbicacionVisual";
import { DetalleUbicacion } from "./DetalleUbicacion";
import { ConfirmarEliminarUbicacion, EditorUbicacion } from "./EditorUbicacion";

const VACIA = libretaVacia();
const POR_PAGINA = 10;
/** Desde 1024 px el detalle se abre en un panel junto al listado; antes, en una hoja inferior. */
const QUERY_PANEL = "(min-width: 1024px)";
type Tab = FuenteUbicacion | "todas" | "frecuentes";
const CATEGORIAS: { id: Tab; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "perfil", label: "Domicilio del perfil" },
  { id: "frecuentes", label: "Frecuentes" },
  { id: "trabajo", label: "Trabajo" },
  { id: "origen", label: "Orígenes" },
  { id: "destino", label: "Destinos" },
  { id: "otro", label: "Otras" },
];
const ITEM_MENU =
  "flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm font-medium text-ui-fg hover:bg-ui-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring disabled:opacity-50";

function perteneceACategoria(u: UbicacionUsuario, tab: Tab) {
  return tab === "todas" || (tab === "frecuentes" ? Boolean(u.favorita) : u.fuentes.includes(tab));
}
function ordenar(lista: UbicacionUsuario[], orden: string): UbicacionUsuario[] {
  return [...lista].sort((a, b) =>
    orden === "nombre"
      ? nombreUbicacion(a).localeCompare(nombreUbicacion(b), "es")
      : orden === "usos"
        ? b.usos - a.usos
        : Number(b.fuentes.includes("perfil")) - Number(a.fuentes.includes("perfil")) ||
          (Date.parse(b.ultimoUso ?? b.creadoEn ?? "") || 0) - (Date.parse(a.ultimoUso ?? a.creadoEn ?? "") || 0),
  );
}
function resumenDireccion(u: UbicacionUsuario) {
  return (
    [
      u.direccion.split(",").slice(1).join(",").trim(),
      u.codigoPostal && !u.direccion.includes(u.codigoPostal) ? u.codigoPostal : "",
      u.ciudad,
      u.estado !== u.ciudad ? u.estado : "",
    ]
      .filter(Boolean)
      .join(", ") || "Ciudad no registrada"
  );
}

/**
 * Mis ubicaciones: una sola pantalla responsiva dentro de UserDashboardLayout.
 * Desde 1024 px el detalle se muestra junto al listado; antes, en una hoja inferior.
 */
export function Ubicaciones({ ubicaciones, libretaInicial = VACIA }: { ubicaciones: UbicacionUsuario[]; libretaInicial?: LibretaUbicaciones }) {
  const router = useRouter();
  const conPanel = useMediaQuery(QUERY_PANEL);
  const idFiltros = useId();
  const [refrescando, refrescar] = useTransition();
  const [libreta, setLibreta] = useState(libretaInicial);
  const [busqueda, setBusqueda] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [tab, setTab] = useState<Tab>("todas");
  const [orden, setOrden] = useState("recientes");
  const [soloUsadas, setSoloUsadas] = useState(false);
  const [filtros, setFiltros] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [cerrado, setCerrado] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [modal, setModal] = useState<{ tipo: "editor" | "eliminar"; ubicacion?: UbicacionUsuario } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [toast, setToast] = useState<{ texto: string; error: boolean } | null>(null);
  const bloqueo = useRef(false);
  const origenModal = useRef<HTMLElement | null>(null);
  const nuevaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setLibreta(libretaInicial), [libretaInicial]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.error ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const todas = useMemo(() => aplicarLibreta(ubicaciones, libreta), [ubicaciones, libreta]);
  const conteos = Object.fromEntries(CATEGORIAS.map(({ id }) => [id, todas.filter((u) => perteneceACategoria(u, id)).length]));
  const ciudades = [...new Set(todas.flatMap((u) => [u.ciudad, u.estado ?? ""]).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
  const filtradas = useMemo(
    () =>
      ordenar(
        todas.filter(
          (u) =>
            (!ciudad || u.ciudad === ciudad || u.estado === ciudad) &&
            (!soloUsadas || u.usos > 0) &&
            perteneceACategoria(u, tab) &&
            normalizarBusqueda([direccionCompleta(u), u.alias, u.referencia].filter(Boolean).join(" ")).includes(normalizarBusqueda(busqueda)),
        ),
        orden,
      ),
    [todas, ciudad, soloUsadas, tab, busqueda, orden],
  );
  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const actual = Math.min(pagina, paginas);
  const filas = filtradas.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA);
  /* En el panel siempre hay una ubicación elegida (la primera por defecto); la hoja solo se abre a petición. */
  const elegida = conPanel ? (filas.find((u) => u.id === seleccion) ?? filas[0]) : filas.find((u) => u.id === seleccion);
  const detalleAbierto = Boolean(elegida && !cerrado);
  const filtrando = Boolean(busqueda || ciudad || tab !== "todas" || soloUsadas);

  const volverInicio = () => {
    setPagina(1);
    setMenu(null);
    setCerrado(false);
  };
  const limpiar = () => {
    setBusqueda("");
    setCiudad("");
    setTab("todas");
    setOrden("recientes");
    setSoloUsadas(false);
    volverInicio();
  };
  const elegir = (u: UbicacionUsuario) => {
    setSeleccion(u.id);
    setCerrado(false);
    setMenu(null);
  };
  const cerrarModal = useCallback(() => {
    setModal(null);
    requestAnimationFrame(() => {
      const origen = origenModal.current;
      (origen?.isConnected ? origen : nuevaRef.current)?.focus({ preventScroll: true });
    });
  }, []);
  function abrirModal(tipo: "editor" | "eliminar", u?: UbicacionUsuario) {
    origenModal.current = document.activeElement as HTMLElement;
    setMenu(null);
    setModal({ tipo, ubicacion: u });
  }
  async function persistir(op: OperacionUbicacion): Promise<LibretaUbicaciones> {
    if (bloqueo.current) throw new Error("Espera a que termine la operación actual.");
    bloqueo.current = true;
    setOcupado(true);
    try {
      const resultado = await guardarOperacionUbicacion(op);
      if (!resultado.ok) throw new Error(resultado.mensaje);
      setLibreta(resultado.libreta);
      return resultado.libreta;
    } finally {
      bloqueo.current = false;
      setOcupado(false);
    }
  }
  async function favorita(u: UbicacionUsuario) {
    try {
      await persistir({ tipo: "favorita", id: u.id, valor: !u.favorita });
      setToast({ texto: u.favorita ? "Ubicación quitada de frecuentes" : "Ubicación marcada como frecuente", error: false });
    } catch (e) {
      setToast({ texto: e instanceof Error ? e.message : "No pudimos actualizar tus favoritos.", error: true });
    }
  }
  async function copiar(u: UbicacionUsuario) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard_no_disponible");
      await navigator.clipboard.writeText(direccionCompleta(u));
      setToast({ texto: "Dirección copiada", error: false });
    } catch {
      setToast({ texto: "No pudimos copiar la dirección. Revisa el permiso del portapapeles.", error: true });
    }
  }
  function editar(u: UbicacionUsuario) {
    if (u.fuentes.includes("perfil") && !u.guardada) router.push("/cuenta/datos-personales");
    else abrirModal("editor", u);
  }
  async function guardar(op: OperacionUbicacion) {
    const actualizado = await persistir(op);
    limpiar();
    const lista = ordenar(aplicarLibreta(ubicaciones, actualizado), "recientes");
    const index = lista.findIndex((u) => u.id === op.id);
    setPagina(index < 0 ? 1 : Math.floor(index / POR_PAGINA) + 1);
    setSeleccion(op.id);
    setCerrado(false);
    cerrarModal();
    setToast({ texto: "Ubicación guardada", error: false });
  }
  async function eliminar(u: UbicacionUsuario) {
    await persistir({ tipo: "eliminar", id: u.id, versionEsperada: u.version });
    cerrarModal();
    setToast({ texto: "Ubicación eliminada de tu libreta", error: false });
  }
  const numerosPagina = Array.from(
    new Set([1, ...Array.from({ length: 4 }, (_, i) => Math.max(2, actual - 2) + i).filter((n) => n < paginas), paginas]),
  ).sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 lg:h-full lg:min-h-[38rem] lg:overflow-hidden" data-testid="ubicaciones">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3 lg:flex-nowrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Mis ubicaciones</h1>
          <p className="mt-1 max-w-2xl text-sm text-ui-fg-muted">
            Consulta, administra y usa tus direcciones para cotizar y registrar traslados más rápido. El domicilio de tu perfil se modifica en{" "}
            <Link href="/cuenta/datos-personales" className="font-medium text-ui-brand underline-offset-4 hover:underline">
              Datos personales
            </Link>
            .
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto lg:shrink-0">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            disabled={ocupado || refrescando}
            aria-busy={refrescando}
            onClick={() => refrescar(() => router.refresh())}
          >
            <RefreshCw aria-hidden="true" className={cn(refrescando && "animate-spin")} />
            Actualizar ubicaciones
          </Button>
          <Button ref={nuevaRef} className="flex-1 sm:flex-none" disabled={ocupado} onClick={() => abrirModal("editor")}>
            <Plus aria-hidden="true" />
            Nueva ubicación
          </Button>
        </div>
      </header>

      <div className={cn("grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-rows-[minmax(0,1fr)]", detalleAbierto && conPanel && "lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(380px,440px)]")}>
        <Card asChild className="flex min-w-0 flex-col gap-3 p-4 lg:min-h-0">
          <section aria-label="Listado de ubicaciones">
            <dl className="grid shrink-0 grid-cols-3 divide-x divide-ui-line rounded-md border border-ui-line">
              {(
                [
                  [MapPin, conteos.todas, "Registradas"],
                  [House, conteos.perfil, "Del perfil"],
                  [Star, conteos.frecuentes, "Frecuentes"],
                ] as const
              ).map(([Icono, valor, etiqueta]) => (
                <div key={etiqueta} className="flex min-w-0 flex-col gap-0.5 px-3 py-2">
                  <dt className="flex items-center gap-1.5 truncate text-xs text-ui-fg-muted">
                    <Icono aria-hidden="true" className="hidden size-3.5 shrink-0 sm:block" />
                    {etiqueta}
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums">{valor}</dd>
                </div>
              ))}
            </dl>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <InputConIcono
                type="search"
                icono={<Search />}
                aria-label="Buscar por dirección, ciudad, alias o código postal"
                placeholder="Buscar por dirección, ciudad, alias o código postal…"
                value={busqueda}
                contenedorClassName="min-w-0 flex-[1_1_16rem]"
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  volverInicio();
                }}
              />
              <NativeSelect
                aria-label="Ciudad o estado"
                className="w-auto min-w-0 flex-[1_1_10rem] sm:flex-none"
                value={ciudad}
                onChange={(e) => {
                  setCiudad(e.target.value);
                  volverInicio();
                }}
              >
                <option value="">Todas las ciudades</option>
                {ciudades.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </NativeSelect>
              <Button variant="outline" aria-expanded={filtros} aria-controls={idFiltros} onClick={() => setFiltros(!filtros)}>
                <SlidersHorizontal aria-hidden="true" />
                Más filtros
              </Button>
            </div>
            {filtros && (
              <div id={idFiltros} className="flex shrink-0 flex-wrap items-end gap-3 rounded-md border border-ui-line bg-ui-muted p-3">
                <Label className="flex flex-col gap-1.5">
                  Ordenar por
                  <NativeSelect
                    value={orden}
                    onChange={(e) => {
                      setOrden(e.target.value);
                      volverInicio();
                    }}
                  >
                    <option value="recientes">Más recientes</option>
                    <option value="nombre">Nombre o alias</option>
                    <option value="usos">Más utilizadas</option>
                  </NativeSelect>
                </Label>
                <Label className="flex min-h-11 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 accent-ui-brand"
                    checked={soloUsadas}
                    onChange={(e) => {
                      setSoloUsadas(e.target.checked);
                      volverInicio();
                    }}
                  />
                  Con traslados registrados
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
              </div>
            )}

            <div className="-mx-1 flex shrink-0 gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Categorías de ubicaciones">
              {CATEGORIAS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={tab === t.id}
                  onClick={() => {
                    setTab(t.id);
                    volverInicio();
                  }}
                  className={cn(
                    "min-h-9 shrink-0 cursor-pointer rounded-full border px-3 text-sm font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring",
                    tab === t.id ? "border-ui-brand bg-ui-brand-soft text-ui-brand-soft-fg" : "border-ui-line text-ui-fg-muted hover:bg-ui-muted",
                  )}
                >
                  {t.label} ({conteos[t.id]})
                </button>
              ))}
            </div>

            <div className="min-h-0 lg:flex-1 lg:overflow-y-auto" id="lista-ubicaciones" role="region" aria-label="Resultados del filtro" tabIndex={0}>
              {filas.length ? (
                <ul className="flex flex-col gap-2" aria-label="Ubicaciones registradas">
                  {filas.map((u) => {
                    const seleccionada = detalleAbierto && elegida?.id === u.id;
                    const lado = ladoHabitual(u);
                    const otro = lado === "origen" ? "destino" : "origen";
                    return (
                      <li
                        key={u.id}
                        onClick={() => elegir(u)}
                        className={cn(
                          "relative flex items-start gap-3 rounded-md border p-3",
                          seleccionada ? "border-ui-brand bg-ui-brand-soft" : "border-ui-line hover:bg-ui-muted",
                        )}
                      >
                        <IconoUbicacion ubicacion={u} />
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <button
                            type="button"
                            className="min-w-0 cursor-pointer rounded-sm text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring"
                            aria-label={`Ver ${nombreUbicacion(u)}`}
                            aria-pressed={seleccionada}
                            onClick={(e) => {
                              e.stopPropagation();
                              elegir(u);
                            }}
                          >
                            <strong className="block truncate text-sm font-semibold">{nombreUbicacion(u)}</strong>
                            {u.alias && u.alias !== u.direccion.split(",")[0] && (
                              <span className="block truncate text-sm text-ui-fg">{u.direccion.split(",")[0]}</span>
                            )}
                            <small className="block truncate text-xs text-ui-fg-muted">{resumenDireccion(u)}</small>
                          </button>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <EtiquetaUbicacion ubicacion={u} />
                            <Link
                              href={enlaceBuscarUbicacion(u, lado)}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-ui-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring"
                            >
                              <Send aria-hidden="true" className="size-3.5" />
                              Usar como {lado}
                            </Link>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-pressed={Boolean(u.favorita)}
                          aria-label={`${u.favorita ? "Quitar de frecuentes" : "Marcar como frecuente"} ${nombreUbicacion(u)}`}
                          disabled={ocupado}
                          className={cn(u.favorita && "text-ui-warning hover:text-ui-warning")}
                          onClick={(e) => {
                            e.stopPropagation();
                            void favorita(u);
                          }}
                        >
                          <Star aria-hidden="true" className={cn(u.favorita && "fill-current")} />
                        </Button>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Opciones de ${nombreUbicacion(u)}`}
                            aria-expanded={menu === u.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenu(menu === u.id ? null : u.id);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setMenu(null);
                            }}
                          >
                            <MoreHorizontal aria-hidden="true" />
                          </Button>
                          {menu === u.id && (
                            <div
                              className="absolute right-0 z-30 mt-1 flex w-56 flex-col rounded-lg border border-ui-line bg-ui-card p-1.5 shadow-ui-md"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link className={ITEM_MENU} href={enlaceBuscarUbicacion(u, otro)}>
                                Usar como {otro}
                              </Link>
                              <button
                                type="button"
                                className={ITEM_MENU}
                                onClick={() => {
                                  void copiar(u);
                                  setMenu(null);
                                }}
                              >
                                Copiar dirección
                              </button>
                              <button type="button" className={ITEM_MENU} disabled={ocupado} onClick={() => editar(u)}>
                                Editar ubicación
                              </button>
                              <button type="button" className={cn(ITEM_MENU, "text-ui-danger")} disabled={ocupado} onClick={() => abrirModal("eliminar", u)}>
                                Eliminar de mi libreta
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <section className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                  <MapPin aria-hidden="true" className="size-8 text-ui-fg-muted" />
                  <h2 className="text-base font-semibold">{todas.length ? "No se encontraron ubicaciones" : "Aún no tienes direcciones registradas"}</h2>
                  <p className="text-sm text-ui-fg-muted">
                    {todas.length
                      ? "Prueba otra dirección o ciudad, o limpia los filtros."
                      : "Guarda una dirección en tu libreta o completa el domicilio de tu perfil."}
                  </p>
                  {todas.length ? (
                    <Button variant="outline" onClick={limpiar}>
                      Limpiar filtros
                    </Button>
                  ) : (
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button onClick={() => abrirModal("editor")}>Agregar mi primera ubicación</Button>
                      <Button asChild variant="outline">
                        <Link href="/cuenta/datos-personales">Completar domicilio del perfil</Link>
                      </Button>
                    </div>
                  )}
                </section>
              )}
            </div>

            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-ui-line pt-3">
              <nav aria-label="Páginas de ubicaciones" className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Página anterior"
                  disabled={actual === 1}
                  onClick={() => {
                    setPagina(actual - 1);
                    setMenu(null);
                  }}
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
                {numerosPagina.map((n, i) => (
                  <span key={n} className="flex items-center gap-1">
                    {i > 0 && n - numerosPagina[i - 1] > 1 && <span className="px-1 text-ui-fg-muted">…</span>}
                    <Button
                      variant={actual === n ? "secondary" : "ghost"}
                      size="icon-sm"
                      aria-label={`Página ${n}`}
                      aria-current={actual === n ? "page" : undefined}
                      onClick={() => {
                        setPagina(n);
                        setMenu(null);
                      }}
                    >
                      {n}
                    </Button>
                  </span>
                ))}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Página siguiente"
                  disabled={actual === paginas}
                  onClick={() => {
                    setPagina(actual + 1);
                    setMenu(null);
                  }}
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              </nav>
              <span role="status" className="text-sm text-ui-fg-muted">
                {filtradas.length
                  ? `Mostrando ${(actual - 1) * POR_PAGINA + 1}–${Math.min(actual * POR_PAGINA, filtradas.length)} de ${filtradas.length} ubicaciones`
                  : `Mostrando 0 de ${todas.length} ubicaciones`}
              </span>
              {filtrando && (
                <Button variant="link" size="sm" onClick={limpiar}>
                  Limpiar filtros
                </Button>
              )}
            </footer>
          </section>
        </Card>

        {elegida && !cerrado && (
          <DetalleUbicacion
            key={`${elegida.id}:${elegida.version ?? 0}`}
            variante={conPanel ? "panel" : "hoja"}
            ubicacion={elegida}
            cerrar={() => setCerrado(true)}
            copiar={() => void copiar(elegida)}
            favorita={() => void favorita(elegida)}
            editar={() => editar(elegida)}
            eliminar={() => abrirModal("eliminar", elegida)}
            ocupado={ocupado}
          />
        )}
      </div>

      {toast && (
        <div
          role={toast.error ? "alert" : "status"}
          className={cn(
            "fixed right-4 bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg p-3 text-sm font-medium shadow-ui-md sm:left-auto",
            toast.error ? "bg-ui-danger-soft text-ui-danger" : "bg-ui-success-soft text-ui-success",
          )}
        >
          {toast.error ? <X aria-hidden="true" className="size-4" /> : <Check aria-hidden="true" className="size-4" />}
          {toast.texto}
        </div>
      )}
      {modal?.tipo === "editor" && <EditorUbicacion ubicacion={modal.ubicacion} cerrar={cerrarModal} guardar={guardar} />}
      {modal?.tipo === "eliminar" && modal.ubicacion && (
        <ConfirmarEliminarUbicacion ubicacion={modal.ubicacion} cerrar={cerrarModal} eliminar={() => eliminar(modal.ubicacion!)} />
      )}
    </div>
  );
}
