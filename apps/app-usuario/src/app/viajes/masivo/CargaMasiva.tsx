"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  Headphones,
  Info,
  Lightbulb,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  MoreVertical,
  ShieldCheck,
  TriangleAlert,
  Upload,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { Badge, Button, Card, Input, Sheet, cn } from "@ruum/ui/base";
import { useFormatoDistancia } from "@/lib/use-formato-distancia";
import { PagoStripe } from "@/app/PagoStripe";
import { ETIQUETAS_CAMPOS_MASIVOS, motivosFilaMasiva, numeroFilaExcel } from "@/lib/carga-masiva";
import { useCargaMasivaPantalla, type CargaRecienteItem } from "./useCargaMasivaPantalla";

/* Campos que la tabla edita en su propia columna; el resto se edita junto al estado. */
const CAMPOS_EN_COLUMNA = ["marca", "modelo", "origenCodigoPostal", "destinoCodigoPostal", "entregaTelefono", "recepcionTelefono"];
const CAMPOS_DIRECCION = ["origen_calle", "origen_numero", "origen_colonia", "destino_calle", "destino_numero", "destino_colonia"];

const PASOS_GUIA = [
  "Descarga la plantilla oficial",
  "Llena la información de tus traslados",
  "Sube el archivo y nosotros lo procesamos",
  "Consulta el resultado y cotiza en segundos",
];

const BENEFICIOS = [
  { titulo: "Rápido", texto: "Procesa múltiples traslados en segundos", Icono: Zap },
  { titulo: "Seguro", texto: "Tus datos están protegidos", Icono: ShieldCheck },
  { titulo: "Sin errores", texto: "Validaciones automáticas del archivo", Icono: Users },
  { titulo: "Más control", texto: "Consulta el historial de tus cargas", Icono: Clock },
];

const ESTADO_CARGA: Record<CargaRecienteItem["estado"], { tone: "success" | "warning" | "danger"; Icono: typeof CheckCircle2 }> = {
  Completado: { tone: "success", Icono: CheckCircle2 },
  "En proceso": { tone: "warning", Icono: Clock },
  "Con errores": { tone: "danger", Icono: XCircle },
};

/* En móvil cada fila de tabla se muestra como tarjeta; la etiqueta de la columna
   aparece encima del valor y se oculta desde lg, donde vuelve el encabezado. */
const TABLA = "block w-full text-left text-sm lg:table lg:border-collapse";
const CABECERA = "hidden border-b border-ui-line text-xs font-semibold text-ui-fg-muted lg:table-header-group";
const CUERPO = "block divide-y divide-ui-line lg:table-row-group";
const CELDA = "block lg:table-cell lg:px-3 lg:py-3 lg:align-top";

function EtiquetaMovil({ children }: { children: React.ReactNode }) {
  return <span className="mb-0.5 block text-xs font-medium text-ui-fg-muted lg:hidden">{children}</span>;
}

function Aviso({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="alert" className={cn("flex flex-col gap-3 rounded-lg border border-ui-danger bg-ui-danger-soft p-4 text-sm text-ui-fg sm:flex-row sm:items-center sm:justify-between", className)}>
      {children}
    </div>
  );
}

