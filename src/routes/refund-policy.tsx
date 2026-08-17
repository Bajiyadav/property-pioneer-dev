import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { LegalPage, P, Bullets, LEGAL_CONTACT } from "@/modules/legal/components/LegalPage";

export const Route = createFileRoute("/refund-policy")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/refund-policy");
    const title = `Refund Policy — ${APP_NAME}`;
    const description = `${APP_NAME} charges no platform fee or brokerage. What that means, and what to do if you are asked to pay.`;
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
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refund Policy"
      summary={`${APP_NAME} does not currently charge for any of its features. Browsing, searching, contacting owners, and listing a property are free, so in normal use there is nothing to refund.`}
      sections={[
        {
          heading: "What is free",
          body: (
            <Bullets
              items={[
                "Searching and browsing every listing.",
                "Contacting an owner, sending an enquiry, and scheduling a visit.",
                "Creating an account and saving favourites.",
                "Listing a property as an owner, including photographs and video.",
              ]}
            />
          ),
        },
        {
          heading: "We take no commission",
          body: (
            <P>
              We do not charge brokerage on a tenancy or sale arranged through the platform. We are
              not party to what you agree with an owner, so any deposit, rent, or price is a matter
              between you and them — we never hold that money and cannot refund it.
            </P>
          ),
        },
        {
          heading: "If you are asked to pay",
          body: (
            <>
              <P>
                We will never ask you to pay us to unlock a listing, to see contact details, or to
                secure a property. If someone claiming to represent {APP_NAME} asks for payment,
                treat it as fraudulent and report it to{" "}
                <a
                  href={`mailto:${LEGAL_CONTACT}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {LEGAL_CONTACT}
                </a>
                .
              </P>
              <P>
                An individual owner may separately ask for a token amount or deposit. That is their
                arrangement with you, not ours. Verify documents and inspect the property before
                paying anything.
              </P>
            </>
          ),
        },
        {
          heading: "If paid features are introduced",
          body: (
            <>
              <P>
                Should we introduce a paid feature in future, this page will be updated before it
                launches and will set out the price and the refund terms. Our intention for any such
                feature is:
              </P>
              <Bullets
                items={[
                  "A clear statement of the charge before you commit to it.",
                  "A full refund where a paid feature did not work as described.",
                  "Refunds returned to the original payment method within 7 to 10 working days of approval.",
                ]}
              />
              <P>
                Until this page says otherwise, no such feature exists and no charge is payable to
                us.
              </P>
            </>
          ),
        },
        {
          heading: "Related policies",
          body: (
            <P>
              See our{" "}
              <Link to="/terms-of-service" className="font-semibold text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy-policy" className="font-semibold text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </P>
          ),
        },
      ]}
    />
  );
}
