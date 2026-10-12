import { createHash } from "node:crypto";
import { generateText, Output, type LanguageModel } from "ai";
import type { z } from "zod";
import type {
  DebateTurn,
  JudgeId,
  JudgeState,
  Report,
  SessionEvent,
  Source,
  SpeechKind,
  Transcript,
  Verdict,
} from "@/domain";
import type { EngineContext, RunOptions, SessionEngine } from "../types";
import type { AiTask, LiveAiConfig, ModelRef } from "./config";
import { classifyAiError, UnusableOutputError } from "./classify";
import {
  AckDraftSchema,
  buildDebate,
  buildQuestionText,
  buildReport,
  buildVerdicts,
  clip,
  DeliberationDraftSchema,
  NextQuestionDraftSchema,
  OpeningQuestionDraftSchema,
  ReportDraftSchema,
  VerdictsDraftSchema,
} from "./drafts";
import { ModelFactory, providerOptionsFor } from "./models";
import {
  countryName,
  debateBlock,
  judgesBlock,
  PERSONAS,
  pitchBlock,
  qaBlock,
  QUESTION_ORDER,
  systemPrompt,
  verdictsBlock,
} from "./prompts";
import { AllModelsFailedError, ModelRouter } from "./router";
import { recordAttempt } from "./usage";

type Pacing = { wordMs: number; beatMs: number };
const PACING: Pacing = { wordMs: 35, beatMs: 500 };
const FAST: Pacing = { wordMs: 0, beatMs: 0 };

const TIMEOUT_MS: Record<AiTask, number> = { chat: 45_000, report: 150_000 };

type Deliberation = { debate: DebateTurn[]; verdicts: Verdict[] };
type Plans = { deliberation?: Promise<Deliberation>; report?: Promise<Report>; at: number };

/**
 * Work started in the background (the debate, the report) outlives a single
 * run, so skipping ahead or reconnecting reuses it instead of paying twice.
 */
const plans = new Map<string, Plans>();
const PLAN_TTL_MS = 30 * 60_000;

function plansFor(key: string): Plans {
  const now = Date.now();
  for (const [k, p] of plans) if (now - p.at > PLAN_TTL_MS) plans.delete(k);
  let p = plans.get(key);
  if (!p) plans.set(key, (p = { at: now }));
  return p;
}

/** Real AI panel. Models are called through a router with fallbacks. */
export class AiEngine implements SessionEngine {
  readonly name = "ai";
  private readonly models: ModelFactory;
  private readonly router: ModelRouter;

  constructor(private readonly config: LiveAiConfig) {
    this.models = new ModelFactory(config.keys);
    this.router = new ModelRouter({ classify: classifyAiError, onAttempt: recordAttempt });
  }

  async *run(context: EngineContext, options: RunOptions = {}): AsyncGenerator<SessionEvent> {
    try {
      yield* this.play(context, options);
    } catch (error) {
      if (!(error instanceof AllModelsFailedError)) throw error;
      console.warn(`[ai] ${error.message}`);
      yield {
        type: "error",
        code: "provider_busy",
        message: `Every model is busy; try again in ${Math.ceil(error.retryAfterMs / 1000)} s`,
        retryable: true,
      };
    }
  }

