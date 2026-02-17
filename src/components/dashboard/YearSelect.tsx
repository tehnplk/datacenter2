"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type YearSelectProps = {
  years: number[];
  value: number;
};

export default function YearSelect({ years, value }: YearSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectId = React.useId();

  return (
    <label htmlFor={selectId} className="inline-flex items-center gap-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">เลือกปี</span>
      <select
        id={selectId}
        name="year"
        value={String(value)}
        onChange={(e) => {
          const next = new URLSearchParams(searchParams);
          next.set("year", e.target.value);
          router.push(`${pathname}?${next.toString()}`);
        }}
        className="h-9 rounded-xl border border-zinc-200/70 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-300 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  );
}
