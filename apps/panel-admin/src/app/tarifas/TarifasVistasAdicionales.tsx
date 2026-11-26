"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import { Aviso, Button, PassportCard } from "@ruum/ui";
import { AdminDialog } from "../admin-components";
import {
  actualizarConfigTarifas,
  simularTarifaNormativa,
  type ConfiguracionTarifas
} from "@ruum/api/services";
import { crearClienteNavegador } from "../../lib/supabase-browser";
import {
  type CategoriaTarifa,
  type GamaTarifa,
  type CondicionTarifa,
  type HorarioTarifa,
  type DiaTarifa,
  ETIQUETA_CATEGORIA,
  ETIQUETA_RANGO,
  ETIQUETA_ESTADO,
  formatoFecha,
  fechaParaInput,
  fechaInputAIso,
  claseEstado
} from "./TarifasTipos";
import { SelectSim, DatoSim } from "./TarifasComponentes";

export function PoliticaVigente({
  datos,
  cliente,
  onGuardado,
  onDirtyChange
}: {
  datos: ConfiguracionTarifas;
  cliente: ReturnType<typeof crearClienteNavegador> | null;
  onGuardado: () => Promise<void>;
  onDirtyChange: (hayCambios: boolean) => void;
}) {
  const config = datos.config;
  const [nombre, setNombre] = useState(config?.nombre_version ?? "");
  const [estado, setEstado] = useState(config?.estado ?? "borrador");
  const [vigenteDesde, setVigenteDesde] = useState(fechaParaInput(config?.vigente_desde));
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [pendiente, startTransition] = useTransition();
  const hayCambios = Boolean(config) && (
    nombre !== (config?.nombre_version ?? "") ||
    estado !== (config?.estado ?? "borrador") ||
    vigenteDesde !== fechaParaInput(config?.vigente_desde)
  );

  useEffect(() => {
    onDirtyChange(hayCambios);
    return () => onDirtyChange(false);
  }, [hayCambios, onDirtyChange]);

  function guardar() {
    if (!cliente || !config) return;
    if (config.estado === "vigente") {
      setConfirmando(true);
      return;
    }
    guardarConfirmado();
  }

  function guardarConfirmado() {
    if (!cliente || !config) return;
    setMensaje(null);
    startTransition(async () => {
      try {
        await actualizarConfigTarifas(cliente, {
          tarifa_hora: config.tarifa_hora,
          tope_factor_variable: config.tope_factor_variable,
          nombre_version: nombre,
          estado,
          vigente_desde: fechaInputAIso(vigenteDesde),
          notas: config.notas
        });
        await onGuardado();
        onDirtyChange(false);
        setMensaje("Política actualizada.");
      } catch (error) {
        setMensaje(error instanceof Error ? error.message : "No se pudo guardar la política.");
      }
    });
  }

  if (!config) {
    return (
      <PassportCard>
        <Aviso tono="atencion">No existe la fila única de configuración tarifaria.</Aviso>
      </PassportCard>
    );
  }

  return (
    <PassportCard>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">{config.nombre_version}</h2>
          <div className="mt-3 flex flex-wrap gap-2 font-body text-xs">
            <span className={`rounded-full border px-3 py-1 font-semibold ${claseEstado(config.estado)}`}>
              {ETIQUETA_ESTADO[config.estado]}
            </span>
            <span className="rounded-full border border-ui-line bg-ui-card px-3 py-1 text-ui-fg-muted">
              Vigente desde {formatoFecha(config.vigente_desde)}
            </span>
            <span className="rounded-full border border-ui-line bg-ui-card px-3 py-1 text-ui-fg-muted">
              Última modificación: {datos.adminActualizacion?.nombre ?? "Admin no identificado"} · {formatoFecha(config.actualizado_en)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_180px_220px]">
        <label className="font-body text-sm font-medium text-ui-fg">
          Nombre de versión
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1 w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 text-sm" />
        </label>
        <label className="font-body text-sm font-medium text-ui-fg">
          Estado
          <select value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)} className="mt-1 w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 text-sm">
            <option value="borrador">Borrador</option>
            <option value="vigente">Vigente</option>
            <option value="archivada">Archivada</option>
          </select>
        </label>
        <label className="font-body text-sm font-medium text-ui-fg">
          Fecha de vigencia
          <input type="datetime-local" value={vigenteDesde} onChange={(e) => setVigenteDesde(e.target.value)} className="mt-1 w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={guardar} disabled={pendiente || !hayCambios}>Guardar política</Button>
        {mensaje && <span className="font-body text-xs text-ui-fg-muted">{mensaje}</span>}
      </div>
      <AdminDialog
        open={confirmando}
        title={`Publicar versión ${datos.config?.nombre_version ?? "tarifaria"}`}
        description="Esta acción reemplaza la versión vigente para cálculos futuros. Los traslados con precio ya cotizado conservarán su tarifa original."
        onOpenChange={(abierto) => { if (!abierto) setConfirmando(false); }}
        footer={<><button type="button" onClick={() => setConfirmando(false)} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted">Cancelar</button><button type="button" onClick={() => { setConfirmando(false); guardarConfirmado(); }} className="rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-brand-hover">Publicar versión</button></>}
      ><span /></AdminDialog>
    </PassportCard>
  );
}

