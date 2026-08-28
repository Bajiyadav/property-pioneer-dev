import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi", ".vercel", "apps/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // shadcn/ui primitives intentionally co-locate their `cva` variant maps and
    // context hooks with the component. Fast Refresh handles these fine.
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: [
            "badgeVariants",
            "buttonVariants",
            "navigationMenuTriggerStyle",
            "toggleVariants",
            "useFormField",
            "useSidebar",
          ],
        },
      ],
    },
  },
  {
    // Off for route files, because the rule cannot give actionable advice here.
    //
    // A TanStack Start route file must export `Route` and must keep its page
    // component local, because the component is passed to `createFileRoute`
    // rather than exported. eslint-plugin-react-refresh 0.5 added a
    // `localComponents` check that fires on exactly that shape, taking this
    // repo from 1 warning to 42. Whitelisting `Route` via `allowExportNames`
    // does not silence it — the check is about the unexported component, and
    // the rule's own suggestions ("move your component to a separate file")
    // would mean splitting every route in two to satisfy a dev-only hint.
    //
    // Scope is deliberately just `src/routes/**`: the rule still runs, and
    // still catches real Fast Refresh problems, everywhere else.
    files: ["src/routes/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  eslintPluginPrettier,
);
