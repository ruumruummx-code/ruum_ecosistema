import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const preferencesStore = vi.hoisted(() => new Map<string, string>());

vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({ value: preferencesStore.get(key) ?? null })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      preferencesStore.set(key, value);
    })
  }
}));

import {
  configurarStorageColaEvidencia,
  CapacitorPreferencesEvidenceStorage,
  contarColaEvidencia,
  encolarEvidencia,
  InMemoryEvidenceStorage,
  leerColaEvidencia,
  leerColaEvidenciaCompleta,
  leerColaEvidenciaDeTraslado,
  limpiarColaEvidencia,
  limpiarColaEvidenciaDeUsuario,
  quitarDeColaEvidencia,
  sincronizarColaEvidencia,
  type EvidenceQueueStorage,
  type ItemColaEvidencia
} from "../src/lib/cola-offline";

const CLAVE_COLA = "ruum_cola_evidencia";
const DATA_URL_JPG = `data:image/jpeg;base64,${Buffer.from("foto").toString("base64")}`;

function item(overrides: Partial<ItemColaEvidencia> = {}): ItemColaEvidencia {
  return {
    usuarioId: "user-test",
    localId: "local-1",
    trasladoId: "traslado-1",
    tipo: "inicial",
    angulo: "frontal",
    dataUrl: DATA_URL_JPG,
    lat: 19.4326,
    lng: -99.1332,
    capturadaEn: new Date().toISOString(),
    retryCount: 0,
    ...overrides
  };
}

const SHA256_FOTO = createHash("sha256").update(Buffer.from("foto")).digest("hex");

/**
 * Mock del cliente Supabase. `evidenciaExistente` simula la fila ya
 * registrada (reintento de cola) que devuelve el `select` tras el duplicado.
 */
function clienteSupabaseMock({
  uploadError = null,
  insertError = null,
  evidenciaExistente = null
}: {
  uploadError?: Error | null;
  insertError?: { code?: string; message?: string } | null;
  evidenciaExistente?: { id: string; sha256: string | null } | null;
} = {}) {
  const upload = vi.fn(async () => ({ error: uploadError }));
  const insert = vi.fn(async () => ({ error: insertError }));
  const insertIncidencia = vi.fn(async () => ({ error: null }));
  const select = vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle: vi.fn(async () => ({ data: evidenciaExistente, error: null }))
    }))
  }));
  const update = vi.fn(() => ({
    eq: vi.fn(async () => ({ error: null }))
  }));
  const getPublicUrl = vi.fn();
  const fromStorage = vi.fn(() => ({ upload, getPublicUrl }));
  const fromTable = vi.fn((tabla: string) =>
    tabla === "incidencias" ? { insert: insertIncidencia } : { insert, select, update, upsert: insert }
  );

  return {
    cliente: {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "auth-user-1" } } }))
      },
      storage: {
        from: fromStorage
      },
      from: fromTable
    },
    upload,
    getPublicUrl,
    insert,
    insertIncidencia,
    update,
    fromStorage,
    fromTable
  };
}

