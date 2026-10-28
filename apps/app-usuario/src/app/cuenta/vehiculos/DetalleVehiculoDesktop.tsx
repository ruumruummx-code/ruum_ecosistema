"use client";
import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useDialogAccesible } from "@ruum/ui";
import { ETIQUETA_ESTADO_TRASLADO } from "@ruum/shared/states";
import type { Vehiculo } from "../cuenta-ui";
import { nombreVehiculo } from "./VehicleListItem";
import { fechaVehiculo, type TrasladoVehiculo } from "./vehiculos-model";
import {
  AtributosVehiculo,
  EstadoVehiculo,
  ImagenVehiculo,
  IconoVehiculo as Icon,
  type IconoVehiculoNombre,
} from "./VehiculoVisual";
import s from "./vehiculos-desktop.module.css";

function CorreccionVehiculo({
  vehiculo,
  cerrar,
}: {
  vehiculo: Vehiculo;
  cerrar: () => void;
}) {
  const foco = useRef<HTMLButtonElement>(null);
  const dialogRef = useDialogAccesible({
    alCancelar: cerrar,
    focoInicial: foco,
  });
  return (
    <dialog
      ref={dialogRef}
      className={s.dialog}
      aria-labelledby="titulo-corregir-vehiculo"
    >
      <header>
        <h2 id="titulo-corregir-vehiculo">Editar información del vehículo</h2>
        <button ref={foco} aria-label="Cerrar edición" onClick={cerrar}>
          <Icon name="close" />
        </button>
      </header>
      <strong>{nombreVehiculo(vehiculo)}</strong>
      <p>
        Para corregir los datos de un vehículo registrado, solicita la
        actualización a soporte. Conservaremos el vínculo con tus traslados y
        documentos.
      </p>
      <dl>
        <dt>Placas</dt>
        <dd>{vehiculo.placas || "Sin placas"}</dd>
        <dt>Alias</dt>
        <dd>{vehiculo.alias || "Sin alias"}</dd>
      </dl>
      <Link
        className={s.primary}
        href={`/soporte?${new URLSearchParams({ vehiculo: vehiculo.id, motivo: "correccion_datos" })}`}
      >
        Solicitar corrección de datos
        <Icon name="arrow" />
      </Link>
    </dialog>
  );
}
export function DetalleVehiculoDesktop({
  vehiculo: v,
  traslados,
}: {
  vehiculo: Vehiculo;
  traslados: TrasladoVehiculo[];
}) {
  const [tab, setTab] = useState("Información");
  const [menu, setMenu] = useState(false);
  const [editando, setEditando] = useState(false);
  const cerrarEdicion = useCallback(() => setEditando(false), []);
  const historial = traslados
    .filter((t) => t.vehiculo_id === v.id && Boolean(t.traslado_id))
    .sort(
      (a, b) =>
        (Date.parse(b.creado_en ?? "") || 0) -
        (Date.parse(a.creado_en ?? "") || 0),
    );
  const nombre = nombreVehiculo(v);
  const campos: [IconoVehiculoNombre, string, string | number | null][] = [
    ["wheel", "Marca", v.marca],
    ["car", "Modelo", v.modelo],
    ["calendar", "Año", v.anio],
    ["color", "Color", v.color],
    ["vin", "Número de serie (VIN)", v.vin],
  ];
  const documentos = [
    ["Tarjeta de circulación", v.tiene_tarjeta_circulacion],
    ["Verificación vehicular", v.tiene_verificacion],
    ["Permiso especial vigente", v.permiso_especial_vigente],
  ] as const;
  function cambiarTab(value: string) {
    setTab(value);
    setMenu(false);
  }
  return (
    <aside className={s.detail} aria-label={`Detalle de ${nombre}`}>
      <div className={s.detailToolbar}>
        <EstadoVehiculo vehiculo={v} />
        <div>
          <button className={s.edit} onClick={() => setEditando(true)}>
            <Icon name="edit" />
            Editar
          </button>
          <div className={s.detailMenu}>
            <button
              aria-label="Más opciones del vehículo seleccionado"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setMenu(false);
              }}
            >
              <Icon name="more" />
            </button>
            {menu && (
              <div className={s.menuPopover}>
                <Link href={`/cuenta/vehiculos/${v.id}`}>Abrir expediente</Link>
                <button onClick={() => cambiarTab("Historial")}>
                  Consultar historial
                </button>
                <Link
                  href={`/soporte?${new URLSearchParams({ vehiculo: v.id })}`}
                >
                  Solicitar ayuda
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={s.hero}>
        <ImagenVehiculo vehiculo={v} grande />
      </div>
      <header className={s.detailIdentity}>
        <h2>{nombre}</h2>
        <p>
          {v.placas?.trim() || "Sin placas"}
          {v.alias?.trim() && <span>{v.alias}</span>}
        </p>
      </header>
      <AtributosVehiculo vehiculo={v} detalle />
      <div className={s.tabs} role="tablist" aria-label="Vista del vehículo">
        {["Información", "Documentos", "Historial"].map((t, i, all) => (
          <button
            key={t}
            id={`vehiculo-tab-${t}`}
            role="tab"
            tabIndex={tab === t ? 0 : -1}
            aria-selected={tab === t}
            aria-controls="vehiculo-panel"
            onClick={() => cambiarTab(t)}
            onKeyDown={(e) => {
              const n =
                e.key === "ArrowRight"
                  ? (i + 1) % 3
                  : e.key === "ArrowLeft"
                    ? (i + 2) % 3
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? 2
                        : -1;
              if (n >= 0) {
                e.preventDefault();
                cambiarTab(all[n]);
                document.getElementById(`vehiculo-tab-${all[n]}`)?.focus();
              }
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div
        className={s.detailContent}
        id="vehiculo-panel"
        role="tabpanel"
        aria-labelledby={`vehiculo-tab-${tab}`}
      >
        {tab === "Información" ? (
          <dl className={s.specifications}>
            {campos.map(([icon, label, value]) => (
              <div key={label}>
                <dt>
                  <Icon name={icon} />
                  {label}
                </dt>
                <dd>{String(value ?? "").trim() || "No registrado"}</dd>
              </div>
            ))}
          </dl>
        ) : tab === "Documentos" ? (
          <section
            className={s.documents}
            aria-label={`Documentos de ${nombre}`}
          >
            <h3>Documentación declarada</h3>
            {documentos.map(([label, value]) => (
              <div key={label}>
                <Icon name="file" />
                <span>{label}</span>
                <strong data-present={Boolean(value)}>
                  {value === true
                    ? "Declarada"
                    : typeof value === "string" && value.trim()
                      ? value
                      : value === false
                        ? "Pendiente"
                        : "Sin registro"}
                </strong>
              </div>
            ))}
            <p>
              El registro actual no incluye archivos vinculados ni fechas de
              vencimiento.
            </p>
          </section>
        ) : (
          <section className={s.history} aria-label={`Historial de ${nombre}`}>
            <div>
              <Icon name="calendar" />
              <p>
                <strong>Vehículo registrado</strong>
                <small>{fechaVehiculo(v.creado_en)}</small>
              </p>
            </div>
            {historial.length ? (
              historial.slice(0, 2).map((t) => (
                <Link key={t.traslado_id} href={`/viajes/${t.traslado_id}`}>
                  <Icon name="car" />
                  <p>
                    <strong>
                      {t.origen_ciudad || "Origen pendiente"}
                      <Icon name="arrow" />
                      {t.destino_ciudad || "Destino pendiente"}
                    </strong>
                    <small>
                      {fechaVehiculo(t.creado_en)} ·{" "}
                      {t.estado
                        ? ETIQUETA_ESTADO_TRASLADO[t.estado]
                        : "Estado pendiente"}
                    </small>
                  </p>
                </Link>
              ))
            ) : (
              <p className={s.noHistory}>
                Este vehículo aún no tiene traslados registrados.
              </p>
            )}
            <Link
              className={s.historyAll}
              href={`/mis-viajes?${new URLSearchParams({ buscar: v.placas?.trim() || nombre })}`}
            >
              Ver historial completo
              <Icon name="arrow" />
            </Link>
          </section>
        )}
      </div>
      <footer className={s.detailActions}>
        <button
          className={s.outline}
          onClick={() => {
            cambiarTab("Documentos");
            document.getElementById("vehiculo-tab-Documentos")?.focus();
          }}
        >
          <Icon name="file" />
          Ver documentos
        </button>
        <Link
          className={s.primary}
          href={`/viajes/nuevo?${new URLSearchParams({ vehiculo: v.id })}`}
        >
          <Icon name="car" />
          Seleccionar para traslado
        </Link>
      </footer>
      {editando && <CorreccionVehiculo vehiculo={v} cerrar={cerrarEdicion} />}
    </aside>
  );
}
