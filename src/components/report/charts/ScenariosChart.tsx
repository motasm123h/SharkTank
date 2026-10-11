"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SalesScenarioKind } from "@/domain";
import { ChartTooltip } from "./ChartTooltip";

export type ScenarioRow = { month: number } & Partial<Record<SalesScenarioKind, number>>;

/** Fixed identity per scenario (never by rank): realistic leads, in slot 1. */
export const SCENARIO_COLOR: Record<SalesScenarioKind, string> = {
  realistic: "var(--series-1)",
  pessimistic: "var(--series-2)",
  optimistic: "var(--series-3)",
};

const ORDER: SalesScenarioKind[] = ["optimistic", "realistic", "pessimistic"];
const LEGEND_RANK: Record<SalesScenarioKind, number> = {
  pessimistic: 0,
  realistic: 1,
  optimistic: 2,
};

type Props = {
  rows: ScenarioRow[];
  labels: Record<SalesScenarioKind, string>;
  monthLabel: (month: number) => string;
  formatValue: (value: number, compact?: boolean) => string;
  animate: boolean;
};

export function ScenariosChart({ rows, labels, monthLabel, formatValue, animate }: Props) {
  const last = rows.length - 1;

  return (
    <div data-chart dir="ltr" className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 84, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeOpacity={0.6} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            width={64}
            tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatValue(v, true)}
          />
          <Legend
            verticalAlign="top"
            height={32}
            iconType="plainline"
            // Natural order (pessimistic → optimistic), not alphabetical.
            itemSorter={(item) => LEGEND_RANK[item.dataKey as SalesScenarioKind] ?? 0}
            formatter={(value: string) => <span className="text-ink text-sm">{value}</span>}
          />
          <Tooltip
            cursor={{ stroke: "var(--ink-muted)", strokeDasharray: "3 3" }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <ChartTooltip
                  title={monthLabel(Number(label))}
                  rows={ORDER.flatMap((kind) => {
                    const item = payload.find((p) => p.dataKey === kind);
                    return item && typeof item.value === "number"
                      ? [
                          {
                            key: kind,
                            color: SCENARIO_COLOR[kind],
                            label: labels[kind],
                            value: formatValue(item.value),
                          },
                        ]
                      : [];
                  })}
                />
              );
            }}
          />
          {ORDER.map((kind) => (
            <Line
              key={kind}
              type="monotone"
              dataKey={kind}
              name={labels[kind]}
              stroke={SCENARIO_COLOR[kind]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
              isAnimationActive={animate}
              // Direct label at the line end: identity never depends on color alone.
              label={(props: { index?: number; x?: number | string; y?: number | string }) =>
                props.index === last && props.x !== undefined && props.y !== undefined ? (
                  <text
                    key={`${kind}-end`}
                    x={Number(props.x) + 6}
                    y={Number(props.y)}
                    dy={4}
                    fontSize={12}
                    fill="var(--ink)"
                  >
                    {labels[kind]}
                  </text>
                ) : (
                  <g key={`${kind}-${props.index}`} />
                )
              }
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
