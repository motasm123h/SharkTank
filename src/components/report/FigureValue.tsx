import { useTranslations } from "next-intl";
import type { Figure, Locale } from "@/domain";
import { formatFigureRange, formatFigureValue } from "@/lib/format";

/** Small chip that says whether a number is an estimate or a sourced fact. */
export function FigureBadge({ figure }: { figure: Figure }) {
  const t = useTranslations("Report.legend");
  if (figure.isEstimate) {
    return (
      <span className="border-ink-muted/50 text-ink-muted inline-flex w-fit items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-[11px] font-medium">
        <span aria-hidden>≈</span> {t("estimate")}
      </span>
    );
  }
  const source = figure.source;
  const label = source
    ? `${t("source")}: ${source.title}${source.publisher ? `, ${source.publisher}` : ""}${source.year ? ` (${source.year})` : ""}`
    : t("fact");
  const chip = (
    <span className="bg-ok/15 text-ok inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
      <span aria-hidden>✓</span> {t("fact")}
    </span>
  );
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {chip}
      {source &&
        (source.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="text-ink-muted text-[11px] underline"
          >
            {label}
          </a>
        ) : (
          <span className="text-ink-muted text-[11px]">{label}</span>
        ))}
    </span>
  );
}

type Props = {
  figure: Figure;
  locale: Locale;
  className?: string;
};

/** A number with its range (if any) and its estimate/fact marking. */
export function FigureValue({ figure, locale, className = "text-2xl" }: Props) {
  const range = formatFigureRange(figure, locale);
  return (
    <span className="inline-flex flex-col gap-1">
      <span className={`font-bold tabular-nums ${className}`}>
        {figure.isEstimate && (
          <span aria-hidden className="text-ink-muted me-1 font-normal">
            ≈
          </span>
        )}
        {formatFigureValue(figure, locale)}
      </span>
      {range && <span className="text-ink-muted text-xs tabular-nums">{range}</span>}
      <FigureBadge figure={figure} />
    </span>
  );
}
