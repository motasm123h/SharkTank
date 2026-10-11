import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { EMPTY_TRANSCRIPT, type PitchInput, type Report, type Transcript } from "@/domain";

export const pitchStatus = pgEnum("pitch_status", [
  "intake",
  "qa",
  "debate",
  "verdict",
  "complete",
  "failed",
]);

/**
 * A single pitch session. `anonId` comes from a cookie so sessions can be saved
 * before accounts exist; `userId` is attached after login (Phase 6).
 * JSON columns hold Zod-validated data (see src/domain).
 */
export const pitchSessions = pgTable(
  "pitch_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    anonId: text("anon_id").notNull(),
    userId: text("user_id"),
    status: pitchStatus("status").notNull().default("intake"),
    input: jsonb("input").$type<PitchInput>().notNull(),
    /** Mock engine only: the demo scenario picked on the intake form. */
    scenarioId: text("scenario_id"),
    /** Everything said so far; engines continue from it. */
    transcript: jsonb("transcript").$type<Transcript>().notNull().default(EMPTY_TRANSCRIPT),
    report: jsonb("report").$type<Report>(),
    /** Set when the owner creates a public share link; null = private. */
    shareToken: text("share_token").unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("pitch_sessions_anon_id_idx").on(t.anonId)],
);
