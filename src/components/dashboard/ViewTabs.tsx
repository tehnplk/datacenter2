"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type TabItem = {
  value: string;
  label: string;
};

type ViewTabsProps = {
  value: string;
  tabs: TabItem[];
  paramName?: string;
};

export default function ViewTabs({
  value,
  tabs,
  paramName = "view",
}: ViewTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div
      role="tablist"
      aria-label="มุมมอง"
      className="inline-flex items-center rounded-2xl border border-zinc-200/70 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-zinc-950"
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set(paramName, t.value);
              router.push(`${pathname}?${next.toString()}`);
            }}
            className={`h-8 cursor-pointer rounded-xl px-3 text-sm font-medium transition-colors ${
              active
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/5"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
