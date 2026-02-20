import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import DateRangeSelect from "@/components/dashboard/DateRangeSelect";
import SpLevelBadge from "@/components/dashboard/SpLevelBadge";
import { dbQuery } from "@/lib/db";
import BedCodeMapModal from "./BedCodeMapModal";

export const dynamic = "force-dynamic";

const DEFAULT_DATE_FORMAT = "th-TH";
const DEFAULT_START_DATE = "2026-01-01";
const DATE_RANGE_LABEL = "ช่วงวันที่";

type TabKey = "semi01" | "semi02" | "semi03" | "semi_wrong" | "icu";

type TabDef = {
  key: TabKey;
  label: string;
  digit4: string;
  digit56: string[] | null;
  isWrong?: boolean;
  badgeColor?: string;
};

const TABS: TabDef[] = [
  { key: "semi01", label: "SEMI ICU ทั่วไป",          digit4: "3", digit56: ["01"], badgeColor: "bg-blue-100 text-blue-800" },
  { key: "semi02", label: "SEMI ICU ห้องความดันลบ",   digit4: "3", digit56: ["02"], badgeColor: "bg-purple-100 text-purple-800" },
  { key: "semi03", label: "SEMI ICU อื่นๆ",            digit4: "3", digit56: ["03"], badgeColor: "bg-teal-100 text-teal-800" },
  { key: "semi_wrong", label: "SEMI ICU map ผิด",      digit4: "3", digit56: null, isWrong: true, badgeColor: "bg-red-100 text-red-800" },
  { key: "icu",   label: "ICU",                        digit4: "2", digit56: null, badgeColor: "bg-green-100 text-green-800" },
];

const VALID_SEMI_D56 = ["01", "02", "03"];

type BedOccupancyRow = {
  hoscode: string;
  hosname: string | null;
  hosname_short: string | null;
  sp_level: string | null;
  export_code: string;
  bed_type_name: string | null;
  bed_type_mapped: boolean;
  total_beds: number;
  days_in_period: number;
  available_bed_days: number;
  total_patient_days: number;
  occupancy_rate_pct: number | null;
};

