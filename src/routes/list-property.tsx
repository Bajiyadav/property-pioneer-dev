import { createFileRoute, Outlet } from "@tanstack/react-router";

export const LISTING_PHONE_KEY = "sp_listing_phone";

export const Route = createFileRoute("/list-property")({
  component: ListPropertyLayout,
});

function ListPropertyLayout() {
  return <Outlet />;
}
