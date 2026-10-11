import { z } from "zod";
import { AnswerSchema, SessionEventSchema, type SessionEvent } from "@/domain";
import { getEngine } from "@/engine";
import { readAnonId } from "@/lib/anon";
import { takeOverRun } from "@/server/runs";
import { loadOwnSession, saveProgress, statusForPhase } from "@/server/sessions";

export const dynamic = "force-dynamic";

const TurnRequestSchema = z.object({
  answer: AnswerSchema.optional(),
  /** Skip ahead: deliver the rest of this turn without presentation delays. */
  fast: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

/**
 * Advances a session by one turn. Optionally records the user's answer, then
 * streams the panel's events as NDJSON (one SessionEvent per line) until the
 * engine asks the next question or the session ends.
 *
 * Each finished item (question, debate turn, verdict, report) is saved before
 * it is sent, so whatever the viewer has seen survives a reload or a skip.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const anonId = await readAnonId();

  const body = TurnRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return Response.json({ error: "invalid" }, { status: 400 });

  // Ownership is checked before touching any run; the run lock is then taken
  // before loading, so we read what the previous run saved.
  if (!(await loadOwnSession(id, anonId))) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  const run = await takeOverRun(id);
  const session = await loadOwnSession(id, anonId);
  if (!session) {
    run.finish();
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const transcript = structuredClone(session.transcript);
  let status = session.status;
  const { answer, fast } = body.data;

  if (answer) {
    const pending = transcript.questions[transcript.answers.length];
    if (!pending || pending.id !== answer.questionId) {
      run.finish();
      return Response.json({ error: "not_awaiting_this_answer" }, { status: 409 });
    }
    transcript.answers.push(answer);
    await saveProgress(id, transcript, status);
  }

  const engine = getEngine();
  const encoder = new TextEncoder();
  const signal = AbortSignal.any([request.signal, run.signal]);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: SessionEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        const events = engine.run(
          { input: session.input, transcript, scenarioId: session.scenarioId ?? undefined },
          { signal, fast },
        );
        for await (const raw of events) {
          const event = SessionEventSchema.parse(raw);
          let changed = true;
          if (event.type === "question") transcript.questions.push(event.question);
          else if (event.type === "debate_turn") transcript.debate.push(event.turn);
          else if (event.type === "verdict") transcript.verdicts.push(event.verdict);
          else if (event.type === "report") transcript.report = event.report;
          else if (event.type === "phase") status = statusForPhase(event.phase);
          else changed = false;
          if (changed) await saveProgress(id, transcript, status);
          send(event);
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error("session turn failed", error);
          try {
            send({
              type: "error",
              code: "provider_error",
              message: "The panel could not continue",
              retryable: true,
            });
          } catch {
            // Client already gone.
          }
        }
      } finally {
        await saveProgress(id, transcript, status).catch((error) =>
          console.error("saving session progress failed", error),
        );
        run.finish();
        try {
          controller.close();
        } catch {
          // Already closed because the client went away.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
