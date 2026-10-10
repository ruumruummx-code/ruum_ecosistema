import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    globals: true,
    testTimeout: 15_000,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "test/**/*.test.ts", "test/**/*.test.tsx"],
    exclude: ["tests/**", "**/*.spec.ts", "node_modules/**", ".next/**"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      // Gate inicial espejo de app-conductor (30/60/65/30): lines/branches/functions/statements.
      // Si el gate queda en rojo, subir cobertura real antes de bajar el umbral.
      thresholds: {
        lines: 30,
        branches: 60,
        functions: 65,
        statements: 30
      },
      exclude: [
        "test/**",
        "tests/**",
        "node_modules/**",
        ".next/**",
        "coverage/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.stories.tsx",
        "public/**"
      ]
    }
  }
});
