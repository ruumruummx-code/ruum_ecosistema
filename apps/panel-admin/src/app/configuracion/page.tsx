"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  actualizarConfiguracionAdmin,
  actualizarRolColaboradorAdmin,
  concederCapacidadAdmin,
  listarConfiguracionAdmin,
  listarCatalogoCapacidades,
  listarCapacidadesAdmin,
  listarColaboradoresAdmin,
  type AdminColaborador,
  type CapacidadAdmin,
  type ConfiguracionAdmin
} from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";
import type { RolAdminOperativo } from "../../lib/roles-admin";
import { AdminPageHeader } from "../admin-ui";
import {
  AdminButton,
  AdminErrorState,
  AdminLoadingState,
  AdminTabs
} from "../admin-components";
import {
  type Resultado,
  type AccionCapacidad,
  type PestañaConfiguracion,
  type NuevoAdminPanel
} from "./ConfiguracionTipos";
import { ConfiguracionRoles } from "./ConfiguracionRoles";
import { ConfiguracionNormativa } from "./ConfiguracionNormativa";
import { DialogosConfiguracion } from "./DialogosConfiguracion";

export default function PaginaConfiguracionAdmin() {
  const [registros, setRegistros] = useState<ConfiguracionAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<ConfiguracionAdmin | null>(null);
  const [json, setJson] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<Resultado>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [colaboradores, setColaboradores] = useState<AdminColaborador[]>([]);
  const [colaboradorId, setColaboradorId] = useState("");
  const [capacidades, setCapacidades] = useState<CapacidadAdmin[]>([]);
  const [catalogoCapacidades, setCatalogoCapacidades] = useState<string[]>([]);
  const [cargandoRoles, setCargandoRoles] = useState(true);
  const [errorRoles, setErrorRoles] = useState<string | null>(null);
  const [rolSeleccionado, setRolSeleccionado] = useState<RolAdminOperativo>("operador");
  const [motivoRol, setMotivoRol] = useState("");
  const [guardandoRol, setGuardandoRol] = useState(false);
  const [dialogoCapacidad, setDialogoCapacidad] = useState(false);
  const [capacidadSeleccionada, setCapacidadSeleccionada] = useState("");
  const [accionCapacidad, setAccionCapacidad] = useState<AccionCapacidad>("conceder");
  const [motivoCapacidad, setMotivoCapacidad] = useState("");
  const [guardandoCapacidad, setGuardandoCapacidad] = useState(false);
  const [dialogoAltaAdmin, setDialogoAltaAdmin] = useState(false);
  const [guardandoAltaAdmin, setGuardandoAltaAdmin] = useState(false);
  const [nuevoAdmin, setNuevoAdmin] = useState<NuevoAdminPanel>({
    nombre: "",
    correo: "",
    rol: "operador",
    motivo: ""
  });
  const [pestañaActiva, setPestañaActiva] = useState<PestañaConfiguracion>("roles");
  const [categoriasNormativaAbiertas, setCategoriasNormativaAbiertas] = useState<Record<string, boolean>>({
    operacion: true,
    finanzas: true,
    comunicacion: false,
    seguridad: false
  });
  const [dialogoRol, setDialogoRol] = useState(false);

  const cargar = useCallback(async () => {
    setError(null);
    setCargando(true);
    if (!tieneSupabaseConfigurado()) {
      setError("Supabase no está configurado en este entorno.");
      setCargando(false);
      return;
    }
    try {
      const cliente = crearClienteNavegador();
      setRegistros(await listarConfiguracionAdmin(cliente));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la configuración.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const cargarRolesCapacidades = useCallback(async () => {
    setErrorRoles(null);
    setCargandoRoles(true);
    if (!tieneSupabaseConfigurado()) {
      setErrorRoles("Supabase no está configurado en este entorno.");
      setCargandoRoles(false);
      return;
    }
    try {
      const cliente = crearClienteNavegador();
      const [colaboradoresData, catalogoData] = await Promise.all([
        listarColaboradoresAdmin(cliente),
        listarCatalogoCapacidades(cliente)
      ]);
      setColaboradores(colaboradoresData);
      setCatalogoCapacidades(catalogoData);
      setColaboradorId((actual) => actual || colaboradoresData[0]?.id || "");
    } catch (e) {
      setErrorRoles(e instanceof Error ? e.message : "No se pudo cargar roles y capacidades.");
      setColaboradores([]);
      setCatalogoCapacidades([]);
    } finally {
      setCargandoRoles(false);
    }
  }, []);

  const cargarCapacidades = useCallback(async (adminId: string) => {
    if (!adminId || !tieneSupabaseConfigurado()) {
      setCapacidades([]);
      return;
    }
    try {
      setCapacidades(await listarCapacidadesAdmin(crearClienteNavegador(), adminId));
    } catch (e) {
      setErrorRoles(e instanceof Error ? e.message : "No se pudieron cargar las capacidades efectivas.");
      setCapacidades([]);
    }
  }, []);

  useEffect(() => { void cargarRolesCapacidades(); }, [cargarRolesCapacidades]);

  useEffect(() => {
    const colaborador = colaboradores.find((item) => item.id === colaboradorId);
    if (colaborador) setRolSeleccionado(colaborador.rol_operativo);
    setMotivoRol("");
    void cargarCapacidades(colaboradorId);
  }, [colaboradorId, colaboradores, cargarCapacidades]);

  const agrupados = useMemo(() => {
    return registros.reduce<Record<string, ConfiguracionAdmin[]>>((acc, registro) => {
      (acc[registro.categoria] ??= []).push(registro);
      return acc;
    }, {});
  }, [registros]);

  const colaboradorSeleccionado = colaboradores.find((item) => item.id === colaboradorId) ?? null;
  const capacidadesCatalogoFiltradas = catalogoCapacidades.filter((capacidad) => capacidad !== "capacidades:administrar");

  function abrirEditor(registro: ConfiguracionAdmin) {
    setEditando(registro);
    setJson(JSON.stringify(registro.valor, null, 2));
    setMotivo("");
    setJsonError(null);
    setResultado(null);
  }

  async function guardar() {
    if (!editando) return;
    let valor: unknown;
    try {
      valor = JSON.parse(json);
      if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
        throw new Error("El valor raíz debe ser un objeto JSON.");
      }
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "JSON inválido.");
      return;
    }
    if (motivo.trim().length < 10) return;

    setGuardando(true);
    try {
      const actualizado = await actualizarConfiguracionAdmin(
        crearClienteNavegador(), editando.clave, valor, motivo.trim(), editando.version
      );
      setRegistros((actuales) => actuales.map((r) => r.clave === actualizado.clave ? actualizado : r));
      setEditando(null);
      setResultado({ tipo: "success", mensaje: `${actualizado.nombre} se actualizó y quedó registrada en auditoría.` });
    } catch (e) {
      setResultado({ tipo: "error", mensaje: e instanceof Error ? e.message : "No se pudo guardar la configuración." });
    } finally {
      setGuardando(false);
    }
  }

  async function guardarRolColaborador() {
    if (!colaboradorId || motivoRol.trim().length < 10) return;
    setGuardandoRol(true);
    setResultado(null);
    try {
      const actualizado = await actualizarRolColaboradorAdmin(crearClienteNavegador(), colaboradorId, rolSeleccionado, motivoRol.trim());
      setColaboradores((actuales) => actuales.map((item) => item.id === actualizado.id ? actualizado : item));
      setMotivoRol("");
      setResultado({ tipo: "success", mensaje: `Rol operativo actualizado para ${actualizado.nombre}.` });
      await cargarCapacidades(actualizado.id);
    } catch (e) {
      setResultado({ tipo: "error", mensaje: e instanceof Error ? e.message : "No se pudo actualizar el rol operativo." });
    } finally {
      setGuardandoRol(false);
    }
  }

  function abrirDialogoCapacidad(capacidad = "", accion: AccionCapacidad = "conceder") {
    setCapacidadSeleccionada(capacidad);
    setAccionCapacidad(accion);
    setMotivoCapacidad("");
    setDialogoCapacidad(true);
  }

  async function guardarCapacidad() {
    if (!colaboradorId || !capacidadSeleccionada || motivoCapacidad.trim().length < 10) return;
    setGuardandoCapacidad(true);
    setResultado(null);
    try {
      await concederCapacidadAdmin(
        crearClienteNavegador(),
        colaboradorId,
        capacidadSeleccionada,
        accionCapacidad === "conceder",
        motivoCapacidad.trim()
      );
      setDialogoCapacidad(false);
      setResultado({ tipo: "success", mensaje: accionCapacidad === "conceder" ? "Capacidad concedida." : "Capacidad revocada." });
      await cargarCapacidades(colaboradorId);
    } catch (e) {
      setResultado({ tipo: "error", mensaje: e instanceof Error ? e.message : "No se pudo configurar la capacidad." });
    } finally {
      setGuardandoCapacidad(false);
    }
  }

  async function guardarAltaAdmin() {
    const nombre = nuevoAdmin.nombre.trim();
    const correo = nuevoAdmin.correo.trim().toLowerCase();
    const motivoAlta = nuevoAdmin.motivo.trim();
    if (nombre.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || motivoAlta.length < 10) return;

    setGuardandoAltaAdmin(true);
    setResultado(null);
    try {
      const respuesta = await fetch("/api/admin-auth/invitar-admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nombre,
          correo,
          rol: nuevoAdmin.rol,
          motivo: motivoAlta
        })
      });
      const payload = await respuesta.json().catch(() => ({})) as { admin?: AdminColaborador; error?: string; mensaje?: string };
      if (!respuesta.ok || !payload.admin) {
        throw new Error(payload.mensaje ?? payload.error ?? "No se pudo dar de alta el usuario del panel.");
      }
      setColaboradores((actuales) => [...actuales.filter((item) => item.id !== payload.admin!.id), payload.admin!]
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")));
      setColaboradorId(payload.admin.id);
      setNuevoAdmin({ nombre: "", correo: "", rol: "operador", motivo: "" });
      setDialogoAltaAdmin(false);
      setResultado({ tipo: "success", mensaje: `${payload.admin.nombre} fue dado de alta e invitado al panel.` });
      await cargarCapacidades(payload.admin.id);
    } catch (e) {
      setResultado({ tipo: "error", mensaje: e instanceof Error ? e.message : "No se pudo dar de alta el usuario del panel." });
    } finally {
      setGuardandoAltaAdmin(false);
    }
  }

  if (cargando) return <main className="admin-page-shell"><AdminLoadingState label="Cargando configuración operativa" /></main>;
  if (error) return <main className="admin-page-shell"><AdminErrorState title={error} action={<AdminButton onClick={cargar}>Reintentar</AdminButton>} /></main>;

  return (
    <main className="admin-page-shell">
      <AdminPageHeader
        etiqueta="Administración"
        titulo="Configuración"
        descripcion="Parámetros efectivos de operación, comunicación, finanzas y seguridad. Cada cambio se versiona y audita."
      />

      {resultado && (
        <div role={resultado.tipo === "error" ? "alert" : "status"} className={`mt-5 rounded-xl border px-4 py-3 font-body text-sm ${resultado.tipo === "error" ? "border-ui-danger/30 bg-ui-danger-soft text-ui-danger" : "border-ui-success/30 bg-ui-success-soft text-ui-success"}`}>
          {resultado.mensaje}
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-ui-brand/25 bg-ui-brand-soft p-5" aria-label="Contexto de configuración">
        <div className="flex items-start gap-3">
          <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-ui-brand/40 text-ui-brand-soft-fg" aria-hidden="true">
            <span className="size-2 rounded-full bg-current" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ui-fg">Cerebro normativo de Ruum Ruum</h2>
            <p className="mt-1 max-w-3xl font-body text-sm text-ui-fg-muted">
              Parámetros efectivos de operación, comunicación, finanzas y seguridad. Los cambios sensibles requieren motivo y quedan auditados.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <AdminTabs
          label="Dominios de configuración"
          value={pestañaActiva}
          onValueChange={setPestañaActiva}
          items={[
            { value: "roles", label: "Roles y capacidades" },
            { value: "normativa", label: "Normativa activa" }
          ]}
          renderPanel={() => (
            <div className="pt-5">
              {pestañaActiva === "roles" && (
                <ConfiguracionRoles
                  colaboradores={colaboradores}
                  colaboradorId={colaboradorId}
                  cargandoRoles={cargandoRoles}
                  errorRoles={errorRoles}
                  capacidades={capacidades}
                  rolSeleccionado={rolSeleccionado}
                  motivoRol={motivoRol}
                  onColaboradorChange={setColaboradorId}
                  onRolChange={setRolSeleccionado}
                  onMotivoRolChange={setMotivoRol}
                  onAbrirDialogoRol={() => setDialogoRol(true)}
                  onAbrirDialogoCapacidad={abrirDialogoCapacidad}
                  onAbrirDialogoAltaAdmin={() => setDialogoAltaAdmin(true)}
                  onRecargarRoles={() => void cargarRolesCapacidades()}
                />
              )}
              {pestañaActiva === "normativa" && (
                <ConfiguracionNormativa
                  agrupados={agrupados}
                  categoriasAbiertas={categoriasNormativaAbiertas}
                  onToggleCategoria={(cat) => setCategoriasNormativaAbiertas((act) => ({ ...act, [cat]: !act[cat] }))}
                  onAbrirEditor={abrirEditor}
                />
              )}
            </div>
          )}
        />
      </div>

      <DialogosConfiguracion
        dialogoAltaAdmin={dialogoAltaAdmin}
        guardandoAltaAdmin={guardandoAltaAdmin}
        nuevoAdmin={nuevoAdmin}
        onNuevoAdminChange={setNuevoAdmin}
        onCerrarAltaAdmin={() => setDialogoAltaAdmin(false)}
        onGuardarAltaAdmin={guardarAltaAdmin}

        dialogoRol={dialogoRol}
        guardandoRol={guardandoRol}
        colaboradorSeleccionado={colaboradorSeleccionado}
        rolSeleccionado={rolSeleccionado}
        motivoRol={motivoRol}
        onMotivoRolChange={setMotivoRol}
        onCerrarDialogoRol={() => setDialogoRol(false)}
        onConfirmarRol={async () => {
          await guardarRolColaborador();
          setDialogoRol(false);
        }}

        dialogoCapacidad={dialogoCapacidad}
        guardandoCapacidad={guardandoCapacidad}
        capacidadSeleccionada={capacidadSeleccionada}
        accionCapacidad={accionCapacidad}
        motivoCapacidad={motivoCapacidad}
        capacidadesCatalogoFiltradas={capacidadesCatalogoFiltradas}
        onCapacidadChange={setCapacidadSeleccionada}
        onAccionCapacidadChange={setAccionCapacidad}
        onMotivoCapacidadChange={setMotivoCapacidad}
        onCerrarDialogoCapacidad={() => setDialogoCapacidad(false)}
        onGuardarCapacidad={guardarCapacidad}

        editando={editando}
        guardandoNorma={guardando}
        json={json}
        jsonError={jsonError}
        motivoNorma={motivo}
        onJsonChange={(sig) => { setJson(sig); setJsonError(null); }}
        onMotivoNormaChange={setMotivo}
        onCerrarEditorNorma={() => setEditando(null)}
        onGuardarNorma={guardar}
      />
    </main>
  );
}
