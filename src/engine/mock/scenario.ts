import type {
  CountryCode,
  DebateTurn,
  JudgeId,
  JudgeState,
  PitchInput,
  Question,
  Report,
  Verdict,
} from "@/domain";
import type { L, Localizable } from "./localize";

export type MockQuestion = Localizable<Question> & {
  /** Short reply from the asking judge after the user answers. */
  ack: L;
  /** How the other judges react to the user's answer. */
  reactions: Partial<Record<JudgeId, JudgeState>>;
};

/** A pre-written, bilingual session. */
export type MockScenario = {
  id: string;
  /** Countries this scenario is picked for when no scenario is pinned. */
  countries: CountryCode[];
  /** Sample intake used by the demo picker. */
  input: Localizable<Omit<PitchInput, "language">>;
  questions: MockQuestion[];
  debate: Localizable<DebateTurn>[];
  verdicts: Localizable<Verdict>[];
  report: Localizable<Report>;
};
