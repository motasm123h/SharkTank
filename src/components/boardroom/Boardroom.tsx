"use client";

import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { JUDGES, type JudgeId, type Locale, type Transcript } from "@/domain";
import { Link } from "@/i18n/navigation";
import { directionOf } from "@/i18n/routing";
import { AnswerComposer } from "./AnswerComposer";
import { ConversationLog } from "./ConversationLog";
import { JudgeSeat } from "./JudgeSeat";
import { ScoreReveal } from "./ScoreReveal";
import { SpeechBubble } from "./SpeechBubble";
import { UserAvatar } from "./UserAvatar";
import { VerdictBoard } from "./VerdictBoard";
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

const PHASE_LABEL = {
  loading: "qa",
  entrance: "qa",
  qa: "qa",
  debate: "debate",
  verdict: "verdict",
  report: "verdict",
  done: "verdict",
} as const;

export function Boardroom({ sessionId, transcript, language }: Props) {
  const t = useTranslations("Boardroom");
  const tj = useTranslations("Judges");
  const uiLocale = useLocale() as Locale;
  const { state, mode, answer, retry, skip, replay, canSkip, canReplay } = useSessionStream({
    sessionId,
    transcript,
  });

  const { speech } = state;
  const speaker = speech ? JUDGE_BY_ID[speech.judgeId] : null;
  const pending = state.awaiting
    ? state.history.findLast((h) => h.type === "question" && h.id === state.awaiting)
    : undefined;
  const asker = pending?.type === "question" ? pending.judgeId : null;
  const inQa = state.phase === "loading" || state.phase === "entrance" || state.phase === "qa";
  const showVerdicts = state.verdicts.length > 0 || state.phase === "verdict" || state.score;
  const target = speech?.kind === "debate" && speech.replyTo && speech.stance ? speech : null;
  const offstage = directionOf(uiLocale) === "rtl" ? "60vw" : "-60vw";

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <div className="flex flex-col gap-4">
          <section
            aria-label={t("sceneLabel")}
            className="border-border relative overflow-hidden rounded-3xl border bg-gradient-to-b from-[var(--surface-2)] to-[var(--bg)]"
          >
            {/* part of the show + skip / replay */}
            <div className="relative z-20 flex items-center justify-between gap-2 px-3 pt-3 sm:px-5">
              <span className="bg-surface/80 text-ink-muted rounded-full px-3 py-1 text-xs font-semibold backdrop-blur">
                {mode === "replay" ? t("replaying") : t(`phase.${PHASE_LABEL[state.phase]}`)}
              </span>
              <div className="flex gap-2">
                {canReplay && (
                  <button
                    type="button"
                    onClick={replay}
                    className="bg-surface border-border hover:bg-surface-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
                  >
                    ↺ {t("controls.replay")}
                  </button>
                )}
                {canSkip && (
                  <button
                    type="button"
                    onClick={skip}
                    aria-label={t("controls.skipLabel")}
                    title={t("controls.skipLabel")}
                    className="bg-surface border-border hover:bg-surface-2 rounded-full border px-3 py-1.5 text-xs font-semibold"
                  >
                    {t("controls.skip")} <span className="inline-block rtl:-scale-x-100">»</span>
                  </button>
                )}
              </div>
            </div>

            {/* judges behind the table */}
            <div className="grid grid-cols-5 gap-1 px-2 pt-3 sm:gap-4 sm:px-8 sm:pt-4">
              {JUDGES.map((judge) => (
                <JudgeSeat
                  key={judge.id}
                  judge={judge}
                  state={state.judges[judge.id]}
                  active={speech?.judgeId === judge.id}
                  dimmed={!!speech && speech.judgeId !== judge.id && !speech.done}
                  asked={inQa && state.asked.includes(judge.id)}
                  targetedBy={
                    target?.replyTo?.judgeId === judge.id ? (target.stance ?? null) : null
                  }
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
              <>
                {speech && speaker ? (
                  <SpeechBubble
                    key={speech.id}
                    speech={speech}
                    judge={speaker}
                    name={tj(`${speaker.id}.name`)}
                    language={language}
                    kindLabel={
                      speech.kind === "question"
                        ? t("question")
                        : speech.kind === "verdict"
                          ? t("verdict")
                          : undefined
                    }
                    reply={
                      target?.replyTo && target.stance
                        ? {
                            name: tj(`${target.replyTo.judgeId}.name`),
                            color: JUDGE_BY_ID[target.replyTo.judgeId].color,
                            stance: target.stance,
                            label: t(`stance.${target.stance}`),
                          }
                        : undefined
                    }
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
                    {state.phase === "debate" && t("debateStarting")}
                    {(state.phase === "report" || state.phase === "done") && t("panelHasSpoken")}
                  </m.p>
                )}
              </>
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

          {inQa && mode === "live" && (
            <AnswerComposer
              questionId={state.awaiting}
              askerName={asker ? tj(`${asker}.name`) : null}
              language={language}
              onAnswer={answer}
            />
          )}

          {showVerdicts && <VerdictBoard verdicts={state.verdicts} language={language} />}

          {state.score && (
            <ScoreReveal
              key={mode === "replay" ? "replay" : "live"}
              score={state.score}
              verdicts={state.verdicts}
            />
          )}

          {state.phase === "done" && mode === "live" && (
            <div className="bg-surface border-border flex flex-col gap-3 rounded-2xl border p-5">
              <h2 className="text-xl font-bold">{t("done.title")}</h2>
              <p className="text-ink-muted">{t("done.body")}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/report/${sessionId}`}
                  className="bg-accent text-on-accent hover:bg-accent-strong rounded-xl px-5 py-2.5 font-semibold"
                >
                  {t("done.seeReport")}
                </Link>
                <button
                  type="button"
                  onClick={replay}
                  className="border-border hover:bg-surface-2 rounded-xl border px-5 py-2.5 font-semibold"
                >
                  ↺ {t("controls.replay")}
                </button>
                <Link
                  href="/pitch"
                  className="border-border hover:bg-surface-2 rounded-xl border px-5 py-2.5 font-semibold"
                >
                  {t("done.newPitch")}
                </Link>
              </div>
            </div>
          )}

          {state.history.length > 0 && (
            <ConversationLog items={state.history} language={language} />
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
