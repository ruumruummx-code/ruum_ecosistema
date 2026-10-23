import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import { TextInputUppercaseBridge } from "@ruum/ui";
import { TemaProvider } from "./TemaProvider";
import { LiveRegionProvider } from "../components/LiveRegionProvider";
import { PuertaConsentimiento } from "../components/PuertaConsentimiento";
import { OperationalAccessibilityBridge } from "./OperationalAccessibilityBridge";
import { AppStateProvider } from "../state/AppStateProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body-loaded",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Ruum Ruum",
  description:
    "Seguridad, evidencia y trazabilidad en cada traslado vehicular by MoviliaX.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Ruum Ruum" },
  formatDetection: { telephone: true, date: false, address: false, email: false }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08182E" },
    { media: "(prefers-color-scheme: light)", color: "#F6F8FB" }
  ]
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="es" dir="ltr" suppressHydrationWarning>
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" nonce={nonce} />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} min-h-dvh`}
      >
        <a href="#contenido-principal" className="ruum-skip-link" aria-label="Saltar al contenido principal">
          Saltar al contenido principal
        </a>
        <LiveRegionProvider>
          <OperationalAccessibilityBridge />
          <TextInputUppercaseBridge />
          <TemaProvider>
            <AppStateProvider>
              <PuertaConsentimiento />
              <div id="contenido-principal" tabIndex={-1} className="outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--user-color-action)]">
                {children}
              </div>
            </AppStateProvider>
          </TemaProvider>
        </LiveRegionProvider>
      </body>
    </html>
  );
}
