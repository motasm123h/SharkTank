import type { ReactNode } from "react";

type Props = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Extra text at the end of the label row, e.g. a character counter. */
  aside?: ReactNode;
  children: ReactNode;
};

/** Label, optional hint and error for one form control. Ids follow `${id}-hint` / `${id}-error`. */
export function Field({ id, label, hint, error, aside, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {aside}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-ink-muted text-sm">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-danger text-sm font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

export function describedBy(id: string, { hint, error }: { hint?: boolean; error?: boolean }) {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export const inputClass =
  "bg-surface border-border text-ink placeholder:text-ink-muted/70 w-full rounded-xl border px-3.5 py-3 text-base outline-none focus:border-focus focus:ring-2 focus:ring-focus/30 aria-invalid:border-danger";
