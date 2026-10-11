import { memo } from "react";

/** The pitcher, seen from behind, facing the panel. */
function UserAvatarSvg({ walking, className }: { walking: boolean; className?: string }) {
  const leg = walking ? "anim-swing origin-box-top" : "";
  return (
    <svg viewBox="0 0 60 100" className={className} aria-hidden>
      <ellipse cx={30} cy={97} rx={18} ry={3} className="fill-ink/15" />
      <rect x={21} y={66} width={8} height={30} rx={4} fill="#2b3450" className={leg} />
      <rect
        x={31}
        y={66}
        width={8}
        height={30}
        rx={4}
        fill="#2b3450"
        className={leg}
        style={walking ? { animationDelay: "-0.25s" } : undefined}
      />
      <path d="M12 72 C12 48 20 40 30 40 C40 40 48 48 48 72 Z" className="fill-accent" />
      <rect x={25} y={32} width={10} height={10} rx={3} fill="#d7a47c" />
      <circle cx={30} cy={22} r={13} fill="#d7a47c" />
      <path
        d="M17 22 C17 6 43 6 43 22 C43 28 41 31 41 31 C38 27 22 27 19 31 C19 31 17 28 17 22 Z"
        fill="#2a1d15"
      />
    </svg>
  );
}

export const UserAvatar = memo(UserAvatarSvg);
