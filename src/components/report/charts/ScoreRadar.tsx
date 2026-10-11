"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { useWidth } from "./useWidth";

export type RadarDatum = { key: string; label: string; value: number };

/** Single series, so no legend: the section title names it. */
export function ScoreRadar({ data, animate }: { data: RadarDatum[]; animate: boolean }) {
  const { ref, narrow } = useWidth<HTMLDivElement>();
  return (
    <div ref={ref} data-chart dir="ltr" className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={data}
          outerRadius={narrow ? "52%" : "70%"}
          margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
        >
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: "var(--ink-muted)", fontSize: narrow ? 11 : 12 }}
          />
          <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="var(--series-1)"
            strokeWidth={2}
            fill="var(--series-1)"
            fillOpacity={0.2}
            dot={{ r: 4, fill: "var(--series-1)", stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={animate}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              const datum = payload?.[0]?.payload as RadarDatum | undefined;
              if (!active || !datum) return null;
              return (
                <ChartTooltip
                  rows={[
                    {
                      key: datum.key,
                      color: "var(--series-1)",
                      label: datum.label,
                      value: `${datum.value}/10`,
                    },
                  ]}
                />
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
