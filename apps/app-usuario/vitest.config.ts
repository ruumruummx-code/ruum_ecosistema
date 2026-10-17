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
    // RC-09: la suite (417 tests jsdom que importan páginas Next completas)
    // flaqueaba en CI/carga: tests pesados superaban los 15 s y los `findBy`
    // agotaban su espera de 1 s por el debounce de 300 ms del buscador. Estos
    // márgenes NO relajan ninguna aserción; solo evitan falsos rojos por carga.
    testTimeout: 30_000,
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
        "public/**",
        "cap-shell/**",
        "android/**",
        // Tooling: nunca se importan desde el código bajo prueba, así que
        // contaban como 0% e inflaban el denominador sin aportar información.
        "next-env.d.ts",
        "instrumentation.ts",
        "next.config.ts",
        "vitest.config.ts",
        "capacitor.config.ts",
        "sentry.client.config.ts",
        "sentry.server.config.ts"
      ]
    }
  }
});
