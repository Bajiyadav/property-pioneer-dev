import { createFileRoute } from "@tanstack/react-router";
import { AgentDashboardPage } from "@/modules/agent/pages/AgentDashboardPage";

/**
 * Route shell for /dashboard/agent.
 *
 * File-based routing means this path IS the public URL, so the file stays put.
 * It carries routing concerns only; the page itself lives in the agent module.
 */
export const Route = createFileRoute("/_authenticated/dashboard/agent")({
  component: AgentDashboardPage,
});
