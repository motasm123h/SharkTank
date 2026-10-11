"use client";

import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { JUDGES, type JudgeId, type Locale, type Transcript } from "@/domain";
import { Link } from "@/i18n/navigation";
import { directionOf } from "@/i18n/routing";
import { AnswerComposer } from "./AnswerComposer";
import { JudgeSeat } from "./JudgeSeat";
import { SpeechBubble } from "./SpeechBubble";
import { UserAvatar } from "./UserAvatar";
import { useSessionStream } from "./useSessionStream";

type Props = {
  sessionId: string;
  transcript: Transcript;
  /** Language the panel speaks in. */
  language: Locale;
};

const JUDGE_BY_ID = Object.fromEntries(JUDGES.map((j) => [j.id, j])) as Record<
  JudgeId,
  (typeof JUDGES)[number]
>;

export function Boardroom({ sessionId, transcript, language }: Props) {
  const t = useTranslations("Boardroom");
  const tj = useTranslations("Judges");
  const uiLocale = useLocale() as Locale;
  // Phase 3 covers entrance + Q&A; the debate is built next.
  const { state, answer, retry } = useSessionStream({
    sessionId,
    transcript,
    stopAtPhase: "debate",
  });

  const speaker = state.speech ? JUDGE_BY_ID[state.speech.judgeId] : null;
  const pending = state.awaiting
    ? state.history.findLast((h) => h.type === "question" && h.id === state.awaiting)
    : undefined;
  const asker = pending && pending.type === "question" ? pending.judgeId : null;
  const qaOver = state.phase !== "loading" && state.phase !== "entrance" && state.phase !== "qa";
  const offstage = directionOf(uiLocale) === "rtl" ? "60vw" : "-60vw";

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="flex flex-col gap-4">
          <section
            aria-label={t("sceneLabel")}
            className="border-border relative overflow-hidden rounded-3xl border bg-gradient-to-b from-[var(--surface-2)] to-[var(--bg)]"
          >
            {/* judges behind the table */}
            <div className="grid grid-cols-5 gap-1 px-2 pt-5 sm:gap-4 sm:px-8 sm:pt-8">
              {JUDGES.map((judge) => (
                <JudgeSeat
                  key={judge.id}
                  judge={judge}
                  state={state.judges[judge.id]}
                  active={state.speech?.judgeId === judge.id && !qaOver}
                  dimmed={!!state.speech && state.speech.judgeId !== judge.id && !state.speech.done}
                  asked={state.asked.includes(judge.id)}
                  name={tj(`${judge.id}.name`)}
                  askedLabel={t("asked")}
                />
              ))}
            </div>
            <div className="bg-table relative z-10 mx-1 -mt-5 grid h-9 grid-cols-5 items-center gap-1 rounded-xl px-2 shadow-md sm:mx-4 sm:-mt-8 sm:h-11 sm:gap-4 sm:px-8">
              {JUDGES.map((judge) => (
                <span
                  key={judge.id}
                  className="truncate rounded bg-black/25 px-1 py-0.5 text-center text-[10px] font-semibold text-white sm:text-xs"
                >
                  {tj(`${judge.id}.short`)}
                </span>
              ))}
            </div>

            {/* what is being said */}
            <div className="min-h-36 px-3 pt-5 pb-2 sm:min-h-40 sm:px-8">
              <AnimatePresence mode="wait">
                {state.speech && speaker && !qaOver ? (
                  <SpeechBubble
                    key={state.speech.id}
                    speech={state.speech}
                    judge={speaker}
                    name={tj(`${speaker.id}.name`)}
                    language={language}
                    kindLabel={state.speech.kind === "question" ? t("question") : undefined}
                  />
                ) : (
                  <m.p
                    key={state.phase}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-ink-muted pt-6 text-center"
                  >
                    {state.phase === "loading" && t("seating")}
                    {state.phase === "entrance" && t("entering")}
                  </m.p>
                )}
              </AnimatePresence>
            </div>

            {/* the pitcher */}
            <div className="relative flex h-32 items-end justify-center sm:h-40">
              <AnimatePresence>
                {state.userBubble && (
                  <m.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    lang={language}
                    dir={directionOf(language)}
                    className="bg-accent text-on-accent absolute top-0 mx-4 line-clamp-2 max-w-md rounded-2xl px-3 py-2 text-sm shadow"
                  >
                    {state.userBubble}
                  </m.p>
                )}
              </AnimatePresence>
              <m.div
                initial={state.user === "standing" ? false : { x: offstage }}
                animate={{ x: state.user === "outside" ? offstage : 0 }}
                transition={{ duration: 1.8, ease: "easeOut" }}
                className="w-16 will-change-transform sm:w-20"
              >
                <UserAvatar walking={state.user === "entering"} className="block h-auto w-full" />
              </m.div>
            </div>
          </section>

          {state.error && (
            <div
              role="alert"
              className="border-danger/50 bg-danger/10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3"
            >
              <p className="text-danger font-medium">{t(`errors.${state.error}`)}</p>
              <button
                type="button"
                onClick={retry}
                className="bg-surface border-border rounded-lg border px-4 py-2 font-semibold"
              >
                {t("retry")}
              </button>
            </div>
          )}

          {qaOver ? (
            <div className="bg-surface border-border rounded-2xl border p-5">
              <h2 className="text-xl font-bold">{t("qaDone.title")}</h2>
              <p className="text-ink-muted mt-1">{t("qaDone.body")}</p>
              <Link href="/pitch" className="text-accent mt-3 inline-block font-semibold underline">
                {t("qaDone.newPitch")}
              </Link>
            </div>
          ) : (
            <AnswerComposer
              questionId={state.awaiting}
              askerName={asker ? tj(`${asker}.name`) : null}
              language={language}
              onAnswer={answer}
            />
          )}

          {state.history.length > 0 && (
            <details className="bg-surface border-border rounded-2xl border p-4">
              <summary className="cursor-pointer font-medium">{t("conversation")}</summary>
              <ol className="mt-3 flex flex-col gap-2" lang={language} dir={directionOf(language)}>
                {state.history.map((item) => (
                  <li key={item.id} className="text-sm">
                    <span
                      className="font-semibold"
                      style={
                        item.type === "answer"
                          ? undefined
                          : { color: JUDGE_BY_ID[item.judgeId].color }
                      }
                    >
                      {item.type === "answer" ? t("you") : tj(`${item.judgeId}.name`)}:
                    </span>{" "}
                    {item.text}
                  </li>
                ))}
              </ol>
            </details>
          )}

          {/* Screen readers get each finished line once, not word by word. */}
          <p aria-live="polite" className="sr-only">
            {state.announcement &&
              `${tj(`${state.announcement.judgeId}.name`)}: ${state.announcement.text}`}
          </p>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
