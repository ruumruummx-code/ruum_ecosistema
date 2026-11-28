"use client";

import type { ReactNode } from "react";
import { PassportCard } from "@ruum/ui";
import type { ConfiguracionTarifas } from "@ruum/api/services";
import {
  ETIQUETA_ESTADO,
  claseEstado,
  formatoFecha
} from "./TarifasTipos";

export function CampoBorrador({
  etiqueta,
  valor,
  sufijo,
  onCambiar
}: {
  etiqueta: string;
  valor: string;
  sufijo?: string;
  onCambiar: (valor: string) => void;
}) {
  return (
    <label className="block min-w-0 font-body text-sm font-medium text-ui-fg">
      <span className="block">{etiqueta}</span>
      <span className="relative mt-1.5 block">
        <input
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          inputMode="decimal"
          className="block w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 pr-16 font-body text-sm text-ui-fg shadow-sm transition-colors hover:border-ui-field focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring"
        />
        {sufijo && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center border-l border-ui-line pl-3 font-mono-ruum text-xs font-medium text-ui-fg-muted">
            {sufijo}
          </span>
        )}
      </span>
    </label>
  );
}

export function ResumenVigente({ datos, modo, hayCambios }: { datos: ConfiguracionTarifas; modo: string; hayCambios: boolean }) {
  const config = datos.config;
  return (
    <section className="sticky top-16 z-20 rounded-lg border border-ui-focus/25 bg-ui-card p-4 shadow-ui-md backdrop-blur" aria-label="Versión vigente y modo actual">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Versión vigente siempre visible</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-ui-fg">{config?.nombre_version ?? "Sin versión configurada"}</h2>
          <div className="mt-2 flex flex-wrap gap-2 font-body text-xs">
            <span className={`rounded-full border px-3 py-1 font-semibold ${claseEstado(config?.estado ?? "borrador")}`}>
              {ETIQUETA_ESTADO[config?.estado ?? "borrador"] ?? config?.estado ?? "Sin estado"}
            </span>
            <span className="rounded-full border border-ui-line bg-ui-card px-3 py-1 text-ui-fg-muted">
              Vigente desde {formatoFecha(config?.vigente_desde)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Modo</p>
          <p className="mt-1 font-display text-lg font-semibold text-ui-fg">{modo}</p>
          {hayCambios && <p className="mt-1 font-body text-xs font-semibold text-ui-warning">Cambios sin guardar</p>}
        </div>
      </div>
    </section>
  );
}

export function PrincipiosTarifarios() {
  return (
    <PassportCard acento>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div>
          <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Principio rector</p>
          <h2 className="mt-1 font-display text-xl font-semibold">La operación aplica tarifas; no las negocia.</h2>
          <p className="mt-2 font-body text-sm leading-6 text-ui-fg-muted">
            Todo precio debe salir de una política tarifaria vigente, aprobada y trazable. Si existe un acuerdo extraordinario, se convierte en regla, convenio o política con vigencia.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "Fórmula configurable y auditable",
            "Convenios corporativos como reglas",
            "Sin precios libres en operación",
            "Historial visible para dirección"
          ].map((texto) => (
            <div key={texto} className="rounded-lg border border-ui-line bg-ui-brand/[0.03] px-4 py-3 font-body text-sm text-ui-fg-muted">
              {texto}
            </div>
          ))}
        </div>
      </div>
    </PassportCard>
  );
}

function PasoFormula({
  numero,
  etiqueta,
  children
}: {
  numero: string;
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-ui-line px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex shrink-0 items-center gap-2 sm:w-40">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ui-brand font-body text-xs font-semibold text-ui-on-brand">
          {numero}
        </span>
        <span className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">{etiqueta}</span>
      </div>
      <code className="font-mono-ruum text-sm leading-7 text-ui-fg sm:text-base">{children}</code>
    </div>
  );
}

function Var({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-ui-brand-soft-fg">{children}</span>;
}

function Op({ children }: { children: ReactNode }) {
  return <span className="text-ui-fg-muted">{children}</span>;
}

export function FormulaVigente({ datos }: { datos: ConfiguracionTarifas }) {
  return (
    <PassportCard>
      <h2 className="font-display text-xl font-semibold">Fórmula vigente</h2>
      <p className="mt-1 font-body text-sm text-ui-fg-muted">Así se calcula la tarifa final que ve el usuario, paso por paso.</p>
      <div className="mt-4 overflow-hidden rounded-lg border border-ui-line bg-ui-muted">
        <PasoFormula numero="1" etiqueta="Base por categoría">
          <Var>Base_categoría</Var> <Op>=</Op> BaseVehículo(rango) <Op>×</Op> <Var>F_gama</Var>
        </PasoFormula>
        <PasoFormula numero="2" etiqueta="Subtotal">
          <Var>Subtotal</Var> <Op>=</Op> Base_categoría <Op>+</Op> (Distancia_km <Op>×</Op> $/km_vehículo) <Op>+</Op> (Tiempo_horas <Op>×</Op> <Var>${datos.config?.tarifa_hora ?? "—"}</Var>)
        </PasoFormula>
        <PasoFormula numero="3" etiqueta="Factor variable">
          <Var>Factor_variable</Var> <Op>=</Op> MIN( F_condición <Op>×</Op> F_horario <Op>×</Op> F_día , <Var>{datos.config?.tope_factor_variable ?? "—"}</Var> )
        </PasoFormula>
        <PasoFormula numero="4" etiqueta="Tarifa final">
          <Var>Tarifa_final</Var> <Op>=</Op> Subtotal <Op>×</Op> Factor_variable
        </PasoFormula>
      </div>
    </PassportCard>
  );
}

export function DatoSim({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">{etiqueta}</p>
      <p className="mt-1 font-semibold text-ui-fg">{valor}</p>
    </div>
  );
}

export function SelectSim<T extends string>({
  etiqueta,
  valor,
  opciones,
  etiquetas,
  onChange
}: {
  etiqueta: string;
  valor: T;
  opciones: T[];
  etiquetas?: Record<string, string>;
  onChange: (valor: T) => void;
}) {
  const unicas = [...new Set(opciones)];
  return (
    <label className="font-body text-sm font-medium text-ui-fg">
      {etiqueta}
      <select value={valor} onChange={(e) => onChange(e.target.value as T)} className="mt-1 w-full rounded-lg border border-ui-line-strong bg-ui-card px-3 py-2 text-sm">
        {unicas.map((opcion) => <option key={opcion} value={opcion}>{etiquetas?.[opcion] ?? opcion.replaceAll("_", " ")}</option>)}
      </select>
    </label>
  );
}
