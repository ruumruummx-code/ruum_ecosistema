"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import { Button, PassportCard } from "@ruum/ui";
import { AdminDialog } from "../admin-components";
import type { Json } from "@ruum/shared/types";
import {
  actualizarPoliticaTarifariaNormativa,
  solicitarAprobacionAdmin,
  simularTarifaNormativa,
  type ActualizacionPoliticaTarifariaNormativa,
  type ConfiguracionTarifas
} from "@ruum/api/services";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import {
  type SeccionParametrosTarifa,
  type TarifaConfigRow,
  type BorradorTarifas,
  type CategoriaTarifa,
  type TarifaVehiculoRow,
  ETIQUETA_CATEGORIA,
  ETIQUETA_RANGO,
  formatoFecha,
  crearBorradorTarifas,
  numeroBorrador,
  configuracionDesdeBorrador,
  cambiosVersion
} from "./TarifasTipos";
import { CampoBorrador, DatoSim } from "./TarifasComponentes";

export function TarifasBaseFijas({
  datos,
  borrador,
  onCambiar
}: {
  datos: ConfiguracionTarifas;
  borrador: BorradorTarifas;
  onCambiar: (id: string, campo: "base" | "porKm", valor: string) => void;
}) {
  const porCategoria = useMemo(() => {
    const grupos = new Map<CategoriaTarifa, TarifaVehiculoRow[]>();
    for (const fila of datos.vehiculo) {
      const lista = grupos.get(fila.categoria) ?? [];
      lista.push(fila);
      grupos.set(fila.categoria, lista);
    }
    return grupos;
  }, [datos.vehiculo]);

  return (
    <PassportCard acento>
      <h2 className="font-display text-xl font-semibold">Tarifas base fijas</h2>
      <p className="mt-1 font-body text-sm text-ui-fg-muted">Importes de partida y costo por kilómetro según categoría y rango.</p>
      <div className="mt-5 grid gap-x-6 gap-y-8 xl:grid-cols-2">
        {Array.from(porCategoria.entries()).map(([categoria, filas]) => (
          <section key={categoria}>
            <div className="flex items-center gap-2 border-b border-ui-brand/30 pb-2">
              <span className="size-2 rounded-full bg-ui-brand" aria-hidden="true" />
              <h3 className="font-display text-sm font-semibold text-ui-fg">{ETIQUETA_CATEGORIA[categoria] ?? categoria}</h3>
            </div>
            <div className="divide-y divide-ui-line">
              {filas.map((fila) => (
                <div key={fila.id} className="grid gap-3 py-4 lg:grid-cols-[minmax(150px,1fr)_minmax(120px,150px)_minmax(120px,150px)]">
                  <p className="self-center font-body text-sm font-medium leading-5 text-ui-fg-muted">{ETIQUETA_RANGO[fila.rango] ?? fila.rango}</p>
                  <CampoBorrador
                    etiqueta="Base"
                    valor={borrador.vehiculo[fila.id]?.base ?? ""}
                    sufijo="$"
                    onCambiar={(valor) => onCambiar(fila.id, "base", valor)}
                  />
                  <CampoBorrador
                    etiqueta="Kilómetro"
                    valor={borrador.vehiculo[fila.id]?.porKm ?? ""}
                    sufijo="$/km"
                    onCambiar={(valor) => onCambiar(fila.id, "porKm", valor)}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PassportCard>
  );
}

export function GrupoFactor({
  titulo,
  filas,
  onCambiar
}: {
  titulo: string;
  filas: Array<{ clave: string; etiqueta: string; valor: string; sufijo?: string }>;
  onCambiar: (clave: string, valor: string) => void;
}) {
  return (
    <PassportCard>
      <h2 className="font-display text-xl font-semibold">{titulo}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {filas.map((fila) => (
          <CampoBorrador
            key={fila.clave}
            etiqueta={fila.etiqueta}
            valor={fila.valor}
            sufijo={fila.sufijo}
            onCambiar={(valor) => onCambiar(fila.clave, valor)}
          />
        ))}
      </div>
    </PassportCard>
  );
}

export function ComparadorVersiones({ datos, borrador }: { datos: ConfiguracionTarifas; borrador: BorradorTarifas }) {
  const cambios = cambiosVersion(datos, borrador);
  function descargarResumen() {
    const resumen = {
      version_vigente: datos.config?.nombre_version ?? null,
      fecha_entrada_en_vigor: datos.config?.vigente_desde ?? null,
      entidades_afectadas: cambios.length,
      cambios
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(resumen, null, 2)], { type: "application/json" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `comparacion-tarifas-${datos.config?.nombre_version ?? "borrador"}.json`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PassportCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Comparador de versiones</h2>
          <p className="mt-1 font-body text-sm text-ui-fg-muted">Revisión previa: vigente contra propuesto, variación absoluta y variación porcentual.</p>
        </div>
        <Button variant="quiet" onClick={descargarResumen} disabled={cambios.length === 0}>Descargar resumen</Button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left font-body text-sm">
          <thead className="border-b border-ui-line text-xs uppercase tracking-wide text-ui-fg-muted">
            <tr>
              <th className="px-3 py-2">Entidad afectada</th>
              <th className="px-3 py-2">Vigente</th>
              <th className="px-3 py-2">Propuesto</th>
              <th className="px-3 py-2">Variación</th>
              <th className="px-3 py-2">Entrada en vigor</th>
            </tr>
          </thead>
          <tbody>
            {cambios.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-ui-fg-muted">Crea un borrador o modifica valores para comparar versiones.</td></tr>
            ) : cambios.map((cambio) => (
              <tr key={`${cambio.entidad}-${cambio.campo}`} className="border-b border-ui-line">
                <td className="px-3 py-3"><span className="font-semibold text-ui-fg">{cambio.entidad}</span><span className="block text-xs text-ui-fg-muted">{cambio.campo}</span></td>
                <td className="px-3 py-3 font-mono-ruum">{cambio.vigente.toLocaleString("es-MX")}</td>
                <td className="px-3 py-3 font-mono-ruum">{cambio.propuesto.toLocaleString("es-MX")}</td>
                <td className={`px-3 py-3 font-mono-ruum font-semibold ${cambio.delta >= 0 ? "text-ui-warning" : "text-ui-success"}`}>
                  {cambio.delta >= 0 ? "+" : ""}{cambio.delta.toLocaleString("es-MX")} · {cambio.porcentaje.toFixed(1)}%
                </td>
                <td className="px-3 py-3 text-ui-fg-muted">{formatoFecha(datos.config?.vigente_desde)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PassportCard>
  );
}

export function ImpactoTarifario({ datos, borrador }: { datos: ConfiguracionTarifas; borrador: BorradorTarifas }) {
  const propuesta = configuracionDesdeBorrador(datos, borrador);
  const escenarios = [
    { nombre: "Traslado individual", categoria: "ligero_a", gama: "entrada", condicion: "seminueva", horario: "diurno", dia: "entre_semana", distanciaKm: 18, tiempoHoras: 0.8 },
    { nombre: "Ruta específica", categoria: "mediano", gama: "media", condicion: "rescate_mecanico", horario: "nocturno", dia: "fin_semana", distanciaKm: 76, tiempoHoras: 2.2 },
    { nombre: "Empresa", categoria: "ligero_b", gama: "alta", condicion: "seminueva", horario: "diurno", dia: "entre_semana", distanciaKm: 42, tiempoHoras: 1.4 },
    { nombre: "Muestra histórica", categoria: "camion", gama: "media", condicion: "rescate_mecanico", horario: "diurno", dia: "entre_semana", distanciaKm: 120, tiempoHoras: 3.5 },
    { nombre: "Solicitudes pendientes", categoria: "ligero_a", gama: "entrada", condicion: "seminueva", horario: "nocturno", dia: "fin_semana", distanciaKm: 12, tiempoHoras: 0.6 }
  ] as const;
  const filas = escenarios.map((escenario) => {
    try {
      const vigente = simularTarifaNormativa(datos, escenario).tarifa;
      const propuesto = simularTarifaNormativa(propuesta, escenario).tarifa;
      return { ...escenario, vigente, propuesto, delta: propuesto - vigente };
    } catch {
      return { ...escenario, vigente: null, propuesto: null, delta: null };
    }
  });
  return (
    <PassportCard>
      <h2 className="font-display text-xl font-semibold">Simulación de impacto</h2>
      <p className="mt-1 font-body text-sm text-ui-fg-muted">Estimación sin modificar datos reales. Los traslados ya cotizados conservan su tarifa original.</p>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {filas.map((fila) => (
          <div key={fila.nombre} className="rounded-lg border border-ui-line bg-ui-muted px-4 py-3">
            <p className="font-body text-sm font-semibold text-ui-fg">{fila.nombre}</p>
            <p className="mt-1 font-body text-xs text-ui-fg-muted">{ETIQUETA_CATEGORIA[fila.categoria] ?? fila.categoria} · {fila.distanciaKm} km · {fila.tiempoHoras} h</p>
            {fila.vigente == null ? (
              <p className="mt-3 text-sm text-ui-warning">No hay datos suficientes para estimar este escenario.</p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <DatoSim etiqueta="Vigente" valor={`$${fila.vigente.toLocaleString("es-MX")}`} />
                <DatoSim etiqueta="Estimado" valor={`$${fila.propuesto!.toLocaleString("es-MX")}`} />
                <DatoSim etiqueta="Diferencia" valor={`${fila.delta! >= 0 ? "+" : ""}$${fila.delta!.toLocaleString("es-MX")}`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </PassportCard>
  );
}

export function ParametrosNormativos({
  seccion,
  datos,
  cliente,
  onGuardado,
  onConfigVista,
  onDirtyChange
}: {
  seccion: SeccionParametrosTarifa;
  datos: ConfiguracionTarifas;
  cliente: ReturnType<typeof crearClienteNavegador> | null;
  onGuardado: () => Promise<void>;
  onConfigVista: (config: TarifaConfigRow | null) => void;
  onDirtyChange: (hayCambios: boolean) => void;
}) {
  const requiereConfirmacion = datos.config?.estado === "vigente";
  const [borrador, setBorrador] = useState<BorradorTarifas>(() => crearBorradorTarifas(datos));
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [borradorCreadoEn] = useState(() => new Date().toISOString());
  const [guardando, startGuardado] = useTransition();

  function cambiarVehiculo(id: string, campo: "base" | "porKm", valor: string) {
    setBorrador((actual) => ({
      ...actual,
      vehiculo: { ...actual.vehiculo, [id]: { ...actual.vehiculo[id], [campo]: valor } }
    }));
  }

  function cambiarGrupo<K extends keyof Pick<BorradorTarifas, "gama" | "condicion" | "horario" | "dia" | "certificacion">>(
    grupo: K,
    clave: string,
    valor: string
  ) {
    setBorrador((actual) => ({ ...actual, [grupo]: { ...actual[grupo], [clave]: valor } }));
  }

  function cambiarConfig(campo: keyof BorradorTarifas["config"], valor: string) {
    setBorrador((actual) => ({ ...actual, config: { ...actual.config, [campo]: valor } }));
    if (!datos.config) return;
    const siguiente = {
      ...datos.config,
      tarifa_hora: campo === "tarifaHora" && Number.isFinite(Number(valor)) ? Number(valor) : Number(borrador.config.tarifaHora),
      tope_factor_variable: campo === "topeFactorVariable" && Number.isFinite(Number(valor)) ? Number(valor) : Number(borrador.config.topeFactorVariable)
    };
    if (Number.isFinite(siguiente.tarifa_hora) && Number.isFinite(siguiente.tope_factor_variable)) {
      onConfigVista(siguiente);
    }
  }

  const hayCambios = useMemo(() => {
    const original = crearBorradorTarifas(datos);
    return JSON.stringify(original) !== JSON.stringify(borrador);
  }, [borrador, datos]);

  useEffect(() => {
    onDirtyChange(hayCambios);
    return () => onDirtyChange(false);
  }, [hayCambios, onDirtyChange]);

  function guardar() {
    if (!hayCambios) return;
    if (requiereConfirmacion) {
      setConfirmando(true);
      return;
    }
    guardarConfirmado();
  }

  function crearBorradorDesdeVigente() {
    setBorrador(crearBorradorTarifas(datos));
    setMensaje("Borrador creado desde la versión vigente. Edita valores, simula, compara y publica cuando esté revisado.");
  }

  function guardarConfirmado() {
    startGuardado(async () => {
      try {
        if (!cliente) throw new Error("Sin cliente Supabase.");
        if (!datos.config) throw new Error("No existe la configuración general de tarifas.");
        setMensaje(null);

        const payload: ActualizacionPoliticaTarifariaNormativa = {};

        for (const fila of datos.vehiculo) {
          const valor = borrador.vehiculo[fila.id];
          const base = numeroBorrador(valor.base, `Base ${ETIQUETA_CATEGORIA[fila.categoria] ?? fila.categoria}`);
          const porKm = numeroBorrador(valor.porKm, `$ / km ${ETIQUETA_CATEGORIA[fila.categoria] ?? fila.categoria}`);
          if (base !== fila.base || porKm !== fila.por_km) {
            payload.vehiculo = [...(payload.vehiculo ?? []), { id: fila.id, base, por_km: porKm }];
          }
        }

        for (const fila of datos.gama) {
          const factor = numeroBorrador(borrador.gama[fila.gama], `Gama ${fila.gama}`);
          if (factor !== fila.factor) payload.gama = [...(payload.gama ?? []), { gama: fila.gama, factor }];
        }

        for (const fila of datos.condicion) {
          const factor = numeroBorrador(borrador.condicion[fila.condicion], `Condición ${fila.condicion}`);
          if (factor !== fila.factor) payload.condicion = [...(payload.condicion ?? []), { condicion: fila.condicion, factor }];
        }

        for (const fila of datos.horario) {
          const factor = numeroBorrador(borrador.horario[fila.horario], `Horario ${fila.horario}`);
          if (factor !== fila.factor) payload.horario = [...(payload.horario ?? []), { horario: fila.horario, factor }];
        }

        for (const fila of datos.dia) {
          const factor = numeroBorrador(borrador.dia[fila.dia], `Día ${fila.dia}`);
          if (factor !== fila.factor) payload.dia = [...(payload.dia ?? []), { dia: fila.dia, factor }];
        }

        for (const fila of datos.certificacionPago) {
          const porcentaje = numeroBorrador(borrador.certificacion[fila.certificacion], `Pago ${fila.certificacion}`);
          if (porcentaje !== fila.porcentaje) {
            payload.certificacion_pago = [...(payload.certificacion_pago ?? []), { certificacion: fila.certificacion, porcentaje }];
          }
        }

        const tarifaHora = numeroBorrador(borrador.config.tarifaHora, "Tarifa por hora");
        const topeFactorVariable = numeroBorrador(borrador.config.topeFactorVariable, "Tope del factor variable");
        if (tarifaHora !== datos.config.tarifa_hora || topeFactorVariable !== datos.config.tope_factor_variable) {
          payload.config = { tarifa_hora: tarifaHora, tope_factor_variable: topeFactorVariable };
        }

        const aprobacionId = await solicitarAprobacionAdmin(cliente, {
          tipo: "tarifas",
          capacidad: "tarifas:editar",
          recurso: "tarifas",
          accion: "actualizar_politica_tarifaria",
          payload: payload as Json
        });

        const actualizadas = await actualizarPoliticaTarifariaNormativa(cliente, aprobacionId, payload);
        await onGuardado();
        onDirtyChange(false);
        setMensaje(`Solicitud de aprobación #${aprobacionId.slice(0, 8).toUpperCase()} ejecutada. Cambios aplicados: ${actualizadas}.`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "No se pudo publicar la versión.";
        if (msg.includes("APROBACION_NO_APROBADA") || msg.includes("PERMISO_INSUFICIENTE")) {
          setMensaje("Solicitud de aprobación creada. Un administrador con permisos de aprobación debe aprobarla antes de ejecutar los cambios. Dirígete a /aprobaciones.");
        } else {
          setMensaje(msg);
        }
      }
    });
  }

  return (
    <div className="grid gap-6">
      <div className="sticky top-3 z-20 -mx-2 rounded-lg border border-ui-focus/20 bg-ui-card px-4 py-3 shadow-ui-md backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-body text-sm font-semibold text-ui-fg">Borrador tarifario</p>
            <p className="mt-1 font-body text-xs text-ui-fg-muted">
              Autor: admin actual · Creado: {formatoFecha(borradorCreadoEn)} · Estado: {hayCambios ? "En edición" : "Sin cambios"}
            </p>
            {mensaje && <p className="mt-1 font-body text-xs text-ui-fg-muted">{mensaje}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="quiet" onClick={crearBorradorDesdeVigente}>Crear borrador</Button>
            <Button onClick={guardar} disabled={!hayCambios || guardando}>
              {datos.config?.nombre_version ? `Publicar versión ${datos.config.nombre_version}` : "Publicar versión"}
            </Button>
          </div>
        </div>
      </div>

      {seccion === "base" && <TarifasBaseFijas datos={datos} borrador={borrador} onCambiar={cambiarVehiculo} />}

      {seccion === "factores" && (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <GrupoFactor titulo="Factor de gama" filas={datos.gama.map((f) => ({ clave: f.gama, etiqueta: f.gama, valor: borrador.gama[f.gama] ?? "" }))} onCambiar={(clave, valor) => cambiarGrupo("gama", clave, valor)} />
            <GrupoFactor titulo="Factor de condición" filas={datos.condicion.map((f) => ({ clave: f.condicion, etiqueta: f.condicion.replaceAll("_", " "), valor: borrador.condicion[f.condicion] ?? "" }))} onCambiar={(clave, valor) => cambiarGrupo("condicion", clave, valor)} />
            <GrupoFactor titulo="Factor horario" filas={datos.horario.map((f) => ({ clave: f.horario, etiqueta: f.horario, valor: borrador.horario[f.horario] ?? "" }))} onCambiar={(clave, valor) => cambiarGrupo("horario", clave, valor)} />
            <GrupoFactor titulo="Factor día" filas={datos.dia.map((f) => ({ clave: f.dia, etiqueta: f.dia.replaceAll("_", " "), valor: borrador.dia[f.dia] ?? "" }))} onCambiar={(clave, valor) => cambiarGrupo("dia", clave, valor)} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <PassportCard>
              <h2 className="font-display text-xl font-semibold">Configuración general</h2>
              {datos.config && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <CampoBorrador etiqueta="Tarifa por hora" valor={borrador.config.tarifaHora} sufijo="$/hora" onCambiar={(valor) => cambiarConfig("tarifaHora", valor)} />
                  <CampoBorrador etiqueta="Tope del factor variable" valor={borrador.config.topeFactorVariable} sufijo="x" onCambiar={(valor) => cambiarConfig("topeFactorVariable", valor)} />
                </div>
              )}
            </PassportCard>
            <GrupoFactor
              titulo="Pago al conductor por certificación"
              filas={datos.certificacionPago.map((f) => ({ clave: f.certificacion, etiqueta: f.certificacion.replaceAll("_", " "), valor: borrador.certificacion[f.certificacion] ?? "", sufijo: "%" }))}
              onCambiar={(clave, valor) => cambiarGrupo("certificacion", clave, valor)}
            />
          </div>
        </>
      )}

      <ComparadorVersiones datos={datos} borrador={borrador} />
      <ImpactoTarifario datos={datos} borrador={borrador} />
      <AdminDialog
        open={confirmando}
        title={`Publicar versión ${datos.config?.nombre_version ?? "tarifaria"}`}
        description="Esta acción reemplaza la versión vigente para cálculos futuros. Los traslados con precio ya cotizado conservarán su tarifa original."
        onOpenChange={(abierto) => { if (!abierto) setConfirmando(false); }}
        footer={<><button type="button" onClick={() => setConfirmando(false)} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted">Cancelar</button><button type="button" onClick={() => { setConfirmando(false); guardarConfirmado(); }} className="rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-brand-hover">Publicar versión</button></>}
      ><span /></AdminDialog>
    </div>
  );
}
