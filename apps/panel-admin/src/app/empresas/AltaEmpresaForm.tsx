"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { AdminButton } from "../admin-components";
import { AdminPanel } from "../admin-ui";
import {
  FORM_INICIAL,
  REGIMENES_FISCALES,
  USOS_CFDI,
  CONDICIONES_PAGO,
  normalizarRfc,
  soloNumeros,
  formatearTelefono
} from "./EmpresasTipos";

function SeccionAlta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-ui-line bg-ui-muted p-4">
      <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">{titulo}</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-6">{children}</div>
    </section>
  );
}

function CampoAlta({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "md:col-span-3",
  inputMode,
  autoComplete,
  list,
  ayuda,
  error
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "number" | "tel";
  className?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  list?: string;
  ayuda?: string;
  error?: string | null;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="font-body text-xs font-semibold text-ui-fg-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        autoComplete={autoComplete}
        list={list}
        placeholder={placeholder}
        className="h-10 rounded-lg border border-ui-line-strong bg-ui-card px-3 font-body text-sm text-ui-fg placeholder:text-ui-fg-muted focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring"
      />
      {(error || ayuda) && <span className={`font-body text-xs ${error ? "text-ui-danger" : "text-ui-fg-muted"}`}>{error ?? ayuda}</span>}
    </label>
  );
}

interface AltaEmpresaFormProps {
  formulario: typeof FORM_INICIAL;
  guardando: boolean;
  rfcDuplicado: boolean;
  formularioIncompleto: boolean;
  esDemo: boolean;
  puedeGestionarEmpresas: boolean;
  onActualizarCampo: (campo: keyof typeof FORM_INICIAL, valor: string | boolean) => void;
  onLimpiar: () => void;
  onCerrar: () => void;
  onSubmit: () => void;
}