  private async *play(context: EngineContext, options: RunOptions): AsyncGenerator<SessionEvent> {
    const { input, transcript: t } = context;
    const pacing = options.fast ? FAST : PACING;
    const signal = options.signal;
    const wait = (ms: number) => sleep(ms, signal);
    const key = createHash("sha1")
      .update(JSON.stringify({ input, questions: t.questions, answers: t.answers }))
      .digest("hex");

    if (t.answers.length < t.questions.length) {
      yield {
        type: "error",
        code: "awaiting_answer",
        message: "The last question has not been answered yet",
        retryable: false,
      };
      return;
    }
    if (t.report) {
      yield { type: "phase", phase: "done" };
      return;
    }

    const speak = (
      judgeId: JudgeId,
      kind: SpeechKind,
      text: string,
      speechId: string,
      debate?: Pick<DebateTurn, "stance" | "replyTo">,
    ) => this.speak(pacing, wait, { judgeId, kind, text, speechId, ...debate });

    const debateStarted = t.debate.length > 0 || t.verdicts.length > 0;

    // ---- Q&A: each judge asks one question, in seat order ----
    if (!debateStarted) {
      const nextAsker = QUESTION_ORDER[t.questions.length];
      const previous = t.questions.at(-1);

      if (!previous) {
        yield { type: "phase", phase: "entrance" };
        const opening = this.openingQuestion(context, nextAsker!, signal);
        opening.catch(() => undefined);
        await wait(pacing.beatMs * 4);
        yield { type: "phase", phase: "qa" };
        yield { type: "judge_state", judgeId: nextAsker!, state: "thinking" };
        yield* this.ask(nextAsker!, `q${t.questions.length + 1}`, await opening, speak);
        return;
      }

      // The judge who asked reacts to the answer, then the next judge asks.
      // After the last answer the debate is written in parallel with the reaction.
      if (!nextAsker) this.startDeliberation(plansFor(key), context);
      yield { type: "judge_state", judgeId: previous.judgeId, state: "thinking" };
      const next = await this.reactAndAsk(context, previous.judgeId, nextAsker, signal);
      yield* speak(previous.judgeId, "ack", next.ack, `ack-${t.questions.length - 1}`);
      yield { type: "judge_state", judgeId: previous.judgeId, state: next.reaction };
      await wait(pacing.beatMs);
      yield { type: "judge_state", judgeId: previous.judgeId, state: "idle" };
      if (nextAsker && next.question) {
        yield* this.ask(nextAsker, `q${t.questions.length + 1}`, next.question, speak);
        return;
      }
    }

    // ---- Debate (continues after the turns already in the transcript) ----
    const p = plansFor(key);
    if (t.debate.length === 0) this.startDeliberation(p, context);
    if (p.deliberation) {
      yield { type: "phase", phase: "debate" };
      for (const id of QUESTION_ORDER)
        yield { type: "judge_state", judgeId: id, state: "thinking" };
    }
    const deliberation = p.deliberation ? await p.deliberation : undefined;
    this.startReport(p, context, deliberation);
    if (deliberation) {
      for (const id of QUESTION_ORDER) yield { type: "judge_state", judgeId: id, state: "idle" };
      for (const turn of deliberation.debate.slice(t.debate.length)) {
        yield* speak(turn.judgeId, "debate", turn.text, turn.id, {
          stance: turn.stance,
          replyTo: turn.replyTo,
        });
        yield { type: "debate_turn", turn };
        if (turn.replyTo) {
          const reaction = turn.stance === "disagrees" ? "skeptical" : "happy";
          yield { type: "judge_state", judgeId: turn.replyTo.judgeId, state: reaction };
          await wait(pacing.beatMs / 2);
          yield { type: "judge_state", judgeId: turn.replyTo.judgeId, state: "idle" };
        }
      }
    }

    // ---- Verdicts (skipping judges who already gave one) ----
    yield { type: "phase", phase: "verdict" };
    const verdicts = deliberation?.verdicts ?? (await this.verdictsOnly(context));
    const given = new Set(t.verdicts.map((v) => v.judgeId));
    for (const verdict of verdicts) {
      if (given.has(verdict.judgeId)) continue;
      yield* speak(verdict.judgeId, "verdict", verdict.reason, `verdict-${verdict.judgeId}`);
      yield { type: "verdict", verdict };
      yield { type: "judge_state", judgeId: verdict.judgeId, state: verdict.decision };
      await wait(pacing.beatMs);
    }

    // ---- Score and report ----
    this.startReport(p, context, { debate: deliberation?.debate ?? t.debate, verdicts });
    const report = await p.report!;
    yield { type: "score", overallScore: report.overallScore };
    await wait(pacing.beatMs * 3);
    yield { type: "phase", phase: "report" };
    yield { type: "report", report };
    yield { type: "phase", phase: "done" };
  }

  // ---------- model calls ----------

  /** One structured call through the router, with a per-attempt timeout. */
  private async call<S extends z.ZodType>(
    task: AiTask,
    label: string,
    schema: S,
    prompt: string,
    context: EngineContext,
    signal?: AbortSignal,
  ): Promise<z.infer<S>> {
    const { value } = await this.router.run(
      label,
      this.config.chains[task],
      async (ref: ModelRef) => {
        const timeout = AbortSignal.timeout(TIMEOUT_MS[task]);
        const result = await generateText({
          model: this.models.model(ref) as LanguageModel,
          system: systemPrompt(context.input),
          prompt,
          output: Output.object({ schema }),
          temperature: task === "chat" ? 0.9 : 0.5,
          maxRetries: 0,
          abortSignal: signal ? AbortSignal.any([signal, timeout]) : timeout,
          providerOptions: providerOptionsFor(ref, task),
        });
        if (!result.output) throw new UnusableOutputError("no structured output");
        return result.output as z.infer<S>;
      },
      signal,
    );
    return value;
  }

