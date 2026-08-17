/**
 * Cookie / analytics consent.
 *
 * The rule this enforces: nothing beyond strictly-necessary storage is written,
 * and no behavioural event is recorded, until the visitor has actively chosen.
 * "No choice yet" is treated as "no" — consent is opt-in, never assumed from
 * silence or from continued browsing.
 *
 * The auth token is deliberately outside this gate. It is strictly necessary:
 * without it you cannot stay signed in, so it is set on login regardless. That
 * distinction is the one the ePrivacy/DPDP rules actually turn on.
 */
export const CONSENT_STORAGE_KEY = "up_cookie_consent";

export type ConsentChoice = "accepted" | "rejected";

export interface ConsentRecord {
  choice: ConsentChoice;
  /** ISO timestamp, so we can show the visitor when they decided. */
  decidedAt: string;
  /** Lets us re-ask if the policy materially changes. */
  version: number;
}

/** Bump to re-prompt everyone after a material policy change. */
export const CONSENT_VERSION = 1;

export function readConsent(): ConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (parsed.choice !== "accepted" && parsed.choice !== "rejected") return null;
    if (parsed.version !== CONSENT_VERSION) return null;
    return {
      choice: parsed.choice,
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : "",
      version: CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

export function writeConsent(choice: ConsentChoice): ConsentRecord {
  const record: ConsentRecord = {
    choice,
    decidedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
      window.dispatchEvent(new CustomEvent("up:consent-changed", { detail: record }));
    } catch {
      // Storage blocked. Without a durable record we must keep treating this
      // visitor as un-consented rather than silently start collecting.
    }
  }
  return record;
}

export function clearConsent() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("up:consent-changed", { detail: null }));
  } catch {
    // nothing to clear
  }
}

/** The single question every tracking call must ask before doing anything. */
export function hasAnalyticsConsent(): boolean {
  return readConsent()?.choice === "accepted";
}
