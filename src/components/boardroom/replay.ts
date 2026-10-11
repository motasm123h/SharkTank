import type { DebateTurn, JudgeId, SessionEvent, SpeechKind, Transcript } from "@/domain";
import type { SceneAction } from "./sceneState";

export type TimedAction = { action: SceneAction; delayMs: number };

export type ReplayPacing = { wordMs: number; beatMs: number };
export const REPLAY_PACING: ReplayPacing = { wordMs: 40, beatMs: 450 };

/**
 * Turns a finished transcript back into a timed sequence of scene actions, so
 * the whole show can be replayed in the browser without calling the engine.
 * (Short acknowledgements are not saved, so a replay skips them.)
 */
export function replayTimeline(
  transcript: Transcript,
  pacing: ReplayPacing = REPLAY_PACING,
): TimedAction[] {
  const out: TimedAction[] = [];
  const emit = (event: SessionEvent, delayMs = 0) =>
    out.push({ action: { type: "event", event }, delayMs });

  const speak = (
    judgeId: JudgeId,
    kind: SpeechKind,
    speechId: string,
    text: string,
    debate?: Pick<DebateTurn, "stance" | "replyTo">,
  ) => {
    emit({ type: "judge_state", judgeId, state: "thinking" }, pacing.beatMs);
    emit({ type: "judge_state", judgeId, state: "talking" }, pacing.beatMs);
    emit({ type: "speech_start", speechId, judgeId, kind, ...debate });
    for (const word of text.match(/\S+\s*/g) ?? []) {
      emit({ type: "speech_delta", speechId, delta: word }, pacing.wordMs);
    }
    emit({ type: "speech_end", speechId });
    if (kind !== "verdict") emit({ type: "judge_state", judgeId, state: "idle" });
  };

  emit({ type: "phase", phase: "entrance" });
  emit({ type: "phase", phase: "qa" }, pacing.beatMs * 4);

  transcript.questions.forEach((question, i) => {
    speak(question.judgeId, "question", question.id, question.text);
    emit({ type: "question", question });
    const answer = transcript.answers[i];
    if (answer) {
      out.push({
        action: { type: "answer_sent", questionId: answer.questionId, text: answer.text },
        delayMs: pacing.beatMs * 2,
      });
    }
  });

  if (transcript.debate.length > 0) {
    emit({ type: "phase", phase: "debate" }, pacing.beatMs * 2);
    for (const turn of transcript.debate) {
      speak(turn.judgeId, "debate", turn.id, turn.text, {
        stance: turn.stance,
        replyTo: turn.replyTo,
      });
      emit({ type: "debate_turn", turn });
      if (turn.replyTo) {
        const state = turn.stance === "disagrees" ? "skeptical" : "happy";
        emit({ type: "judge_state", judgeId: turn.replyTo.judgeId, state });
        emit({ type: "judge_state", judgeId: turn.replyTo.judgeId, state: "idle" }, pacing.beatMs);
      }
    }
  }

  if (transcript.verdicts.length > 0) {
    emit({ type: "phase", phase: "verdict" }, pacing.beatMs * 2);
    for (const verdict of transcript.verdicts) {
      speak(verdict.judgeId, "verdict", `verdict-${verdict.judgeId}`, verdict.reason);
      emit({ type: "verdict", verdict });
      emit({ type: "judge_state", judgeId: verdict.judgeId, state: verdict.decision });
    }
  }

  if (transcript.report) {
    emit({ type: "score", overallScore: transcript.report.overallScore }, pacing.beatMs * 2);
    emit({ type: "phase", phase: "report" }, pacing.beatMs * 4);
    emit({ type: "report", report: transcript.report });
    emit({ type: "phase", phase: "done" });
  }

  return out;
}
