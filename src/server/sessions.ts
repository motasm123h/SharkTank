import "server-only";
import { randomBytes } from "node:crypto";
import { and, count, eq, gte, ne, type SQL } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { pitchSessions } from "@/db/schema";
import {
  PitchInputSchema,
  ReportSchema,
  TranscriptSchema,
  type PitchInput,
  type Report,
  type SessionPhase,
  type Transcript,
} from "@/domain";

type Row = typeof pitchSessions.$inferSelect;
type Status = Row["status"];

export type OwnSession = {
  id: string;
  status: Status;
  input: PitchInput;
  transcript: Transcript;
  scenarioId: string | null;
};

export type ReportRecord = {
  id: string;
  input: PitchInput;
  report: Report;
  createdAt: Date;
  shareToken: string | null;
};

const isUuid = (id: string) => z.uuid().safeParse(id).success;

async function findOne(where: SQL | undefined): Promise<Row | undefined> {
  const [row] = await getDb().select().from(pitchSessions).where(where).limit(1);
  return row;
}

/** Loads a session only if it belongs to this anonymous visitor. */
export async function loadOwnSession(
  id: string,
  anonId: string | undefined,
): Promise<OwnSession | undefined> {
  if (!anonId || !isUuid(id)) return undefined;
  const row = await findOne(and(eq(pitchSessions.id, id), eq(pitchSessions.anonId, anonId)));
  if (!row) return undefined;
  return {
    id: row.id,
    status: row.status,
    input: PitchInputSchema.parse(row.input),
    transcript: TranscriptSchema.parse(row.transcript),
    scenarioId: row.scenarioId,
  };
}

function toReport(row: Row | undefined): ReportRecord | undefined {
  if (!row?.report) return undefined;
  return {
    id: row.id,
    input: PitchInputSchema.parse(row.input),
    report: ReportSchema.parse(row.report),
    createdAt: row.createdAt,
    shareToken: row.shareToken,
  };
}

/** The report of a finished session, for its owner (or a signed print request). */
export async function loadReport(
  id: string,
  access: { anonId?: string; trusted?: boolean },
): Promise<ReportRecord | undefined> {
  if (!isUuid(id)) return undefined;
  if (access.trusted) return toReport(await findOne(eq(pitchSessions.id, id)));
  if (!access.anonId) return undefined;
  return toReport(
    await findOne(and(eq(pitchSessions.id, id), eq(pitchSessions.anonId, access.anonId))),
  );
}

/** A report opened through its public share link. */
export async function loadSharedReport(token: string): Promise<ReportRecord | undefined> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return undefined;
  return toReport(await findOne(eq(pitchSessions.shareToken, token)));
}

/** Returns the session's share token, creating one on first use. Owner only. */
export async function ensureShareToken(id: string, anonId: string): Promise<string | undefined> {
  const report = await loadReport(id, { anonId });
  if (!report) return undefined;
  if (report.shareToken) return report.shareToken;
  const token = randomBytes(18).toString("base64url");
  await getDb()
    .update(pitchSessions)
    .set({ shareToken: token, updatedAt: new Date() })
    .where(eq(pitchSessions.id, id));
  return token;
}

const STATUS_BY_PHASE: Record<SessionPhase, Status> = {
  entrance: "qa",
  qa: "qa",
  debate: "debate",
  verdict: "verdict",
  report: "complete",
  done: "complete",
};

export function statusForPhase(phase: SessionPhase): Status {
  return STATUS_BY_PHASE[phase];
}

export async function saveProgress(id: string, transcript: Transcript, status: Status) {
  await getDb()
    .update(pitchSessions)
    .set({
      transcript,
      status,
      report: transcript.report ?? null,
      updatedAt: new Date(),
    })
    .where(eq(pitchSessions.id, id));
}

/** Sessions that got past the intake form since midnight UTC (all visitors). */
export async function countSessionsStartedToday(): Promise<number> {
  const midnight = new Date();
  midnight.setUTCHours(0, 0, 0, 0);
  const [row] = await getDb()
    .select({ n: count() })
    .from(pitchSessions)
    .where(and(ne(pitchSessions.status, "intake"), gte(pitchSessions.createdAt, midnight)));
  return row?.n ?? 0;
}
