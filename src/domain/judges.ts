import { z } from "zod";

export const JUDGE_IDS = ["investor", "local", "marketing", "finance", "skeptic"] as const;
export const JudgeIdSchema = z.enum(JUDGE_IDS);
export type JudgeId = z.infer<typeof JudgeIdSchema>;

/** Visual/emotional state of an avatar. Shared by SVG avatars now and Rive later. */
export const JudgeStateSchema = z.enum([
  "idle",
  "talking",
  "thinking",
  "happy",
  "skeptical",
  "in",
  "out",
]);
export type JudgeState = z.infer<typeof JudgeStateSchema>;

/** Static judge metadata. Display names and focus text live in messages/ (Judges.<id>). */
export const JudgeSchema = z.object({
  id: JudgeIdSchema,
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  seat: z.number().int().min(0).max(4),
});
export type Judge = z.infer<typeof JudgeSchema>;

export const JUDGES: readonly Judge[] = [
  { id: "investor", color: "#f5b642", seat: 0 },
  { id: "local", color: "#3ecf8e", seat: 1 },
  { id: "marketing", color: "#e85d9e", seat: 2 },
  { id: "finance", color: "#4f8ff7", seat: 3 },
  { id: "skeptic", color: "#9b6bff", seat: 4 },
];
