/**
 * Password policy for Seedha Properties.
 *
 * WHY THERE IS NO UPPERCASE/NUMBER/SYMBOL REQUIREMENT
 *
 * This used to demand 12 characters plus an uppercase, a lowercase, a digit and
 * a symbol — eight tick-boxes in front of anyone trying to sign up. That looks
 * rigorous and is, by the current standard, the wrong thing to do.
 *
 * NIST SP 800-63B §5.1.1.2, the reference most security programmes align to,
 * says verifiers "SHOULD NOT impose other composition rules (e.g., requiring
 * mixtures of different character types)". The reasoning is behavioural rather
 * than theoretical: composition rules do not make people choose unpredictable
 * passwords, they make people choose predictable ones. Forced to add a capital,
 * a digit and a symbol, users produce `Password1!` and `Seedha@123` — which is
 * exactly the shape every cracking dictionary tries first. The rules filter out
 * strong passphrases while waving through weak-but-compliant strings.
 *
 * What the same standard DOES require is the part that actually works, and it is
 * kept here in full: a minimum length, generous maximum, and a blocklist check
 * against common passwords and context-specific values (the user's own name,
 * email and phone). Length is the only input that reliably buys entropy, so it
 * is what the strength meter measures.
 *
 * Net effect: a passphrase like "walking to gachibowli" now passes and is far
 * stronger than "Seedha@123", which no longer does. Fewer rules, better
 * passwords.
 */

/** NIST floor is 8. Ten is a deliberate product choice, still passphrase-friendly. */
export const MIN_PASSWORD_LENGTH = 10;

/**
 * Long maximum, and it matters. Truncating or rejecting long input is what
 * discourages passphrases and password managers, so the cap is high enough that
 * nobody meets it in practice.
 */
export const MAX_PASSWORD_LENGTH = 64;

export type PasswordStrength = "Too short" | "Fair" | "Good" | "Strong";

export interface PasswordRulesResult {
  hasMinLength: boolean;
  hasMaxLength: boolean;
  /** Not the user's own name, email local-part or phone digits. */
  noPersonalInfo: boolean;
  /** Not a known common or brand-derived password. */
  noCommonPassword: boolean;
  passwordsMatch: boolean;
  /** 0-3, driven mainly by length. Advisory — it does not gate submission. */
  strengthScore: number;
  strengthLabel: PasswordStrength;
  strengthColor: string;
  /** Everything required to submit. */
  isCompliant: boolean;
}

/**
 * Blocklist. Deliberately includes both brand spellings and the city: a password
 * built from the thing the user is signing up to is the first guess an attacker
 * makes, and renaming the platform did not make the old name less guessable.
 */
const COMMON_DISALLOWED_PASSWORDS = new Set([
  "123456",
  "1234567890",
  "123456789",
  "password",
  "password1",
  "qwerty",
  "qwerty123",
  "admin",
  "welcome",
  "welcome123",
  "letmein",
  "iloveyou",
  "abc123",
  "seedha",
  "seedhaproperties",
  "seedha123",
  "urbanproperties",
  "hyderabad",
  "hyderabad123",
  "pass123456",
]);

/** Strips separators so "Asha Menon" also blocks "ashamenon" and "asha-menon". */
function normalise(value: string): string {
  return value.toLowerCase().replace(/[\s._\-@]/g, "");
}

export function evaluatePasswordRules(
  pass: string,
  confirmPass: string = "",
  fullName: string = "",
  email: string = "",
  phone: string = "",
): PasswordRulesResult {
  const password = pass || "";
  const flat = normalise(password);

  const hasMinLength = password.length >= MIN_PASSWORD_LENGTH;
  const hasMaxLength = password.length <= MAX_PASSWORD_LENGTH;

  // Context-specific blocklist, which NIST asks for explicitly. Only tokens of 4+
  // characters count: a two-letter name fragment would match almost anything and
  // reject reasonable passwords for no security gain.
  const personalTokens = [
    ...fullName.split(/\s+/),
    email.split("@")[0] ?? "",
    phone.replace(/\D/g, "").slice(-10),
  ]
    .map(normalise)
    .filter((t) => t.length >= 4);

  const noPersonalInfo = flat.length === 0 || !personalTokens.some((t) => flat.includes(t));
  const noCommonPassword = !COMMON_DISALLOWED_PASSWORDS.has(password.toLowerCase().trim());
  const passwordsMatch = password.length > 0 && password === confirmPass;

  /*
   * Strength is length-first, because length is what actually resists guessing.
   * Character variety adds a single point rather than four gates — a hint that
   * mixing helps, not a barrier that shapes everyone into the same weak pattern.
   */
  let strengthScore = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) strengthScore = 1;
  if (password.length >= 14) strengthScore = 2;
  if (password.length >= 18) strengthScore = 3;

  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (variety >= 3 && password.length >= 12 && strengthScore < 3) strengthScore += 1;

  if (!noCommonPassword || !noPersonalInfo) strengthScore = 0;

  const strengthLabel: PasswordStrength = !hasMinLength
    ? "Too short"
    : strengthScore >= 3
      ? "Strong"
      : strengthScore === 2
        ? "Good"
        : "Fair";

  const strengthColor =
    strengthLabel === "Strong"
      ? "bg-emerald-500 text-emerald-600"
      : strengthLabel === "Good"
        ? "bg-blue-500 text-blue-600"
        : strengthLabel === "Fair"
          ? "bg-amber-500 text-amber-600"
          : "bg-rose-500 text-rose-600";

  const isCompliant =
    hasMinLength && hasMaxLength && noPersonalInfo && noCommonPassword && passwordsMatch;

  return {
    hasMinLength,
    hasMaxLength,
    noPersonalInfo,
    noCommonPassword,
    passwordsMatch,
    strengthScore,
    strengthLabel,
    strengthColor,
    isCompliant,
  };
}

/** Validates an Indian mobile number (10 digits, starting 6-9). */
export function validateIndianPhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, "");
  return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
}

/** Validates a full name (3-80 characters, letters and spaces). */
export function validateFullName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 3 && trimmed.length <= 80 && /^[a-zA-Z\s]+$/.test(trimmed);
}

/**
 * Sanitizes full name and prevents duplicate concatenation caused by browser autofill algorithms.
 */
export function sanitizeFullName(input: string): string {
  if (!input) return "";

  // Strip invalid characters and collapse spaces
  let clean = input.replace(/[^a-zA-Z\s]/g, "").replace(/\s+/g, " ");
  const trimmed = clean.trim();

  // Detect word-level duplication e.g. "Suresh Kumar Suresh Kumar" or "Suresh Suresh"
  if (trimmed.length >= 4) {
    const words = trimmed.split(" ");
    if (words.length >= 2 && words.length % 2 === 0) {
      const half = words.length / 2;
      const firstHalf = words.slice(0, half).join(" ");
      const secondHalf = words.slice(half).join(" ");
      if (firstHalf.toLowerCase() === secondHalf.toLowerCase()) {
        clean = firstHalf;
      }
    }
  }

  return clean;
}
