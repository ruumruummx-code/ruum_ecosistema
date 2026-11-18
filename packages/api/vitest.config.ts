import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    // Aún no hay pruebas unitarias en src/: sin esto `turbo run test` (y el
    // pre-commit) falla con "No test files found".
    passWithNoTests: true,
    include: ["src/**/*.test.ts"],
    exclude: ["tests/**", "node_modules/**", "dist/**"]
  }
});
