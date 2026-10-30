import { expect, it } from "vitest";
import { consultarResumenEvidenciaCierre } from "./resumen-cierre";
const vistas = ["frente", "lado_piloto", "lado_copiloto", "trasera", "tablero"];
const filas = () => ["inicial", "final"].flatMap(tipo => vistas.map(angulo => ({ tipo, angulo, sincronizada: true, conflicto: false, url: "capture" })));
function cliente(fotos: unknown[], conflictos: unknown[] = []) {
  return { from: (tabla: string) => ({ select: () => {
    const query = { eq: () => query, is: () => query, then: (resolve: (v: unknown) => unknown) => Promise.resolve({ data: tabla === "evidencia_fotos" ? fotos : conflictos, error: null }).then(resolve) };
    return query;
  } }) };
}
it("las diez vistas distintas sincronizadas permiten continuar", async () => {
  expect(await consultarResumenEvidenciaCierre(cliente(filas()) as never, "trip")).toEqual({ inicial: 5, final: 5, conflicto: false, completa: true });
});
it("un duplicado de ángulo no reemplaza una vista faltante", async () => {
  const fotos = filas(); fotos[0] = { ...fotos[1] };
  expect(await consultarResumenEvidenciaCierre(cliente(fotos) as never, "trip")).toMatchObject({ inicial: 4, completa: false });
});
it("conflicto de almacenamiento bloquea aunque estén todas las filas", async () => {
  expect(await consultarResumenEvidenciaCierre(cliente(filas(), [{ captura_id: "conflict" }]) as never, "trip")).toMatchObject({ conflicto: true, completa: false });
});
