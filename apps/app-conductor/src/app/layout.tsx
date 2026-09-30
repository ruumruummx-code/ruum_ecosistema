import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { TextInputUppercaseBridge } from "@ruum/ui";
import "./globals.css";
import { NavegacionConductor } from "./NavegacionConductor";
import { ViajeActivoProvider } from "./ViajeActivoContext";
import { ModoCalleActivador } from "./ModoCalleActivador";
import { LiveRegionProvider } from "../components/LiveRegionProvider";
import { ErrorBoundaryConductor } from "../components/ErrorBoundaryConductor";
import { VersionGate } from "./VersionGate";
import { OperationalAccessibilityBridge } from "./OperationalAccessibilityBridge";
import { SincronizadorEvidenciaOffline } from "./SincronizadorEvidenciaOffline";
import { EstadoSincronizacionGlobal } from "./EstadoSincronizacionGlobal";
import { EstadoTrackingGlobal } from "./EstadoTrackingGlobal";
import { PushNotificationsBootstrap } from "./PushNotificationsBootstrap";
import { OfflineShell } from "./OfflineShell";
import { PWABootstrap } from "./PWABootstrap";

export const metadata: Metadata = {
  title: "Ruum Conductor",
  description: "Conductores certificados, registro operativo del vehículo y trazabilidad en cada viaje.",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Ruum Conductor" },
  formatDetection: { telephone: true, date: false, address: false, email: false }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08182E" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" }
  ]
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? "";
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <meta property="csp-nonce" content={nonce} />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme-init.js" nonce={nonce || undefined} suppressHydrationWarning />
      </head>
      <body className="conductor-v2-shell min-h-screen">
        <a href="#contenido-principal" className="ruum-skip-link" aria-label="Saltar al contenido principal">Saltar al contenido principal</a>
        <LiveRegionProvider>
          <ErrorBoundaryConductor scope="global">
            <ViajeActivoProvider>
              <SincronizadorEvidenciaOffline />
              <NavegacionConductor />
              <ModoCalleActivador />
              <EstadoSincronizacionGlobal />
              <EstadoTrackingGlobal />
              <PushNotificationsBootstrap />
              <VersionGate />
              <OperationalAccessibilityBridge />
              <TextInputUppercaseBridge />
              <OfflineShell />
              <PWABootstrap />
              <main id="contenido-principal" className="conductor-page conductor-v2" role="main">
                {children}
              </main>
            </ViajeActivoProvider>
          </ErrorBoundaryConductor>
        </LiveRegionProvider>
      </body>
    </html>
  );
}
