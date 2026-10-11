import "server-only";
import { cookies } from "next/headers";

const COOKIE = "panel_anon";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Reads the anonymous visitor id, if any. */
export async function readAnonId(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE)?.value;
}

/** Reads the anonymous visitor id, creating it on first use. Server actions/route handlers only. */
export async function ensureAnonId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR,
    path: "/",
  });
  return id;
}
