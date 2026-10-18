"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Aviso } from "@ruum/ui";
import { guardarPreferenciasConductor, obtenerConfiguracionConductor } from "@ruum/api/services";
import { traducirErrorOperativo } from "@ruum/shared/utils";
import type { Database } from "@ruum/shared/types";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { CuentaHeader } from "../CuentaHeader";
import { cargarConductorCuenta, type ConductorCuenta } from "../cuenta-utils";
import { MobileRow } from "@ruum/ui";

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
      { clave: "notificaciones_push", titulo: "Push en este dispositivo", subtitulo: "Alertas visuales y sonoras en tiempo real", icono: "📲" },
      { clave: "modo_no_molestar", titulo: "Horario silencioso (22:00 - 07:00)", subtitulo: "Silencia avisos fuera de servicio o turno", icono: "🌙" },
      { clave: "notificar_traslados_asignados", titulo: "Traslados asignados", subtitulo: "Confirmación inmediata de servicios asignados", icono: "🚘" },
      { clave: "notificar_cambios_operativos", titulo: "Cambios operativos", subtitulo: "Modificaciones en rutas, puntos o tiempos", icono: "⚡" },
      { clave: "notificar_documentos", titulo: "Alertas de documentos", subtitulo: "Avisos sobre licencias o expedientes por vencer", icono: "📄" }
    ]
  },
  {
    titulo: "Comerciales y Opcionales",
    opciones: [
      { clave: "notificar_oportunidades", titulo: "Nuevas oportunidades", subtitulo: "Avisos de servicios disponibles cercanos", icono: "🎯" },
      { clave: "notificar_ganancias", titulo: "Ganancias y pagos", subtitulo: "Resumen de corte semanal y depósitos", icono: "💵" },
      { clave: "notificar_promociones", titulo: "Promociones y beneficios", subtitulo: "Bonos operativos y campañas exclusivas", icono: "🎁" }
    ]
  }
];

const OPCIONES_VIAJES: OpcionConfig[] = [
  { clave: "traslados_locales", titulo: "Traslados locales", subtitulo: "Dentro de la zona metropolitana primaria", icono: "🏙️" },
  { clave: "traslados_foraneos", titulo: "Traslados foráneos", subtitulo: "Interurbanos y trayectos de larga distancia", icono: "🛣️" },
  { clave: "traslados_nocturnos", titulo: "Servicios nocturnos (22:00 a 06:00)", subtitulo: "Requiere activación voluntaria", icono: "🌌" },
  { clave: "traslados_empresariales", titulo: "Traslados corporativos", subtitulo: "Servicios ejecutivos para cuentas de empresa", icono: "🏢" },
  { clave: "traslados_personales", titulo: "Traslados personales", subtitulo: "Reservados directamente por particulares", icono: "👤" }
];

