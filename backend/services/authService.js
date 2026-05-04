import { OTP_TTL_MS, VERIFIED_TTL_MS } from "../config/constants.js";

export const otpStore = new Map();
export const verifiedEmails = new Map();

export function cleanupAuthStores() {
  const now = Date.now();

  for (const [email, record] of otpStore.entries()) {
    if (record.expires_at <= now) otpStore.delete(email);
  }

  for (const [email, record] of verifiedEmails.entries()) {
    if (record.expires_at <= now) verifiedEmails.delete(email);
  }
}
