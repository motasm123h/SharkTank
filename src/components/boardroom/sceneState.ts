import {
  EMPTY_TRANSCRIPT,
  JUDGE_IDS,
  type DebateStance,
  type DebateTurn,
  type Figure,
  type JudgeId,
  type JudgeState,
  type SessionEvent,
  type SessionPhase,
  type SpeechKind,
  type Transcript,
  type Verdict,
} from "@/domain";

export type UserPresence = "outside" | "entering" | "standing";

export type Speech = {
  id: string;
  judgeId: JudgeId;
  kind: SpeechKind;
  text: string;
  done: boolean;
  /** Debate only: how this line relates to an earlier one. */
  stance?: DebateStance;
  replyTo?: DebateTurn["replyTo"];
};

export type HistoryItem =
  | { type: "question"; id: string; judgeId: JudgeId; text: string }
  | { type: "ack"; id: string; judgeId: JudgeId; text: string }
  | { type: "answer"; id: string; text: string }
  | {
      type: "debate";
      id: string;
      judgeId: JudgeId;
      text: string;
      stance: DebateStance;
      replyTo?: DebateTurn["replyTo"];
    }
  | { type: "verdict"; id: string; judgeId: JudgeId; decision: Verdict["decision"]; text: string };

export type SceneError = "connection" | "panel";

export type SceneState = {
  /** "loading" until the first event (or a resumed transcript) arrives. */
  phase: SessionPhase | "loading";
  user: UserPresence;
  judges: Record<JudgeId, JudgeState>;
  speech: Speech | null;
  /** The user's last answer, shown in their bubble until a judge speaks again. */
  userBubble: string | null;
  awaiting: string | null;
  asked: JudgeId[];
  debate: DebateTurn[];
  verdicts: Verdict[];
  score: Figure | null;
  reportReady: boolean;
  history: HistoryItem[];
  /** Last finished line, for the screen-reader live region. */
  announcement: { judgeId: JudgeId; text: string } | null;
  error: SceneError | null;
};

export type SceneAction =
  | { type: "event"; event: SessionEvent }
  | { type: "answer_sent"; questionId: string; text: string }
  | { type: "turn_started" }
  | { type: "connection_failed" }
  /** Replace the whole scene (start of a replay, or jumping to its end). */
  | { type: "reset"; state: SceneState };

const idleJudges = () =>
  Object.fromEntries(JUDGE_IDS.map((id) => [id, "idle"])) as Record<JudgeId, JudgeState>;

const debateItem = (turn: DebateTurn): HistoryItem => ({
  type: "debate",
  id: turn.id,
  judgeId: turn.judgeId,
  text: turn.text,
  stance: turn.stance,
  replyTo: turn.replyTo,
});

const verdictItem = (verdict: Verdict): HistoryItem => ({
  type: "verdict",
  id: `verdict-${verdict.judgeId}`,
  judgeId: verdict.judgeId,
  decision: verdict.decision,
  text: verdict.reason,
});

/** Rebuilds the scene from a saved transcript, so a reload resumes where the user left off. */
export function sceneFromTranscript(transcript: Transcript): SceneState {
  const history: HistoryItem[] = [];
  transcript.questions.forEach((q, i) => {
    history.push({ type: "question", id: q.id, judgeId: q.judgeId, text: q.text });
    const answer = transcript.answers[i];
    if (answer) history.push({ type: "answer", id: `answer-${q.id}`, text: answer.text });
  });
  history.push(...transcript.debate.map(debateItem), ...transcript.verdicts.map(verdictItem));

  const judges = idleJudges();
  for (const v of transcript.verdicts) judges[v.judgeId] = v.decision;

  const pending = transcript.questions[transcript.answers.length];
  const started = transcript.questions.length > 0;
  const phase: SceneState["phase"] = transcript.report
    ? "done"
    : transcript.verdicts.length > 0
      ? "verdict"
      : transcript.debate.length > 0
        ? "debate"
        : started
          ? "qa"
          : "loading";

  return {
    phase,
    user: started ? "standing" : "outside",
    judges,
    speech: pending
      ? {
          id: pending.id,
          judgeId: pending.judgeId,
          kind: "question",
          text: pending.text,
          done: true,
        }
      : null,
    userBubble: null,
    awaiting: pending?.id ?? null,
    asked: transcript.questions.map((q) => q.judgeId),
    debate: transcript.debate,
    verdicts: transcript.verdicts,
    score: transcript.report?.overallScore ?? null,
    reportReady: !!transcript.report,
    history,
    announcement: null,
    error: null,
  };
}