export function SimuladorNormativo({ datos }: { datos: ConfiguracionTarifas }) {
  const [categoria, setCategoria] = useState<CategoriaTarifa>("ligero_a");
  const [gama, setGama] = useState<GamaTarifa>("entrada");
  const [condicion, setCondicion] = useState<CondicionTarifa>("seminueva");
  const [horario, setHorario] = useState<HorarioTarifa>("diurno");
  const [dia, setDia] = useState<DiaTarifa>("entre_semana");
  const [distanciaKm, setDistanciaKm] = useState("196");
  const [tiempoHoras, setTiempoHoras] = useState("2.33");

  const resultado = useMemo(() => {
    try {
      return {
        ok: true as const,
        valor: simularTarifaNormativa(datos, {
          categoria,
          gama,
          condicion,
          horario,
          dia,
          distanciaKm: Number(distanciaKm),
          tiempoHoras: Number(tiempoHoras)
        })
      };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : "No se pudo simular." };
    }
  }, [categoria, condicion, datos, dia, distanciaKm, gama, horario, tiempoHoras]);

  return (
    <PassportCard acento>
      <h2 className="font-display text-xl font-semibold">Simulador normativo</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SelectSim<CategoriaTarifa> etiqueta="Categoría" valor={categoria} onChange={setCategoria} opciones={datos.vehiculo.map((v) => v.categoria)} etiquetas={ETIQUETA_CATEGORIA} />
        <SelectSim<GamaTarifa> etiqueta="Gama" valor={gama} onChange={setGama} opciones={datos.gama.map((v) => v.gama)} />
        <SelectSim<CondicionTarifa> etiqueta="Condición" valor={condicion} onChange={setCondicion} opciones={datos.condicion.map((v) => v.condicion)} />
        <SelectSim<HorarioTarifa> etiqueta="Horario" valor={horario} onChange={setHorario} opciones={datos.horario.map((v) => v.horario)} />
        <SelectSim<DiaTarifa> etiqueta="Día" valor={dia} onChange={setDia} opciones={datos.dia.map((v) => v.dia)} />
        <label className="font-body text-sm font-medium text-ui-fg">
          Distancia km
          <input value={distanciaKm} onChange={(e) => setDistanciaKm(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 text-sm" />
        </label>
        <label className="font-body text-sm font-medium text-ui-fg">
          Tiempo horas
          <input value={tiempoHoras} onChange={(e) => setTiempoHoras(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="mt-5 overflow-hidden rounded-lg border border-ui-focus/20 bg-ui-brand-soft px-4 py-4">
        {resultado.ok ? (
          <div className="grid gap-2 font-body text-sm text-ui-fg-muted sm:grid-cols-4">
            <DatoSim etiqueta="Rango" valor={ETIQUETA_RANGO[resultado.valor.rango] ?? resultado.valor.rango} />
            <DatoSim etiqueta="Base categoría" valor={`$${resultado.valor.baseCategoria.toLocaleString("es-MX")}`} />
            <DatoSim etiqueta="Subtotal" valor={`$${resultado.valor.subtotal.toLocaleString("es-MX")}`} />
            <DatoSim etiqueta="Factor variable" valor={`${resultado.valor.factorVariable.toFixed(2)}x`} />
            <div className="sm:col-span-4">
              <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Tarifa final normativa</p>
              <p className="mt-1 font-display text-3xl font-semibold text-ui-fg">${resultado.valor.tarifa.toLocaleString("es-MX")}</p>
            </div>
          </div>
        ) : (
          <Aviso tono="atencion">{resultado.error}</Aviso>
        )}
      </div>
    </PassportCard>
  );
}

export function AuditoriaTarifaria({ datos }: { datos: ConfiguracionTarifas }) {
  const config = datos.config;
  const eventos = [
    {
      titulo: "Versión vigente",
      detalle: config?.nombre_version ?? "Sin versión configurada",
      fecha: config?.vigente_desde,
      responsable: datos.adminActualizacion?.nombre ?? "Admin no identificado",
      estado: config?.estado ?? "borrador"
    },
    {
      titulo: "Última modificación registrada",
      detalle: "Actualización de política tarifaria normativa",
      fecha: config?.actualizado_en,
      responsable: datos.adminActualizacion?.nombre ?? "Admin no identificado",
      estado: "registro"
    }
  ];

  return (
    <PassportCard>
      <h2 className="font-display text-xl font-semibold">Auditoría</h2>
      <p className="mt-1 font-body text-sm text-ui-fg-muted">
        Historial operativo disponible desde la configuración actual. El registro inmutable completo requiere persistencia de versiones en backend antes de considerar cerrado ADM-UX-32.
      </p>
      <div className="mt-4 divide-y divide-ui-line rounded-lg border border-ui-line">
        {eventos.map((evento) => (
          <div key={`${evento.titulo}-${evento.fecha ?? "sin-fecha"}`} className="grid gap-2 px-4 py-3 md:grid-cols-[1fr_180px_180px_120px] md:items-center">
            <div>
              <p className="font-body text-sm font-semibold text-ui-fg">{evento.titulo}</p>
              <p className="font-body text-xs text-ui-fg-muted">{evento.detalle}</p>
            </div>
            <p className="font-body text-sm text-ui-fg-muted">{formatoFecha(evento.fecha)}</p>
            <p className="font-body text-sm text-ui-fg-muted">{evento.responsable}</p>
            <span className={`w-fit rounded-full border px-3 py-1 font-body text-xs font-semibold ${claseEstado(evento.estado)}`}>
              {ETIQUETA_ESTADO[evento.estado] ?? evento.estado}
            </span>
          </div>
        ))}
      </div>
      <Aviso tono="atencion">
        La publicación usa permisos de administrador vía RLS/RPC. Para historial inmutable, rollback real y programación persistente falta agregar tablas/RPC de versiones tarifarias.
      </Aviso>
      <div className="mt-4">
        <Button variant="quiet" disabled>Revertir versión no disponible con el modelo actual</Button>
      </div>
    </PassportCard>
  );
}
