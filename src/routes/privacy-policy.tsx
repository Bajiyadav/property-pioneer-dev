import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";
import { LegalPage, P, Bullets, LEGAL_CONTACT } from "@/modules/legal/components/LegalPage";

export const Route = createFileRoute("/privacy-policy")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/privacy-policy");
    const title = `Privacy Policy — ${APP_NAME}`;
    const description = `What ${APP_NAME} collects, why, how long it is kept, and how to export or delete it.`;
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
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary={`This policy describes what ${APP_NAME} actually collects today, not what it may collect later. If a practice is not listed here, we are not doing it.`}
      sections={[
        {
          heading: "Who we are",
          body: (
            <P>
              {APP_NAME} is a property marketplace operating in Hyderabad, India. We connect people
              looking for homes and commercial space directly with property owners. We are the data
              controller for the information described below.
            </P>
          ),
        },
        {
          heading: "What we collect",
          body: (
            <>
              <P>
                <strong className="text-foreground">If you browse without an account:</strong>
              </P>
              <Bullets
                items={[
                  "Your search terms and filters, so we can return results. These are held in your browser and are not written to our servers.",
                  "Standard server request logs (IP address, browser user agent, timestamp) used for security, abuse prevention, and diagnosing errors.",
                ]}
              />
              <P>
                <strong className="text-foreground">If you create an account:</strong>
              </P>
              <Bullets
                items={[
                  "Your email address and password. The password is hashed by our authentication provider; we never see or store it in readable form.",
                  "Your name and phone number, which you provide at sign-up.",
                  "Properties you save to favourites.",
                  "Enquiries you send, including the message text, so the owner can reply.",
                  "Site visits you schedule, and notifications generated for you.",
                  "A security log of privileged actions, retained for fraud and abuse investigation.",
                ]}
              />
              <P>
                <strong className="text-foreground">
                  If you accept analytics storage (and only then):
                </strong>
              </P>
              <Bullets
                items={[
                  "Which properties you opened and roughly how long the page was open.",
                  "Your search terms, city, locality and filters, and how many results came back.",
                  "A coarse form factor — mobile, tablet or desktop.",
                ]}
              />
              <P>
                If you decline, or have not yet answered the banner, none of the above is collected
                — the code returns without contacting our servers. We never record your IP address
                against this activity, never fingerprint your device or browser, and never place a
                durable identifier on a signed-out visitor, so anonymous activity cannot later be
                re-linked to you. You can change your mind at any time from the{" "}
                <Link to="/cookie-policy" className="font-semibold text-primary hover:underline">
                  Cookie Policy
                </Link>
                .
              </P>
            </>
          ),
        },
        {
          heading: "Why we need an account for some actions",
          body: (
            <>
              <P>
                Browsing, searching, viewing photos and videos, and reading listing details need no
                account. An account is required only where another person has to be able to reach
                you, or where the data is yours alone:
              </P>
              <Bullets
                items={[
                  "Contacting an owner or submitting an enquiry — the owner needs a way to reply.",
                  "Scheduling a site visit — the owner needs to know who is coming.",
                  "Saving favourites — these must be tied to an account to persist.",
                  "Notifications — we need a verified address to send them to.",
                ]}
              />
            </>
          ),
        },
        {
          heading: "Who we share it with",
          body: (
            <>
              <P>
                We do not sell your personal data, and we do not share it with advertisers or data
                brokers. It is shared only in these cases:
              </P>
              <Bullets
                items={[
                  "With a property owner, when you send them an enquiry or schedule a visit — they receive your name, contact details, and message, because that is the point of sending it.",
                  "With Supabase, which hosts our database and authentication, and Vercel, which serves the site. Both act as processors under contract.",
                  "Where we are legally required to, such as a lawful order from a competent authority.",
                ]}
              />
            </>
          ),
        },
        {
          heading: "How long we keep it",
          body: (
            <Bullets
              items={[
                "Account details: for as long as your account exists.",
                "Enquiries and scheduled visits: retained after your account is deleted only where an owner needs a record of a dealing with you, and anonymised where it is not needed.",
                "Security logs: up to 12 months, then deleted.",
                "If you delete your account, your profile, favourites, notifications and role records are removed within 30 days.",
              ]}
            />
          ),
        },
        {
          heading: "Your rights",
          body: (
            <>
              <P>
                Under the Digital Personal Data Protection Act, 2023 and the GDPR where it applies,
                you can ask us to give you a copy of your data, correct it, or delete it. You can do
                the first two yourself:
              </P>
              <Bullets
                items={[
                  <>
                    <strong className="text-foreground">Export</strong> — download everything we
                    hold about you as a JSON file from{" "}
                    <Link to="/profile" className="font-semibold text-primary hover:underline">
                      your profile
                    </Link>
                    .
                  </>,
                  <>
                    <strong className="text-foreground">Delete</strong> — remove your account and
                    associated data from the same page. This cannot be undone.
                  </>,
                  <>
                    <strong className="text-foreground">Correct or object</strong> — write to{" "}
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
            </>
          ),
        },
        {
          heading: "Security",
          body: (
            <>
              <P>
                Traffic is served over HTTPS, and our database provider encrypts data at rest.
                Access to your records is enforced at the database level by row-level security, so
                one account cannot read another's data even if the application had a defect.
                Administrative access is restricted and every privileged action is logged.
              </P>
              <P>
                No system is immune from compromise. If a breach affects your personal data we will
                notify you and the relevant authority as required by law.
              </P>
            </>
          ),
        },
        {
          heading: "What we do not do",
          body: (
            <Bullets
              items={[
                "No advertising or third-party tracking pixels.",
                "No cross-site tracking, and no sharing of identifiers with ad networks.",
                "No device fingerprinting, session recording, or keystroke logging.",
                "No selling or renting of personal data.",
                "No access to your location unless you explicitly grant it to your browser.",
              ]}
            />
          ),
        },
        {
          heading: "Children",
          body: (
            <P>
              The service is not intended for anyone under 18. We do not knowingly collect data from
              children. If you believe a child has given us personal data, contact us and we will
              delete it.
            </P>
          ),
        },
        {
          heading: "Changes",
          body: (
            <P>
              If we change what we collect or why, we will update the effective date at the top and,
              for material changes such as introducing behavioural analytics, ask for your consent
              before the change takes effect.
            </P>
          ),
        },
      ]}
    />
  );
}
