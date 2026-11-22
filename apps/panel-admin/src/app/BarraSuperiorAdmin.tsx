"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@ruum/ui/base";
import { Bell, ChevronRight, Settings } from "lucide-react";
import { SelectorTemaAdmin } from "./TemaAdmin";

const TITULOS_RUTA: Array<[string, string]> = [
  ["/alertas-sla", "Alertas y SLA"],
  ["/aprobaciones", "Aprobaciones duales"],
  ["/auditoria", "Auditoría"],
  ["/capacidades", "Capacidades"],
  ["/configuracion", "Configuración"],
  ["/conductores", "Conductores"],
  ["/disputas", "Disputas"],
  ["/documentos", "Validación documental"],
  ["/empresas", "Empresas"],
  ["/incidencias", "Incidencias"],
  ["/mapa", "Mapa operativo"],
  ["/masivos", "Traslados masivos"],
  ["/metricas-registro", "Métricas de conductores"],
  ["/operaciones", "Operaciones"],
  ["/pagos", "Pagos"],
  ["/reclamos-seguro", "Seguros"],
  ["/reportes", "Reportes operativos"],
  ["/sin-permiso", "Sin permiso"],
  ["/tarifas", "Tarifas"],
  ["/torre", "Torre de Control"],
  ["/usuarios", "Usuarios"],
  ["/vehiculos", "Vehículos"],
  ["/viajes", "Traslados"]
];

function tituloDeRuta(pathname: string) {
  if (pathname === "/") return "Dashboard operativo";
  return TITULOS_RUTA.find(([ruta]) => pathname === ruta || pathname.startsWith(`${ruta}/`))?.[1] ?? "Panel administrativo";
}

export function BarraSuperiorAdmin() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <header
      className="sticky top-0 z-30 hidden h-16 items-center justify-between gap-6 border-b border-ui-line bg-ui-card/90 px-8 backdrop-blur lg:flex"
      aria-label="Contexto de la Torre de Control"
    >
      <nav aria-label="Ubicación" className="min-w-0">
        <ol className="flex min-w-0 items-center gap-2 text-sm">
          <li><Link href="/" className="rounded-md font-medium text-ui-fg-muted hover:text-ui-fg">Torre de Control</Link></li>
          <li aria-hidden="true" className="text-ui-fg-muted"><ChevronRight className="size-4" /></li>
          <li className="truncate font-semibold text-ui-fg" aria-current="page">{tituloDeRuta(pathname)}</li>
        </ol>
      </nav>
      <nav className="flex shrink-0 items-center gap-1" aria-label="Acciones globales">
        <Button asChild variant="ghost" size="sm">
          <Link href="/alertas-sla?filtro=vencidas"><Bell />Alertas</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/configuracion"><Settings />Configuración</Link>
        </Button>
        <SelectorTemaAdmin />
      </nav>
    </header>
  );
}
