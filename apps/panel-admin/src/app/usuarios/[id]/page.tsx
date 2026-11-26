"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Aviso, Tabs } from "@ruum/ui";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import {
  obtenerUsuarioAdmin,
  listarSesionesUsuario,
  listarPagosDeUsuario,
  listarIncidenciasDeUsuario,
  obtenerAuditoriaUsuario,
  listarTrasladosDeUsuario
} from "@ruum/api/services";
import type {
  UsuarioRow,
  Tab,
  ConteosTabs
} from "./UsuarioDetalleTipos";
import {
  TAB_ETIQUETAS,
  aTitleCase
} from "./UsuarioDetalleTipos";
import {
  ToastAviso,
  ResumenUsuarioSticky,
  ResumenActividad
} from "./UsuarioDetalleComponentes";
import {
  TabDatos,
  TabTraslados,
  TabPagos,
  TabIncidencias,
  TabSesiones,
  TabAuditoria
} from "./UsuarioDetalleTabs";
import { TabPrivacidad } from "./UsuarioDetallePrivacidad";

export default function PaginaDetalleUsuario() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("datos");
  const [usuario, setUsuario] = useState<UsuarioRow | null>(null);
  const [conteosTabs, setConteosTabs] = useState<ConteosTabs>({});
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    if (!tieneSupabaseConfigurado()) {
      setCargando(false);
      return;
    }
    try {
      const cliente = crearClienteNavegador();
      setUsuario(await obtenerUsuarioAdmin(cliente, id));
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!aviso) return;
    const timer = window.setTimeout(() => setAviso(null), 4000);
    return () => window.clearTimeout(timer);
  }, [aviso]);

  useEffect(() => {
    if (!usuario || !tieneSupabaseConfigurado()) return;
    const usuarioActual = usuario;
    let cancelado = false;
    setConteosTabs({
      Traslados: null,
      pagos: null,
      incidencias: null,
      sesiones: null,
      auditoria: null
    });

    async function cargarConteos() {
      const cliente = crearClienteNavegador();
      const resultados = await Promise.allSettled([
        listarTrasladosDeUsuario(cliente, usuarioActual.id),
        listarPagosDeUsuario(cliente, usuarioActual.id),
        listarIncidenciasDeUsuario(cliente, usuarioActual.id),
        listarSesionesUsuario(cliente, usuarioActual.id),
        obtenerAuditoriaUsuario(cliente, usuarioActual.id)
      ]);
      if (cancelado) return;
      const longitud = (resultado: PromiseSettledResult<unknown[]>) =>
        resultado.status === "fulfilled" ? resultado.value.length : 0;
      setConteosTabs({
        Traslados: longitud(resultados[0]),
        pagos: longitud(resultados[1]),
        incidencias: longitud(resultados[2]),
        sesiones: longitud(resultados[3]),
        auditoria: longitud(resultados[4])
      });
    }

    void cargarConteos();
    return () => {
      cancelado = true;
    };
  }, [usuario]);

  if (cargando) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="font-body text-ui-fg-muted">Cargando...</p>
      </main>
    );
  }

  if (!usuario) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Aviso tono="danger">No se encontró el usuario.</Aviso>
        <Link href="/usuarios" className="mt-4 inline-block font-body text-sm text-ui-brand hover:underline">
          Volver a usuarios
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8 sm:py-10">
      <div className="sticky top-0 z-20 -mx-6 border-b border-ui-line bg-ui-bg px-6 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <Link
          href="/usuarios"
          className="inline-flex items-center gap-2 rounded-lg border border-ui-line bg-ui-card px-3 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted"
        >
          <span aria-hidden="true">&larr;</span>
          Volver a lista de usuarios
        </Link>
      </div>

      {aviso && <ToastAviso aviso={aviso} onCerrar={() => setAviso(null)} />}

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <ResumenUsuarioSticky usuario={usuario} />

        <div className="min-w-0">
          <div className="rounded-lg border border-ui-line bg-ui-card p-5">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="font-body text-xs font-semibold uppercase tracking-[0.16em] text-ui-fg-muted">Perfil de usuario</p>
                <h1 className="mt-1 font-display text-2xl font-semibold text-ui-fg">{aTitleCase(usuario.nombre) || "Usuario sin nombre"}</h1>
                <p className="mt-1 font-body text-sm text-ui-fg-muted">{usuario.correo_facturacion ?? "Sin correo registrado"}</p>
              </div>
              <ResumenActividad conteos={conteosTabs} onSeleccionarTab={setTab} />
            </div>
          </div>

          <Tabs
            etiqueta="Secciones del usuario"
            tabs={(Object.keys(TAB_ETIQUETAS) as Tab[]).map((id) => ({
              id,
              etiqueta: TAB_ETIQUETAS[id],
              conteo: conteosTabs[id] ?? undefined
            }))}
            value={tab}
            onSeleccion={(id) => setTab(id as Tab)}
            renderPanel={() => (
              <div className="mt-6">
                {tab === "datos" && <TabDatos usuario={usuario} onActualizado={(u) => setUsuario(u)} onAviso={setAviso} />}
                {tab === "Traslados" && <TabTraslados usuarioId={usuario.id} />}
                {tab === "pagos" && <TabPagos usuarioId={usuario.id} />}
                {tab === "incidencias" && <TabIncidencias usuarioId={usuario.id} />}
                {tab === "sesiones" && <TabSesiones usuarioId={usuario.id} />}
                {tab === "privacidad" && <TabPrivacidad usuario={usuario} onActualizado={() => void cargar()} />}
                {tab === "auditoria" && <TabAuditoria usuarioId={usuario.id} />}
              </div>
            )}
          />
        </div>
      </div>
    </main>
  );
}
