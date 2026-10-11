"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { useWidth } from "./useWidth";

export type BudgetDatum = { key: string; label: string; value: number };

/** Monthly budget per channel: one series, one hue, labelled bars. */
export function BudgetChart({
  data,
  formatValue,
  animate,
}: {
  data: BudgetDatum[];
  formatValue: (value: number) => string;
  animate: boolean;
}) {
  const { ref, narrow } = useWidth<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-chart
      dir="ltr"
      className="w-full"
      style={{ height: 48 + data.length * 44 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: narrow ? 64 : 80, bottom: 0, left: 0 }}
          barCategoryGap={10}
        >
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="label"
            width={narrow ? 96 : 150}
            tick={{ fill: "var(--ink)", fontSize: narrow ? 11 : 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={({ active, payload }) => {
              const datum = payload?.[0]?.payload as BudgetDatum | undefined;
              if (!active || !datum) return null;
              return (
                <ChartTooltip
                  rows={[
                    {
                      key: datum.key,
                      color: "var(--series-1)",
                      label: datum.label,
                      value: formatValue(datum.value),
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="value"
            fill="var(--series-1)"
            radius={[0, 4, 4, 0]}
            isAnimationActive={animate}
          >
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v: unknown) => (typeof v === "number" ? formatValue(v) : "")}
              style={{ fill: "var(--ink)", fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
