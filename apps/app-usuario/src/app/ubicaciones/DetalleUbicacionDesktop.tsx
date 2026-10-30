"use client";
import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useDialogAccesible } from "@ruum/ui";
import {
  direccionCompleta,
  enlaceBuscarUbicacion,
  ETIQUETAS_UBICACION,
  tipoUbicacion,
  type UbicacionUsuario,
} from "./ubicaciones-usuario";
import { coordenadasValidas } from "./libreta-ubicaciones";
import {
  EtiquetaUbicacion,
  iconoDeUbicacion,
  nombreUbicacion,
  IconoUbicacion as Icon,
  type IconoUbicacionNombre,
} from "./UbicacionVisual";
import s from "./ubicaciones-desktop.module.css";
const Mapa = dynamic(
  () => import("./MapaUbicacion").then((m) => m.MapaUbicacion),
  {
    ssr: false,
    loading: () => (
      <div className={s.mapLoading} role="status">
        Cargando mapa…
      </div>
    ),
  },
);
function MapaAmpliado({
  ubicacion,
  cerrar,
}: {
  ubicacion: UbicacionUsuario;
  cerrar: () => void;
}) {
  const foco = useRef<HTMLButtonElement>(null),
    dialog = useDialogAccesible({ focoInicial: foco, alCancelar: cerrar });
  return (
    <dialog
      ref={dialog}
      className={`${s.dialog} ${s.mapDialog}`}
      aria-label="Mapa ampliado"
    >
      <header>
        <h2>{nombreUbicacion(ubicacion)}</h2>
        <button ref={foco} aria-label="Cerrar mapa ampliado" onClick={cerrar}>
          <Icon name="close" />
        </button>
      </header>
      <p>{direccionCompleta(ubicacion)}</p>
      <div className={s.expandedMap}>
        <Mapa ubicacion={ubicacion} ampliado />
      </div>
    </dialog>
  );
}
export function DetalleUbicacionDesktop({
  ubicacion: u,
  cerrar,
  copiar,
  favorita,
  editar,
  eliminar,
  ocupado,
}: {
  ubicacion: UbicacionUsuario;
  cerrar: () => void;
  copiar: () => void;
  favorita: () => void;
  editar: () => void;
  eliminar: () => void;
  ocupado: boolean;
}) {
  const [ampliado, setAmpliado] = useState(false),
    abrirRef = useRef<HTMLButtonElement>(null);
  const cerrarMapa = useCallback(() => {
    setAmpliado(false);
    requestAnimationFrame(() =>
      abrirRef.current?.focus({ preventScroll: true }),
    );
  }, []);
  const tipo = tipoUbicacion(u);
  const campos: [IconoUbicacionNombre, string, string][] = [
    ["home", "Tipo de ubicación", ETIQUETAS_UBICACION[tipo]],
    ["pin", "Ciudad", u.ciudad || "No registrada"],
    ["flag", "Estado", u.estado || "No registrado"],
    ["code", "Código postal", u.codigoPostal || "No registrado"],
    [
      "pin",
      "Coordenadas",
      coordenadasValidas(u.lat, u.lng)
        ? `${u.lat}, ${u.lng}`
        : "No registradas",
    ],
    ["note", "Referencia", u.referencia || "Sin referencia"],
  ];
  return (
    <aside className={s.detail} aria-label={`Detalle de ${nombreUbicacion(u)}`}>
      <header className={s.detailHeading}>
        <span className={s.locationIcon} data-type={tipo}>
          <Icon name={iconoDeUbicacion(u)} />
        </span>
        <div>
          <h2>{nombreUbicacion(u)}</h2>
          <EtiquetaUbicacion ubicacion={u} />
        </div>
        <button
          className={s.favorite}
          data-active={u.favorita}
          aria-pressed={Boolean(u.favorita)}
          aria-label={
            u.favorita
              ? "Quitar ubicación seleccionada de frecuentes"
              : "Marcar ubicación seleccionada como frecuente"
          }
          disabled={ocupado}
          onClick={favorita}
        >
          <Icon name="star" />
        </button>
        <button
          className={s.close}
          aria-label="Cerrar detalle"
          onClick={cerrar}
        >
          <Icon name="close" />
        </button>
      </header>
      <p className={s.detailAddress}>{direccionCompleta(u)}</p>
      <div className={s.map}>
        <Mapa ubicacion={u} />
        <button
          className={s.expand}
          ref={abrirRef}
          onClick={() => setAmpliado(true)}
        >
          Abrir en mapa
          <Icon name="expand" />
        </button>
      </div>
      <div className={s.quickActions}>
        <Link href={enlaceBuscarUbicacion(u, "origen")}>
          <span>
            <Icon name="send" />
          </span>
          Usar en traslado
        </Link>
        <button onClick={copiar}>
          <span>
            <Icon name="copy" />
          </span>
          Copiar dirección
        </button>
        <button onClick={editar} disabled={ocupado}>
          <span>
            <Icon name="edit" />
          </span>
          Editar
        </button>
        <button className={s.delete} onClick={eliminar} disabled={ocupado}>
          <span>
            <Icon name="trash" />
          </span>
          Eliminar
        </button>
      </div>
      <dl className={s.metadata}>
        {campos.map(([icon, label, value]) => (
          <div key={label}>
            <dt>
              <Icon name={icon} />
              {label}
            </dt>
            <dd title={value}>{value}</dd>
          </div>
        ))}
      </dl>
      <button
        className={`${s.outline} ${s.editInformation}`}
        disabled={ocupado}
        onClick={editar}
      >
        <Icon name="edit" />
        Editar información
      </button>
      {ampliado && <MapaAmpliado ubicacion={u} cerrar={cerrarMapa} />}
    </aside>
  );
}
