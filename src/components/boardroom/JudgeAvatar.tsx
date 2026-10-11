import { memo } from "react";
import { JUDGES, type JudgeId, type JudgeState } from "@/domain";

/**
 * A judge character. The only contract is `judgeId` + `state`, so this SVG
 * version can be swapped for Rive animations later without touching callers.
 */
export type JudgeAvatarProps = {
  judgeId: JudgeId;
  state: JudgeState;
  className?: string;
};

type Look = { skin: string; hair: string; hairPath: string };

const LOOKS: Record<JudgeId, Look> = {
  investor: {
    skin: "#e9bd98",
    hair: "#2b1d14",
    hairPath:
      "M30 42 C29 24 42 20 52 21 C63 21 71 28 70 41 C66 33 58 30 47 31 C40 31 34 35 30 42 Z",
  },
  local: {
    skin: "#c68a5e",
    hair: "#1a1a1a",
    hairPath:
      "M29 44 C26 26 38 18 50 19 C63 19 74 27 71 44 C69 36 66 33 63 32 C58 35 44 35 37 32 C34 34 31 38 29 44 Z",
  },
  marketing: {
    skin: "#8d5a3b",
    hair: "#3b2416",
    hairPath:
      "M28 50 C22 30 34 16 50 17 C66 17 78 30 72 50 C71 40 68 33 62 30 C55 33 45 33 38 30 C32 33 29 40 28 50 Z",
  },
  finance: {
    skin: "#e0ac7e",
    hair: "#5a3420",
    hairPath:
      "M30 44 C28 27 39 20 50 20 C62 20 72 27 70 44 C67 34 60 29 50 29 C40 29 33 34 30 44 Z M44 18 C44 11 56 11 56 18 C56 22 44 22 44 18 Z",
  },
  skeptic: {
    skin: "#a8704b",
    hair: "#8f8f8f",
    hairPath:
      "M31 40 C31 27 40 22 50 22 C60 22 69 27 69 40 C64 32 57 30 50 30 C43 30 36 32 31 40 Z",
  },
};

const COLOR = Object.fromEntries(JUDGES.map((j) => [j.id, j.color])) as Record<JudgeId, string>;
const INK = "#1d1a1f";

const HEAD_TILT: Partial<Record<JudgeState, string>> = {
  skeptical: "rotate(-7deg)",
  thinking: "rotate(5deg)",
  out: "rotate(-3deg) translateY(1px)",
};

function Brows({ state }: { state: JudgeState }) {
  const [left, right] = (() => {
    switch (state) {
      case "skeptical":
        return ["M38 37 L46 37", "M54 34 L62 31"];
      case "thinking":
        return ["M38 35 L46 34", "M54 34 L62 35"];
      case "happy":
      case "in":
        return ["M38 35 Q42 32 46 35", "M54 35 Q58 32 62 35"];
      case "out":
        return ["M38 35 L46 38", "M54 38 L62 35"];
      default:
        return ["M38 37 L46 36", "M54 36 L62 37"];
    }
  })();
  return (
    <g stroke={INK} strokeWidth={2.2} strokeLinecap="round" fill="none">
      <path d={left} />
      <path d={right} />
    </g>
  );
}

function Mouth({ state }: { state: JudgeState }) {
  switch (state) {
    case "talking":
      return (
        <ellipse cx={50} cy={55} rx={4.5} ry={3.2} fill={INK} className="anim-talk origin-box" />
      );
    case "happy":
    case "in":
      return <path d="M42 52 Q50 62 58 52 Z" fill={INK} />;
    case "skeptical":
      return (
        <path
          d="M44 56 Q50 55 57 52"
          stroke={INK}
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
        />
      );
    case "thinking":
      return <path d="M46 56 L54 55" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />;
    case "out":
      return (
        <path
          d="M43 58 Q50 52 57 58"
          stroke={INK}
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
        />
      );
    default:
      return (
        <path
          d="M44 54 Q50 58 56 54"
          stroke={INK}
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
        />
      );
  }
}

