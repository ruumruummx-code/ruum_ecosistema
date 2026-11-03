"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EstadoTraslado, VehiculoTraslado } from "./VisualesTraslado";
import { useRouter } from "next/navigation";
import { UserDashboardLayout } from "../../components/layout/UserDashboardLayout";
import type { NotificacionHeader } from "../../components/layout/UserHeader";
import { DashboardIcon as Icon } from "../dashboard/DashboardIcon";
import {
  useGestionTraslados,
  fechaProgramada,
  vehiculoNombre,
  pestañaDeViaje,
  type ViajeLista,
  type PestañaFiltro,
} from "./useGestionTraslados";
import { DetalleTrasladoDesktop } from "./DetalleTrasladoDesktop";
import s from "./traslados-desktop.module.css";

export interface MisViajesDesktopProps {
  traslados: ViajeLista[];
  nombreUsuario?: string | null;
  pestanaInicial?: PestañaFiltro;
  busquedaInicial?: string;
  notificaciones?: NotificacionHeader[];
}
export const etiquetas = {
  todos: "Todos",
  activos: "En curso",
  programados: "Programados",
  finalizados: "Completados",
  cancelados: "Cancelados",
};
export function MisViajesDesktop({
  traslados,
  nombreUsuario,
  pestanaInicial = "todos",
  busquedaInicial = "",
  notificaciones = [],
}: MisViajesDesktopProps) {
  const g = useGestionTraslados({ traslados, pestanaInicial, busquedaInicial });
  const router = useRouter();
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [cerrado, setCerrado] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [menu, setMenu] = useState<string | null>(null);
  const paginas = Math.max(1, Math.ceil(g.filtrados.length / 8));
  const actual = Math.min(pagina, paginas);
  const filas = g.filtrados.slice((actual - 1) * 8, actual * 8);
  const elegido =
    filas.find((v) => v.pasaporte.traslado_id === seleccion) ?? filas[0];
  useEffect(() => {
    const actualizar = () => {
      if (document.visibilityState === "visible" && navigator.onLine)
        router.refresh();
    };
    const intervalo = window.setInterval(actualizar, 30000);
    window.addEventListener("focus", actualizar);
    window.addEventListener("online", actualizar);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("focus", actualizar);
      window.removeEventListener("online", actualizar);
    };
  }, [router]);
  const resetPagina = () => {
    setPagina(1);
    setCerrado(false);
    setMenu(null);
  };
  const cambiar = (tab: PestañaFiltro) => {
    g.setPestana(tab);
    resetPagina();
  };
  const tabs = Object.keys(etiquetas) as PestañaFiltro[];
  return (
    <UserDashboardLayout
      idContenido="desktopMainContentTraslados"
      nombre={nombreUsuario}
      notificaciones={notificaciones}
      fixedContent
      dashboardHeader
      padding="ninguno"
      classNameContenido={s.main}
    >
      <header className={s.heading}>
        <div>
          <p>Mis traslados</p>
          <h1>Mis traslados</h1>
          <span>
            Gestiona, filtra y da seguimiento a todos tus servicios de traslado.
          </span>
        </div>
        <Link className={s.primary} href="/viajes/nuevo">
          <Icon name="plus" />
          Crear traslado
        </Link>
      </header>
      <div className={s.workspace} data-detail={Boolean(elegido && !cerrado)}>
        <section className={s.list} aria-label="Listado de traslados">
          <div className={s.metrics}>
            {(
              [
                ["todos", "Total de traslados", "car"],
                ["finalizados", "Completados", "check"],
                ["activos", "En curso", "clock"],
                ["programados", "Programados", "clock"],
              ] as const
            ).map(([tipo, label, icon]) => (
              <div key={tipo} className={s.metric} data-tone={tipo}>
                <span className={s.metricIcon}>
                  <Icon name={icon} />
                </span>
                <div>
                  <strong>{g.conteos[tipo]}</strong>
                  <small>{label}</small>
                </div>
                {tipo !== "todos" && (
                  <span className={s.percent}>
                    {g.conteos.todos
                      ? Math.round((g.conteos[tipo] / g.conteos.todos) * 100)
                      : 0}
                    %
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className={s.filters}>
            <label className={s.search}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <circle cx="10" cy="10" r="7" />
                <path d="m15 15 6 6" />
              </svg>
              <input
                aria-label="Buscar por vehículo, placas, folio o destino"
                placeholder="Buscar por vehículo, placas, folio o destino..."
                value={g.busquedaInput}
                aria-busy={g.buscando}
                onChange={(e) => {
                  g.setBusquedaInput(e.target.value);
                  resetPagina();
                }}
              />
            </label>
            <select
              aria-label="Filtrar por fecha"
              value={g.filtroFecha}
              onChange={(e) => {
                g.setFiltroFecha(e.target.value);
                resetPagina();
              }}
            >
              <option value="todas">Fecha: Todas</option>
              <option value="hoy">Hoy</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
            </select>
            <select
              aria-label="Filtrar por estado"
              value={g.pestana}
              onChange={(e) => cambiar(e.target.value as PestañaFiltro)}
            >
              {tabs.map((t) => (
                <option key={t} value={t}>
                  {t === "todos" ? "Estado: Todos" : etiquetas[t]}
                </option>
              ))}
            </select>
            <div className={s.moreFilters}>
              <button
                aria-expanded={g.filtroAbierto}
                aria-controls="filtros-adicionales-desktop"
                onClick={() => g.setFiltroAbierto(!g.filtroAbierto)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="M4 7h16M4 17h16M8 4v6m8 4v6" />
                </svg>
                Más filtros
              </button>
              {g.filtroAbierto && (
                <div id="filtros-adicionales-desktop" className={s.popover}>
                  <label>
                    Tipo de vehículo
                    <select
                      value={g.tipoVehiculoSeleccionado}
                      onChange={(e) => {
                        g.setTipoVehiculoSeleccionado(e.target.value);
                        resetPagina();
                      }}
                    >
                      <option value="">Todos</option>
                      {g.tiposVehiculo.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
            <button
              className={s.clear}
              onClick={() => {
                g.limpiarFiltros();
                cambiar("todos");
              }}
            >
              Limpiar filtros
            </button>
          </div>
          <div
            className={s.tabs}
            role="tablist"
            aria-label="Filtrar por estado del traslado"
          >
            {tabs.map((t, index) => (
              <button
                key={t}
                id={`tab-${t}`}
                role="tab"
                aria-selected={g.pestana === t}
                aria-controls="tabla-traslados"
                tabIndex={g.pestana === t ? 0 : -1}
                onClick={() => cambiar(t)}
                onKeyDown={(e) => {
                  const next =
                    e.key === "ArrowRight"
                      ? (index + 1) % tabs.length
                      : e.key === "ArrowLeft"
                        ? (index + tabs.length - 1) % tabs.length
                        : e.key === "Home"
                          ? 0
                          : e.key === "End"
                            ? tabs.length - 1
                            : -1;
                  if (next >= 0) {
                    e.preventDefault();
                    cambiar(tabs[next]);
                    document.getElementById(`tab-${tabs[next]}`)?.focus();
                  }
                }}
              >
                {etiquetas[t]} ({g.conteos[t]})
              </button>
            ))}
          </div>
          <div
            className={s.tableScroll}
            id="tabla-traslados"
            role="tabpanel"
            aria-labelledby={`tab-${g.pestana}`}
            tabIndex={0}
          >
            <table className={s.table}>
              <thead>
                <tr>
                  {[
                    "Vehículo",
                    "Origen",
                    "",
                    "Destino",
                    "Fecha",
                    "Estado",
                    "Acciones",
                  ].map((h, i) => (
                    <th key={i} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((v, i) => {
                  const p = v.pasaporte;
                  const fecha = fechaProgramada(
                    v.traslado?.fecha_hora_programada ?? null,
                  );
                  const id = p.traslado_id ?? String(i);
                  return (
                    <tr
                      key={id}
                      data-selected={!cerrado && elegido === v}
                      onClick={() => {
                        setSeleccion(p.traslado_id);
                        setCerrado(false);
                      }}
                    >
                      <td>
                        <div className={s.vehicle}>
                          <VehiculoTraslado viaje={v} />
                          <div>
                            <strong>{vehiculoNombre(p)}</strong>
                            <small>
                              {p.vehiculo_placas || "Placas pendientes"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {v.traslado?.origen_ciudad ||
                          p.origen_ciudad ||
                          "Origen pendiente"}
                      </td>
                      <td>
                        <Icon name="arrow" />
                      </td>
                      <td>
                        {v.traslado?.destino_ciudad ||
                          p.destino_ciudad ||
                          "Destino pendiente"}
                      </td>
                      <td>
                        {fecha.fecha}
                        <small>{fecha.hora}</small>
                      </td>
                      <td>
                        <EstadoTraslado viaje={v} />
                      </td>
                      <td>
                        <div className={s.actions}>
                          <button
                            aria-label={`Ver ${vehiculoNombre(p)}`}
                            onClick={() => {
                              setSeleccion(p.traslado_id);
                              setCerrado(false);
                            }}
                          >
                            Ver
                          </button>
                          <div className={s.menu}>
                            <button
                              aria-label={`Más acciones de ${vehiculoNombre(p)}`}
                              aria-expanded={menu === id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenu(menu === id ? null : id);
                              }}
                            >
                              <Icon name="more" />
                            </button>
                            {menu === id && (
                              <div className={s.popover}>
                                {p.traslado_id ? (
                                  <Link href={`/viajes/${p.traslado_id}`}>
                                    Abrir detalle completo
                                  </Link>
                                ) : (
                                  <span>Detalle no disponible</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filas.length && (
              <div className={s.empty}>
                <Icon name="car" />
                <strong>
                  {traslados.length
                    ? "No se encontraron traslados con los filtros seleccionados"
                    : "Aún no tienes traslados registrados"}
                </strong>
                <span>
                  {traslados.length
                    ? "Prueba con otro término o limpia los filtros."
                    : "Crea tu primer traslado para comenzar."}
                </span>
              </div>
            )}
          </div>
          <footer className={s.pagination}>
            <nav aria-label="Páginas de traslados">
              <button
                aria-label="Página anterior"
                disabled={actual === 1}
                onClick={() => setPagina(actual - 1)}
              >
                ‹
              </button>
              {Array.from(
                new Set([
                  1,
                  ...Array.from({ length: 3 }, (_, i) => actual - 1 + i).filter(
                    (n) => n > 1 && n < paginas,
                  ),
                  paginas,
                ]),
              )
                .sort((a, b) => a - b)
                .map((n, i, nums) => (
                  <span key={n}>
                    {i > 0 && n - nums[i - 1] > 1 && (
                      <span className={s.ellipsis}>…</span>
                    )}
                    <button
                      aria-label={`Página ${n}`}
                      aria-current={actual === n ? "page" : undefined}
                      onClick={() => {
                        setPagina(n);
                        setCerrado(false);
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
                onClick={() => setPagina(actual + 1)}
              >
                ›
              </button>
            </nav>
            <span role="status">
              {g.filtrados.length
                ? `Mostrando ${(actual - 1) * 8 + 1}–${Math.min(actual * 8, g.filtrados.length)} de ${g.filtrados.length} traslados`
                : `Mostrando 0 de ${traslados.length} traslados`}
            </span>
          </footer>
        </section>
        {elegido && !cerrado && (
          <DetalleTrasladoDesktop
            key={elegido.pasaporte.traslado_id}
            viaje={elegido}
            cerrar={() => setCerrado(true)}
          />
        )}
      </div>
    </UserDashboardLayout>
  );
}
