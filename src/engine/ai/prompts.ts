import { JUDGE_IDS, type JudgeId, type PitchInput, type Transcript } from "@/domain";

/** Who each judge is. Their display names live in messages/; here they are roles. */
export const PERSONAS: Record<JudgeId, { role: string; focus: string }> = {
  investor: {
    role: "The Investor",
    focus:
      "big picture: market size, growth, what makes the business defensible, whether it can return money",
  },
  local: {
    role: "The Local Market Expert",
    focus:
      "life in this exact city and country: habits, culture, payment methods, platforms people use, rules and practical obstacles",
  },
  marketing: {
    role: "The Marketing Strategist",
    focus:
      "who the first customers are, positioning, which channels reach them and what that costs",
  },
  finance: {
    role: "The Financial Analyst",
    focus:
      "pricing, unit economics, costs, cash needed versus the stated budget, time to break even",
  },
  skeptic: {
    role: "The Skeptic",
    focus: "what can go wrong: competitors, weak assumptions, reasons it fails; blunt but fair",
  },
};

/** The order judges ask their questions in. */
export const QUESTION_ORDER: readonly JudgeId[] = JUDGE_IDS;

const BUSINESS_MODE = {
  online: "online",
  physical: "a physical place",
  hybrid: "both online and physical",
} as const;
const STAGE = {
  idea: "just an idea",
  prototype: "has a prototype",
  selling: "already selling",
} as const;

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function languageRule(input: PitchInput): string {
  return input.language === "ar"
    ? "Write every user-facing sentence in clear, natural Modern Standard Arabic (simple, not academic). Use Western digits (0-9) for numbers. Keep brand and product names as they are."
    : "Write every user-facing sentence in clear, plain English.";
}

/** Shared rules for every call: the show's tone and the honesty rule. */
export function systemPrompt(input: PitchInput): string {
  return [
    "You run 'The Panel': five expert judges who hear a founder's pitch, ask questions, debate and give a verdict, like a TV investor show but honest and useful.",
    "Be specific to this idea, this city and this budget. No generic startup advice, no flattery, no filler.",
    "Never invent facts, statistics, company figures or sources. When you give a number, it is your estimate; say so in wording when it matters.",
    "Keep spoken lines short and natural, as if said out loud at the table.",
    languageRule(input),
  ].join("\n");
}

export function pitchBlock(input: PitchInput): string {
  const { budget } = input;
  return [
    "THE PITCH",
    `Idea: ${input.idea}`,
    `Location: ${input.city}, ${countryName(input.country)} (${input.country})`,
    `Budget: ${budget.min}–${budget.max} ${budget.currency}`,
    `Business type: ${BUSINESS_MODE[input.mode]}`,
    `Stage: ${STAGE[input.stage]}`,
  ].join("\n");
}

export function judgesBlock(): string {
  return [
    "THE JUDGES (use these ids)",
    ...JUDGE_IDS.map((id) => `- ${id}: ${PERSONAS[id].role}. Focus: ${PERSONAS[id].focus}.`),
  ].join("\n");
}

export function qaBlock(t: Transcript): string {
  if (t.questions.length === 0) return "QUESTIONS SO FAR: none yet.";
  return [
    "QUESTIONS AND ANSWERS SO FAR",
    ...t.questions.map((q, i) => {
      const answer = t.answers[i]?.text ?? "(not answered yet)";
      return `${i + 1}. ${PERSONAS[q.judgeId].role} asked: ${q.text}\n   Founder answered: ${answer}`;
    }),
  ].join("\n");
}

export function debateBlock(t: Transcript): string {
  if (t.debate.length === 0) return "";
  return [
    "THE DEBATE",
    ...t.debate.map((d) => `- ${PERSONAS[d.judgeId].role} (${d.stance}): ${d.text}`),
  ].join("\n");
}

export function verdictsBlock(t: Transcript): string {
  if (t.verdicts.length === 0) return "";
  return [
    "VERDICTS",
    ...t.verdicts.map(
      (v) =>
        `- ${PERSONAS[v.judgeId].role}: ${v.decision === "in" ? "I'm in" : "I'm out"} (${v.reason})`,
    ),
  ].join("\n");
}