const TABS: { clave: "alertas" | "viajes" | "tema"; etiqueta: string }[] = [
  { clave: "alertas", etiqueta: "Alertas" },
  { clave: "viajes", etiqueta: "Viajes" },
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
  const [temaSeleccionado, setTemaSeleccionado] = useState<"auto" | "light" | "dark">("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ruum-theme") as "light" | "dark" | null;
      if (stored) {
        setTemaSeleccionado(stored);
      } else {
        setTemaSeleccionado("light");
        localStorage.setItem("ruum-theme", "light");
        document.documentElement.setAttribute("data-theme", "light");
      }
    }
  }, []);

  const cambiarTema = (nuevoTema: "auto" | "light" | "dark") => {
    setTemaSeleccionado(nuevoTema);
    if (typeof window !== "undefined") {
      const valor = nuevoTema === "auto" ? "light" : nuevoTema;
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
    <div className="mx-auto w-full max-w-md px-4 pb-[calc(88px+env(safe-area-inset-bottom))]">
      {/* Header mínimo */}
      <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-2 border-b border-border/30">
        <h1 className="font-display text-xl font-extrabold tracking-tight text-text-primary">Preferencias</h1>
      </header>

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
      <div className="mx-4 mt-4 flex items-center justify-center">
        <div className="inline-flex items-center rounded-xl border border-border/60 bg-surface/40 p-1">
          {TABS.map((t) => (
            <button
              key={t.clave}
              type="button"
              onClick={() => setTabActiva(t.clave)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                tabActiva === t.clave
                  ? "bg-signal text-white shadow-sm"
                  : "text-text-tertiary hover:bg-surface/30"
              }`}
            >
              {t.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="mx-4 mt-8 text-center font-body text-sm text-text-secondary">
          Cargando tus preferencias…
        </div>
      ) : errorCarga ? null : (
        <div className="mx-4 mt-4 space-y-3">
          {tabActiva === "alertas" && (
            <>
              {SECCIONES_ALERTAS.map((seccion) => (
                <div key={seccion.titulo} className="space-y-1.5">
                  <h3 className="px-1 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                    {seccion.titulo}
                  </h3>
                  <div className="grid gap-1">
                    {seccion.opciones.map((opcion) => {
                      const estaActivo = Boolean(prefs[opcion.clave]);
                      const desactivable = opcion.clave === "notificaciones_push";
                      return (
                        <MobileRow
                          key={opcion.clave}
                          titulo={opcion.titulo}
                          subtitulo={estaActivo ? opcion.subtitulo : "Desactivado"}
                          icono={opcion.icono}
                          tonoIcono={estaActivo ? "azul" : "neutro"}
                          derecha={
                            <button
                              type="button"
                              role="switch"
                              aria-checked={estaActivo}
                              aria-label={opcion.titulo}
                              disabled={!conductor || guardandoAuto || desactivable}
                              onClick={() => !desactivable && toggleTono(opcion.clave)}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 p-0.5 transition-colors duration-200 ${estaActivo
                                ? "bg-signal border-signal"
                                : "bg-surface-elevated border-border/80"}`}
                            >
                              <span
                                className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${estaActivo ? "translate-x-6 bg-slate-950" : "translate-x-0 bg-text-secondary"}`}
                              />
                            </button>
                          }
                          onClick={() => !desactivable && toggleTono(opcion.clave)}
                          disabled={!conductor || guardandoAuto || desactivable}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Protección operativa — texto reducido al pie de la pestaña Alertas */}
              <div className="mt-4 px-3 py-2 rounded-xl border border-route-action/40 bg-route-action/5">
                <p className="font-body text-[10px] leading-4 text-text-tertiary">
                  <span className="block font-display text-[10px] font-bold text-route-action mb-0.5">
                    Protección operativa
                  </span>
                  Los avisos críticos de seguridad y rastreo GPS durante un viaje activo se mantienen siempre habilitados por política de protección al conductor.
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
                    <MobileRow
                      key={opcion.clave}
                      titulo={opcion.titulo}
                      subtitulo={estaActivo ? opcion.subtitulo : "Desactivado"}
                      icono={opcion.icono}
                      tonoIcono={estaActivo ? "azul" : "neutro"}
                      derecha={
                        <button
                          type="button"
                          role="switch"
                          aria-checked={estaActivo}
                          aria-label={opcion.titulo}
                          disabled={!conductor || guardandoAuto}
                          onClick={() => toggleTono(opcion.clave)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 p-0.5 transition-colors duration-200 ${estaActivo
                            ? "bg-signal border-signal"
                            : "bg-surface-elevated border-border/80"}`}
                        >
                          <span
                            className={`pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${estaActivo ? "translate-x-6 bg-slate-950" : "translate-x-0 bg-text-secondary"}`}
                          />
                        </button>
                      }
                      onClick={() => toggleTono(opcion.clave)}
                      disabled={!conductor || guardandoAuto}
                    />
                  );
                })}
              </div>

              {preferenciasActivas.length > 0 && (
                <div className="mt-3 px-1">
                  <p className="font-body text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    Modalidades activadas ({preferenciasActivas.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {preferenciasActivas.map((pref) => (
                      <span key={pref} className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-surface-elevated px-2.5 py-1 font-body text-[10px] font-bold text-text-primary">
                        ✓ {pref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tabActiva === "tema" && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { valor: "auto", etiqueta: "💻 Automático", desc: "Sigue el sistema" },
                { valor: "light", etiqueta: "☀️ Día", desc: "Alto contraste" },
                { valor: "dark", etiqueta: "🌙 Noche", desc: "Ruta oscura" }
              ].map((opc) => {
                const seleccionado = temaSeleccionado === opc.valor;
                return (
                  <button
                    key={opc.valor}
                    type="button"
                    onClick={() => cambiarTema(opc.valor as "auto" | "light" | "dark")}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-route-action focus-visible:ring-offset-2 ${
                      seleccionado
                        ? "border-route-action bg-route-action/10 text-text-primary font-extrabold shadow-xs"
                        : "border-border/60 bg-surface-elevated/40 text-text-secondary hover:border-border"
                    }`}
                  >
                    <span className="font-display text-[10px] font-bold">{opc.etiqueta}</span>
                    <span className="font-body text-[9px] text-text-tertiary mt-0.5">{opc.desc}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {guardandoAuto && (
        <div className="mx-4 mt-2 flex items-center justify-center gap-1.5">
          <span className="text-[10px] font-bold text-route-action animate-pulse">Sincronizando…</span>
        </div>
      )}
    </div>
  );
}
