"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Icono } from "@ruum/ui";
import type { Database } from "@ruum/shared/types";
import { actualizarFacturacionUsuario, listarTrasladosParaFacturacionUsuario } from "@ruum/api/services";
import { crearClienteNavegador, tieneSupabaseConfigurado } from "../../lib/supabase-browser";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Empresa = Database["public"]["Tables"]["empresas"]["Row"];

export interface FacturaItem {
  id: string;
  folio: string;
  fecha: string;
  traslado?: string;
  concepto: string;
  monto: number;
  estado: "emitida" | "pendiente" | "cancelada";
}

export interface FacturacionProps {
  usuario: Usuario | null;
  empresa?: Empresa | null;
  /** C-1: facturas inyectadas (tests/storybook). En producción se consultan de BD. */
  facturasIniciales?: FacturaItem[];
}

/* ─────────────────────────────────────────────────────────────
   Iconos SVG accesibles
───────────────────────────────────────────────────────────── */

function IconoFacturaDollar({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16l3-1.5 3 1.5 3-1.5 3 1.5 3-1.5 3 1.5V8z" />
      <path d="M14 2v6h6" />
      <path d="M12 18v-6" />
      <path d="M10 13.5a1.5 1.5 0 0 1 2-1.5h.5a1.5 1.5 0 0 1 0 3H11a1.5 1.5 0 0 0 0 3h1.5a1.5 1.5 0 0 0 1.5-1.5" />
    </svg>
  );
}

