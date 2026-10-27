import { describe, expect, it, vi } from "vitest";
import { actualizarPreferenciasGeneralesUsuario } from "../usuarios";

function clientePrueba(conflictos = 0) {
  let fila = { preferencias: { idioma: "es", desconocida: "conservar" }, actualizado_en: "2026-10-27T00:00:00Z" };
  const filtros: Array<[string, unknown]> = [];
  let cambio: typeof fila;
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn((campo: string, valor: unknown) => { filtros.push([campo, valor]); return query; }),
    single: vi.fn(async () => ({ data: { ...fila, preferencias: { ...fila.preferencias } }, error: null })),
    update: vi.fn((datos: typeof fila) => { cambio = datos; return query; }),
    maybeSingle: vi.fn(async () => {
      if (conflictos-- > 0) { fila = { ...fila, preferencias: { ...fila.preferencias, idioma: "en" } }; return { data: null, error: null }; }
      fila = cambio;
      return { data: { id: "u1" }, error: null };
    }),
  };
  const cliente = { auth: { getUser: async () => ({ data: { user: { id: "auth1" } } }) }, from: vi.fn(() => query) };
  return { cliente, query, filtros, leer: () => fila };
}

describe("parches de preferencias", () => {
  it("conserva claves existentes y limita lectura y escritura al usuario autenticado", async () => {
    const prueba = clientePrueba();
    await actualizarPreferenciasGeneralesUsuario(prueba.cliente as never, { tema: "Oscuro" });
    expect(prueba.leer().preferencias).toEqual({ idioma: "es", desconocida: "conservar", tema: "Oscuro" });
    expect(prueba.filtros.filter(([campo]) => campo === "auth_user_id")).toEqual([["auth_user_id", "auth1"], ["auth_user_id", "auth1"]]);
    expect(prueba.query.maybeSingle).toHaveBeenCalledOnce();
  });
  it("relee y combina los cambios de otra pestaña si se detecta un conflicto", async () => {
    const prueba = clientePrueba(1);
    await actualizarPreferenciasGeneralesUsuario(prueba.cliente as never, { tema: "Oscuro" });
    expect(prueba.leer().preferencias).toEqual({ idioma: "en", desconocida: "conservar", tema: "Oscuro" });
    expect(prueba.query.single).toHaveBeenCalledTimes(2);
  });
  it("no anuncia éxito si ninguna escritura modificó una fila", async () => {
    const prueba = clientePrueba(3);
    await expect(actualizarPreferenciasGeneralesUsuario(prueba.cliente as never, { tema: "Oscuro" })).rejects.toThrow("otra sesión");
    expect(prueba.query.maybeSingle).toHaveBeenCalledTimes(3);
  });
});
