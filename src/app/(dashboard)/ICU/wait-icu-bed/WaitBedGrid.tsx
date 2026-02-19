"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

type WaitBedRow = {
  hoscode: string;
  hosname: string | null;
  hosname_short: string | null;
  yr: number;
  yr_be: number | null;
  total_cases: number | null;
  admitted_cases: number | null;
  refer_out_cases: number | null;
  avg_wait_min: number | null;
  avg_wait_hours: number | null;
  avg_admit_wait_min: number | null;
  avg_admit_wait_hr: number | null;
  avg_refer_wait_min: number | null;
  avg_refer_wait_hr: number | null;
  pct_over_4hr: number | null;
};

type SortKey = "hosname" | "total_cases" | "avg_admit_wait_min";
type SortDir = "asc" | "desc";

function fmtNumber(n: number, digits = 2) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function formatHourMinute(totalMinutes: number | null) {
  if (totalMinutes == null || Number.isNaN(totalMinutes)) return "-";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours} ชม ${minutes} นาที`;
}


function compareVal(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

export default function WaitBedGrid({ rows }: { rows: WaitBedRow[] }) {
  const [sortKey, setSortKey] = React.useState<SortKey>("avg_admit_wait_min");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = React.useMemo(() => {
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "hosname") {
        const na = a.hosname_short?.trim() || a.hosname || a.hoscode;
        const nb = b.hosname_short?.trim() || b.hosname || b.hoscode;
        cmp = na.localeCompare(nb, "th");
      } else if (sortKey === "total_cases") {
        cmp = compareVal(a.total_cases, b.total_cases);
      } else {
        cmp = compareVal(a.avg_admit_wait_min, b.avg_admit_wait_min);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
    if (sortDir === "asc") return <ChevronUp className="h-3 w-3" />;
    return <ChevronDown className="h-3 w-3" />;
  }

  return (
    <div className="overflow-auto bg-white dark:bg-zinc-950">
      <table className="min-w-[720px] w-full border-separate border-spacing-0 text-xs">
        <thead className="bg-white dark:bg-zinc-950">
          <tr>
            <Th className="w-[64px] text-right">ลำดับ</Th>
            <Th
              className="min-w-[220px] cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900"
              onClick={() => handleSort("hosname")}
            >
              <span className="inline-flex items-center gap-1">
                ชื่อ รพ. <SortIcon col="hosname" />
              </span>
            </Th>
            <Th
              className="w-[120px] text-right cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900"
              onClick={() => handleSort("total_cases")}
            >
              <span className="inline-flex items-center justify-end gap-1 w-full">
                จำนวน case <SortIcon col="total_cases" />
              </span>
            </Th>
            <Th
              className="w-[260px] text-right cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-900"
              onClick={() => handleSort("avg_admit_wait_min")}
            >
              <span className="inline-flex items-center justify-end gap-1 w-full">
                ระยะเวลารอเตียงเฉลี่ย <SortIcon col="avg_admit_wait_min" />
              </span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, idx) => (
            <tr key={`${r.hoscode}-${idx}`} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
              <Td className="text-right tabular-nums">{idx + 1}</Td>
              <Td>{r.hosname_short?.trim() || r.hosname || r.hoscode}</Td>
              <Td className="text-right tabular-nums">
                {r.total_cases != null ? fmtNumber(r.total_cases, 0) : "-"}
              </Td>
              <Td className="text-right tabular-nums">
                {formatHourMinute(r.avg_admit_wait_min)}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  className,
  children,
  onClick,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      onClick={onClick}
      className={`border-b border-zinc-200/70 px-3 py-2 text-left text-xs font-semibold text-zinc-600 dark:border-white/10 dark:text-zinc-300 ${className ?? ""}`}
      {...props}
    >
      {children}
    </th>
  );
}

function Td({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`border-b border-zinc-200/70 px-3 py-2 text-zinc-800 dark:border-white/10 dark:text-zinc-100 ${className ?? ""}`}
      {...props}
    >
      {children}
    </td>
  );
}
