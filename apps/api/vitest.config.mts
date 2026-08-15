import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // El backend no renderiza interfaz: no necesita DOM.
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
  },
});
