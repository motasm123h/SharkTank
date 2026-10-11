import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { pitchSessions } from "@/db/schema";
import {
  PitchInputSchema,
  TranscriptSchema,
  type PitchInput,
  type SessionPhase,
  type Transcript,
} from "@/domain";

type Status = (typeof pitchSessions.$inferSelect)["status"];

export type OwnSession = {
  id: string;
  status: Status;
  input: PitchInput;
  transcript: Transcript;
  scenarioId: string | null;
};

/** Loads a session only if it belongs to this anonymous visitor. */
export async function loadOwnSession(
  id: string,
  anonId: string | undefined,
): Promise<OwnSession | undefined> {
  if (!anonId || !z.uuid().safeParse(id).success) return undefined;
  const [row] = await getDb()
    .select()
    .from(pitchSessions)
    .where(and(eq(pitchSessions.id, id), eq(pitchSessions.anonId, anonId)))
    .limit(1);
  if (!row) return undefined;
  return {
    id: row.id,
    status: row.status,
    input: PitchInputSchema.parse(row.input),
    transcript: TranscriptSchema.parse(row.transcript),
    scenarioId: row.scenarioId,
  };
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
