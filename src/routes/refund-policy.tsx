import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { LegalPage, P, Bullets, LEGAL_CONTACT } from "@/modules/legal/components/LegalPage";

export const Route = createFileRoute("/refund-policy")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/refund-policy");
    const title = `Refund & Cancellation Policy — ${APP_NAME}`;
    const description = `Clear guidelines regarding free platform services, optional paid owner promotions, refund eligibility, payment failure resolution, and cancellation procedures on ${APP_NAME}.`;
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
      title="Refund & Cancellation Policy"
      summary={`${APP_NAME} operates primarily as a 100% free, zero-brokerage property marketplace. This policy sets out the refund and cancellation rules for our optional paid promotional services, handling of payment failures, and the clear separation between platform services and independent user transactions.`}
      sections={[
        {
          heading: "1. Scope & Core Distinction of Services",
          body: (
            <>
              <P>
                To understand our refund and cancellation policy, it is essential to distinguish
                between the three distinct types of interactions on {APP_NAME}:
              </P>
              <Bullets
                items={[
                  <>
                    <strong className="text-foreground">A. Free Platform Services:</strong> Core
                    features available at zero cost to all customers and property owners.
                  </>,
                  <>
                    <strong className="text-foreground">B. Optional Paid Platform Services:</strong>{" "}
                    Optional digital promotional boost packages and priority services offered
                    directly by {APP_NAME}.
                  </>,
                  <>
                    <strong className="text-foreground">
                      C. User-to-User Financial Transactions:
                    </strong>{" "}
                    Direct monetary arrangements (such as security deposits, monthly rent, token
                    booking advances, or sale consideration) negotiated and executed privately
                    between landlords, owners, tenants, and buyers.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          heading: "2. Free Platform Services (No Charges / Nothing to Refund)",
          body: (
            <>
              <P>The primary features of {APP_NAME} are completely free for all users:</P>
              <Bullets
                items={[
                  "Browsing, searching, and filtering all verified property listings.",
                  "Contacting property owners directly and sending inquiries.",
                  "Scheduling physical site visits.",
                  "Standard property listing for individual owners (0% brokerage, zero listing fee).",
                  "Using Home Loan eligibility calculators and exploring comparative bank rates.",
                  "Drafting and previewing custom rental agreements with guided clauses.",
                ]}
              />
              <P>
                Because these services are provided free of charge, no billing or refund obligations
                arise from their standard use.
              </P>
            </>
          ),
        },
        {
          heading: "3. Optional Paid Services Offered by Seedha Properties",
          body: (
            <>
              <P>
                {APP_NAME} offers optional paid services to property owners and seekers who desire
                enhanced digital visibility:
              </P>
              <Bullets
                items={[
                  <>
                    <strong className="text-foreground">Owner Promotional Boost Packages:</strong>{" "}
                    Optional paid plans (such as Fast-Track Promotion and Featured Showcase badges)
                    that grant top search placement and highlighted visual badges on property
                    listings.
                  </>,
                  <>
                    <strong className="text-foreground">Priority Assistance Plans:</strong> Optional
                    support packages providing dedicated customer relationship management.
                  </>,
                ]}
              />
              <P>
                All paid options clearly display total pricing (inclusive of applicable taxes such
                as GST) before purchase. Payments are processed securely via verified third-party
                payment gateways (such as Stripe).
              </P>
            </>
          ),
        },
        {
          heading: "4. Cancellation & Refund Eligibility for Paid Services",
          body: (
            <>
              <P>
                Refunds for optional paid platform services are granted under the following defined
                circumstances:
              </P>
              <Bullets
                items={[
                  <>
                    <strong className="text-foreground">Duplicate Charges:</strong> If an account or
                    card was billed more than once for the same transaction due to a network glitch
                    or repeat submission, the duplicate amount will be refunded in full.
                  </>,
                  <>
                    <strong className="text-foreground">Failed Payment / Non-Activation:</strong> If
                    an amount was debited from your payment method but the service failed to
                    activate due to a technical defect and could not be provisioned within 48 hours
                    of reporting, a full refund will be issued.
                  </>,
                  <>
                    <strong className="text-foreground">48-Hour Cancellation Window:</strong> If an
                    owner purchases a promotional boost package and requests cancellation within 48
                    hours of order placement—provided no verified inquiries or promotional outreach
                    benefits have been fulfilled—a full or pro-rated refund will be granted.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          heading: "5. Non-Refundable Situations",
          body: (
            <>
              <P>Refunds will not be issued in the following scenarios:</P>
              <Bullets
                items={[
                  <>
                    <strong className="text-foreground">Fulfilled Services:</strong> Promotional
                    boost packages where the active duration has expired or where promotional
                    benefits and inquiries were successfully delivered.
                  </>,
                  <>
                    <strong className="text-foreground">Policy Violations & Delistings:</strong>{" "}
                    Listings rejected, suspended, or removed because they violated our Content
                    Moderation Policy or Terms of Service (e.g., fake listings, false ownership
                    claims, broker disguise, or fraudulent media).
                  </>,
                  <>
                    <strong className="text-foreground">External Property Disposal:</strong> Unused
                    promotional duration when an owner rents or sells their property through outside
                    personal channels before the boost period concludes.
                  </>,
                  <>
                    <strong className="text-foreground">Third-Party Government Fees:</strong>{" "}
                    Statutory fees paid to government departments (e.g., state e-stamp duty or
                    registration charges), which are non-refundable once disbursed to revenue
                    departments.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          heading: "6. User-to-User Transactions & Security Deposits",
          body: (
            <>
              <P>
                {APP_NAME} is strictly a technology intermediary and does not participate in
                financial settlements between users. Specifically:
              </P>
              <Bullets
                items={[
                  "We do not collect, escrow, hold, or transfer security deposits.",
                  "We do not collect or manage monthly rental payments or advance tokens.",
                  "We do not hold property purchase consideration.",
                ]}
              />
              <P>
                Any security deposit refunds, rent reconciliations, or advance returns must be
                settled directly between the tenant and the landlord in accordance with their
                private lease agreement. {APP_NAME} cannot refund monies paid directly to third
                parties or property owners.
              </P>
            </>
          ),
        },
        {
          heading: "7. How to Request a Refund",
          body: (
            <>
              <P>
                To request a refund for an eligible paid service, please submit a written request to
                our billing team within the applicable timeframe:
              </P>
              <Bullets
                items={[
                  <>
                    Email:{" "}
                    <a
                      href={`mailto:${LEGAL_CONTACT}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {LEGAL_CONTACT}
                    </a>
                  </>,
                  "Subject Line: 'Refund Request — [Order ID / Listing ID]'",
                  "Provide: Registered account email address, date of transaction, payment gateway reference or receipt number, and a detailed description of the issue.",
                ]}
              />
            </>
          ),
        },
        {
          heading: "8. Refund Processing Timelines",
          body: (
            <>
              <P>Once submitted, refund requests undergo standard verification:</P>
              <Bullets
                items={[
                  <>
                    <strong className="text-foreground">Review & Approval:</strong> Our support team
                    reviews and verifies eligible requests within 2 to 3 business days.
                  </>,
                  <>
                    <strong className="text-foreground">Bank & Card Settlement:</strong> Approved
                    refunds are credited directly to the original source payment method (card, UPI,
                    or bank account) within 5 to 7 business days, depending on the card network and
                    issuing bank's settlement schedule.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          heading: "9. Policy Revisions",
          body: (
            <P>
              We reserve the right to modify this Refund &amp; Cancellation Policy as new services
              are introduced. Any updates will be posted on this page with a revised effective date.
            </P>
          ),
        },
      ]}
    />
  );
}
