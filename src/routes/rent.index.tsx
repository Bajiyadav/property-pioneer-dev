import { createFileRoute, redirect } from "@tanstack/react-router";

// Redirect /rent to /rent/hyderabad
export const Route = createFileRoute("/rent/")({
  beforeLoad: () => {
    throw redirect({
      to: "/rent/$city",
      params: { city: "hyderabad" },
    });
  },
  component: () => null,
});
