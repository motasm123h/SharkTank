import type { DebateStance } from "@/domain";

/** Visual language for debate stances, shared by bubble, seat marker and log. */
export const STANCE_STYLE: Record<
  DebateStance,
  { text: string; bg: string; ring: string; icon: string }
> = {
  opens: { text: "text-ink-muted", bg: "bg-surface-2", ring: "var(--ink-muted)", icon: "•" },
  agrees: { text: "text-ok", bg: "bg-ok/15", ring: "var(--ok)", icon: "✓" },
  disagrees: { text: "text-danger", bg: "bg-danger/15", ring: "var(--danger)", icon: "✕" },
  builds_on: { text: "text-focus", bg: "bg-focus/15", ring: "var(--focus)", icon: "+" },
};
