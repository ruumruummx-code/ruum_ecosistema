"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MobileHeader } from "@ruum/ui";
import { MobileBottomSheet } from "../../components/MobileBottomSheet";
import styles from "./faq.module.css";

type CategoriaFaq = "all" | "solicitud" | "traslado" | "pagos" | "evidencia" | "cuenta";

interface FaqItemData {
  id: string;
  categoria: CategoriaFaq;
  pregunta: string;
  icono: string;
  respuesta: React.ReactNode;
}

const CATEGORIAS: { id: CategoriaFaq; label: string; icono: string }[] = [
  { id: "all", label: "Todas", icono: "grid" },
  { id: "solicitud", label: "Solicitud", icono: "plus" },
  { id: "traslado", label: "Traslado", icono: "truck" },
  { id: "pagos", label: "Pagos", icono: "card" },
  { id: "evidencia", label: "Evidencia", icono: "camera" },
  { id: "cuenta", label: "Cuenta", icono: "user" },
];

const FAQS: FaqItemData[] = [
  // SOLICITUD
  {
    id: "solicitud-1",
    categoria: "solicitud",
    icono: "plus",
    pregunta: "¿Cómo solicito un traslado?",
    respuesta: (
      <>
        Solicitar un traslado es muy sencillo. Desde la pantalla de Inicio, toca el botón <strong>&quot;Solicitar traslado&quot;</strong> y sigue los 5 pasos guiados:
        <ul className="mt-2 list-disc pl-4 space-y-1">
          <li>Conoce tu tarifa (origen, destino y vehículo)</li>
          <li>Datos completos del vehículo</li>
          <li>Domicilios y contactos de entrega/recepción</li>
          <li>Detalles del servicio (fecha, horario, motivo)</li>
          <li>Pago seguro</li>
        </ul>
        <p className="mt-2">Recibirás una confirmación inmediata con tu número de traslado.</p>
      </>
    ),
  },
  {
    id: "solicitud-2",
    categoria: "solicitud",
    icono: "calendar",
    pregunta: "¿Puedo programar un traslado con anticipación?",
    respuesta: (
      <>
        Sí. En el <strong>Paso 1</strong> del flujo de solicitud, selecciona la opción <strong>&quot;Programar fecha&quot;</strong> en lugar de &quot;Lo antes posible&quot;. Podrás elegir la fecha y la ventana horaria de recolección y entrega que mejor te convenga.
      </>
    ),
  },
  {
    id: "solicitud-3",
    categoria: "solicitud",
    icono: "document",
    pregunta: "¿Qué documentación necesita mi vehículo?",
    respuesta: (
      <>
        Para proceder con el traslado, tu vehículo debe cumplir con la documentación mínima:
        <ul className="mt-2 list-disc pl-4 space-y-1">
          <li>Tarjeta de circulación vigente</li>
          <li>Verificación vehicular vigente</li>
          <li>Ambas placas instaladas</li>
          <li>El vehículo enciende y puede circular rodando</li>
        </ul>
        <p className="mt-2">
          Puedes subir estos documentos desde la sección <Link href="/cuenta/verificacion-documentos" className="font-bold text-[#2e5a88] underline">Cuenta → Verificación y documentos</Link>.
        </p>
      </>
    ),
  },

  // TRASLADO
  {
    id: "traslado-1",
    categoria: "traslado",
    icono: "map",
    pregunta: "¿Cómo sigo el estatus de mi traslado?",
    respuesta: (
      <>
        Puedes consultar el estatus en tiempo real desde dos lugares:
        <ul className="mt-2 list-disc pl-4 space-y-1">
          <li><strong>Inicio:</strong> La tarjeta de traslado activo muestra el progreso y el estatus actual.</li>
          <li><strong>Traslados:</strong> Consulta la pestaña &quot;Activos&quot; para ver todos tus traslados en curso.</li>
          <li><strong>Pasaporte digital:</strong> Toca cualquier traslado para ver la línea de tiempo completa con cada etapa.</li>
        </ul>
        <p className="mt-2">También recibirás notificaciones push en cada cambio importante.</p>
      </>
    ),
  },
  {
    id: "traslado-2",
    categoria: "traslado",
    icono: "user-check",
    pregunta: "¿Quién traslada mi vehículo?",
    respuesta: (
      <>
        Todos los traslados son realizados por <strong>conductores certificados</strong> de Ruum Ruum. En el <strong>Pasaporte Digital</strong> de tu traslado encontrarás:
        <ul className="mt-2 list-disc pl-4 space-y-1">
          <li>Nombre completo y fotografía del conductor</li>
          <li>Estatus de certificación</li>
          <li>Calificación e identificador interno</li>
          <li>Canal de contacto autorizado</li>
        </ul>
      </>
    ),
  },
  {
    id: "traslado-3",
    categoria: "traslado",
    icono: "clock",
    pregunta: "¿Cuánto tarda un traslado?",
    respuesta: (
      <>
        El tiempo depende de la distancia entre origen y destino. Al solicitar tu traslado, verás una <strong>estimación de tiempo</strong> junto con la tarifa. Por ejemplo, un traslado CDMX → Guadalajara toma aproximadamente 6 horas 20 minutos. El conductor te dará un ETA actualizado una vez que inicie el traslado.
      </>
    ),
  },

  // PAGOS
  {
    id: "pagos-1",
    categoria: "pagos",
    icono: "card",
    pregunta: "¿Qué métodos de pago aceptan?",
    respuesta: (
      <>
        Aceptamos los siguientes métodos de pago:
        <ul className="mt-2 list-disc pl-4 space-y-1">
          <li><strong>Tarjeta bancaria:</strong> débito o crédito</li>
          <li><strong>Transferencia:</strong> pago por transferencia electrónica</li>
          <li><strong>Pago empresarial:</strong> para cuentas corporativas</li>
          <li><strong>Crédito corporativo:</strong> disponible en fases futuras</li>
        </ul>
        <p className="mt-2">El pago se procesa de forma segura a través de <strong>Stripe</strong>.</p>
      </>
    ),
  },
  {
    id: "pagos-2",
    categoria: "pagos",
    icono: "invoice",
    pregunta: "¿Puedo solicitar factura (CFDI)?",
    respuesta: (
      <>
        Sí. Para emitir tu factura, primero debes configurar tus <strong>datos fiscales</strong> desde <Link href="/cuenta/verificacion-documentos" className="font-bold text-[#2e5a88] underline">Cuenta → Verificación y documentos → Información fiscal</Link>. Necesitarás subir tu <strong>Constancia de Situación Fiscal</strong> y verificar tu RFC, razón social, régimen fiscal y uso de CFDI. Una vez configurado, podrás solicitar factura al finalizar cada traslado.
      </>
    ),
  },
  {
    id: "pagos-3",
    categoria: "pagos",
    icono: "times",
    pregunta: "¿Qué pasa si cancelo un traslado?",
    respuesta: (
      <>
        Al confirmar tu solicitud, aceptas nuestra <strong>política de cancelación</strong>. El reembolso depende del momento en que canceles:
        <ul className="mt-2 list-disc pl-4 space-y-1">
          <li><strong>Antes de asignar conductor:</strong> reembolso completo</li>
          <li><strong>Después de asignar conductor:</strong> cargo por servicio</li>
          <li><strong>Con conductor en camino:</strong> cargo mayor según distancia</li>
        </ul>
        <p className="mt-2">Para cancelar, contacta a soporte desde el pasaporte digital del traslado.</p>
      </>
    ),
  },

  // EVIDENCIA
  {
    id: "evidencia-1",
    categoria: "evidencia",
    icono: "camera",
    pregunta: "¿Qué es el check de evidencia?",
    respuesta: (
      <>
        El check de evidencia documenta el estado de tu vehículo al inicio y al final del traslado. Incluye:
        <ul className="mt-2 list-disc pl-4 space-y-1">
          <li>Fotografías exteriores e interiores</li>
          <li>Kilometraje y nivel de combustible</li>
          <li>Estado del tablero y placas</li>
          <li>Daños visibles documentados</li>
          <li>Observaciones del conductor</li>
          <li>Firma o confirmación de entrega</li>
        </ul>
        <p className="mt-2">Puedes ver toda la evidencia en el <strong>Pasaporte Digital</strong> de tu traslado.</p>
      </>
    ),
  },
  {
    id: "evidencia-2",
    categoria: "evidencia",
    icono: "image",
    pregunta: "¿Cuándo puedo ver las fotos de mi vehículo?",
    respuesta: (
      <>
        Las fotografías se cargan en dos momentos:
        <ul className="mt-2 list-disc pl-4 space-y-1">
          <li><strong>Check inicial:</strong> Antes de iniciar el traslado. Recibirás una notificación cuando estén disponibles.</li>
          <li><strong>Check final:</strong> Al entregar el vehículo en el destino. Se cargan antes de confirmar la entrega.</li>
        </ul>
        <p className="mt-2">Ambas evidencias quedan guardadas en el Pasaporte Digital de tu traslado de forma permanente.</p>
      </>
    ),
  },
  {
    id: "evidencia-3",
    categoria: "evidencia",
    icono: "alert",
    pregunta: "¿Cómo reporto un daño o incidente?",
    respuesta: (
      <>
        Si detectas un daño o incidente durante el traslado:
        <ul className="mt-2 list-disc pl-4 space-y-1">
          <li>Abre el <strong>Pasaporte Digital</strong> del traslado activo</li>
          <li>Toca la opción <strong>&quot;Contacto con soporte&quot;</strong></li>
          <li>Selecciona <strong>&quot;Reportar daño o incidente&quot;</strong></li>
          <li>Adjunta fotografías y describe el problema</li>
        </ul>
        <p className="mt-2">Nuestro equipo te contactará de inmediato. También puedes llamar a soporte 24/7 desde el botón flotante.</p>
      </>
    ),
  },

  // CUENTA
  {
    id: "cuenta-1",
    categoria: "cuenta",
    icono: "car",
    pregunta: "¿Cómo guardo mis vehículos frecuentes?",
    respuesta: (
      <>
        Desde <strong>Cuenta → Mis vehículos</strong>, toca <strong>&quot;Agregar vehículo&quot;</strong> y completa los datos. Puedes asignar un <strong>alias</strong> para identificarlo rápidamente (ej. &quot;Mi camioneta&quot;, &quot;Auto de oficina&quot;, &quot;Unidad 03&quot;). Al solicitar un nuevo traslado, podrás seleccionar uno de tus vehículos guardados para agilizar el proceso.
      </>
    ),
  },
  {
    id: "cuenta-2",
    categoria: "cuenta",
    icono: "shield",
    pregunta: "¿Cómo verifico mi identidad?",
    respuesta: (
      <>
        Desde <Link href="/cuenta/verificacion-documentos" className="font-bold text-[#2e5a88] underline">Cuenta → Verificación y documentos</Link>, sube los siguientes documentos:
        <ul className="mt-2 list-disc pl-4 space-y-1">
          <li><strong>Identificación oficial (INE):</strong> frente y reverso</li>
          <li><strong>Comprobante de domicilio:</strong> no mayor a 3 meses</li>
          <li><strong>Constancia de Situación Fiscal:</strong> para facturación</li>
        </ul>
        <p className="mt-2">Nuestro equipo verifica los documentos en un plazo máximo de <strong>24 horas</strong>. Recibirás una notificación cuando tu verificación esté completa.</p>
      </>
    ),
  },
  {
    id: "cuenta-3",
    categoria: "cuenta",
    icono: "user-cog",
    pregunta: "¿Cómo actualizo mis datos personales?",
    respuesta: (
      <>
        Ve a <Link href="/cuenta/datos-personales" className="font-bold text-[#2e5a88] underline">Cuenta → Datos personales</Link>. Ahí podrás actualizar tu nombre, teléfono, fecha de nacimiento y dirección principal. Ten en cuenta que:
        <ul className="mt-2 list-disc pl-4 space-y-1">
          <li>El <strong>correo electrónico</strong> no se puede cambiar directamente; contacta a soporte.</li>
          <li>Si cambias tu dirección, asegúrate de que coincida con tu comprobante de domicilio.</li>
        </ul>
        <p className="mt-2">No olvides tocar <strong>&quot;Guardar cambios&quot;</strong> al terminar.</p>
      </>
    ),
  },
  {
    id: "cuenta-4",
    categoria: "cuenta",
    icono: "user-times",
    pregunta: "¿Cómo elimino mi cuenta?",
    respuesta: (
      <>
        Puedes eliminar tu cuenta desde <Link href="/cuenta/datos-personales" className="font-bold text-[#2e5a88] underline">Cuenta → Datos personales → Zona de riesgo</Link> o contactando directamente a <Link href="/soporte?motivo=eliminar_cuenta" className="font-bold text-[#2e5a88] underline">Soporte</Link>. Ten en cuenta que esta acción es <strong>permanente e irreversible</strong>: se borrarán todos tus datos, traslados e información personal. Si solo deseas desactivar notificaciones o cerrar sesión, usa las opciones correspondientes sin eliminar la cuenta.
      </>
    ),
  },
];

