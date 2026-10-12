import crypto from "crypto";

/**
 * Computes a deterministic HMAC-SHA256 fingerprint for an API key.
 * Used for database uniqueness lookup without storing raw API keys.
 */
export function computeKeyFingerprint(key: string): string {
  if (!key || typeof key !== "string") return "";
  const secret =
    process.env.USER_SESSION_SECRET ||
    process.env.KEY_FINGERPRINT_SECRET ||
    "default_codex_hmac_secret";
  return crypto
    .createHmac("sha256", secret)
    .update(key.trim())
    .digest("hex");
}

/**
 * Masks an API key for safe UI display and logging (e.g. sk-1234...abcd).
 */
export function maskApiKey(key: string): string {
  if (!key || typeof key !== "string") return "";
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return "****";
  }
  if (trimmed.startsWith("sk-")) {
    const prefix = trimmed.slice(0, 7);
    const suffix = trimmed.slice(-4);
    return `${prefix}...${suffix}`;
  }
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}...${suffix}`;
}

export { getAuthenticatedUser } from "@/lib/user-auth";
