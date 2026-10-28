"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import type { Vehiculo } from "../cuenta-ui";
import { nombreVehiculo } from "./VehicleListItem";
import {
  estadoVehiculo,
  etiquetaTransmision,
  normalizarVehiculo,
  type TrasladoVehiculo,
} from "./vehiculos-model";
import {
  AtributosVehiculo,
  EstadoVehiculo,
  IconoVehiculo as Icon,
  ImagenVehiculo,
} from "./VehiculoVisual";
import { DetalleVehiculoDesktop } from "./DetalleVehiculoDesktop";
import s from "./vehiculos-desktop.module.css";
const SIN_TRASLADOS: TrasladoVehiculo[] = [];
export function VehiculosDesktop({
  vehiculos,
  traslados = SIN_TRASLADOS,
}: {
  vehiculos: Vehiculo[];
  traslados?: TrasladoVehiculo[];
}) {
  const router = useRouter();
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
  const disponibles = vehiculos.filter(
    (v) => estadoVehiculo(v) === "disponible",
  ).length;
  const revision = vehiculos.filter(
    (v) => estadoVehiculo(v) === "revision",
  ).length;
  const filtrados = useMemo(
    () =>
      vehiculos
        .filter(
          (v) =>
            (!tipo || v.tipo === tipo) &&
            (!estado || estadoVehiculo(v) === estado) &&
            (!transmision || etiquetaTransmision(v) === transmision) &&
            (!color ||
              normalizarVehiculo(v.color ?? "").includes(
                normalizarVehiculo(color),
              )) &&
            normalizarVehiculo(
              [nombreVehiculo(v), v.placas, v.alias].filter(Boolean).join(" "),
            ).includes(normalizarVehiculo(busqueda)),
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
  const paginas = Math.max(1, Math.ceil(filtrados.length / 5));
  const actual = Math.min(pagina, paginas);
  const filas = filtrados.slice((actual - 1) * 5, actual * 5);
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
  const filtrando = Boolean(busqueda || tipo || estado || transmision || color);
  return (
    <div className={s.page} data-testid="vehicles-desktop">
      <header className={s.heading}>
        <div>
          <p>Mis vehículos</p>
          <h1>Mis vehículos</h1>
          <span>
            Gestiona los vehículos registrados en tu cuenta y elige uno para tu
            próximo traslado.
          </span>
        </div>
        <div className={s.headingActions}>
          <button
            className={s.outline}
            aria-busy={actualizando}
            disabled={actualizando}
            onClick={() => actualizar(() => router.refresh())}
          >
            <Icon name="refresh" />
            Actualizar vehículos
          </button>
          <Link className={s.primary} href="/viajes/nuevo">
            <Icon name="plus" />
            Registrar nuevo vehículo
          </Link>
        </div>
      </header>
      <section className={s.metrics} aria-label="Resumen de vehículos">
        {(
          [
            [
              "registrados",
              "car",
              vehiculos.length,
              "Vehículos registrados",
              null,
            ],
            [
              "disponibles",
              "check",
              disponibles,
              "Disponibles para traslados",
              vehiculos.length
                ? Math.round((disponibles / vehiculos.length) * 100)
                : 0,
            ],
            [
              "revision",
              "tool",
              revision,
              "En revisión",
              vehiculos.length
                ? Math.round((revision / vehiculos.length) * 100)
                : 0,
            ],
            ["documentos", "file", "—", "Con documentos por vencer", null],
          ] as const
        ).map(([tone, icon, count, label, percent]) => (
          <div
            key={tone}
            className={s.metric}
            data-tone={tone}
            title={
              tone === "documentos"
                ? "No hay fechas de vencimiento disponibles en el registro actual."
                : undefined
            }
          >
            <span className={s.metricIcon}>
              <Icon name={icon} />
            </span>
            <div>
              <strong>{count}</strong>
              <small>{label}</small>
            </div>
            {percent != null && <span className={s.percent}>{percent}%</span>}
          </div>
        ))}
      </section>
      <section className={s.filters} aria-label="Filtrar vehículos">
        <label className={s.search}>
          <Icon name="search" />
          <input
            type="search"
            aria-label="Buscar por marca, modelo, placas o alias"
            placeholder="Buscar por marca, modelo, placas o alias..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              reiniciarPagina();
            }}
          />
        </label>
        <label className={s.select}>
          <span>Tipo de vehículo</span>
          <select
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
          </select>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7 10 5 5 5-5" />
          </svg>
        </label>
        <label className={s.select}>
          <span>Estado</span>
          <select
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
          </select>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7 10 5 5 5-5" />
          </svg>
        </label>
        <label className={`${s.select} ${s.sort}`}>
          <span>Ordenar por</span>
          <select
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
          </select>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m7 10 5 5 5-5" />
          </svg>
        </label>
        <div className={s.moreFilters}>
          <button
            className={s.outline}
            aria-expanded={filtros}
            aria-controls="filtros-vehiculos"
            onClick={() => setFiltros(!filtros)}
          >
            <Icon name="filter" />
            Más filtros
          </button>
          {filtros && (
            <div
              className={s.filterPopover}
              id="filtros-vehiculos"
              onKeyDown={(e) => {
                if (e.key === "Escape") setFiltros(false);
              }}
            >
              <label>
                Transmisión
                <select
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
                </select>
              </label>
              <label>
                Color
                <input
                  value={color}
                  placeholder="Ej. Blanco"
                  onChange={(e) => {
                    setColor(e.target.value);
                    reiniciarPagina();
                  }}
                />
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
      </section>
      <div className={s.workspace} data-detail={Boolean(vehiculo)}>
        <section className={s.listColumn} aria-label="Listado de vehículos">
          <div className={s.listHeading}>
            <p role="status">
              Mostrando {filtrados.length} de {vehiculos.length} vehículos
            </p>
            {filtrando && <button onClick={limpiar}>Limpiar filtros</button>}
          </div>
          <div
            className={s.listScroll}
            tabIndex={0}
            aria-label="Contenedor de vehículos con desplazamiento interno"
          >
            {filas.length ? (
              <ul className={s.cards} aria-label="Vehículos guardados">
                {filas.map((v) => (
                  <li
                    key={v.id}
                    data-selected={v.id === vehiculo?.id}
                    onClick={() => {
                      setSeleccionado(v.id);
                      setMenu(null);
                    }}
                  >
                    <ImagenVehiculo vehiculo={v} />
                    <div className={s.identity}>
                      <strong>{nombreVehiculo(v)}</strong>
                      <span>{v.placas?.trim() || "Sin placas"}</span>
                      {v.alias?.trim() && <small>{v.alias}</small>}
                    </div>
                    <AtributosVehiculo vehiculo={v} />
                    <EstadoVehiculo vehiculo={v} />
                    <button
                      className={s.view}
                      aria-label={`Ver ${nombreVehiculo(v)}`}
                      aria-pressed={v.id === vehiculo?.id}
                      onClick={() => setSeleccionado(v.id)}
                    >
                      Ver
                    </button>
                    <div className={s.rowMenu}>
                      <button
                        aria-label={`Opciones de ${nombreVehiculo(v)}`}
                        aria-expanded={menu === v.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenu(menu === v.id ? null : v.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setMenu(null);
                        }}
                      >
                        <Icon name="more" />
                      </button>
                      {menu === v.id && (
                        <div className={s.menuPopover}>
                          <Link href={`/cuenta/vehiculos/${v.id}`}>
                            Abrir expediente
                          </Link>
                          <Link
                            href={`/viajes/nuevo?${new URLSearchParams({ vehiculo: v.id })}`}
                          >
                            Solicitar traslado
                          </Link>
                          <Link
                            href={`/soporte?${new URLSearchParams({ vehiculo: v.id })}`}
                          >
                            Solicitar corrección
                          </Link>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <section className={s.empty}>
                <Icon name="car" />
                <h2>
                  {vehiculos.length
                    ? "No se encontraron vehículos"
                    : "Sin vehículos registrados"}
                </h2>
                <p>
                  {vehiculos.length
                    ? "Prueba otra búsqueda o limpia los filtros."
                    : "Captura los datos de tu vehículo al solicitar un traslado para registrarlo en tu cuenta."}
                </p>
                {vehiculos.length ? (
                  <button onClick={limpiar}>Mostrar todos</button>
                ) : (
                  <Link href="/viajes/nuevo">
                    Crear primer traslado
                    <Icon name="plus" />
                  </Link>
                )}
              </section>
            )}
          </div>
          <footer className={s.pagination}>
            <nav aria-label="Páginas de vehículos">
              <button
                aria-label="Página anterior"
                disabled={actual === 1}
                onClick={() => {
                  setPagina(actual - 1);
                  setMenu(null);
                }}
              >
                <Icon name="chevron" className={s.previous} />
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
            <span>
              {filtrados.length
                ? `Mostrando ${(actual - 1) * 5 + 1}–${Math.min(actual * 5, filtrados.length)} de ${filtrados.length} vehículos`
                : `Mostrando 0 de ${vehiculos.length} vehículos`}
            </span>
          </footer>
        </section>
        {vehiculo && (
          <DetalleVehiculoDesktop
            key={vehiculo.id}
            vehiculo={vehiculo}
            traslados={traslados}
          />
        )}
      </div>
    </div>
  );
}
