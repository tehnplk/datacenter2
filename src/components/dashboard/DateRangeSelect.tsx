"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type DateRangeSelectProps = {
  start?: string;
  end?: string;
  min?: string;
  max?: string;
};

export default function DateRangeSelect({ start, end, min, max }: DateRangeSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const startId = React.useId();
  const endId = React.useId();

  const updateParam = React.useCallback(
    (key: "start" | "end", value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      router.push(`${pathname}?${next.toString()}`);
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor={startId} className="inline-flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">เริ่ม</span>
        <input
          id={startId}
          type="date"
          value={start ?? ""}
          min={min}
          max={max}
          onChange={(e) => updateParam("start", e.target.value)}
          className="h-9 rounded-xl border border-zinc-200/70 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-300 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
      <label htmlFor={endId} className="inline-flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">ถึง</span>
        <input
          id={endId}
          type="date"
          value={end ?? ""}
          min={min}
          max={max}
          onChange={(e) => updateParam("end", e.target.value)}
          className="h-9 rounded-xl border border-zinc-200/70 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-300 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </label>
    </div>
  );
}
