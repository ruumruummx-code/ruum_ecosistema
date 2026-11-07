import type { ConductorScreenVariant } from "./ConductorScreen";

/** Una variante explícita para cada ruta; los alias conservan su destino. */
export const CONDUCTOR_ROUTE_CONTRACT: Record<string, { variant: ConductorScreenVariant; navigation: boolean }> = {
  "/": { variant: "access", navigation: false },
  "/onboarding": { variant: "access", navigation: false },
  "/login": { variant: "access", navigation: false },
  "/registro": { variant: "form", navigation: false },
  "/recuperar-password": { variant: "access", navigation: false },
  "/nueva-password": { variant: "access", navigation: false },
  "/actualizacion-requerida": { variant: "state", navigation: false },
  "/403": { variant: "state", navigation: true },
  "/configuracion": { variant: "detail", navigation: true },
  "/documentos": { variant: "detail", navigation: true },
  "/panel": { variant: "overview", navigation: true },
  "/viajes": { variant: "list", navigation: true },
  "/viajes/[id]": { variant: "operation", navigation: true },
  "/viajes/[id]/detalles": { variant: "detail", navigation: true },
  "/viajes/[id]/evidencia": { variant: "form", navigation: true },
  "/viajes/[id]/soporte": { variant: "detail", navigation: true },
  "/cuenta": { variant: "overview", navigation: true },
  "/cuenta/perfil": { variant: "form", navigation: true },
  "/cuenta/documentos": { variant: "detail", navigation: true },
  "/cuenta/certificacion": { variant: "detail", navigation: true },
  "/cuenta/datos-bancarios": { variant: "form", navigation: true },
  "/cuenta/preferencias": { variant: "detail", navigation: true },
  "/cuenta/seguridad": { variant: "detail", navigation: true },
  "/cuenta/soporte": { variant: "detail", navigation: true },
  "/cuenta/legal": { variant: "detail", navigation: true },
  "/ganancias": { variant: "overview", navigation: true },
  "/ganancias/historial": { variant: "list", navigation: true },
  "/notificaciones": { variant: "list", navigation: true },
  "/legal/terminos": { variant: "detail", navigation: true },
  "/legal/privacidad": { variant: "detail", navigation: true },
};
export function conductorRouteContract(pathname: string) {
  const key = pathname.replace(/^\/viajes\/[^/]+(?=\/|$)/, "/viajes/[id]");
  return Object.entries(CONDUCTOR_ROUTE_CONTRACT).find(([route]) => route === key)?.[1] ?? { variant: "state" as const, navigation: !pathname.startsWith("/auth/") };
}
