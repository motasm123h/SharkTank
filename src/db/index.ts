import "server-only";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

type Db = ReturnType<typeof createDb>;

function createDb() {
  const client = postgres(env().DATABASE_URL, { max: 10 });
  return drizzle(client, { schema });
}

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: Db };

export function getDb(): Db {
  globalForDb.db ??= createDb();
  return globalForDb.db;
}

export type DbHealth = { ok: true; latencyMs: number } | { ok: false; error: string };

export async function checkDatabase(): Promise<DbHealth> {
  const started = performance.now();
  try {
    await getDb().execute(sql`select 1`);
    return { ok: true, latencyMs: Math.round(performance.now() - started) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "unknown error" };
  }
}