function formatoMXN(valor: number) {
  return valor.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Carga masiva de traslados: una sola pantalla responsiva. `page.tsx` la monta
 * una vez dentro del marco de navegación que corresponde al tamaño.
 */
export function CargaMasiva() {
  const router = useRouter();
  const formatearDistancia = useFormatoDistancia();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    estado,
    progreso,
    error,
    filasVisibles,
    filasConError,
    filasCorrectas,
    todasListas,
    totalMXN,
    pagoConfirmado,
    pagoEnConciliacion,
    cargaId,
    stripeClientSecret,
    nombreArchivo,
    arrastrando,
    setArrastrando,
    toast,
    cerrarToast,
    validarYProcesarArchivo,
    cargasRecientes,
    cargasPendientes,
    cargandoPendientes,
    errorPendientes,
    refrescarPendientes,
    handleReanudarCarga,
    handleDescartarCarga,
    handleCancelarCarga,
    pago,
    setPago,
    conciliando,
    errorPago,
    verificarPago,
    geocodificarYCotizar,
    cotizarSoloValidas,
    eliminarFila,
    menuAbiertoId,
    toggleMenu,
    guiaModalAbierto,
    setGuiaModalAbierto,
    modalDetalleData,
    abrirDetalle,
    cerrarDetalle,
    handleDescargarReporte,
    handleDescargarDetalleActivo,
    handleCopiarResumen,
    filaEditando,
    iniciarEdicionFila,
    cancelarEdicionFila,
    guardarEdicionFila,
    filtroTab,
    setFiltroTab,
  } = useCargaMasivaPantalla();

  // Campos modificados mientras se edita una fila
  const [datosEdicion, setDatosEdicion] = useState<Record<string, string>>({});

  // Escape cierra el menú contextual abierto
  useEffect(() => {
    if (!menuAbiertoId) return;
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === "Escape") toggleMenu(menuAbiertoId);
    };
    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [menuAbiertoId, toggleMenu]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void validarYProcesarArchivo(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void validarYProcesarArchivo(file);
    e.target.value = "";
  };

  const filasFiltradas = filasVisibles.filter((f) => {
    if (filtroTab === "validas") return f.estado === "correcto" && !f.errorCotizacion && !f.validando;
    if (filtroTab === "errores") return f.estado === "error" || Boolean(f.errorCotizacion);
    return true;
  });

  const filasCotizadas = filasVisibles.filter((f) => !f.eliminada && f.tarifa != null);
  const totalFormateado = formatoMXN(totalMXN);

  const filtros = [
    { id: "todas" as const, etiqueta: `Todas (${filasVisibles.length})` },
    { id: "validas" as const, etiqueta: `Válidas (${filasCorrectas.length})` },
    { id: "errores" as const, etiqueta: `Con incidencias (${filasConError.length})` },
  ];

  return (
    <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-5 bg-ui-bg px-4 pt-4 pb-[calc(var(--user-mobile-nav-height,5rem)+1.5rem)] text-ui-fg sm:px-6 sm:pt-6 lg:gap-6 lg:px-8 lg:pb-8">
      {errorPendientes && (
        <Aviso>
          <span>No pudimos actualizar tus cargas pendientes: {errorPendientes}.</span>
          <Button variant="outline" size="sm" disabled={cargandoPendientes} onClick={() => void refrescarPendientes()}>
            Reintentar consulta
          </Button>
        </Aviso>
      )}
      {estado === "idle" && error && <Aviso>{error}</Aviso>}

      <nav aria-label="Migas de pan" className="flex items-center gap-2 text-sm text-ui-fg-muted">
        <Button variant="ghost" size="sm" className="-ml-3" onClick={() => router.back()}>
          <ArrowLeft aria-hidden="true" />
          <span>Volver</span>
        </Button>
        <span aria-hidden="true" className="text-ui-line-strong">|</span>
        <Link href="/mis-viajes" className="hover:text-ui-brand hover:underline">
          Traslados
        </Link>
        <ChevronRight aria-hidden="true" className="size-4" />
        <span className="font-semibold text-ui-fg" aria-current="location">
          Carga Masiva
        </span>
      </nav>

      {pagoConfirmado ? (
        <Card asChild className="mx-auto w-full max-w-2xl p-6 text-center sm:p-10">
          <section aria-label="Confirmación de pago masivo" className="flex flex-col items-center">
            <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-ui-success-soft text-ui-success sm:size-20">
              <CheckCircle2 className="size-8 sm:size-10" />
            </span>
            <h2 className="mt-5 text-2xl font-bold tracking-tight">¡Carga masiva procesada y confirmada!</h2>
            <p className="mt-2 max-w-md text-sm text-ui-fg-muted">
              Tu pago consolidado de <strong className="text-ui-fg">${totalFormateado} MXN</strong> fue acreditado exitosamente. Se han generado{" "}
              <strong className="text-ui-fg">{filasCorrectas.length}</strong> traslados vinculados a tu cuenta y Pasaporte Digital.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild>
                <Link href="/mis-viajes">
                  <span>Ver mis traslados</span>
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="outline" onClick={handleCancelarCarga}>
                Realizar otra carga
              </Button>
            </div>
          </section>
        </Card>
      ) : estado === "checkout" ? (
        <section aria-label="Revisión y Checkout Masivo" className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 border-b border-ui-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Revisión consolidada y Checkout masivo</h1>
              <p className="mt-1 text-sm text-ui-fg-muted">
                Verifica las tarifas calculadas por cada traslado antes de proceder al pago seguro.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              className="self-start sm:self-center"
              disabled={pagoEnConciliacion || pago.procesando || conciliando}
              onClick={handleCancelarCarga}
            >
              Cancelar carga
            </Button>
          </div>

          {filasConError.length > 0 && (
            <aside
              role="status"
              aria-label="Aviso de pago parcial"
              className="flex items-start gap-3 rounded-lg border border-ui-line bg-ui-brand-soft p-4 text-sm text-ui-brand-soft-fg"
            >
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="font-semibold">Pago parcial de traslados válidos</p>
                <p className="mt-1">
                  Estás procesando el pago de <strong>{filasCotizadas.length}</strong> traslados válidos. Los{" "}
                  <strong>{filasConError.length}</strong> traslados con incidencias no se incluyen en este pago. Conserva la plantilla original para corregirlos y cargarlos después.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-4" aria-label="Motivos de registros excluidos del pago">
                  {filasConError.map((fila) => (
                    <li key={fila.indice}>
                      Fila Excel {numeroFilaExcel(fila)}: {motivosFilaMasiva(fila).join("; ") || "Detalle no disponible"}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          {errorPago && (
            <Aviso>
              <span>{errorPago}</span>
              <Button variant="danger" size="sm" onClick={() => void verificarPago()} disabled={conciliando}>
                {conciliando ? "Consultando..." : "Consultar estado del pago"}
              </Button>
            </Aviso>
          )}

          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-12">
            <div className="flex flex-col gap-4 xl:col-span-7">
              <Card className="p-4 sm:p-5">
                <h2 className="mb-3 text-base font-semibold">Resumen de traslados cotizados ({filasCotizadas.length})</h2>
                <ul className="max-h-96 divide-y divide-ui-line overflow-y-auto pr-1">
                  {filasCotizadas.map((fila) => (
                    <li key={fila.indice} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          {fila.datos.marca} {fila.datos.modelo} {fila.datos.anio}
                        </p>
                        <p className="truncate text-xs text-ui-fg-muted">
                          CP {fila.datos.origenCodigoPostal} → CP {fila.datos.destinoCodigoPostal}
                          {fila.distanciaKm != null && ` · ${formatearDistancia(fila.distanciaKm)}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                        <Badge tone="success">
                          <CheckCircle2 aria-hidden="true" className="size-3" />
                          Cotizado
                        </Badge>
                        <p className="font-semibold text-ui-brand">${fila.tarifa != null ? fila.tarifa.toFixed(2) : "0.00"} MXN</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="flex items-center justify-between gap-4 p-4 sm:p-5">
                <div>
                  <p className="text-sm font-semibold text-ui-fg-muted">Total consolidado a pagar</p>
                  <p className="text-xs text-ui-fg-muted">IVA y seguros de traslado incluidos</p>
                </div>
                <p className="text-right text-2xl font-bold">
                  ${totalFormateado} <span className="text-xs font-semibold text-ui-fg-muted">MXN</span>
                </p>
              </Card>
            </div>

            <Card className="p-4 sm:p-6 xl:col-span-5">
              <div className="mb-4 flex items-center justify-between border-b border-ui-line pb-3">
                <h2 className="text-base font-semibold">Pago seguro con Stripe</h2>
                <span className="inline-flex items-center gap-1 text-xs text-ui-fg-muted">
                  <Lock aria-hidden="true" className="size-3.5" />
                  SSL 256-bit
                </span>
              </div>

              {cargaId ? (
                <div className="flex flex-col gap-4">
                  {pagoEnConciliacion ? (
                    <div role="status" className="flex flex-col gap-3 rounded-lg border border-ui-line p-4 text-sm">
                      <p>Tu pago ya fue enviado a conciliación. No vuelvas a pagar.</p>
                      <Button variant="outline" size="sm" className="self-start" disabled={conciliando} onClick={() => void verificarPago()}>
                        Reintentar conciliación
                      </Button>
                      <Link href="/mis-viajes" className="text-ui-brand underline-offset-4 hover:underline">
                        Ir a Mis traslados
                      </Link>
                      <Link href={`/soporte?motivo=pagos&carga=${cargaId}`} className="text-ui-brand underline-offset-4 hover:underline">
                        Contactar a soporte
                      </Link>
                    </div>
                  ) : (
                    <PagoStripe
                      clientSecretExterno={stripeClientSecret ?? undefined}
                      returnPath="/mis-viajes?pago=masivo"
                      onEstadoPago={setPago}
                      trasladoId={cargaId}
                      monto={totalMXN}
                      onPagado={() => void verificarPago()}
                      compacto
                      formId={`pago-masivo-${cargaId}`}
                    />
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    form={`pago-masivo-${cargaId}`}
                    disabled={pagoEnConciliacion || !pago.listo || pago.procesando || conciliando}
                  >
                    {pago.procesando || conciliando ? "Procesando pago seguro..." : `Pagar $${totalFormateado} MXN`}
                  </Button>

                  <p className="text-center text-xs text-ui-fg-muted">
                    Tu pago es verificado directamente con Stripe sin almacenar datos bancarios.
                  </p>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-ui-fg-muted">Preparando sesión de pago...</p>
              )}
            </Card>
          </div>
        </section>
      ) : estado === "geocodificando" || estado === "cotizando" ? (
        <Card asChild className="mx-auto w-full max-w-xl p-6 text-center sm:p-10">
          <section aria-label="Progreso de cotización">
            <Loader2 aria-hidden="true" className="mx-auto mb-4 size-12 animate-spin text-ui-brand" />
            <h2 className="text-xl font-semibold">
              {estado === "geocodificando" ? "Calculando rutas y distancias..." : "Cotizando tarifas en tiempo real..."}
            </h2>
            <p className="mt-1 text-sm text-ui-fg-muted">
              Optimizando pares de códigos postales con Mapbox para {filasCorrectas.length} traslados.
            </p>
            <div
              role="progressbar"
              aria-label="Progreso de cotización"
              aria-valuenow={progreso}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-6 h-2 w-full overflow-hidden rounded-full bg-ui-muted"
            >
              <div className="h-full rounded-full bg-ui-brand transition-all duration-300" style={{ width: `${Math.max(progreso, 25)}%` }} />
            </div>
          </section>
        </Card>
      ) : estado === "resultados" ? (
        <section aria-label="Validación y corrección de traslados" className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 border-b border-ui-line pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">Validación de archivo</h1>
                <Badge tone="info" className="max-w-full truncate">
                  {nombreArchivo || "lote_cargado.xlsx"} (Borrador local)
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ui-fg-muted">
                Revisa los datos validados del archivo. Puedes corregir incidencias directamente en la tabla antes de cotizar.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" size="sm" onClick={handleDescargarDetalleActivo}>
                <Download aria-hidden="true" />
                Descargar detalle (.csv)
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelarCarga}>
                Subir otro archivo
              </Button>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-2 sm:gap-4">
            <Card className="flex flex-col-reverse p-3 text-center sm:p-4">
              <dt className="mt-0.5 text-xs font-semibold text-ui-fg-muted">Total de traslados</dt>
              <dd className="text-2xl font-bold sm:text-3xl">{filasVisibles.length}</dd>
            </Card>
            <Card className="flex flex-col-reverse bg-ui-success-soft p-3 text-center sm:p-4">
              <dt className="mt-0.5 text-xs font-semibold text-ui-success">Listos para cotizar</dt>
              <dd className="text-2xl font-bold text-ui-success sm:text-3xl">{filasCorrectas.length}</dd>
            </Card>
            <Card className={cn("flex flex-col-reverse p-3 text-center sm:p-4", filasConError.length > 0 && "bg-ui-danger-soft")}>
              <dt className={cn("mt-0.5 text-xs font-semibold", filasConError.length > 0 ? "text-ui-danger" : "text-ui-fg-muted")}>
                Con incidencias
              </dt>
              <dd className={cn("text-2xl font-bold sm:text-3xl", filasConError.length > 0 ? "text-ui-danger" : "text-ui-fg-muted")}>
                {filasConError.length}
              </dd>
            </Card>
          </dl>

          {filasCorrectas.length > 0 && filasConError.length > 0 && (
            <aside
              role="alert"
              aria-label="Aviso de lote parcial"
              className="flex flex-col gap-3 rounded-lg border border-ui-line bg-ui-warning-soft p-4 text-sm text-ui-fg lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex items-start gap-3">
                <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ui-warning" />
                <div>
                  <p className="font-semibold">
                    {filasCorrectas.length} traslados listos para cotizar · {filasConError.length} fila(s) con incidencias
                  </p>
                  <p className="mt-0.5 text-ui-fg-muted">
                    Puedes corregir las filas con error, o cotizar y pagar exclusivamente las válidas; corrige las pendientes en la plantilla original para cargarlas después.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button size="sm" onClick={() => void cotizarSoloValidas()}>
                  Cotizar {filasCorrectas.length} válidas
                </Button>
                <Button variant="outline" size="sm" onClick={() => filasConError.forEach((f) => eliminarFila(f.indice))}>
                  Omitir filas con error
                </Button>
              </div>
            </aside>
          )}

          {error && <Aviso>{error}</Aviso>}

          <div className="flex flex-wrap items-center gap-2 border-b border-ui-line pb-2" aria-label="Filtrar filas">
            {filtros.map((filtro) => (
              <Button
                key={filtro.id}
                size="sm"
                variant={filtroTab === filtro.id ? "secondary" : "ghost"}
                aria-pressed={filtroTab === filtro.id}
                onClick={() => setFiltroTab(filtro.id)}
              >
                {filtro.etiqueta}
              </Button>
            ))}
          </div>

          <Card className="overflow-x-auto">
            <table className={TABLA}>
              <thead className={CABECERA}>
                <tr>
                  <th scope="col" className="px-3 py-3">#</th>
                  <th scope="col" className="px-3 py-3">Vehículo</th>
                  <th scope="col" className="px-3 py-3">Origen CP</th>
                  <th scope="col" className="px-3 py-3">Destino CP</th>
                  <th scope="col" className="px-3 py-3">Contacto Entrega</th>
                  <th scope="col" className="px-3 py-3">Contacto Recepción</th>
                  <th scope="col" className="px-3 py-3">Estado</th>
                  <th scope="col" className="px-3 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className={CUERPO}>
                {filasFiltradas.length === 0 ? (
                  <tr className="block lg:table-row">
                    <td colSpan={8} className="block py-8 text-center text-sm text-ui-fg-muted lg:table-cell">
                      No hay registros en esta vista.
                    </td>
                  </tr>
                ) : (
                  filasFiltradas.map((fila) => {
                    const estaEditando = filaEditando === fila.indice;
                    const tieneError = fila.estado === "error" || Boolean(fila.errorCotizacion);
                    const n = fila.indice + 1;
                    const motivos = motivosFilaMasiva(fila);
                    const camposExtra = Array.from(
                      new Set([...Object.keys(fila.errores ?? {}), ...(fila.errorCotizacion ? CAMPOS_DIRECCION : [])]),
                    ).filter((campo) => !CAMPOS_EN_COLUMNA.includes(campo));

                    return (
                      <tr
                        key={fila.indice}
                        className={cn(
                          "grid grid-cols-2 gap-x-4 gap-y-3 p-4 lg:table-row lg:p-0",
                          tieneError ? "bg-ui-danger-soft" : "lg:hover:bg-ui-muted",
                        )}
                      >
                        <td className={cn(CELDA, "col-span-2 text-xs text-ui-fg-muted")}>
                          <span className="font-mono">{n}</span>
                          <span className="ml-2 whitespace-nowrap lg:ml-0 lg:block">Fila Excel {numeroFilaExcel(fila)}</span>
                        </td>

                        <td className={cn(CELDA, "col-span-2")}>
                          <EtiquetaMovil>Vehículo</EtiquetaMovil>
                          {estaEditando ? (
                            <div className="flex flex-col gap-2">
                              <Input
                                aria-label={`Marca fila ${n}`}
                                defaultValue={fila.datos.marca}
                                onChange={(e) => setDatosEdicion((prev) => ({ ...prev, marca: e.target.value }))}
                                placeholder="Marca"
                              />
                              <Input
                                aria-label={`Modelo fila ${n}`}
                                defaultValue={fila.datos.modelo}
                                onChange={(e) => setDatosEdicion((prev) => ({ ...prev, modelo: e.target.value }))}
                                placeholder="Modelo"
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="font-semibold">
                                {fila.datos.marca} {fila.datos.modelo}
                              </p>
                              <p className="text-xs text-ui-fg-muted">
                                {fila.datos.anio} · {fila.datos.condicion}
                              </p>
                            </div>
                          )}
                        </td>

                        <td className={CELDA}>
                          <EtiquetaMovil>Origen CP</EtiquetaMovil>
                          {estaEditando ? (
                            <Input
                              inputMode="numeric"
                              aria-label={`Código postal de origen fila ${n}`}
                              defaultValue={fila.datos.origenCodigoPostal}
                              onChange={(e) => setDatosEdicion((prev) => ({ ...prev, origenCodigoPostal: e.target.value }))}
                              className="font-mono lg:w-24"
                            />
                          ) : (
                            <div>
                              <span className="font-mono font-semibold">{fila.datos.origenCodigoPostal}</span>
                              {fila.errores?.origenCodigoPostal && <p className="text-xs text-ui-danger">{fila.errores.origenCodigoPostal}</p>}
                            </div>
                          )}
                        </td>

                        <td className={CELDA}>
                          <EtiquetaMovil>Destino CP</EtiquetaMovil>
                          {estaEditando ? (
                            <Input
                              inputMode="numeric"
                              aria-label={`Código postal de destino fila ${n}`}
                              defaultValue={fila.datos.destinoCodigoPostal}
                              onChange={(e) => setDatosEdicion((prev) => ({ ...prev, destinoCodigoPostal: e.target.value }))}
                              className="font-mono lg:w-24"
                            />
                          ) : (
                            <div>
                              <span className="font-mono font-semibold">{fila.datos.destinoCodigoPostal}</span>
                              {fila.errores?.destinoCodigoPostal && <p className="text-xs text-ui-danger">{fila.errores.destinoCodigoPostal}</p>}
                            </div>
                          )}
                        </td>

                        <td className={CELDA}>
                          <EtiquetaMovil>Contacto entrega</EtiquetaMovil>
                          {estaEditando ? (
                            <Input
                              type="tel"
                              aria-label={`Teléfono de entrega fila ${n}`}
                              defaultValue={fila.datos.entregaTelefono}
                              onChange={(e) => setDatosEdicion((prev) => ({ ...prev, entregaTelefono: e.target.value }))}
                              className="lg:w-36"
                            />
                          ) : (
                            <div>
                              <p className="font-medium">{fila.datos.entregaNombre}</p>
                              <p className="text-xs text-ui-fg-muted">{fila.datos.entregaTelefono}</p>
                              {fila.errores?.entregaTelefono && <p className="text-xs text-ui-danger">{fila.errores.entregaTelefono}</p>}
                            </div>
                          )}
                        </td>

                        <td className={CELDA}>
                          <EtiquetaMovil>Contacto recepción</EtiquetaMovil>
                          {estaEditando ? (
                            <Input
                              type="tel"
                              aria-label={`Teléfono de recepción fila ${n}`}
                              defaultValue={fila.datos.recepcionTelefono}
                              onChange={(e) => setDatosEdicion((prev) => ({ ...prev, recepcionTelefono: e.target.value }))}
                              className="lg:w-36"
                            />
                          ) : (
                            <div>
                              <p className="font-medium">{fila.datos.recepcionNombre}</p>
                              <p className="text-xs text-ui-fg-muted">{fila.datos.recepcionTelefono}</p>
                              {fila.errores?.recepcionTelefono && <p className="text-xs text-ui-danger">{fila.errores.recepcionTelefono}</p>}
                            </div>
                          )}
                        </td>

                        <td className={cn(CELDA, "col-span-2")}>
                          <EtiquetaMovil>Estado</EtiquetaMovil>
                          {estaEditando &&
                            camposExtra.map((campo) => {
                              const etiqueta = ETIQUETAS_CAMPOS_MASIVOS[campo] ?? campo;
                              return (
                                <label key={campo} className="mb-2 block text-sm font-medium">
                                  {etiqueta}
                                  <Input
                                    aria-label={`${etiqueta} fila ${n}`}
                                    defaultValue={fila.datos[campo] ?? ""}
                                    onChange={(e) => setDatosEdicion((prev) => ({ ...prev, [campo]: e.target.value }))}
                                    className="mt-1"
                                  />
                                </label>
                              );
                            })}
                          {fila.validando ? (
                            <span role="status" className="text-sm text-ui-brand">Validando cambios…</span>
                          ) : tieneError ? (
                            <div>
                              <Badge tone="danger">
                                <XCircle aria-hidden="true" className="size-3" />
                                Con incidencia
                              </Badge>
                              <ul
                                aria-label={`Motivos de error del registro ${n}`}
                                className="mt-2 list-disc space-y-1 pl-4 text-sm text-ui-danger lg:min-w-56 lg:max-w-sm"
                              >
                                {motivos.map((motivo) => (
                                  <li key={motivo}>{motivo}</li>
                                ))}
                                {motivos.length === 0 && <li>No se recibió el detalle de la incidencia. Guarda de nuevo la fila para revalidarla.</li>}
                              </ul>
                            </div>
                          ) : (
                            <Badge tone="success">
                              <CheckCircle2 aria-hidden="true" className="size-3" />
                              Válido
                            </Badge>
                          )}
                        </td>

                        <td className={cn(CELDA, "col-span-2 lg:whitespace-nowrap lg:text-right")}>
                          {estaEditando ? (
                            <div className="flex gap-2 lg:flex-col lg:items-end 2xl:flex-row 2xl:justify-end">
                              <Button
                                size="sm"
                                aria-label={`Guardar fila ${n}`}
                                onClick={() => {
                                  guardarEdicionFila(fila.indice, datosEdicion);
                                  cancelarEdicionFila();
                                  setDatosEdicion({});
                                }}
                              >
                                Guardar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Cancelar edición fila ${n}`}
                                onClick={() => {
                                  cancelarEdicionFila();
                                  setDatosEdicion({});
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2 lg:flex-col lg:items-end 2xl:flex-row 2xl:justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                aria-label={`Editar fila ${n}`}
                                onClick={() => {
                                  iniciarEdicionFila(fila.indice);
                                  setDatosEdicion({});
                                }}
                              >
                                Editar
                              </Button>
                              <Button variant="ghost" size="sm" className="text-ui-danger" aria-label={`Eliminar fila ${n}`} onClick={() => eliminarFila(fila.indice)}>
                                Eliminar
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Card>

          <Card className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold">
                {todasListas
                  ? "Todas las filas son válidas. Puedes cotizar el lote completo."
                  : `${filasConError.length} fila(s) tienen errores pendientes de corrección.`}
              </p>
              <p className="text-xs text-ui-fg-muted">
                El cálculo consultará rutas y tarifas en tiempo real usando el cálculo normativo institucional.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {filasConError.length > 0 && filasCorrectas.length > 0 && (
                <Button variant="outline" onClick={() => void cotizarSoloValidas()}>
                  Cotizar {filasCorrectas.length} válidas
                </Button>
              )}
              <Button disabled={!todasListas} onClick={() => void geocodificarYCotizar()}>
                {todasListas ? `Cotizar lote completo (${filasCorrectas.length} traslados)` : "Corrige los errores para cotizar todo"}
              </Button>
            </div>
          </Card>
        </section>
      ) : (
        <>
          <section aria-label="Encabezado de carga masiva" className="flex flex-col gap-4 border-b border-ui-line pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Carga masiva de traslados</h1>
              <p className="mt-1 text-sm text-ui-fg-muted">
                Cotiza y procesa múltiples traslados desde un archivo <strong className="text-ui-fg">.xlsx</strong> de forma rápida y segura.
              </p>
            </div>
            <Button asChild variant="outline" className="self-start sm:self-center">
              <Link href="/mis-viajes">
                <MapPin aria-hidden="true" />
                <span>Mis viajes</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </section>

          {cargasPendientes.length > 0 && (
            <section aria-label="Cargas pendientes de pago" className="rounded-lg border border-ui-brand bg-ui-brand-soft p-4 sm:p-5">
              <div className="flex items-center gap-2 text-ui-brand-soft-fg">
                <Clock aria-hidden="true" className="size-5" />
                <h2 className="text-sm font-bold uppercase tracking-wider">Cargas pendientes de pago ({cargasPendientes.length})</h2>
              </div>
              <p className="mt-1 text-sm text-ui-fg-muted">
                Tienes cotizaciones previas guardadas en el servidor. Puedes reanudarlas para completar su pago o descartarlas.
              </p>
              <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {cargasPendientes.map((p) => (
                  <li key={p.id} className="flex flex-col gap-3 rounded-lg border border-ui-line bg-ui-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold">${formatoMXN(p.totalMXN)} MXN</p>
                      <p className="text-xs text-ui-fg-muted">
                        {p.cantidad_traslados} traslado{p.cantidad_traslados !== 1 ? "s" : ""}
                        {p.creado_en ? ` · ${new Date(p.creado_en).toLocaleDateString("es-MX")}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 sm:flex-none" onClick={() => void handleReanudarCarga(p.id)}>
                        Reanudar carga
                      </Button>
                      <Button variant="danger" size="sm" className="flex-1 sm:flex-none" onClick={() => void handleDescartarCarga(p.id)}>
                        Descartar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <section
              aria-label="Zona de arrastre de archivos"
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex cursor-pointer select-none flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition sm:p-8 xl:col-span-7",
                arrastrando ? "border-ui-brand bg-ui-brand-soft ring-4 ring-ui-ring" : "border-ui-line-strong bg-ui-card hover:border-ui-brand hover:bg-ui-muted",
              )}
            >
              {estado === "validando" ? (
                <div role="status" className="flex flex-col items-center justify-center py-6">
                  <Loader2 aria-hidden="true" className="mb-3 size-10 animate-spin text-ui-brand" />
                  <h2 className="text-base font-semibold">Validando archivo... {progreso > 0 ? `${progreso}%` : ""}</h2>
                  <p className="mt-1 text-sm text-ui-fg-muted">Parseando datos y verificando información en segundo plano</p>
                </div>
              ) : (
                <>
                  <span aria-hidden="true" className="mb-3 flex size-16 items-center justify-center rounded-full bg-ui-brand-soft text-ui-brand sm:size-20">
                    <FileSpreadsheet className="size-8 sm:size-10" />
                  </span>
                  <h2 className="text-lg font-semibold">Arrastra y suelta tu archivo aquí</h2>
                  <p className="mt-1 text-sm text-ui-brand">o haz clic para seleccionar un archivo .xlsx</p>
                  <p className="mt-2 text-sm text-ui-fg-muted">Máximo 100 traslados · Hasta 5 MB</p>
                  <Button
                    className="mt-4 w-full sm:w-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload aria-hidden="true" />
                    Seleccionar archivo
                  </Button>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                aria-label="Cargar archivo Excel .xlsx"
                className="sr-only"
                onChange={handleFileInputChange}
              />
            </section>

            <Card asChild className="flex flex-col justify-between gap-6 p-5 sm:p-6 xl:col-span-5">
              <section aria-label="Guía paso a paso de carga masiva">
                <div>
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-ui-success-soft text-ui-success">
                      <Lightbulb className="size-5" />
                    </span>
                    <h2 className="text-base font-semibold">¿Cómo funciona?</h2>
                  </div>
                  <ol className="mt-5 flex flex-col gap-3">
                    {PASOS_GUIA.map((paso, i) => (
                      <li key={paso} className="flex items-center gap-3 text-sm font-medium">
                        <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ui-success-soft text-xs font-bold text-ui-success">
                          {i + 1}
                        </span>
                        <span>{paso}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" className="w-full">
                    <a href="/docs-legales/plantilla-carga-masiva.xlsx" download="plantilla-carga-masiva.xlsx">
                      <Download aria-hidden="true" />
                      Descargar plantilla oficial (.xlsx)
                    </a>
                  </Button>
                  <Button variant="ghost" onClick={() => setGuiaModalAbierto(true)}>
                    <BookOpen aria-hidden="true" />
                    Ver guía de uso
                  </Button>
                </div>
              </section>
            </Card>
          </div>

          <section aria-label="Ventajas de la carga masiva" className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {BENEFICIOS.map(({ titulo, texto, Icono }) => (
              <Card key={titulo} className="flex items-center gap-3 p-4">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-md bg-ui-brand-soft text-ui-brand">
                  <Icono className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{titulo}</h3>
                  <p className="text-xs text-ui-fg-muted">{texto}</p>
                </div>
              </Card>
            ))}
          </section>

          <Card asChild className="p-4 sm:p-6">
            <section aria-label="Cargas recientes procesadas">
              <div className="flex items-center justify-between border-b border-ui-line pb-4">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-ui-muted text-ui-fg-muted">
                    <Clock className="size-4" />
                  </span>
                  <h2 className="text-base font-semibold">Cargas recientes</h2>
                </div>
                <Link href="/mis-viajes" className="text-sm font-semibold text-ui-brand hover:underline">
                  Ver todas &gt;
                </Link>
              </div>

              <table className={cn(TABLA, "mt-2")}>
                <thead className={CABECERA}>
                  <tr>
                    <th scope="col" className="px-3 py-3">Archivo</th>
                    <th scope="col" className="px-3 py-3">Fecha y hora</th>
                    <th scope="col" className="px-3 py-3">Traslados</th>
                    <th scope="col" className="px-3 py-3">Estado</th>
                    <th scope="col" className="px-3 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className={CUERPO}>
                  {cargasRecientes.length === 0 ? (
                    <tr className="block lg:table-row">
                      <td colSpan={5} className="block py-8 text-center text-sm text-ui-fg-muted lg:table-cell">
                        {errorPendientes
                          ? "No se pudieron consultar las cargas recientes."
                          : cargandoPendientes
                            ? "Consultando cargas recientes…"
                            : "No hay cargas recientes. Arrastra o selecciona un archivo .xlsx para comenzar."}
                      </td>
                    </tr>
                  ) : (
                    cargasRecientes.map((carga) => {
                      const { tone, Icono } = ESTADO_CARGA[carga.estado];
                      return (
                        <tr key={carga.id} className="grid grid-cols-2 gap-x-4 gap-y-2 py-4 lg:table-row lg:py-0 lg:hover:bg-ui-muted">
                          <td className={cn(CELDA, "col-span-2 lg:whitespace-nowrap")}>
                            <EtiquetaMovil>Archivo</EtiquetaMovil>
                            <span className="break-all font-semibold lg:break-normal">{carga.archivo}</span>
                          </td>
                          <td className={cn(CELDA, "col-span-2 text-ui-fg-muted lg:whitespace-nowrap")}>
                            <EtiquetaMovil>Fecha y hora</EtiquetaMovil>
                            {carga.fechaHora}
                          </td>
                          <td className={CELDA}>
                            <EtiquetaMovil>Traslados</EtiquetaMovil>
                            <span className="font-medium">{carga.traslados}</span>
                          </td>
                          <td className={cn(CELDA, "lg:whitespace-nowrap")}>
                            <EtiquetaMovil>Estado</EtiquetaMovil>
                            <Badge tone={tone}>
                              <Icono aria-hidden="true" className="size-3" />
                              {carga.estado}
                            </Badge>
                          </td>
                          <td className={cn(CELDA, "col-span-2 lg:whitespace-nowrap lg:text-right")}>
                            <div className="relative flex items-center gap-2 lg:justify-end">
                              <Button variant="link" size="sm" onClick={() => abrirDetalle(carga)}>
                                {carga.accion}
                              </Button>
                              <div className="relative">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => toggleMenu(carga.id)}
                                  aria-label={`Opciones de carga ${carga.archivo}`}
                                  aria-haspopup="menu"
                                  aria-expanded={menuAbiertoId === carga.id}
                                >
                                  <MoreVertical aria-hidden="true" />
                                </Button>
                                {menuAbiertoId === carga.id && (
                                  <div role="menu" className="absolute left-0 z-30 mt-1 flex w-48 flex-col rounded-lg border border-ui-line bg-ui-card p-1.5 shadow-ui-md lg:left-auto lg:right-0">
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => handleDescargarReporte(carga)}
                                      className="min-h-11 rounded-md px-3 text-left text-sm font-medium hover:bg-ui-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring"
                                    >
                                      Descargar reporte
                                    </button>
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => {
                                        toggleMenu(carga.id);
                                        router.push("/mis-viajes");
                                      }}
                                      className="min-h-11 rounded-md px-3 text-left text-sm font-medium hover:bg-ui-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring"
                                    >
                                      Ver traslados
                                    </button>
                                    <button
                                      type="button"
                                      role="menuitem"
                                      onClick={() => void handleCopiarResumen(carga)}
                                      className="min-h-11 rounded-md px-3 text-left text-sm font-medium hover:bg-ui-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ui-ring"
                                    >
                                      Copiar resumen
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </section>
          </Card>

          <footer aria-label="Ayuda de carga masiva" className="flex flex-col items-start gap-4 rounded-lg border border-ui-line bg-ui-brand-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-4">
              <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-ui-brand text-ui-on-brand">
                <Headphones className="size-6" />
              </span>
              <div>
                <h3 className="text-base font-semibold">¿Necesitas ayuda?</h3>
                <p className="mt-0.5 text-sm text-ui-fg-muted">Nuestro equipo está listo para ayudarte a procesar tus traslados.</p>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/soporte">
                <MessageSquare aria-hidden="true" />
                Contactar soporte
              </Link>
            </Button>
          </footer>
        </>
      )}

      {toast && (
        <aside
          role={toast.tipo === "error" ? "alert" : "status"}
          aria-live="polite"
          className="fixed inset-x-4 bottom-[calc(var(--user-mobile-nav-height,5rem)+1rem)] z-50 flex items-center gap-3 rounded-lg border border-ui-line bg-ui-card px-4 py-3 text-sm font-medium text-ui-fg shadow-ui-md sm:inset-x-auto sm:right-6 sm:max-w-md lg:bottom-6"
        >
          {toast.tipo === "error" ? (
            <XCircle aria-hidden="true" className="size-5 shrink-0 text-ui-danger" />
          ) : toast.tipo === "exito" ? (
            <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-ui-success" />
          ) : (
            <Info aria-hidden="true" className="size-5 shrink-0 text-ui-brand" />
          )}
          <span className="flex-1">{toast.mensaje}</span>
          <Button variant="ghost" size="icon-sm" onClick={cerrarToast} aria-label="Cerrar notificación">
            <X aria-hidden="true" />
          </Button>
        </aside>
      )}

      {guiaModalAbierto && (
        <Sheet
          open
          onClose={() => setGuiaModalAbierto(false)}
          titulo="Guía de uso para la plantilla oficial"
          etiquetaCerrar="Cerrar guía"
          pie={<Button onClick={() => setGuiaModalAbierto(false)}>Cerrar guía</Button>}
        >
          <div className="flex flex-col gap-3 text-sm text-ui-fg-muted">
            <p><strong className="text-ui-fg">1. Formato estricto:</strong> Conserva los encabezados de la fila 1 sin renombrarlos.</p>
            <p><strong className="text-ui-fg">2. Códigos postales:</strong> Asegúrate de capturar 5 dígitos exactos para origen y destino.</p>
            <p><strong className="text-ui-fg">3. Teléfonos de contacto:</strong> Escribe números válidos a 10 dígitos para entrega y recepción.</p>
            <p><strong className="text-ui-fg">4. Límite de carga:</strong> Puedes registrar hasta 100 traslados en un solo archivo .xlsx.</p>
          </div>
        </Sheet>
      )}

      {modalDetalleData && (
        <Sheet
          open
          onClose={cerrarDetalle}
          titulo={modalDetalleData.titulo}
          etiquetaCerrar="Cerrar modal de detalle"
          pie={<Button onClick={cerrarDetalle}>Aceptar</Button>}
        >
          <div className="flex flex-col gap-2 text-sm text-ui-fg-muted">
            <p><strong className="text-ui-fg">Archivo:</strong> {modalDetalleData.item.archivo}</p>
            <p><strong className="text-ui-fg">Fecha:</strong> {modalDetalleData.item.fechaHora}</p>
            <p><strong className="text-ui-fg">Traslados:</strong> {modalDetalleData.item.traslados}</p>
            <p><strong className="text-ui-fg">Estado:</strong> {modalDetalleData.item.estado}</p>
            {modalDetalleData.item.totalMXN != null && (
              <p><strong className="text-ui-fg">Monto total:</strong> ${modalDetalleData.item.totalMXN.toFixed(2)} MXN</p>
            )}
            {modalDetalleData.item.estado === "Con errores" && (
              <div className="mt-2 rounded-lg bg-ui-danger-soft p-3 text-ui-fg">
                <p className="font-semibold">Incidencias encontradas en la plantilla:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {modalDetalleData.item.id === cargaId || modalDetalleData.item.esLocal ? (
                    filasConError.length === 0 ? (
                      <li>No hay motivos de error disponibles para este lote en la sesión actual.</li>
                    ) : (
                      filasConError.map((fila) => (
                        <li key={fila.indice}>
                          Fila Excel {numeroFilaExcel(fila)}: {motivosFilaMasiva(fila).join("; ") || "Detalle no disponible"}
                        </li>
                      ))
                    )
                  ) : (
                    <li>El historial no incluye el detalle por registro. Reanuda este lote para consultar sus datos; no se dispone de los motivos en esta vista.</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}
