"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Aviso } from "@ruum/ui";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "@/lib/supabase-browser";
import {
  obtenerConductorAdmin,
  obtenerVehiculosDeConductorAdmin,
  obtenerEmpresaDeConductorAdmin,
  obtenerHistorialEstatusConductorAdmin,
  verificarVigenciasDocumentosConductor
} from "@ruum/api/services";
import { obtenerDocumentosConductorAdmin, obtenerSolicitudRecienteConductorAdmin } from "@ruum/api/drivers";
import {
  ESTADO_CLASE,
  ESTADOS_SUSPENDIDOS,
  Dato,
  FilaDocumento,
  Seccion,
  domicilioFormateado,
  estadoCumplimientoDocumentos,
  fecha,
  mapaHref,
  subtituloConductor,
  telefonoHref,
  textoEstado,
  type ConductorRow,
  type DocumentoRow,
  type EmpresaRow,
  type HistorialEstatus,
  type VehiculoRow
} from "./ConductorActivoComponentes";
import { DarBajaConductor, ReactivarConductor, SuspenderConductor } from "./AccionesConductorActivo";
import { EditarConductor } from "./EditarConductorActivo";

export default function PaginaDetalleConductorAdmin() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const solicitudParam = searchParams.get("solicitud");

  const [conductor, setConductor] = useState<ConductorRow | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoRow[]>([]);
  const [, setVehiculos] = useState<VehiculoRow[]>([]);
  const [, setEmpresa] = useState<EmpresaRow | null>(null);
  const [, setHistorial] = useState<HistorialEstatus[]>([]);
  const [pasaporteHref, setPasaporteHref] = useState<string | null>(
    solicitudParam ? `/conductores/${solicitudParam}` : null
  );
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<{ tono: "info" | "danger"; texto: string } | null>(null);
  const [editandoDatos, setEditandoDatos] = useState(false);

  const cargar = useCallback(async () => {
    if (!tieneSupabaseConfigurado()) {
      setCargando(false);
      return;
    }
    try {
      const cliente = crearClienteNavegador();
      const c = await obtenerConductorAdmin(cliente, id);
      setConductor(c);
      const [d, v, e, h, solicitud] = await Promise.all([
        obtenerDocumentosConductorAdmin(cliente, id).catch(() => []),
        obtenerVehiculosDeConductorAdmin(cliente, id).catch(() => []),
        obtenerEmpresaDeConductorAdmin(cliente, id).catch(() => null),
        obtenerHistorialEstatusConductorAdmin(cliente, id).catch(() => []),
        solicitudParam
          ? Promise.resolve({ id: solicitudParam })
          : obtenerSolicitudRecienteConductorAdmin(cliente, id).catch(() => null)
      ]);
      void verificarVigenciasDocumentosConductor(cliente, id).catch(() => undefined);
      setDocumentos(d);
      setVehiculos(v);
      setEmpresa(e);
      setHistorial(h);
      if (solicitud?.id) setPasaporteHref(`/conductores/${solicitud.id}`);
    } catch {
      setConductor(null);
    } finally {
      setCargando(false);
    }
  }, [id, solicitudParam]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="font-body text-ui-fg-muted">Cargando…</p>
      </main>
    );
  }

  if (!conductor) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Aviso tono="danger">No se encontró el conductor.</Aviso>
        <Link
          href={pasaporteHref ?? "/conductores"}
          className="mt-4 inline-block font-body text-sm text-ui-brand hover:underline"
        >
          Volver
        </Link>
      </main>
    );
  }

  const documentosActuales = Object.entries(
    documentos.reduce(
      (acc, doc) => {
        if (!acc[doc.tipo] || doc.version > acc[doc.tipo].version) acc[doc.tipo] = doc;
        return acc;
      },
      {} as Record<string, DocumentoRow>
    )
  ).map(([, doc]) => doc);
  const domicilio = domicilioFormateado(conductor);
  const mapa = mapaHref(conductor);
  const cumplimientoDocumentos = estadoCumplimientoDocumentos(documentosActuales);
  const telefonoPrincipal = telefonoHref(conductor.telefono);
  const telefonoEmergencia = telefonoHref(conductor.contacto_emergencia_telefono);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={pasaporteHref ?? "/conductores/activos"} className="font-body text-sm text-ui-fg-muted hover:text-ui-fg">
            &larr; Volver
          </Link>
          <Link href="/conductores/activos" className="font-body text-sm text-ui-brand-soft-fg hover:underline">
            Conductores activos
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="#editar-datos"
            onClick={() => setEditandoDatos(true)}
            className="inline-flex min-h-10 items-center rounded-lg border border-ui-line-strong bg-ui-card px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted"
          >
            Editar datos
          </a>
          {pasaporteHref && (
            <Link
              href={pasaporteHref}
              className="inline-flex min-h-10 items-center rounded-lg border border-ui-brand/30 bg-ui-brand-soft px-4 py-2 font-body text-sm font-semibold text-ui-brand-soft-fg hover:bg-ui-brand-soft"
            >
              Abrir Pasaporte Digital
            </Link>
          )}
          <a
            href={telefonoPrincipal ?? undefined}
            aria-disabled={!telefonoPrincipal}
            className="inline-flex min-h-10 items-center rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-on-brand hover:bg-ui-brand/90 aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            Llamar
          </a>
          {ESTADOS_SUSPENDIDOS.has(conductor.estado) && (
            <ReactivarConductor
              conductorId={conductor.id}
              onCompletado={() => {
                void cargar();
                setAviso({ tono: "info", texto: "Conductor reactivado." });
              }}
              compacto
            />
          )}
        </div>
      </div>

      {aviso && (
        <div className="mt-4">
          <Aviso tono={aviso.tono}>{aviso.texto}</Aviso>
        </div>
      )}

      <header className="mt-6 rounded-lg border border-ui-line bg-ui-card p-5 shadow-ui-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold">{conductor.nombre}</h1>
            <p className="mt-1 font-body text-sm font-medium text-ui-fg-muted">{subtituloConductor(conductor)}</p>
            <p className="mt-2 max-w-2xl font-body text-sm text-ui-fg-muted">
              Ficha ejecutiva para operar la cuenta del conductor. El expediente documental y la trazabilidad viven en el
              Pasaporte Digital.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 font-body text-xs font-medium ${ESTADO_CLASE[conductor.estado] ?? ""}`}>
              {textoEstado(conductor.estado)}
            </span>
            <span className={`rounded-full border px-3 py-1 font-body text-xs font-medium ${cumplimientoDocumentos.clase}`}>
              {cumplimientoDocumentos.texto}
            </span>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-6">
          <Seccion titulo="Resumen" tono="resumen">
            <Dato etiqueta="Nombre" valor={conductor.nombre} />
            <Dato etiqueta="Estado" valor={textoEstado(conductor.estado)} />
            <Dato etiqueta="Teléfono" valor={conductor.telefono} copiar llamarHref={telefonoPrincipal} />
            <Dato etiqueta="CURP" valor={conductor.curp} copiar />
            <Dato etiqueta="Licencia" valor={conductor.licencia_numero} copiar />
          </Seccion>

          <Seccion titulo="Datos personales" tono="personales">
            <Dato etiqueta="Tipo licencia" valor={conductor.licencia_tipo} />
            <Dato etiqueta="Vigencia de licencia" valor={conductor.licencia_vigencia} destacado />
            <Dato etiqueta="Contacto emergencia" valor={conductor.contacto_emergencia_nombre} />
            <Dato etiqueta="Tel. emergencia" valor={conductor.contacto_emergencia_telefono} copiar llamarHref={telefonoEmergencia} />
          </Seccion>

          <Seccion titulo="Domicilio" tono="domicilio">
            <div className="rounded-xl border border-ui-line bg-ui-card px-4 py-3">
              {domicilio.length > 0 ? (
                <address className="not-italic font-body text-sm leading-6 text-ui-fg">
                  {domicilio.map((linea) => (
                    <span key={linea} className="block">
                      {linea}
                    </span>
                  ))}
                </address>
              ) : (
                <p className="font-body text-sm text-ui-fg-muted">Sin domicilio registrado.</p>
              )}
              {mapa && (
                <a
                  href={mapa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-10 items-center rounded-lg border border-ui-brand/30 px-3 py-2 font-body text-sm font-semibold text-ui-brand-soft-fg hover:bg-ui-brand-soft"
                >
                  Ver en mapa
                </a>
              )}
            </div>
          </Seccion>

          <Seccion titulo="Fechas" tono="fechas">
            <Dato etiqueta="Vigencia" valor={conductor.licencia_vigencia ? `Vigencia ${conductor.licencia_vigencia}` : null} destacado />
            <Dato etiqueta="Registrado" valor={`Registrado ${fecha(conductor.creado_en)}`} />
            <Dato etiqueta="Actualizado" valor={`Actualizado ${fecha(conductor.actualizado_en)}`} />
          </Seccion>

          <section id="editar-datos" className="scroll-mt-8 rounded-lg border border-ui-line bg-ui-card p-4">
            <EditarConductor
              conductor={conductor}
              editando={editandoDatos}
              setEditando={setEditandoDatos}
              onActualizado={(c) => {
                setConductor(c);
                setAviso({ tono: "info", texto: "Conductor actualizado." });
              }}
            />
          </section>
        </section>

        <section className="space-y-6">
          <Seccion titulo="Acciones" tono="acciones">
            <div className="grid gap-3">
              {telefonoPrincipal ? (
                <a
                  href={telefonoPrincipal}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-on-brand hover:bg-ui-brand/90"
                >
                  Llamar
                </a>
              ) : (
                <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ui-line px-4 py-2 font-body text-sm text-ui-fg-muted">
                  Sin teléfono
                </span>
              )}
              {conductor.estado === "activo" && (
                <SuspenderConductor
                  conductor={conductor}
                  onCompletado={() => {
                    void cargar();
                    setAviso({ tono: "info", texto: "Conductor suspendido." });
                  }}
                />
              )}
              {ESTADOS_SUSPENDIDOS.has(conductor.estado) && (
                <ReactivarConductor
                  conductorId={conductor.id}
                  onCompletado={() => {
                    void cargar();
                    setAviso({ tono: "info", texto: "Conductor reactivado." });
                  }}
                />
              )}
              {conductor.estado !== "bloqueado_permanente" && (
                <details className="rounded-lg border border-ui-line bg-ui-card">
                  <summary className="cursor-pointer px-4 py-3 font-body text-sm font-semibold text-ui-fg">
                    Más acciones
                  </summary>
                  <div className="border-t border-ui-line p-3">
                    <DarBajaConductor
                      conductor={conductor}
                      onCompletado={() => {
                        void cargar();
                        setAviso({ tono: "info", texto: "Conductor dado de baja." });
                      }}
                    />
                  </div>
                </details>
              )}
            </div>
          </Seccion>

          <div className="rounded-lg border border-ui-line bg-ui-brand-soft p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">Documentos</h2>
              <span className={`rounded-full border px-3 py-1 font-body text-xs font-semibold ${cumplimientoDocumentos.clase}`}>
                {cumplimientoDocumentos.texto}
              </span>
            </div>
            <p className="mt-2 font-body text-sm text-ui-fg-muted">
              Resumen operativo de cumplimiento. Revisa archivos, validaciones e historial en el Pasaporte Digital.
            </p>
            {documentosActuales.length === 0 ? (
              <p className="font-body text-sm text-ui-fg-muted">Sin documentos registrados.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {documentosActuales.map((doc) => (
                  <FilaDocumento key={doc.id} documento={doc} />
                ))}
              </div>
            )}
            {pasaporteHref ? (
              <Link
                href={pasaporteHref}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-ui-brand px-4 py-2 font-body text-sm font-semibold text-ui-on-brand hover:bg-ui-brand-hover"
              >
                Abrir expediente completo
              </Link>
            ) : (
              <p className="mt-4 rounded-lg border border-ui-warning/30 bg-ui-warning-soft px-3 py-2 font-body text-sm text-ui-warning">
                No encontramos una solicitud vinculada para abrir el Pasaporte Digital.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
