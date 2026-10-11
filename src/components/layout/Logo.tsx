import { JUDGES } from "@/domain";

/** Five seats around a table, one per judge color. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-surface-2" />
      <rect x="7" y="17" width="18" height="6" rx="3" className="fill-accent" />
      {JUDGES.map((judge, i) => (
        <circle key={judge.id} cx={8 + i * 4} cy={11} r={2.2} fill={judge.color} />
      ))}
    </svg>
  );
}
