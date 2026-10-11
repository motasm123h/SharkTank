import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside a React Server Component bundle.
      "server-only": fileURLToPath(new URL("./src/test/empty-module.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Server modules validate the environment; tests never touch this database.
    env: { DATABASE_URL: "postgres://test:test@localhost:5432/test" },
    include: ["src/**/*.test.ts"],
  },
});
