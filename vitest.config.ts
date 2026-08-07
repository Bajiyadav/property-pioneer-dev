import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  // Explicit alias rather than tsconfig-paths: vitest resolves test files that
  // live outside `src`, and an explicit map is the least surprising thing here.
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    coverage: { provider: "v8", reporter: ["text", "lcov"], reportsDirectory: "coverage" },
  },
});
