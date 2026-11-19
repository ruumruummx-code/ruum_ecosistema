import { describe, expect, it } from "vitest";
import {
  mapearAViajeListaDTO,
  sanitizarDireccionCorta,
  sanitizarNombreConductor,
  formatearFechaProgramada,
  type Pasaporte,
  type Traslado,
} from "./traslados-consulta";

describe("traslados-consulta (RUUM-USR-F8-001 CB-1, CB-3)", () => {
  describe("sanitización de PII", () => {
    it("sanitiza nombres de conductores a primer nombre e inicial", () => {
      expect(sanitizarNombreConductor("Juan Pérez López")).toBe("Juan P.");
      expect(sanitizarNombreConductor("María")).toBe("María");
      expect(sanitizarNombreConductor("")).toBeNull();
      expect(sanitizarNombreConductor(null)).toBeNull();
    });

    it("sanitiza direcciones detalladas para lista", () => {
      const larga = "Av. Insurgentes Sur 1602 interior 4B, Crédito Constructor, Benito Juárez, CDMX";
      const corta = sanitizarDireccionCorta(larga, "Benito Juárez");
      expect(corta).toBe("Av. Insurgentes Sur 1602 interior 4B, Crédito Constructor");

      expect(sanitizarDireccionCorta(null, "Guadalajara")).toBe("Guadalajara");
      expect(sanitizarDireccionCorta(null, null)).toBe("Ubicación pendiente");
    });
  });

  describe("formatearFechaProgramada", () => {
    it("formatea fechas con zona horaria de CDMX", () => {
      const res = formatearFechaProgramada("2026-10-28T01:00:00Z"); // 27 de oct 19:00 CDMX
      expect(res.diaNumero).toBe("27");
      expect(res.raw).toBe("2026-10-28T01:00:00Z");
    });

    it("maneja fechas nulas o inválidas sin romper", () => {
      expect(formatearFechaProgramada(null).fechaTexto).toBe("Fecha pendiente");
      expect(formatearFechaProgramada("invalida").fechaTexto).toBe("Fecha pendiente");
    });
  });

  describe("mapearAViajeListaDTO", () => {
    it("mapea un traslado normal con PII minimizado y consistencia", () => {
      const pasaporte: Pasaporte = {
        traslado_id: "t-100",
        usuario_id: "u-1",
        estado: "traslado_en_curso",
        estado_operativo: "in_transit",
        creado_en: "2026-10-27T10:00:00Z",
        cerrado_en: null,
        conductor_id: "c-1",
        conductor_nombre: "Roberto Sánchez",
        conductor_estado: null,
        conductor_calificacion: 5,
        conductor_nivel: null,
        origen_ciudad: "Guadalajara",
        origen_direccion: "Calle Juárez 123, Centro",
        destino_ciudad: "Zapopan",
        destino_direccion: "Av. Patria 456, Puerta de Hierro",
        origen_lat: null,
        origen_lng: null,
        destino_lat: null,
        destino_lng: null,
        origen_referencias: null,
        destino_referencias: null,
        vehiculo_id: "v-1",
        vehiculo_marca: "Toyota",
        vehiculo_modelo: "Prius",
        vehiculo_anio: 2022,
        vehiculo_placas: "JAA1234",
        vehiculo_tipo: "sedan",
        vehiculo_color: "Blanco",
        vehiculo_condicion: null,
        vehiculo_vin: "SECRET-VIN-123",
        vehiculo_gama: null,
        vehiculo_categoria_tarifa: null,
        contacto_entrega_nombre: "Juan Secreto",
        contacto_entrega_telefono: "3311223344",
        contacto_recepcion_nombre: "Pedro Secreto",
        contacto_recepcion_telefono: "3355667788",
        monto_pagado: 1250,
        precio_cotizado: 1250,
        precio_final: 1250,
        tiempo_estimado_horas: 1.5,
        distancia_km: 25,
        tiene_incidencia_abierta: false,
        incidencias_abiertas: 0,
        tipo_pago: "anticipado",
        causa_fallido: null,
        ganancia_conductor: 900,
        evidencia_inicial_fotos_sincronizadas: 4,
        evidencia_final_fotos_sincronizadas: 0,
        actualizado_en: null,
      };

      const traslado: Traslado = {
        id: "t-100",
        origen_ciudad: "Guadalajara",
        origen_direccion: "Calle Juárez 123, Centro",
        destino_ciudad: "Zapopan",
        destino_direccion: "Av. Patria 456, Puerta de Hierro",
        fecha_hora_programada: "2026-10-27T18:00:00Z",
      };

      const dto = mapearAViajeListaDTO(pasaporte, traslado);

      expect(dto.id).toBe("t-100");
      expect(dto.folio).toBe("#RR-T-10");
      expect(dto.categoria).toBe("activos");
      expect(dto.esHuerfano).toBe(false);
      expect(dto.conductorNombre).toBe("Roberto S."); // PII minimizado
      expect(dto.vehiculo.nombre).toBe("Toyota Prius 2022");
    });

    it("detecta pasaporte huérfano sin traslado asociado y lo envía a 'en_revision'", () => {
      const pasaporteHuerfano: Pasaporte = {
        traslado_id: null,
        usuario_id: "u-1",
        estado: "solicitud_creada",
        estado_operativo: null,
        creado_en: "2026-10-27T10:00:00Z",
        cerrado_en: null,
        conductor_id: null,
        conductor_nombre: null,
        conductor_estado: null,
        conductor_calificacion: null,
        conductor_nivel: null,
        origen_ciudad: "CDMX",
        origen_direccion: null,
        destino_ciudad: "Puebla",
        destino_direccion: null,
        origen_lat: null,
        origen_lng: null,
        destino_lat: null,
        destino_lng: null,
        origen_referencias: null,
        destino_referencias: null,
        vehiculo_id: null,
        vehiculo_marca: "Nissan",
        vehiculo_modelo: "Versa",
        vehiculo_anio: 2020,
        vehiculo_placas: null,
        vehiculo_tipo: "sedan",
        vehiculo_color: null,
        vehiculo_condicion: null,
        vehiculo_vin: null,
        vehiculo_gama: null,
        vehiculo_categoria_tarifa: null,
        contacto_entrega_nombre: null,
        contacto_entrega_telefono: null,
        contacto_recepcion_nombre: null,
        contacto_recepcion_telefono: null,
        monto_pagado: 0,
        precio_cotizado: 0,
        precio_final: null,
        tiempo_estimado_horas: null,
        distancia_km: null,
        tiene_incidencia_abierta: false,
        incidencias_abiertas: 0,
        tipo_pago: null,
        causa_fallido: null,
        ganancia_conductor: null,
        evidencia_inicial_fotos_sincronizadas: 0,
        evidencia_final_fotos_sincronizadas: 0,
        actualizado_en: null,
      };

      const dto = mapearAViajeListaDTO(pasaporteHuerfano, null);

      expect(dto.esHuerfano).toBe(true);
      expect(dto.categoria).toBe("en_revision");
      expect(dto.requiereSoporte).toBe(true);
      expect(dto.etiquetaEstado).toBe("En verificación técnica");
    });
  });

  describe("obtenerListaTrasladosConsolidadaUsuario (CA-1 paginación y snapshot)", () => {
    it("ejecuta paginación server-side acotada por range y detecta divergencia de snapshot", async () => {
      const { obtenerListaTrasladosConsolidadaUsuario } = await import("./traslados-consulta");

      const inventarioSimulado = Array.from({ length: 15 }, (_, i) => ({
        traslado_id: `t-${i + 1}`,
        estado: i % 2 === 0 ? "servicio_cerrado" : "traslado_en_curso",
        estado_operativo: i % 2 === 0 ? "closed" : "in_transit",
        cerrado_en: i % 2 === 0 ? "2026-10-27T12:00:00Z" : null,
        creado_en: `2026-10-${String(20 - i).padStart(2, "0")}T10:00:00Z`,
      }));

      let rangoSolicitado: [number, number] | null = null;
      const filtrosPagina: string[] = [];

      // Builder encadenable que registra filtros y resuelve según el tipo de consulta.
      function builderPasaportes() {
        const estado = { head: false, filtros: [] as string[], unico: false, rango: null as [number, number] | null };
        const b: any = {
          select: (_cols: string, opts?: { head?: boolean }) => { estado.head = Boolean(opts?.head); return b; },
          eq: (c: string, v: unknown) => { estado.filtros.push(`eq:${c}=${v}`); return b; },
          in: (c: string, v: string[]) => { estado.filtros.push(`in:${c}=${v.join("|")}`); return b; },
          is: (c: string, v: unknown) => { estado.filtros.push(`is:${c}=${v}`); return b; },
          not: (c: string) => { estado.filtros.push(`not:${c}`); return b; },
          or: (f: string) => { estado.filtros.push(`or:${f}`); return b; },
          order: () => b,
          limit: () => b,
          maybeSingle: () => { estado.unico = true; return b; },
          range: (from: number, to: number) => { estado.rango = [from, to]; return b; },
          then: (resolve: (v: unknown) => void) => {
            const f = estado.filtros.join(" ");
            if (estado.unico) return resolve({ data: { creado_en: inventarioSimulado[0].creado_en }, error: null });
            const cerrados = inventarioSimulado.filter((x) => x.cerrado_en).length;
            const abiertosEnCurso = inventarioSimulado.length - cerrados;
            const conteo = f.includes("cerrado_en.not.is.null") ? cerrados
              : f.includes("traslado_en_curso") ? abiertosEnCurso
              : f.includes("in:estado") || f.includes("traslado_id.is.null") ? 0
              : inventarioSimulado.length;
            if (estado.head) return resolve({ count: conteo, data: null, error: null });
            rangoSolicitado = estado.rango;
            filtrosPagina.push(...estado.filtros);
            const [from, to] = estado.rango ?? [0, 0];
            const slice = inventarioSimulado.slice(from, to + 1).map((item) => ({
              ...item, usuario_id: "u-1", vehiculo_marca: "Toyota", vehiculo_modelo: "Corolla", vehiculo_anio: 2022, monto_pagado: 1000,
            }));
            return resolve({ data: slice, count: inventarioSimulado.length, error: null });
          },
        };
        return b;
      }

      const mockCliente = {
        from: (tabla: string) => {
          if (tabla === "pasaporte_digital") return builderPasaportes();
          if (tabla === "traslados") {
            return {
              select: () => ({
                in: (_col: string, ids: string[]) =>
                  Promise.resolve({
                    data: ids.map((id) => ({
                      id,
                      origen_ciudad: "CDMX",
                      origen_direccion: "Reforma",
                      destino_ciudad: "Toluca",
                      destino_direccion: "Centro",
                      fecha_hora_programada: "2026-10-28T12:00:00Z",
                    })),
                    error: null,
                  }),
              }),
            };
          }
          if (tabla === "pagos") {
            return {
              select: () => ({
                eq: () => Promise.resolve({ data: [{ monto: 5000 }], error: null }),
              }),
            };
          }
          return {};
        },
      };

      // Solicitar página 2 con límite de 5 ítems
      const res = await obtenerListaTrasladosConsolidadaUsuario(mockCliente as any, "u-1", {
        pagina: 2,
        limite: 5,
        snapshotVersionCliente: "2026-09-01T00:00:00Z", // Versión vieja
      });

      // Validar que solo se trajeron 5 ítems (página 2, rango 5 a 9)
      expect(rangoSolicitado).toEqual([5, 9]);
      expect(res.items).toHaveLength(5);
      expect(res.totalItems).toBe(15);
      expect(res.pagina).toBe(2);
      expect(res.limite).toBe(5);
      expect(res.totalPaginas).toBe(3);
      expect(res.snapshotDivergente).toBe(true);
      expect(res.snapshotVersion).toBe(inventarioSimulado[0].creado_en);
      // Conteos exactos por pestaña, no derivados de la página.
      expect(res.conteos.todos).toBe(15);
      expect(res.conteos.finalizados).toBe(8);
      expect(res.conteos.activos).toBe(7);
      expect(res.conteos.cancelados).toBe(0);
    });

    it("aplica pestaña y búsqueda en la consulta del servidor", async () => {
      const { obtenerListaTrasladosConsolidadaUsuario } = await import("./traslados-consulta");
      const filtros: string[] = [];
      const b: any = {};
      for (const m of ["select", "eq", "in", "is", "not", "or", "order", "limit", "maybeSingle", "range"]) {
        b[m] = (...args: unknown[]) => { filtros.push(`${m}:${JSON.stringify(args)}`); return b; };
      }
      b.then = (resolve: (v: unknown) => void) => resolve({ data: [], count: 0, error: null });
      const cliente = { from: () => b };
      await obtenerListaTrasladosConsolidadaUsuario(cliente as any, "u-1", { tab: "cancelados", buscar: "Toluca, (x)" });
      const texto = filtros.join(" ");
      expect(texto).toContain("servicio_cancelado");
      expect(texto).toContain("destino_ciudad.ilike.*Toluca x*");
    });
  });
});
