"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoMarca } from "@ruum/ui";
import { Badge, Button, Skeleton, cn } from "@ruum/ui/base";
import {
  AlertTriangle, Building2, Car, ChartColumn, ClipboardCheck, Clock, CreditCard, DollarSign, FileText, Image as ImageIcon,
  Layers, LayoutGrid, LogIn, LogOut, MapPin, PanelLeftClose, PanelLeftOpen, Scale, Settings, ShieldCheck, Truck, User, UserCheck
} from "lucide-react";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../lib/supabase-browser";
import {
  listarAlertasSLA,
  listarConductoresAdmin,
  listarDisputasAdmin,
  listarIncidenciasAdmin,
  obtenerAdminActual,
  listarPagosAdmin,
  listarSolicitudesConductorAdmin,
  listarUsuariosAdmin
} from "@ruum/api/services";
import { normalizarRolAdmin, puedeVerRuta, type RolAdminOperativo } from "../lib/roles-admin";

export type IconoNombre = "dashboard"|"Traslados"|"masivos"|"mapa"|"sla"|"conductor"|"usuario"|"vehiculo"|"empresa"|"incidencia"|"disputa"|"reclamo"|"pagos"|"tarifas"|"documentos"|"reportes"|"configuracion"|"evidencia"|"auditoria";
export type ClaveContadorMenu = "alertasCriticas" | "conductoresRevision" | "incidenciasAbiertas" | "disputasPendientes" | "pagosPendientes" | "documentosPorVencer";
export type ContadorMenu = { valor: number; critico?: boolean; etiqueta: string };
export type ContadoresMenu = Partial<Record<ClaveContadorMenu, ContadorMenu>>;
export type SeccionNavegacionAdmin = { href: string; etiqueta: string; icono: IconoNombre; contador?: ClaveContadorMenu };
export type GrupoNavegacionAdmin = { titulo: string; secciones: SeccionNavegacionAdmin[] };

const ICONOS: Record<IconoNombre, typeof LayoutGrid> = {
  dashboard: LayoutGrid, Traslados: Truck, masivos: Layers, mapa: MapPin, sla: Clock,
  conductor: UserCheck, usuario: User, vehiculo: Car, empresa: Building2,
  incidencia: AlertTriangle, disputa: Scale, reclamo: ShieldCheck,
  pagos: CreditCard, tarifas: DollarSign, documentos: FileText,
  reportes: ChartColumn, configuracion: Settings, evidencia: ImageIcon, auditoria: ClipboardCheck,
};

export function Icono({ nombre, className = "size-4" }: { nombre: IconoNombre; className?: string }) {
  const Componente = ICONOS[nombre];
  return <Componente className={className} aria-hidden="true" />;
}

export const GRUPOS_NAVEGACION: GrupoNavegacionAdmin[] = [
  {
    titulo: "Riesgos y cumplimiento",
    secciones: [
      { href: "/", etiqueta: "Dashboard", icono: "dashboard" },
      { href: "/alertas-sla?filtro=vencidas", etiqueta: "Alertas y SLA", icono: "sla", contador: "alertasCriticas"},
      { href: "/incidencias?filtro=abiertas", etiqueta: "Incidencias", icono: "incidencia", contador: "incidenciasAbiertas" },
      { href: "/documentos?filtro=por_vencer", etiqueta: "Validación documental", icono: "documentos", contador: "documentosPorVencer" },
    ],
  },
  {
      titulo: "Operación",
    secciones: [
      { href: "/viajes", etiqueta: "Traslados", icono: "Traslados"},
      { href: "/masivos", etiqueta: "Traslados masivos", icono: "masivos" },
      { href: "/mapa", etiqueta: "Mapa", icono: "mapa" },
    ],
  },
  {
      titulo: "Gestión de activos",
    secciones: [
      { href: "/conductores", etiqueta: "Conductores", icono: "conductor", contador: "conductoresRevision" },
      { href: "/usuarios", etiqueta: "Usuarios", icono: "usuario" },
      { href: "/vehiculos", etiqueta: "Vehículos", icono: "vehiculo" },
      { href: "/empresas", etiqueta: "Empresas", icono: "empresa" },
    ],
  },
  {
      titulo: "Finanzas y gobierno",
    secciones: [
      { href: "/pagos?filtro=pendientes", etiqueta: "Pagos", icono: "pagos", contador: "pagosPendientes" },
      { href: "/aprobaciones", etiqueta: "Aprobaciones duales", icono: "auditoria" },
      { href: "/disputas?filtro=pendientes", etiqueta: "Disputas", icono: "disputa", contador: "disputasPendientes" },
      { href: "/reclamos-seguro", etiqueta: "Seguros", icono: "reclamo" },
      { href: "/tarifas", etiqueta: "Tarifas", icono: "tarifas" },
    ],
  },
   {
    titulo: "Sistemas y analítica",
    secciones: [
      { href: "/reportes", etiqueta: "Reportes operativos", icono: "reportes" },
      { href: "/metricas-registro", etiqueta: "Métricas de conductores", icono: "reportes" },
      { href: "/auditoria", etiqueta: "Auditoría", icono: "auditoria" },
      { href: "/configuracion", etiqueta: "Configuración", icono: "configuracion" },
    ],
  },
];

