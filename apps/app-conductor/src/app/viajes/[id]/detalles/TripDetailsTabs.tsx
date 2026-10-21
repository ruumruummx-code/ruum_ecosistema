"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ETIQUETA_TIPO_VEHICULO } from "@ruum/shared/constants";
import type { Database } from "@ruum/shared/types";
import { crearClienteNavegador } from "@/lib/supabase-browser";
import { formatearDuracion, nombreVehiculo } from "../../trips-utils";
import { obtenerDatosOperativosTraslado } from "@ruum/api/transfers";
import { obtenerContactoUsuarioVisible } from "@ruum/api/identity";
import { listarGastosTraslado } from "@ruum/api/drivers";
import { TabItinerario } from "./tabs/TabItinerario";
import { TabVehiculo } from "./tabs/TabVehiculo";
import { TabPago } from "./tabs/TabPago";
import { TabOperacion } from "./tabs/TabOperacion";
import { copiarTexto } from "./tabs/detalles-utils";

type PasaporteRow = Database["public"]["Views"]["pasaporte_digital"]["Row"];
type TabId = "itinerario" | "vehiculo" | "pago" | "operacion";

export function TripDetailsTabs({ pasaporte }: { pasaporte: PasaporteRow }) {
  const [activeTab, setActiveTab] = useState<TabId>("itinerario");
  const [copiado, setCopiado] = useState<string | null>(null);
  const [reembolsoPago, setReembolsoPago] = useState(0);

  const trasladoId = pasaporte.traslado_id!;
  const folio = trasladoId.slice(0, 8).toUpperCase();

  const origenCiudad = pasaporte.origen_ciudad || "Ciudad de Origen";
  const origenDir = pasaporte.origen_direccion || "Dirección pendiente";
  const destinoCiudad = pasaporte.destino_ciudad || "Ciudad Destino";
  const destinoDir = pasaporte.destino_direccion || "Dirección pendiente";
  const distancia = pasaporte.distancia_km != null ? `${pasaporte.distancia_km.toFixed(1)} km` : "Por confirmar";
  const tiempoEstimado = formatearDuracion(pasaporte.tiempo_estimado_horas);

  const vehiculo = nombreVehiculo(pasaporte);
  const placas = pasaporte.vehiculo_placas || "POR ASIGNAR";
  const vin = pasaporte.vehiculo_vin || "POR CONFIRMAR";
  const marca = pasaporte.vehiculo_marca || (pasaporte.vehiculo_modelo ? pasaporte.vehiculo_modelo.split(" ")[0] : "No especificada");
  const modelo = pasaporte.vehiculo_modelo || "No especificado";
  const anio = pasaporte.vehiculo_anio ? String(pasaporte.vehiculo_anio) : "No especificado";
  const color = pasaporte.vehiculo_color || "No especificado";
  const condicion = pasaporte.vehiculo_condicion || "En condiciones de circular rodando";
  const categoria = pasaporte.vehiculo_categoria_tarifa || (pasaporte.vehiculo_tipo ? ETIQUETA_TIPO_VEHICULO[pasaporte.vehiculo_tipo] : "Particular / Estándar");
  const gama = pasaporte.vehiculo_gama || "Comercial / Convencional";
  const tipoOperativo = pasaporte.vehiculo_tipo
    ? `${ETIQUETA_TIPO_VEHICULO[pasaporte.vehiculo_tipo]} · Traslado rodando con conductor certificado`
    : "Traslado rodando con conductor certificado";

  const fotosIniciales = pasaporte.evidencia_inicial_fotos_sincronizadas ?? 0;
  const estadoTraslado = pasaporte.estado;
  let estadoRecepcionTexto = "Pendiente de inspección en origen";
  let estadoRecepcionTono: "warning" | "success" = "warning";

  if (
    fotosIniciales > 0 ||
    estadoTraslado === "evidencia_inicial_completada" ||
    estadoTraslado === "vehiculo_recibido" ||
    estadoTraslado === "traslado_en_curso" ||
    estadoTraslado === "llegada_a_destino" ||
    estadoTraslado === "evidencia_final_en_proceso" ||
    estadoTraslado === "evidencia_final_completada" ||
    estadoTraslado === "entrega_confirmada" ||
    estadoTraslado === "servicio_cerrado"
  ) {
    estadoRecepcionTexto = fotosIniciales > 0
      ? `Inspeccionado (${fotosIniciales} fotos sincronizadas)`
      : "Recepción completada y documentada";
    estadoRecepcionTono = "success";
  } else if (
    estadoTraslado === "conductor_en_punto_de_recoleccion" ||
    estadoTraslado === "verificacion_vehiculo_en_proceso" ||
    estadoTraslado === "evidencia_inicial_en_proceso"
  ) {
    estadoRecepcionTexto = "En proceso de inspección y recepción en origen";
    estadoRecepcionTono = "warning";
  }

  const pagoTotal = pasaporte.ganancia_conductor || 0;
  const fecha = pasaporte.creado_en ? new Date(pasaporte.creado_en).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "Fecha pendiente";
  const horaInicio = pasaporte.creado_en ? new Date(pasaporte.creado_en).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) + " hrs" : "Por confirmar";

  const [ventanaRecoleccion, setVentanaRecoleccion] = useState<string | null>((pasaporte as unknown as { ventana_recoleccion?: string | null }).ventana_recoleccion ?? null);
  const [ventanaEntrega, setVentanaEntrega] = useState<string | null>((pasaporte as unknown as { ventana_entrega?: string | null }).ventana_entrega ?? null);
  const [solicitanteNombre, setSolicitanteNombre] = useState<string>("Titular de la cuenta");
  const [solicitanteTelefono, setSolicitanteTelefono] = useState<string>("");

  useEffect(() => {
    let cancelado = false;
    async function cargarVentanasYTitular() {
      try {
        const cliente = crearClienteNavegador();
        const tid = pasaporte.traslado_id;
        if (!tid) return;

        const d = await obtenerDatosOperativosTraslado(cliente, tid);
        if (!cancelado && d) {
          if (d.ventana_recoleccion) setVentanaRecoleccion(d.ventana_recoleccion);
          if (d.ventana_entrega) setVentanaEntrega(d.ventana_entrega);
        }

        const effectiveUserId = d?.usuario_id || pasaporte.usuario_id;
        if (effectiveUserId) {
          const u = await obtenerContactoUsuarioVisible(cliente, effectiveUserId);
          if (!cancelado && u) {
            if (u.nombre) setSolicitanteNombre(u.nombre);
            if (u.telefono) setSolicitanteTelefono(u.telefono);
          }
        }
      } catch {
        // fallback silencioso
      }
    }
    void cargarVentanasYTitular();
    return () => { cancelado = true; };
  }, [pasaporte.traslado_id, pasaporte.usuario_id]);

  const entregaNombre = pasaporte.contacto_entrega_nombre || "Contacto en Origen";
  const entregaTelefono = pasaporte.contacto_entrega_telefono || "";
  const recepcionNombre = pasaporte.contacto_recepcion_nombre || "Contacto en Destino";
  const recepcionTelefono = pasaporte.contacto_recepcion_telefono || "";
  const notasRecogida = pasaporte.origen_referencias || "Sin notas adicionales de recogida registradas.";
  const notasEntrega = pasaporte.destino_referencias || "Sin notas adicionales de entrega registradas.";

  const precioBasePago = Number(pasaporte.precio_final ?? pasaporte.precio_cotizado ?? (pagoTotal ? pagoTotal / 0.85 : 0));
  const tasaPago = precioBasePago > 0 ? Math.max(0, precioBasePago - pagoTotal) : 0;
  const bonosPago = 0;
  const ajustesPago = 0;

  useEffect(() => {
    let cancelado = false;
    async function cargarReembolso() {
      try {
        const cliente = crearClienteNavegador();
        const data = await listarGastosTraslado(cliente, trasladoId);
        if (!cancelado && data) {
          const total = data.reduce((s: number, g) => s + Number(g.monto || 0), 0);
          setReembolsoPago(total);
        }
      } catch {
        // ignora
      }
    }
    void cargarReembolso();
    return () => { cancelado = true; };
  }, [trasladoId]);

  const depositoPago = Math.max(0, precioBasePago + bonosPago + ajustesPago - tasaPago + reembolsoPago);

  return (
    <div className="mx-auto w-full max-w-md bg-surface min-h-screen flex flex-col text-text-primary pb-6 px-4">
      {/* HEADER */}
      <header className="flex items-center justify-between py-4 border-b border-border/15">
        <Link href={`/viajes/${trasladoId}`} className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-surface-elevated">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </Link>
        <span className="font-display text-xs font-black uppercase tracking-widest text-text-primary">DETALLES DEL TRASLADO</span>
        <div className="w-10" />
      </header>

      {/* TABS */}
      <div className="mt-4 flex w-full rounded-full border border-border/20 bg-surface-elevated p-1 select-none overflow-x-auto no-scrollbar">
        {[
          { id: "itinerario", label: "Ruta" },
          { id: "vehiculo", label: "Vehículo" },
          { id: "pago", label: "Pago" },
          { id: "operacion", label: "Operación" }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`flex-1 rounded-full px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer min-w-max ${
              activeTab === tab.id
                ? "bg-route-action text-white shadow-md"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="mt-5 flex-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "itinerario" && (
          <TabItinerario
            origenCiudad={origenCiudad}
            origenDir={origenDir}
            destinoCiudad={destinoCiudad}
            destinoDir={destinoDir}
            distancia={distancia}
            tiempoEstimado={tiempoEstimado}
          />
        )}

        {activeTab === "vehiculo" && (
          <TabVehiculo
            vehiculo={vehiculo}
            placas={placas}
            vin={vin}
            marca={marca}
            modelo={modelo}
            anio={anio}
            color={color}
            categoria={categoria}
            gama={gama}
            condicion={condicion}
            tipoOperativo={tipoOperativo}
            estadoRecepcionTono={estadoRecepcionTono}
            estadoRecepcionTexto={estadoRecepcionTexto}
            copiar={copiarTexto}
            copiado={copiado}
            setCopiado={setCopiado}
          />
        )}

        {activeTab === "pago" && (
          <TabPago
            depositoPago={depositoPago}
            folio={folio}
            precioBasePago={precioBasePago}
            bonosPago={bonosPago}
            ajustesPago={ajustesPago}
            tasaPago={tasaPago}
            reembolsoPago={reembolsoPago}
            copiar={copiarTexto}
            copiado={copiado}
            setCopiado={setCopiado}
          />
        )}

        {activeTab === "operacion" && (
          <TabOperacion
            folio={folio}
            fecha={fecha}
            horaInicio={horaInicio}
            ventanaRecoleccion={ventanaRecoleccion}
            ventanaEntrega={ventanaEntrega}
            solicitanteNombre={solicitanteNombre}
            solicitanteTelefono={solicitanteTelefono}
            entregaNombre={entregaNombre}
            entregaTelefono={entregaTelefono}
            recepcionNombre={recepcionNombre}
            recepcionTelefono={recepcionTelefono}
            notasRecogida={notasRecogida}
            notasEntrega={notasEntrega}
            copiar={copiarTexto}
            copiado={copiado}
            setCopiado={setCopiado}
          />
        )}
      </div>
    </div>
  );
}
