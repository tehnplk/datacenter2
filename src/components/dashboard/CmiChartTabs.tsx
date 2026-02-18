"use client";

import * as React from "react";
import CmiMultiLineChart from "@/components/dashboard/CmiMultiLineChart";

type Series = {
  key: string;
  label: string;
};

type ChartRow = {
  month?: string;
  year?: string;
  [key: string]: number | string | null | undefined;
};

type ChartMetric = "cmi" | "adjrw" | "case";

type ChartDataset = Record<ChartMetric, ChartRow[]>;

type TabItem = {
  key: ChartMetric;
  label: string;
};

const TABS: TabItem[] = [
  { key: "cmi", label: "CMI" },
  { key: "adjrw", label: "SumAdjRW" },
  { key: "case", label: "IPD Case" },
];

export default function CmiChartTabs({
  title,
  series,
  datasets,
  initial = "cmi",
  xKey = "month",
}: {
  title: string;
  series: Series[];
  datasets: ChartDataset;
  initial?: ChartMetric;
  xKey?: string;
}) {
  const [active, setActive] = React.useState<ChartMetric>(initial);
  const [hiddenByMetric, setHiddenByMetric] = React.useState<
    Record<ChartMetric, Set<string>>
  >({
    cmi: new Set(),
    adjrw: new Set(),
    case: new Set(),
  });

  const hiddenKeys = hiddenByMetric[active];

  const handleToggle = (key: string) => {
    setHiddenByMetric((prev) => {
      const next = new Set(prev[active]);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return { ...prev, [active]: next };
    });
  };

  return (
    <div className="rounded-xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          {title}
        </div>
        <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-zinc-100 p-1 text-[11px] font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`rounded-full px-3 py-1 transition ${
                active === tab.key
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <CmiMultiLineChart
          data={datasets[active]}
          series={series}
          metric={active}
          xKey={xKey}
          hiddenKeys={hiddenKeys}
          onToggleSeries={handleToggle}
        />
      </div>
    </div>
  );
}
