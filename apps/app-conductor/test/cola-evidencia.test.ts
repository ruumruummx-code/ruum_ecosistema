import { afterEach, expect, test, vi } from "vitest";
import type { Database } from "@ruum/shared/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  configurarStorageColaEvidencia,
  encolarEvidencia,
  InMemoryEvidenceStorage,
  obtenerStorageColaEvidencia,
  sincronizarColaEvidencia,
  type ItemColaEvidencia
} from "../src/lib/cola-offline";

const { subir, guardar, descargar, registrarConflicto } = vi.hoisted(() => ({
  subir: vi.fn(),
  guardar: vi.fn(),
  descargar: vi.fn(),
  registrarConflicto: vi.fn()
}));

vi.mock("@ruum/api/custody", () => ({
  subirArchivoEvidenciaStorage: subir,
  guardarFotoEvidenciaSincronizada: guardar,
  descargarArchivoEvidenciaStorage: descargar,
  registrarConflictoEvidencia: registrarConflicto
}));
vi.mock("../src/lib/supabase-browser", () => ({
  crearClienteNavegador: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "conductor" } } }) }
  }),
  tieneSupabaseConfigurado: () => true
}));
vi.mock("../src/lib/almacenamiento-seguro-local", () => ({
  eliminarJsonLocalSeguro: vi.fn(),
  guardarJsonLocalSeguro: vi.fn(),
  leerJsonLocalSeguro: vi.fn()
}));
vi.mock("../src/lib/observability", () => ({ recordOperationalEvent: vi.fn() }));

const storageOriginal = obtenerStorageColaEvidencia();
const cliente = { auth: { getUser: async () => ({ data: { user: { id: "conductor" } } }) } } as unknown as SupabaseClient<Database>;
const foto: ItemColaEvidencia = {
  usuarioId: "conductor",
  localId: "primera",
  trasladoId: "viaje",
  tipo: "inicial",
  angulo: "frontal",
  dataUrl: "data:image/jpeg;base64,AA==",
  capturadaEn: new Date().toISOString(),
  retryCount: 0
};

afterEach(() => {
  configurarStorageColaEvidencia(storageOriginal);
  vi.clearAllMocks();
  vi.useRealTimers();
});

test("el timeout registra un intento y permite sincronizar la siguiente foto", async () => {
  vi.useFakeTimers();
  const storage = new InMemoryEvidenceStorage([foto, { ...foto, localId: "segunda" }]);
  configurarStorageColaEvidencia(storage);
  let informarSubida!: () => void;
  const subidaIniciada = new Promise<void>((resolve) => { informarSubida = resolve; });
  subir.mockImplementationOnce(() => {
    informarSubida();
    return new Promise(() => {});
  }).mockResolvedValueOnce({ error: null });
  guardar.mockResolvedValue({ estado: "guardada" });

  const lote = sincronizarColaEvidencia(cliente);
  const comprobacion = expect(lote).resolves.toBe(1);
  await subidaIniciada;
  await vi.runAllTimersAsync();
  await comprobacion;
  expect(await storage.read()).toEqual([expect.objectContaining({ localId: "primera", retryCount: 1 })]);
  expect(guardar).toHaveBeenCalledWith(cliente, expect.objectContaining({ id: "segunda" }));
});

test("un conflicto conserva la foto y no se reintenta ni en una sincronización manual", async () => {
  const storage = new InMemoryEvidenceStorage([{ ...foto, sha256: "huella-distinta" }, { ...foto, localId: "segunda" }]);
  configurarStorageColaEvidencia(storage);
  subir.mockResolvedValue({ error: null });
  guardar.mockResolvedValue({ estado: "guardada" });

  await expect(sincronizarColaEvidencia(cliente)).resolves.toBe(1);
  await expect(sincronizarColaEvidencia(cliente, { ignoreBackoff: true })).resolves.toBe(0);
  expect(subir).toHaveBeenCalledTimes(1);
  expect(await storage.read()).toEqual([expect.objectContaining({ localId: "primera", conflictoCustodia: true })]);
});

test("reintento tras reconexión: reintenta fotos pendientes con ignoreBackoff y las sincroniza exitosamente", async () => {
  const fotoConFalloPrevio: ItemColaEvidencia = {
    ...foto,
    localId: "pendiente-reintento",
    retryCount: 1,
    lastAttemptAt: new Date(Date.now() - 1000).toISOString(),
    lastErrorCode: "NetworkError"
  };
  const storage = new InMemoryEvidenceStorage([fotoConFalloPrevio]);
  configurarStorageColaEvidencia(storage);

  subir.mockResolvedValueOnce({ error: null });
  guardar.mockResolvedValueOnce({ estado: "guardada" });

  const res = await sincronizarColaEvidencia(cliente, { ignoreBackoff: true });
  expect(res).toBe(1);
  expect(subir).toHaveBeenCalledTimes(1);
  expect(guardar).toHaveBeenCalledTimes(1);
  expect(await storage.read()).toEqual([]);
});

test("evidencia duplicada en cola: no encola una captura idéntica si ya existe en cola", async () => {
  const storage = new InMemoryEvidenceStorage([]);
  configurarStorageColaEvidencia(storage);

  await encolarEvidencia(foto);
  expect((await storage.read()).length).toBe(1);

  // Intentar encolar exactamente la misma captura (mismo usuario, traslado, tipo, ángulo y contenido)
  await encolarEvidencia({ ...foto, localId: "otra-id-pero-misma-captura" });
  const items = await storage.read();
  expect(items.length).toBe(1);
  expect(items[0].localId).toBe("primera");
});

test("evidencia duplicada en storage con mismo sha256: verifica hash remoto y completa sincronización sin error", async () => {
  const storage = new InMemoryEvidenceStorage([foto]);
  configurarStorageColaEvidencia(storage);

  // Simular error de objeto duplicado en Storage
  subir.mockResolvedValueOnce({ error: { statusCode: 409, message: "Duplicate: already exists" } });

  // Simular descarga de evidencia existente con el mismo contenido (sha256 idéntico)
  const bytes = atob("AA==");
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  descargar.mockResolvedValueOnce({ data: new Blob([buffer], { type: "image/jpeg" }), error: null });
  guardar.mockResolvedValueOnce({ estado: "guardada" });

  const res = await sincronizarColaEvidencia(cliente);
  expect(res).toBe(1);
  expect(guardar).toHaveBeenCalledWith(cliente, expect.objectContaining({ id: "primera" }));
  expect(await storage.read()).toEqual([]);
});

test("evidencia duplicada en storage con distinto sha256: detecta conflicto de custodia y no la borra de la cola", async () => {
  const storage = new InMemoryEvidenceStorage([foto]);
  configurarStorageColaEvidencia(storage);

  subir.mockResolvedValueOnce({ error: { statusCode: 409, message: "Duplicate" } });

  // Simular contenido remoto diferente en storage
  const bytesDiferentes = atob("BB==");
  const bufferDiferente = new Uint8Array(bytesDiferentes.length);
  for (let i = 0; i < bytesDiferentes.length; i++) bufferDiferente[i] = bytesDiferentes.charCodeAt(i);
  descargar.mockResolvedValueOnce({ data: new Blob([bufferDiferente], { type: "image/jpeg" }), error: null });
  registrarConflicto.mockResolvedValueOnce({});

  const res = await sincronizarColaEvidencia(cliente);
  expect(res).toBe(0);
  expect(registrarConflicto).toHaveBeenCalledTimes(1);
  const items = await storage.read();
  expect(items).toEqual([expect.objectContaining({ localId: "primera", conflictoCustodia: true })]);
});
