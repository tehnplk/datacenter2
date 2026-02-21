import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import YearSelect from "@/components/dashboard/YearSelect";
import SpLevelBadge from "@/components/dashboard/SpLevelBadge";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

type UtilRow = {
  hoscode: string;
  op_year: number;
  total_cases: number;
  total_or_hours: number;
  avg_min_per_case: number;
  actual_or_days: number;
  util_pct: number;
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

function fmtPct(n: number | null | undefined) {
  if (n == null) return "-";
  return `${Number(n).toFixed(1)}%`;
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

export default async function Page({
  searchParams,
}: {
  searchParams?: { year?: string } | Promise<{ year?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});

  const years = await dbQuery<{ op_year: number }>(
    `SELECT DISTINCT op_year FROM public.transform_sync_or_utilization_rate ORDER BY op_year DESC`,
  ).then((r) => r.map((x) => x.op_year));

  const selectedYear = toInt(sp.year) ?? (years.length ? years[0] : new Date().getFullYear());

  const [hosList, rows, meta] = await Promise.all([
    dbQuery<HosRow>(
      `SELECT hoscode, hosname, hosname_short, size_level FROM public.c_hos ORDER BY hosname ASC`,
    ),
    dbQuery<UtilRow>(
      `SELECT
         s.hoscode,
         s.op_year,
         s.total_cases,
         s.total_or_hours::float8 AS total_or_hours,
         s.avg_min_per_case::float8 AS avg_min_per_case,
         s.actual_or_days,
         s.util_pct::float8 AS util_pct,
         s.d_update::text AS d_update
       FROM public.transform_sync_or_utilization_rate s
       WHERE s.op_year = $1
       ORDER BY s.util_pct DESC NULLS LAST`,
      [selectedYear],
    ),
    dbQuery<{ last_update: string | null }>(
      `SELECT MAX(d_update)::text AS last_update
       FROM public.transform_sync_or_utilization_rate
       WHERE op_year = $1`,
      [selectedYear],
    ).then((r) => r[0]),
  ]);

  const rowMap = new Map(rows.map((r) => [r.hoscode, r]));

  const allHos = hosList.filter((h) => rowMap.has(h.hoscode));

  return (
    <MetricPage
      title="OR: อัตราการใช้ห้องผ่าตัด"
      description="อัตราการใช้ห้องผ่าตัด (Utilization Rate) แยกรายโรงพยาบาล"
      showTopCards={false}
      contentWidth="wide"
      hideHeader
    >
      <div className="flex flex-wrap items-center justify-end gap-3">
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
            <table className="w-full border-separate border-spacing-0 text-xs">
              <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
                <tr>
                  <Th className="w-10 text-center">ลำดับ</Th>
                  <Th className="min-w-[160px] text-left">โรงพยาบาล</Th>
                  <Th className="w-28 text-right">เคสผ่าตัด</Th>
                  <Th className="w-28 text-right">ชม. ใช้งาน</Th>
                  <Th className="w-32 text-right">เฉลี่ย นาที/เคส</Th>
                  <Th className="w-28 text-right">วันผ่าตัด</Th>
                  <Th className="w-28 text-right font-bold text-zinc-700 dark:text-zinc-100">Util %</Th>
                </tr>
              </thead>
              <tbody>
                {allHos.map((h, idx) => {
                  const r = rowMap.get(h.hoscode)!;
                  const utilPct = r.util_pct;
                  const utilColor =
                    utilPct >= 80
                      ? "text-green-600 dark:text-green-400"
                      : utilPct >= 60
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
                      <Td className="text-right tabular-nums">{fmt(r.total_cases)}</Td>
                      <Td className="text-right tabular-nums">{fmt(r.total_or_hours, 1)}</Td>
                      <Td className="text-right tabular-nums">{fmt(r.avg_min_per_case, 1)}</Td>
                      <Td className="text-right tabular-nums">{fmt(r.actual_or_days)}</Td>
                      <Td className={`text-right tabular-nums font-bold ${utilColor}`}>
                        {fmtPct(utilPct)}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t border-zinc-200/70 bg-white px-3 py-1.5 text-right text-[11px] text-zinc-400 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-500">
          ข้อมูลจากตาราง: <span className="font-mono">transform_sync_or_utilization_rate</span>
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
