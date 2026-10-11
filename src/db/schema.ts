import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
 * `input` and `report` hold Zod-validated JSON (contracts arrive in Phase 1).
 */
export const pitchSessions = pgTable("pitch_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  anonId: text("anon_id").notNull(),
  userId: text("user_id"),
  status: pitchStatus("status").notNull().default("intake"),
  input: jsonb("input").notNull(),
  report: jsonb("report"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
