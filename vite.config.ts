import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

/**
 * Build configuration, owned by this repo.
 *
 * This previously came from `@lovable.dev/vite-tanstack-config`, which bundled
 * the plugins below plus preview-sandbox machinery this project never uses. The
 * dependency was removed because nothing about our build should live in another
 * vendor's package. Everything that package contributed to a production build is
 * reproduced here explicitly; what was dropped was sandbox detection, an HMR
 * gate, a dev-server bridge, and dev-only error loggers.
 *
 * Plugin ORDER is load-bearing — it mirrors the order the previous config used.
 *
 * One option was deliberately not carried over: the old config set
 * `esbuild.keepNames` for `build --mode development`. Vite 8's ESBuildOptions
 * type rejects that key, so it was being passed through an untyped object and
 * silently ignored. Reproducing a no-op would only look like configuration.
 */
export default defineConfig(({ command }) => ({
  server: {
    allowedHosts: true,
  },

  css: {
    // Matches the previous behaviour. lightningcss ships with Vite 8.
    transformer: "lightningcss",
  },

  resolve: {
    // Explicit alias ensures zero resolution failures across environments
    alias: { "@": new URL("./src", import.meta.url).pathname },
    // Two copies of React, or of the query client, silently break hooks and
    // cache identity. Deduping is not an optimisation here, it is correctness.
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-start",
      "@tanstack/start-client-core",
      "@tanstack/start-server-core",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },

  ssr: {
    noExternal: [/@tanstack\//],
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Never chunk server-side runtime modules into browser vendor chunks
          if (
            id.includes("/server") ||
            id.includes("@tanstack/react-start") ||
            id.includes("@tanstack/start-")
          ) {
            return;
          }
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "react-vendor";
          }
          if (
            id.includes("node_modules/@radix-ui/") ||
            id.includes("node_modules/lucide-react/") ||
            id.includes("node_modules/framer-motion/") ||
            id.includes("node_modules/tailwind-merge/")
          ) {
            return "ui-vendor";
          }
          if (id.includes("node_modules/@vis.gl/react-google-maps/")) {
            return "maps-vendor";
          }
          if (id.includes("node_modules/recharts/")) {
            return "charts-vendor";
          }
          if (id.includes("node_modules/@supabase/supabase-js/")) {
            return "supabase-vendor";
          }
        },
      },
    },
  },

  plugins: [
    tailwindcss(),

    tanstackStart({
      // Keeps server-only modules out of the client bundle, and fails the build
      // rather than warning. This is a security boundary, not a lint rule: the
      // service-role Supabase client lives under a `server` path, and a silent
      // leak of it into a browser chunk would publish a key that bypasses RLS.
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      // Routes TanStack Start's server entry to src/server.ts, our SSR error
      // wrapper. nitro builds from this.
      server: { entry: "server" },
    }),

    // Build-only. On Vercel, nitro detects the platform from the environment;
    // `defaultPreset` is the fallback for a plain local build, which is why
    // `npm run build` emits Cloudflare worker output on a developer machine.
    ...(command === "build" ? [nitro({ defaultPreset: "cloudflare-module" })] : []),

    viteReact(),
  ],
}));