/** Worn on the body: the investor's tie, the local expert's lapel pin. */
function BodyAccessory({ judgeId }: { judgeId: JudgeId }) {
  switch (judgeId) {
    case "investor":
      return <path d="M48 74 L52 74 L53.5 93 L50 97 L46.5 93 Z" fill="#1f2a44" />;
    case "local":
      return <circle cx={63} cy={86} r={3} fill="#ffffff" stroke={INK} strokeWidth={1} />;
    default:
      return null;
  }
}

/** Worn on the head: headset, round glasses, square glasses. */
function HeadAccessory({ judgeId }: { judgeId: JudgeId }) {
  switch (judgeId) {
    case "marketing":
      return (
        <g fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round">
          <path d="M28 46 C26 22 74 22 72 46" />
          <path d="M30 50 C33 60 40 61 44 59" strokeWidth={1.8} />
          <circle cx={45} cy={59} r={1.8} fill={INK} />
        </g>
      );
    case "finance":
      return (
        <g fill="none" stroke={INK} strokeWidth={1.6}>
          <circle cx={42} cy={45} r={5.5} />
          <circle cx={58} cy={45} r={5.5} />
          <path d="M47.5 45 L52.5 45" />
        </g>
      );
    case "skeptic":
      return (
        <g fill="none" stroke={INK} strokeWidth={1.8}>
          <rect x={36} y={41} width={11} height={8} rx={1.5} />
          <rect x={53} y={41} width={11} height={8} rx={1.5} />
          <path d="M47 44 L53 44" />
        </g>
      );
    default:
      return null;
  }
}

function StateBadge({ state }: { state: JudgeState }) {
  if (state === "thinking") {
    return (
      <g fill="currentColor" className="text-ink-muted">
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={74 + i * 6}
            cy={20 - i * 3}
            r={2.2}
            className="anim-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </g>
    );
  }
  if (state === "in" || state === "out") {
    const ok = state === "in";
    return (
      <g>
        <circle
          cx={70}
          cy={92}
          r={9}
          fill={ok ? "#16a34a" : "#dc2626"}
          stroke="#fff"
          strokeWidth={2}
        />
        <path
          d={ok ? "M65.5 92 L69 95.5 L75 88.5" : "M66.5 88.5 L73.5 95.5 M73.5 88.5 L66.5 95.5"}
          stroke="#fff"
          strokeWidth={2.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  }
  return null;
}

function JudgeAvatarSvg({ judgeId, state, className }: JudgeAvatarProps) {
  const look = LOOKS[judgeId];
  const eyesUp = state === "thinking" ? "translate(1.5px, -2px)" : undefined;

  return (
    <svg viewBox="0 0 100 110" className={className} aria-hidden data-state={state}>
      {/* chair */}
      <rect x={20} y={28} width={60} height={82} rx={12} className="fill-border" />

      <g className="anim-breathe origin-box-bottom">
        {/* body */}
        <path d="M17 110 C17 84 30 72 50 72 C70 72 83 84 83 110 Z" fill={COLOR[judgeId]} />
        <path d="M42 73 L50 89 L58 73 Z" fill="#f3f5fa" />
        <rect x={44} y={60} width={12} height={14} rx={4} fill={look.skin} />
        <BodyAccessory judgeId={judgeId} />

        {/* head */}
        <g
          className={`origin-box-bottom transition-transform duration-300 ${state === "happy" || state === "in" ? "anim-bob" : ""}`}
          style={{ transform: HEAD_TILT[state] }}
        >
          <circle cx={50} cy={44} r={20} fill={look.skin} />
          <path d={look.hairPath} fill={look.hair} />
          <g style={{ transform: eyesUp }} className="transition-transform duration-300">
            <g className="anim-blink origin-box">
              <ellipse cx={43} cy={45} rx={2.4} ry={2.8} fill={INK} />
              <ellipse cx={57} cy={45} rx={2.4} ry={2.8} fill={INK} />
            </g>
          </g>
          <Brows state={state} />
          <Mouth state={state} />
          <HeadAccessory judgeId={judgeId} />
        </g>
      </g>

      <StateBadge state={state} />
    </svg>
  );
}

export const JudgeAvatar = memo(JudgeAvatarSvg);
