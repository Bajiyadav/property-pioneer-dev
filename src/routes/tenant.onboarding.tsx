import { createFileRoute } from "@tanstack/react-router";
import { TenantOnboardingAI } from "@/modules/interactions/components/ai/TenantOnboardingAI";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/tenant/onboarding")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/tenant/onboarding");
    const title = `Tenant Match Registration — ${APP_NAME}`;
    const description =
      "Set your mandatory location, commute limits, and budget preferences to get matched with verified direct-owner properties with 0% brokerage.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: getOgImageUrl() },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: TenantOnboardingPage,
});

function TenantOnboardingPage() {
  return (
    <div className="min-h-screen bg-neutral-50/80 dark:bg-background pt-20 pb-16 px-4">
      <div className="max-w-4xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Find Your Perfect Home</h1>
        <p className="text-slate-600">
          Chat with Seedha AI to discover properties matching your lifestyle and budget.
        </p>
      </div>
      <TenantOnboardingAI />
    </div>
  );
}