export const EMPTY_SCENE = sceneFromTranscript(EMPTY_TRANSCRIPT);

/** True when the panel should speak next (nothing is waiting on the user). */
export function needsTurn(state: SceneState): boolean {
  return state.awaiting === null && state.phase !== "done";
}

/** The panel is mid-performance (something to skip). */
export function isPerforming(state: SceneState): boolean {
  return state.awaiting === null && state.phase !== "done" && state.error === null;
}

export function sceneReducer(state: SceneState, action: SceneAction): SceneState {
  switch (action.type) {
    case "reset":
      return action.state;

    case "turn_started":
      return { ...state, error: null };

    case "connection_failed":
      return { ...state, error: "connection" };

    case "answer_sent":
      return {
        ...state,
        awaiting: null,
        userBubble: action.text,
        history: [
          ...state.history,
          { type: "answer", id: `answer-${action.questionId}`, text: action.text },
        ],
      };

    case "event":
      return applyEvent(state, action.event);
  }
}

function applyEvent(state: SceneState, event: SessionEvent): SceneState {
  switch (event.type) {
    case "phase":
      return {
        ...state,
        phase: event.phase,
        user: event.phase === "entrance" ? "entering" : "standing",
        // A new part of the show clears the previous speaker's bubble.
        speech: event.phase === "qa" ? state.speech : null,
      };

    case "judge_state":
      return { ...state, judges: { ...state.judges, [event.judgeId]: event.state } };

    case "speech_start":
      return {
        ...state,
        userBubble: null,
        speech: {
          id: event.speechId,
          judgeId: event.judgeId,
          kind: event.kind,
          text: "",
          done: false,
          stance: event.stance,
          replyTo: event.replyTo,
        },
      };

    case "speech_delta":
      if (state.speech?.id !== event.speechId) return state;
      return { ...state, speech: { ...state.speech, text: state.speech.text + event.delta } };

    case "speech_end": {
      const speech = state.speech;
      if (speech?.id !== event.speechId) return state;
      const text = speech.text.trim();
      return {
        ...state,
        speech: { ...speech, text, done: true },
        announcement: { judgeId: speech.judgeId, text },
        history:
          speech.kind === "ack"
            ? [...state.history, { type: "ack", id: speech.id, judgeId: speech.judgeId, text }]
            : state.history,
      };
    }

    case "question":
      return {
        ...state,
        asked: [...state.asked, event.question.judgeId],
        history: [
          ...state.history,
          {
            type: "question",
            id: event.question.id,
            judgeId: event.question.judgeId,
            text: event.question.text,
          },
        ],
      };

    case "await_answer":
      return { ...state, awaiting: event.questionId };

    case "debate_turn":
      return {
        ...state,
        debate: [...state.debate, event.turn],
        history: [...state.history, debateItem(event.turn)],
      };

    case "verdict":
      return {
        ...state,
        verdicts: [...state.verdicts, event.verdict],
        history: [...state.history, verdictItem(event.verdict)],
      };

    case "score":
      return { ...state, score: event.overallScore, speech: null };

    case "report":
      return { ...state, reportReady: true };

    case "error": {
      // Our answer never reached the server: reopen the question instead of failing.
      if (event.code === "awaiting_answer") {
        const lastQuestion = state.history.findLast((h) => h.type === "question");
        const history =
          state.history.at(-1)?.type === "answer" ? state.history.slice(0, -1) : state.history;
        return {
          ...state,
          awaiting: lastQuestion?.id ?? null,
          history,
          userBubble: null,
          speech:
            lastQuestion?.type === "question"
              ? {
                  id: lastQuestion.id,
                  judgeId: lastQuestion.judgeId,
                  kind: "question",
                  text: lastQuestion.text,
                  done: true,
                }
              : state.speech,
        };
      }
      return { ...state, error: "panel" };
    }
  }
}
