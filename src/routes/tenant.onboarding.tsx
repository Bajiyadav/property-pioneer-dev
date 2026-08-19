import { createFileRoute } from "@tanstack/react-router";
import { TenantSignUpFlow } from "@/modules/tenant/components/TenantSignUpFlow";
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
    <div className="min-h-screen bg-neutral-50/80 dark:bg-background pt-20 pb-16">
      <TenantSignUpFlow />
    </div>
  );
}
