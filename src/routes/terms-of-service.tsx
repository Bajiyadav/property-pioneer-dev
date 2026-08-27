/**
 * Seedha Properties — Terms & Conditions
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { LegalPage, P, Bullets, LEGAL_CONTACT } from "@/modules/legal/components/LegalPage";

export const Route = createFileRoute("/terms-of-service")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/terms-of-service");
    const title = `Terms & Conditions — ${APP_NAME}`;
    const description = `Terms and conditions governing the use of ${APP_NAME}, our direct-owner technology platform, zero-brokerage model, listings, and user responsibilities.`;
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
      title="Terms & Conditions"
      summary={`These Terms & Conditions ("Terms") govern your access to and use of the ${APP_NAME} website, applications, and technology services. By browsing, registering, posting a property, submitting an enquiry, or utilizing any feature on ${APP_NAME}, you agree to be bound by these Terms.`}
      sections={[
        {
          heading: "1. Acceptance of Terms",
          body: (
            <P>
              By accessing, browsing, registering on, or using {APP_NAME} (referred to as "the
              Platform", "we", "us", or "our"), you ("User", "Owner", "Customer", "Tenant", or
              "Buyer") acknowledge that you have read, understood, and agreed to be legally bound by
              these Terms &amp; Conditions and our related platform policies. If you do not agree
              with any part of these Terms, you must immediately discontinue using the Platform.
            </P>
          ),
        },
        {
          heading: "2. About SEEDHA Properties (Platform Nature)",
          body: (
            <>
              <P>
                {APP_NAME} is an independent online technology platform designed to facilitate
                real-estate discovery and direct, unmediated communication between authentic
                property owners and prospective tenants, buyers, and customers.
              </P>
              <P>
                Unless an explicit written service contract executed by an authorized signatory of{" "}
                {APP_NAME} states otherwise, {APP_NAME} is{" "}
                <strong>strictly a technology intermediary</strong> and is <strong>not</strong>:
              </P>
              <Bullets
                items={[
                  "The owner, landlord, seller, tenant, or buyer of any listed property.",
                  "A traditional real-estate broker, commission agent, middleman, or property dealership.",
                  "A legal representative, power-of-attorney holder, or contracting party to any lease, sale, or conveyance deed agreed between users.",
                  "A financial advisor, mortgage underwriter, or tax consultant.",
                  "A guarantor of any transaction, payment, physical possession, or property condition.",
                ]}
              />
            </>
          ),
        },
        {
          heading: "3. Eligibility & Registration",
          body: (
            <P>
              To create an account or post listings on {APP_NAME}, you must be at least 18 years of
              age and possess the legal capacity to enter into legally binding contracts under the
              Indian Contract Act, 1872. You agree to provide true, accurate, current, and complete
              information during registration and to maintain the accuracy of your profile details.
            </P>
          ),
        },
        {
          heading: "4. Account Security & Responsibilities",
          body: (
            <Bullets
              items={[
                "You are solely responsible for maintaining the confidentiality of your login credentials, mobile OTP verification codes, and account security.",
                "All activities, communications, listings, and enquiries initiated through your authenticated account are your sole responsibility.",
                "You must immediately notify us at support@seedhaproperties.com if you suspect any unauthorized access or breach of your account.",
                "You must not transfer, resell, or share your account access with unauthorized third parties.",
              ]}
            />
          ),
        },
        {
          heading: "5. Property Listings (Owner Obligations & Strict Prohibitions)",
          body: (
            <>
              <P>
                Property owners and authorized listers must adhere to strict platform honesty rules.
                If you post a property listing, you represent, warrant, and covenant that:
              </P>
              <Bullets
                items={[
                  "You are the absolute legal owner of the property, or you possess explicit, legally documented authority from the titleholder to advertise and negotiate the property.",
                  "All details—including property type, built-up area, BHK, locality, city, furnishings, and pricing terms—are truthful, accurate, and kept updated.",
                  "The stated monthly rent, security deposit, maintenance dues, or sale price reflect genuine commercial terms without hidden surcharges.",
                  "Photographs, floor plans, and video walkthroughs uploaded are authentic, current, and depict the actual demised premises without deceptive alteration.",
                  "The property complies with all applicable municipal zoning regulations, housing society bylaws, and local tenancy laws.",
                ]}
              />
              <P>
                <strong>Strictly Prohibited Listing Conduct:</strong> Owners and listers must not
                upload phantom/ghost properties, post duplicate listings to manipulate search
                ranking, impersonate other owners, upload stolen copyrighted photos from other
                portals, demand unauthorized upfront booking fees before in-person inspection,
                engage in unlawful discrimination, or evade platform moderation filters.
              </P>
            </>
          ),
        },
        {
          heading: "6. Property Verification & Moderation Scope",
          body: (
            <>
              <P>
                {APP_NAME} applies platform-level automated and staff moderation filters to detect
                duplicate listings, spam, incomplete submissions, and suspicious postings before or
                after they appear publicly.
              </P>
              <P>
                <strong>Important Legal Notice:</strong> A "Verified", "Inspected", or "Direct
                Owner" badge indicates solely that the listing has passed platform-level checks
                (such as mobile OTP verification, documented address formatting, or basic photo
                moderation). It does <strong>not</strong> constitute a government title guarantee,
                legal deed search, structural engineering assessment, encumbrance check, or warranty
                of transaction safety. Users must conduct their own independent legal and physical
                due diligence before executing agreements or transferring funds.
              </P>
            </>
          ),
        },
        {
          heading: "7. Customer Due Diligence & Responsibilities",
          body: (
            <>
              <P>
                Prospective tenants, buyers, and seekers agree that they will not rely solely on
                information, photos, or badges displayed on the Platform. Customers are solely
                responsible for independently verifying:
              </P>
              <Bullets
                items={[
                  "The physical existence, condition, boundaries, and amenities of the property through an in-person walkthrough.",
                  "The legal ownership, title deed, municipal tax receipts, and identity proof (Aadhaar/PAN) of the person claiming to be the owner or authorized representative.",
                  "The exact terms of monthly rent, security deposit refund conditions, maintenance charges, utility meters, and lock-in covenants.",
                  "Actual vacant possession readiness prior to signing or paying any token amounts.",
                ]}
              />
            </>
          ),
        },
        {
          heading: "8. Zero Platform Brokerage Policy",
          body: (
            <>
              <P>
                {APP_NAME} operates a zero-brokerage marketplace model for direct owner listings.
                Where explicitly stated on the Platform, seekers and property owners are never
                charged traditional real-estate brokerage or percentage deal commissions by{" "}
                {APP_NAME} for discovering or negotiating properties.
              </P>
              <P>
                This zero-brokerage commitment applies to platform matchmaking. Third-party
                statutory expenses—such as government stamp duty, municipal registration charges,
                legal notarisation, payment gateway processing fees, or optional value-added
                services—remain the responsibility of the respective parties as specified.
              </P>
            </>
          ),
        },
        {
          heading: "9. Enquiries, Messaging & Direct Communication",
          body: (
            <Bullets
              items={[
                "Enquiry features, scheduled visits, and direct owner contact functions must be used strictly for bona fide real-estate inquiries.",
                "You must not transmit spam, unsolicited commercial advertisements, harassment, threatening messages, or fraudulent communications through the Platform.",
                "Automated data extraction, screen scraping, or bulk harvesting of owner phone numbers and listing details is strictly illegal and subject to immediate civil and criminal prosecution.",
                "You must not sell, redistribute, or abuse contact details obtained from the Platform.",
              ]}
            />
          ),
        },
        {
          heading: "10. Property Visits & Safety",
          body: (
            <P>
              When scheduling or attending an in-person walkthrough or property inspection, users
              are solely responsible for their personal safety, lawful conduct, and mutual respect.{" "}
              {APP_NAME} does not provide physical security escorts and does not guarantee the
              personal character, conduct, or background of individuals present at a property visit.
              Users are encouraged to schedule daylight visits and adhere to common-sense safety
              practices.
            </P>
          ),
        },
        {
          heading: "11. Payments & Financial Transactions",
          body: (
            <>
              <P>
                Where payments for optional promotional plans, tenant contact passes, or digital
                drafting services are processed through {APP_NAME}, transactions are handled
                securely via authorized third-party payment gateways (e.g. Razorpay, Stripe).
              </P>
              <P>
                Rental payments, security deposits, token advances, and property purchase amounts
                paid directly between owners and customers are private transactions between those
                parties. {APP_NAME} does not hold escrow funds, collect security deposits on behalf
                of owners, or guarantee the repayment of deposits by landlords. Users must obtain
                stamped physical or digital receipts for all direct financial transactions.
              </P>
            </>
          ),
        },
        {
          heading: "12. Refunds & Cancellation Policy",
          body: (
            <P>
              All refund requests regarding optional platform paid services (such as owner promotion
              packages or contact passes) are governed by our official{" "}
              <Link to="/refund-policy" className="font-semibold text-primary hover:underline">
                Refund Policy
              </Link>
              . Standard listing on {APP_NAME} is free of charge. Where paid fast-track promotional
              packages are purchased, pro-rated refunds may be requested within 48 hours of purchase
              if zero customer enquiries were generated during that period.
            </P>
          ),
        },
        {
          heading: "13. Digital Rental Agreements & Legal Tools",
          body: (
            <>
              <P>
                {APP_NAME} provides self-service digital legal drafting tools and stamp duty
                estimation calculators at{" "}
                <Link to="/rental-agreement" className="font-semibold text-primary hover:underline">
                  /rental-agreement
                </Link>
                . Regarding this feature:
              </P>
              <Bullets
                items={[
                  "Users are solely responsible for the truthfulness and accuracy of all party names, property addresses, rent figures, deposit amounts, and covenants entered into the drafting wizard.",
                  "Generated agreements constitute self-drafted templates following standard Model Tenancy principles. They do not constitute formal legal counsel or advocate representation.",
                  "Statutory stamp duty, e-stamping, notarisation, and mandatory sub-registrar registration requirements vary by state and tenancy tenure (such as leases exceeding 11 months). Users must comply with their respective state stamp duty acts.",
                  "{APP_NAME} does not warrant that a self-drafted agreement meets specific judicial dispute requirements without proper execution, adequate state stamp duty, and witness attestation.",
                ]}
              />
            </>
          ),
        },
        {
          heading: "14. Document Uploads & Identity Authenticity",
          body: (
            <P>
              Users uploading KYC verification documents, ownership proofs, utility bills, or
              identification certificates represent that all submitted documents are genuine,
              unedited, lawful copies belonging to them. Uploading forged, tampered, stolen, or
              unauthorized documents is a criminal offense under the Information Technology Act
              (2000) and the Indian Penal Code, resulting in immediate permanent account termination
              and referral to law enforcement authorities.
            </P>
          ),
        },
        {
          heading: "15. Artificial Intelligence (Seedha AI Assistant)",
          body: (
            <P>
              The "Seedha AI" assistant and automated recommendation algorithms provide
              conversational real-estate guidance, commute estimations, and platform assistance.
              AI-generated outputs are for informational convenience only, may occasionally contain
              inaccuracies, and must never be treated as professional legal, tax, architectural, or
              structural advice. Users must independently verify all property specifications
              directly with property owners.
            </P>
          ),
        },
        {
          heading: "16. User Content & Intellectual Property Rights",
          body: (
            <>
              <P>
                You retain ownership of the text, photographs, floor plans, and media you submit to{" "}
                {APP_NAME}. By submitting content, you grant {APP_NAME} a non-exclusive, worldwide,
                royalty-free license to host, display, format, distribute, and promote your listing
                across our digital platforms for the duration of your listing.
              </P>
              <P>
                All platform trademarks, logos, branding, UI designs, algorithms, codebases,
                software, and curated text are the exclusive intellectual property of {APP_NAME}.
                Unauthorized copying, mirroring, reverse engineering, or commercial exploitation is
                strictly prohibited.
              </P>
            </>
          ),
        },
        {
          heading: "17. Prohibited Conduct",
          body: (
            <Bullets
              items={[
                "Engaging in fraudulent listings, identity theft, advance-fee rental scams, or money laundering.",
                "Using web scrapers, crawlers, automated bots, or spiders to extract listings, contact numbers, or pricing data.",
                "Circumventing, bypassing, or attempting to compromise platform security, rate limiters, or authentication mechanisms.",
                "Introducing viruses, malicious scripts, SQL injections, or DDoS attacks to the infrastructure.",
                "Posting abusive, obscene, defamatory, hateful, or unlawfully discriminatory content.",
                "Attempting to re-register after being suspended for fraudulent or deceptive behavior.",
              ]}
            />
          ),
        },
        {
          heading: "18. Verification, Moderation & Listing Removal Rights",
          body: (
            <P>
              {APP_NAME} reserves the absolute right, at its sole discretion and without prior
              notice, to review listings, request supplementary ownership or identity documentation,
              pause or delay publication during investigation, edit listing formatting for clarity,
              or remove any listing that violates these Terms or raises safety concerns.
            </P>
          ),
        },
        {
          heading: "19. Account Suspension & Termination",
          body: (
            <P>
              We may suspend, restrict, or permanently terminate your account without liability if
              you breach these Terms, submit fraudulent documents, receive verified customer fraud
              complaints, or engage in suspicious or illegal activities. Upon termination, active
              listings will be deactivated and access to platform services revoked.
            </P>
          ),
        },
        {
          heading: "20. Third-Party Services & Integrations",
          body: (
            <P>
              The Platform utilizes reliable third-party infrastructure providers for mapping
              coordinates (e.g. Geoapify, Google Maps), authentication, database hosting (Supabase),
              transactional communication (Resend), and payments. Your use of features dependent on
              these services is subject to the respective third-party terms of service and
              availability.
            </P>
          ),
        },
        {
          heading: "21. Platform Availability & Disclaimers",
          body: (
            <P>
              {APP_NAME} is provided on an "AS IS" and "AS AVAILABLE" basis. While we strive for
              maximum uptime and reliability, we do not guarantee that the Platform will be
              uninterrupted, error-free, completely secure, or immune from technical outages,
              scheduled maintenance, or cyber events beyond our reasonable control.
            </P>
          ),
        },
        {
          heading: "22. No Guarantee of Real-Estate Transaction",
          body: (
            <P>
              {APP_NAME} does not warrant or guarantee that posting a property will result in a
              tenant or buyer, that any enquiry will lead to a finalized agreement, that properties
              will remain available, or that prospective counterparties will fulfill their verbal or
              written commitments.
            </P>
          ),
        },
        {
          heading: "23. Limitation of Liability",
          body: (
            <P>
              To the maximum extent permitted by applicable Indian law, {APP_NAME}, its directors,
              officers, employees, and affiliates shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, loss of profits, financial losses arising
              from private deals between users, property damage, deposit non-refund by landlords, or
              personal disputes arising out of or connected with the use of the Platform.
            </P>
          ),
        },
        {
          heading: "24. Indemnification",
          body: (
            <P>
              You agree to indemnify, defend, and hold harmless {APP_NAME}, its founders, directors,
              employees, and agents from and against any claims, liabilities, damages, losses,
              costs, or legal expenses arising out of your breach of these Terms, your submission of
              inaccurate or fraudulent listings/documents, your infringement of third-party rights,
              or your violation of applicable laws.
            </P>
          ),
        },
        {
          heading: "25. Privacy Policy Reference",
          body: (
            <P>
              Our collection, processing, and protection of your personal information (such as phone
              numbers, email addresses, and listing coordinates) are governed by our comprehensive{" "}
              <Link to="/privacy-policy" className="font-semibold text-primary hover:underline">
                Privacy Policy
              </Link>
              , which is incorporated by reference into these Terms.
            </P>
          ),
        },
        {
          heading: "26. Data, Notifications & Communication Consent",
          body: (
            <P>
              By registering on {APP_NAME}, you consent to receiving essential transactional
              notifications, mobile OTP verification codes, enquiry alerts, and security updates via
              SMS, email, or WhatsApp. You may manage non-essential notification preferences in your
              account settings.
            </P>
          ),
        },
        {
          heading: "27. User Disputes & Community Moderation",
          body: (
            <P>
              Disputes arising between landlords and tenants, or buyers and sellers regarding rents,
              security deposits, lease terms, physical condition, or property possession are
              strictly civil matters between those contracting parties. While {APP_NAME} may review
              reported listings and take administrative moderation action against fraudulent
              accounts, {APP_NAME} is not an arbitrator or judicial forum for private tenancy
              disputes.
            </P>
          ),
        },
        {
          heading: "28. Statutory & Legal Tenancy Compliance",
          body: (
            <P>
              Users are solely responsible for complying with all applicable state and national
              laws, including the Transfer of Property Act (1882), state Rent Control / Tenancy
              Acts, Indian Stamp Act, and local police tenant verification guidelines.
            </P>
          ),
        },
        {
          heading: "29. Governing Law & Jurisdiction",
          body: (
            <P>
              These Terms &amp; Conditions shall be governed by, interpreted, and construed in
              accordance with the substantive laws of the Republic of India. In the event of any
              legal dispute or claim arising out of or relating to the Platform, the competent civil
              courts at <strong>Hyderabad, Telangana, India</strong> shall have exclusive
              jurisdiction.
            </P>
          ),
        },
        {
          heading: "30. Modifications & Changes to Terms",
          body: (
            <P>
              We reserve the right to revise or update these Terms periodically to reflect evolving
              technology, legal requirements, or platform features. When changes occur, the updated
              version will be published here with a revised "Effective Date". Continued use of the
              Platform after revisions indicates acceptance of the updated Terms.
            </P>
          ),
        },
        {
          heading: "31. Severability & Waiver",
          body: (
            <P>
              If any provision of these Terms is found to be unlawful, void, or unenforceable by a
              court of competent jurisdiction, that provision shall be severed without affecting the
              validity and enforceability of the remaining provisions.
            </P>
          ),
        },
        {
          heading: "32. Entire Agreement",
          body: (
            <P>
              These Terms &amp; Conditions, together with our{" "}
              <Link to="/privacy-policy" className="font-semibold text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link to="/refund-policy" className="font-semibold text-primary hover:underline">
                Refund Policy
              </Link>
              , constitute the entire agreement between you and {APP_NAME} regarding the use of the
              Platform.
            </P>
          ),
        },
        {
          heading: "33. Contact & Grievance Redressal",
          body: (
            <P>
              For legal inquiries, terms clarification, or platform grievance redressal, please
              contact our support team at{" "}
              <a
                href={`mailto:${LEGAL_CONTACT}`}
                className="font-semibold text-primary hover:underline"
              >
                {LEGAL_CONTACT}
              </a>
              .
            </P>
          ),
        },
      ]}
    />
  );
}
