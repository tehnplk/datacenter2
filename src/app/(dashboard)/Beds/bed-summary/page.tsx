import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import YearSelect from "@/components/dashboard/YearSelect";
import SpLevelBadge from "@/components/dashboard/SpLevelBadge";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

const BED_GROUPS: Record<string, string> = {
  "1": "Ward",
  "2": "ICU",
  "3": "SEMI ICU",
  "4": "Stroke Unit",
  "5": "Burn Unit",
  "6": "เตียงอื่นๆ",
  "7": "ห้องความดันลบ",
};

const GROUP_ORDER = ["1", "2", "3", "4", "5", "6", "7"];

type OccRow = {
  hoscode: string;
  bed_group: string;
  yr: number;
  m: number;
  patient_days: number;
  bed_count: number;
};

type HosRow = {
  hoscode: string;
  hosname: string;
  hosname_short: string | null;
  size_level: string | null;
};

const TH_MONTHS = ["มค","กพ","มีค","เมย","พค","มิย","กค","สค","กย","ตค","พย","ธค"] as const;

function fmtPct(n: number | null | undefined) {
  if (n == null || isNaN(n)) return "-";
  return `${n.toFixed(1)}%`;
}

function pctColor(pct: number | null) {
  if (pct == null) return "";
  if (pct >= 80) return "text-green-600 dark:text-green-400 font-bold";
  if (pct >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-500 dark:text-red-400";
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
  searchParams?: { year?: string; group?: string } | Promise<{ year?: string; group?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});
  const selectedGroup = GROUP_ORDER.includes(sp.group ?? "") ? sp.group! : "1";

  const years = await dbQuery<{ yr: number }>(
    `SELECT DISTINCT extract(year from calc_start)::int AS yr
     FROM public.transform_sync_bed_an_occupancy
     ORDER BY yr DESC`,
  ).then((r) => r.map((x) => x.yr));

  const selectedYear = toInt(sp.year) ?? (years.length ? years[0] : new Date().getFullYear());

  const [hosList, rows, meta] = await Promise.all([
    dbQuery<HosRow>(
      `SELECT hoscode, hosname, hosname_short, size_level FROM public.c_hos ORDER BY hosname ASC`,
    ),
    dbQuery<OccRow>(
      `WITH bed_counts AS (
         SELECT hoscode, substring(export_code, 4, 1) AS bed_group, count(*) AS bed_count
         FROM public.transform_sync_bed_type_all
         WHERE substring(export_code, 4, 1) = $2
         GROUP BY hoscode, bed_group
       ),
       occ AS (
         SELECT hoscode,
                substring(export_code, 4, 1) AS bed_group,
                extract(year from calc_start)::int AS yr,
                extract(month from calc_start)::int AS m,
                sum(overlap_days)::int AS patient_days
         FROM public.transform_sync_bed_an_occupancy
         WHERE extract(year from calc_start) = $1
           AND substring(export_code, 4, 1) = $2
         GROUP BY hoscode, bed_group, yr, m
       )
       SELECT o.hoscode, o.bed_group, o.yr, o.m, o.patient_days,
              coalesce(b.bed_count, 0)::int AS bed_count
       FROM occ o
       LEFT JOIN bed_counts b ON b.hoscode = o.hoscode
       ORDER BY o.hoscode, o.m`,
      [selectedYear, selectedGroup],
    ),
    dbQuery<{ last_update: string | null }>(
      `SELECT MAX(d_update)::text AS last_update FROM public.transform_sync_bed_an_occupancy`,
    ).then((r) => r[0]),
  ]);

  const hosMap = new Map(hosList.map((h) => [h.hoscode, h]));

  // build map: hoscode -> month -> { patient_days, bed_count }
  type MonthData = { patient_days: number; bed_count: number };
  const dataMap = new Map<string, Map<number, MonthData>>();
  for (const r of rows) {
    if (!dataMap.has(r.hoscode)) dataMap.set(r.hoscode, new Map());
    dataMap.get(r.hoscode)!.set(r.m, { patient_days: r.patient_days, bed_count: r.bed_count });
  }

  const activeHosList = hosList.filter((h) => dataMap.has(h.hoscode));

  return (
    <MetricPage
      title="Beds: อัตราครองเตียง"
      description="อัตราครองเตียงรายเดือน แยกตามประเภทเตียง (หลักที่ 4 ของรหัสมาตรฐาน 6 หลัก)"
      showTopCards={false}
      contentWidth="full"
      hideHeader
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Group tabs */}
        <div className="flex flex-wrap gap-1">
          {GROUP_ORDER.map((g) => {
            const isActive = g === selectedGroup;
            const params = new URLSearchParams({ group: g, year: String(selectedYear) });
            return (
              <a
                key={g}
                href={`?${params.toString()}`}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-green-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                {BED_GROUPS[g]}
              </a>
            );
          })}
        </div>
        <YearSelect years={years} value={selectedYear} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
          <div className="font-semibold text-zinc-700 dark:text-zinc-200">
            {selectedGroup} = {BED_GROUPS[selectedGroup]} • ปี {selectedYear + 543}
          </div>
          <div>อัปเดตเมื่อ: {meta?.last_update ?? "-"} • {activeHosList.length} โรงพยาบาล</div>
        </div>

        <div className="overflow-auto bg-white dark:bg-zinc-950">
          {activeHosList.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">ไม่พบข้อมูล</div>
          ) : (
            <table className="w-full border-separate border-spacing-0 text-xs">
              <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
                <tr>
                  <Th className="w-8 text-center" rowSpan={2}>ลำดับ</Th>
                  <Th className="text-left" rowSpan={2}>โรงพยาบาล</Th>
                  <Th className="w-14 text-right border-r border-zinc-200/70 dark:border-white/10" rowSpan={2}>เตียง</Th>
                  {TH_MONTHS.map((m) => (
                    <Th key={m} className="text-center border-l border-zinc-200/70 dark:border-white/10" colSpan={3}>{m}</Th>
                  ))}
                </tr>
                <tr>
                  {TH_MONTHS.map((m) => (
                    <React.Fragment key={m}>
                      <Th className="text-right w-14 border-l border-zinc-200/70 dark:border-white/10 font-normal text-zinc-400">Bed Days</Th>
                      <Th className="text-right w-14 font-normal text-zinc-400">Occup Days</Th>
                      <Th className="text-right w-12 font-bold text-zinc-600 dark:text-zinc-200">Rate</Th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeHosList.map((h, idx) => {
                  const byMonth = dataMap.get(h.hoscode)!;
                  return (
                    <tr key={h.hoscode} className="odd:bg-white even:bg-zinc-50/60 dark:odd:bg-zinc-950 dark:even:bg-zinc-900">
                      <Td className="text-center tabular-nums text-zinc-400">{idx + 1}</Td>
                      <Td className="font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <SpLevelBadge level={h.size_level} />
                          {displayHosName(h.hosname, h.hosname_short)}
                        </span>
                      </Td>
                      <Td className="text-right tabular-nums font-semibold text-zinc-700 dark:text-zinc-200 border-r border-zinc-200/70 dark:border-white/10">
                        {(() => { const first = [...byMonth.values()][0]; return first ? first.bed_count.toLocaleString("th-TH") : "-"; })()}
                      </Td>
                      {TH_MONTHS.map((_, mi) => {
                        const m = mi + 1;
                        const d = byMonth.get(m);
                        const daysInMonth = new Date(selectedYear, m, 0).getDate();
                        const availDays = d ? d.bed_count * daysInMonth : null;
                        const pct = d && availDays ? (d.patient_days / availDays) * 100 : null;
                        return (
                          <React.Fragment key={m}>
                            <Td className="text-right tabular-nums border-l border-zinc-200/70 dark:border-white/10 text-zinc-500">
                              {availDays != null ? availDays.toLocaleString("th-TH") : "-"}
                            </Td>
                            <Td className="text-right tabular-nums text-zinc-500">
                              {d ? d.patient_days.toLocaleString("th-TH") : "-"}
                            </Td>
                            <Td className={`text-right tabular-nums ${pctColor(pct)}`}>
                              {fmtPct(pct)}
                            </Td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="border-t border-zinc-200/70 bg-white px-3 py-1.5 text-right text-[11px] text-zinc-400 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-500">
          ข้อมูลจากตาราง: <span className="font-mono">transform_sync_bed_an_occupancy</span>, <span className="font-mono">transform_sync_bed_type_all</span>
        </div>
      </div>
    </MetricPage>
  );
}

function Th({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`border-b border-zinc-200/70 px-2 py-2 text-xs font-semibold text-zinc-600 dark:border-white/10 dark:text-zinc-300 ${className ?? ""}`}
      {...props}
    >
      {children}
    </th>
  );
}

function Td({ className, children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={`border-b border-zinc-200/70 px-2 py-1.5 text-zinc-800 dark:border-white/10 dark:text-zinc-100 ${className ?? ""}`}
      {...props}
    >
      {children}
    </td>
  );
}
