"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type HospitalTabItem = {
  value: string;
  label: string;
};

export default function HospitalTabs({
  items,
  value,
  paramName = "hos",
}: {
  items: HospitalTabItem[];
  value?: string;
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selected = React.useMemo(() => {
    if (value && items.some((i) => i.value === value)) return value;
    return items[0]?.value ?? "";
  }, [items, value]);

  if (!items.length) return null;

  return (
    <div
      role="tablist"
      aria-label="โรงพยาบาล"
      className="max-w-full overflow-x-auto"
    >
      <div className="inline-flex items-center gap-1 rounded-2xl border border-green-200 bg-white p-1 shadow-sm dark:border-green-800 dark:bg-green-950">
        {items.map((t) => {
          const active = t.value === selected;
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
              className={`h-8 whitespace-nowrap rounded-xl px-3 text-[12px] font-semibold transition-colors ${
                active
                  ? "bg-green-700 text-white dark:bg-green-300 dark:text-green-950"
                  : "text-green-800 hover:bg-green-50 dark:text-green-100 dark:hover:bg-green-800/50"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
