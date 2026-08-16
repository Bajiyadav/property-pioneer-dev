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
    // These suites authenticate as four real QA accounts and sign out with
    // `scope: "global"`, which revokes that user's sessions everywhere. Two
    // files running at once therefore tear down each other's session and fail
    // intermittently on assertions that are actually correct. Running files
    // serially is what makes the results mean what they say.
    fileParallelism: false,
    coverage: { provider: "v8", reporter: ["text", "lcov"], reportsDirectory: "coverage" },
  },
});
