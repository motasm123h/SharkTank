"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  SCORE_DIMENSIONS,
  type Locale,
  type MarketingChannel,
  type Report,
  type SalesScenarioKind,
} from "@/domain";
import { formatMoney } from "@/lib/format";
import type { ScenarioRow } from "./ScenariosChart";

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      data-chart-pending
      className="bg-surface-2 w-full animate-pulse rounded-2xl"
      style={{ height }}
    />
  );
}

// Charts render in the browser only (they measure their container).
const ScoreRadar = dynamic(() => import("./ScoreRadar").then((m) => m.ScoreRadar), {
  ssr: false,
  loading: () => <ChartSkeleton height={288} />,
});
const ScenariosChart = dynamic(() => import("./ScenariosChart").then((m) => m.ScenariosChart), {
  ssr: false,
  loading: () => <ChartSkeleton height={320} />,
});
const BudgetChart = dynamic(() => import("./BudgetChart").then((m) => m.BudgetChart), {
  ssr: false,
  loading: () => <ChartSkeleton height={220} />,
});

type Common = { locale: Locale; print: boolean };

export function RadarPanel({
  breakdown,
  locale,
  print,
}: Common & { breakdown: Report["scoreBreakdown"] }) {
  const t = useTranslations("Report.dimensions");
  const data = SCORE_DIMENSIONS.map((key) => ({ key, label: t(key), value: breakdown[key].value }));
  return (
    <div className="flex flex-col gap-3">
      <ScoreRadar data={data} animate={!print} />
      {/* The values as text: readable without the chart */}
      <dl
        className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-5"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        {data.map((d) => (
          <div key={d.key} className="flex justify-between gap-2 sm:flex-col">
            <dt className="text-ink-muted">{d.label}</dt>
            <dd className="font-semibold tabular-nums" dir="ltr">
              {d.value}/10
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const KINDS: SalesScenarioKind[] = ["pessimistic", "realistic", "optimistic"];

export function ScenariosPanel({
  scenarios,
  locale,
  print,
}: Common & { scenarios: Report["salesScenarios"] }) {
  const t = useTranslations("Report.scenarios");
  const [showTable, setShowTable] = useState(print);
  const currency = scenarios[0]?.monthly[0]?.revenue.currency ?? "USD";
  const months = Math.max(...scenarios.map((s) => s.monthly.length));
  const rows: ScenarioRow[] = Array.from({ length: months }, (_, i) => {
    const row: ScenarioRow = { month: i + 1 };
    for (const s of scenarios) {
      const point = s.monthly[i];
      if (point) row[s.kind] = point.revenue.value;
    }
    return row;
  });
  const labels = Object.fromEntries(KINDS.map((k) => [k, t(`kinds.${k}`)])) as Record<
    SalesScenarioKind,
    string
  >;
  const format = (value: number, compact = false) =>
    formatMoney(value, currency, locale, { compact });

  return (
    <div className="flex flex-col gap-4">
      <ScenariosChart
        rows={rows}
        labels={labels}
        monthLabel={(m) => t("month", { n: m })}
        formatValue={format}
        animate={!print}
      />
      <button
        type="button"
        onClick={() => setShowTable((v) => !v)}
        aria-expanded={showTable}
        className="no-print text-accent self-start text-sm font-semibold underline"
      >
        {showTable ? t("hideTable") : t("showTable")}
      </button>
      {showTable && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead>
              <tr className="text-ink-muted border-border border-b text-start">
                <th className="py-1.5 pe-3 text-start font-medium">{t("monthHeader")}</th>
                {KINDS.map((k) => (
                  <th key={k} className="py-1.5 pe-3 text-end font-medium">
                    {labels[k]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.month} className="border-border/60 border-b">
                  <td className="py-1 pe-3">{row.month}</td>
                  {KINDS.map((k) => (
                    <td key={k} className="py-1 pe-3 text-end" dir="ltr">
                      {row[k] !== undefined ? format(row[k]) : "–"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {KINDS.map((kind) => {
          const scenario = scenarios.find((s) => s.kind === kind);
          if (!scenario) return null;
          return (
            <div key={kind} className="bg-surface-2 rounded-2xl p-3">
              <p className="flex items-center gap-2 font-semibold">
                <span
                  aria-hidden
                  className="h-0.5 w-4 rounded"
                  style={{
                    background: `var(--series-${kind === "realistic" ? 1 : kind === "pessimistic" ? 2 : 3})`,
                  }}
                />
                {labels[kind]}
              </p>
              <p className="text-ink-muted mt-1 text-xs">{t("assumptions")}</p>
              <ul className="mt-1 list-disc ps-4 text-sm">
                {scenario.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BudgetPanel({
  channels,
  locale,
  print,
}: Common & { channels: MarketingChannel[] }) {
  const t = useTranslations("Report.marketing.channels");
  const sorted = [...channels].sort((a, b) => a.priority - b.priority);
  const currency = sorted[0]?.monthlyBudget.currency ?? "USD";
  return (
    <BudgetChart
      data={sorted.map((c) => ({
        key: c.channel,
        label: t(c.channel),
        value: c.monthlyBudget.value,
      }))}
      formatValue={(v) => formatMoney(v, currency, locale)}
      animate={!print}
    />
  );
}
