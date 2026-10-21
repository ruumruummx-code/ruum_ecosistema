import { describe, it, expect } from "vitest";

// feature-flags.ts reexporta funciones de @ruum/api/feature-flags.
// Verificamos que las exportaciones nombradas existan y sean funciones.
import {
  clearFeatureFlagCache,
  getFeatureFlagData,
  isFeatureEnabled,
} from "../src/lib/feature-flags";

describe("feature-flags.ts", () => {
  it("exporta clearFeatureFlagCache como función", () => {
    expect(typeof clearFeatureFlagCache).toBe("function");
  });

  it("exporta getFeatureFlagData como función", () => {
    expect(typeof getFeatureFlagData).toBe("function");
  });

  it("exporta isFeatureEnabled como función", () => {
    expect(typeof isFeatureEnabled).toBe("function");
  });

  it("todas las exportaciones son funciones", () => {
    expect(clearFeatureFlagCache).toBeInstanceOf(Function);
    expect(getFeatureFlagData).toBeInstanceOf(Function);
    expect(isFeatureEnabled).toBeInstanceOf(Function);
  });
});
