"use client";

import { useEffect, useRef, useState } from "react";
import type { Map, Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  sugerirDireccionesAutocomplete,
  resolverDireccionEnMapa,
  type SugerenciaDireccion,
} from "@/lib/mapbox";
import { obtenerUbicacionActual } from "@/lib/ubicacion";
import { AutocompletarDireccion } from "./AutocompletarDireccion";
import styles from "./cotizador.module.css";

export type DireccionElegida = SugerenciaDireccion & { referencias: string };

export function DireccionMapa({
  inicial,
  prefijo,
  onConfirmar,
}: {
  inicial: DireccionElegida;
  prefijo: "origen" | "destino";
  onConfirmar: (direccion: DireccionElegida) => void;
}) {
  const [direccion, setDireccion] = useState(inicial);
  const [busqueda, setBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState<SugerenciaDireccion[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [resolviendo, setResolviendo] = useState(false);
  const [manual, setManual] = useState(false);
  const [aviso, setAviso] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const marker = useRef<Marker | null>(null);
  const reverse = useRef<AbortController | null>(null);
  const inicialRef = useRef(inicial);

  useEffect(() => {
    const controller = new AbortController();
    if (busqueda.trim().length < 3) {
      setSugerencias([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    const timer = setTimeout(() => {
      void sugerirDireccionesAutocomplete(busqueda, controller.signal)
        .then((res) => {
          if (!controller.signal.aborted) setSugerencias(res);
        })
        .finally(() => {
          if (!controller.signal.aborted) setBuscando(false);
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [busqueda]);

  useEffect(() => {
    let disposed = false;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token?.startsWith("pk.")) {
      setAviso(
        "El mapa no está disponible. Puedes capturar la dirección manualmente.",
      );
      return;
    }
    void import("mapbox-gl")
      .then(({ default: gl }) => {
        if (disposed || !container.current) return;
        const initial = inicialRef.current;
        const center: [number, number] = [
          initial.lng ?? -99.1332,
          initial.lat ?? 19.4326,
        ];
        const instance = new gl.Map({
          container: container.current,
          accessToken: token,
          style: "mapbox://styles/mapbox/streets-v12",
          center,
          zoom: initial.lat !== undefined ? 16 : 11,
        });
        map.current = instance;
        marker.current = new gl.Marker({
          draggable: true,
          color: prefijo === "origen" ? "#08705f" : "#c13846",
        })
          .setLngLat(center)
          .addTo(instance);
        const elegir = async (lat: number, lng: number) => {
          reverse.current?.abort();
          const controller = new AbortController();
          reverse.current = controller;
          setResolviendo(true);
          setAviso("");
          setDireccion({
            textoCompleto: "",
            direccion: "",
            referencias: "",
            lat,
            lng,
          });
          marker.current?.setLngLat([lng, lat]);
          try {
            const result = await resolverDireccionEnMapa(
              lat,
              lng,
              controller.signal,
            );
            if (controller.signal.aborted || disposed) return;
            if (result) setDireccion({ ...result, referencias: "" });
            else
              setAviso(
                "No encontramos una dirección en ese punto. Busca otra ubicación o completa los datos manualmente.",
              );
          } catch {
            if (!controller.signal.aborted && !disposed)
              setAviso(
                "No pudimos consultar ese punto. Reintenta o captura la dirección manualmente.",
              );
          } finally {
            if (!controller.signal.aborted && !disposed) setResolviendo(false);
          }
        };
        instance.on("click", (e) => {
          void elegir(e.lngLat.lat, e.lngLat.lng);
        });
        marker.current.on("dragend", () => {
          const point = marker.current?.getLngLat();
          if (point) void elegir(point.lat, point.lng);
        });
        instance.on("error", () => {
          if (!disposed)
            setAviso(
              "El mapa no pudo cargar. La búsqueda y la captura manual siguen disponibles.",
            );
        });
        instance.addControl(
          new gl.NavigationControl({ showCompass: false }),
          "bottom-right",
        );
      })
      .catch(() => {
        if (!disposed)
          setAviso(
            "No pudimos abrir el mapa. Usa la búsqueda o la captura manual.",
          );
      });
    return () => {
      disposed = true;
      reverse.current?.abort();
      marker.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, [prefijo]);

  useEffect(() => {
    if (direccion.lat === undefined || direccion.lng === undefined) return;
    marker.current?.setLngLat([direccion.lng, direccion.lat]);
    map.current?.flyTo({
      center: [direccion.lng, direccion.lat],
      zoom: 16,
      essential: false,
    });
  }, [direccion.lat, direccion.lng]);

  const elegir = (suggestion: SugerenciaDireccion) => {
    reverse.current?.abort();
    setResolviendo(false);
    setDireccion({ ...suggestion, referencias: "" });
    setBusqueda(suggestion.textoCompleto);
    setSugerencias([]);
  };
  const completa = Boolean(
    direccion.direccion.trim() &&
      direccion.numero?.trim() &&
      /^\d{5}$/.test(direccion.codigoPostal ?? "") &&
      direccion.ciudad?.trim() &&
      direccion.estado?.trim() &&
      direccion.colonia?.trim(),
  );
  async function miUbicacion() {
    reverse.current?.abort();
    const controller = new AbortController();
    reverse.current = controller;
    setResolviendo(true);
    try {
      const point =
        (await obtenerUbicacionActual()) ??
        (await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Ubicación no disponible"));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            reject,
            { timeout: 10000 },
          );
        }));
      if (controller.signal.aborted) return;
      const result = await resolverDireccionEnMapa(
        point.lat,
        point.lng,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      if (result) elegir(result);
      else
        setAviso(
          "No encontramos tu dirección. Puedes buscarla o capturarla manualmente.",
        );
    } catch {
      if (!controller.signal.aborted)
        setAviso(
          "No pudimos obtener tu ubicación. Busca la dirección manualmente.",
        );
    } finally {
      if (!controller.signal.aborted) setResolviendo(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative z-10 shrink-0 bg-[var(--user-color-surface)] p-3">
        <AutocompletarDireccion
          id={`${prefijo}Busqueda`}
          etiqueta={`Buscar dirección de ${prefijo}`}
          placeholder="Calle, número y ciudad"
          valor={busqueda}
          sugerencias={sugerencias}
          buscando={buscando}
          onChange={setBusqueda}
          onSeleccionar={elegir}
        />
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={container}
          className="h-full min-h-40 w-full bg-[var(--user-color-surface-soft)]"
          aria-label={`Mapa de ${prefijo}`}
        />
        {manual && (
          <div className="absolute inset-0 overflow-y-auto bg-[var(--user-color-surface)] p-4">
            <div className={styles.vehicle}>
              {(
                [
                  ["direccion", "Calle"],
                  ["numero", "Número exterior / interior"],
                  ["codigoPostal", "Código postal"],
                  ["colonia", "Colonia"],
                  ["ciudad", "Ciudad"],
                  ["estado", "Estado"],
                  ["referencias", "Referencias"],
                ] as const
              ).map(([campo, label]) => (
                <div key={campo} className={styles.field}>
                  <label
                    htmlFor={`${prefijo}${campo}`}
                    className={styles.label}
                  >
                    {label}
                  </label>
                  <input
                    id={`${prefijo}${campo}`}
                    value={direccion[campo] ?? ""}
                    inputMode={campo === "codigoPostal" ? "numeric" : undefined}
                    maxLength={campo === "codigoPostal" ? 5 : 300}
                    onChange={(e) => {
                      const valor = e.target.value;
                      setDireccion((prev) => ({
                        ...prev,
                        [campo]: valor,
                        ...(campo !== "referencias"
                          ? { lat: undefined, lng: undefined }
                          : {}),
                      }));
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="shrink-0 bg-[var(--user-color-surface)] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
        {aviso && (
          <p role="status" className="text-xs text-[var(--user-color-muted)]">
            {aviso}
          </p>
        )}
        <p className="line-clamp-2 text-sm font-semibold" aria-live="polite">
          {resolviendo
            ? "Buscando dirección del punto…"
            : [
                direccion.direccion,
                direccion.numero,
                direccion.colonia,
                direccion.ciudad,
              ]
                .filter(Boolean)
                .join(", ") || "Busca una dirección o toca el mapa"}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            className="min-h-11 text-xs font-semibold"
            onClick={() => {
              setManual((v) => !v);
              map.current?.resize();
            }}
          >
            {manual ? "Volver al mapa" : "Completar dirección"}
          </button>
          <button
            type="button"
            className="min-h-11 text-xs font-semibold"
            onClick={() => void miUbicacion()}
          >
            Mi ubicación
          </button>
        </div>
        <button
          type="button"
          disabled={!completa || resolviendo}
          onClick={() =>
            onConfirmar({
              ...direccion,
              textoCompleto: [
                direccion.direccion,
                direccion.numero,
                direccion.colonia,
                direccion.ciudad,
              ]
                .filter(Boolean)
                .join(", "),
            })
          }
          className={styles.primary}
        >
          {completa
            ? "Confirmar ubicación"
            : "Completa la dirección para confirmar"}
        </button>
      </div>
    </div>
  );
}
