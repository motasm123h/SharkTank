"use server";

import { z } from "zod";
import { getDb } from "@/db";
import { pitchSessions } from "@/db/schema";
import { PitchInputSchema } from "@/domain";
import { MOCK_SCENARIOS } from "@/engine/mock/scenarios";
import { redirect } from "@/i18n/navigation";
import { ensureAnonId } from "@/lib/anon";
import { aiEnv } from "@/lib/env";

const CreatePitchSchema = z.object({
  input: PitchInputSchema,
  scenarioId: z
    .string()
    .refine((id) => MOCK_SCENARIOS.some((s) => s.id === id))
    .optional(),
});

export type CreatePitchResult = { ok: false; error: "invalid" | "server" };

/** Validates the intake again on the server, saves the session and opens it. */
export async function createPitch(payload: unknown): Promise<CreatePitchResult> {
  const parsed = CreatePitchSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const { input } = parsed.data;
  const scenarioId = aiEnv().AI_PROVIDER === "mock" ? parsed.data.scenarioId : undefined;

  let id: string;
  try {
    const anonId = await ensureAnonId();
    const [row] = await getDb()
      .insert(pitchSessions)
      .values({ anonId, input, scenarioId })
      .returning({ id: pitchSessions.id });
    if (!row) return { ok: false, error: "server" };
    id = row.id;
  } catch (error) {
    console.error("createPitch failed", error);
    return { ok: false, error: "server" };
  }

  // Outside try/catch: redirect works by throwing.
  return redirect({ href: `/pitch/${id}`, locale: input.language });
}