  private async openingQuestion(
    context: EngineContext,
    judgeId: JudgeId,
    signal?: AbortSignal,
  ): Promise<string> {
    const draft = await this.call(
      "chat",
      "question",
      OpeningQuestionDraftSchema,
      [
        pitchBlock(context.input),
        judgesBlock(),
        `You are ${PERSONAS[judgeId].role}. The founder has just pitched. Ask your first, sharpest question from your focus area. It must be answerable in a few sentences.`,
      ].join("\n\n"),
      context,
      signal,
    );
    return buildQuestionText(draft.question);
  }

  private async reactAndAsk(
    context: EngineContext,
    asker: JudgeId,
    nextAsker: JudgeId | undefined,
    signal?: AbortSignal,
  ): Promise<{ ack: string; reaction: JudgeState; question?: string }> {
    const blocks = [pitchBlock(context.input), judgesBlock(), qaBlock(context.transcript)];
    if (!nextAsker) {
      const draft = await this.call(
        "chat",
        "ack",
        AckDraftSchema,
        [
          ...blocks,
          `${PERSONAS[asker].role} reacts to the founder's last answer in one honest sentence (no question). Choose the reaction that fits the answer.`,
        ].join("\n\n"),
        context,
        signal,
      );
      return { ack: clip(draft.ack, 300) || "…", reaction: draft.reaction };
    }
    const draft = await this.call(
      "chat",
      "question",
      NextQuestionDraftSchema,
      [
        ...blocks,
        `First, ${PERSONAS[asker].role} reacts to the founder's last answer in one honest sentence (no question).`,
        `Then ${PERSONAS[nextAsker].role} asks one new question from their own focus area. Do not repeat earlier questions; build on what the founder said when useful.`,
      ].join("\n\n"),
      context,
      signal,
    );
    return {
      ack: clip(draft.ack, 300) || "…",
      reaction: draft.reaction,
      question: buildQuestionText(draft.question),
    };
  }

  private async deliberate(context: EngineContext): Promise<Deliberation> {
    const draft = await this.call(
      "chat",
      "debate",
      DeliberationDraftSchema,
      [
        pitchBlock(context.input),
        judgesBlock(),
        qaBlock(context.transcript),
        "Now the judges debate the idea among themselves, then each gives a verdict.",
        "Debate: 6 to 8 short turns. Every judge speaks at least once. Real disagreement where the answers were weak, agreement where they were strong. Each reply says who it answers through replyTo (index of an earlier turn, never the speaker's own turn).",
        "Verdicts: one per judge, 'in' or 'out', consistent with what that judge said. A short, specific reason.",
      ].join("\n\n"),
      context,
    );
    return { debate: buildDebate(draft.debate), verdicts: buildVerdicts(draft.verdicts) };
  }

  private async verdictsOnly(context: EngineContext): Promise<Verdict[]> {
    const draft = await this.call(
      "chat",
      "verdicts",
      VerdictsDraftSchema,
      [
        pitchBlock(context.input),
        judgesBlock(),
        qaBlock(context.transcript),
        debateBlock(context.transcript),
        "Each judge now gives a verdict: 'in' or 'out' with a short, specific reason, consistent with the debate.",
      ].join("\n\n"),
      context,
    );
    return buildVerdicts(draft.verdicts);
  }

  private startDeliberation(p: Plans, context: EngineContext) {
    if (p.deliberation) return;
    p.deliberation = this.deliberate(context).catch((error: unknown) => {
      p.deliberation = undefined;
      throw error;
    });
    p.deliberation.catch(() => undefined);
  }

  /** Starts the report as soon as the verdicts are known; it is written while the verdicts play. */
  private startReport(p: Plans, context: EngineContext, deliberation?: Deliberation) {
    if (p.report || !deliberation) return;
    p.report = this.writeReport(context, deliberation).catch((error: unknown) => {
      p.report = undefined;
      throw error;
    });
    p.report.catch(() => undefined);
  }

