import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./vitest.server-only-mock.ts", import.meta.url)),
    },
  },
  test: {
    // Solo unit tests colocalizados; tests/ (playwright) y test/ (node:test) tienen sus propios runners.
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**", "tests/**", "test/**"],
    // Aún no hay pruebas en src/: sin esto `turbo run test` (y el pre-commit)
    // falla con "No test files found".
    passWithNoTests: true,
  },
});
