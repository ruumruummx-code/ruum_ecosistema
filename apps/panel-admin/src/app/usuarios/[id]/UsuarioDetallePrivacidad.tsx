"use client";

import { useState } from "react";
import { Aviso } from "@ruum/ui";
import { AdminBadge, AdminDialog } from "../../admin-components";
import {
  actualizarUsuarioAdmin,
  listarTrasladosDeUsuario,
  listarPagosDeUsuario
} from "@ruum/api/services";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import type {
  UsuarioRow,
  PagosRow,
  ViajeRow,
  FormatoExportacionPrivacidad,
  BitacoraPrivacidad
} from "./UsuarioDetalleTipos";
import {
  estadoDocumentoIdentidad,
  formatearFechaOperativa,
  formatearTelefono
} from "./UsuarioDetalleTipos";
import { MinimizacionItem } from "./UsuarioDetalleComponentes";

function escaparPdf(valor: string) {
  return valor.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function crearPdfSimple(texto: string) {
  const lineas = texto.split("\n").slice(0, 32);
  const contenido = ["BT", "/F1 12 Tf", "50 780 Td", ...lineas.flatMap((linea, indice) => [`${indice === 0 ? "" : "0 -18 Td"}(${escaparPdf(linea)}) Tj`]), "ET"].join("\n");
  const objetos = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${contenido.length} >> stream\n${contenido}\nendstream endobj`
  ];
  let salida = "%PDF-1.4\n";
  const offsets = [0];
  for (const objeto of objetos) {
    offsets.push(salida.length);
    salida += `${objeto}\n`;
  }
  const xref = salida.length;
  salida += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  salida += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  salida += `trailer << /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return salida;
}

function crearCsvPrivacidad(datos: { usuario: UsuarioRow; Traslados: ViajeRow[]; pagos: PagosRow[]; exportado_en: string }) {
  const filas = [
    ["seccion", "campo", "valor"],
    ["usuario", "id", datos.usuario.id],
    ["usuario", "nombre", datos.usuario.nombre ?? ""],
    ["usuario", "telefono", datos.usuario.telefono ?? ""],
    ["usuario", "correo_facturacion", datos.usuario.correo_facturacion ?? ""],
    ["usuario", "estado_cuenta", datos.usuario.estado_cuenta ?? "activa"],
    ["usuario", "estado_verificacion", datos.usuario.estado_verificacion],
    ["resumen", "traslados", String(datos.Traslados.length)],
    ["resumen", "pagos", String(datos.pagos.length)],
    ["exportacion", "exportado_en", datos.exportado_en]
  ];
  return filas.map((fila) => fila.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(",")).join("\n");
}

function crearTextoPdfPrivacidad(datos: { usuario: UsuarioRow; Traslados: ViajeRow[]; pagos: PagosRow[]; exportado_en: string }) {
  return [
    "Exportación de datos personales",
    `Usuario: ${datos.usuario.id}`,
    `Nombre: ${datos.usuario.nombre ?? "Sin dato"}`,
    `Teléfono: ${formatearTelefono(datos.usuario.telefono) ?? "Sin dato"}`,
    `Correo de facturación: ${datos.usuario.correo_facturacion ?? "Sin dato"}`,
    `Estado de cuenta: ${datos.usuario.estado_cuenta ?? "activa"}`,
    `Estado de verificación: ${datos.usuario.estado_verificacion}`,
    `Traslados incluidos: ${datos.Traslados.length}`,
    `Pagos incluidos: ${datos.pagos.length}`,
    `Exportado: ${formatearFechaOperativa(datos.exportado_en)}`
  ].join("\n");
}

function crearArchivoExportacionPrivacidad(datos: { usuario: UsuarioRow; Traslados: ViajeRow[]; pagos: PagosRow[]; exportado_en: string; formato: FormatoExportacionPrivacidad }, formato: FormatoExportacionPrivacidad) {
  if (formato === "json") return new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  if (formato === "csv") return new Blob([crearCsvPrivacidad(datos)], { type: "text/csv;charset=utf-8" });
  return new Blob([crearPdfSimple(crearTextoPdfPrivacidad(datos))], { type: "application/pdf" });
}

export function TabPrivacidad({ usuario, onActualizado }: { usuario: UsuarioRow; onActualizado: () => void }) {
  const [anonimizando, setAnonimizando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [formatoExportacion, setFormatoExportacion] = useState<FormatoExportacionPrivacidad>("json");
  const [confirmandoAnonimizacion, setConfirmandoAnonimizacion] = useState(false);
  const [confirmacionAnonimizacion, setConfirmacionAnonimizacion] = useState("");
  const [bitacora, setBitacora] = useState<BitacoraPrivacidad[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const documento = estadoDocumentoIdentidad(usuario);

  async function anonimizarDatos() {
    if (confirmacionAnonimizacion !== "ANONIMIZAR") return;
    setAnonimizando(true);
    setAviso(null);
    try {
      const cliente = crearClienteNavegador();
      await actualizarUsuarioAdmin(cliente, usuario.id, {
        nombre: "[anonimizado]",
        telefono: null,
        correo_facturacion: null,
        calle: null, numero: null, colonia: null, ciudad: null, estado: null, pais: null, codigo_postal: null,
        direccion_principal: null, foto_url: null
      });
      setAviso("Datos anonimizados correctamente.");
      setBitacora((actual) => [{ tipo: "anonimizacion", fecha: new Date().toISOString(), detalle: "Anonimización ejecutada desde panel admin." }, ...actual]);
      setConfirmandoAnonimizacion(false);
      setConfirmacionAnonimizacion("");
      onActualizado();
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "Error al anonimizar.");
    } finally { setAnonimizando(false); }
  }

  async function exportarDatos() {
    setExportando(true);
    setAviso(null);
    try {
      const cliente = crearClienteNavegador();
      const [Traslados, pagos] = await Promise.all([
        listarTrasladosDeUsuario(cliente, usuario.id),
        listarPagosDeUsuario(cliente, usuario.id)
      ]);
      const datos = { usuario, Traslados, pagos, exportado_en: new Date().toISOString(), formato: formatoExportacion };
      const blob = crearArchivoExportacionPrivacidad(datos, formatoExportacion);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `datos-usuario-${usuario.id}.${formatoExportacion}`; a.click();
      URL.revokeObjectURL(url);
      setAviso("Exportación completada.");
      setBitacora((actual) => [{ tipo: "exportacion", fecha: new Date().toISOString(), detalle: `Exportación ${formatoExportacion.toUpperCase()} generada.` }, ...actual]);
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "Error al exportar.");
    } finally { setExportando(false); }
  }

  return (
    <div className="space-y-6">
      {aviso && <Aviso tono="info">{aviso}</Aviso>}

      <div className="rounded-lg border border-ui-line bg-ui-card p-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ui-fg-muted">Exportar datos</h3>
        <p className="mt-1 font-body text-sm text-ui-fg-muted">Descarga información del usuario, traslados y pagos para migración o solicitudes de derechos de datos.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs font-medium text-ui-fg-muted">Formato de exportación</span>
            <select value={formatoExportacion} onChange={(evento) => setFormatoExportacion(evento.target.value as FormatoExportacionPrivacidad)} className="rounded-lg border border-ui-line-strong px-3 py-2 font-body text-sm focus:border-ui-focus focus:outline-none focus:ring-2 focus:ring-ui-ring">
              <option value="json">JSON - desarrolladores / migraciones</option>
              <option value="pdf">PDF - solicitudes ARCO / GDPR / Ley de datos</option>
              <option value="csv">CSV - revisión tabular</option>
            </select>
          </label>
          <button onClick={exportarDatos} disabled={exportando}
            className="self-end rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-semibold hover:bg-ui-muted disabled:opacity-50"
          >{exportando ? "Exportando..." : "Exportar datos"}</button>
        </div>
      </div>

      <div className="rounded-lg border border-ui-danger/35 bg-ui-danger-soft p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <AdminBadge tone="danger">Zona de seguridad</AdminBadge>
            <h3 className="mt-3 font-display text-sm font-semibold uppercase tracking-wide text-ui-danger">Anonimizar datos personales</h3>
            <p className="mt-1 font-body text-sm text-ui-fg-muted">Reemplaza datos personales con valores anonimizados. Los traslados e historial se conservan para referencia operativa y obligaciones aplicables.</p>
          </div>
          <button onClick={() => setConfirmandoAnonimizacion(true)} disabled={anonimizando}
            className="rounded-lg border border-ui-danger bg-ui-card px-4 py-2 font-body text-sm font-semibold text-ui-danger hover:bg-ui-danger hover:text-ui-on-brand disabled:opacity-50"
          >Anonimizar datos</button>
        </div>
      </div>

      <div className="rounded-lg border border-ui-line bg-ui-card p-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ui-fg-muted">Minimización de datos</h3>
        <p className="mt-1 font-body text-sm text-ui-fg-muted">El sistema solo conserva los datos estrictamente necesarios para la operación. Los documentos de identidad antiguos se eliminan automáticamente tras 90 días.</p>
        <div className="mt-4 grid gap-3">
          <MinimizacionItem estado="Activo" tono="info" titulo="Datos personales básicos" detalle="Nombre, teléfono y correo necesarios para atención operativa." />
          <MinimizacionItem estado="Fiscal" tono="warning" titulo="Dirección fiscal" detalle="Conservada para facturación y obligaciones administrativas." />
          <MinimizacionItem estado="Retenido" tono="warning" titulo="Historial de traslados" detalle="Conservado por trazabilidad operativa y obligación fiscal." />
          <MinimizacionItem estado={documento.estado} tono={documento.tono} titulo="Documento de identidad" detalle={documento.detalle} />
        </div>
      </div>

      <div className="rounded-lg border border-ui-line bg-ui-card p-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ui-fg-muted">Bitácora de solicitudes</h3>
        {bitacora.length ? (
          <div className="mt-3 space-y-2">
            {bitacora.map((evento) => (
              <div key={`${evento.tipo}-${evento.fecha}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ui-line px-3 py-2">
                <span className="font-body text-sm text-ui-fg">{evento.detalle}</span>
                <span className="font-mono-ruum text-xs text-ui-fg-muted">{formatearFechaOperativa(evento.fecha)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 font-body text-sm text-ui-fg-muted">Sin solicitudes registradas en esta sesión.</p>
        )}
      </div>

      <AdminDialog
        open={confirmandoAnonimizacion}
        title="Confirmar anonimización"
        description="Esta acción no se puede deshacer desde el panel. Escribe ANONIMIZAR para continuar."
        onOpenChange={(open) => { if (!anonimizando) setConfirmandoAnonimizacion(open); }}
        footer={
          <>
            <button type="button" onClick={() => setConfirmandoAnonimizacion(false)} disabled={anonimizando} className="rounded-lg border border-ui-line-strong px-4 py-2 font-body text-sm font-semibold text-ui-fg hover:bg-ui-muted">Cancelar</button>
            <button type="button" onClick={anonimizarDatos} disabled={anonimizando || confirmacionAnonimizacion !== "ANONIMIZAR"} className="rounded-lg bg-ui-danger px-4 py-2 font-body text-sm font-semibold text-ui-on-brand disabled:opacity-50">{anonimizando ? "Anonimizando..." : "Anonimizar definitivamente"}</button>
          </>
        }
      >
        <label className="flex flex-col gap-1">
          <span className="font-body text-xs font-medium text-ui-fg-muted">Confirmación requerida</span>
          <input value={confirmacionAnonimizacion} onChange={(evento) => setConfirmacionAnonimizacion(evento.target.value)} className="rounded-lg border border-ui-danger/30 px-3 py-2 font-body text-sm focus:border-ui-danger focus:outline-none focus:ring-2 focus:ring-ui-danger/20" />
        </label>
      </AdminDialog>
    </div>
  );
}
