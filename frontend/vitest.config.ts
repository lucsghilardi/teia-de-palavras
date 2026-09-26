import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// Testes unitários de lógica pura (ex.: lib/aula). Sem DOM: ambiente node.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
