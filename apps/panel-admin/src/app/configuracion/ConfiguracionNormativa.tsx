"use client";

import type { ConfiguracionAdmin } from "@ruum/api/services";
import { AdminBadge, AdminButton, AdminInput, AdminSelect, AdminTextarea } from "../admin-components";
import {
  CATEGORIAS,
  ORDEN_CATEGORIAS,
  formatearFecha,
  resumenValor,
  estadoNorma,
  parsearConfig,
  objeto,
  texto,
  numero,
  booleano,
  lista,
  lineas,
  zonas,
  parsearZonas,
  setObjetoAnidado,
  type JsonObject
} from "./ConfiguracionTipos";

function CheckNormativo({ label, checked, onChange }: { label: string; checked: boolean; onChange: (valor: boolean) => void }) {
  return (
    <label className="flex items-start gap-2 rounded-lg border border-ui-line bg-ui-card px-3 py-2 font-body text-sm text-ui-fg">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 accent-ui-brand" />
      <span>{label}</span>
    </label>
  );
}

function OpcionesChecklist({ label, opciones, seleccionadas, onChange }: { label: string; opciones: string[]; seleccionadas: string[]; onChange: (valor: string[]) => void }) {
  const actuales = new Set(seleccionadas);
  return (
    <fieldset className="rounded-xl border border-ui-line p-4">
      <legend className="px-1 font-body text-sm font-semibold text-ui-fg">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {opciones.map((opcion) => (
          <CheckNormativo
            key={opcion}
            label={opcion.replace(/_/g, " ")}
            checked={actuales.has(opcion)}
            onChange={(activo) => {
              const siguiente = new Set(actuales);
              if (activo) siguiente.add(opcion);
              else siguiente.delete(opcion);
              onChange(Array.from(siguiente));
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}

export function ResumenNormativo({ claveConfig, valor }: { claveConfig: string; valor: unknown }) {
  const config = objeto(valor);
  if (claveConfig === "metodos_pago") {
    return <p className="font-body text-sm font-semibold text-ui-fg">{lista(config.habilitados).length} métodos activos · Pasarela {texto(config.proveedor_pasarela, "sin proveedor")}</p>;
  }
  if (claveConfig === "datos_fiscales") {
    const ruum = objeto(config.ruum);
    const requisitos = objeto(config.requisitos_cliente);
    return <p className="font-body text-sm font-semibold text-ui-fg">Emisor {texto(ruum.rfc, "pendiente")} · {Object.keys(requisitos).length || 1} reglas fiscales de cliente</p>;
  }
  if (claveConfig === "seguridad") {
    return <p className="font-body text-sm font-semibold text-ui-fg">Sesión {numero(config.sesion_minutos, 60)} min · Motivo mínimo {numero(config.motivo_minimo_caracteres, 10)} caracteres</p>;
  }
  if (claveConfig === "plantillas_notificacion") {
    return <p className="font-body text-sm font-semibold text-ui-fg">{lista(config.canales).join(", ") || "Sin canales"} · Recordatorio {numero(config.recordatorio_minutos_antes, 60)} min</p>;
  }
  if (claveConfig === "zonas_operacion") {
    return <p className="font-body text-sm font-semibold text-ui-fg">{zonas(config).length} zona(s) · Fuera de cobertura {booleano(config.permitir_fuera_cobertura) ? "permitido" : "bloqueado"}</p>;
  }
  if (claveConfig === "tipos_servicio_vehiculo") {
    return <p className="font-body text-sm font-semibold text-ui-fg">{lista(config.servicios).length} servicios · {lista(config.vehiculos).length} tipos de vehículo</p>;
  }
  if (claveConfig === "reglas_evidencia") {
    const inicio = objeto(config.inicio);
    const entrega = objeto(config.entrega);
    return <p className="font-body text-sm font-semibold text-ui-fg">Inicio {numero(inicio.fotos_minimas, 0)} fotos · Entrega {numero(entrega.fotos_minimas, 0)} fotos</p>;
  }
  return <p className="font-body text-sm font-semibold text-ui-fg">{resumenValor(valor)}</p>;
}

export function EditorNormativo({
  registro,
  json,
  onChange,
  error
}: {
  registro: ConfiguracionAdmin;
  json: string;
  onChange: (siguiente: string) => void;
  error: string | null;
}) {
  const config = parsearConfig(json);
  if (!config) {
    return (
      <AdminTextarea
        label="Parámetros JSON"
        description="El JSON actual no se puede interpretar; corrígelo para continuar."
        value={json}
        onChange={(e) => onChange(e.target.value)}
        error={error ?? "JSON inválido."}
        rows={14}
        spellCheck={false}
        controlClassName="font-mono-ruum text-xs"
      />
    );
  }

  const cambiar = (siguiente: JsonObject) => onChange(JSON.stringify(siguiente, null, 2));
  const setCampo = (campo: string, valor: unknown) => cambiar({ ...config, [campo]: valor });
  const setObjeto = (campo: string, subcampo: string, valor: unknown) => {
    const base = objeto(config[campo]);
    cambiar({ ...config, [campo]: { ...base, [subcampo]: valor } });
  };

  if (registro.clave === "zonas_operacion") {
    return (
      <div className="space-y-4">
        <AdminTextarea
          label="Zonas de operación"
          description="Una zona por línea: codigo | nombre | activa"
          value={zonas(config).map((zona) => `${zona.codigo} | ${zona.nombre} | ${zona.activa ? "activa" : "inactiva"}`).join("\n")}
          onChange={(e) => setCampo("zonas", parsearZonas(e.target.value))}
          rows={5}
        />
        <CheckNormativo label="Permitir solicitudes fuera de cobertura" checked={booleano(config.permitir_fuera_cobertura)} onChange={(valor) => setCampo("permitir_fuera_cobertura", valor)} />
      </div>
    );
  }

  if (registro.clave === "tipos_servicio_vehiculo") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <AdminTextarea label="Servicios habilitados" description="Uno por línea." value={lista(config.servicios).join("\n")} onChange={(e) => setCampo("servicios", lineas(e.target.value))} rows={6} />
        <AdminTextarea label="Tipos de vehículo" description="Uno por línea." value={lista(config.vehiculos).join("\n")} onChange={(e) => setCampo("vehiculos", lineas(e.target.value))} rows={6} />
      </div>
    );
  }

  if (registro.clave === "reglas_evidencia") {
    const inicio = objeto(config.inicio);
    const entrega = objeto(config.entrega);
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="rounded-xl border border-ui-line p-4">
          <legend className="px-1 font-body text-sm font-semibold text-ui-fg">Inicio de traslado</legend>
          <AdminInput label="Fotos mínimas" type="number" min={0} value={numero(inicio.fotos_minimas, 4)} onChange={(e) => setObjeto("inicio", "fotos_minimas", Number(e.target.value))} />
          <CheckNormativo label="Requiere odómetro" checked={booleano(inicio.requiere_odometro)} onChange={(valor) => setObjeto("inicio", "requiere_odometro", valor)} />
        </fieldset>
        <fieldset className="rounded-xl border border-ui-line p-4">
          <legend className="px-1 font-body text-sm font-semibold text-ui-fg">Entrega</legend>
          <AdminInput label="Fotos mínimas" type="number" min={0} value={numero(entrega.fotos_minimas, 4)} onChange={(e) => setObjeto("entrega", "fotos_minimas", Number(e.target.value))} />
          <CheckNormativo label="Requiere firma" checked={booleano(entrega.requiere_firma)} onChange={(valor) => setObjeto("entrega", "requiere_firma", valor)} />
        </fieldset>
      </div>
    );
  }

  if (registro.clave === "estados_traslado") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <CheckNormativo label="Cancelación especial requiere supervisor" checked={booleano(config.cancelacion_especial_requiere_supervisor)} onChange={(valor) => setCampo("cancelacion_especial_requiere_supervisor", valor)} />
        <CheckNormativo label="Cierre con incidencia requiere aprobación" checked={booleano(config.cierre_con_incidencia_requiere_aprobacion)} onChange={(valor) => setCampo("cierre_con_incidencia_requiere_aprobacion", valor)} />
        <CheckNormativo label="Reasignación de conductor requiere motivo" checked={booleano(config.reasignacion_conductor_requiere_motivo, true)} onChange={(valor) => setCampo("reasignacion_conductor_requiere_motivo", valor)} />
        <CheckNormativo label="Bloquear cierre sin evidencias" checked={booleano(config.bloquear_cierre_sin_evidencias, true)} onChange={(valor) => setCampo("bloquear_cierre_sin_evidencias", valor)} />
      </div>
    );
  }

  if (registro.clave === "plantillas_notificacion") {
    return (
      <div className="space-y-4">
        <OpcionesChecklist label="Canales transaccionales" opciones={["push", "email", "sms", "whatsapp"]} seleccionadas={lista(config.canales)} onChange={(valor) => setCampo("canales", valor)} />
        <AdminInput label="Recordatorio antes del traslado (minutos)" type="number" min={0} value={numero(config.recordatorio_minutos_antes, 60)} onChange={(e) => setCampo("recordatorio_minutos_antes", Number(e.target.value))} />
        <CheckNormativo label="Notificar cancelaciones" checked={booleano(config.notificar_cancelacion, true)} onChange={(valor) => setCampo("notificar_cancelacion", valor)} />
        <CheckNormativo label="Notificar incidencias críticas" checked={booleano(config.notificar_incidencia_critica, true)} onChange={(valor) => setCampo("notificar_incidencia_critica", valor)} />
      </div>
    );
  }

  if (registro.clave === "metodos_pago") {
    return (
      <div className="space-y-4">
        <OpcionesChecklist
          label="Métodos aceptados"
          opciones={["tarjeta_credito", "tarjeta_debito", "transferencia", "spei", "paypal", "mercado_pago", "credito_corporativo"]}
          seleccionadas={lista(config.habilitados)}
          onChange={(valor) => setCampo("habilitados", valor)}
        />
        <AdminSelect label="Pasarela principal" value={texto(config.proveedor_pasarela, "stripe")} onChange={(e) => setCampo("proveedor_pasarela", e.target.value)}>
          <option value="stripe">Stripe</option>
          <option value="mercado_pago">Mercado Pago</option>
          <option value="paypal">PayPal</option>
          <option value="manual">Manual / Banco</option>
        </AdminSelect>
        <div className="grid gap-3 md:grid-cols-2">
          <CheckNormativo label="Requiere referencia" checked={booleano(config.requiere_referencia, true)} onChange={(valor) => setCampo("requiere_referencia", valor)} />
          <CheckNormativo label="Conciliación automática" checked={booleano(config.conciliacion_automatica)} onChange={(valor) => setCampo("conciliacion_automatica", valor)} />
          <CheckNormativo label="Permitir crédito corporativo" checked={booleano(config.permitir_credito_corporativo, true)} onChange={(valor) => setCampo("permitir_credito_corporativo", valor)} />
          <CheckNormativo label="Bloquear traslado sin pago confirmado" checked={booleano(config.bloquear_sin_pago_confirmado)} onChange={(valor) => setCampo("bloquear_sin_pago_confirmado", valor)} />
        </div>
      </div>
    );
  }

  if (registro.clave === "datos_fiscales") {
    const ruum = objeto(config.ruum);
    const requisitos = objeto(config.requisitos_cliente);
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <fieldset className="space-y-3 rounded-xl border border-ui-line p-4">
          <legend className="px-1 font-body text-sm font-semibold text-ui-fg">Datos fiscales de Ruum Ruum</legend>
          <AdminInput label="RFC emisor" value={texto(ruum.rfc)} onChange={(e) => setObjeto("ruum", "rfc", e.target.value.toUpperCase())} />
          <AdminInput label="Razón social" value={texto(ruum.razon_social)} onChange={(e) => setObjeto("ruum", "razon_social", e.target.value)} />
          <AdminInput label="Régimen fiscal" value={texto(ruum.regimen_fiscal)} onChange={(e) => setObjeto("ruum", "regimen_fiscal", e.target.value)} />
          <AdminInput label="Código postal fiscal" value={texto(ruum.codigo_postal_fiscal)} onChange={(e) => setObjeto("ruum", "codigo_postal_fiscal", e.target.value)} />
          <AdminInput label="Correo de facturación" type="email" value={texto(ruum.correo_facturacion)} onChange={(e) => setObjeto("ruum", "correo_facturacion", e.target.value)} />
        </fieldset>
        <fieldset className="space-y-3 rounded-xl border border-ui-line p-4">
          <legend className="px-1 font-body text-sm font-semibold text-ui-fg">Requisitos fiscales para clientes</legend>
          <CheckNormativo label="Persona física: RFC obligatorio" checked={booleano(objeto(requisitos.persona_fisica).rfc_obligatorio, true)} onChange={(valor) => setObjetoAnidado(config, cambiar, ["requisitos_cliente", "persona_fisica", "rfc_obligatorio"], valor)} />
          <CheckNormativo label="Persona física: constancia fiscal" checked={booleano(objeto(requisitos.persona_fisica).constancia_obligatoria)} onChange={(valor) => setObjetoAnidado(config, cambiar, ["requisitos_cliente", "persona_fisica", "constancia_obligatoria"], valor)} />
          <CheckNormativo label="Persona moral: razón social obligatoria" checked={booleano(objeto(requisitos.persona_moral).razon_social_obligatoria, true)} onChange={(valor) => setObjetoAnidado(config, cambiar, ["requisitos_cliente", "persona_moral", "razon_social_obligatoria"], valor)} />
          <CheckNormativo label="Persona moral: constancia fiscal" checked={booleano(objeto(requisitos.persona_moral).constancia_obligatoria, true)} onChange={(valor) => setObjetoAnidado(config, cambiar, ["requisitos_cliente", "persona_moral", "constancia_obligatoria"], valor)} />
          <CheckNormativo label="Bloquear facturación si faltan datos" checked={booleano(config.bloquear_facturacion_sin_datos, true)} onChange={(valor) => setCampo("bloquear_facturacion_sin_datos", valor)} />
        </fieldset>
      </div>
    );
  }

  if (registro.clave === "seguridad") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <AdminInput label="Duración de sesión admin (minutos)" type="number" min={15} value={numero(config.sesion_minutos, 60)} onChange={(e) => setCampo("sesion_minutos", Number(e.target.value))} />
        <AdminInput label="Motivo mínimo (caracteres)" type="number" min={10} value={numero(config.motivo_minimo_caracteres, 10)} onChange={(e) => setCampo("motivo_minimo_caracteres", Number(e.target.value))} />
        <AdminInput label="Intentos fallidos máximos" type="number" min={1} value={numero(config.intentos_fallidos_maximos, 5)} onChange={(e) => setCampo("intentos_fallidos_maximos", Number(e.target.value))} />
        <AdminInput label="Reautenticación cambios críticos (min)" type="number" min={1} value={numero(config.reautenticacion_cambios_criticos_minutos, 15)} onChange={(e) => setCampo("reautenticacion_cambios_criticos_minutos", Number(e.target.value))} />
        <CheckNormativo label="Aprobación dual para cambios críticos" checked={booleano(config.aprobacion_dual_cambios_criticos, true)} onChange={(valor) => setCampo("aprobacion_dual_cambios_criticos", valor)} />
        <CheckNormativo label="MFA requerido para Dirección" checked={booleano(config.mfa_requerido_direccion, true)} onChange={(valor) => setCampo("mfa_requerido_direccion", valor)} />
      </div>
    );
  }

  return (
    <AdminTextarea
      label="Parámetros JSON"
      description="Esta clave aún no tiene editor especializado; conserva un objeto JSON válido."
      value={json}
      onChange={(e) => onChange(e.target.value)}
      error={error ?? undefined}
      rows={14}
      spellCheck={false}
      controlClassName="font-mono-ruum text-xs"
    />
  );
}

