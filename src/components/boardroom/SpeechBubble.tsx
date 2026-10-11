import { m } from "motion/react";
import type { Judge, Locale } from "@/domain";
import { directionOf } from "@/i18n/routing";
import type { Speech } from "./sceneState";

type Props = {
  speech: Speech;
  judge: Judge;
  name: string;
  /** Language the panel speaks in (may differ from the interface language). */
  language: Locale;
  kindLabel?: string;
};

/** Streamed speech from a judge, with a pointer toward their seat. */
export function SpeechBubble({ speech, judge, name, language, kindLabel }: Props) {
  // Seats are laid out in a 5-column grid that follows the page direction,
  // so a logical (start-based) offset lines the pointer up in both LTR and RTL.
  const pointer = `calc(${((judge.seat + 0.5) / 5) * 100}% - 8px)`;

  return (
    <m.div
      key={speech.id}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="relative"
    >
      <span
        aria-hidden
        className="bg-surface absolute -top-2 size-4 rotate-45 border-s-2 border-t-2"
        style={{ insetInlineStart: pointer, borderColor: judge.color }}
      />
      <div
        className="bg-surface rounded-2xl border-2 px-4 py-3 shadow-sm"
        style={{ borderColor: judge.color }}
      >
        <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <span style={{ color: judge.color }}>{name}</span>
          {kindLabel && (
            <span className="bg-surface-2 text-ink-muted rounded-full px-2 py-0.5 text-xs font-medium">
              {kindLabel}
            </span>
          )}
        </p>
        <p
          lang={language}
          dir={directionOf(language)}
          className="min-h-[1.5em] text-base sm:text-lg"
        >
          {speech.text}
          {!speech.done && (
            <span
              aria-hidden
              className="anim-caret ms-0.5 inline-block h-[1em] w-0.5 bg-current align-middle"
            />
          )}
        </p>
      </div>
    </m.div>
  );
}
