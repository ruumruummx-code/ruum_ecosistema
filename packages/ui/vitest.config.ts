import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: {
    // Los componentes usan JSX sin importar React (lo resuelve Next en build);
    // en tests se compila con runtime automático (precedente: app-usuario).
    jsx: "automatic",
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules/**", "dist/**"],
  },
});
