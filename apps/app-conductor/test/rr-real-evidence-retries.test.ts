import { beforeEach, describe, expect, it, vi } from "vitest";
const saved = vi.hoisted(() => new Map<string, unknown>());
vi.mock("../src/lib/almacenamiento-seguro-local", () => ({
  guardarJsonLocalSeguro: async (key: string, value: unknown) => { saved.set(key, structuredClone(value)); },
  leerJsonLocalSeguro: async (key: string) => saved.get(key) ?? null,
  eliminarJsonLocalSeguro: async (key: string) => { saved.delete(key); }
}));
import { configurarStorageColaEvidencia, encolarEvidencia, InMemoryEvidenceStorage, leerColaEvidenciaCompleta, sincronizarColaEvidencia, sincronizarColaEvidenciaBulk, type ItemColaEvidencia } from "../src/lib/cola-offline";
const dataUrl = "data:image/jpeg;base64," + Buffer.from("same-capture").toString("base64");
const capture = (extra: Partial<ItemColaEvidencia> = {}): ItemColaEvidencia => ({ usuarioId: "user", localId: crypto.randomUUID(), trasladoId: "trip", tipo: "inicial", angulo: "frente", dataUrl, capturadaEn: new Date().toISOString(), retryCount: 0, ...extra });
function backend() {
  const objects = new Map<string, Blob>(), rows = new Map<string, unknown>(), conflicts = new Map<string, unknown>();
  let loseResponse = false;
  const upload = vi.fn(async (path: string, blob: Blob, options: { upsert: boolean }) => {
    if (options.upsert) throw new Error("must_not_overwrite");
    if (objects.has(path)) return { error: { statusCode: "409", error: "Duplicate" } };
    objects.set(path, blob);
    if (loseResponse) { loseResponse = false; return { error: new Error("response_lost") }; }
    return { error: null };
  });
  const download = vi.fn(async (path: string) => ({ data: objects.get(path) ?? null, error: null }));
  const rpc = vi.fn(async (_name: string, { p_foto }: { p_foto: { id: string } }) => {
    if (!rows.has(p_foto.id)) rows.set(p_foto.id, p_foto);
    return { data: { ok: true }, error: null };
  });
  const client = { auth: { getUser: async () => ({ data: { user: { id: "user" } } }) }, storage: { from: () => ({ upload, download }) }, rpc,
    from: () => ({ upsert: async (row: { captura_id: string }) => { conflicts.set(row.captura_id,row); return { error: null }; } }) };
  return { client, objects, rows, conflicts, upload, download, rpc, loseNextResponse: () => { loseResponse = true; } };
}
describe("RR-REAL-004 capture retry acceptance", () => {
  beforeEach(() => { saved.clear(); configurarStorageColaEvidencia(new InMemoryEvidenceStorage()); vi.spyOn(console,"error").mockImplementation(() => undefined); });
  it.each([1,2,3])("trial %i: double tap, reload, lost response and concurrent resend preserve ten photos", async () => {
    const storage = new InMemoryEvidenceStorage(); configurarStorageColaEvidencia(storage);
    const api = backend();
    const captures = (["inicial","final"] as const).flatMap((tipo) => ["frente","lado_piloto","lado_copiloto","trasera","tablero"].map((angulo) => capture({ tipo, angulo })));
    await Promise.all(captures.flatMap((photo) => [encolarEvidencia(photo),encolarEvidencia(photo)]));
    expect(await leerColaEvidenciaCompleta()).toHaveLength(10);
    api.loseNextResponse();
    await expect(sincronizarColaEvidencia(api.client as never)).rejects.toThrow("response_lost");
    // Simula reconstrucción de la cola al recargar; binarios y UUID siguen persistidos.
    configurarStorageColaEvidencia(new InMemoryEvidenceStorage(await storage.read()));
    await Promise.all([sincronizarColaEvidencia(api.client as never,{ ignoreBackoff: true }),sincronizarColaEvidenciaBulk(api.client as never,{ ignoreBackoff: true })]);
    expect(api.objects.size).toBe(10); expect(api.rows.size).toBe(10);
    expect(api.download).toHaveBeenCalledOnce();
    expect(api.upload).toHaveBeenCalledTimes(11);
    expect(await leerColaEvidenciaCompleta()).toHaveLength(0);
  });
  it("a real object hash conflict preserves original bytes, queues evidence and records a blocking conflict", async () => {
    const api=backend(), photo=capture();
    await encolarEvidencia(photo);
    const path=`user/trip/inicial/${photo.localId}-frente.jpg`;
    const original = new Blob(["different-original-photo"],{type:"image/jpeg"}); api.objects.set(path,original);
    await expect(sincronizarColaEvidencia(api.client as never)).rejects.toThrow("evidence_storage_hash_conflict");
    expect(await api.objects.get(path)?.text()).toBe("different-original-photo");
    expect(api.rows.size).toBe(0); expect(api.conflicts.size).toBe(1);
    expect(await leerColaEvidenciaCompleta()).toHaveLength(1);
  });
  it("reusing a capture ID with different bytes cannot overwrite its saved original", async () => {
    const photo=capture(); await encolarEvidencia(photo);
    await expect(encolarEvidencia({...photo,dataUrl:"data:image/jpeg;base64,"+Buffer.from("different").toString("base64")})).rejects.toThrow("identity_conflict");
    const api=backend(); await sincronizarColaEvidencia(api.client as never);
    expect(await [...api.objects.values()][0].text()).toBe("same-capture");
  });
  it("an arbitrary storage error is not accepted as a duplicate", async () => {
    const api=backend(); await encolarEvidencia(capture());
    api.upload.mockResolvedValueOnce({ error: { statusCode: "400", error: "InvalidRequest" } } as never);
    await expect(sincronizarColaEvidencia(api.client as never)).rejects.toMatchObject({ statusCode:"400" });
    expect(api.download).not.toHaveBeenCalled(); expect(api.rows.size).toBe(0);
    expect(await leerColaEvidenciaCompleta()).toHaveLength(1);
  });
});
