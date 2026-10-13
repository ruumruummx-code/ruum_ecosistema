import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InicioUsuario } from "../InicioUsuario";
import { NavegacionUsuario } from "../NavegacionUsuario";
import { MisTrasladosCliente } from "../mis-viajes/MisViajesCliente";
import type { Database } from "@ruum/shared/types";

/**
 * M11: página de previsualización de diseño con datos DEMO hardcodeados.
 * Solo existe para desarrollo: en producción responde 404 y en cualquier
 * entorno es noindex (antes era accesible sin login e indexable).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Pasaporte = Database["public"]["Views"]["pasaporte_digital"]["Row"];

const DEMO_PASAPORTE = {
  traslado_id: "demo-traslado",
  vehiculo_marca: "General Motors",
  vehiculo_modelo: "Beat 2026",
  vehiculo_anio: 2026,
  vehiculo_tipo: "sedan",
  vehiculo_placas: "436PM",
  estado: "pendiente_de_conductor",
  conductor_nombre: null,
  precio_final: 0,
  precio_cotizado: 0,
  creado_en: "2025-05-20T16:36:00.000Z",
  origen_ciudad: "Benito Juárez",
  origen_direccion: "Insurgentes, 2326, Del Valle Centro, 03100, Ciudad de México",
  destino_ciudad: "Culiacán",
  destino_direccion: "Calle Real, 23, Bugambilias, 80145, Sinaloa",
} as unknown as Pasaporte;

const DEMO_TRASLADO = {
  id: "demo-traslado",
  origen_ciudad: "Benito Juárez",
  origen_direccion: "Insurgentes, 2326, Del Valle Centro, 03100, Ciudad de México",
  destino_ciudad: "Culiacán",
  destino_direccion: "Calle Real, 23, Bugambilias, 80145, Sinaloa",
  fecha_hora_programada: "2025-05-20T16:36:00.000Z",
};

import Link from "next/link";
import { GaleriaComponentesMoviles } from "./GaleriaComponentesMoviles";

export default async function UiV2Preview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { screen = "componentes" } = await searchParams;

  return (
    <>
      {/* Selector superior de vistas para diseñadores y desarrolladores */}
      <nav
        aria-label="Vistas de previsualización"
        className="sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-[#e2e8f0] bg-white/95 px-4 py-2 backdrop-blur-md dark:border-[#1a3a5c] dark:bg-[#0a2342]/95"
      >
        <Link
          href="/ui-v2-preview?screen=componentes"
          className={[
            "rounded-lg px-3 py-1 text-xs font-bold transition",
            screen === "componentes"
              ? "bg-[#0a2342] text-white dark:bg-[#4d94ff] dark:text-[#061529]"
              : "text-[#4e5f80] hover:bg-[#f2f6fc] dark:text-[#a8b5cc] dark:hover:bg-[#0f2d52]",
          ].join(" ")}
        >
          Componentes Móviles
        </Link>
        <Link
          href="/ui-v2-preview?screen=inicio"
          className={[
            "rounded-lg px-3 py-1 text-xs font-bold transition",
            screen === "inicio"
              ? "bg-[#0a2342] text-white dark:bg-[#4d94ff] dark:text-[#061529]"
              : "text-[#4e5f80] hover:bg-[#f2f6fc] dark:text-[#a8b5cc] dark:hover:bg-[#0f2d52]",
          ].join(" ")}
        >
          Inicio V2
        </Link>
        <Link
          href="/ui-v2-preview?screen=mis-traslados"
          className={[
            "rounded-lg px-3 py-1 text-xs font-bold transition",
            screen === "mis-traslados"
              ? "bg-[#0a2342] text-white dark:bg-[#4d94ff] dark:text-[#061529]"
              : "text-[#4e5f80] hover:bg-[#f2f6fc] dark:text-[#a8b5cc] dark:hover:bg-[#0f2d52]",
          ].join(" ")}
        >
          Mis Traslados
        </Link>
      </nav>

      {screen === "componentes" ? (
        <GaleriaComponentesMoviles />
      ) : (
        <>
          <NavegacionUsuario variante="claro" />
          <main className="user-v2-scope user-v2-page">
            <div className="user-v2-content">
              {screen === "mis-traslados" ? (
                <MisTrasladosCliente
                  pestanaInicial="programados"
                  Traslados={[{ pasaporte: DEMO_PASAPORTE, traslado: DEMO_TRASLADO }]}
                />
              ) : (
                <InicioUsuario usuario={null} traslados={[]} />
              )}
            </div>
          </main>
        </>
      )}
    </>
  );
}

