import {
  JUDGE_IDS,
  type JudgeId,
  type JudgeState,
  type SessionEvent,
  type SessionPhase,
  type SpeechKind,
  type Transcript,
} from "@/domain";

export type UserPresence = "outside" | "entering" | "standing";

export type Speech = {
  id: string;
  judgeId: JudgeId;
  kind: SpeechKind;
  text: string;
  done: boolean;
};

export type HistoryItem =
  | { type: "question"; id: string; judgeId: JudgeId; text: string }
  | { type: "ack"; id: string; judgeId: JudgeId; text: string }
  | { type: "answer"; id: string; text: string };

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
  history: HistoryItem[];
  /** Last finished line, for the screen-reader live region. */
  announcement: { judgeId: JudgeId; text: string } | null;
  error: SceneError | null;
};

export type SceneAction =
  | { type: "event"; event: SessionEvent }
  | { type: "answer_sent"; questionId: string; text: string }
  | { type: "turn_started" }
  | { type: "connection_failed" };

const idleJudges = () =>
  Object.fromEntries(JUDGE_IDS.map((id) => [id, "idle"])) as Record<JudgeId, JudgeState>;

/** Rebuilds the scene from a saved transcript, so a reload resumes where the user left off. */
export function sceneFromTranscript(transcript: Transcript): SceneState {
  const history: HistoryItem[] = [];
  transcript.questions.forEach((q, i) => {
    history.push({ type: "question", id: q.id, judgeId: q.judgeId, text: q.text });
    const answer = transcript.answers[i];
    if (answer) history.push({ type: "answer", id: `answer-${q.id}`, text: answer.text });
  });

  const pending = transcript.questions[transcript.answers.length];
  const started = transcript.questions.length > 0;
  const pastQa = transcript.debate.length > 0 || transcript.verdicts.length > 0;

  return {
    phase: pastQa ? (transcript.report ? "done" : "debate") : started ? "qa" : "loading",
    user: started ? "standing" : "outside",
    judges: idleJudges(),
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
    history,
    announcement: null,
    error: null,
  };
}

/** True when the panel should speak next (nothing is waiting on the user). */
export function needsTurn(state: SceneState): boolean {
  return state.awaiting === null && (state.phase === "loading" || state.phase === "qa");
}

export function sceneReducer(state: SceneState, action: SceneAction): SceneState {
  switch (action.type) {
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

    case "error": {
      // Our answer never reached the server: reopen the question instead of failing.
      if (event.code === "awaiting_answer") {
        const lastQuestion = state.history.findLast((h) => h.type === "question");
        const history =
          state.history.at(-1)?.type === "answer" ? state.history.slice(0, -1) : state.history;
        return { ...state, awaiting: lastQuestion?.id ?? null, history, userBubble: null };
      }
      return { ...state, error: "panel" };
    }

    // Debate, verdicts and the report are handled by later phases of the scene.
    case "debate_turn":
    case "verdict":
    case "score":
    case "report":
      return state;
  }
}
