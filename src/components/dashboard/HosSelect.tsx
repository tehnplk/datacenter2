"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type HosItem = {
  hoscode: string;
  hosname: string;
};

type HosSelectProps = {
  hospitals: HosItem[];
  value?: string;
};

export default function HosSelect({ hospitals, value }: HosSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectId = React.useId();

  return (
    <label htmlFor={selectId} className="inline-flex items-center gap-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">เลือก รพ.</span>
      <select
        id={selectId}
        name="hos"
        value={value ?? ""}
        onChange={(e) => {
          const next = new URLSearchParams(searchParams);
          if (e.target.value) {
            next.set("hos", e.target.value);
          } else {
            next.delete("hos");
          }
          router.push(`${pathname}?${next.toString()}`);
        }}
        className="h-9 min-w-[200px] rounded-xl border border-zinc-200/70 bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-300 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
      >
        <option value="">ทั้งหมด</option>
        {hospitals.map((h) => (
          <option key={h.hoscode} value={h.hoscode}>
            {h.hosname}
          </option>
        ))}
      </select>
    </label>
  );
}
