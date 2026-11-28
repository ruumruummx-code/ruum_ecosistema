"use client";
import { Button as BaseButton } from "@ruum/ui/base";
import { ConductorScreen, ConductorPageHeader } from "../../components/ConductorScreen";

import { useEffect, useMemo, useRef, useState } from "react";
import { Aviso } from "@ruum/ui";
import { guardarPreferenciasConductor, obtenerConfiguracionConductor } from "@ruum/api/services";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import type { Database } from "@ruum/shared/types";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { cargarConductorCuenta, type ConductorCuenta } from "../cuenta-utils";
import { Card, Tabs, TabsList, TabsTrigger, TabsContent } from "@ruum/ui/base";
import type { ReactNode } from "react";

import { ConductorIcon, type ConductorIconName } from "@/components/icons";
function PreferenceRow({ titulo, subtitulo, icono, derecha, disabled }: {
  titulo: ReactNode; subtitulo?: ReactNode; icono?: ReactNode; derecha?: ReactNode; disabled?: boolean;
}) {
  return <Card className="flex items-center gap-3 p-3" aria-disabled={disabled || undefined}>
    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ui-brand-soft text-ui-brand-soft-fg">{typeof icono === "string" ? <ConductorIcon name={icono as ConductorIconName} /> : icono}</span>
    <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-ui-fg">{titulo}</span><span className="mt-1 block text-xs text-ui-fg-muted">{subtitulo}</span></span>
    <span className="shrink-0">{derecha}</span>
  </Card>;
}

type Preferencias = Database["public"]["Tables"]["preferencias_conductor"]["Row"];

const PREFS_DEFAULT = {
  notificaciones_push: true,
  modo_no_molestar: false,
  alertas_viaje: true,
  alertas_pago: true,
  alertas_documentos: true,
  alertas_admin: false,
  notificar_oportunidades: true,
  notificar_traslados_asignados: true,
  notificar_cambios_operativos: true,
  notificar_documentos: true,
  notificar_ganancias: true,
  notificar_promociones: false,
  traslados_locales: true,
  traslados_foraneos: true,
  traslados_nocturnos: false,
  traslados_empresariales: true,
  traslados_personales: true
};

type OpcionConfig = {
  clave: keyof typeof PREFS_DEFAULT;
  titulo: string;
  subtitulo: string;
  icono: string;
};

const SECCIONES_ALERTAS: { titulo: string; opciones: OpcionConfig[] }[] = [
  {
    titulo: "Operativas y de Servicio",
    opciones: [
      { clave: "notificaciones_push", titulo: "Push en este dispositivo", subtitulo: "Alertas visuales y sonoras en tiempo real", icono: "phone" },
      { clave: "modo_no_molestar", titulo: "Horario silencioso (22:00 - 07:00)", subtitulo: "Silencia avisos fuera de servicio o turno", icono: "clock" },
      { clave: "notificar_traslados_asignados", titulo: "Traslados asignados", subtitulo: "Confirmación inmediata de servicios asignados", icono: "car" },
      { clave: "notificar_cambios_operativos", titulo: "Cambios operativos", subtitulo: "Modificaciones en rutas, puntos o tiempos", icono: "warning" },
      { clave: "notificar_documentos", titulo: "Alertas de documentos", subtitulo: "Avisos sobre licencias o expedientes por vencer", icono: "document" }
    ]
  },
  {
    titulo: "Comerciales y Opcionales",
    opciones: [
      { clave: "notificar_oportunidades", titulo: "Nuevas oportunidades", subtitulo: "Avisos de servicios disponibles cercanos", icono: "truck" },
      { clave: "notificar_ganancias", titulo: "Ganancias y pagos", subtitulo: "Resumen de corte semanal y depósitos", icono: "bank" },
      { clave: "notificar_promociones", titulo: "Promociones y beneficios", subtitulo: "Bonos operativos y campañas exclusivas", icono: "card" }
    ]
  }
];

