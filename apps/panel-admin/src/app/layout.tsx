import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { TextInputUppercaseBridge } from "@ruum/ui";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { BarraLateral } from "./BarraLateral";
import { NavegacionAdminMovil } from "./NavegacionAdminMovil";
import { BarraSuperiorAdmin } from "./BarraSuperiorAdmin";
import Script from "next/script";
import { headers } from "next/headers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap"
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-loaded",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Ruum Ruum — Torre de Control",
  description: "Seguimiento operativo, evidencia documentada y trazabilidad de cada traslado."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // headers() fuerza renderizado por petición: el nonce no puede prerenderizarse.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" nonce={nonce} />
      </head>
      <body className={`${inter.variable} ${plexMono.variable} min-h-dvh bg-ui-bg font-body text-ui-fg antialiased`}>
        <a href="#contenido-principal" className="ruum-skip-link">Saltar al contenido principal</a>
        <TextInputUppercaseBridge />
        <NavegacionAdminMovil />
        {/* Marco de escritorio: barra lateral fija + barra superior + contenido (diseño 1280–1920 px). */}
        <div className="flex min-h-dvh flex-col lg:flex-row">
          <BarraLateral />
          <div id="contenido-principal" tabIndex={-1} className="min-w-0 flex-1 outline-none">
            <BarraSuperiorAdmin />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