describe("cola offline de evidencia", () => {
  beforeEach(() => {
    preferencesStore.clear();
    configurarStorageColaEvidencia(new InMemoryEvidenceStorage());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    configurarStorageColaEvidencia(new InMemoryEvidenceStorage());
  });

  it("persiste, cuenta y filtra la cola por traslado", async () => {
    await encolarEvidencia(item());
    await encolarEvidencia(item({ localId: "local-2", trasladoId: "traslado-2", angulo: "trasera" }));

    expect(await contarColaEvidencia()).toBe(2);
    expect(await contarColaEvidencia("traslado-1")).toBe(1);
    expect(await leerColaEvidenciaDeTraslado("traslado-1")).toMatchObject([{ localId: "local-1" }]);
  });

  it("reemplaza la foto pendiente del mismo traslado, tipo y angulo", async () => {
    await encolarEvidencia(item({ localId: "local-vieja", dataUrl: DATA_URL_JPG }));
    await encolarEvidencia(item({ localId: "local-nueva", dataUrl: `data:image/png;base64,${Buffer.from("nueva").toString("base64")}` }));

    const cola = await leerColaEvidencia();

    expect(cola).toHaveLength(1);
    expect(cola[0]).toMatchObject({ localId: "local-nueva", angulo: "frontal" });
  });

  it("quita un item por localId sin afectar el resto", async () => {
    await encolarEvidencia(item());
    await encolarEvidencia(item({ localId: "local-2", angulo: "trasera" }));

    await quitarDeColaEvidencia("local-1");

    expect(await leerColaEvidencia()).toMatchObject([{ localId: "local-2" }]);
  });

  it("sincroniza storage e inserta la evidencia con idempotencia por localId", async () => {
    await encolarEvidencia(item());
    const onItemSincronizado = vi.fn();
    const supabase = clienteSupabaseMock();

    await expect(sincronizarColaEvidencia(supabase.cliente as never, { onItemSincronizado })).resolves.toBe(1);

    expect(supabase.fromStorage).toHaveBeenCalledWith("evidencia");
    expect(supabase.upload.mock.calls[0]?.[0]).toBe("auth-user-1/traslado-1/inicial/local-1-frontal.jpg");
    // La evidencia registrada no se sobrescribe: la subida es insert-only.
    expect(supabase.upload.mock.calls[0]?.[2]).toMatchObject({ upsert: false });
    expect(supabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "local-1",
        traslado_id: "traslado-1",
        tipo: "inicial",
        angulo: "frontal",
        url: "auth-user-1/traslado-1/inicial/local-1-frontal.jpg",
        sincronizada: true,
        sha256: SHA256_FOTO
      })
    );
    expect(supabase.getPublicUrl).not.toHaveBeenCalled();
    expect(onItemSincronizado).toHaveBeenCalledWith(expect.objectContaining({ localId: "local-1" }));
    expect(await leerColaEvidencia()).toEqual([]);
  });

  it("RT-68: reintento tras una subida parcial se resuelve como éxito si el sha256 coincide", async () => {
    await encolarEvidencia(item());
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    // La subida anterior dejó el objeto en Storage y la fila ya existe.
    const yaExiste = Object.assign(new Error("The resource already exists"), { statusCode: 409 });
    const supabase = clienteSupabaseMock({
      uploadError: yaExiste,
      insertError: { code: "23505", message: "duplicate key value violates unique constraint" },
      evidenciaExistente: { id: "local-1", sha256: SHA256_FOTO }
    });

    await expect(sincronizarColaEvidencia(supabase.cliente as never)).resolves.toBe(1);

    // No se sobrescribe nada y el item sale de la cola.
    expect(supabase.update).not.toHaveBeenCalled();
    expect(supabase.insertIncidencia).not.toHaveBeenCalled();
    expect(await leerColaEvidencia()).toEqual([]);
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ event: "evidence_checksum_conflict" })
    );
  });

  it("RT-68: un sha256 distinto marca la evidencia en conflicto y avisa a soporte", async () => {
    await encolarEvidencia(item());
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const supabase = clienteSupabaseMock({
      insertError: { code: "23505", message: "duplicate key value violates unique constraint" },
      evidenciaExistente: { id: "local-1", sha256: "otra-huella-distinta" }
    });

    await expect(sincronizarColaEvidencia(supabase.cliente as never)).resolves.toBe(0);

    // La evidencia queda marcada en conflicto...
    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({ conflicto: true })
    );
    // ...y soporte recibe el aviso (incidencia de sistema).
    expect(supabase.insertIncidencia).toHaveBeenCalledWith(
      expect.objectContaining({
        traslado_id: "traslado-1",
        tipo: "conflicto_evidencia",
        reportada_por: "sistema"
      })
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "evidence_checksum_conflict",
        scope: "evidencia_offline",
        kind: "security_event"
      })
    );
    // No se reintenta en bucle: el item sale de la cola.
    expect(await leerColaEvidencia()).toEqual([]);
  });

  it("conserva la cola si falla y permite reintentar", async () => {
    await encolarEvidencia(item());
    const logSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(sincronizarColaEvidencia(clienteSupabaseMock({ uploadError: new Error("sin red") }).cliente as never)).rejects.toThrow(
      "sin red"
    );
    expect(await contarColaEvidencia()).toBe(1);
    expect(await leerColaEvidencia()).toMatchObject([
      {
        localId: "local-1",
        retryCount: 1,
        lastErrorCode: "Error"
      }
    ]);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "evidence_sync_failed",
        scope: "evidencia_offline",
        kind: "offline_recoverable",
        context: expect.objectContaining({
          tripId: "traslado-1",
          evidenceType: "inicial",
          angle: "frontal",
          stage: "storage_upload",
          retryCount: 1,
          errorCode: "Error"
        })
      })
    );
    expect(JSON.stringify(logSpy.mock.calls[0]?.[0])).not.toContain("data:image");

    await expect(sincronizarColaEvidencia(clienteSupabaseMock().cliente as never, { ignoreBackoff: true })).resolves.toBe(1);
    expect(await contarColaEvidencia()).toBe(0);
  });

  it("respeta backoff automatico y permite ignorarlo en reintento manual", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-17T12:00:00.000Z"));
    await encolarEvidencia(item());
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(sincronizarColaEvidencia(clienteSupabaseMock({ uploadError: new Error("sin red") }).cliente as never)).rejects.toThrow(
      "sin red"
    );

    const segundoCliente = clienteSupabaseMock();
    await expect(sincronizarColaEvidencia(segundoCliente.cliente as never)).resolves.toBe(0);
    expect(segundoCliente.upload).not.toHaveBeenCalled();

    await expect(sincronizarColaEvidencia(segundoCliente.cliente as never, { ignoreBackoff: true })).resolves.toBe(1);
    expect(segundoCliente.upload).toHaveBeenCalledTimes(1);
  });

  it("escala el backoff a 1, 5, 15 y 60 minutos", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-17T12:00:00.000Z"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await encolarEvidencia(item({ retryCount: 3, lastAttemptAt: "2026-07-17T12:00:00.000Z" }));

    const antesDeQuince = clienteSupabaseMock();
    vi.setSystemTime(new Date("2026-07-17T12:14:59.000Z"));
    await expect(sincronizarColaEvidencia(antesDeQuince.cliente as never)).resolves.toBe(0);
    expect(antesDeQuince.upload).not.toHaveBeenCalled();

    const despuesDeQuince = clienteSupabaseMock({ uploadError: new Error("sigue sin red") });
    vi.setSystemTime(new Date("2026-07-17T12:15:00.000Z"));
    await expect(sincronizarColaEvidencia(despuesDeQuince.cliente as never)).rejects.toThrow("sigue sin red");
    expect(await leerColaEvidencia()).toMatchObject([{ retryCount: 4 }]);

    const antesDeUnaHora = clienteSupabaseMock();
    vi.setSystemTime(new Date("2026-07-17T13:14:59.000Z"));
    await expect(sincronizarColaEvidencia(antesDeUnaHora.cliente as never)).resolves.toBe(0);
    expect(antesDeUnaHora.upload).not.toHaveBeenCalled();

    const despuesDeUnaHora = clienteSupabaseMock();
    vi.setSystemTime(new Date("2026-07-17T13:15:00.000Z"));
    await expect(sincronizarColaEvidencia(despuesDeUnaHora.cliente as never)).resolves.toBe(1);
  });

  it("normaliza elementos antiguos sin contador persistido", async () => {
    configurarStorageColaEvidencia(new CapacitorPreferencesEvidenceStorage());
    preferencesStore.set(CLAVE_COLA, JSON.stringify([{ ...item(), retryCount: undefined }]));

    await expect(leerColaEvidencia()).resolves.toMatchObject([{ retryCount: 0 }]);
  });

  it("ignora datos corruptos persistidos", async () => {
    configurarStorageColaEvidencia(new CapacitorPreferencesEvidenceStorage());
    preferencesStore.set(CLAVE_COLA, "{");

    await expect(leerColaEvidencia()).resolves.toEqual([]);
  });

  it("P1: cifra la cola en Capacitor Preferences y nunca persiste data:image en texto claro", async () => {
    const storage = new CapacitorPreferencesEvidenceStorage();
    configurarStorageColaEvidencia(storage);

    await encolarEvidencia(item({ localId: "local-seguro-1", dataUrl: DATA_URL_JPG }));

    const rawPersisted = preferencesStore.get(CLAVE_COLA);
    expect(rawPersisted).toBeDefined();
    // Debe usar el formato cifrado ruum:v1:<iv>:<ciphertext>
    expect(rawPersisted).toMatch(/^ruum:v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
    // Nunca debe contener data:image o payload sensible en claro (cola principal ahora sin binario)
    expect(rawPersisted).not.toContain("data:image");
    expect(rawPersisted).not.toContain("user-test");
    expect(rawPersisted).not.toContain("traslado-1");

    // El binario se guarda separado y también cifrado
    const rawBinario = preferencesStore.get("ruum_evidencia_bin_local-seguro-1");
    expect(rawBinario).toBeDefined();
    expect(rawBinario).toMatch(/^ruum:v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
    expect(rawBinario).not.toContain("data:image");

    // Al restaurar via leerColaEvidencia (enriquecida) se reconstruye el dataUrl desde el binario separado
    const recuperados = await leerColaEvidencia();
    expect(recuperados).toHaveLength(1);
    expect(recuperados[0].localId).toBe("local-seguro-1");
    expect(recuperados[0].dataUrl).toBe(DATA_URL_JPG);
    expect(recuperados[0].trasladoId).toBe("traslado-1");

    // Lectura cruda directa del storage principal ya no contiene el binario (mediano plazo)
    const nuevoStorage = new CapacitorPreferencesEvidenceStorage();
    const crudo = await nuevoStorage.read();
    expect(crudo).toHaveLength(1);
    expect(crudo[0].localId).toBe("local-seguro-1");
    expect(crudo[0].dataUrl).toBe(""); // binario fuera del JSON principal
  });

  it("P1: purga automáticamente items expirados por TTL (7 días)", async () => {
    const storage = new InMemoryEvidenceStorage();
    configurarStorageColaEvidencia(storage);

    const haceOchoDias = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const reciente = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();

    await storage.write([
      item({ localId: "expirado", capturadaEn: haceOchoDias }),
      item({ localId: "vigente", capturadaEn: reciente })
    ]);

    const leidos = await storage.read();
    expect(leidos).toHaveLength(1);
    expect(leidos[0].localId).toBe("vigente");
  });

  it("propaga fallos del storage para que puedan simularse en unitarias", async () => {
    const storageConFallo: EvidenceQueueStorage = {
      read: async () => [],
      write: async () => {
        throw new Error("storage lleno");
      },
      clear: async () => undefined
    };
    configurarStorageColaEvidencia(storageConFallo);

    await expect(encolarEvidencia(item())).rejects.toThrow("storage lleno");
  });

  describe("regresión P1 - cola multiusuario no debe borrar datos de otros usuarios", () => {
    it("preserva cola completa en lectura cruda y filtrada por usuario", async () => {
      await encolarEvidencia(item({ usuarioId: "user-a", localId: "local-a", trasladoId: "t1", angulo: "frontal" }));
      await encolarEvidencia(item({ usuarioId: "user-b", localId: "local-b", trasladoId: "t1", angulo: "frontal" }));

      // lectura cruda debe ver ambos aunque compartan traslado/tipo/angulo pero sean usuarios distintos
      const completa = await leerColaEvidenciaCompleta();
      expect(completa).toHaveLength(2);
      expect(completa.map((i) => i.usuarioId).sort()).toEqual(["user-a", "user-b"]);

      // lectura filtrada explícita por usuario
      expect(await leerColaEvidencia(undefined, "user-a")).toMatchObject([{ localId: "local-a" }]);
      expect(await leerColaEvidencia(undefined, "user-b")).toMatchObject([{ localId: "local-b" }]);
    });

    it("encolar dedica deduplicación por usuario+traslado+tipo+angulo, no global", async () => {
      await encolarEvidencia(item({ usuarioId: "user-a", localId: "local-a1", trasladoId: "t1", tipo: "inicial", angulo: "frontal" }));
      await encolarEvidencia(item({ usuarioId: "user-b", localId: "local-b1", trasladoId: "t1", tipo: "inicial", angulo: "frontal" }));
      // mismo slot pero distinto usuario no debe deduplicar
      expect(await leerColaEvidenciaCompleta()).toHaveLength(2);

      // mismo usuario + mismo slot sí debe reemplazar
      await encolarEvidencia(item({ usuarioId: "user-a", localId: "local-a2", trasladoId: "t1", tipo: "inicial", angulo: "frontal" }));
      const completa = await leerColaEvidenciaCompleta();
      expect(completa).toHaveLength(2);
      expect(completa.filter((i) => i.usuarioId === "user-a")).toMatchObject([{ localId: "local-a2" }]);
      expect(completa.filter((i) => i.usuarioId === "user-b")).toMatchObject([{ localId: "local-b1" }]);
    });

    it("quitarDeColaEvidencia solo remueve ese localId y preserva otros usuarios", async () => {
      await encolarEvidencia(item({ usuarioId: "user-a", localId: "local-a", trasladoId: "t1" }));
      await encolarEvidencia(item({ usuarioId: "user-b", localId: "local-b", trasladoId: "t2" }));

      await quitarDeColaEvidencia("local-a");

      const completa = await leerColaEvidenciaCompleta();
      expect(completa).toHaveLength(1);
      expect(completa[0]).toMatchObject({ localId: "local-b", usuarioId: "user-b" });
    });

    it("registrarIntentoFallido (vía sincronizar) preserva cola de otro usuario", async () => {
      await encolarEvidencia(item({ usuarioId: "user-a", localId: "local-a", trasladoId: "t1" }));
      await encolarEvidencia(item({ usuarioId: "user-b", localId: "local-b", trasladoId: "t2" }));
      vi.spyOn(console, "error").mockImplementation(() => undefined);

      // Cliente mock autenticado como user-a intentará sincronizar solo user-a si hubiera filtro, pero en test sin Supabase config, sincroniza ambos;
      // Para forzar el caso multiusuario, verificamos que tras fallo, el item de user-b sigue intacto (retryCount 0)
      // Forzamos fallo de storage para el primer item: usamos mock que falla en upload
      const clienteFalla = clienteSupabaseMock({ uploadError: new Error("sin red") });
      // En entorno sin Supabase config, leerColaEvidencia() devuelve todo, así que sincroniza el primero y falla
      // Verificamos que registrarIntentoFallido no borró user-b
      await expect(sincronizarColaEvidencia(clienteFalla.cliente as never)).rejects.toThrow("sin red");

      const completa = await leerColaEvidenciaCompleta();
      expect(completa).toHaveLength(2);
      const a = completa.find((i) => i.localId === "local-a");
      const b = completa.find((i) => i.localId === "local-b");
      expect(a).toMatchObject({ retryCount: 1 });
      expect(b).toMatchObject({ retryCount: 0, usuarioId: "user-b" });
    });

    it("sincronizar y quitar de user-a no borra user-b (flujo completo)", async () => {
      await encolarEvidencia(item({ usuarioId: "user-a", localId: "local-a", trasladoId: "t1" }));
      await encolarEvidencia(item({ usuarioId: "user-b", localId: "local-b", trasladoId: "t2" }));

      // Simular sincronización exitosa solo de user-a: quitar manualmente local-a
      await quitarDeColaEvidencia("local-a");
      expect(await leerColaEvidenciaCompleta()).toMatchObject([{ localId: "local-b" }]);

      // Verificar que deduplicación sha también respeta usuario
      await encolarEvidencia(item({ usuarioId: "user-a", localId: "local-a2", trasladoId: "t-shared", sha256: "abc123" }));
      await encolarEvidencia(item({ usuarioId: "user-b", localId: "local-b2", trasladoId: "t-shared", sha256: "abc123" }));
      expect(await leerColaEvidenciaCompleta()).toHaveLength(3); // local-b, local-a2, local-b2 (no deduplica cross-user)
    });

    it("limpiarColaEvidenciaDeUsuario solo borra de ese usuario", async () => {
      await encolarEvidencia(item({ usuarioId: "user-a", localId: "local-a" }));
      await encolarEvidencia(item({ usuarioId: "user-b", localId: "local-b" }));
      await limpiarColaEvidenciaDeUsuario("user-a");
      expect(await leerColaEvidenciaCompleta()).toMatchObject([{ usuarioId: "user-b" }]);
      await limpiarColaEvidenciaDeUsuario("user-b");
      expect(await leerColaEvidenciaCompleta()).toEqual([]);
    });

    it("limpiarColaEvidencia sin args en modo test hace clear total (compatibilidad)", async () => {
      await encolarEvidencia(item({ usuarioId: "user-a", localId: "local-a" }));
      await limpiarColaEvidencia();
      expect(await leerColaEvidenciaCompleta()).toEqual([]);
    });
  });
});
