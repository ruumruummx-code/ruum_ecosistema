import { describe, it, expect, beforeEach } from "vitest";
import {
  semaforoPdfGlobal,
  ejecutarConSemaforoPdf,
  SemaforoPdfOcupadoError,
  ejecutarConLimiteConcurrente,
} from "./pdf-concurrency-semaphore";

describe("pdf-concurrency-semaphore", () => {
  beforeEach(() => {
    semaforoPdfGlobal.resetParaPruebas(2);
  });

  describe("SemaforoGlobalPdf", () => {
    it("adquiere y libera permisos correctamente hasta el cupo máximo", () => {
      expect(semaforoPdfGlobal.cupoDisponible).toBe(2);
      expect(semaforoPdfGlobal.generacionesActivas).toBe(0);

      expect(semaforoPdfGlobal.adquirir()).toBe(true);
      expect(semaforoPdfGlobal.cupoDisponible).toBe(1);
      expect(semaforoPdfGlobal.generacionesActivas).toBe(1);

      expect(semaforoPdfGlobal.adquirir()).toBe(true);
      expect(semaforoPdfGlobal.cupoDisponible).toBe(0);
      expect(semaforoPdfGlobal.generacionesActivas).toBe(2);

      // Tercera petición rechazada fail-fast
      expect(semaforoPdfGlobal.adquirir()).toBe(false);

      semaforoPdfGlobal.liberar();
      expect(semaforoPdfGlobal.cupoDisponible).toBe(1);
      expect(semaforoPdfGlobal.adquirir()).toBe(true);
    });

    it("ejecutarConSemaforoPdf ejecuta la tarea y libera el permiso incluso ante error", async () => {
      const res = await ejecutarConSemaforoPdf(async () => {
        expect(semaforoPdfGlobal.generacionesActivas).toBe(1);
        return 42;
      });
      expect(res).toBe(42);
      expect(semaforoPdfGlobal.generacionesActivas).toBe(0);

      await expect(
        ejecutarConSemaforoPdf(async () => {
          expect(semaforoPdfGlobal.generacionesActivas).toBe(1);
          throw new Error("fallo controlado");
        })
      ).rejects.toThrow("fallo controlado");

      expect(semaforoPdfGlobal.generacionesActivas).toBe(0);
    });

    it("ejecutarConSemaforoPdf lanza SemaforoPdfOcupadoError cuando el cupo está saturado", async () => {
      // Ocupamos los 2 cupos
      semaforoPdfGlobal.adquirir();
      semaforoPdfGlobal.adquirir();

      await expect(
        ejecutarConSemaforoPdf(async () => "no alcanzable")
      ).rejects.toThrow(SemaforoPdfOcupadoError);
    });
  });

  describe("ejecutarConLimiteConcurrente (intra-petición)", () => {
    it("conserva el orden original de resultados y procesa listas vacías", async () => {
      const vacio = await ejecutarConLimiteConcurrente([], 2, async (x) => x);
      expect(vacio).toEqual([]);

      const items = [1, 2, 3, 4, 5];
      let concurrenciaMaxima = 0;
      let enVuelo = 0;

      const resultados = await ejecutarConLimiteConcurrente(items, 2, async (num) => {
        enVuelo++;
        concurrenciaMaxima = Math.max(concurrenciaMaxima, enVuelo);
        await new Promise((r) => setTimeout(r, 10));
        enVuelo--;
        return `item-${num}`;
      });

      expect(resultados).toEqual(["item-1", "item-2", "item-3", "item-4", "item-5"]);
      expect(concurrenciaMaxima).toBeLessThanOrEqual(2);
    });
  });
});
