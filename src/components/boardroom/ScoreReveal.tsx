"use client";

import { animate, m, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import type { Figure, Verdict } from "@/domain";

type Props = { score: Figure; verdicts: Verdict[] };

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreColor(value: number): string {
  if (value < 40) return "var(--danger)";
  if (value < 65) return "var(--accent)";
  return "var(--ok)";
}

/** Counts the overall score up and fills the ring; numbers update outside React renders. */
export function ScoreReveal({ score, verdicts }: Props) {
  const t = useTranslations("Boardroom");
  const reduced = useReducedMotion();
  const progress = useMotionValue(0);
  const label = useTransform(progress, (v) => Math.round(v).toString());
  const dashOffset = useTransform(progress, (v) => CIRCUMFERENCE * (1 - v / 100));

  useEffect(() => {
    if (reduced) {
      progress.set(score.value);
      return;
    }
    const controls = animate(progress, score.value, { duration: 1.8, ease: [0.2, 0.7, 0.2, 1] });
    return () => controls.stop();
  }, [progress, reduced, score.value]);

  const ins = verdicts.filter((v) => v.decision === "in").length;
  const outs = verdicts.length - ins;
  const color = scoreColor(score.value);

  return (
    <section
      aria-labelledby="score-title"
      className="bg-surface border-border flex flex-col items-center gap-3 rounded-3xl border p-6 sm:flex-row sm:gap-8"
    >
      <div className="relative size-36 shrink-0">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle
            cx={60}
            cy={60}
            r={RADIUS}
            fill="none"
            strokeWidth={10}
            className="stroke-surface-2"
          />
          <m.circle
            cx={60}
            cy={60}
            r={RADIUS}
            fill="none"
            strokeWidth={10}
            strokeLinecap="round"
            stroke={color}
            strokeDasharray={CIRCUMFERENCE}
            style={{ strokeDashoffset: dashOffset }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-4xl font-bold tabular-nums" dir="ltr">
            <m.span>{label}</m.span>
            <span className="text-ink-muted text-lg">{t("score.outOf")}</span>
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-start">
        <h2 id="score-title" className="text-2xl font-bold">
          {t("score.title")}
        </h2>
        <p className="text-lg">
          <span className="text-ok font-semibold">{t("score.ins", { count: ins })}</span>
          {" · "}
          <span className="text-danger font-semibold">{t("score.outs", { count: outs })}</span>
        </p>
        {score.isEstimate && (
          <p className="bg-surface-2 text-ink-muted rounded-full px-3 py-1 text-xs font-medium">
            {t("score.estimate")}
          </p>
        )}
        <p className="sr-only" aria-live="polite">
          {t("score.announce", { score: score.value })}
        </p>
      </div>
    </section>
  );
}