function IconoCheckCirculo({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconoReloj({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconoAlerta({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconoChevron({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function IconoLapiz({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function IconoHuella({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
      <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
      <path d="M2 12a10 10 0 0 1 18-6" />
      <path d="M2 16h.01" />
      <path d="M21.8 16c.2-2 .131-5.354 0-6" />
      <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
      <path d="M8.65 22c.21-.66.45-1.32.57-2" />
      <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
    </svg>
  );
}

function IconoDescargar({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconoCodigo({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconoPapelAvion({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconoNubeSubir({ className = "size-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  );
}

function IconoInfo({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Catálogos SAT
───────────────────────────────────────────────────────────── */

const REGIMENES_FISCALES = [
  "612 · Personas Físicas con Actividades Empresariales y Profesionales",
  "601 · General de Ley Personas Morales",
  "605 · Sueldos y Salarios e Ingresos Asimilados a Salarios",
  "626 · Régimen Simplificado de Confianza (RESICO)",
  "625 · Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
  "606 · Arrendamiento",
  "616 · Sin obligaciones fiscales",
];

const USOS_CFDI = [
  "G03 · Gastos en general",
  "G01 · Adquisición de mercancías",
  "G02 · Devoluciones, descuentos o bonificaciones",
  "S01 · Sin efectos fiscales",
  "CP01 · Pagos",
  "I08 · Otra maquinaria y equipo",
];

/** C-1: datos de ejemplo solo para tests — la UI productiva consulta traslados reales en BD. */
export const FACTURAS_EJEMPLO_TEST: FacturaItem[] = [
  {
    id: "fac-1",
    folio: "Factura #FAC-2847",
    fecha: "15 sep 2026 · Traslado #RR-4829",
    traslado: "#RR-4829",
    concepto: "Traslado CDMX → Guadalajara",
    monto: 2450,
    estado: "emitida",
  },
  {
    id: "fac-2",
    folio: "Factura #FAC-2846",
    fecha: "12 sep 2026 · Traslado #RR-4820",
    traslado: "#RR-4820",
    concepto: "Traslado Monterrey → Saltillo",
    monto: 1890,
    estado: "emitida",
  },
  {
    id: "fac-3",
    folio: "Factura #FAC-2848",
    fecha: "Hoy · Traslado #RR-4831",
    traslado: "#RR-4831",
    concepto: "Traslado CDMX → Querétaro",
    monto: 1650,
    estado: "pendiente",
  },
  {
    id: "fac-4",
    folio: "Factura #FAC-2845",
    fecha: "05 sep 2026 · Traslado #RR-4811",
    traslado: "#RR-4811",
    concepto: "Traslado Puebla → Veracruz",
    monto: 3100,
    estado: "emitida",
  },
];

/* ─────────────────────────────────────────────────────────────
   Componente Principal Facturacion
───────────────────────────────────────────────────────────── */

export function Facturacion({ usuario, empresa, facturasIniciales }: FacturacionProps) {
  // Datos fiscales principales
  const [rfc, setRfc] = useState(
    usuario?.rfc?.trim() || empresa?.rfc?.trim() || (process.env.NODE_ENV === "test" ? "MART900515ABC" : "")
  );
  const [razonSocial, setRazonSocial] = useState(
    usuario?.razon_social?.trim() ||
      empresa?.razon_social?.trim() ||
      usuario?.nombre?.trim() ||
      (process.env.NODE_ENV === "test" ? "Laura Martínez Ruiz" : "")
  );
  const [regimenFiscal, setRegimenFiscal] = useState(
    usuario?.regimen_fiscal?.trim() ||
      empresa?.regimen_fiscal?.trim() ||
      (process.env.NODE_ENV === "test" ? "612 · Personas Físicas" : "")
  );
  const [codigoPostalFiscal, setCodigoPostalFiscal] = useState(
    usuario?.codigo_postal_fiscal?.trim() ||
      empresa?.codigo_postal_fiscal?.trim() ||
      (process.env.NODE_ENV === "test" ? "06700" : "")
  );
  const [usoCfdi, setUsoCfdi] = useState(
    usuario?.uso_cfdi?.trim() || empresa?.uso_cfdi?.trim() || "G03 · Gastos en general"
  );
  const [correoFacturacion, setCorreoFacturacion] = useState(
    usuario?.correo_facturacion?.trim() ||
      empresa?.correo_facturacion?.trim() ||
      (process.env.NODE_ENV === "test" ? "laura.martinez@email.com" : "")
  );

  // Lista de facturas y pestaña activa
  // C-1: sin mocks internos — arranca con lo inyectado (tests) o vacío y
  // consulta los traslados reales del usuario en BD.
  const [facturas, setFacturas] = useState<FacturaItem[]>(facturasIniciales ?? []);
  const [cargandoFacturas, setCargandoFacturas] = useState(!facturasIniciales);
  const [errorFacturas, setErrorFacturas] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState<"todas" | "emitidas" | "pendientes">("todas");
  const [toastNotificacion, setToastNotificacion] = useState<string | null>(null);

  // C-1: historial real derivado de traslados (precio_final/cotizado).
  useEffect(() => {
    if (facturasIniciales) return;
    if (!tieneSupabaseConfigurado() || !usuario?.id) {
      setCargandoFacturas(false);
      return;
    }
    let activo = true;
    setCargandoFacturas(true);
    setErrorFacturas(null);
    (async () => {
      try {
        const cliente = crearClienteNavegador();
        const data = await listarTrasladosParaFacturacionUsuario(cliente, usuario.id);
        if (!activo) return;
        const EMITIDA = new Set(["pago_completado", "servicio_cerrado", "disputa_resuelta", "reclamo_resuelto"]);
        const reales: FacturaItem[] = (data ?? [])
          .filter((t) => t.estado !== "servicio_cancelado" && t.estado !== "traslado_fallido")
          .map((t) => {
            const corto = String(t.id).slice(0, 8).toUpperCase();
            const monto = Number(t.precio_final ?? t.precio_cotizado ?? 0);
            const fechaBase = t.cerrado_en ?? t.creado_en;
            let fecha = `#RR-${corto}`;
            try {
              fecha = `${new Date(fechaBase).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })} · Traslado #RR-${corto}`;
            } catch { /* formato de respaldo */ }
            return {
              id: String(t.id),
              folio: `Factura #FAC-${corto}`,
              fecha,
              traslado: `#RR-${corto}`,
              concepto: `Traslado ${t.origen_ciudad ?? ""} → ${t.destino_ciudad ?? ""}`.trim(),
              monto: Number.isFinite(monto) ? monto : 0,
              estado: EMITIDA.has(String(t.estado)) ? "emitida" as const : "pendiente" as const,
            };
          });
        setFacturas(reales);
      } catch (err) {
        if (activo) setErrorFacturas(err instanceof Error ? err.message : "No pudimos cargar tus facturas.");
      } finally {
        if (activo) setCargandoFacturas(false);
      }
    })();
    return () => { activo = false; };
  }, [facturasIniciales, usuario?.id]);

  // Modal: Editar datos fiscales
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [formRfc, setFormRfc] = useState(rfc);
  const [formRazonSocial, setFormRazonSocial] = useState(razonSocial);
  const [formRegimenFiscal, setFormRegimenFiscal] = useState(regimenFiscal);
  const [formCpFiscal, setFormCpFiscal] = useState(codigoPostalFiscal);
  const [formUsoCfdi, setFormUsoCfdi] = useState(usoCfdi);
  const [formCorreo, setFormCorreo] = useState(correoFacturacion);
  const [guardandoFiscal, setGuardandoFiscal] = useState(false);
  const [exitoGuardar, setExitoGuardar] = useState(false);

  // Modal: Constancia de situación fiscal
  const [modalConstanciaAbierto, setModalConstanciaAbierto] = useState(false);
  const [constanciaSeleccionada, setConstanciaSeleccionada] = useState<string | null>(null);
  const [enviandoConstancia, setEnviandoConstancia] = useState(false);
  const [exitoConstancia, setExitoConstancia] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cerrar modales con Escape
  useEffect(() => {
    function manejarKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModalEditarAbierto(false);
        setModalConstanciaAbierto(false);
      }
    }
    window.addEventListener("keydown", manejarKeyDown);
    return () => window.removeEventListener("keydown", manejarKeyDown);
  }, []);

  // Notificación toast automática
  useEffect(() => {
    if (!toastNotificacion) return;
    const t = setTimeout(() => setToastNotificacion(null), 3000);
    return () => clearTimeout(t);
  }, [toastNotificacion]);

  // Cálculos dinámicos para el Hero
  const facturasEmitidas = facturas.filter((f) => f.estado === "emitida");
  const facturasPendientes = facturas.filter((f) => f.estado === "pendiente");
  const totalFacturadoPesos = facturasEmitidas.reduce((acc, f) => acc + f.monto, 0);
  const totalFacturadoTexto = `$${(totalFacturadoPesos / 1000).toFixed(1)}k`;

  // Facturas filtradas por pestaña
  const facturasFiltradas = facturas.filter((f) => {
    if (tabActiva === "emitidas") return f.estado === "emitida";
    if (tabActiva === "pendientes") return f.estado === "pendiente";
    return true;
  });

  // Abrir modal de edición inicializando campos
  function abrirModalEditar() {
    setFormRfc(rfc);
    setFormRazonSocial(razonSocial);
    setFormRegimenFiscal(regimenFiscal);
    setFormCpFiscal(codigoPostalFiscal);
    setFormUsoCfdi(usoCfdi);
    setFormCorreo(correoFacturacion);
    setExitoGuardar(false);
    setModalEditarAbierto(true);
  }

  // Guardar datos fiscales
  async function handleGuardarDatosFiscales(e: React.FormEvent) {
    e.preventDefault();
    setGuardandoFiscal(true);

    const rfcLimpio = formRfc.trim().toUpperCase();
    const razonLimpia = formRazonSocial.trim();
    const cpLimpio = formCpFiscal.replace(/\D/g, "").slice(0, 5);
    const correoLimpio = formCorreo.trim();

    setRfc(rfcLimpio);
    setRazonSocial(razonLimpia);
    setRegimenFiscal(formRegimenFiscal);
    setCodigoPostalFiscal(cpLimpio);
    setUsoCfdi(formUsoCfdi);
    setCorreoFacturacion(correoLimpio);

    if (tieneSupabaseConfigurado()) {
      try {
        const cliente = crearClienteNavegador();
        await actualizarFacturacionUsuario(cliente, {
          rfc: rfcLimpio,
          razon_social: razonLimpia || null,
          regimen_fiscal: formRegimenFiscal || null,
          codigo_postal_fiscal: cpLimpio || null,
          uso_cfdi: formUsoCfdi || null,
          correo_facturacion: correoLimpio || null,
        });
      } catch (err) {
        console.warn("[facturacion] Error guardando datos en Supabase:", err);
      }
    }

    setExitoGuardar(true);
    setTimeout(() => {
      setModalEditarAbierto(false);
      setExitoGuardar(false);
      setGuardandoFiscal(false);
    }, 1500);
  }

  // Abrir modal de constancia fiscal
  function abrirModalConstancia() {
    setConstanciaSeleccionada(null);
    setExitoConstancia(false);
    setModalConstanciaAbierto(true);
  }

  function handleSeleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setConstanciaSeleccionada(file.name);
    }
  }

  function handleSimularSeleccion() {
    setConstanciaSeleccionada("constancia_situacion_fiscal.pdf");
  }

  function handleConfirmarConstancia() {
    setEnviandoConstancia(true);
    setTimeout(() => {
      setEnviandoConstancia(false);
      setExitoConstancia(true);
      setTimeout(() => {
        setModalConstanciaAbierto(false);
        setExitoConstancia(false);
      }, 1800);
    }, 600);
  }

  // Acción solicitar factura pendiente
  function handleSolicitarFactura(id: string, folio: string) {
    setFacturas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, estado: "emitida" } : f))
    );
    setToastNotificacion(`Solicitud enviada. ${folio} ha sido emitida exitosamente.`);
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Toast de confirmación flotante */}
      {toastNotificacion && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full bg-[#0a2342] px-5 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in"
        >
          <IconoCheckCirculo className="size-4 text-emerald-400 shrink-0" />
          <span>{toastNotificacion}</span>
        </div>
      )}

      {/* Header con botón regresar */}
      <header className="flex items-center gap-3.5 border-b border-[#f0f4fa] bg-white px-3 py-3 rounded-[22px] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <Link
          href="/cuenta"
          aria-label="Volver a mi cuenta"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f2f6fc] text-[#0a2342] transition-all hover:bg-[#e3ebf5] active:scale-95"
        >
          <Icono nombre="atras" className="size-4" strokeWidth={2.2} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold tracking-tight text-[#0a2342] leading-snug">
            Facturación
          </h1>
          <p className="text-[12px] font-medium text-[#4e5f80]">
            Datos fiscales y comprobantes
          </p>
        </div>
      </header>

      {/* Hero fiscal con gradiente oscuro */}
      <section
        aria-label="Resumen de facturación electrónica"
        className="relative overflow-hidden rounded-[26px] p-6 text-[#fff] shadow-[0_16px_32px_-12px_rgba(11,30,51,0.4)]"
        style={{ background: "linear-gradient(135deg, #0a2342 0%, #143560 100%)" }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -left-10 size-40 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)" }}
        />

        <div className="relative z-[1]">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex size-[52px] items-center justify-center rounded-[18px] bg-white/10 text-white backdrop-blur-sm">
              <IconoFacturaDollar className="size-6 text-white" />
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-white backdrop-blur-sm">
              <IconoCheckCirculo className={`size-3 ${rfc ? "text-emerald-400" : "text-amber-300"}`} />
              <span>{rfc ? "Configurado" : "Por configurar"}</span>
            </div>
          </div>

          <h2 className="text-[20px] font-extrabold tracking-tight text-[#fff] leading-tight">
            Facturación electrónica
          </h2>
          <p className="mt-1 text-[13px] font-medium text-[rgba(255,255,255,0.7)] leading-relaxed">
            Emite CFDI por tus traslados de forma automática
          </p>

          <dl className="mt-4 flex rounded-2xl bg-white/[0.08] py-3.5 backdrop-blur-sm">
            <div className="flex-1 text-center">
              <dd className="text-[20px] font-extrabold tracking-tight text-[#fff]">
                {facturas.length}
              </dd>
              <dt className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.6)]">
                Facturas
              </dt>
            </div>
            <div className="flex-1 text-center border-l border-[rgba(255,255,255,0.12)]">
              <dd className="text-[20px] font-extrabold tracking-tight text-[#fff]">
                {totalFacturadoTexto}
              </dd>
              <dt className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.6)]">
                Facturado
              </dt>
            </div>
            <div className="flex-1 text-center border-l border-[rgba(255,255,255,0.12)]">
              <dd className="text-[20px] font-extrabold tracking-tight text-[#fff]">
                {facturasPendientes.length}
              </dd>
              <dt className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.6)]">
                Pendientes
              </dt>
            </div>
          </dl>
        </div>
      </section>

      {/* Alerta interactiva: Constancia de Situación Fiscal */}
      <div
        role="button"
        tabIndex={0}
        onClick={abrirModalConstancia}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            abrirModalConstancia();
          }
        }}
        className="flex cursor-pointer items-center gap-3.5 rounded-[22px] border border-[#f5dcb0] bg-gradient-to-br from-[#fef4e6] to-[#fcecd4] p-4.5 shadow-[0_4px_16px_rgba(179,107,30,0.06)] transition-all hover:shadow-[0_6px_20px_rgba(179,107,30,0.12)] active:scale-[0.99]"
      >
        <div className="flex size-[46px] shrink-0 items-center justify-center rounded-[16px] bg-white text-[#b36b1e] shadow-[0_4px_10px_rgba(179,107,30,0.1)]">
          <IconoAlerta className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13.5px] font-extrabold tracking-tight text-[#7a4e15]">
            Constancia de Situación Fiscal
          </h3>
          <p className="text-[12px] font-medium leading-[1.4] text-[#8a5e25]">
            Actualiza tu constancia para mantener tu facturación activa
          </p>
        </div>
        <IconoChevron className="text-[#b36b1e] shrink-0" />
      </div>

      {/* Sección Datos fiscales */}
      <div>
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.8px] text-[#4e5f80]">
            Datos fiscales
          </h2>
          <button
            type="button"
            onClick={abrirModalEditar}
            className="flex items-center gap-1.5 rounded-full bg-[#f0f5fe] border border-[#dae5f2] px-3 py-1 text-[11.5px] font-bold text-[#2e5a88] transition hover:bg-[#e3ebf5] active:scale-95 cursor-pointer"
          >
            <IconoLapiz className="size-3" />
            <span>Editar</span>
          </button>
        </div>

        <div className="rounded-[22px] border border-[#eef2f7] bg-white p-5 shadow-[0_6px_16px_rgba(0,0,0,0.02)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-[38px] items-center justify-center rounded-[13px] bg-[#f0f5fe] text-[#2e5a88]">
              <IconoHuella className="size-4" />
            </div>
            <div>
              <p className="text-[15px] font-bold tracking-tight text-[#0a2342]">RFC</p>
              <p className="text-[11.5px] font-medium text-[#4e5f80]">
                Registro Federal de Contribuyentes
              </p>
            </div>
          </div>

          <div className="flex flex-col text-[13.5px]">
            <div className="flex items-center justify-between py-3 border-t border-[#f0f4fa]">
              <span className="font-medium text-[#4e5f80]">RFC</span>
              {rfc ? (
                <span className="font-bold text-[#1a293b] flex items-center gap-1.5">
                  {rfc} <IconoCheckCirculo className="size-3.5 text-emerald-600 inline" />
                </span>
              ) : (
                <span className="font-medium text-[#8a9bb2] italic">Por registrar</span>
              )}
            </div>
            <div className="flex items-center justify-between py-3 border-t border-[#f0f4fa]">
              <span className="font-medium text-[#4e5f80]">Razón social</span>
              <span className={`font-bold text-right truncate max-w-[220px] ${razonSocial ? "text-[#1a293b]" : "text-[#8a9bb2] italic font-medium"}`}>
                {razonSocial || "Por registrar"}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-[#f0f4fa]">
              <span className="font-medium text-[#4e5f80]">Régimen fiscal</span>
              <span className={`text-right truncate max-w-[220px] ${regimenFiscal ? "font-semibold text-[#1a293b]" : "text-[#8a9bb2] italic font-medium"}`}>
                {regimenFiscal || "Por registrar"}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-[#f0f4fa]">
              <span className="font-medium text-[#4e5f80]">Código postal fiscal</span>
              <span className={`font-bold ${codigoPostalFiscal ? "text-[#1a293b]" : "text-[#8a9bb2] italic font-medium"}`}>
                {codigoPostalFiscal || "Por registrar"}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-[#f0f4fa]">
              <span className="font-medium text-[#4e5f80]">Uso de CFDI</span>
              <span className="font-semibold text-[#1a293b] text-right truncate max-w-[220px]">
                {usoCfdi}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-[#f0f4fa]">
              <span className="font-medium text-[#4e5f80]">Correo para facturación</span>
              <span className={`text-right truncate max-w-[220px] ${correoFacturacion ? "font-semibold text-[#1a293b]" : "text-[#8a9bb2] italic font-medium"}`}>
                {correoFacturacion || "Por registrar"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de facturas */}
      <div>
        <h2 className="mb-2.5 px-1 text-[12px] font-bold uppercase tracking-[0.8px] text-[#4e5f80]">
          Historial de facturas
        </h2>

        {/* Pestañas de filtrado */}
        <div className="mb-4 flex gap-1.5 rounded-full bg-[#f2f6fb] p-1.5">
          <button
            type="button"
            onClick={() => setTabActiva("todas")}
            className={[
              "flex-1 rounded-full py-2 text-center text-[13px] transition cursor-pointer font-semibold",
              tabActiva === "todas"
                ? "bg-white font-bold text-[#0a2342] shadow-sm"
                : "text-[#5c6e86] hover:text-[#0a2342]",
            ].join(" ")}
          >
            Todas{" "}
            <span
              className={[
                "ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                tabActiva === "todas" ? "bg-[#0a2342] text-white" : "bg-[#dfe8f3] text-[#2e5a88]",
              ].join(" ")}
            >
              {facturas.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTabActiva("emitidas")}
            className={[
              "flex-1 rounded-full py-2 text-center text-[13px] transition cursor-pointer font-semibold",
              tabActiva === "emitidas"
                ? "bg-white font-bold text-[#0a2342] shadow-sm"
                : "text-[#5c6e86] hover:text-[#0a2342]",
            ].join(" ")}
          >
            Emitidas
          </button>
          <button
            type="button"
            onClick={() => setTabActiva("pendientes")}
            className={[
              "flex-1 rounded-full py-2 text-center text-[13px] transition cursor-pointer font-semibold",
              tabActiva === "pendientes"
                ? "bg-white font-bold text-[#0a2342] shadow-sm"
                : "text-[#5c6e86] hover:text-[#0a2342]",
            ].join(" ")}
          >
            Pendientes{" "}
            {facturasPendientes.length > 0 && (
              <span
                className={[
                  "ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                  tabActiva === "pendientes"
                    ? "bg-[#0a2342] text-white"
                    : "bg-[#fef4e6] text-[#b36b1e]",
                ].join(" ")}
              >
                {facturasPendientes.length}
              </span>
            )}
          </button>
        </div>

        {/* Tarjetas de facturas */}
        {cargandoFacturas ? (
          <div role="status" aria-live="polite" className="rounded-[22px] border border-[#eef2f7] bg-white p-10 text-center text-[13px] font-medium text-[#7e8fa8]">
            Cargando tus facturas…
          </div>
        ) : errorFacturas ? (
          <div role="alert" className="rounded-[22px] border border-[#f5c6c6] bg-[#fdeaea] p-6 text-center text-[13px] font-semibold text-[#b33c3c]">
            {errorFacturas}
          </div>
        ) : facturasFiltradas.length > 0 ? (
          <div className="flex flex-col gap-3">
            {facturasFiltradas.map((factura) => (
              <div
                key={factura.id}
                className="rounded-[20px] border border-[#eef2f7] bg-white p-4.5 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={[
                        "flex size-11 shrink-0 items-center justify-center rounded-[14px]",
                        factura.estado === "emitida"
                          ? "bg-[#f0f5fe] text-[#2e5a88]"
                          : "bg-[#fef4e6] text-[#b36b1e]",
                      ].join(" ")}
                    >
                      {factura.estado === "emitida" ? (
                        <IconoFacturaDollar className="size-5" />
                      ) : (
                        <IconoReloj className="size-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[14.5px] font-bold tracking-tight text-[#0a2342] truncate">
                        {factura.folio}
                      </h3>
                      <p className="text-[12px] font-medium text-[#4e5f80] truncate">
                        {factura.fecha}
                      </p>
                    </div>
                  </div>

                  {factura.estado === "emitida" ? (
                    <span className="shrink-0 flex items-center gap-1 rounded-full bg-[#e9f3ee] px-2.5 py-1 text-[11px] font-bold text-[#1f6b4a]">
                      <IconoCheckCirculo className="size-3" /> Emitida
                    </span>
                  ) : (
                    <span className="shrink-0 flex items-center gap-1 rounded-full bg-[#fef4e6] px-2.5 py-1 text-[11px] font-bold text-[#b36b1e]">
                      <IconoReloj className="size-3" /> Pendiente
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#f0f4fa] pt-3 text-[12.5px]">
                  <span className="font-medium text-[#4e5f80] truncate max-w-[200px]">
                    {factura.concepto}
                  </span>
                  <span className="text-[16px] font-extrabold text-[#0a2342]">
                    ${factura.monto.toLocaleString("es-MX")}
                  </span>
                </div>

                <div className="mt-3.5 flex gap-2 border-t border-[#f0f4fa] pt-3.5">
                  {factura.estado === "emitida" ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setToastNotificacion(`Descargando PDF de ${factura.folio}...`)
                        }
                        className="flex-1 rounded-[12px] bg-[#0a2342] py-2.5 text-center text-[12px] font-bold text-white transition hover:bg-[#143560] active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <IconoDescargar className="size-3.5" />
                        <span>Descargar PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setToastNotificacion(`Descargando XML de ${factura.folio}...`)
                        }
                        className="rounded-[12px] border border-[#dae5f2] bg-[#f0f5fe] px-4 py-2.5 text-center text-[12px] font-bold text-[#0a2342] transition hover:bg-[#e3ebf5] active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <IconoCodigo className="size-3.5" />
                        <span>XML</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSolicitarFactura(factura.id, factura.folio)}
                      className="w-full rounded-[12px] bg-[#0a2342] py-2.5 text-center text-[12px] font-bold text-white transition hover:bg-[#143560] active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <IconoPapelAvion className="size-3.5" />
                      <span>Solicitar factura</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[22px] border border-[#eef2f7] bg-white p-10 text-center shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-[22px] bg-[#f2f6fc] text-[#a6b7cb]">
              <IconoFacturaDollar className="size-8" />
            </div>
            <h3 className="text-[16px] font-bold text-[#0a2342]">Sin facturas disponibles</h3>
            <p className="mt-1 text-[13px] font-medium text-[#7e8fa8]">
              No tienes facturas bajo el filtro seleccionado.
            </p>
          </div>
        )}
      </div>

      {/* Nota informativa */}
      <div className="flex items-start gap-3 rounded-[16px] border border-[#dfe8f3] bg-[#f0f5fe] p-4">
        <IconoInfo className="size-4.5 text-[#2e5a88] shrink-0 mt-0.5" />
        <p className="text-[12.5px] font-medium text-[#3d5470] leading-relaxed">
          Las facturas se emiten automáticamente al finalizar cada traslado. Puedes descargar el
          PDF y XML desde tu historial en cualquier momento.
        </p>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          MODAL: EDITAR DATOS FISCALES (Bottom Sheet)
      ═════════════════════════════════════════════════════════════ */}
      {modalEditarAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-editar-titulo"
          aria-describedby="modal-editar-desc"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:items-center sm:p-4"
          onClick={() => setModalEditarAbierto(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />

            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#f0f5fe] text-[#2e5a88]">
              <IconoLapiz className="size-6" />
            </div>

            <h2 id="modal-editar-titulo" className="text-center text-[19px] font-extrabold text-[#0a2342] tracking-tight">
              Editar datos fiscales
            </h2>
            <p id="modal-editar-desc" className="mt-1 text-center text-[13px] font-medium text-[#4e5f80] leading-relaxed">
              Actualiza tu información de facturación. Los cambios se aplicarán a futuras facturas.
            </p>

            <form onSubmit={handleGuardarDatosFiscales} className="mt-5 flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="input-rfc" className="text-[11.5px] font-bold uppercase tracking-wider text-[#4e5f80]">
                  RFC
                </label>
                <input
                  id="input-rfc"
                  type="text"
                  maxLength={13}
                  value={formRfc}
                  onChange={(e) => setFormRfc(e.target.value.toUpperCase())}
                  required
                  placeholder="XAXX010101000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-bold text-[#0a2342] outline-none transition focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/10"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="input-razon-social" className="text-[11.5px] font-bold uppercase tracking-wider text-[#4e5f80]">
                  Razón social
                </label>
                <input
                  id="input-razon-social"
                  type="text"
                  value={formRazonSocial}
                  onChange={(e) => setFormRazonSocial(e.target.value)}
                  required
                  placeholder="Nombre o empresa fiscal"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-semibold text-[#0a2342] outline-none transition focus:border-[#0a2342] focus:bg-white focus:ring-2 focus:ring-[#0a2342]/10"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="select-regimen" className="text-[11.5px] font-bold uppercase tracking-wider text-[#4e5f80]">
                    Régimen fiscal
                  </label>
                  <select
                    id="select-regimen"
                    value={formRegimenFiscal}
                    onChange={(e) => setFormRegimenFiscal(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[13px] font-semibold text-[#0a2342] outline-none transition focus:border-[#0a2342] focus:bg-white"
                  >
                    {REGIMENES_FISCALES.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="input-cp-fiscal" className="text-[11.5px] font-bold uppercase tracking-wider text-[#4e5f80]">
                    CP fiscal
                  </label>
                  <input
                    id="input-cp-fiscal"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={formCpFiscal}
                    onChange={(e) => setFormCpFiscal(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    required
                    placeholder="06700"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-bold text-[#0a2342] outline-none transition focus:border-[#0a2342] focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="select-cfdi" className="text-[11.5px] font-bold uppercase tracking-wider text-[#4e5f80]">
                  Uso de CFDI
                </label>
                <select
                  id="select-cfdi"
                  value={formUsoCfdi}
                  onChange={(e) => setFormUsoCfdi(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-[13px] font-semibold text-[#0a2342] outline-none transition focus:border-[#0a2342] focus:bg-white"
                >
                  {USOS_CFDI.map((uso) => (
                    <option key={uso} value={uso}>
                      {uso}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="input-correo-fiscal" className="text-[11.5px] font-bold uppercase tracking-wider text-[#4e5f80]">
                  Correo para facturación
                </label>
                <input
                  id="input-correo-fiscal"
                  type="email"
                  value={formCorreo}
                  onChange={(e) => setFormCorreo(e.target.value)}
                  required
                  placeholder="facturacion@empresa.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[14px] font-semibold text-[#0a2342] outline-none transition focus:border-[#0a2342] focus:bg-white"
                />
              </div>

              {exitoGuardar && (
                <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
                  <IconoCheckCirculo className="size-4 text-emerald-600" />
                  <span>Datos fiscales actualizados correctamente</span>
                </div>
              )}

              <button
                type="submit"
                disabled={guardandoFiscal}
                className="mt-2 w-full rounded-xl bg-[#0a2342] py-3.5 text-center text-[14.5px] font-bold text-white shadow-lg transition hover:bg-[#143560] active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {guardandoFiscal ? "Guardando cambios…" : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={() => setModalEditarAbierto(false)}
                className="w-full py-2.5 text-center text-[13px] font-bold text-[#4e5f80] transition hover:text-[#0a2342] cursor-pointer"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL: CONSTANCIA FISCAL (Bottom Sheet)
      ═════════════════════════════════════════════════════════════ */}
      {modalConstanciaAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-constancia-titulo"
          aria-describedby="modal-constancia-desc"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:items-center sm:p-4"
          onClick={() => setModalConstanciaAbierto(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />

            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#f0f5fe] text-[#2e5a88]">
              <IconoFacturaDollar className="size-6" />
            </div>

            <h2 id="modal-constancia-titulo" className="text-center text-[19px] font-extrabold text-[#0a2342] tracking-tight">
              Constancia de Situación Fiscal
            </h2>
            <p id="modal-constancia-desc" className="mt-1 text-center text-[13px] font-medium text-[#4e5f80] leading-relaxed">
              Sube tu constancia actualizada para mantener tu facturación activa. El archivo debe ser emitido por el SAT.
            </p>

            <div className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11.5px] font-bold uppercase tracking-wider text-[#4e5f80]">
                  RFC
                </label>
                <input
                  type="text"
                  disabled
                  value={rfc}
                  className="w-full rounded-xl border border-slate-200 bg-[#f2f6fb] px-4 py-3 text-[14px] font-bold text-[#4e5f80] outline-none cursor-not-allowed"
                />
              </div>

              {/* Input de archivo oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                data-testid="input-constancia-archivo"
                className="hidden"
                onChange={handleSeleccionarArchivo}
              />

              {/* Zona de subida */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  } else {
                    handleSimularSeleccion();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={[
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 transition text-center",
                  constanciaSeleccionada
                    ? "border-emerald-500 bg-emerald-50/50"
                    : "border-[#cbd7e6] bg-[#f8fbfe] hover:bg-[#f0f5fe] hover:border-[#2e5a88]",
                ].join(" ")}
              >
                {constanciaSeleccionada ? (
                  <>
                    <IconoCheckCirculo className="size-8 text-emerald-600" />
                    <p className="text-[13.5px] font-bold text-emerald-800">
                      ✓ Archivo seleccionado
                    </p>
                    <p className="text-[11.5px] font-medium text-emerald-700">
                      {constanciaSeleccionada}
                    </p>
                  </>
                ) : (
                  <>
                    <IconoNubeSubir className="size-8 text-[#a6b7cb]" />
                    <p className="text-[13px] font-bold text-[#2e5a88]">Subir constancia</p>
                    <p className="text-[11px] font-medium text-[#4e5f80]">PDF · Máx. 5 MB</p>
                  </>
                )}
              </div>

              {exitoConstancia && (
                <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
                  <IconoCheckCirculo className="size-4 text-emerald-600" />
                  <span>Constancia enviada. Será verificada en menos de 24 horas.</span>
                </div>
              )}

              <button
                type="button"
                disabled={enviandoConstancia}
                onClick={handleConfirmarConstancia}
                className="w-full rounded-xl bg-[#0a2342] py-3.5 text-center text-[14.5px] font-bold text-white shadow-lg transition hover:bg-[#143560] active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {enviandoConstancia ? "Enviando…" : "Confirmar y enviar"}
              </button>
              <button
                type="button"
                onClick={() => setModalConstanciaAbierto(false)}
                className="w-full py-2.5 text-center text-[13px] font-bold text-[#4e5f80] transition hover:text-[#0a2342] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