  private async writeReport(context: EngineContext, deliberation: Deliberation): Promise<Report> {
    const { input } = context;
    const transcript: Transcript = { ...context.transcript, ...deliberation };
    const sources: Source[] = [];
    const research = this.config.search ? await this.research(context, sources) : "";

    const draft = await this.call(
      "report",
      "report",
      ReportDraftSchema,
      [
        pitchBlock(input),
        qaBlock(transcript),
        debateBlock(transcript),
        verdictsBlock(transcript),
        research
          ? `RESEARCH NOTES\n${research}\n\nSOURCES\n${sources.map((s, i) => `${i}. ${s.title} ${s.url ?? ""}`).join("\n")}`
          : "SOURCES: none. Every number is your estimate (sourceIndex -1). For similar ideas, only name companies you are confident exist.",
        [
          "Write the founder's report.",
          `All money is in ${input.budget.currency}, realistic for ${input.city}, ${countryName(input.country)} and a budget of ${input.budget.min}–${input.budget.max} ${input.budget.currency}.`,
          "Scores must agree with the verdicts and the debate. Be honest: a weak idea gets a low score and a clear 'what must change'.",
          "Sales scenarios: 12 months each; pessimistic below realistic below optimistic.",
          "Marketing: 2 to 5 channels that really reach these customers here; budgets that fit the stated budget.",
          "Local context: real payment methods, platforms and practical realities in this country.",
          "Global fit: other countries (not the founder's own) and why.",
          "Next steps: exactly 3, concrete, doable this month.",
        ].join("\n"),
      ].join("\n\n"),
      context,
    );
    return buildReport(draft, input, sources);
  }

  /** Optional web research (Gemini + Google Search). Fills `sources` with what was actually found. */
  private async research(context: EngineContext, sources: Source[]): Promise<string> {
    const { input } = context;
    const chain = this.config.chains.report.filter((ref) => ref.provider === "google");
    try {
      const { value } = await this.router.run("research", chain, async (ref) => {
        const result = await generateText({
          model: this.models.model(ref) as LanguageModel,
          tools: { google_search: this.models.googleSearchTool() },
          prompt: `Find existing companies or apps similar to this idea, especially in ${countryName(input.country)}, and any recent market facts with numbers that matter for it. Idea: ${input.idea}. List each with one line.`,
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(TIMEOUT_MS.report),
        });
        return result;
      });
      for (const s of value.sources) {
        if (s.sourceType === "url" && sources.length < 12) {
          sources.push({ title: s.title?.trim() || new URL(s.url).hostname, url: s.url });
        }
      }
      return value.text;
    } catch (error) {
      // The report is still useful without research; it just has no sourced facts.
      console.warn("[ai] research skipped:", (error as Error).message);
      return "";
    }
  }

  // ---------- presentation ----------

  private async *ask(
    judgeId: JudgeId,
    id: string,
    text: string,
    speak: (
      judgeId: JudgeId,
      kind: SpeechKind,
      text: string,
      speechId: string,
    ) => AsyncGenerator<SessionEvent>,
  ): AsyncGenerator<SessionEvent> {
    yield* speak(judgeId, "question", text, id);
    yield { type: "question", question: { id, judgeId, text } };
    yield { type: "await_answer", questionId: id };
  }

  private async *speak(
    pacing: Pacing,
    wait: (ms: number) => Promise<void>,
    speech: {
      judgeId: JudgeId;
      kind: SpeechKind;
      text: string;
      speechId: string;
    } & Partial<Pick<DebateTurn, "stance" | "replyTo">>,
  ): AsyncGenerator<SessionEvent> {
    const { judgeId, kind, text, speechId, stance, replyTo } = speech;
    yield { type: "judge_state", judgeId, state: "talking" };
    yield { type: "speech_start", speechId, judgeId, kind, stance, replyTo };
    for (const word of text.match(/\S+\s*/g) ?? []) {
      await wait(pacing.wordMs);
      yield { type: "speech_delta", speechId, delta: word };
    }
    yield { type: "speech_end", speechId };
    if (kind !== "verdict") yield { type: "judge_state", judgeId, state: "idle" };
    await wait(pacing.beatMs / 2);
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(signal.reason);
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}
