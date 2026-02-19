import * as React from "react";
import MetricPage from "@/components/dashboard/MetricPage";
import YearSelect from "@/components/dashboard/YearSelect";
import { dbQuery } from "@/lib/db";
import WaitBedGrid from "./WaitBedGrid";

export const dynamic = "force-dynamic";

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

export default async function Page({
  searchParams,
}: {
  searchParams?: { year?: string; hos?: string } | Promise<{ year?: string; hos?: string }>;
}) {
  const sp = await Promise.resolve(searchParams ?? {});

  const years = await dbQuery<{ yr: number }>(
    `select distinct yr from public.transform_sync_critical_wait_bed order by yr desc;`,
  ).then((r) => r.map((x) => x.yr));

  const selectedYear =
    toInt(sp.year) ?? (years.length ? years[0] : new Date().getFullYear());

  const selectedHos = sp.hos?.trim() || undefined;

  const [rows, meta] = await Promise.all([
    dbQuery<WaitBedRow>(
      `
      select
        h.hoscode,
        h.hosname,
        h.hosname_short,
        s.yr,
        s.yr_be,
        s.total_cases,
        s.admitted_cases,
        s.refer_out_cases,
        s.avg_wait_min,
        s.avg_wait_hours,
        s.avg_admit_wait_min,
        s.avg_admit_wait_hr,
        s.avg_refer_wait_min,
        s.avg_refer_wait_hr,
        s.pct_over_4hr
      from public.c_hos h
      left join public.transform_sync_critical_wait_bed s
        on s.hoscode = h.hoscode and s.yr = $1
      where ($2::text is null or h.hoscode = $2)
      order by
        (s.total_cases is not null) desc,
        h.hosname asc nulls last;
      `,
      [selectedYear, selectedHos ?? null],
    ),
    dbQuery<{ row_count: number; last_update: string | null }>(
      `
      select
        (select count(*)::int from public.transform_sync_critical_wait_bed where yr = $1) as row_count,
        (select max(d_update)::text from public.transform_sync_critical_wait_bed where yr = $1) as last_update;
      `,
      [selectedYear],
    ).then((r) => r[0]),
  ]);

  return (
    <MetricPage
      title=""
      description="ระยะเวลาเฉลี่ยที่ผู้ป่วยวิกฤตรอเตียง ICU (แยก admit/refer out)"
      showTopCards={false}
      contentWidth="wide"
      titleClassName="hidden"
    >
      <div className="flex flex-wrap items-center justify-end gap-3">
        <YearSelect years={years} value={selectedYear} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-zinc-200/70 dark:ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/70 bg-white px-3 py-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-400">
          <div className="whitespace-nowrap">
            ปี: {selectedYear} • อัปเดตเมื่อ: {meta?.last_update ?? "-"}
          </div>
          <div className="whitespace-nowrap text-right">
            ข้อมูลจากตาราง: <span className="font-mono">transform_sync_critical_wait_bed</span>
          </div>
        </div>

        <WaitBedGrid rows={rows} />
      </div>
    </MetricPage>
  );
}

function toInt(v: string | undefined) {
  if (!v) return undefined;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}
