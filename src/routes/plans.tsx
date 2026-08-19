import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { CustomerPlans } from "@/modules/billing/components/CustomerPlans";
import { OwnerPlans } from "@/modules/billing/components/OwnerPlans";
import { Sparkles, Users, Home } from "lucide-react";

export const Route = createFileRoute("/plans")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/plans");
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

function PlansPage() {
  const [activeTab, setActiveTab] = useState<"seeker" | "owner">("seeker");

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Tab Selector */}
      <div className="border-b border-border/60 bg-muted/20 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center rounded-2xl bg-card p-1.5 border border-border/80 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("seeker")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "seeker"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Seeker / Tenant Assisted Plans (From ₹199)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("owner")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "owner"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Owner Listing Plans (From ₹249)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="pt-4">{activeTab === "seeker" ? <CustomerPlans /> : <OwnerPlans />}</div>
    </div>
  );
}

export default PlansPage;
