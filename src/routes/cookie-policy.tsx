import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { LegalPage, P, Bullets, LEGAL_CONTACT } from "@/modules/legal/components/LegalPage";

export const Route = createFileRoute("/cookie-policy")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/cookie-policy");
    const title = `Cookie Policy — ${APP_NAME}`;
    const description = `Every cookie and browser storage key ${APP_NAME} uses, what it is for, and how you can control your preferences.`;
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
  component: CookiePolicyPage,
});

function Row({
  name,
  purpose,
  type,
  life,
}: {
  name: string;
  purpose: string;
  type: string;
  life: string;
}) {
  return (
    <tr className="border-b border-border/40 align-top">
      <td className="py-2.5 pr-4 font-mono text-[11px] text-foreground">{name}</td>
      <td className="py-2.5 pr-4 text-xs">{purpose}</td>
      <td className="py-2.5 pr-4 text-xs font-semibold text-foreground/80">{type}</td>
      <td className="whitespace-nowrap py-2.5 text-xs">{life}</td>
    </tr>
  );
}

function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie & Storage Policy"
      summary={`${APP_NAME} uses cookies and browser storage technologies strictly to operate the platform securely, remember your location preferences, and keep you signed in. We do not use third-party advertising cookies or cross-site tracking pixels.`}
      sections={[
        {
          heading: "1. What Are Cookies and Browser Storage Technologies?",
          body: (
            <>
              <P>
                Cookies are small text files placed on your computer or mobile device by websites
                you visit. In addition to cookies, modern web browsers offer local storage and
                session storage, which allow web applications to store functional data locally on
                your device.
              </P>
              <P>
                In our mobile application, standard secure device storage mechanisms (such as secure
                app preferences and keychain storage) perform equivalent functional roles to ensure
                smooth and secure app navigation.
              </P>
            </>
          ),
        },
        {
          heading: "2. Categories of Technologies We Use",
          body: (
            <>
              <P>
                We classify the storage technologies used across our web platform into distinct
                functional categories:
              </P>
              <Bullets
                items={[
                  <>
                    <strong className="text-foreground">
                      Strictly Necessary & Session Storage:
                    </strong>{" "}
                    Essential for website navigation, user authentication, security verification,
                    and account access. These cannot be switched off in our systems.
                  </>,
                  <>
                    <strong className="text-foreground">Location & Preference Storage:</strong> Used
                    to remember your selected State and City during browsing, your saved shortlisted
                    properties, and your cookie consent status.
                  </>,
                  <>
                    <strong className="text-foreground">Security & Fraud Prevention:</strong>{" "}
                    Markers used to detect unauthorized access attempts, mitigate rate-limit abuse,
                    and prevent duplicate security notifications.
                  </>,
                  <>
                    <strong className="text-foreground">
                      First-Party Performance & Analytics:
                    </strong>{" "}
                    Aggregated telemetry used solely to understand site performance and fix broken
                    flows. Activated only with your explicit consent.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          heading: "3. Complete Storage Inventory",
          body: (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-[11px] font-bold uppercase tracking-wide text-foreground">
                    <th className="py-2 pr-4">Key / Identifier</th>
                    <th className="py-2 pr-4">Purpose</th>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2">Lifetime</th>
                  </tr>
                </thead>
                <tbody>
                  <Row
                    name="sb-*-auth-token"
                    purpose="Maintains your authenticated session securely. Set by our authentication provider."
                    type="Strictly Necessary"
                    life="Until Sign-out / 1 Year"
                  />
                  <Row
                    name="seedha_selected_state"
                    purpose="Remembers your chosen State during location-first browsing so you don't reselect on every page."
                    type="Functional / Session"
                    life="Session (cleared on close)"
                  />
                  <Row
                    name="seedha_selected_city"
                    purpose="Remembers your chosen City during property search and exploration."
                    type="Functional / Session"
                    life="Session (cleared on close)"
                  />
                  <Row
                    name="up_cookie_consent"
                    purpose="Records your consent preferences for optional storage so the banner is not shown repeatedly."
                    type="Preferences"
                    life="12 Months"
                  />
                  <Row
                    name="up_favorites_v2"
                    purpose="Stores property listings you have shortlisted while browsing, allowing you to view them later."
                    type="Preferences"
                    life="Until Cleared"
                  />
                  <Row
                    name="up_recent_searches"
                    purpose="Stores your recent search queries locally on your device for fast repeat lookups. Never sent to third parties."
                    type="Preferences"
                    life="Until Cleared"
                  />
                  <Row
                    name="up_login_notified:*"
                    purpose="Prevents sending duplicate sign-in security alert emails when refreshing authenticated pages."
                    type="Security"
                    life="Until Sign-out"
                  />
                </tbody>
              </table>
            </div>
          ),
        },
        {
          heading: "4. Third-Party Service Providers",
          body: (
            <>
              <P>
                We do not sell, rent, or lease any cookie data to advertising networks or data
                brokers. Third-party interactions are strictly limited to necessary infrastructure
                providers:
              </P>
              <Bullets
                items={[
                  <>
                    <strong className="text-foreground">Typography:</strong> Google Fonts provides
                    typography stylesheets, receiving standard network connection parameters.
                  </>,
                  <>
                    <strong className="text-foreground">Media & Cloud Infrastructure:</strong>{" "}
                    Property photographs and videos are hosted on cloud storage infrastructure
                    configured with strict security access rules.
                  </>,
                  <>
                    <strong className="text-foreground">Payment Gateways:</strong> When you purchase
                    an optional promotional boost, our secure payment provider (Stripe) sets
                    necessary session tokens during checkout to process payments securely.
                  </>,
                  <>
                    <strong className="text-foreground">No Ad Trackers:</strong> We do not deploy
                    third-party retargeting pixels, social media tracking beacons, or cross-app ad
                    identifiers.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          heading: "5. How You Can Manage or Disable Cookies",
          body: (
            <>
              <P>You have full control over non-essential storage technologies on {APP_NAME}:</P>
              <Bullets
                items={[
                  <>
                    <strong className="text-foreground">Cookie Consent Banner:</strong> You can
                    choose to accept or decline optional storage when you first visit the platform,
                    or change your choice at any time using the link in the website footer.
                  </>,
                  <>
                    <strong className="text-foreground">Browser Settings:</strong> Most web browsers
                    allow you to view, manage, and delete cookies through their privacy settings.
                    You can configure your browser to reject all third-party cookies or alert you
                    when a cookie is set.
                  </>,
                  <>
                    <strong className="text-foreground">Clearing Site Data:</strong> Clearing your
                    browser cache and storage will reset your location selection, clear local
                    favourites, and sign you out of your account.
                  </>,
                ]}
              />
            </>
          ),
        },
        {
          heading: "6. Impact of Disabling Essential Technologies",
          body: (
            <P>
              If you block or disable strictly necessary cookies and local storage in your browser,
              core functions of the website—such as staying signed in, saving property drafts,
              maintaining your active location filters, or completing secure checkouts—will not
              function correctly.
            </P>
          ),
        },
        {
          heading: "7. Mobile Application Storage",
          body: (
            <P>
              In our mobile app, authentication tokens and saved listings are stored in sandboxed
              local app storage provided by the mobile operating system (iOS / Android). This
              storage is isolated from other apps and is cleared when you uninstall the app or log
              out.
            </P>
          ),
        },
        {
          heading: "8. Relationship With Privacy Policy & Contact",
          body: (
            <P>
              For comprehensive information on how we collect, protect, and process personal data,
              please review our{" "}
              <Link to="/privacy-policy" className="font-semibold text-primary hover:underline">
                Privacy Policy
              </Link>
              . If you have questions regarding this Cookie Policy, contact us at{" "}
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
