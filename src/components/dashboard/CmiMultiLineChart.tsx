"use client";

import * as React from "react";
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

type Series = {
  key: string;
  label: string;
};

type ChartRow = {
  month?: string;
  year?: string;
  [key: string]: number | string | null | undefined;
};

type MetricType = "cmi" | "adjrw" | "case";

type CmiMultiLineChartProps = {
  data: ChartRow[];
  series: Series[];
  metric: MetricType;
  xKey?: string;
  hiddenKeys?: Set<string>;
  onToggleSeries?: (key: string) => void;
};

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f97316",
  "#db2777",
  "#7c3aed",
  "#0ea5e9",
  "#eab308",
  "#14b8a6",
  "#ef4444",
];

function formatNumber(value: number | null, digits: number) {
  if (value == null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function getMetricDigits(metric: MetricType) {
  if (metric === "case") return 0;
  if (metric === "adjrw") return 4;
  return 2;
}

export default function CmiMultiLineChart({
  data,
  series,
  metric,
  xKey = "month",
  hiddenKeys,
  onToggleSeries,
}: CmiMultiLineChartProps) {
  if (!series.length) return null;

  const digits = getMetricDigits(metric);

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => formatNumber(value as number, digits)}
            domain={[0, "auto"]}
          />
          <Tooltip
            formatter={(value) => formatNumber(value as number, digits)}
            labelStyle={{ fontWeight: 600 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            content={({ payload }) => (
              <div className="flex flex-wrap gap-3">
                {payload?.map((entry) => {
                  const dataKey = String(entry.dataKey ?? "");
                  const isHidden = hiddenKeys?.has(dataKey) ?? false;
                  return (
                    <button
                      key={dataKey}
                      type="button"
                      onClick={() => onToggleSeries?.(dataKey)}
                      className={`cursor-pointer inline-flex items-center gap-2 text-xs font-medium transition ${
                        isHidden ? "text-zinc-400" : "text-zinc-700 dark:text-zinc-200"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isHidden ? "bg-zinc-300" : "bg-current"
                        }`}
                        style={{ color: entry.color }}
                      />
                      <span className={isHidden ? "line-through" : undefined}>
                        {entry.value}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          {series.map((s, idx) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={COLORS[idx % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 2.5 }}
              activeDot={{ r: 4 }}
              connectNulls
              hide={hiddenKeys?.has(s.key)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
