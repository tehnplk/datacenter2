"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type MonthSelectProps = {
  value?: number;
};

const TH_MONTHS = [
  "มค",
  "กพ",
  "มีค",
  "เมย",
  "พค",
  "มิย",
  "กค",
  "สค",
  "กย",
  "ตค",
  "พย",
  "ธค",
] as const;

export default function MonthSelect({ value }: MonthSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectId = React.useId();

  return (
    <label htmlFor={selectId} className="inline-flex items-center gap-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">เลือกเดือน</span>
      <select
        id={selectId}
        name="month"
        value={value ? String(value) : ""}
        onChange={(e) => {
          const next = new URLSearchParams(searchParams);
          if (e.target.value) {
            next.set("month", e.target.value);
          } else {
            next.delete("month");
          }
          router.push(`${pathname}?${next.toString()}`);
        }}
        className="h-9 min-w-[140px] rounded-xl border border-zinc-200/70 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-300 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
      >
        <option value="">ทั้งหมด</option>
        {TH_MONTHS.map((label, idx) => (
          <option key={label} value={idx + 1}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
