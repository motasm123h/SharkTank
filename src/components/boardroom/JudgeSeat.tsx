import { memo } from "react";
import type { DebateStance, Judge, JudgeState } from "@/domain";
import { JudgeAvatar } from "./JudgeAvatar";
import { STANCE_STYLE } from "./stance";

type Props = {
  judge: Judge;
  state: JudgeState;
  active: boolean;
  dimmed: boolean;
  asked: boolean;
  /** Set when the current speaker is replying to this judge. */
  targetedBy: DebateStance | null;
  name: string;
  askedLabel: string;
};

function JudgeSeatView({
  judge,
  state,
  active,
  dimmed,
  asked,
  targetedBy,
  name,
  askedLabel,
}: Props) {
  const target = targetedBy ? STANCE_STYLE[targetedBy] : null;

  return (
    <figure className="relative flex flex-col items-center" aria-label={name}>
      {/* spotlight behind the active judge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[-15%] top-[-10%] bottom-0 rounded-full transition-opacity duration-500"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(closest-side, ${judge.color}55, transparent)`,
        }}
      />
      {/* dashed ring on the judge being answered, colored by stance */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[4%] top-[2%] aspect-square rounded-full border-2 border-dashed transition-opacity duration-300"
        style={{ opacity: target ? 1 : 0, borderColor: target?.ring }}
      />
      <div
        className="relative w-full max-w-28 transition-[transform,opacity] duration-300 will-change-transform"
        style={{
          transform: active ? "translateY(-6px) scale(1.08)" : undefined,
          opacity: dimmed && !target ? 0.7 : 1,
        }}
      >
        <JudgeAvatar judgeId={judge.id} state={state} className="block h-auto w-full" />
      </div>
      {target && (
        <span
          aria-hidden
          className={`${target.bg} ${target.text} bg-surface absolute start-0 top-0 grid size-5 place-items-center rounded-full text-xs font-bold shadow sm:size-6`}
        >
          {target.icon}
        </span>
      )}
      {asked && (
        <span
          title={askedLabel}
          className="absolute end-0 top-0 grid size-5 place-items-center rounded-full text-[10px] font-bold text-[#111727] shadow sm:size-6"
          style={{ backgroundColor: judge.color }}
        >
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
            <path d="M2.5 6.5 5 9l4.5-5.5" stroke="currentColor" strokeWidth={1.8} fill="none" />
          </svg>
          <span className="sr-only">{askedLabel}</span>
        </span>
      )}
    </figure>
  );
}

export const JudgeSeat = memo(JudgeSeatView);