const OPCIONES_VIAJES: OpcionConfig[] = [
  { clave: "traslados_locales", titulo: "Traslados locales", subtitulo: "Dentro de la zona metropolitana primaria", icono: "pin" },
  { clave: "traslados_foraneos", titulo: "Traslados foráneos", subtitulo: "Interurbanos y trayectos de larga distancia", icono: "truck" },
  { clave: "traslados_nocturnos", titulo: "Servicios nocturnos (22:00 a 06:00)", subtitulo: "Requiere activación voluntaria", icono: "clock" },
  { clave: "traslados_empresariales", titulo: "Traslados corporativos", subtitulo: "Servicios ejecutivos para cuentas de empresa", icono: "home" },
  { clave: "traslados_personales", titulo: "Traslados personales", subtitulo: "Reservados directamente por particulares", icono: "user" }
];

const TABS: { clave: "alertas" | "viajes" | "tema"; etiqueta: string }[] = [
  { clave: "alertas", etiqueta: "Alertas" },
  { clave: "viajes", etiqueta: "Traslados" },
  { clave: "tema", etiqueta: "Tema" }
];

export default function PaginaPreferenciasCuenta() {
  const [conductor, setConductor] = useState<ConductorCuenta | null>(null);
  const [prefs, setPrefs] = useState(PREFS_DEFAULT);
  const [notificacion, setNotificacion] = useState<{ tipo: "success" | "error"; mensaje: string } | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardandoAuto, setGuardandoAuto] = useState(false);
  const [tabActiva, setTabActiva] = useState<"alertas" | "viajes" | "tema">("alertas");
  const [temaSeleccionado, setTemaSeleccionado] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ruum-tema") || localStorage.getItem("ruum-theme");
      if (stored === "light" || stored === "dark") {
        setTemaSeleccionado(stored);
      } else {
        setTemaSeleccionado("light");
        localStorage.setItem("ruum-theme", "light");
        document.documentElement.setAttribute("data-theme", "light");
      }
    }
  }, []);

  const cambiarTema = (nuevoTema: "light" | "dark") => {
    setTemaSeleccionado(nuevoTema);
    if (typeof window !== "undefined") {
      const valor = nuevoTema;
      localStorage.setItem("ruum-tema", valor);
      localStorage.setItem("ruum-theme", valor);
      document.documentElement.setAttribute("data-theme", valor);
      window.dispatchEvent(new Event("ruum:cambio-tema"));
    }
  };

  useEffect(() => {
    async function cargar() {
      try {
        const actual = await cargarConductorCuenta();
        setConductor(actual);
        if (actual) {
          const cliente = crearClienteNavegador();
          const datos = await obtenerConfiguracionConductor(cliente, actual.id);
          const prefsDb = datos.preferencias as Preferencias | null;
          const { conductor_id: _, actualizado_en: __, ...prefsLimpias } = prefsDb ?? {};
          setPrefs({ ...PREFS_DEFAULT, ...prefsLimpias });
        }
        setErrorCarga(null);
      } catch {
        setErrorCarga("No se pudieron cargar las preferencias. Inténtalo de nuevo.");
      } finally {
        setCargando(false);
      }
    }
    void cargar();
  }, []);

  useEffect(() => {
    if (!notificacion) return;
    const timer = window.setTimeout(() => setNotificacion(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notificacion]);

  const cambiarPreferencia = (clave: keyof typeof PREFS_DEFAULT, valor: boolean) => {
    const estadoSiguiente = { ...prefs, [clave]: valor };
    setPrefs(estadoSiguiente);

    if (!conductor) return;
    setGuardandoAuto(true);
    autoSaveRef.current.latestPrefs = estadoSiguiente;

    if (autoSaveRef.current.timeoutId) clearTimeout(autoSaveRef.current.timeoutId);
    autoSaveRef.current.timeoutId = setTimeout(() => {
      const prefsAAhorrar = autoSaveRef.current.latestPrefs;
      autoSaveRef.current.latestPrefs = null;
      if (prefsAAhorrar) {
        persistirPreferencias(prefsAAhorrar);
      }
    }, 500);
  };

  const autoSaveRef = useRef<{ timeoutId: NodeJS.Timeout | null; latestPrefs: typeof PREFS_DEFAULT | null }>({ timeoutId: null, latestPrefs: null });

  async function persistirPreferencias(nuevasPrefs: typeof PREFS_DEFAULT) {
    if (!conductor) return;
    try {
      const cliente = crearClienteNavegador();
      await guardarPreferenciasConductor(cliente, conductor.id, nuevasPrefs);
      setNotificacion({ tipo: "success", mensaje: "Preferencias actualizadas" });
    } catch (error) {
      setNotificacion({
        tipo: "error",
        mensaje: traducirErrorOperativo(error, "No se pudieron guardar las preferencias.")
      });
    } finally {
      setGuardandoAuto(false);
    }
  }

  const toggleTono = (clave: keyof typeof PREFS_DEFAULT) => {
    cambiarPreferencia(clave, !prefs[clave]);
  };

  const preferenciasActivas = useMemo(
    () => [
      prefs.traslados_locales && "Locales",
      prefs.traslados_foraneos && "Foráneos",
      prefs.traslados_nocturnos && "Nocturnos autorizados",
      prefs.traslados_empresariales && "Empresariales",
      prefs.traslados_personales && "Personales"
    ].filter(Boolean) as string[],
    [prefs]
  );

  return (
    <ConductorScreen variant="detail" label="Preferencias del conductor" header={<ConductorPageHeader title="Preferencias" />}>
      {notificacion && (
        <div className="mx-4 mt-3">
          <Aviso tono={notificacion.tipo === "success" ? "success" : "danger"}>{notificacion.mensaje}</Aviso>
        </div>
      )}

      {errorCarga && (
        <div className="mx-4 mt-3">
          <Aviso tono="danger">{errorCarga}</Aviso>
        </div>
      )}

      {/* Tabs / SegmentedControl */}
      <Tabs value={tabActiva} onValueChange={id => setTabActiva(id as typeof tabActiva)}>
        <TabsList aria-label="Preferencias del conductor" className="h-auto min-h-14">
          {TABS.map(tab => <TabsTrigger key={tab.clave} value={tab.clave} className="min-h-12">{tab.etiqueta}</TabsTrigger>)}
        </TabsList>
        <TabsContent value={tabActiva}>{cargando ? (
        <div className="mx-4 mt-8 text-center font-body text-sm text-ui-fg-muted">
          Cargando tus preferencias…
        </div>
      ) : errorCarga ? null : (
        <div className="mx-4 mt-4 space-y-3">
          {tabActiva === "alertas" && (
            <>
              {SECCIONES_ALERTAS.map((seccion) => (
                <div key={seccion.titulo} className="space-y-1.5">
                  <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-ui-fg-muted">
                    {seccion.titulo}
                  </h3>
                  <div className="grid gap-1">
                    {seccion.opciones.map((opcion) => {
                      const estaActivo = Boolean(prefs[opcion.clave]);
                      const desactivable = opcion.clave === "notificaciones_push";
                      return (
                        <PreferenceRow
                          key={opcion.clave}
                          titulo={opcion.titulo}
                          subtitulo={desactivable ? "Esta opción no se puede modificar desde esta pantalla." : !conductor ? "No hay un perfil de conductor disponible para guardar cambios." : guardandoAuto ? "Guardando preferencias. Espera a que termine." : estaActivo ? opcion.subtitulo : "Desactivado"}
                          icono={opcion.icono}
                          derecha={
                            <BaseButton variant="ghost"
                              type="button"
                              role="switch"
                              aria-checked={estaActivo}
                              aria-label={opcion.titulo}
                              disabled={!conductor || guardandoAuto || desactivable}
                              onClick={() => !desactivable && toggleTono(opcion.clave)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 p-0.5 transition-colors duration-200 ${estaActivo
                                ? "bg-ui-brand border-ui-brand"
                                : "bg-ui-muted border-ui-line/80"}`}
                            >
                              <span
                                className={`pointer-events-none inline-block size-4 transform rounded-full bg-ui-card shadow-sm ring-0 transition duration-200 ${estaActivo ? "translate-x-6 bg-ui-muted" : "translate-x-0 bg-ui-fg-muted"}`}
                              />
                            </BaseButton>
                          }
                          disabled={!conductor || guardandoAuto || desactivable}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Protección operativa — texto reducido al pie de la pestaña Alertas */}
              <div className="mt-4 px-3 py-2 rounded-xl border border-ui-brand/40 bg-ui-brand/5">
                <p className="font-body text-xs leading-4 text-ui-fg-muted">
                  <span className="block font-display text-xs font-bold text-ui-brand mb-0.5">
                    Protección operativa
                  </span>
                  Los avisos críticos de seguridad y rastreo GPS durante un traslado activo se mantienen siempre habilitados por política de protección al conductor.
                </p>
              </div>
            </>
          )}

          {tabActiva === "viajes" && (
            <>
              <div className="grid gap-1">
                {OPCIONES_VIAJES.map((opcion) => {
                  const estaActivo = Boolean(prefs[opcion.clave]);
                  return (
                    <PreferenceRow
                      key={opcion.clave}
                      titulo={opcion.titulo}
                      subtitulo={!conductor ? "No hay un perfil de conductor disponible para guardar cambios." : guardandoAuto ? "Guardando preferencias. Espera a que termine." : estaActivo ? opcion.subtitulo : "Desactivado"}
                      icono={opcion.icono}
                      derecha={
                        <BaseButton variant="ghost"
                          type="button"
                          role="switch"
                          aria-checked={estaActivo}
                          aria-label={opcion.titulo}
                          disabled={!conductor || guardandoAuto}
                          onClick={() => toggleTono(opcion.clave)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 p-0.5 transition-colors duration-200 ${estaActivo
                            ? "bg-ui-brand border-ui-brand"
                            : "bg-ui-muted border-ui-line/80"}`}
                        >
                          <span
                            className={`pointer-events-none inline-block size-4 transform rounded-full bg-ui-card shadow-sm ring-0 transition duration-200 ${estaActivo ? "translate-x-6 bg-ui-muted" : "translate-x-0 bg-ui-fg-muted"}`}
                          />
                        </BaseButton>
                      }
                      disabled={!conductor || guardandoAuto}
                    />
                  );
                })}
              </div>

              {preferenciasActivas.length > 0 && (
                <div className="mt-3 px-1">
                  <p className="font-body text-xs font-bold uppercase tracking-wider text-ui-fg-muted">
                    Modalidades activadas ({preferenciasActivas.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {preferenciasActivas.map((pref) => (
                      <span key={pref} className="inline-flex items-center gap-1 rounded-full border border-ui-line/60 bg-ui-muted px-2.5 py-1 font-body text-xs font-bold text-ui-fg">
                        ✓ {pref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tabActiva === "tema" && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { valor: "light", etiqueta: "Día", desc: "Fondo claro" },
                { valor: "dark", etiqueta: "Noche", desc: "Fondo oscuro" }
              ].map((opc) => {
                const seleccionado = temaSeleccionado === opc.valor;
                return (
                  <BaseButton variant="ghost"
                    key={opc.valor}
                    type="button"
                    aria-pressed={seleccionado}
                    onClick={() => cambiarTema(opc.valor as "light" | "dark")}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-ui-brand focus-visible:ring-offset-2 ${
                      seleccionado
                        ? "border-ui-brand bg-ui-brand/10 text-ui-fg font-extrabold shadow-xs"
                        : "border-ui-line/60 bg-ui-muted/40 text-ui-fg-muted hover:border-ui-line"
                    }`}
                  >
                    <span className="font-display text-sm font-bold">{opc.etiqueta}</span>
                    <span className="font-body text-sm text-ui-fg-muted mt-0.5">{opc.desc}</span>
                  </BaseButton>
                );
              })}
            </div>
          )}
        </div>
      )}</TabsContent></Tabs>



      {guardandoAuto && (
        <div className="mx-4 mt-2 flex items-center justify-center gap-1.5">
          <span className="text-xs font-bold text-ui-brand animate-pulse">Sincronizando…</span>
        </div>
      )}
    </ConductorScreen>
  );
}
