import { beforeEach, describe, expect, it, vi } from "vitest";
import { aplicarOperacionLibreta, libretaVacia } from "./libreta-ubicaciones";
import { guardarOperacionUbicacion } from "./acciones-ubicaciones";
const mocks = vi.hoisted(() => ({ cliente: vi.fn(), revalidar: vi.fn() }));
vi.mock("../../lib/supabase-server", () => ({
  crearClienteServidor: mocks.cliente,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidar }));
const op = { tipo: "favorita" as const, id: "perfil-direccion", valor: true };
function preparar({
  sesion = true,
  errorLectura = false,
  errorEscritura = false,
  conflictos = 0,
  fallo = false,
} = {}) {
  let fila = {
    id: "perfil-propio",
    auth_user_id: "auth-propio",
    actualizado_en: "2026-10-27T12:00:00Z",
    preferencias: { tema: "oscuro", ubicaciones_v1: libretaVacia() },
  };
  const filtros: Array<[string, unknown]> = [];
  const cambios: unknown[] = [];
  let lecturas = 0,
    escrituras = 0;
  const cliente = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: sesion ? { id: "auth-propio" } : null },
        error: null,
      })),
    },
    from: vi.fn(() => {
      let cambio: typeof fila | undefined;
      const q = {
        select: vi.fn(() => q),
        eq: vi.fn((campo: string, valor: unknown) => {
          filtros.push([campo, valor]);
          return q;
        }),
        single: vi.fn(async () => {
          lecturas++;
          return {
            data: errorLectura ? null : structuredClone(fila),
            error: errorLectura ? { message: "SECRET" } : null,
          };
        }),
        update: vi.fn((valor: typeof fila) => {
          cambio = valor;
          cambios.push(valor);
          return q;
        }),
        maybeSingle: vi.fn(async () => {
          escrituras++;
          if (fallo) throw new Error("PRIVATE URL token");
          if (errorEscritura)
            return { data: null, error: { message: "SECRET" } };
          if (escrituras <= conflictos) {
            fila = {
              ...fila,
              actualizado_en: "2026-10-28T12:00:00Z",
              preferencias: {
                ...fila.preferencias,
                tema: "claro",
                ubicaciones_v1: aplicarOperacionLibreta(libretaVacia(), {
                  tipo: "favorita",
                  id: "otra-pestana",
                  valor: true,
                }),
              },
            };
            return { data: null, error: null };
          }
          fila = { ...fila, ...cambio };
          return { data: { id: fila.id }, error: null };
        }),
      };
      return q;
    }),
  };
  mocks.cliente.mockResolvedValue(cliente);
  return {
    cliente,
    filtros,
    cambios,
    fila: () => fila,
    lecturas: () => lecturas,
    escrituras: () => escrituras,
  };
}
beforeEach(() => vi.clearAllMocks());
describe("Acciones privadas de ubicaciones", () => {
  it("requiere getUser válido antes de leer o escribir", async () => {
    const m = preparar({ sesion: false });
    expect((await guardarOperacionUbicacion(op)).ok).toBe(false);
    expect(m.cliente.from).not.toHaveBeenCalled();
  });
  it("limita lectura/escritura a la identidad autenticada y conserva preferencias", async () => {
    const m = preparar();
    expect((await guardarOperacionUbicacion(op)).ok).toBe(true);
    expect(m.filtros).toContainEqual(["auth_user_id", "auth-propio"]);
    expect(m.filtros).toContainEqual(["id", "perfil-propio"]);
    expect(m.filtros).toContainEqual([
      "actualizado_en",
      "2026-10-27T12:00:00Z",
    ]);
    expect(m.fila().preferencias.tema).toBe("oscuro");
    expect(
      m.fila().preferencias.ubicaciones_v1.favoritos["perfil-direccion"],
    ).toBe(true);
    expect(mocks.revalidar).toHaveBeenCalledWith("/ubicaciones");
  });
  it("reintenta un conflicto y conserva los cambios de la otra pestaña", async () => {
    const m = preparar({ conflictos: 1 });
    const r = await guardarOperacionUbicacion(op);
    expect(r.ok).toBe(true);
    expect(m.lecturas()).toBe(2);
    expect(m.fila().preferencias.tema).toBe("claro");
    expect(m.fila().preferencias.ubicaciones_v1.favoritos).toEqual({
      "otra-pestana": true,
      "perfil-direccion": true,
    });
  });
  it("limita los reintentos y no comunica éxito ante conflictos continuos", async () => {
    const m = preparar({ conflictos: 3 });
    expect((await guardarOperacionUbicacion(op)).ok).toBe(false);
    expect(m.escrituras()).toBe(3);
    expect(mocks.revalidar).not.toHaveBeenCalled();
  });
  it.each([{ errorLectura: true }, { errorEscritura: true }, { fallo: true }])(
    "no expone errores internos ni confirma escrituras fallidas: %s",
    async (options) => {
      preparar(options);
      const r = await guardarOperacionUbicacion(op);
      expect(r.ok).toBe(false);
      expect(JSON.stringify(r)).not.toMatch(/SECRET|PRIVATE/);
      expect(mocks.revalidar).not.toHaveBeenCalled();
    },
  );
  it("rechaza operación manipulada sin actualizar la base", async () => {
    const m = preparar();
    const r = await guardarOperacionUbicacion({ ...op, id: "__proto__" });
    expect(r.ok).toBe(false);
    expect(m.escrituras()).toBe(0);
  });
});
