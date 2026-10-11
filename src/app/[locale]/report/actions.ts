"use server";

import { readAnonId } from "@/lib/anon";
import { ensureShareToken } from "@/server/sessions";

/** Creates (or returns) the public share token for the caller's own report. */
export async function createShareLink(
  sessionId: string,
): Promise<{ token: string } | { error: true }> {
  const anonId = await readAnonId();
  if (!anonId) return { error: true };
  const token = await ensureShareToken(sessionId, anonId);
  return token ? { token } : { error: true };
}
