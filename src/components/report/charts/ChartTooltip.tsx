import type { ReactNode } from "react";

/** Tooltip shell for all charts: text in ink tokens, the series color only on the swatch. */
export function ChartTooltip({
  title,
  rows,
}: {
  title?: ReactNode;
  rows: { key: string; color?: string; label: ReactNode; value: ReactNode }[];
}) {
  return (
    <div className="bg-surface border-border rounded-xl border px-3 py-2 text-sm shadow-lg">
      {title && <p className="text-ink-muted mb-1 text-xs font-medium">{title}</p>}
      <ul className="flex flex-col gap-0.5">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-2">
            {row.color && (
              <span aria-hidden className="size-2.5 rounded-sm" style={{ background: row.color }} />
            )}
            <span className="text-ink-muted">{row.label}</span>
            <span className="text-ink ms-auto ps-3 font-semibold tabular-nums" dir="ltr">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
