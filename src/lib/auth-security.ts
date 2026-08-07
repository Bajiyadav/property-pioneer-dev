/**
 * Enterprise Password & Identity Validation Engine for Urban Properties.
 * Complies with OWASP & ISO/IEC 27001 Security Guidelines.
 */

export interface PasswordRulesResult {
  hasMinLength: boolean;
  hasMaxLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  noNameMatch: boolean;
  noEmailMatch: boolean;
  noPhoneMatch: boolean;
  noCommonPassword: boolean;
  passwordsMatch: boolean;
  strengthScore: number; // 0 to 4
  strengthLabel: "Weak" | "Medium" | "Strong" | "Very Strong";
  strengthColor: string; // Tailwind color class
  isCompliant: boolean;
}

const COMMON_DISALLOWED_PASSWORDS = new Set([
  "123456",
  "password",
  "qwerty",
  "admin",
  "welcome123",
  "123456789",
  "urbanproperties",
  "hyderabad123",
  "pass123456",
]);

export function evaluatePasswordRules(
  pass: string,
  confirmPass: string = "",
  fullName: string = "",
  email: string = "",
  phone: string = "",
): PasswordRulesResult {
  const cleanPass = pass || "";
  const lowerPass = cleanPass.toLowerCase();

  const hasMinLength = cleanPass.length >= 12;
  const hasMaxLength = cleanPass.length <= 64;
  const hasUppercase = /[A-Z]/.test(cleanPass);
  const hasLowercase = /[a-z]/.test(cleanPass);
  const hasNumber = /[0-9]/.test(cleanPass);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(cleanPass);

  // Check if contains name (if name length >= 3)
  const nameParts = fullName
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((p) => p.length >= 3);
  const noNameMatch = !nameParts.some((part) => lowerPass.includes(part));

  // Check if contains email prefix (before @)
  const emailPrefix = email.split("@")[0]?.toLowerCase() || "";
  const noEmailMatch = emailPrefix.length < 3 || !lowerPass.includes(emailPrefix);

  // Check if contains phone digits
  const cleanPhone = phone.replace(/\D/g, "");
  const noPhoneMatch = cleanPhone.length < 6 || !lowerPass.includes(cleanPhone.slice(-6));

  // Check common disallowed passwords
  const noCommonPassword = !COMMON_DISALLOWED_PASSWORDS.has(lowerPass);

  // Passwords match
  const passwordsMatch = cleanPass.length > 0 && cleanPass === confirmPass;

  // Calculate Strength Score (0 to 4)
  let score = 0;
  if (cleanPass.length >= 12) score += 1;
  if (hasUppercase && hasLowercase && hasNumber) score += 1;
  if (hasSpecialChar) score += 1;
  if (cleanPass.length >= 16 && noNameMatch && noEmailMatch && noCommonPassword) score += 1;

  let strengthLabel: PasswordRulesResult["strengthLabel"] = "Weak";
  let strengthColor = "bg-rose-500 text-rose-500";

  if (score === 2) {
    strengthLabel = "Medium";
    strengthColor = "bg-amber-500 text-amber-500";
  } else if (score === 3) {
    strengthLabel = "Strong";
    strengthColor = "bg-emerald-500 text-emerald-500";
  } else if (score >= 4) {
    strengthLabel = "Very Strong";
    strengthColor = "bg-blue-500 text-blue-500";
  }

  const isCompliant =
    hasMinLength &&
    hasMaxLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecialChar &&
    noNameMatch &&
    noEmailMatch &&
    noPhoneMatch &&
    noCommonPassword &&
    passwordsMatch;

  return {
    hasMinLength,
    hasMaxLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    noNameMatch,
    noEmailMatch,
    noPhoneMatch,
    noCommonPassword,
    passwordsMatch,
    strengthScore: score,
    strengthLabel,
    strengthColor,
    isCompliant,
  };
}

/**
 * Validates Indian Phone Number (+91)
 */
export function validateIndianPhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, "");
  return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
}

/**
 * Validates Full Name (min 3 chars, letters and spaces only)
 */
export function validateFullName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 3 && trimmed.length <= 80 && /^[a-zA-Z\s]+$/.test(trimmed);
}
