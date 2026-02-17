import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import DateRangeSelect from "@/components/dashboard/DateRangeSelect";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

const DEFAULT_DATE_FORMAT = "th-TH";
const BED_TYPE_CODES = [
  "201",
  "202",
  "203",
  "204",
  "205",
  "206",
  "207",
  "208",
  "209",
  "210",
  "211",
  "301",
  "302",
] as const;

const DATE_RANGE_LABEL = "ช่วงวันที่";
const DEFAULT_START_DATE = "2026-01-01";

type BedOccupancyRow = {
  hoscode: string;
  hosname: string | null;
  export_code: string;
  bed_type_name: string | null;
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

function isDate(value: string | undefined): value is string {
  if (!value) return false;
  return !Number.isNaN(Date.parse(value));
}

function shortHosName(name: string) {
  const raw = name.trim();
  if (raw.includes("สมเด็จพระยุพราชนครไทย")) return "รพร.นครไทย";
  if (raw.includes("พุทธชินราช")) return "รพศ.พุทธชินราช";
  return raw.replace(/^โรงพยาบาล\s*/u, "รพ.");
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

export default async function Page({
  searchParams,
}: {
  searchParams?: { start?: string; end?: string } | Promise<{ start?: string; end?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});
  const dateBounds = await dbQuery<{ min_date: string | Date | null; max_date: string | Date | null }>(
    `
      select
        min(calc_start)::date as min_date,
        max(calc_end)::date as max_date
      from public.transform_sync_bed_an_occupancy;
      `,
  ).then((r) => r[0]);

  const fallbackStart = DEFAULT_START_DATE;
  const fallbackEnd = ensureDateString(dateBounds?.max_date) ?? DEFAULT_START_DATE;
  const selectedStart = ensureDateString(sp.start) ?? fallbackStart;
  const selectedEnd = ensureDateString(sp.end) ?? fallbackEnd;
  const minDate = ensureDateString(dateBounds?.min_date);
  const maxDate = ensureDateString(dateBounds?.max_date);

  const bedTypeParams = BED_TYPE_CODES;

  const [rows, meta] = await Promise.all([
    dbQuery<BedOccupancyRow>(
      `
      with bed_counts as (
        select hoscode, export_code, count(*)::int as total_beds
        from public.transform_sync_bed_type_all
        where right(export_code, 3) = any($3::text[])
        group by hoscode, export_code
      ),
      occ_counts as (
        select
          hoscode,
          export_code,
          sum(
            greatest(
              0,
              (least(calc_end, $2::date) - greatest(calc_start, $1::date) + 1)
            )
          )::int as total_patient_days
        from public.transform_sync_bed_an_occupancy
        where calc_end >= $1::date
          and calc_start <= $2::date
          and right(export_code, 3) = any($3::text[])
        group by hoscode, export_code
      ),
      detail_rows as (
        select
          bc.hoscode,
          h.hosname,
          bc.export_code,
          cb.name as bed_type_name,
          bc.total_beds,
          ($2::date - $1::date + 1)::int as days_in_period,
          (bc.total_beds * ($2::date - $1::date + 1))::int as available_bed_days,
          coalesce(oc.total_patient_days, 0)::int as total_patient_days,
          round(
            coalesce(oc.total_patient_days, 0) * 100.0
            / nullif(bc.total_beds * ($2::date - $1::date + 1), 0),
            2
          ) as occupancy_rate_pct
        from bed_counts bc
        left join occ_counts oc on oc.hoscode = bc.hoscode and oc.export_code = bc.export_code
        left join public.c_bed_type_std cb on cb.code = right(bc.export_code, 3)
        left join public.c_hos h on h.hoscode = bc.hoscode
      )
      select * from detail_rows
      order by hosname asc nulls last, hoscode asc, export_code asc;
      `,
      [selectedStart, selectedEnd, bedTypeParams],
    ),
    dbQuery<{ row_count: number; last_update: string | null }>(
      `
      select
        (select count(*)::int from (
          select * from public.transform_sync_bed_type_all
          where right(export_code, 3) = any($1::text[])
        ) s) as row_count,
        (select max(d_update)::text from public.transform_sync_bed_an_occupancy) as last_update;
      `,
      [bedTypeParams],
    ).then((r) => r[0]),
  ]);

  return (
    <MetricPage
      title="ICU: อัตราครองเตียง ICU & semi ICU"
      description="อัตราครองเตียง ICU และ semi ICU ของแต่ละโรงพยาบาล"
      showTopCards={false}
      contentWidth="wide"
    >
      <div className="flex flex-wrap items-center justify-end gap-3">
        <DateRangeSelect start={selectedStart} end={selectedEnd} min={minDate} max={maxDate} />
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30">
          Connected
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
          <div className="whitespace-nowrap">
            {DATE_RANGE_LABEL}: {selectedStart} ถึง {selectedEnd} • อัปเดตเมื่อ: {meta?.last_update ?? "-"}
          </div>
          <div className="whitespace-nowrap text-right">
            ข้อมูลจากตาราง: <span className="font-mono">transform_sync_bed_type_all / transform_sync_bed_an_occupancy</span>
          </div>
        </div>

        <div className="overflow-auto bg-white dark:bg-zinc-950">
          <table className="min-w-[1000px] w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-zinc-950/90">
              <tr>
                <Th className="sticky left-0 z-20 w-[72px] bg-white/95 dark:bg-zinc-950/95">ลำดับ</Th>
                <Th className="sticky left-[72px] z-20 w-[260px] bg-white/95 dark:bg-zinc-950/95">ชื่อ รพ.</Th>
                <Th className="w-[160px]">รหัสเตียง 6 หลัก</Th>
                <Th className="w-[220px]">ชื่อเตียง</Th>
                <Th className="w-[120px] text-right">จำนวนเตียง</Th>
                <Th className="w-[130px] text-right">Bed-days</Th>
                <Th className="w-[140px] text-right">Patient-days</Th>
                <Th className="w-[120px] text-right">Occupancy %</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={`${r.hoscode}-${r.export_code}-${idx}`}>
                  <Td className="sticky left-0 z-10 bg-white/95 text-right tabular-nums dark:bg-zinc-950/95">
                    {idx + 1}
                  </Td>
                  <Td className="sticky left-[72px] z-10 bg-white/95 dark:bg-zinc-950/95">
                    {r.hosname ? shortHosName(r.hosname) : r.hoscode}
                  </Td>
                  <Td>{formatBedCode(r.export_code)}</Td>
                  <Td>{r.bed_type_name ?? "-"}</Td>
                  <Td className="text-right tabular-nums">{fmtNumber(r.total_beds)}</Td>
                  <Td className="text-right tabular-nums">{fmtNumber(r.available_bed_days)}</Td>
                  <Td className="text-right tabular-nums">{fmtNumber(r.total_patient_days)}</Td>
                  <Td className="text-right tabular-nums">
                    {r.occupancy_rate_pct != null ? `${fmtNumber(r.occupancy_rate_pct, 2)}%` : "-"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
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
