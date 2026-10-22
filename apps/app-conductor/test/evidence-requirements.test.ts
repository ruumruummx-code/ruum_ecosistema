import { describe, expect, it } from "vitest";
import {
  CAMPOS_INSPECCION,
  CAMPOS_INSPECCION_OBLIGATORIOS,
  camposInspeccionFaltantes,
  campoInspeccionCompleto,
  ETIQUETA_ANGULO,
  fotoSrc,
  INSPECCION_INICIAL,
  listaEvidenciaObligatoria,
  OPCIONES_COMBUSTIBLE,
  OPCIONES_LLAVES,
  OPCIONES_SI_NO,
  totalCamposInspeccionCompletados,
  tipoEvidenciaPorEstado,
  type InspeccionEvidencia
} from "../src/app/viajes/[id]/evidencia/evidence-requirements";

const INSPECCION_COMPLETA: InspeccionEvidencia = {
  combustible: "1/2",
  kilometraje: "50,000",
  llavesRecibidas: "2",
  hologramaVerificacion: "si",
  talonVerificacion: "si",
  tarjetaCirculacion: "si",
  placaDelantera: "ABC-123",
  placaTrasera: "ABC-123",
  notas: "sin novedad"
};

describe("evidence-requirements — requisitos de la evidencia", () => {
  it("declara los campos de inspección con notas como único opcional", () => {
    expect(CAMPOS_INSPECCION).toHaveLength(9);
    expect(CAMPOS_INSPECCION.filter((campo) => !campo.obligatorio).map((campo) => campo.campo)).toEqual([
      "notas"
    ]);
    expect(CAMPOS_INSPECCION_OBLIGATORIOS).toHaveLength(8);
  });

  it("un campo con contenido cuenta como completo y los vacíos no", () => {
    expect(campoInspeccionCompleto(INSPECCION_COMPLETA, "kilometraje")).toBe(true);
    expect(campoInspeccionCompleto({ ...INSPECCION_COMPLETA, kilometraje: "   " }, "kilometraje")).toBe(false);
  });

  it("lista los campos obligatorios que faltan", () => {
    const vacia = INSPECCION_INICIAL;
    expect(camposInspeccionFaltantes(vacia)).toHaveLength(8);
    expect(totalCamposInspeccionCompletados(vacia)).toBe(0);
    expect(camposInspeccionFaltantes(INSPECCION_COMPLETA)).toHaveLength(0);
    expect(totalCamposInspeccionCompletados(INSPECCION_COMPLETA)).toBe(8);
  });

  it("expone catálogos de combustible, llaves y sí/no", () => {
    expect(OPCIONES_COMBUSTIBLE).toContain("1/2");
    expect(OPCIONES_LLAVES).toEqual(["1", "2", "3"]);
    expect(OPCIONES_SI_NO).toEqual([
      { valor: "si", etiqueta: "Sí" },
      { valor: "no", etiqueta: "No" }
    ]);
  });

  it("etiqueta cada ángulo de evidencia", () => {
    expect(ETIQUETA_ANGULO.frente).toBe("Frente");
    expect(ETIQUETA_ANGULO.dano_previo).toBe("Daño previo");
    expect(Object.keys(ETIQUETA_ANGULO)).toHaveLength(7);
  });

  it("la lista obligatoria distingue inicial y final", () => {
    const inicial = listaEvidenciaObligatoria("inicial");
    const final = listaEvidenciaObligatoria("final");

    expect(inicial).toHaveLength(6);
    expect(inicial.filter((r) => r.obligatorio)).toHaveLength(5);
    expect(inicial[0].instruccion).toContain("antes de moverlo");
    expect(final[0].instruccion).toContain("antes de entregar");
    expect(inicial.find((r) => r.angulo === "dano_previo")?.titulo).toBe("Daños preexistentes");
    expect(final.find((r) => r.angulo === "dano_previo")?.titulo).toBe("Daños visibles");
  });

  it("fotoSrc prioriza la ruta local, luego la visual y sólo usa data/blob", () => {
    expect(fotoSrc(undefined)).toBeNull();
    expect(fotoSrc({ local_path: "data:image/jpeg;base64,AA" } as never)).toBe("data:image/jpeg;base64,AA");
    expect(fotoSrc({ url_visual: "https://x/y.jpg" } as never)).toBe("https://x/y.jpg");
    expect(fotoSrc({ url: "blob:abc" } as never)).toBe("blob:abc");
    expect(fotoSrc({ url: "https://x/y.jpg" } as never)).toBeNull();
  });

  it("mapea el estado del traslado al tipo de evidencia", () => {
    expect(tipoEvidenciaPorEstado("evidencia_inicial_en_proceso")).toBe("inicial");
    expect(tipoEvidenciaPorEstado("verificacion_vehiculo_en_proceso")).toBe("inicial");
    expect(tipoEvidenciaPorEstado("llegada_a_destino")).toBe("final");
    expect(tipoEvidenciaPorEstado("evidencia_final_en_proceso")).toBe("final");
    expect(tipoEvidenciaPorEstado("traslado_en_curso")).toBeNull();
  });
});
