import type { Attempt } from "./router";

export type UsageEntry = Attempt & { task: string; at: string };

const MAX_ENTRIES = 200;
// On globalThis: in development each route gets its own copy of this module.
const store = globalThis as typeof globalThis & { __aiUsage?: UsageEntry[] };
const entries: UsageEntry[] = (store.__aiUsage ??= []);

/** Remembers recent model calls (in memory) and logs one line per call. */
export function recordAttempt(task: string, attempt: Attempt) {
  const entry = { ...attempt, task, at: new Date().toISOString() };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  const outcome = attempt.ok ? "ok" : `failed: ${attempt.reason}`;
  console.info(`[ai] ${task} via ${attempt.model} ${outcome} in ${attempt.ms} ms`);
}

/** Newest first, with a per-model summary: which model answered and how often it failed. */
export function usageSnapshot() {
  const byModel: Record<string, { ok: number; failed: number; avgMs: number }> = {};
  for (const e of entries) {
    const m = (byModel[e.model] ??= { ok: 0, failed: 0, avgMs: 0 });
    if (e.ok) {
      m.avgMs = Math.round((m.avgMs * m.ok + e.ms) / (m.ok + 1));
      m.ok += 1;
    } else m.failed += 1;
  }
  return { byModel, recent: [...entries].reverse() };
}
