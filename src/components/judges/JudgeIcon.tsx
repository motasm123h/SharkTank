import type { JudgeId } from "@/domain";

/** Simple line icons standing in for each judge until the animated avatars (Phase 3). */
const PATHS: Record<JudgeId, string> = {
  // briefcase
  investor: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
  // map pin
  local:
    "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  // megaphone
  marketing: "M3 10v4h4l6 4V6L7 10H3ZM16 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11",
  // calculator
  finance:
    "M6 3h12v18H6zM9 7h6M9 11h.01M12 11h.01M15 11h.01M9 14h.01M12 14h.01M15 14h.01M9 17h.01M12 17h.01M15 17h.01",
  // magnifier
  skeptic: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 21 21",
};

export function JudgeIcon({ judgeId, className }: { judgeId: JudgeId; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[judgeId]} />
    </svg>
  );
}