export function AltaEmpresaForm({
  formulario,
  guardando,
  rfcDuplicado,
  formularioIncompleto,
  esDemo,
  puedeGestionarEmpresas,
  onActualizarCampo,
  onLimpiar,
  onCerrar,
  onSubmit
}: AltaEmpresaFormProps) {
  return (
    <AdminPanel className="mt-6 p-5 sm:p-6">
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-body text-xs uppercase tracking-wide text-ui-fg-muted">Alta corporativa</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-ui-fg">Crear empresa</h2>
            <p className="mt-1 max-w-3xl font-body text-sm text-ui-fg-muted">
              Captura fiscal controlada para evitar errores administrativos antes de solicitar aprobación.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="quiet" onClick={onLimpiar} disabled={guardando}>Limpiar</AdminButton>
            <AdminButton variant="secondary" onClick={onCerrar} disabled={guardando}>Cerrar alta</AdminButton>
            <AdminButton onClick={onSubmit} loading={guardando} disabled={rfcDuplicado || formularioIncompleto || esDemo || !puedeGestionarEmpresas}>Guardar empresa</AdminButton>
          </div>
        </div>

        <datalist id="regimenes-fiscales-empresa">
          {REGIMENES_FISCALES.map((opcion) => <option key={opcion} value={opcion} />)}
        </datalist>
        <datalist id="usos-cfdi-empresa">
          {USOS_CFDI.map((opcion) => <option key={opcion} value={opcion} />)}
        </datalist>
        <datalist id="condiciones-pago-empresa">
          {CONDICIONES_PAGO.map((opcion) => <option key={opcion} value={opcion} />)}
        </datalist>

        <SeccionAlta titulo="Información de la empresa">
          <CampoAlta label="Nombre comercial" value={formulario.nombre} onChange={(valor) => onActualizarCampo("nombre", valor)} placeholder="Ruum corporativo" className="md:col-span-3" autoComplete="organization" />
          <CampoAlta label="Razón social" value={formulario.razon_social} onChange={(valor) => onActualizarCampo("razon_social", valor)} placeholder="Razón social completa" className="md:col-span-3" />
        </SeccionAlta>

        <SeccionAlta titulo="Datos fiscales">
          <CampoAlta
            label="RFC"
            value={formulario.rfc}
            onChange={(valor) => onActualizarCampo("rfc", normalizarRfc(valor))}
            placeholder="ABC010203AB1"
            className="md:col-span-2"
            ayuda={`${formulario.rfc.length}/13 caracteres`}
            error={formulario.rfc && formulario.rfc.length !== 12 && formulario.rfc.length !== 13 ? "Debe tener 12 o 13 caracteres." : rfcDuplicado ? "Ya existe una empresa con este RFC." : null}
          />
          <CampoAlta label="Régimen fiscal" value={formulario.regimen_fiscal} onChange={(valor) => onActualizarCampo("regimen_fiscal", valor)} placeholder="Buscar régimen" className="md:col-span-4" list="regimenes-fiscales-empresa" />
          <CampoAlta label="CP fiscal" value={formulario.codigo_postal_fiscal} onChange={(valor) => onActualizarCampo("codigo_postal_fiscal", soloNumeros(valor, 5))} placeholder="00000" className="md:col-span-2" inputMode="numeric" />
          <CampoAlta label="Uso CFDI" value={formulario.uso_cfdi} onChange={(valor) => onActualizarCampo("uso_cfdi", valor)} placeholder="Buscar uso CFDI" className="md:col-span-2" list="usos-cfdi-empresa" />
          <CampoAlta label="Condiciones de pago" value={formulario.condiciones_pago} onChange={(valor) => onActualizarCampo("condiciones_pago", valor)} placeholder="Seleccionar condición" className="md:col-span-2" list="condiciones-pago-empresa" />
          <CampoAlta label="Límite de crédito" value={formulario.limite_credito_mxn} onChange={(valor) => onActualizarCampo("limite_credito_mxn", soloNumeros(valor))} placeholder="0" className="md:col-span-2" inputMode="numeric" />
          <CampoAlta label="Días de crédito" value={formulario.dias_credito} onChange={(valor) => onActualizarCampo("dias_credito", soloNumeros(valor, 3))} placeholder="0" className="md:col-span-2" inputMode="numeric" />
        </SeccionAlta>

        <SeccionAlta titulo="Contacto y titular">
          <CampoAlta label="Nombre del titular" value={formulario.titular_nombre} onChange={(valor) => onActualizarCampo("titular_nombre", valor)} placeholder="Nombre completo" className="md:col-span-2" autoComplete="name" />
          <CampoAlta label="Correo titular" type="email" value={formulario.titular_correo} onChange={(valor) => onActualizarCampo("titular_correo", valor)} placeholder="titular@empresa.com" className="md:col-span-2" autoComplete="email" />
          <CampoAlta label="Teléfono titular" type="tel" value={formulario.titular_telefono} onChange={(valor) => onActualizarCampo("titular_telefono", formatearTelefono(valor))} placeholder="(123) 456-7890" className="md:col-span-2" inputMode="tel" autoComplete="tel" />
          <CampoAlta label="Correo facturación" type="email" value={formulario.correo_facturacion} onChange={(valor) => onActualizarCampo("correo_facturacion", valor)} placeholder="facturacion@empresa.com" className="md:col-span-3" autoComplete="email" ayuda="Si queda vacío se usará el correo del titular." />
        </SeccionAlta>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 font-body text-sm text-ui-fg">
            <input type="checkbox" checked={formulario.requiere_orden_compra} onChange={(e) => onActualizarCampo("requiere_orden_compra", e.target.checked)} className="size-4 rounded border-ui-line-strong" />
            Requiere orden de compra
          </label>
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="quiet" onClick={onLimpiar} disabled={guardando}>Limpiar</AdminButton>
            <AdminButton variant="secondary" onClick={onCerrar} disabled={guardando}>Cerrar alta</AdminButton>
            <AdminButton onClick={onSubmit} loading={guardando} disabled={rfcDuplicado || formularioIncompleto || esDemo || !puedeGestionarEmpresas}>Guardar empresa</AdminButton>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
}
