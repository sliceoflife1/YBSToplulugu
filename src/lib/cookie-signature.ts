/**
 * HMAC-SHA256 based cookie signing and verification.
 * Uses Web Crypto API for Edge Runtime compatibility (middleware).
 *
 * Cookie format: `userId:timestamp:hmacHex`
 */

const VERIFIED_MAX_AGE = 12 * 60 * 60; // 12 hours
const CHECKED_MAX_AGE = 60 * 60; // 1 hour

async function getHMACKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): ArrayBuffer {
  const pairs = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(pairs.map((byte) => parseInt(byte, 16))).buffer;
}

/**
 * Creates an HMAC-signed cookie value: `userId:timestamp:hmac`
 * @throws Error if TWO_FA_COOKIE_SECRET is not configured
 */
export async function signCookieValue(userId: string): Promise<string> {
  const secret = process.env.TWO_FA_COOKIE_SECRET;
  if (!secret) {
    throw new Error("TWO_FA_COOKIE_SECRET environment variable is not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = `${userId}:${timestamp}`;

  const key = await getHMACKey(secret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return `${payload}:${bufferToHex(signature)}`;
}

/**
 * Verifies an HMAC-signed cookie value.
 * Returns true only if HMAC is valid, user ID matches, and timestamp is within maxAge.
 */
export async function verifyCookieValue(
  cookieValue: string,
  userId: string,
  maxAgeSeconds: number = VERIFIED_MAX_AGE
): Promise<boolean> {
  const secret = process.env.TWO_FA_COOKIE_SECRET;
  if (!secret || !cookieValue) return false;

  const parts = cookieValue.split(":");
  if (parts.length !== 3) return false;

  const [cookieUserId, timestampStr, signatureHex] = parts;

  // Verify user ID matches
  if (cookieUserId !== userId) return false;

  // Verify timestamp is valid and within maxAge
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > maxAgeSeconds) return false;
  if (timestamp > now + 60) return false; // Reject future-dated cookies (60s clock tolerance)

  // Verify HMAC signature
  try {
    const payload = `${cookieUserId}:${timestampStr}`;
    const key = await getHMACKey(secret);
    const encoder = new TextEncoder();
    const signatureBuffer = hexToBuffer(signatureHex);

    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBuffer,
      encoder.encode(payload)
    );
  } catch {
    return false;
  }
}

export { VERIFIED_MAX_AGE, CHECKED_MAX_AGE };
