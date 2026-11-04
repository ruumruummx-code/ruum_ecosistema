import { performance } from "node:perf_hooks";

// Microbenchmark reproducible del contrato de carga. No sustituye RUM ni una
// medición de red/staging: cuantifica el trabajo de serialización y el camino
// crítico con datos sintéticos equivalentes.
const fila = (i) => ({
  traslado_id: `t-${i}`,
  usuario_id: "u-1",
  estado: "programado",
  origen_direccion: "Origen con datos de prueba",
  destino_direccion: "Destino con datos de prueba",
  conductor_nombre: "Conductor",
  conductor_calificacion: 5,
  vehiculo_marca: "Marca",
  vehiculo_modelo: "Modelo",
  creado_en: "2026-11-04T00:00:00.000Z",
});

const completo = Array.from({ length: 100 }, (_, i) => fila(i));
const resumen = completo.slice(0, 6);
const medir = (valor) => {
  const inicio = performance.now();
  const cuerpo = JSON.stringify(valor);
  const fin = performance.now();
  return { bytes: Buffer.byteLength(cuerpo), serializacionMs: Number((fin - inicio).toFixed(3)) };
};

const antes = medir(completo);
const despues = medir(resumen);
const mejoraBytes = Number(((1 - despues.bytes / antes.bytes) * 100).toFixed(1));

console.log(JSON.stringify({
  escenario: "sintetico-local",
  antes: { ...antes, filas: completo.length, fotosEnCaminoCritico: 1 },
  despues: { ...despues, filas: resumen.length, fotosEnCaminoCritico: 0 },
  reduccionPayloadPct: mejoraBytes,
  nota: "La foto se difiere al cliente; validar TTFB/LCP real con RUM en staging.",
}, null, 2));
