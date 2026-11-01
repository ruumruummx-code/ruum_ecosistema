import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { DatosTraslado } from "@/app/viajes/[id]/obtenerDatosTraslado";
import type { InspeccionTraslado } from "@ruum/api/drivers";
import type { HistorialTraslado } from "@ruum/api/services";
import type { EventoCustodia } from "@ruum/api/custody";

export interface AnexosPasaporte {
  inspecciones: InspeccionTraslado[];
  historial: HistorialTraslado[];
  custodia: EventoCustodia[];
}
const texto = (v: unknown): string => String(v ?? "No registrado").replace(/[^\x20-\x7E\xA0-\xFF\n]/g, " ");
const etiqueta = (v: unknown) => texto(v).replaceAll("_", " ");
const fecha = (v: string | null | undefined) => v ? new Date(v).toLocaleString("es-MX", { timeZone: "America/Mexico_City" }) : "No registrada";

/** A complete, session-scoped snapshot. Private signed URLs never enter the PDF. */
export async function generarPasaportePdf(datos: DatosTraslado, anexos: AnexosPasaporte, cargarFoto: (url: string) => Promise<Uint8Array>) {
  const p = datos.pasaporte;
  if (!p?.traslado_id) throw new Error("Traslado no encontrado");
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Pasaporte digital ${p.traslado_id}`);
  pdf.setAuthor("Ruum Ruum");
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let pagina = pdf.addPage([595.28, 841.89]);
  let y = 780;
  const nueva = () => { pagina = pdf.addPage([595.28, 841.89]); y = 780; };
  const espacio = (alto: number) => { if (y - alto < 62) nueva(); };
  const linea = (valor: unknown, fuerte = false, tamano = 10) => {
    const font = fuerte ? bold : normal;
    // Split even unusually long tokens to keep plates, IDs and notes inside margins.
    const palabras = texto(valor).replace(/\n/g, " \n ").split(" ");
    let actual = "";
    const dibujar = () => { espacio(tamano + 6); pagina.drawText(actual, { x: 42, y, size: tamano, font, color: rgb(.12, .18, .22) }); y -= tamano + 6; actual = ""; };
    for (const palabra of palabras) {
      if (palabra === "\n") { dibujar(); continue; }
      for (const parte of palabra.match(/.{1,72}/g) ?? [""]) {
        const siguiente = actual ? `${actual} ${parte}` : parte;
        if (font.widthOfTextAtSize(siguiente, tamano) > 510 && actual) dibujar();
        actual = actual ? `${actual} ${parte}` : parte;
      }
    }
    if (actual) dibujar();
  };
  const seccion = (nombre: string) => { espacio(65); y -= 14; linea(nombre, true, 14); y -= 4; };
  const campo = (nombre: string, valor: unknown) => linea(`${nombre}: ${texto(valor)}`);
  linea("RUUM RUUM | PASAPORTE DIGITAL", true, 18);
  campo("Folio", p.traslado_id);
  campo("Exportado (Ciudad de México)", fecha(new Date().toISOString()));
  campo("Estado operativo", p.cerrado_en || p.estado_operativo === "closed" ? "Finalizado" : etiqueta(p.estado_operativo ?? p.estado));
  campo("Estado de seguimiento", etiqueta(p.estado));
  campo("Cierre", fecha(p.cerrado_en));
  seccion("Vehículo y conductor");
  campo("Unidad", [p.vehiculo_marca, p.vehiculo_modelo, p.vehiculo_anio].filter(Boolean).join(" "));
  campo("Placas", datos.vehiculo?.placas ?? p.vehiculo_placas);
  campo("VIN", datos.vehiculo?.vin ?? p.vehiculo_vin);
  campo("Color", datos.vehiculo?.color ?? p.vehiculo_color);
  campo("Conductor", datos.conductor?.nombre ?? p.conductor_nombre ?? "Pendiente de asignación");
  seccion("Ruta y recepción");
  campo("Origen", datos.traslado?.origen_direccion ?? p.origen_direccion);
  campo("Destino", datos.traslado?.destino_direccion ?? p.destino_direccion);
  campo("Programación", fecha(datos.traslado?.fecha_hora_programada));
  campo("Entrega", datos.traslado?.contacto_entrega_nombre ?? p.contacto_entrega_nombre);
  campo("Recepción", datos.traslado?.contacto_recepcion_nombre ?? p.contacto_recepcion_nombre);
  campo("Distancia (km)", p.distancia_km);
  if (datos.traslado?.motivo_servicio) campo("Motivo", etiqueta(datos.traslado.motivo_servicio));
  seccion("Resumen de pagos (MXN)");
  campo("Cotización", p.precio_cotizado);
  campo("Precio final", p.precio_final);
  campo("Total registrado pagado", p.monto_pagado);
  linea("Este resumen no sustituye un CFDI. El registro de pago no acredita por sí mismo un cobro bancario; puede corresponder a una prueba.");
  if (!datos.pagos.length) linea("Sin pagos registrados.");
  for (const pago of datos.pagos) {
    linea(`${fecha(pago.registrado_en)} | ${etiqueta(pago.estado)} | $${pago.monto} MXN | ${etiqueta(pago.metodo)}`);
    campo("Referencia del registro", pago.id);
  }
  seccion("Inspecciones de origen y destino");
  if (!anexos.inspecciones.length) linea("Sin inspecciones registradas.");
  for (const i of anexos.inspecciones) {
    linea(`Inspección ${etiqueta(i.tipo)}`, true);
    campo("Kilometraje", i.kilometraje); campo("Combustible", i.combustible);
    campo("Llaves", i.llaves_recibidas); campo("Placa delantera", i.placa_delantera);
    campo("Placa trasera", i.placa_trasera); campo("Tarjeta de circulación", i.tarjeta_circulacion);
    campo("Talón de verificación", i.talon_verificacion); campo("Notas", i.notas);
  }
  seccion("Historial del traslado");
  if (!anexos.historial.length) linea("Sin eventos de estado registrados.");
  for (const h of [...anexos.historial].sort((a,b) => a.creado_en.localeCompare(b.creado_en))) {
    linea(`${fecha(h.creado_en)} | ${etiqueta(h.estado_anterior)} > ${etiqueta(h.estado_nuevo)} | ${h.actor_tipo}`);
    if (h.motivo) campo("Motivo", h.motivo);
  }
  seccion("Cadena de custodia");
  if (!anexos.custodia.length) linea("Sin eventos de custodia registrados.");
  for (const c of anexos.custodia) {
    linea(`${fecha(c.ocurrido_en)} | ${etiqueta(c.tipo)} | ${c.actor_tipo}`, true);
    campo("Odómetro", c.odometro); campo("Combustible", c.combustible);
    campo("Notas", c.notas); campo("Hash del evento", c.hash_cadena);
  }
  seccion("Incidencias, disputas y reclamos");
  if (!datos.incidencias.length && !datos.disputas.length && !datos.reclamosSeguro.length) linea("Sin reportes registrados.");
  for (const i of datos.incidencias) { linea(`${fecha(i.creada_en)} | Incidencia: ${etiqueta(i.tipo)} | ${i.resuelta ? "Resuelta" : "Abierta"}`, true); campo("Descripción", i.descripcion); }
  for (const d of datos.disputas) { linea(`${fecha(d.abierta_en)} | Disputa: ${etiqueta(d.tipo)} | ${etiqueta(d.estado)}`, true); campo("Descripción", d.descripcion); campo("Resolución", d.resolucion_detalle ?? d.resolucion); }
  for (const r of datos.reclamosSeguro) linea(`${fecha(r.abierto_en)} | Reclamo de seguro ${r.id} | ${etiqueta(r.estado)}`);
  seccion("Evaluación del usuario");
  if (datos.calificacion) { campo("Estrellas", `${datos.calificacion.estrellas}/5`); campo("Comentario", datos.calificacion.comentario); campo("Fecha", fecha(datos.calificacion.calificado_en)); }
  else linea("Sin evaluación registrada.");
  let incorporadas = 0;
  for (const foto of datos.evidencia) {
    nueva();
    linea(`EVIDENCIA ${etiqueta(foto.tipo).toUpperCase()} | ${etiqueta(foto.angulo)}`, true, 15);
    campo("Identificador", foto.id); campo("Captura", fecha(foto.capturada_en));
    campo("Sincronizada", foto.sincronizada ? "Sí" : "No");
    if (foto.conflicto) linea("Advertencia: evidencia marcada con conflicto.", true);
    if (!foto.url_visual) throw new Error("Hay evidencias sin acceso. Reintenta la exportación completa.");
    const bytes = await cargarFoto(foto.url_visual);
    let imagen;
    if (bytes[0] === 0x89 && bytes[1] === 0x50) imagen = await pdf.embedPng(bytes);
    else if (bytes[0] === 0xff && bytes[1] === 0xd8) imagen = await pdf.embedJpg(bytes);
    else throw new Error("Una evidencia no es JPG o PNG. No se generó un pasaporte incompleto.");
    const escala = Math.min(510 / imagen.width, (y - 75) / imagen.height);
    pagina.drawImage(imagen, { x: (595.28 - imagen.width * escala) / 2, y: y - imagen.height * escala, width: imagen.width * escala, height: imagen.height * escala });
    incorporadas++;
  }
  nueva();
  seccion("Control del expediente exportado");
  campo("Fotografías incorporadas", `${incorporadas} de ${datos.evidencia.length}`);
  campo("Inspecciones", anexos.inspecciones.length); campo("Eventos de custodia", anexos.custodia.length);
  linea("Documento generado a partir de los registros accesibles al titular en la fecha de exportación. Las disputas posteriores al cierre conservan su estado de seguimiento sin reabrir la operación.");
  for (const [i, page] of pdf.getPages().entries()) {
    page.drawText(`Ruum Ruum | ${p.traslado_id.slice(0,8)} | ${i+1} / ${pdf.getPageCount()}`, {x:42,y:30,font:normal,size:8,color:rgb(.4,.4,.4)});
  }
  return pdf.save();
}
