import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { LegalPage, P, Bullets, LEGAL_CONTACT } from "@/modules/legal/components/LegalPage";

export const Route = createFileRoute("/moderation-policy")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/moderation-policy");
    const title = `Content Moderation Policy — ${APP_NAME}`;
    const description = `Rules, guidelines, and enforcement standards governing property listings, photographs, owner verifications, and user communications on ${APP_NAME}.`;
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
  component: ModerationPolicyPage,
});

function ModerationPolicyPage() {
  return (
    <LegalPage
      title="Content Moderation Policy"
      summary={`${APP_NAME} is dedicated to maintaining a transparent, genuine, zero-brokerage property marketplace. This policy sets out the content standards required for all listings, photos, and messages, how our review process works, and how violations are enforced.`}
      sections={[
        {
          heading: "1. Core Principles & User Responsibility",
          body: (
            <>
              <P>
                {APP_NAME} operates as an online technology intermediary that enables authentic
                property owners to connect directly with prospective tenants and buyers.
              </P>
              <P>
                Users, property owners, and listing creators bear strict sole legal responsibility
                for all data, text descriptions, photographs, floor plans, pricing figures, and
                contact information they submit to the platform. By posting content on {APP_NAME},
                you warrant that your listing is accurate, lawful, current, and posted with full
                legal authority.
              </P>
            </>
          ),
        },
        {
          heading: "2. Strictly Prohibited Content",
          body: (
            <>
              <P>
                To protect our community from deception, harassment, and fraud, the following types
                of content are strictly forbidden and will result in immediate delisting and
                potential account termination:
              </P>
              <Bullets
                items={[
                  <>
                    <strong className="text-foreground">Fake or Phantom Listings:</strong>{" "}
                    Advertising properties that do not exist, are unavailable, or have already been
                    rented or sold.
                  </>,
                  <>
                    <strong className="text-foreground">
                      False Ownership & Unauthorized Postings:
                    </strong>{" "}
                    Submitting properties without lawful title, leasehold right, or explicit written
                    authorization from the registered title holder.
                  </>,
                  <>
                    <strong className="text-foreground">Broker Disguise & Impersonation:</strong>{" "}
                    Real estate brokers, middlemen, or agencies falsely registering as individual
                    private owners to evade platform policies.
                  </>,
                  <>
                    <strong className="text-foreground">
                      Deceptive Pricing & Bait-and-Switch:
                    </strong>{" "}
                    Quoting artificially low rents or sale prices to attract inquiries, with
                    undisclosed compulsory fees or charges.
                  </>,
                  <>
                    <strong className="text-foreground">Fake, Stock, or Stolen Photography:</strong>{" "}
                    Using stock images, photos watermarked from other portals, CGI renderings
                    presented as actual photos, or images copied from unrelated properties.
                  </>,
                  <>
                    <strong className="text-foreground">Advance Fee & Viewing Scams:</strong>{" "}
                    Demanding token deposits, "gate pass" fees, visiting fees, or digital cash
                    transfers before physical inspection of the premises.
                  </>,
                  <>
                    <strong className="text-foreground">
                      Solicitation of Sensitive Personal Data:
                    </strong>{" "}
                    Demanding bank account credentials, credit card numbers, OTPs, Aadhaar numbers,
                    or passwords through chats or listings.
                  </>,
                  <>
                    <strong className="text-foreground">Discrimination & Hate Speech:</strong>{" "}
                    Specifying discriminatory restrictions based on religion, caste, community,
                    ethnicity, marital status, sexual orientation, or gender.
                  </>,
                  <>
                    <strong className="text-foreground">
                      Harassment & Abusive Communications:
                    </strong>{" "}
                    Sending threatening, defamatory, obscene, or abusive messages to tenants,
                    buyers, or owners.
                  </>,
                  <>
                    <strong className="text-foreground">Malicious Content & Spam:</strong>{" "}
                    Distributing phishing links, malware, promotional spam, external marketing
                    links, or duplicate listings for the same property.
                  </>,
                  <>
                    <strong className="text-foreground">Unlawful Property Content:</strong> Listings
                    involving unauthorized encroachments, disputed properties under active
                    injunctions without disclosure, or activities in violation of Indian law.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          heading: "3. How Listings Are Moderated",
          body: (
            <>
              <P>
                We employ a multi-layered moderation system combining automated filters and human
                review:
              </P>
              <Bullets
                items={[
                  <>
                    <strong className="text-foreground">Automated Screening:</strong> Pre-submission
                    filters screen listing submissions for duplicate entries, phone number masking,
                    suspicious price anomalies, and prohibited keywords.
                  </>,
                  <>
                    <strong className="text-foreground">Human Admin Queue:</strong> Submitted
                    listings enter our moderation review queue. Reviewers inspect photo
                    authenticity, geographic locality alignment, pricing reasonableness, and profile
                    verification status before granting public visibility.
                  </>,
                  <>
                    <strong className="text-foreground">Ongoing Verification:</strong> Listings may
                    be randomly sampled for periodic reverification or when an owner updates
                    critical parameters such as rent or location.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          heading: "4. Community Reporting & Takedown Mechanism",
          body: (
            <>
              <P>
                Any user or visitor who encounters a suspicious, inaccurate, or violating listing
                can report it directly to our moderation team:
              </P>
              <Bullets
                items={[
                  <>
                    <strong className="text-foreground">On-Page Reporting:</strong> Use the "Report
                    Listing" button located on every property details page to flag issues such as
                    "Already Rented", "Broker in Disguise", "Incorrect Location", or "Suspected
                    Fraud".
                  </>,
                  <>
                    <strong className="text-foreground">Email Escalations:</strong> Send direct
                    evidence (such as screenshots or communication logs) to{" "}
                    <a
                      href={`mailto:${LEGAL_CONTACT}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {LEGAL_CONTACT}
                    </a>
                    .
                  </>,
                ]}
              />
              <P>
                Reports alleging active fraud, scam solicitations, or safety hazards are triaged
                into an expedited queue for rapid response within 24 hours.
              </P>
            </>
          ),
        },
        {
          heading: "5. Enforcement Actions",
          body: (
            <>
              <P>
                When a listing or user account is found to violate this policy, {APP_NAME} applies
                proportionate enforcement actions based on severity:
              </P>
              <Bullets
                items={[
                  <>
                    <strong className="text-foreground">Correction Request:</strong> Minor
                    inadvertent omissions (e.g. blurry photos) trigger an email notification asking
                    the owner to update the listing.
                  </>,
                  <>
                    <strong className="text-foreground">Temporary Delisting:</strong> The listing is
                    withdrawn from search and catalogue results pending verification or dispute
                    resolution.
                  </>,
                  <>
                    <strong className="text-foreground">Permanent Removal:</strong> Immediate
                    rejection and permanent deletion of listings involving fraud, duplicate spam, or
                    broker disguise.
                  </>,
                  <>
                    <strong className="text-foreground">Account Suspension & Ban:</strong> Temporary
                    or permanent termination of account privileges, disabling the user from posting
                    or contacting others.
                  </>,
                  <>
                    <strong className="text-foreground">Blacklisting & Legal Referral:</strong>{" "}
                    Serial fraudsters and impersonators are permanently blacklisted across phone and
                    email identifiers, and serious criminal fraud is reported to appropriate law
                    enforcement and cybercrime authorities.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          heading: "6. Appeals & Dispute Review Process",
          body: (
            <>
              <P>
                If you believe your listing or account was restricted or rejected in error, you may
                submit an appeal within 14 calendar days of the moderation action.
              </P>
              <P>
                To appeal, email{" "}
                <a
                  href={`mailto:${LEGAL_CONTACT}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {LEGAL_CONTACT}
                </a>{" "}
                with:
              </P>
              <Bullets
                items={[
                  "Your registered email address and Listing ID.",
                  "A written explanation addressing the reason for rejection.",
                  "Supporting ownership or authorization documentation (such as a recent property tax receipt, electricity utility bill in owner's name, or municipal sanction document).",
                ]}
              />
              <P>
                Our moderation supervisor team reviews appeals within 3 business days and
                communicates the final binding decision via email.
              </P>
            </>
          ),
        },
        {
          heading: "7. Limitations of Moderation & Intermediary Role",
          body: (
            <>
              <P>
                While {APP_NAME} exercises reasonable diligence through automated filters and review
                procedures, we do not inspect every physical brick-and-mortar property in person,
                nor do we perform municipal title registry searches or encumbrance audits on behalf
                of parties.
              </P>
              <P>
                Moderation status indicates that a listing met our baseline platform standards at
                the time of review. It does not constitute a government title certificate,
                structural warranty, or absolute guarantee. Prospective tenants and buyers must
                physically inspect premises and verify legal documentation before executing binding
                agreements or transferring money.
              </P>
            </>
          ),
        },
        {
          heading: "8. Policy Updates",
          body: (
            <P>
              We may update this Content Moderation Policy periodically to address emerging abuse
              patterns or changes in applicable digital regulations. Any revisions will be published
              on this page with an updated effective date.
            </P>
          ),
        },
      ]}
    />
  );
}