interface ConfiguracionNormativaProps {
  agrupados: Record<string, ConfiguracionAdmin[]>;
  categoriasAbiertas: Record<string, boolean>;
  onToggleCategoria: (categoria: string) => void;
  onAbrirEditor: (registro: ConfiguracionAdmin) => void;
}

export function ConfiguracionNormativa({
  agrupados,
  categoriasAbiertas,
  onToggleCategoria,
  onAbrirEditor
}: ConfiguracionNormativaProps) {
  return (
    <div id="normativa-operativa" className="scroll-mt-24">
      {ORDEN_CATEGORIAS.filter((categoria) => agrupados[categoria]?.length).map((categoria) => {
        const abierto = categoriasAbiertas[categoria] ?? false;
        const registrosCategoria = agrupados[categoria] ?? [];
        return (
          <section key={categoria} className="mt-6 rounded-2xl border border-ui-line bg-ui-card" aria-labelledby={`categoria-${categoria}`}>
            <button
              type="button"
              onClick={() => onToggleCategoria(categoria)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={abierto}
            >
              <div>
                <p className="font-mono-ruum text-xs uppercase tracking-wide text-ui-fg-muted">Normativa activa</p>
                <h2 id={`categoria-${categoria}`} className="font-display text-xl font-semibold text-ui-fg">{CATEGORIAS[categoria] ?? categoria}</h2>
              </div>
              <div className="flex items-center gap-2">
                <AdminBadge tone="success">{registrosCategoria.length} vigente(s)</AdminBadge>
                <span className="font-mono-ruum text-sm text-ui-fg-muted">{abierto ? "−" : "+"}</span>
              </div>
            </button>
            {abierto && (
              <div className="grid gap-4 border-t border-ui-line p-5 lg:grid-cols-2">
                {registrosCategoria.map((registro) => (
                  <article key={registro.clave} className="rounded-xl border border-ui-line bg-ui-muted p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-ui-fg">{registro.nombre}</h3>
                        <p className="mt-1 font-body text-sm text-ui-fg-muted">{registro.descripcion}</p>
                      </div>
                      <AdminBadge tone={estadoNorma(registro).tone}>{estadoNorma(registro).label}</AdminBadge>
                    </div>
                    <div className="mt-4 rounded-lg bg-ui-card px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <ResumenNormativo claveConfig={registro.clave} valor={registro.valor} />
                        <AdminBadge tone="neutral">v{registro.version}</AdminBadge>
                      </div>
                      <p className="mt-2 font-body text-xs text-ui-fg-muted">Actualizado {formatearFecha(registro.actualizada_en)}</p>
                    </div>
                    <div className="mt-4 rounded-lg border border-ui-line bg-ui-card px-3 py-3">
                      <p className="font-body text-xs font-semibold uppercase tracking-wide text-ui-fg-muted">Historial reciente</p>
                      <p className="mt-1 font-body text-sm text-ui-fg-muted">v{registro.version} · Actualización vigente · {formatearFecha(registro.actualizada_en)}</p>
                      <p className="mt-1 font-body text-xs text-ui-fg-muted">Para últimos 3 cambios completos, consultar auditoría por clave normativa.</p>
                    </div>
                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <AdminButton variant="secondary" onClick={() => onAbrirEditor(registro)}>Editar norma</AdminButton>
                      <a href={`/auditoria?recurso=configuracion_normativa&clave=${encodeURIComponent(registro.clave)}`} className="inline-flex min-h-10 items-center rounded-lg border border-ui-line px-4 py-2 font-body text-sm font-semibold text-ui-fg-muted hover:border-ui-brand/45 hover:text-ui-fg">
                        Ver auditoría
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
