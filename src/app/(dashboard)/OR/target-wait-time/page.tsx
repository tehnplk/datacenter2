import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import YearSelect from "@/components/dashboard/YearSelect";
import SpLevelBadge from "@/components/dashboard/SpLevelBadge";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type WaitRow = {
  hoscode: string;
  visit_year: number;
  total_appointments: number;
  avg_wait_days: number;
  min_wait_days: number;
  max_wait_days: number;
  avg_wait_weeks: number;
  d_update: string | null;
};

type HosRow = {
  hoscode: string;
  hosname: string;
  hosname_short: string | null;
  size_level: string | null;
};

function fmt(n: number | null | undefined, digits = 0) {
  if (n == null) return "-";
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function displayHosName(name?: string | null, shortName?: string | null) {
  const s = shortName?.trim();
  if (s) return s;
  if (!name) return "-";
  const raw = name.trim();
  if (raw.includes("สมเด็จพระยุพราชนครไทย")) return "รพร.นครไทย";
  if (raw.includes("พุทธชินราช")) return "รพศ.พุทธชินราช";
  return raw.replace(/^โรงพยาบาล/, "รพ.");
}

function toInt(v: string | undefined) {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return isFinite(n) ? n : undefined;
}

const TABS = [
  { key: "cataract", label: "ต้อกระจก", table: "transform_sync_waiting_time_cataract" },
  { key: "hernia",   label: "ไส้เลื่อน", table: "transform_sync_waiting_time_hernia" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function Page({
  searchParams,
}: {
  searchParams?: { year?: string; tab?: string } | Promise<{ year?: string; tab?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});
  const activeTab: TabKey = sp.tab === "hernia" ? "hernia" : "cataract";
  const activeTable = TABS.find((t) => t.key === activeTab)!.table;

  const years = await dbQuery<{ visit_year: number }>(
    `SELECT DISTINCT visit_year FROM public.transform_sync_waiting_time_cataract
     UNION
     SELECT DISTINCT visit_year FROM public.transform_sync_waiting_time_hernia
     ORDER BY visit_year DESC`,
  ).then((r) => r.map((x) => x.visit_year));

  const selectedYear = toInt(sp.year) ?? (years.length ? years[0] : new Date().getFullYear());

  const [hosList, rows, meta] = await Promise.all([
    dbQuery<HosRow>(
      `SELECT hoscode, hosname, hosname_short, size_level FROM public.c_hos ORDER BY hosname ASC`,
    ),
    dbQuery<WaitRow>(
      `SELECT
         s.hoscode,
         s.visit_year,
         s.total_appointments,
         s.avg_wait_days::float8 AS avg_wait_days,
         s.min_wait_days,
         s.max_wait_days,
         s.avg_wait_weeks::float8 AS avg_wait_weeks,
         s.d_update::text AS d_update
       FROM public.${activeTable} s
       WHERE s.visit_year = $1
       ORDER BY s.avg_wait_days ASC NULLS LAST`,
      [selectedYear],
    ),
    dbQuery<{ last_update: string | null }>(
      `SELECT MAX(d_update)::text AS last_update FROM public.${activeTable} WHERE visit_year = $1`,
      [selectedYear],
    ).then((r) => r[0]),
  ]);

  const rowMap = new Map(rows.map((r) => [r.hoscode, r]));
  const allHos = hosList.filter((h) => rowMap.has(h.hoscode));

  return (
    <MetricPage
      title="OR: ระยะเวลารอคอยผ่าตัด (โรคเป้าหมาย)"
      description="ระยะเวลารอคอยผ่าตัดในกลุ่มโรคเป้าหมาย แยกรายโรงพยาบาล"
      showTopCards={false}
      contentWidth="wide"
      hideHeader
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map((t) => {
            const isActive = t.key === activeTab;
            const params = new URLSearchParams({ tab: t.key, year: String(selectedYear) });
            return (
              <a
                key={t.key}
                href={`?${params.toString()}`}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-green-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {t.label}
              </a>
            );
          })}
        </div>
        <YearSelect years={years} value={selectedYear} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
          <div>ปี: {selectedYear + 543} • อัปเดตเมื่อ: {meta?.last_update ?? "-"}</div>
          <div>{allHos.length} โรงพยาบาล</div>
        </div>

        <div className="overflow-auto bg-white dark:bg-zinc-950">
          {allHos.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
              ไม่พบข้อมูล
            </div>
          ) : (
            <table className="w-full max-w-4xl border-separate border-spacing-0 text-xs">
              <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
                <tr>
                  <Th className="w-10 text-center">ลำดับ</Th>
                  <Th className="text-left">โรงพยาบาล</Th>
                  <Th className="w-28 text-right">นัดหมาย</Th>
                  <Th className="w-28 text-right font-bold text-zinc-700 dark:text-zinc-100">เฉลี่ย (วัน)</Th>
                  <Th className="w-28 text-right">เฉลี่ย (สัปดาห์)</Th>
                  <Th className="w-24 text-right">น้อยสุด</Th>
                  <Th className="w-24 text-right">มากสุด</Th>
                </tr>
              </thead>
              <tbody>
                {allHos.map((h, idx) => {
                  const r = rowMap.get(h.hoscode)!;
                  const avgDays = r.avg_wait_days;
                  const dayColor =
                    avgDays <= 30
                      ? "text-green-600 dark:text-green-400"
                      : avgDays <= 90
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400";
                  return (
                    <tr key={h.hoscode} className="odd:bg-white even:bg-zinc-50/60 dark:odd:bg-zinc-950 dark:even:bg-zinc-900">
                      <Td className="text-center tabular-nums text-zinc-400">{idx + 1}</Td>
                      <Td className="font-medium">
                        <span className="inline-flex items-center gap-1.5">
                          <SpLevelBadge level={h.size_level} />
                          {displayHosName(h.hosname, h.hosname_short)}
                        </span>
                      </Td>
                      <Td className="text-right tabular-nums">{fmt(r.total_appointments)}</Td>
                      <Td className={`text-right tabular-nums font-bold ${dayColor}`}>{fmt(r.avg_wait_days, 1)}</Td>
                      <Td className="text-right tabular-nums">{fmt(r.avg_wait_weeks, 1)}</Td>
                      <Td className="text-right tabular-nums">{fmt(r.min_wait_days)}</Td>
                      <Td className="text-right tabular-nums">{fmt(r.max_wait_days)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t border-zinc-200/70 bg-white px-3 py-1.5 text-right text-[11px] text-zinc-400 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-500">
          ข้อมูลจากตาราง: <span className="font-mono">{activeTable}</span>
        </div>
      </div>
    </MetricPage>
  );
}

function Th({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`border-b border-zinc-200/70 px-3 py-2 text-xs font-semibold text-zinc-600 dark:border-white/10 dark:text-zinc-300 ${className ?? ""}`}
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
