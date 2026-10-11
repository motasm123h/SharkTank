import { checkDatabase } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await checkDatabase();
  return Response.json(
    { status: db.ok ? "ok" : "degraded", db, uptimeSeconds: Math.round(process.uptime()) },
    { status: db.ok ? 200 : 503 },
  );
}
