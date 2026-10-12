import { usageSnapshot } from "@/engine/ai/usage";

export const dynamic = "force-dynamic";

/** Development only: which model answered each recent call, and how often each failed. */
export function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json(usageSnapshot());
}
