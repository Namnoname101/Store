import { cookies } from "next/headers";

export const USER_COOKIE_NAME = "user_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PBKDF2_ITERATIONS = 100000;

function getSecretKey(): string {
  return (
    process.env.USER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "digistore-user-secure-fallback-secret-2026"
  );
}

export interface UserSessionPayload {
  userId: string;
  username: string;
  role: string;
  exp: number;
}

// Convert buffer / bytes to hex string
function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

// Convert hex string to Uint8Array
function fromHex(hex: string): Uint8Array {
  const buf = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Base64Url encode
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

// Base64Url decode
function fromBase64Url(str: string): string {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) {
    b64 += "=";
  }
  return typeof atob === "function"
    ? atob(b64)
    : Buffer.from(b64, "base64").toString("utf-8");
}

// PBKDF2 Password Hashing
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return `${toHex(salt)}:${toHex(derivedBits)}`;
}

// PBKDF2 Password Verification
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash || !storedHash.includes(":")) return false;

  const [saltHex, originalHashHex] = storedHash.split(":");
  if (!saltHex || !originalHashHex) return false;

  const salt = fromHex(saltHex);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const computedHashHex = toHex(derivedBits);
  if (computedHashHex.length !== originalHashHex.length) return false;

  let mismatch = 0;
  for (let i = 0; i < computedHashHex.length; i++) {
    mismatch |= computedHashHex.charCodeAt(i) ^ originalHashHex.charCodeAt(i);
  }
  return mismatch === 0;
}

// HMAC-SHA256 Token Signature
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

// Create Session Token
export async function createUserSessionToken(
  payload: Omit<UserSessionPayload, "exp"> & { exp?: number }
): Promise<string> {
  const secret = getSecretKey();
  const exp = payload.exp || Date.now() + SESSION_DURATION_MS;
  const fullPayload: UserSessionPayload = {
    userId: payload.userId,
    username: payload.username,
    role: payload.role || "CUSTOMER",
    exp,
  };

  const payloadStr = JSON.stringify(fullPayload);
  const payloadB64 = toBase64Url(payloadStr);
  const signature = await hmacSha256(secret, payloadB64);

  return `${payloadB64}.${signature}`;
}

// Verify Session Token
export async function verifyUserSessionToken(token: string): Promise<UserSessionPayload | null> {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const secret = getSecretKey();
  const expectedSig = await hmacSha256(secret, payloadB64);

  if (signature.length !== expectedSig.length) return null;
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  if (mismatch !== 0) return null;

  try {
    const jsonStr = fromBase64Url(payloadB64);
    const payload = JSON.parse(jsonStr) as UserSessionPayload;
    if (!payload.userId || !payload.username) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Get User Session from Cookie
export async function getUserSession(): Promise<UserSessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(USER_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyUserSessionToken(token);
  } catch {
    return null;
  }
}

export function getUserCookieOptions() {
  return {
    name: USER_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  };
}
