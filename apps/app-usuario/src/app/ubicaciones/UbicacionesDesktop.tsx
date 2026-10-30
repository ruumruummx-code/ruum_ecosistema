"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  aplicarLibreta,
  direccionCompleta,
  enlaceBuscarUbicacion,
  ETIQUETAS_UBICACION,
  normalizarBusqueda,
  tipoUbicacion,
  type FuenteUbicacion,
  type UbicacionUsuario,
} from "./ubicaciones-usuario";
import {
  libretaVacia,
  type LibretaUbicaciones,
  type OperacionUbicacion,
} from "./libreta-ubicaciones";
import { guardarOperacionUbicacion } from "./cliente-ubicaciones";
import {
  EtiquetaUbicacion,
  iconoDeUbicacion,
  nombreUbicacion,
  IconoUbicacion as Icon,
} from "./UbicacionVisual";
import { DetalleUbicacionDesktop } from "./DetalleUbicacionDesktop";
import { ConfirmarEliminarUbicacion, EditorUbicacion } from "./EditorUbicacion";
import s from "./ubicaciones-desktop.module.css";
const VACIA = libretaVacia();
type Tab = "todas" | "perfil" | "frecuentes" | "trabajo" | "otros";
function ordenar(lista: UbicacionUsuario[], orden: string): UbicacionUsuario[] {
  return [...lista].sort((a, b) =>
    orden === "nombre"
      ? nombreUbicacion(a).localeCompare(nombreUbicacion(b), "es")
      : orden === "usos"
        ? b.usos - a.usos
        : Number(b.fuentes.includes("perfil")) -
            Number(a.fuentes.includes("perfil")) ||
          (Date.parse(b.ultimoUso ?? b.creadoEn ?? "") || 0) -
            (Date.parse(a.ultimoUso ?? a.creadoEn ?? "") || 0),
  );
}
export function UbicacionesDesktop({
  ubicaciones,
  libretaInicial = VACIA,
}: {
  ubicaciones: UbicacionUsuario[];
  libretaInicial?: LibretaUbicaciones;
}) {
  const router = useRouter(),
    [refrescando, refrescar] = useTransition();
  const [libreta, setLibreta] = useState(libretaInicial),
    [busqueda, setBusqueda] = useState(""),
    [fuente, setFuente] = useState("todas"),
    [ciudad, setCiudad] = useState(""),
    [tab, setTab] = useState<Tab>("todas"),
    [orden, setOrden] = useState("recientes"),
    [soloUsadas, setSoloUsadas] = useState(false),
    [filtros, setFiltros] = useState(false),
    [pagina, setPagina] = useState(1),
    [seleccion, setSeleccion] = useState<string | null>(null),
    [cerrado, setCerrado] = useState(false),
    [menu, setMenu] = useState<string | null>(null);
  const [modal, setModal] = useState<{
      tipo: "editor" | "eliminar";
      ubicacion?: UbicacionUsuario;
    } | null>(null),
    [ocupado, setOcupado] = useState(false),
    [toast, setToast] = useState<{ texto: string; error: boolean } | null>(
      null,
    );
  const bloqueo = useRef(false),
    origenModal = useRef<HTMLElement | null>(null),
    nuevaRef = useRef<HTMLButtonElement>(null);
  useEffect(() => setLibreta(libretaInicial), [libretaInicial]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.error ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [toast]);
  const todas = useMemo(
    () => aplicarLibreta(ubicaciones, libreta),
    [ubicaciones, libreta],
  );
  const conteos = {
    todas: todas.length,
    perfil: todas.filter((u) => u.fuentes.includes("perfil")).length,
    frecuentes: todas.filter((u) => u.favorita).length,
    trabajo: todas.filter((u) => tipoUbicacion(u) === "trabajo").length,
    otros: todas.filter((u) =>
      ["origen", "destino", "otro"].includes(tipoUbicacion(u)),
    ).length,
  };
  const ciudades = [
    ...new Set(
      todas.flatMap((u) => [u.ciudad, u.estado ?? ""]).filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, "es"));
  const filtradas = useMemo(
    () =>
      ordenar(
        todas.filter(
          (u) =>
            (fuente === "todas" ||
              u.fuentes.includes(fuente as FuenteUbicacion)) &&
            (!ciudad || u.ciudad === ciudad || u.estado === ciudad) &&
            (!soloUsadas || u.usos > 0) &&
            (tab === "todas" ||
              (tab === "perfil" && u.fuentes.includes("perfil")) ||
              (tab === "frecuentes" && u.favorita) ||
              (tab === "trabajo" && tipoUbicacion(u) === "trabajo") ||
              (tab === "otros" &&
                ["origen", "destino", "otro"].includes(tipoUbicacion(u)))) &&
            normalizarBusqueda(
              [direccionCompleta(u), u.alias, u.referencia]
                .filter(Boolean)
                .join(" "),
            ).includes(normalizarBusqueda(busqueda)),
        ),
        orden,
      ),
    [todas, fuente, ciudad, soloUsadas, tab, busqueda, orden],
  );
  const paginas = Math.max(1, Math.ceil(filtradas.length / 10)),
    actual = Math.min(pagina, paginas),
    filas = filtradas.slice((actual - 1) * 10, actual * 10),
    elegida = filas.find((u) => u.id === seleccion) ?? filas[0];
  const volverInicio = () => {
    setPagina(1);
    setMenu(null);
    setCerrado(false);
  };
  const limpiar = () => {
    setBusqueda("");
    setFuente("todas");
    setCiudad("");
    setTab("todas");
    setOrden("recientes");
    setSoloUsadas(false);
    volverInicio();
  };
  const cerrarModal = useCallback(() => {
    setModal(null);
    requestAnimationFrame(() => {
      const origen = origenModal.current;
      (origen?.isConnected ? origen : nuevaRef.current)?.focus({
        preventScroll: true,
      });
    });
  }, []);
  function abrirModal(tipo: "editor" | "eliminar", u?: UbicacionUsuario) {
    origenModal.current = document.activeElement as HTMLElement;
    setMenu(null);
    setModal({ tipo, ubicacion: u });
  }
  async function persistir(
    op: OperacionUbicacion,
  ): Promise<LibretaUbicaciones> {
    if (bloqueo.current)
      throw new Error("Espera a que termine la operación actual.");
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
      setToast({
        texto: u.favorita
          ? "Ubicación quitada de frecuentes"
          : "Ubicación marcada como frecuente",
        error: false,
      });
    } catch (e) {
      setToast({
        texto:
          e instanceof Error
            ? e.message
            : "No pudimos actualizar tus favoritos.",
        error: true,
      });
    }
  }
  async function copiar(u: UbicacionUsuario) {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("clipboard_no_disponible");
      await navigator.clipboard.writeText(direccionCompleta(u));
      setToast({ texto: "Dirección copiada", error: false });
    } catch {
      setToast({
        texto:
          "No pudimos copiar la dirección. Revisa el permiso del portapapeles.",
        error: true,
      });
    }
  }
  function editar(u: UbicacionUsuario) {
    if (u.fuentes.includes("perfil") && !u.guardada)
      router.push("/cuenta/datos-personales");
    else abrirModal("editor", u);
  }
  async function guardar(op: OperacionUbicacion) {
    const actualizado = await persistir(op);
    limpiar();
    const lista = ordenar(
        aplicarLibreta(ubicaciones, actualizado),
        "recientes",
      ),
      index = lista.findIndex((u) => u.id === op.id);
    setPagina(index < 0 ? 1 : Math.floor(index / 10) + 1);
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
  const tabs: { id: Tab; label: string }[] = [
    { id: "todas", label: "Todas" },
    { id: "perfil", label: "Domicilio del perfil" },
    { id: "frecuentes", label: "Frecuentes" },
    { id: "trabajo", label: "Trabajo" },
    { id: "otros", label: "Otros" },
  ];
  return (
    <div className={s.page} data-testid="locations-desktop">
      <header className={s.heading}>
        <div>
          <p>Mis ubicaciones</p>
          <h1>Mis ubicaciones</h1>
          <span>
            Consulta, administra y usa tus direcciones para cotizar y registrar
            traslados más rápido.
          </span>
        </div>
        <div className={s.headingActions}>
          <button
            className={s.outline}
            disabled={ocupado || refrescando}
            aria-busy={refrescando}
            onClick={() => refrescar(() => router.refresh())}
          >
            <Icon name="refresh" />
            Actualizar ubicaciones
          </button>
          <button
            className={s.primary}
            ref={nuevaRef}
            disabled={ocupado}
            onClick={() => abrirModal("editor")}
          >
            <Icon name="plus" />
            Nueva ubicación
          </button>
        </div>
      </header>
      <div className={s.workspace} data-detail={Boolean(elegida && !cerrado)}>
        <section className={s.listColumn} aria-label="Listado de ubicaciones">
          <div className={s.metrics}>
            {(
              [
                ["pin", conteos.todas, "Ubicaciones registradas", "all"],
                ["home", conteos.perfil, "Domicilios del perfil", "profile"],
                ["star", conteos.frecuentes, "Frecuentes", "favorite"],
              ] as const
            ).map(([icon, count, label, tone]) => (
              <div key={tone} data-tone={tone}>
                <span>
                  <Icon name={icon} />
                </span>
                <div>
                  <strong>{count}</strong>
                  <small>{label}</small>
                </div>
              </div>
            ))}
          </div>
          <div className={s.filters}>
            <label className={s.search}>
              <Icon name="search" />
              <input
                type="search"
                aria-label="Buscar por dirección, ciudad, alias o código postal"
                placeholder="Buscar por dirección, ciudad, alias o código postal..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  volverInicio();
                }}
              />
            </label>
            <label className={s.select}>
              <span>Tipo de ubicación</span>
              <select
                aria-label="Tipo de ubicación"
                value={fuente}
                onChange={(e) => {
                  setFuente(e.target.value);
                  volverInicio();
                }}
              >
                <option value="todas">Todas</option>
                {Object.entries(ETIQUETAS_UBICACION).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <Icon name="down" />
            </label>
            <label className={s.select}>
              <span>Ciudad o estado</span>
              <select
                aria-label="Ciudad o estado"
                value={ciudad}
                onChange={(e) => {
                  setCiudad(e.target.value);
                  volverInicio();
                }}
              >
                <option value="">Todas</option>
                {ciudades.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <Icon name="down" />
            </label>
            <div className={s.moreFilters}>
              <button
                className={s.outline}
                aria-expanded={filtros}
                aria-controls="filtros-extra-ubicaciones"
                onClick={() => setFiltros(!filtros)}
              >
                <Icon name="filter" />
                Más filtros
              </button>
              {filtros && (
                <div id="filtros-extra-ubicaciones" className={s.popover}>
                  <label>
                    Ordenar por
                    <select
                      value={orden}
                      onChange={(e) => {
                        setOrden(e.target.value);
                        volverInicio();
                      }}
                    >
                      <option value="recientes">Más recientes</option>
                      <option value="nombre">Nombre o alias</option>
                      <option value="usos">Más utilizadas</option>
                    </select>
                  </label>
                  <label className={s.checkbox}>
                    <input
                      type="checkbox"
                      checked={soloUsadas}
                      onChange={(e) => {
                        setSoloUsadas(e.target.checked);
                        volverInicio();
                      }}
                    />
                    Con traslados registrados
                  </label>
                  <button
                    onClick={() => {
                      limpiar();
                      setFiltros(false);
                    }}
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          </div>
          <div
            className={s.tabs}
            role="tablist"
            aria-label="Categorías de ubicaciones"
          >
            {tabs.map((t, i) => (
              <button
                key={t.id}
                role="tab"
                id={`ubicaciones-tab-${t.id}`}
                aria-controls="lista-ubicaciones"
                aria-selected={tab === t.id}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => {
                  setTab(t.id);
                  volverInicio();
                }}
                onKeyDown={(e) => {
                  const n =
                    e.key === "ArrowRight"
                      ? (i + 1) % tabs.length
                      : e.key === "ArrowLeft"
                        ? (i + tabs.length - 1) % tabs.length
                        : e.key === "Home"
                          ? 0
                          : e.key === "End"
                            ? tabs.length - 1
                            : -1;
                  if (n >= 0) {
                    e.preventDefault();
                    setTab(tabs[n].id);
                    volverInicio();
                    document
                      .getElementById(`ubicaciones-tab-${tabs[n].id}`)
                      ?.focus();
                  }
                }}
              >
                {t.label} ({conteos[t.id]})
              </button>
            ))}
          </div>
          <div
            className={s.listScroll}
            id="lista-ubicaciones"
            role="tabpanel"
            aria-labelledby={`ubicaciones-tab-${tab}`}
            tabIndex={0}
          >
            {filas.length ? (
              <ul className={s.rows} aria-label="Ubicaciones registradas">
                {filas.map((u, i) => (
                  <li
                    key={u.id}
                    data-selected={!cerrado && elegida?.id === u.id}
                    onClick={() => {
                      setSeleccion(u.id);
                      setCerrado(false);
                      setMenu(null);
                    }}
                  >
                    <span
                      className={s.locationIcon}
                      data-type={tipoUbicacion(u)}
                    >
                      <Icon name={iconoDeUbicacion(u)} />
                    </span>
                    <button
                      className={s.locationIdentity}
                      aria-label={`Ver ${nombreUbicacion(u)}`}
                      aria-pressed={!cerrado && elegida?.id === u.id}
                      onClick={() => {
                        setSeleccion(u.id);
                        setCerrado(false);
                      }}
                    >
                      <strong>{nombreUbicacion(u)}</strong>
                      <span>{u.direccion.split(",")[0]}</span>
                      <small>
                        {[
                          u.direccion.split(",").slice(1).join(",").trim(),
                          u.codigoPostal &&
                          !u.direccion.includes(u.codigoPostal)
                            ? u.codigoPostal
                            : "",
                          u.ciudad,
                          u.estado,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Ciudad no registrada"}
                      </small>
                    </button>
                    <EtiquetaUbicacion ubicacion={u} />
                    <button
                      className={s.favorite}
                      data-active={u.favorita}
                      aria-pressed={Boolean(u.favorita)}
                      aria-label={`${u.favorita ? "Quitar de frecuentes" : "Marcar como frecuente"} ${nombreUbicacion(u)}`}
                      disabled={ocupado}
                      onClick={(e) => {
                        e.stopPropagation();
                        void favorita(u);
                      }}
                    >
                      <Icon name="star" />
                    </button>
                    <Link
                      className={s.use}
                      href={enlaceBuscarUbicacion(u, "origen")}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Icon name="send" />
                      Usar
                    </Link>
                    <div className={s.rowMenu}>
                      <button
                        aria-label={`Opciones de ${nombreUbicacion(u)}`}
                        aria-expanded={menu === u.id}
                        aria-controls={`menu-ubicacion-${i}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenu(menu === u.id ? null : u.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setMenu(null);
                        }}
                      >
                        <Icon name="more" />
                      </button>
                      {menu === u.id && (
                        <div
                          id={`menu-ubicacion-${i}`}
                          className={s.popover}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link href={enlaceBuscarUbicacion(u, "destino")}>
                            Usar como destino
                          </Link>
                          <button
                            onClick={() => {
                              void copiar(u);
                              setMenu(null);
                            }}
                          >
                            Copiar dirección
                          </button>
                          <button disabled={ocupado} onClick={() => editar(u)}>
                            Editar ubicación
                          </button>
                          <button
                            disabled={ocupado}
                            onClick={() => abrirModal("eliminar", u)}
                          >
                            Eliminar de mi libreta
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <section className={s.empty}>
                <Icon name="pin" />
                <h2>
                  {todas.length
                    ? "No se encontraron ubicaciones"
                    : "Aún no tienes direcciones registradas"}
                </h2>
                <p>
                  {todas.length
                    ? "Prueba otra dirección o ciudad, o limpia los filtros."
                    : "Guarda una dirección en tu libreta o completa el domicilio de tu perfil."}
                </p>
                {todas.length ? (
                  <button onClick={limpiar}>Limpiar filtros</button>
                ) : (
                  <>
                    <button onClick={() => abrirModal("editor")}>
                      Agregar mi primera ubicación
                    </button>
                    <Link href="/cuenta/datos-personales">
                      Completar domicilio del perfil
                    </Link>
                  </>
                )}
              </section>
            )}
          </div>
          <footer className={s.pagination}>
            <nav aria-label="Páginas de ubicaciones">
              <button
                aria-label="Página anterior"
                disabled={actual === 1}
                onClick={() => {
                  setPagina(actual - 1);
                  setMenu(null);
                }}
              >
                <Icon className={s.previous} name="chevron" />
              </button>
              {Array.from(
                new Set([
                  1,
                  ...Array.from(
                    { length: 4 },
                    (_, i) => Math.max(2, actual - 2) + i,
                  ).filter((n) => n < paginas),
                  paginas,
                ]),
              )
                .sort((a, b) => a - b)
                .map((n, i, nums) => (
                  <span key={n}>
                    {i > 0 && n - nums[i - 1] > 1 && <span>…</span>}
                    <button
                      aria-label={`Página ${n}`}
                      aria-current={actual === n ? "page" : undefined}
                      onClick={() => {
                        setPagina(n);
                        setMenu(null);
                      }}
                    >
                      {n}
                    </button>
                  </span>
                ))}
              <button
                aria-label="Página siguiente"
                disabled={actual === paginas}
                onClick={() => {
                  setPagina(actual + 1);
                  setMenu(null);
                }}
              >
                <Icon name="chevron" />
              </button>
            </nav>
            <span role="status">
              {filtradas.length
                ? `Mostrando ${(actual - 1) * 10 + 1}–${Math.min(actual * 10, filtradas.length)} de ${filtradas.length} ubicaciones`
                : `Mostrando 0 de ${todas.length} ubicaciones`}
            </span>
          </footer>
          {(busqueda ||
            fuente !== "todas" ||
            ciudad ||
            tab !== "todas" ||
            soloUsadas) && (
            <button className={s.clearFilters} onClick={limpiar}>
              Limpiar filtros
            </button>
          )}
        </section>
        {elegida && !cerrado && (
          <DetalleUbicacionDesktop
            key={`${elegida.id}:${elegida.version ?? 0}`}
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
          className={s.toast}
          data-error={toast.error}
          role={toast.error ? "alert" : "status"}
        >
          <Icon name={toast.error ? "close" : "check"} />
          {toast.texto}
        </div>
      )}
      {modal?.tipo === "editor" && (
        <EditorUbicacion
          ubicacion={modal.ubicacion}
          cerrar={cerrarModal}
          guardar={guardar}
        />
      )}
      {modal?.tipo === "eliminar" && modal.ubicacion && (
        <ConfirmarEliminarUbicacion
          ubicacion={modal.ubicacion}
          cerrar={cerrarModal}
          eliminar={() => eliminar(modal.ubicacion!)}
        />
      )}
    </div>
  );
}
