import { afterEach, expect, test, vi } from "vitest";
import type { Database } from "@ruum/shared/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  configurarStorageColaEvidencia, InMemoryEvidenceStorage, obtenerStorageColaEvidencia,
  sincronizarColaEvidencia, type ItemColaEvidencia
} from "../src/lib/cola-offline";

const { subir, guardar } = vi.hoisted(() => ({ subir: vi.fn(), guardar: vi.fn() }));
vi.mock("@ruum/api/custody", () => ({
  subirArchivoEvidenciaStorage: subir,
  guardarFotoEvidenciaSincronizada: guardar
}));
vi.mock("../src/lib/supabase-browser", () => ({}));
vi.mock("../src/lib/almacenamiento-seguro-local", () => ({
  eliminarJsonLocalSeguro: vi.fn(), guardarJsonLocalSeguro: vi.fn(), leerJsonLocalSeguro: vi.fn()
}));
vi.mock("../src/lib/observability", () => ({ recordOperationalEvent: vi.fn() }));

const storageOriginal = obtenerStorageColaEvidencia();
const cliente = { auth: { getUser: async () => ({ data: { user: { id: "conductor" } } }) } } as unknown as SupabaseClient<Database>;
const foto: ItemColaEvidencia = {
  usuarioId: "conductor", localId: "primera", trasladoId: "viaje", tipo: "inicial",
  angulo: "frontal", dataUrl: "data:image/jpeg;base64,AA==", capturadaEn: new Date().toISOString(), retryCount: 0
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
