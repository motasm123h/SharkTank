import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function Section({ id, title, subtitle, children, className = "" }: Props) {
  return (
    <section
      aria-labelledby={id}
      className={`bg-surface border-border print-avoid-break rounded-3xl border p-5 sm:p-6 ${className}`}
    >
      <h2 id={id} className="text-xl font-bold">
        {title}
      </h2>
      {subtitle && <p className="text-ink-muted mt-1 text-sm">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function BulletList({ items, lang }: { items: string[]; lang?: string }) {
  return (
    <ul lang={lang} className="flex list-disc flex-col gap-1.5 ps-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
