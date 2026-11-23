import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
    exclude: ["tests/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "src/billing/**",
        "src/transfers/**",
        "src/drivers/**",
        "src/services/permisos-admin.ts"
      ],
      thresholds: {
        lines: 40,
        statements: 40
      }
    }
  }
});
