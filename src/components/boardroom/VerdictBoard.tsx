"use client";

import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { JUDGES, type Locale, type Verdict } from "@/domain";
import { directionOf } from "@/i18n/routing";

type Props = { verdicts: Verdict[]; language: Locale };

/** One card per judge, in seat order; each flips in when that judge decides. */
export function VerdictBoard({ verdicts, language }: Props) {
  const t = useTranslations("Boardroom");
  const tj = useTranslations("Judges");

  return (
    <section aria-labelledby="verdicts-title" className="flex flex-col gap-3">
      <h2 id="verdicts-title" className="text-lg font-bold">
        {t("verdicts")}
      </h2>
      <ol className="grid gap-2 sm:grid-cols-5">
        {JUDGES.map((judge) => {
          const verdict = verdicts.find((v) => v.judgeId === judge.id);
          const isIn = verdict?.decision === "in";
          return (
            <li key={judge.id} className="[perspective:600px]">
              {verdict ? (
                <m.div
                  key="revealed"
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className={`flex h-full items-start gap-3 rounded-2xl border-2 p-3 sm:flex-col sm:gap-2 ${
                    isIn ? "border-ok bg-ok/10" : "border-danger bg-danger/10"
                  }`}
                >
                  <div className="flex shrink-0 flex-col gap-1 sm:w-full sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-semibold" style={{ color: judge.color }}>
                      {tj(`${judge.id}.short`)}
                    </span>
                    <span
                      className={`w-fit rounded-full px-2.5 py-0.5 text-sm font-bold text-white ${
                        isIn ? "bg-ok" : "bg-danger"
                      }`}
                    >
                      {isIn ? t("in") : t("out")}
                    </span>
                  </div>
                  <p lang={language} dir={directionOf(language)} className="text-sm">
                    {verdict.reason}
                  </p>
                </m.div>
              ) : (
                <div className="border-border text-ink-muted flex h-full min-h-14 items-center justify-between gap-2 rounded-2xl border-2 border-dashed p-3 text-sm sm:flex-col sm:justify-center">
                  <span className="font-semibold">{tj(`${judge.id}.short`)}</span>
                  <span>{t("pending")}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