export function rutaBase(href: string) {
  return href.split("?")[0] ?? href;
}

export function BadgeContador({ contador, colapsada, cargando }: { contador?: ContadorMenu; colapsada: boolean; cargando?: boolean }) {
  const posicion = colapsada ? "absolute right-0.5 top-0.5" : "ml-auto";
  if (cargando) return <Skeleton className={cn("size-3 rounded-full", posicion)} />;
  if (!contador || contador.valor <= 0) return null;
  const texto = contador.critico ? `Crítico: ${contador.valor}` : String(contador.valor);
  return (
    <Badge
      tone={contador.critico ? "danger" : "info"}
      className={cn("min-w-6 justify-center px-1.5 font-mono-ruum tabular-nums", colapsada && "px-1 py-0", posicion)}
      aria-label={`${contador.etiqueta}: ${texto}`}
      title={`${contador.etiqueta}: ${texto}`}
    >
      {contador.critico && <span aria-hidden="true">!</span>}
      {contador.valor}
    </Badge>
  );
}

export function useContadoresMenu(pathname: string) {
  const [contadores, setContadores] = useState<ContadoresMenu>({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    async function cargarContadores() {
      setCargando(true);
      if (!tieneSupabaseConfigurado()) {
        setContadores({});
        setCargando(false);
        return;
      }
      try {
        const cliente = crearClienteNavegador();
        const [alertas, solicitudes, incidencias, disputas, pagos, conductores, usuarios] = await Promise.all([
          listarAlertasSLA(cliente),
          listarSolicitudesConductorAdmin(cliente),
          listarIncidenciasAdmin(cliente),
          listarDisputasAdmin(cliente),
          listarPagosAdmin(cliente),
          listarConductoresAdmin(cliente),
          listarUsuariosAdmin(cliente)
        ]);
        const documentosPendientes = conductores.filter((conductor) => !conductor.documentos_vigentes).length
          + usuarios.filter((usuario) => usuario.estado_verificacion === "pendiente" || usuario.estado_verificacion === "en_revision").length;

        if (!cancelado) {
          setContadores({
            alertasCriticas: {
              valor: alertas.filter((alerta) => alerta.vencido).length,
              critico: true,
              etiqueta: "Alertas críticas vencidas"
            },
            conductoresRevision: {
              valor: solicitudes.filter((fila) => fila.solicitud.estado === "en_revision").length,
              etiqueta: "Conductores por revisar"
            },
            incidenciasAbiertas: {
              valor: incidencias.filter((incidencia) => !incidencia.resuelta).length,
              critico: incidencias.some((incidencia) => !incidencia.resuelta),
              etiqueta: "Incidencias abiertas"
            },
            disputasPendientes: {
              valor: disputas.filter((disputa) => disputa.estado !== "resuelta" && disputa.estado !== "resuelta_senior").length,
              etiqueta: "Disputas pendientes"
            },
            pagosPendientes: {
              valor: pagos.pagosUsuarios.filter((pago) => pago.estado === "pendiente").length
                + pagos.payoutsConductores.filter((payout) => payout.estado === "pendiente").length,
              etiqueta: "Pagos pendientes"
            },
            documentosPorVencer: {
              valor: documentosPendientes,
              etiqueta: "Documentos por vencer o actualizar"
            }
          });
          setCargando(false);
        }
      } catch {
        if (!cancelado) {
          setContadores({});
          setCargando(false);
        }
      }
    }
    void cargarContadores();
    return () => { cancelado = true; };
  }, [pathname]);

  return { contadores, cargando };
}

