export const ADMIN_COOKIE_NAME = "admin_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecretKey(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "digistore-admin-secure-fallback-secret-2026"
  );
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123";
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!password || typeof password !== "string") return false;
  const expected = getAdminPassword();
  // Safe constant-length comparison
  if (password.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < password.length; i++) {
    mismatch |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export interface AdminSessionPayload {
  role: "ADMIN";
  exp: number;
}

// Helper: base64url encode a buffer / string
function toBase64Url(buffer: ArrayBuffer | Uint8Array | string): string {
  let binary = "";
  if (typeof buffer === "string") {
    const enc = new TextEncoder().encode(buffer);
    for (let i = 0; i < enc.length; i++) {
      binary += String.fromCharCode(enc[i]);
    }
  } else {
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
  }

  const b64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(binary, "binary").toString("base64");

  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Helper: base64url decode to string
function fromBase64Url(str: string): string {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) {
    b64 += "=";
  }
  return typeof atob === "function"
    ? atob(b64)
    : Buffer.from(b64, "base64").toString("utf-8");
}

async function hmacSha256(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return toBase64Url(signature);
}

export async function createAdminSessionToken(): Promise<string> {
  const secret = getSecretKey();
  const exp = Date.now() + SESSION_DURATION_MS;
  const payload: AdminSessionPayload = {
    role: "ADMIN",
    exp,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = toBase64Url(payloadStr);
  const signature = await hmacSha256(secret, payloadB64);

  return `${payloadB64}.${signature}`;
}

export async function verifyAdminSessionToken(token: string): Promise<boolean> {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return false;
  }

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return false;

  const secret = getSecretKey();
  const expectedSig = await hmacSha256(secret, payloadB64);

  if (signature.length !== expectedSig.length) return false;
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  if (mismatch !== 0) return false;

  try {
    const jsonStr = fromBase64Url(payloadB64);
    const payload = JSON.parse(jsonStr) as AdminSessionPayload;
    if (payload.role !== "ADMIN") return false;
    if (Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function getAdminCookieOptions() {
  return {
    name: ADMIN_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  };
}

export async function requireAdminAuth(
  req?: any
): Promise<{ id: string; username: string; role: "ADMIN" } | null> {
  try {
    let token: string | undefined;
    if (req && typeof req.cookies?.get === "function") {
      token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    }
    if (!token && typeof document === "undefined") {
      try {
        const { cookies } = await import("next/headers");
        token = cookies().get(ADMIN_COOKIE_NAME)?.value;
      } catch {
        // next/headers may not be invoked outside request context
      }
    }
    if (!token) return null;
    const isValid = await verifyAdminSessionToken(token);
    if (!isValid) return null;
    return { id: "admin", username: "admin", role: "ADMIN" };
  } catch {
    return null;
  }
}
