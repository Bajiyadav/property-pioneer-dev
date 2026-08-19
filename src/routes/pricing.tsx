import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import PlansPage from "./plans";

export const Route = createFileRoute("/pricing")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/pricing");
    const title = `Assisted Plans & Pricing — ${APP_NAME}`;
    const description = `Explore affordable assisted home-hunt plans starting from ₹199 and dedicated owner assistance plans on ${APP_NAME}. Zero brokerage guaranteed.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: getOgImageUrl() },
        { name: "robots", content: "index, follow" },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: PlansPage,
});

export default PlansPage;
