import { useNavigate, useSearch } from "@tanstack/react-router";

/**
 * Reads and writes the `?tab=` search param that every role dashboard shares.
 *
 * Pages used to reach into their own route object via `Route.useSearch()`, which
 * coupled the page component to the file-route that rendered it and made the
 * page impossible to move or reuse. Going through the router's loose-typed
 * hooks keeps the page a plain component: routing stays a routing concern.
 */
export function useDashboardTab(path: string): [string, (id: string) => void] {
  const search = useSearch({ strict: false }) as { tab?: string };
  const navigate = useNavigate();
  const activeTab = search.tab ?? "overview";

  const setActiveTab = (id: string) => {
    navigate({ to: path, search: { tab: id }, replace: true });
  };

  return [activeTab, setActiveTab];
}
