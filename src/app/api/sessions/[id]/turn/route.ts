import { z } from "zod";
import { AnswerSchema, SessionEventSchema, type SessionEvent } from "@/domain";
import { getEngine } from "@/engine";
import { readAnonId } from "@/lib/anon";
import { loadOwnSession, saveProgress, statusForPhase } from "@/server/sessions";

export const dynamic = "force-dynamic";

const TurnRequestSchema = z.object({ answer: AnswerSchema.optional() });

type Params = { params: Promise<{ id: string }> };

/**
 * Advances a session by one turn. Optionally records the user's answer, then
 * streams the panel's events as NDJSON (one SessionEvent per line) until the
 * engine asks the next question or the session ends. Progress is saved as it
 * completes, including when the client disconnects.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await loadOwnSession(id, await readAnonId());
  if (!session) return Response.json({ error: "not_found" }, { status: 404 });

  const body = TurnRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return Response.json({ error: "invalid" }, { status: 400 });

  const transcript = structuredClone(session.transcript);
  let status = session.status;
  const { answer } = body.data;

  if (answer) {
    const pending = transcript.questions[transcript.answers.length];
    if (!pending || pending.id !== answer.questionId) {
      return Response.json({ error: "not_awaiting_this_answer" }, { status: 409 });
    }
    transcript.answers.push(answer);
    await saveProgress(id, transcript, status);
  }

  const engine = getEngine();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: SessionEvent) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        const events = engine.run(
          { input: session.input, transcript, scenarioId: session.scenarioId ?? undefined },
          { signal: request.signal },
        );
        for await (const raw of events) {
          const event = SessionEventSchema.parse(raw);
          if (event.type === "question") transcript.questions.push(event.question);
          if (event.type === "debate_turn") transcript.debate.push(event.turn);
          if (event.type === "verdict") transcript.verdicts.push(event.verdict);
          if (event.type === "report") transcript.report = event.report;
          if (event.type === "phase") status = statusForPhase(event.phase);
          send(event);
        }
      } catch (error) {
        if (!request.signal.aborted) {
          console.error("session turn failed", error);
          send({
            type: "error",
            code: "provider_error",
            message: "The panel could not continue",
            retryable: true,
          });
        }
      } finally {
        await saveProgress(id, transcript, status).catch((error) =>
          console.error("saving session progress failed", error),
        );
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