/* SVG helpers */
function IconoFaqSvg({ tipo, className = "size-4" }: { tipo: string; className?: string }) {
  switch (tipo) {
    case "grid":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "plus":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "document":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case "map":
    case "truck":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );
    case "user-check":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      );
    case "clock":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "card":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      );
    case "invoice":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16l3-1.5 3 1.5 3-1.5 3 1.5 3-1.5 3 1.5V8z" />
          <path d="M14 2v6h6" />
        </svg>
      );
    case "times":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    case "camera":
    case "image":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );
    case "alert":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "car":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 11l2-4h10l2 4M4 17h16M7 17v2M17 17v2" />
          <rect x="2" y="11" width="20" height="6" rx="2" />
        </svg>
      );
    case "shield":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
      );
    case "user-cog":
    case "user":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "user-times":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="17" y1="8" x2="23" y2="14" />
          <line x1="23" y1="8" x2="17" y2="14" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
  }
}

export function PreguntasFrecuentes() {
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaFaq>("all");
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);
  const [seleccionada, setSeleccionada] = useState<FaqItemData | null>(null);
  const faqs = useMemo(() => FAQS.filter(f => (categoriaActiva === "all" || f.categoria === categoriaActiva) && f.pregunta.toLocaleLowerCase("es").includes(terminoBusqueda.toLocaleLowerCase("es").trim())), [categoriaActiva, terminoBusqueda]);
  const paginas = Math.ceil(faqs.length / 4);
  return <div className={styles.screen}>
    <MobileHeader titulo="Preguntas frecuentes" enlaceAtras="/cuenta" etiquetaAtras="Volver a mi cuenta" conBorde={false} />
    <input className={styles.search} type="search" aria-label="Buscar en preguntas frecuentes" placeholder="¿En qué podemos ayudarte?" value={terminoBusqueda} onChange={e => { setTerminoBusqueda(e.target.value); setPagina(0); }} />
    <div className={styles.categories} role="group" aria-label="Categorías de preguntas">{CATEGORIAS.map(c => <button key={c.id} type="button" aria-pressed={categoriaActiva === c.id} onClick={() => { setCategoriaActiva(c.id); setPagina(0); }}><IconoFaqSvg tipo={c.icono} />{c.label}</button>)}</div>
    <section className={styles.results} aria-label="Preguntas frecuentes">
      <p className={styles.caption} role="status">{faqs.length} preguntas · Respuestas rápidas</p>
      <div className={styles.questions}>{faqs.slice(pagina * 4, pagina * 4 + 4).map(f => <button className={styles.question} key={f.id} type="button" aria-haspopup="dialog" onClick={() => setSeleccionada(f)}><IconoFaqSvg tipo={f.icono} /><span>{f.pregunta}</span><span aria-hidden="true">›</span></button>)}{!faqs.length && <p>Sin resultados. Intenta con otras palabras o contacta a soporte.</p>}</div>
      <nav className={styles.pagination} aria-label="Paginación de preguntas"><button type="button" disabled={!pagina} onClick={() => setPagina(pagina - 1)} aria-label="Preguntas anteriores">‹</button><span>{paginas ? pagina + 1 : 0} / {paginas}</span><button type="button" disabled={pagina + 1 >= paginas} onClick={() => setPagina(pagina + 1)} aria-label="Preguntas siguientes">›</button></nav>
    </section>
    <footer className={styles.footer}><p>¿No encontraste lo que buscabas?</p><div><Link href="/soporte?canal=chat">💬 Crear reporte de soporte</Link><Link href="/soporte?canal=telefono">📞 Llamada de Soporte</Link></div></footer>
    <MobileBottomSheet open={seleccionada !== null} onClose={() => setSeleccionada(null)} title={seleccionada?.pregunta ?? "Respuesta"} swipeToClose><div className="text-sm leading-relaxed">{seleccionada?.respuesta}</div></MobileBottomSheet>
  </div>;
}
