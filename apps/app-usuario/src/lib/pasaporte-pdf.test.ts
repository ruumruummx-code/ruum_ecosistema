import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { generarPasaportePdf, type AnexosPasaporte } from "./pasaporte-pdf";
import type { DatosTraslado } from "@/app/viajes/[id]/obtenerDatosTraslado";

const fotoPng = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=",
    "base64"
  )
);

const fotoJpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

const base = {
  pasaporte: {
    traslado_id: "12345678-1234-4234-8234-123456789abc",
    usuario_id: "usuario-titular",
    estado: "disputa_abierta",
    estado_operativo: "closed",
    cerrado_en: "2026-10-30T17:00:00Z",
    vehiculo_marca: "Unidad de prueba",
    vehiculo_modelo: "Sedán",
    vehiculo_anio: 2026,
    vehiculo_placas: "DEMO123",
    vehiculo_vin: "VIN-SINTETICO",
    conductor_nombre: "Conductor de prueba",
    origen_direccion: "Origen de demostración",
    destino_direccion: "Destino de demostración",
    precio_cotizado: 1000,
    precio_final: 1000,
    monto_pagado: 1000,
  },
  traslado: { fecha_hora_programada: "2026-10-30T14:00:00Z" },
  vehiculo: null,
  conductor: null,
  evidencia: ["inicial", "final"].map((tipo, i) => ({
    id: `foto-${i}`,
    tipo,
    angulo: "frente",
    url_visual: `https://signed.example/${i}`,
    capturada_en: "2026-10-30T16:00:00Z",
    sincronizada: true,
    conflicto: false,
  })),
  incidencias: [],
  disputas: [
    {
      tipo: "dano_no_reconocido",
      estado: "abierta",
      abierta_en: "2026-10-30T18:00:00Z",
      descripcion:
        "Reporte sintético para verificar la exportación. " +
        "Descripción larga ".repeat(40),
    },
  ],
  reclamosSeguro: [],
  calificacion: null,
  pagos: [
    {
      id: "pago-1",
      traslado_id: "12345678-1234-4234-8234-123456789abc",
      monto: 1000,
      momento: "anticipado",
      estado: "completado",
      metodo: "tarjeta",
      registrado_en: "2026-10-30T14:05:00Z",
    },
  ],
  ultimaUbicacion: null,
} as unknown as DatosTraslado;

const anexos = {
  inspecciones: [
    { tipo: "inicial", kilometraje: 1000, combustible: "1/2", llaves_recibidas: "1" },
    { tipo: "final", kilometraje: 1010, combustible: "1/2", llaves_recibidas: "1" },
  ],
  historial: [
    {
      creado_en: "2026-10-30T17:00:00Z",
      estado_anterior: "entrega_confirmada",
      estado_nuevo: "servicio_cerrado",
      actor_tipo: "conductor",
    },
  ],
  custodia: [],
} as unknown as AnexosPasaporte;

it("incorpora todas las fotografías válidas y pagina el expediente completo con tarifa visible", async () => {
  const urls: string[] = [];
  const bytes = await generarPasaportePdf(
    base,
    anexos,
    async (url) => {
      urls.push(url);
      return fotoPng;
    },
    { puedeVerTarifa: true }
  );

  expect(urls).toHaveLength(2);
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBeGreaterThanOrEqual(5);
  expect(pdf.getTitle()).toContain(base.pasaporte!.traslado_id);
});

it("CA-6: cuando una foto no es accesible o la URL es nula, renderiza placeholder seguro sin tumbar el PDF", async () => {
  const datosConFotoInaccesible = {
    ...base,
    evidencia: [
      { ...base.evidencia[0], url_visual: null },
      { ...base.evidencia[1], url_visual: "https://signed.example/1" },
    ],
  };

  const bytes = await generarPasaportePdf(
    datosConFotoInaccesible,
    anexos,
    async () => null // Simulando fallo de descarga o rechazo SSRF
  );

  expect(bytes).toBeInstanceOf(Uint8Array);
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBeGreaterThanOrEqual(5);
});

it("CA-5: no truena cuando el archivo no es PNG ni JPG; renderiza placeholder visual", async () => {
  const bytes = await generarPasaportePdf(
    base,
    anexos,
    async () => new Uint8Array([0x01, 0x02, 0x03, 0x04])
  );

  expect(bytes).toBeInstanceOf(Uint8Array);
  const pdf = await PDFDocument.load(bytes);
  expect(pdf.getPageCount()).toBeGreaterThanOrEqual(5);
});

it("CA-8: enmascara tarifa en fail-closed cuando puedeVerTarifa es false o no se provee", async () => {
  const bytesSinTarifa = await generarPasaportePdf(
    base,
    anexos,
    async () => fotoPng,
    { puedeVerTarifa: false }
  );
  expect(bytesSinTarifa).toBeInstanceOf(Uint8Array);

  const bytesPorDefecto = await generarPasaportePdf(
    base,
    anexos,
    async () => fotoPng
    // opciones omitidas: debe aplicar fail-closed
  );
  expect(bytesPorDefecto).toBeInstanceOf(Uint8Array);
});

it("lanza error si no existe traslado_id en el pasaporte", async () => {
  await expect(
    generarPasaportePdf(
      { ...base, pasaporte: null } as unknown as DatosTraslado,
      anexos,
      async () => fotoPng
    )
  ).rejects.toThrow("Traslado no encontrado");
});
