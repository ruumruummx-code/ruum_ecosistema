"use client";
import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  geocodificarDireccion,
  tieneMapboxConfigurado,
} from "../../lib/mapbox";
import { coordenadasValidas } from "./libreta-ubicaciones";
import {
  direccionCompleta,
  type UbicacionUsuario,
} from "./ubicaciones-usuario";
import { IconoUbicacion as Icon } from "./UbicacionVisual";
import s from "./ubicaciones-desktop.module.css";
export function MapaUbicacion({
  ubicacion,
  ampliado = false,
}: {
  ubicacion: UbicacionUsuario;
  ampliado?: boolean;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [coordenadas, setCoordenadas] = useState<{
    lat: number;
    lng: number;
  } | null>(() =>
    coordenadasValidas(ubicacion.lat, ubicacion.lng)
      ? { lat: ubicacion.lat!, lng: ubicacion.lng! }
      : null,
  );
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">(
    "cargando",
  );
  const [revision, setRevision] = useState(0);
  const direccion = direccionCompleta(ubicacion);
  useEffect(() => {
    if (coordenadasValidas(ubicacion.lat, ubicacion.lng)) return;
    if (!tieneMapboxConfigurado()) {
      setEstado("error");
      return;
    }
    const abort = new AbortController();
    let vigente = true;
    void geocodificarDireccion(direccion, abort.signal)
      .then((punto) => {
        if (!vigente) return;
        if (punto) setCoordenadas(punto);
        else setEstado("error");
      })
      .catch(() => {
        if (vigente) setEstado("error");
      });
    return () => {
      vigente = false;
      abort.abort();
    };
  }, [ubicacion.lat, ubicacion.lng, direccion, revision]);
  useEffect(() => {
    if (!coordenadas || !contenedor.current || !tieneMapboxConfigurado()) {
      if (!tieneMapboxConfigurado()) setEstado("error");
      return;
    }
    let vigente = true;
    let mapa: import("mapbox-gl").Map | undefined;
    let marcador: import("mapbox-gl").Marker | undefined;
    let observer: ResizeObserver | undefined;
    setEstado("cargando");
    void import("mapbox-gl")
      .then(({ default: mb }) => {
        if (!vigente || !contenedor.current) return;
        mapa = new mb.Map({
          container: contenedor.current,
          accessToken: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [coordenadas.lng, coordenadas.lat],
          zoom: 15,
          attributionControl: true,
        });
        mapa.scrollZoom.disable();
        const pin = document.createElement("span");
        pin.className = s.mapPin;
        const svg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        );
        svg.setAttribute("viewBox", "0 0 32 42");
        svg.setAttribute("width", "32");
        svg.setAttribute("height", "42");
        const path = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        path.setAttribute(
          "d",
          "M16 1A15 15 0 0 0 1 16c0 10 15 25 15 25s15-15 15-25A15 15 0 0 0 16 1Z",
        );
        path.setAttribute("fill", "#0063ff");
        path.setAttribute("stroke", "white");
        path.setAttribute("stroke-width", "2");
        svg.appendChild(path);
        const dot = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle",
        );
        dot.setAttribute("cx", "16");
        dot.setAttribute("cy", "16");
        dot.setAttribute("r", "5");
        dot.setAttribute("fill", "white");
        svg.appendChild(dot);
        pin.appendChild(svg);
        marcador = new mb.Marker({ element: pin, anchor: "bottom" })
          .setLngLat([coordenadas.lng, coordenadas.lat])
          .addTo(mapa);
        if (ampliado)
          mapa.addControl(
            new mb.NavigationControl({ showCompass: false }),
            "top-right",
          );
        mapa.on("load", () => {
          if (vigente) setEstado("listo");
        });
        mapa.on("error", () => {
          if (vigente) setEstado("error");
        });
        observer = new ResizeObserver(() => mapa?.resize());
        observer.observe(contenedor.current);
      })
      .catch(() => {
        if (vigente) setEstado("error");
      });
    return () => {
      vigente = false;
      observer?.disconnect();
      marcador?.remove();
      mapa?.remove();
    };
  }, [coordenadas, ampliado, revision]);
  return (
    <div className={s.mapFrame} aria-label={`Mapa de ${direccion}`}>
      <div ref={contenedor} className={s.mapCanvas} />
      {estado !== "listo" && (
        <div className={s.mapMessage} role="status">
          <Icon name="pin" />
          <span>
            {estado === "cargando"
              ? "Cargando mapa…"
              : "No pudimos cargar esta ubicación en el mapa."}
          </span>
          {estado === "error" && (
            <button
              onClick={() => {
                setEstado("cargando");
                setRevision((v) => v + 1);
              }}
            >
              Reintentar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
