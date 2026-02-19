"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 25;

function formatValue(val: unknown): string {
  if (val == null) return "";
  if (val instanceof Date) return formatDate(val);
  if (typeof val === "string") {
    const d = tryParseDate(val);
    if (d) return formatDate(d);
  }
  return String(val);
}

function tryParseDate(s: string): Date | null {
  // Only parse strings that look like ISO datetime or date: YYYY-MM-DD or YYYY-MM-DDTHH:...
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const sa = String(a);
  const sb = String(b);
  return sa.localeCompare(sb, "th");
}

type SortDir = "asc" | "desc" | null;

function isNumeric(val: unknown): val is number {
  return typeof val === "number" && isFinite(val);
}

function computeSummary(
  rows: Record<string, unknown>[],
  hosMap: Record<string, string>,
): { summaryRows: { hoscode: string; hosname: string; count: number }[] } {
  const map = new Map<string, number>();
  for (const row of rows) {
    const hos = String(row["hoscode"] ?? "");
    map.set(hos, (map.get(hos) ?? 0) + 1);
  }
  const summaryRows = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hoscode, count]) => ({ hoscode, hosname: hosMap[hoscode] ?? "", count }));
  return { summaryRows };
}

export default function AdminGrid({
  cols,
  rows,
  hasHoscode,
  hosMap,
  hospitals,
  selectedHos,
  selectedTable,
}: {
  cols: string[];
  rows: Record<string, unknown>[];
  hasHoscode: boolean;
  hosMap: Record<string, string>;
  hospitals: string[];
  selectedHos: string;
  selectedTable: string;
}) {
  const router = useRouter();

  function handleHosChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const hos = e.target.value;
    router.push(`/admin?table=${selectedTable}${hos ? `&hos=${hos}` : ""}`);
  }
  const [sortCol, setSortCol] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>(null);
  const [page, setPage] = React.useState(0);

  const { summaryRows } = React.useMemo(
    () => (hasHoscode && rows.length > 0 ? computeSummary(rows, hosMap) : { summaryRows: [] }),
    [rows, hasHoscode, hosMap],
  );

  const sorted = React.useMemo(() => {
    if (!sortCol || !sortDir) return rows;
    return [...rows].sort((a, b) => {
      const cmp = compareValues(a[sortCol], b[sortCol]);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function handleSort(col: string) {
    if (sortCol !== col) {
      setSortCol(col);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortCol(null);
      setSortDir(null);
    }
    setPage(0);
  }

  function SortIcon({ col }: { col: string }) {
    if (sortCol !== col) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
    if (sortDir === "asc") return <ChevronUp className="h-3 w-3 text-green-700" />;
    return <ChevronDown className="h-3 w-3 text-green-700" />;
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Summary: record count group by hoscode — above datagrid */}
      {summaryRows.length > 1 && (
        <div className="inline-block overflow-auto rounded-xl border border-green-300 bg-green-50 shadow-sm dark:border-green-700 dark:bg-green-900/50">
          <table className="border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                <th className="border-b border-green-200 px-4 py-2 text-left font-semibold text-green-700 whitespace-nowrap dark:border-green-700 dark:text-green-300">hoscode</th>
                <th className="border-b border-green-200 px-4 py-2 text-left font-semibold text-green-700 whitespace-nowrap dark:border-green-700 dark:text-green-300">hosname</th>
                <th className="border-b border-green-200 px-4 py-2 text-right font-semibold text-green-700 whitespace-nowrap dark:border-green-700 dark:text-green-300">rows</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row, ri) => (
                <tr key={ri} className="border-b border-green-100 last:border-0 hover:bg-green-100 dark:border-green-800 dark:hover:bg-green-800/40">
                  <td className="px-4 py-1.5 font-semibold text-green-900 whitespace-nowrap dark:text-green-100">{row.hoscode}</td>
                  <td className="px-4 py-1.5 text-green-800 whitespace-nowrap dark:text-green-200">{row.hosname || "-"}</td>
                  <td className="px-4 py-1.5 text-right tabular-nums font-medium text-green-800 whitespace-nowrap dark:text-green-200">{row.count.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="overflow-auto rounded-xl border border-green-200 bg-white shadow-sm dark:border-green-800 dark:bg-green-950">
        {rows.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-green-600">ไม่พบข้อมูล</div>
        ) : (
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-green-50/95 backdrop-blur dark:bg-green-900/95">
              {/* Filter row */}
              {hasHoscode && (
                <tr>
                  <th className="border-b border-green-100 bg-white px-2 py-1 dark:border-green-800 dark:bg-green-950" colSpan={cols.length}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-green-600 dark:text-green-400">กรอง hoscode:</span>
                      <select
                        value={selectedHos}
                        onChange={handleHosChange}
                        className="cursor-pointer rounded-md border border-green-200 bg-white px-2 py-0.5 text-[11px] text-green-900 focus:outline-none dark:border-green-700 dark:bg-green-900 dark:text-green-100"
                      >
                        <option value="">ทุก รพ.</option>
                        {hospitals.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      {selectedHos && (
                        <button
                          onClick={() => router.push(`/admin?table=${selectedTable}`)}
                          className="cursor-pointer rounded-md border border-green-200 bg-white px-2 py-0.5 text-[11px] text-green-600 hover:bg-green-50 dark:border-green-700 dark:bg-green-900"
                        >
                          ล้าง
                        </button>
                      )}
                    </div>
                  </th>
                </tr>
              )}
              <tr>
                {cols.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="cursor-pointer select-none border-b border-green-200 px-3 py-2 text-left font-semibold text-green-700 whitespace-nowrap hover:bg-green-100 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-800/50"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col}
                      <SortIcon col={col} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, ri) => (
                <tr
                  key={ri}
                  className="border-b border-green-100 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-900/40"
                >
                  {cols.map((col) => {
                    const val = row[col];
                    const display = formatValue(val);
                    return (
                      <td
                        key={col}
                        className="px-3 py-1.5 text-green-900 whitespace-nowrap dark:text-green-100"
                      >
                        {display === "" ? (
                          <span className="text-green-300 dark:text-green-600">-</span>
                        ) : (
                          display
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-green-700 dark:text-green-300">
          <span>
            แถว {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} จาก {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="cursor-pointer inline-flex h-7 w-7 items-center justify-center rounded-lg border border-green-200 bg-white hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-green-700 dark:bg-green-900"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((i) => Math.abs(i - safePage) <= 2)
              .map((i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`cursor-pointer inline-flex h-7 min-w-[28px] items-center justify-center rounded-lg border px-1.5 text-xs font-medium transition-colors ${
                    i === safePage
                      ? "border-green-700 bg-green-700 text-white dark:border-green-400 dark:bg-green-400 dark:text-green-950"
                      : "border-green-200 bg-white hover:bg-green-50 dark:border-green-700 dark:bg-green-900 dark:hover:bg-green-800"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage === totalPages - 1}
              className="cursor-pointer inline-flex h-7 w-7 items-center justify-center rounded-lg border border-green-200 bg-white hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-green-700 dark:bg-green-900"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