function fmtNumber(n: number, digits = 0) {
  return new Intl.NumberFormat(DEFAULT_DATE_FORMAT, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

function formatBedCode(code: string | null) {
  if (!code) return "-";
  return code.slice(-6);
}

function ensureDateString(value: string | Date | null | undefined) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return value.toISOString().slice(0, 10);
}

function buildWhereClause(tab: TabDef): string {
  if (tab.isWrong) {
    return `substring(export_code, 4, 1) = '3'
            AND substring(export_code, 5, 2) NOT IN ('01','02','03')`;
  }
  if (tab.digit56) {
    return `substring(export_code, 4, 1) = '${tab.digit4}'
            AND substring(export_code, 5, 2) = ANY(ARRAY[${tab.digit56.map((s) => `'${s}'`).join(",")}])`;
  }
  return `substring(export_code, 4, 1) = '${tab.digit4}'`;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { start?: string; end?: string; tab?: string } | Promise<{ start?: string; end?: string; tab?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});
  const tabKeys: TabKey[] = ["semi01", "semi02", "semi03", "semi_wrong", "icu"];
  const selectedTab: TabKey = tabKeys.includes(sp.tab as TabKey) ? (sp.tab as TabKey) : "semi01";
  const activeTab = TABS.find((t) => t.key === selectedTab)!;
  const whereClause = buildWhereClause(activeTab);

  const dateBounds = await dbQuery<{ min_date: string | Date | null; max_date: string | Date | null }>(
    `SELECT min(calc_start)::date AS min_date, max(calc_end)::date AS max_date
     FROM public.transform_sync_bed_an_occupancy`,
  ).then((r) => r[0]);

  const fallbackStart = DEFAULT_START_DATE;
  const fallbackEnd = ensureDateString(dateBounds?.max_date) ?? DEFAULT_START_DATE;
  const selectedStart = ensureDateString(sp.start) ?? fallbackStart;
  const selectedEnd = ensureDateString(sp.end) ?? fallbackEnd;
  const minDate = ensureDateString(dateBounds?.min_date);
  const maxDate = ensureDateString(dateBounds?.max_date);

  const [rows, meta] = await Promise.all([
    dbQuery<BedOccupancyRow>(
      `
      WITH bed_counts AS (
        SELECT hoscode, export_code, count(*)::int AS total_beds
        FROM public.transform_sync_bed_type_all
        WHERE ${whereClause}
        GROUP BY hoscode, export_code
      ),
      occ_counts AS (
        SELECT
          hoscode,
          export_code,
          sum(greatest(0, (least(calc_end, $2::date) - greatest(calc_start, $1::date) + 1)))::int AS total_patient_days
        FROM public.transform_sync_bed_an_occupancy
        WHERE calc_end >= $1::date
          AND calc_start <= $2::date
          AND ${whereClause}
        GROUP BY hoscode, export_code
      ),
      all_export_codes AS (
        SELECT DISTINCT export_code FROM bed_counts
        UNION
        SELECT DISTINCT export_code FROM occ_counts
      ),
      all_combos AS (
        SELECT h.hoscode, h.hosname, h.hosname_short, h.sp_level, ae.export_code
        FROM public.c_hos h
        CROSS JOIN all_export_codes ae
      ),
      detail_rows AS (
        SELECT
          ac.hoscode,
          ac.hosname,
          ac.hosname_short,
          ac.sp_level,
          ac.export_code,
          cb.name AS bed_type_name,
          (cb.code IS NOT NULL) AS bed_type_mapped,
          coalesce(bc.total_beds, 0)::int AS total_beds,
          ($2::date - $1::date + 1)::int AS days_in_period,
          (coalesce(bc.total_beds, 0) * ($2::date - $1::date + 1))::int AS available_bed_days,
          coalesce(oc.total_patient_days, 0)::int AS total_patient_days,
          round(
            coalesce(oc.total_patient_days, 0) * 100.0
            / nullif(coalesce(bc.total_beds, 0) * ($2::date - $1::date + 1), 0),
            2
          ) AS occupancy_rate_pct
        FROM all_combos ac
        LEFT JOIN bed_counts bc ON bc.hoscode = ac.hoscode AND bc.export_code = ac.export_code
        LEFT JOIN occ_counts oc ON oc.hoscode = ac.hoscode AND oc.export_code = ac.export_code
        LEFT JOIN public.c_bed_type_std cb ON cb.code = right(ac.export_code, 3)
      )
      SELECT * FROM detail_rows
      WHERE NOT ${activeTab.isWrong ? "true" : "false"} OR (total_beds > 0 OR total_patient_days > 0)
      ORDER BY (total_beds > 0) DESC, hosname ASC NULLS LAST, hoscode ASC, export_code ASC
      `,
      [selectedStart, selectedEnd],
    ),
    dbQuery<{ last_update: string | null }>(
      `SELECT max(d_update)::text AS last_update FROM public.transform_sync_bed_an_occupancy`,
    ).then((r) => r[0]),
  ]);

  return (
    <MetricPage
      title="ICU: อัตราครองเตียง ICU & semi ICU"
      description="อัตราครองเตียง ICU และ semi ICU ของแต่ละโรงพยาบาล"
      showTopCards={false}
      contentWidth="wide"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BedCodeMapModal />
        <DateRangeSelect start={selectedStart} end={selectedEnd} min={minDate} max={maxDate} />
      </div>

      {/* Tabs */}
      <div className="mt-4 flex flex-wrap gap-1 border-b border-zinc-200/70 dark:border-white/10">
        {TABS.map((tab) => {
          const active = tab.key === selectedTab;
          const params = new URLSearchParams({ start: selectedStart, end: selectedEnd, tab: tab.key });
          return (
            <a
              key={tab.key}
              href={`?${params.toString()}`}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg border border-b-0 transition-colors whitespace-nowrap ${
                active
                  ? "border-zinc-200/70 bg-white text-zinc-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50"
                  : tab.isWrong
                    ? "border-transparent text-red-500 hover:text-red-700 dark:text-red-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {tab.isWrong ? `⚠ ${tab.label}` : tab.label}
            </a>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-b-xl rounded-tr-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
          <div className="whitespace-nowrap">
            {DATE_RANGE_LABEL}: {selectedStart} ถึง {selectedEnd} • อัปเดตเมื่อ: {meta?.last_update ?? "-"}
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${activeTab.badgeColor ?? ""}`}>
            {activeTab.label}
          </span>
        </div>

        <div className="overflow-auto bg-white dark:bg-zinc-950">
          <table className="min-w-[1000px] w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
              <tr>
                <Th className="w-[60px]">ลำดับ</Th>
                <Th className="w-[240px]">ชื่อ รพ.</Th>
                <Th className="w-[140px]">รหัสเตียง 6 หลัก</Th>
                <Th className="w-[220px]">ชื่อเตียง</Th>
                <Th className="w-[100px] text-right">จำนวนเตียง</Th>
                <Th className="w-[110px] text-right">Bed-days</Th>
                <Th className="w-[120px] text-right">Occup-days</Th>
                <Th className="w-[110px] text-right">Occup Rate</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const isWrongRow = activeTab.isWrong || !r.bed_type_mapped;
                return (
                  <tr
                    key={`${r.hoscode}-${r.export_code}-${idx}`}
                    className={isWrongRow ? "bg-red-50 dark:bg-red-950/40" : ""}
                  >
                    <Td className="text-right tabular-nums">{idx + 1}</Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5">
                        <SpLevelBadge level={r.sp_level} />
                        {r.hosname_short?.trim() || r.hosname || r.hoscode}
                      </span>
                    </Td>
                    <Td className="font-mono">{formatBedCode(r.export_code)}</Td>
                    <Td>
                      {!r.bed_type_mapped
                        ? <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                            ⚠ map ผิด <span className="font-mono text-[11px]">({formatBedCode(r.export_code).slice(-3)})</span>
                          </span>
                        : r.bed_type_name ?? "-"}
                    </Td>
                    <Td className="text-right tabular-nums">{r.total_beds > 0 ? fmtNumber(r.total_beds) : "-"}</Td>
                    <Td className="text-right tabular-nums">{r.available_bed_days > 0 ? fmtNumber(r.available_bed_days) : "-"}</Td>
                    <Td className="text-right tabular-nums">{r.total_patient_days > 0 ? fmtNumber(r.total_patient_days) : "-"}</Td>
                    <Td className="text-right tabular-nums font-bold">
                      {r.occupancy_rate_pct != null ? `${fmtNumber(r.occupancy_rate_pct, 2)}%` : "-"}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-200/70 bg-white px-3 py-1.5 text-right text-[11px] text-zinc-400 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-500">
          แสดง {rows.filter(r => r.total_beds > 0 || r.total_patient_days > 0).length} รพ. ที่มีข้อมูล •
          ข้อมูลจากตาราง: <span className="font-mono">transform_sync_bed_type_all / transform_sync_bed_an_occupancy</span>
        </div>
      </div>
    </MetricPage>
  );
}

function Th({ className, children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
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
