import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import * as Sentry from "@sentry/react";
import { routeTree } from "./routeTree.gen";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

export function parseSearch(searchStr: string): Record<string, unknown> {
  if (searchStr.startsWith("?")) {
    searchStr = searchStr.substring(1);
  }
  if (!searchStr) return {};

  const query: Record<string, unknown> = {};
  const pairs = searchStr.split("&");
  for (const pair of pairs) {
    if (!pair) continue;
    const [rawKey, rawVal] = pair.split("=");
    if (!rawKey) continue;
    const key = decodeURIComponent(rawKey);
    const val = rawVal !== undefined ? decodeURIComponent(rawVal) : "";
    try {
      query[key] = JSON.parse(val);
    } catch {
      query[key] = val;
    }
  }
  return query;
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      params.set(key, value);
    } else {
      params.set(key, JSON.stringify(value));
    }
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    parseSearch,
    stringifySearch,
  });

  return router;
};
