import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { appSecret } from "@/lib/env";

/**
 * Short-lived signed tokens that let the PDF renderer (which has no cookies)
 * open one specific report. Format: `<expiresAtMs>.<hmac>`.
 */
function hmac(payload: string): string {
  return createHmac("sha256", appSecret()).update(payload).digest("base64url");
}

export function signPrintToken(sessionId: string, ttlMs = 2 * 60_000): string {
  const expires = Date.now() + ttlMs;
  return `${expires}.${hmac(`print:${sessionId}:${expires}`)}`;
}

export function verifyPrintToken(sessionId: string, token: string | undefined): boolean {
  if (!token) return false;
  const [expiresRaw, signature] = token.split(".");
  const expires = Number(expiresRaw);
  if (!signature || !Number.isFinite(expires) || expires < Date.now()) return false;
  const expected = Buffer.from(hmac(`print:${sessionId}:${expires}`));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
