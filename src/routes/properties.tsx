import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  state: fallback(z.string(), "").default(""),
  city: fallback(z.string(), "").default(""),
  listing: fallback(z.string(), "").default(""),
  type: fallback(z.string(), "").default(""),
  minPrice: fallback(z.number(), 0).default(0),
  maxPrice: fallback(z.number(), 0).default(0),
  beds: fallback(z.number(), 0).default(0),
});

export const Route = createFileRoute("/properties")({
  validateSearch: zodValidator(searchSchema),
  component: () => <Outlet />,
});
