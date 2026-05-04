import validator from "validator";

export function normalizeEmail(rawEmail) {
  const value = String(rawEmail ?? "").trim();
  const normalized = validator.normalizeEmail(value, {
    all_lowercase: true,
    gmail_remove_dots: false,
    gmail_remove_subaddress: false,
    outlookdotcom_remove_subaddress: false,
    yahoo_remove_subaddress: false,
    icloud_remove_subaddress: false,
  });
  return normalized ?? value.toLowerCase();
}

export function isValidEmail(email) {
  return validator.isEmail(email);
}

export function isGmailAddress(email) {
  return /@(?:gmail\.com|googlemail\.com)$/i.test(String(email ?? "").trim());
}
