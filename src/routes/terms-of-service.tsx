import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { LegalPage, P, Bullets } from "@/modules/legal/components/LegalPage";

export const Route = createFileRoute("/terms-of-service")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/terms-of-service");
    const title = `Terms of Service — ${APP_NAME}`;
    const description = `The terms you agree to when using ${APP_NAME}, including what we do and do not guarantee about listings.`;
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
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      summary={`By using ${APP_NAME} you agree to these terms. We are a marketplace that introduces you to property owners — we are not a party to any tenancy or sale you go on to agree.`}
      sections={[
        {
          heading: "What the service is",
          body: (
            <P>
              We publish property listings supplied by owners and let you contact them directly. We
              do not act as a broker or agent for either side, we do not hold deposits or rent, and
              we take no commission on a deal.
            </P>
          ),
        },
        {
          heading: "What we check, and what we do not",
          body: (
            <>
              <P>
                Listings are reviewed by our team before they appear publicly. That review is a
                moderation step to keep spam, duplicates and obviously false postings off the site.
                It is not a legal or physical verification.
              </P>
              <P>We do not independently verify, and you should satisfy yourself about:</P>
              <Bullets
                items={[
                  "Ownership or title of a property.",
                  "The accuracy of a price, area figure, or amenity list.",
                  "The condition of a property, or whether photographs are current.",
                  "Any person's identity beyond the contact details they supplied.",
                ]}
              />
              <P>
                Always inspect a property and verify documents before paying anything. We do not
                guarantee any listing and are not liable for a dealing you enter into.
              </P>
            </>
          ),
        },
        {
          heading: "Your account",
          body: (
            <Bullets
              items={[
                "You must be 18 or older and provide accurate details.",
                "You are responsible for activity under your account; keep your password secure.",
                "Registering creates a tenant and buyer account. Owner and partner-agent access is granted by us after verification — it cannot be self-assigned.",
                "We may suspend an account that posts false listings, spams other users, scrapes the site, or attempts to bypass access controls.",
              ]}
            />
          ),
        },
        {
          heading: "If you list a property",
          body: (
            <Bullets
              items={[
                "You confirm you own the property or are authorised by the owner to list it.",
                "Your listing must be accurate and its photographs must be of that property.",
                "You grant us permission to display your listing and its media on the platform.",
                "You are responsible for complying with local tenancy and registration law.",
                "We may decline, edit for clarity, or remove a listing that breaches these terms.",
              ]}
            />
          ),
        },
        {
          heading: "Acceptable use",
          body: (
            <P>
              Do not use the service to harass others, post unlawful or discriminatory content,
              misrepresent a property, collect data by automated means, or interfere with the
              platform's operation or security.
            </P>
          ),
        },
        {
          heading: "Availability and liability",
          body: (
            <>
              <P>
                The service is provided as-is. We do not promise uninterrupted availability, and we
                may change or withdraw features.
              </P>
              <P>
                To the extent permitted by law, we are not liable for indirect or consequential
                loss, or for loss arising from a dealing between you and another user. Nothing here
                limits liability that cannot lawfully be limited.
              </P>
            </>
          ),
        },
        {
          heading: "Governing law",
          body: (
            <P>
              These terms are governed by the laws of India, and the courts at Hyderabad, Telangana
              have exclusive jurisdiction over any dispute.
            </P>
          ),
        },
        {
          heading: "Related policies",
          body: (
            <P>
              See our{" "}
              <Link to="/privacy-policy" className="font-semibold text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              for how we handle your data and our{" "}
              <Link to="/refund-policy" className="font-semibold text-primary hover:underline">
                Refund Policy
              </Link>{" "}
              for charges.
            </P>
          ),
        },
      ]}
    />
  );
}