export function BarraLateral() {
  const pathname = usePathname();
  const router = useRouter();
  const [sesionReal, setSesionReal] = useState(false);
  const [rolAdmin, setRolAdmin] = useState<RolAdminOperativo>("operador");
  const [colapsada, setColapsada] = useState(false);
  const { contadores, cargando } = useContadoresMenu(pathname);

  useEffect(() => {
  const isColapsada = window.localStorage.getItem("ruum-admin-sidebar") === "colapsada";
  const timer = setTimeout(() => {
    setColapsada(isColapsada);
  }, 0);
  return () => clearTimeout(timer);
}, []);

  function alternarColapso() {
    setColapsada((actual) => {
      const siguiente = !actual;
      window.localStorage.setItem("ruum-admin-sidebar", siguiente ? "colapsada" : "expandida");
      return siguiente;
    });
  }

  useEffect(() => {
    async function revisar() {
      if (!tieneSupabaseConfigurado()) return;
      try {
        const cliente = crearClienteNavegador();
        const [usuario, admin] = await Promise.all([
          cliente.auth.getUser(),
          obtenerAdminActual(cliente)
        ]);
        const { data } = usuario;
        setSesionReal(Boolean(data.user));
        setRolAdmin(normalizarRolAdmin(admin?.rol_operativo));
      } catch { /* Sin sesión real */ }
    }
    revisar();
  }, [pathname]);

  async function cerrarSesion() {
    const cliente = crearClienteNavegador();
    await cliente.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (pathname === "/login") return null;

  const gruposVisibles = GRUPOS_NAVEGACION
    .map((grupo) => ({
      ...grupo,
      secciones: grupo.secciones.filter((seccion) => puedeVerRuta(rolAdmin, seccion.href))
    }))
    .filter((grupo) => grupo.secciones.length > 0);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-ui-line bg-ui-card transition-[width] duration-200 lg:flex",
        colapsada ? "w-18" : "w-64"
      )}
      aria-label="Navegación principal"
    >
      <div className={cn("flex h-16 shrink-0 items-center gap-2 border-b border-ui-line", colapsada ? "justify-center px-2" : "justify-between pl-5 pr-2")}>
        {!colapsada && (
          <Link href="/" className="flex min-w-0 flex-col rounded-md" aria-label="Ir al dashboard de la Torre de Control">
            <LogoMarca variante="horizontal" tamano={26} mostrarDescriptor={false} mostrarRespaldo={false} />
            <span className="mt-0.5 font-mono-ruum text-xs uppercase tracking-widest text-ui-fg-muted">Torre de Control</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={alternarColapso}
          aria-expanded={!colapsada}
          aria-label={colapsada ? "Expandir navegación" : "Colapsar navegación"}
          title={colapsada ? "Expandir navegación" : "Colapsar navegación"}
        >
          {colapsada ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Secciones del panel">
        {gruposVisibles.map((grupo) => (
          <section key={grupo.titulo} aria-label={grupo.titulo}>
            <p className={cn("mb-1 px-3 text-xs font-semibold text-ui-fg-muted", colapsada && "sr-only")}>
              {grupo.titulo}
            </p>
            <div className="space-y-0.5">
              {grupo.secciones.map((s) => {
                const base = rutaBase(s.href);
                const contador = s.contador ? contadores[s.contador] : undefined;
                const activo = pathname === base || (base !== "/" && pathname.startsWith(base));
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    title={s.etiqueta}
                    aria-label={s.etiqueta}
                    aria-current={activo ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring",
                      colapsada && "justify-center px-0",
                      activo
                        ? "bg-ui-brand-soft font-semibold text-ui-brand-soft-fg"
                        : "font-medium text-ui-fg-muted hover:bg-ui-muted hover:text-ui-fg"
                    )}
                  >
                    <Icono nombre={s.icono} className="size-4.5 shrink-0" />
                    <span className={cn("truncate", colapsada && "sr-only")}>{s.etiqueta}</span>
                    <BadgeContador contador={contador} colapsada={colapsada} cargando={cargando} />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="shrink-0 border-t border-ui-line p-3">
        {sesionReal ? (
          <Button variant="ghost" onClick={cerrarSesion} title="Cerrar sesión" aria-label={colapsada ? "Cerrar sesión" : undefined} className={cn("w-full", colapsada ? "px-0" : "justify-start")}>
            <LogOut />
            <span className={cn(colapsada && "sr-only")}>Cerrar sesión</span>
          </Button>
        ) : (
          tieneSupabaseConfigurado() && (
            <Button asChild variant="ghost" className={cn("w-full", colapsada ? "px-0" : "justify-start")}>
              <Link href="/login" title="Iniciar sesión">
                <LogIn />
                <span className={cn(colapsada && "sr-only")}>Iniciar sesión</span>
              </Link>
            </Button>
          )
        )}
      </div>
    </aside>
  );
}
