import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { LegalPage, P, Bullets } from "@/modules/legal/components/LegalPage";

export const Route = createFileRoute("/cookie-policy")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/cookie-policy");
    const title = `Cookie Policy — ${APP_NAME}`;
    const description = `Every cookie and browser storage key ${APP_NAME} uses, what it is for, and how long it lasts.`;
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

function Row({ name, purpose, life }: { name: string; purpose: string; life: string }) {
  return (
    <tr className="border-b border-border/40 align-top">
      <td className="py-2.5 pr-4 font-mono text-[11px] text-foreground">{name}</td>
      <td className="py-2.5 pr-4">{purpose}</td>
      <td className="whitespace-nowrap py-2.5">{life}</td>
    </tr>
  );
}

function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      summary={`${APP_NAME} uses no advertising or third-party tracking cookies. What we store is listed in full below — it is browser storage used to keep you signed in and to remember your preferences.`}
      sections={[
        {
          heading: "What we store",
          body: (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-[11px] font-bold uppercase tracking-wide text-foreground">
                    <th className="py-2 pr-4">Key</th>
                    <th className="py-2 pr-4">Purpose</th>
                    <th className="py-2">Lifetime</th>
                  </tr>
                </thead>
                <tbody>
                  <Row
                    name="sb-*-auth-token"
                    purpose="Keeps you signed in. Set by our authentication provider and removed when you sign out. Strictly necessary."
                    life="Until sign-out"
                  />
                  <Row
                    name="up_cookie_consent"
                    purpose="Remembers your choice on this banner, so we do not ask again."
                    life="12 months"
                  />
                  <Row
                    name="up_favorites_v2"
                    purpose="Favourites saved while signed out, so they survive a page reload."
                    life="Until cleared"
                  />
                  <Row
                    name="up_recent_searches"
                    purpose="Your recent searches, shown on your dashboard. Never sent to our servers."
                    life="Until cleared"
                  />
                  <Row
                    name="up_login_notified:*"
                    purpose="Marks a sign-in as already notified, so a page reload cannot send you a duplicate security email."
                    life="Until sign-out"
                  />
                </tbody>
              </table>
            </div>
          ),
        },
        {
          heading: "Which of these need your consent",
          body: (
            <>
              <P>
                The authentication key is strictly necessary — without it you cannot stay signed in,
                so it is set whenever you log in and does not require consent. The rest are
                preference storage that we set only after you accept.
              </P>
              <P>
                We currently set <strong className="text-foreground">no analytics cookies</strong>.
                If we introduce analytics, it will be off until you opt in.
              </P>
            </>
          ),
        },
        {
          heading: "Third parties",
          body: (
            <>
              <P>None of the storage above is set by an advertiser or analytics vendor.</P>
              <Bullets
                items={[
                  "We load fonts from Google Fonts, which receives your IP address as part of the request.",
                  "Property images and video are served from our own storage provider.",
                  "We do not embed advertising pixels, social widgets, or session-replay tools.",
                ]}
              />
            </>
          ),
        },
        {
          heading: "Changing your mind",
          body: (
            <P>
              You can withdraw consent at any time from the cookie banner link in the footer, or by
              clearing site data in your browser. Clearing storage signs you out. For the wider
              picture, see our{" "}
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
